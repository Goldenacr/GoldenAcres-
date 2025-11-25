
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Ban } from 'lucide-react';

const AuthContext = createContext(undefined);

const BannedScreen = ({ bannedUntil }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const banEnd = new Date(bannedUntil);
            const diff = banEnd.getTime() - now.getTime();
            
            if (diff <= 0) {
                setTimeLeft("Your ban should now be lifted. Please refresh the page.");
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [bannedUntil]);

    return (
        <div className="fixed inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center z-[200]">
            <div className="text-center text-white p-8 max-w-lg">
                <Ban className="w-24 h-24 mx-auto mb-4 text-red-300"/>
                <h1 className="text-4xl font-bold mb-4">Account Suspended</h1>
                <p className="text-lg mb-2">Your account has been temporarily suspended due to a violation of our terms of service.</p>
                {new Date(bannedUntil).getFullYear() > 9000 ? (
                    <p className="text-xl font-bold text-red-200">This ban is permanent.</p>
                ) : (
                    <p className="text-lg">Your access will be restored in: <br/><strong className="text-2xl font-mono mt-2 block">{timeLeft}</strong></p>
                )}
            </div>
        </div>
    );
};

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const isBanned = profile?.banned_until && new Date(profile.banned_until) > new Date();

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
      if (error) throw error;
      setProfile(profileData);
      return profileData;
    } catch (error) {
        // console.error("Error fetching profile:", error); // Suppress error logs for clean console on new users
        return null;
    }
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);
    
    if (currentUser) {
        let profileData = await fetchProfile(currentUser.id);

        // FIX: Fallback logic to ensure full_name is never "N/A" or null in the UI context
        // This fixes issues where "My Name: N/A" appears in verification messages
        if (!profileData || !profileData.full_name || profileData.full_name === 'N/A') {
             const meta = currentUser.user_metadata || {};
             
             // Try to construct name from metadata, or use email prefix
             let fallbackName = meta.full_name;
             if (!fallbackName && meta.first_name) {
                 fallbackName = `${meta.first_name} ${meta.last_name || ''}`.trim();
             }
             if (!fallbackName && currentUser.email) {
                 fallbackName = currentUser.email.split('@')[0];
             }
             
             // If we have a profile but name is missing/bad, patch it in memory
             if (profileData) {
                 const patchedProfile = { 
                     ...profileData, 
                     full_name: fallbackName || 'Valued Member' 
                 };
                 setProfile(patchedProfile);
             } else {
                 // If profile is completely missing (e.g. trigger failure), create temporary profile object
                 setProfile({
                     id: currentUser.id,
                     full_name: fallbackName || 'Valued Member',
                     email: currentUser.email,
                     role: meta.role || 'customer',
                     avatar_url: meta.avatar_url,
                     banned_until: null
                 });
             }
        }
    } else {
        setProfile(null);
    }
    
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await handleSession(currentSession);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        await handleSession(newSession);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);
  
  const signInWithGoogle = useCallback(async () => {
    const redirectUrl = window.location.origin; 
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl, 
        queryParams: {
           access_type: 'offline',
           prompt: 'consent',
        },
      },
    });

    if (error) {
        console.error("Google Sign-In Error:", error);
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: error.message || "Something went wrong.",
        });
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    isBanned,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    fetchProfile,
  }), [user, session, profile, loading, isBanned, signUp, signIn, signOut, signInWithGoogle, fetchProfile]);

  return (
      <AuthContext.Provider value={value}>
        {isBanned && <BannedScreen bannedUntil={profile.banned_until} />}
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
            
