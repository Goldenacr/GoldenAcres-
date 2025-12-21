import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Globe, Plus, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import countryData from '@/lib/countryData.json';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AdminCountriesPage = () => {
    const { toast } = useToast();
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    const fetchAllowedCountries = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('allowed_farmer_countries').select('*');
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            setCountries(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAllowedCountries();
    }, []);

    const handleAddCountry = async () => {
        if (!selectedCountry) return;
        
        const { error } = await supabase
            .from('allowed_farmer_countries')
            .insert({ country_name: selectedCountry });

        if (error) {
            if (error.code === '23505') {
                toast({ variant: 'destructive', title: 'Duplicate', description: 'Country is already on the list.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        } else {
            toast({ title: 'Success', description: `${selectedCountry} added to allowed list.` });
            setSelectedCountry('');
            setSearchTerm(''); // Clear search after adding
            fetchAllowedCountries();
        }
    };

    const handleDeleteCountry = async (name) => {
        const { error } = await supabase
            .from('allowed_farmer_countries')
            .delete()
            .eq('country_name', name);

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Removed', description: `${name} removed from allowed list.` });
            fetchAllowedCountries();
        }
    };

    // Filter available countries based on search
    const availableCountries = countryData.countries
        .filter(c => !countries.some(existing => existing.country_name === c.name))
        .filter(c => searchTerm === '' || 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a,b) => a.name.localeCompare(b.name));

    return (
        <>
            <Helmet><title>Allowed Farmer Countries - Admin</title></Helmet>
            <div className="space-y-6 py-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Allowed Farmer Countries</h1>
                    <p className="text-muted-foreground">Manage which countries are permitted for farmer registration.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Allowed Country</CardTitle>
                            <CardDescription>Select a country to allow farmers to register from.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search input for filtering countries */}
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search countries..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            
                            <div className="flex gap-4">
                                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select country..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] overflow-y-auto">
                                        {availableCountries.length === 0 ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                {searchTerm ? 'No countries found' : 'No countries available'}
                                            </div>
                                        ) : (
                                            availableCountries.map(c => (
                                                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddCountry} disabled={!selectedCountry}>
                                    <Plus className="w-4 h-4 mr-2" /> Add
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Current List</CardTitle>
                            <CardDescription className="text-sm">
                                {countries.length} country{countries.length !== 1 ? 's' : ''} allowed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Country Name</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-8">
                                                    <div className="flex items-center justify-center">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                                                        Loading...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : countries.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                                    No countries set. Add your first country above.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            countries.map((country) => (
                                                <TableRow key={country.country_name}>
                                                    <TableCell className="font-medium flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-blue-500"/> {country.country_name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeleteCountry(country.country_name)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default AdminCountriesPage;
