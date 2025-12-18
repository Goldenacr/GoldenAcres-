
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldOff } from 'lucide-react';

const FarmersTab = ({ farmers, onVerify }) => {
    return (
        <>
            <h3 className="text-xl font-semibold mb-4">Farmer Verification</h3>
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Contact</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {farmers.map((farmer, index) => (
                                <motion.tr 
                                    key={farmer.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white hover:bg-gray-50/50"
                                >
                                    <td className="p-3 font-medium">
                                        {farmer.full_name && farmer.full_name !== 'N/A' ? farmer.full_name : <span className="text-gray-400 italic">Name Not Set</span>}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {farmer.phone_number || farmer.email || <span className="text-gray-400 text-xs">No contact info</span>}
                                    </td>
                                    <td className="p-3">
                                        {farmer.is_verified
                                            ? <span className="inline-flex items-center text-green-600"><ShieldCheck className="h-4 w-4 mr-1.5" />Verified</span>
                                            : <span className="inline-flex items-center text-orange-600"><ShieldOff className="h-4 w-4 mr-1.5" />Pending</span>}
                                    </td>
                                    <td className="p-3 text-right">
                                        {!farmer.is_verified && (
                                            <Button size="sm" onClick={() => onVerify(farmer.id)}>
                                                <ShieldCheck className="h-4 w-4 mr-2" />
                                                Verify Farmer
                                            </Button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {farmers.length === 0 && <p className="text-center text-muted-foreground py-8">No pending farmers found.</p>}
        </>
    );
};

export default FarmersTab;
