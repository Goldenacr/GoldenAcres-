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

        // Fallback logic to ensure profile object exists, even temporarily
        if (!profileData) {
             const meta = currentUser.user_metadata || {};
             
             let fallbackName = meta.full_name;
             if (!fallbackName && meta.first_name) {
                 fallbackName = `${meta.first_name} ${meta.last_name || ''}`.trim();
             }
             if (!fallbackName && currentUser.email) {
                 fallbackName = currentUser.email.split('@')[0];
             }
             
             // Create temporary profile object for immediate use in the UI
             setProfile({
                 id: currentUser.id,
                 full_name: fallbackName || 'Valued Member',
                 email: currentUser.email,
                 role: meta.role || 'customer',
                 avatar_url: meta.avatar_url,
                 banned_until: null
             });
        }
    } else {
        setProfile(null);
    }
    
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await handleSession(currentSession);
      } catch (error) {
        console.error("Auth Session Error:", error);
        // If refresh token is invalid, force sign out to clear storage to prevent crash loops
        if (error.message && (error.message.includes("Refresh Token Not Found") || error.message.includes("json"))) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
             await handleSession(newSession);
        } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setProfile(null);
        }
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