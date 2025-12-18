
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Shield, Palette, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useBrowserNotification } from '@/hooks/useBrowserNotification';
import { TwoFactorAuthDialog } from '@/components/admin/TwoFactorAuthDialog';

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notify_new_orders: false,
    notify_farmer_verification: false,
  });
  const [loading, setLoading] = useState(true);
  const { requestPermission, permission } = useBrowserNotification();
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading2FAStatus, setLoading2FAStatus] = useState(true);

  const fetch2FAStatus = useCallback(async () => {
    setLoading2FAStatus(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data.totp && data.totp.length > 0) {
      // Check if any factor is verified
      const hasVerifiedFactor = data.totp.some(factor => factor.status === 'verified');
      setIs2FAEnabled(hasVerifiedFactor);
    } else {
      setIs2FAEnabled(false);
    }
    setLoading2FAStatus(false);
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let { data, error } = await supabase.from('admin_settings').select('*').eq('user_id', user.id).single();

    if (error && error.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase
        .from('admin_settings')
        .insert({ user_id: user.id, notify_new_orders: false, notify_farmer_verification: false })
        .select().single();
        
      if (insertError) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not initialize your settings.' });
      } else {
        setSettings(newData);
      }
    } else if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your settings.' });
    } else {
      setSettings(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchSettings();
    fetch2FAStatus();
  }, [fetchSettings, fetch2FAStatus]);

  const handleSettingChange = async (key, value) => {
    if (value && permission !== 'granted') {
        requestPermission();
    }

    const originalValue = settings[key];
    setSettings(prev => ({...prev, [key]: value}));

    const { error } = await supabase
        .from('admin_settings')
        .update({ [key]: value })
        .eq('user.id', user.id);

    if (error) {
        toast({ variant: "destructive", title: "Failed to update setting", description: error.message });
        setSettings(prev => ({...prev, [key]: originalValue}));
    } else {
        toast({
            title: "Settings Updated",
            description: `Notifications for ${key === 'notify_new_orders' ? 'new orders' : 'farmer verifications'} are now ${value ? 'ON' : 'OFF'}.`,
        });
    }
  };

  const handle2FAToggle = () => {
    if (!is2FAEnabled) {
      setShow2FADialog(true);
    } else {
      // Logic to disable 2FA
      const unenroll = async () => {
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError || !factors.totp || factors.totp.length === 0) {
          toast({variant: 'destructive', title: 'Error', description: 'No 2FA factor found to disable.'});
          return;
        }
        
        // Unenroll all verified factors to be safe
        let hasError = false;
        for (const factor of factors.totp) {
             const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
             if (error) hasError = true;
        }
        
        if (hasError) {
          toast({variant: 'destructive', title: 'Failed to disable 2FA', description: 'Could not unenroll all factors.'});
        } else {
          toast({title: 'Two-Factor Authentication has been disabled.'});
          setIs2FAEnabled(false);
        }
      };
      unenroll();
    }
  };

  const handleNotImplemented = () => {
    toast({
      title: "🚧 Feature Not Implemented",
      description: "This functionality is currently under development. You can request it in a future prompt!",
    });
  };

  return (
    <>
      <Helmet>
        <title>Admin Settings - Agribridge</title>
        <meta name="description" content="Manage administrative preferences for Agribridge." />
      </Helmet>

      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">Manage your administrative preferences.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Notifications</CardTitle><CardDescription>Manage how you receive administrative notifications.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            {loading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
              <>
                <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">New Orders</span>
                    <span className="text-sm text-muted-foreground">Receive a notification for every new order placed.</span>
                  </div>
                  <Switch id="new-order-notifications" checked={settings.notify_new_orders} onCheckedChange={(checked) => handleSettingChange('notify_new_orders', checked)} />
                </div>
                <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">Farmer Verification</span>
                    <span className="text-sm text-muted-foreground">Get notified when a new farmer needs verification.</span>
                  </div>
                  <Switch id="farmer-verification-notifications" checked={settings.notify_farmer_verification} onCheckedChange={(checked) => handleSettingChange('notify_farmer_verification', checked)} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle><CardDescription>Manage security settings for the admin panel.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg bg-slate-50">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">Two-Factor Authentication (2FA)</span>
                  <span className="text-sm text-muted-foreground">Require a code from your authenticator app to log in.</span>
                </div>
                {loading2FAStatus ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : <Switch id="mfa-admin" checked={is2FAEnabled} onCheckedChange={handle2FAToggle} />}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> Appearance</CardTitle><CardDescription>Customize the look and feel of the admin dashboard.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
               <div className="flex flex-col space-y-1"><span className="font-medium">Dark Mode</span><span className="text-sm text-muted-foreground">Enable dark mode for the admin dashboard.</span></div>
              <Switch id="dark-mode" onClick={handleNotImplemented} />
            </div>
          </CardContent>
        </Card>
      </div>

      <TwoFactorAuthDialog 
        isOpen={show2FADialog} 
        onOpenChange={setShow2FADialog}
        onSuccess={() => {
          setShow2FADialog(false);
          fetch2FAStatus();
        }}
      />
    </>
  );
};

export default AdminSettingsPage;
