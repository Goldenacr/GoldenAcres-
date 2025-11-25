
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Ban, Eye, Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
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
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Contact</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map((u, index) => (
                                <motion.tr 
                                    key={u.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white hover:bg-gray-50/50"
                                >
                                    <td className="p-3 font-medium">
                                        {u.full_name || u.email?.split('@')[0] || <span className="text-gray-400 italic">Unknown</span>}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{u.email || 'N/A'}</td>
                                    <td className="p-3">
                                        <Select onValueChange={(newRole) => onRoleUpdate(u.id, newRole)} value={u.role}>
                                            <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="customer">Customer</SelectItem>
                                                <SelectItem value="farmer">Farmer</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="p-3">
                                        {u.banned_until && new Date(u.banned_until) > new Date()
                                            ? <span className="inline-flex items-center text-red-600"><ShieldOff className="h-4 w-4 mr-1.5" />Banned</span>
                                            : <span className="inline-flex items-center text-green-600"><ShieldCheck className="h-4 w-4 mr-1.5" />Active</span>}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin-dashboard/users/${u.id}`)}><Eye className="h-4 w-4" /></Button>
                                        {currentUser.id !== u.id && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenBanModal(u)}><Ban className="h-4 w-4 text-orange-500" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(u)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                            </>
                                        )}
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
                                                
