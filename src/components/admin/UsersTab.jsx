
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Ban, Eye, Trash2, ShieldCheck, ShieldOff, Phone, Mail, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsersTab = ({ users, currentUser, onRoleUpdate, onBan, onDelete }) => {
    const navigate = useNavigate();
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [banDuration, setBanDuration] = useState('7');
    const [userToManage, setUserToManage] = useState(null);

    const handleOpenBanModal = (user) => {
        setUserToManage(user);
        setIsBanModalOpen(true);
    };
    
    const handleBanConfirm = () => {
        onBan(userToManage, banDuration);
        setIsBanModalOpen(false);
    };

    return (
        <>
            <h3 className="text-xl font-semibold mb-4">User Management</h3>
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50/80 backdrop-blur">
                            <tr>
                                <th className="p-4 text-left font-semibold text-gray-600">User Profile</th>
                                <th className="p-4 text-left font-semibold text-gray-600">Contact Details</th>
                                <th className="p-4 text-left font-semibold text-gray-600">Role</th>
                                <th className="p-4 text-left font-semibold text-gray-600">Status</th>
                                <th className="p-4 text-right font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((u, index) => (
                                <motion.tr 
                                    key={u.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="group hover:bg-gray-50 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 text-base">
                                                {u.full_name && u.full_name !== 'N/A' ? u.full_name : (u.email?.split('@')[0] || 'Unknown')}
                                            </span>
                                            <span className="text-xs text-gray-500">ID: {u.id.slice(0, 8)}...</span>
                                            <span className="text-xs text-gray-400 mt-1">Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col space-y-1.5">
                                            <div className="flex items-center text-gray-600">
                                                <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                                {u.email || 'No Email'}
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <Phone className="w-3 h-3 mr-2 text-gray-400" />
                                                {u.phone_number ? u.phone_number : <span className="text-gray-400 italic text-xs">No Phone</span>}
                                            </div>
                                            {u.country && (
                                                <div className="flex items-center text-xs text-gray-500">
                                                   <MapPin className="w-3 h-3 mr-2 text-gray-400" />
                                                   {u.country}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Select onValueChange={(newRole) => onRoleUpdate(u.id, newRole)} value={u.role}>
                                            <SelectTrigger className="w-[130px] h-8 text-xs border-gray-200 bg-white"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="customer">Customer</SelectItem>
                                                <SelectItem value="farmer">Farmer</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="p-4">
                                        {u.banned_until && new Date(u.banned_until) > new Date()
                                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><ShieldOff className="h-3 w-3 mr-1" /> Banned</span>
                                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><ShieldCheck className="h-3 w-3 mr-1" /> Active</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin-dashboard/users/${u.id}`)} title="View Details">
                                                <Eye className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            {currentUser.id !== u.id && (
                                                <>
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenBanModal(u)} title="Suspend User">
                                                        <Ban className="h-4 w-4 text-orange-500" />
                                                    </Button>
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onDelete(u)} title="Delete User">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {users.length === 0 && <p className="text-center text-muted-foreground py-8">No users found.</p>}

            <Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage User: {userToManage?.full_name || 'Unknown'}</DialogTitle>
                        <DialogDescription>Restrict or ban this user from accessing the platform.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select onValueChange={setBanDuration} defaultValue={banDuration}>
                            <SelectTrigger><SelectValue placeholder="Select ban duration" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Day</SelectItem>
                                <SelectItem value="7">7 Days</SelectItem>
                                <SelectItem value="30">30 Days</SelectItem>
                                <SelectItem value="permanent">Permanent</SelectItem>
                                <SelectItem value="unban">Unban</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBanModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleBanConfirm} className={banDuration === 'unban' ? '' : 'bg-destructive hover:bg-destructive/90'}>
                            {banDuration === 'unban' ? 'Update Status' : 'Apply Ban'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UsersTab;
