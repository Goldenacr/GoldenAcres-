
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Edit, Trash2, MapPin, ChevronDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import RegionSelectorDialog from '@/components/admin/RegionSelectorDialog';
import countryData from '@/lib/countryData.json';

const regions = countryData.regions || [];

const hubSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(3, "Name must be at least 3 characters long."),
  region: z.string().min(1, "Please select a region."),
  area: z.string().min(2, "Area is required."),
  address: z.string().min(5, "Address must be at least 5 characters long."),
  contact_person: z.string().min(3, "Contact person name is required."),
  contact_phone: z.string().min(10, "Phone number must be valid.").max(15, "Phone number is too long."),
  operating_hours: z.string().min(5, "Operating hours are required."),
});

const HubDialog = ({ isOpen, setIsOpen, hub, onSave, loading }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(hubSchema),
    defaultValues: hub || {
      name: '', region: '', area: '', address: '', contact_person: '', contact_phone: '', operating_hours: ''
    }
  });

  const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);
  const selectedRegion = watch('region');

  useEffect(() => {
    if (isOpen) {
      reset(hub || {
        name: '', region: '', area: '', address: '', contact_person: '', contact_phone: '', operating_hours: ''
      });
    }
  }, [isOpen, hub, reset]);

  const onSubmit = (data) => onSave(data);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{hub ? 'Edit Hub' : 'Add New Hub'}</DialogTitle>
          <DialogDescription>{hub ? 'Update the details of the pickup hub.' : 'Create a new pickup hub for customers.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <Input placeholder="Hub Name" {...register('name')} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRegionSelectorOpen(true)}
              className={`w-full justify-between ${errors.region ? 'border-red-500' : ''}`}
            >
              {selectedRegion || "Select Region"} <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>}
          </div>

          <RegionSelectorDialog
            isOpen={regionSelectorOpen}
            setIsOpen={setRegionSelectorOpen}
            currentValue={selectedRegion}
            onSelect={(region) => setValue('region', region, { shouldValidate: true })}
          />
          
          <Input placeholder="Area" {...register('area')} />
          {errors.area && <p className="text-red-500 text-sm">{errors.area.message}</p>}
          
          <Input placeholder="Hub Address" {...register('address')} />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}

          <Input placeholder="Contact Person" {...register('contact_person')} />
          {errors.contact_person && <p className="text-red-500 text-sm">{errors.contact_person.message}</p>}

          <Input type="tel" placeholder="Contact Number" {...register('contact_phone')} />
          {errors.contact_phone && <p className="text-red-500 text-sm">{errors.contact_phone.message}</p>}

          <Input placeholder="Operating Hours (e.g., 9am - 5pm)" {...register('operating_hours')} />
          {errors.operating_hours && <p className="text-red-500 text-sm">{errors.operating_hours.message}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Hub'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const HubCard = ({ hub, onEdit, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-4 rounded-lg shadow-sm border"
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-bold text-lg">{hub.name}</h3>
        <p className="text-sm text-muted-foreground">{hub.region} - {hub.area}</p>
        <p className="text-sm">{hub.address}</p>
      </div>
      <div className="flex space-x-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(hub)}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(hub)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    </div>
    <div className="mt-4 pt-4 border-t text-sm space-y-1">
      <p><strong>Contact:</strong> {hub.contact_person} ({hub.contact_phone})</p>
      <p><strong>Hours:</strong> {hub.operating_hours}</p>
    </div>
  </motion.div>
);

const AdminPickupHubsPage = () => {
    const { toast } = useToast();
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedHub, setSelectedHub] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchHubs = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('pickup_hubs').select('*').order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching hubs', description: error.message });
        } else {
            setHubs(data);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchHubs();
    }, [fetchHubs]);

    const handleSave = async (hubData) => {
        setFormLoading(true);
        const { id, ...upsertData } = hubData;

        let query = supabase.from('pickup_hubs');
        if (id) {
            query = query.update(upsertData).eq('id', id);
        } else {
            query = query.insert(upsertData);
        }

        const { error } = await query;
        if (error) {
            toast({ variant: 'destructive', title: 'Save failed', description: error.message });
        } else {
            toast({ title: `Hub ${id ? 'updated' : 'created'} successfully` });
            fetchHubs();
            setDialogOpen(false);
        }
        setFormLoading(false);
    };

    const handleEdit = (hub) => {
        setSelectedHub(hub);
        setDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedHub(null);
        setDialogOpen(true);
    };

    const confirmDelete = (hub) => {
        setItemToDelete(hub);
        setShowDeleteConfirm(true);
    };

    const executeDelete = async () => {
        if (!itemToDelete) return;

        const { error } = await supabase.from('pickup_hubs').delete().eq('id', itemToDelete.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
        } else {
            toast({ title: 'Hub deleted successfully' });
            fetchHubs();
        }
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    };

    return (
        <>
            <Helmet><title>Pickup Hubs - Admin</title></Helmet>
            <div className="p-4 md:p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Pickup Hubs</h1>
                    <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add Hub</Button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : hubs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hubs.map(hub => <HubCard key={hub.id} hub={hub} onEdit={handleEdit} onDelete={confirmDelete} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No pickup hubs created yet.</h3>
                        <p className="mt-1 text-sm text-gray-500">Click "Add Hub" to get started.</p>
                    </div>
                )}
            </div>

            <HubDialog 
                isOpen={dialogOpen} 
                setIsOpen={setDialogOpen} 
                hub={selectedHub}
                onSave={handleSave} 
                loading={formLoading} 
            />

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this hub?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the pickup hub.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AdminPickupHubsPage;
