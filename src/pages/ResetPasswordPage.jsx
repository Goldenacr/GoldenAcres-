import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: 'Password is too short', description: 'Please use at least 6 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reset password', description: error.message });
        } else {
            toast({ title: 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <>
            <Helmet>
                <title>Reset Password - Golden Acres</title>
            </Helmet>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
                    <p className="text-muted-foreground">Update your account's password here.</p>
                </div>
                <form onSubmit={handlePasswordReset} className="space-y-4 max-w-sm">
                    <div>
                        <Label htmlFor="account">Account</Label>
                        <Input id="account" value={user?.email || ''} disabled className="bg-muted" />
                    </div>
                    <div className="relative">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="6 characters or more"
                            required
                            disabled={loading}
                        />
                         <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-[2.2rem] text-muted-foreground">
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <div className="relative">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your new password"
                            required
                            disabled={loading}
                        />
                         <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[2.2rem] text-muted-foreground">
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Reset Password
                    </Button>
                </form>
            </div>
        </>
    );
};

export default ResetPasswordPage;