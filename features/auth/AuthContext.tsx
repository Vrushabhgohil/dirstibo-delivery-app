import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { DeliveryPersonProfile } from '@/types';

interface AuthContextType {
  deliveryPerson: DeliveryPersonProfile | null;
  loading: boolean;
  signIn: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@distribo_delivery_session';
const REMEMBER_ME_KEY = '@distribo_delivery_remember_me';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPersonProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        if (rememberMe === 'false') {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          if (isMounted) setLoading(false);
          return;
        }

        // 1. Check local session cache for fast startup
        const cached = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached) as DeliveryPersonProfile;
          setDeliveryPerson(parsed);
        }

        // 2. Validate with Supabase session or latest DB state
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email?.toLowerCase().trim();
          const { data: profile } = await supabase
            .from('delivery_person_profiles')
            .select('*')
            .or(`user_id.eq.${session.user.id},email.ilike.${email}`)
            .maybeSingle();

          if (profile && profile.status === 'active') {
            if (isMounted) {
              setDeliveryPerson(profile as DeliveryPersonProfile);
              await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            }
          } else if (profile && profile.status !== 'active') {
            await signOut();
          }
        }
      } catch (err) {
        console.warn('Delivery pilot session restoration notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    // Listen to Supabase Auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email?.toLowerCase().trim();
        const { data: profile } = await supabase
          .from('delivery_person_profiles')
          .select('*')
          .or(`user_id.eq.${session.user.id},email.ilike.${email}`)
          .maybeSingle();

        if (profile && profile.status === 'active') {
          setDeliveryPerson(profile as DeliveryPersonProfile);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        }
      } else if (event === 'SIGNED_OUT') {
        setDeliveryPerson(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    identifierInput: string,
    passwordInput: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanIdentifier = identifierInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    try {
      await AsyncStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');

      // 1. Check if user is a Sales Person trying to log into the Delivery app
      const { data: salesCheck } = await supabase
        .from('sales_person_profiles')
        .select('id, name')
        .or(`email.ilike.${cleanIdentifier},employee_id.ilike.${cleanIdentifier}`)
        .maybeSingle();

      if (salesCheck) {
        setLoading(false);
        return {
          success: false,
          error: 'Access Denied: This application is exclusively for delivery personnel. Sales representatives must use the Distribo Sales application.',
        };
      }

      // 2. Resolve the delivery person profile by email or employee ID
      let dpProfile: DeliveryPersonProfile | null = null;
      const { data: foundDp, error: dpLookupErr } = await supabase
        .from('delivery_person_profiles')
        .select('*')
        .or(`email.ilike.${cleanIdentifier},employee_id.ilike.${cleanIdentifier}`)
        .maybeSingle();

      if (dpLookupErr) {
        console.warn('DP lookup error:', dpLookupErr);
      }

      if (foundDp) {
        dpProfile = foundDp as DeliveryPersonProfile;
      }

      // Check account active status
      if (dpProfile && dpProfile.status !== 'active') {
        setLoading(false);
        return {
          success: false,
          error: 'Account Suspended: Your delivery pilot account is inactive. Please contact the warehouse dispatcher.',
        };
      }

      // 3. Try standard Supabase Auth signInWithPassword
      const targetEmail = dpProfile ? dpProfile.email : cleanIdentifier;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPassword,
      });

      if (!authError && authData.user) {
        if (!dpProfile) {
          // Check if profile exists for this authenticated user
          const { data: prof } = await supabase
            .from('delivery_person_profiles')
            .select('*')
            .or(`user_id.eq.${authData.user.id},email.ilike.${targetEmail}`)
            .maybeSingle();

          if (!prof) {
            await supabase.auth.signOut();
            setLoading(false);
            return {
              success: false,
              error: 'Access Denied: Your account does not have delivery pilot authorization.',
            };
          }
          dpProfile = prof as DeliveryPersonProfile;
        }

        // Link user_id if not linked yet
        if (!dpProfile.user_id && authData.user.id) {
          await supabase
            .from('delivery_person_profiles')
            .update({ user_id: authData.user.id, updated_at: new Date().toISOString() })
            .eq('id', dpProfile.id);
        }

        setDeliveryPerson(dpProfile);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dpProfile));
        setLoading(false);
        return { success: true };
      }

      // 4. Direct password fallback (if created by Admin in CRM before Supabase email confirmation)
      if (dpProfile && dpProfile.password && dpProfile.password === cleanPassword) {
        setDeliveryPerson(dpProfile);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dpProfile));
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return {
        success: false,
        error: authError?.message || 'Invalid email/employee ID or password. Please verify your credentials.',
      };
    } catch (err: any) {
      setLoading(false);
      return {
        success: false,
        error: err.message || 'Login failed. Please check your network connection.',
      };
    }
  };

  const resetPassword = async (
    emailInput: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    try {
      // Verify that this email is an active delivery pilot
      const { data: dp } = await supabase
        .from('delivery_person_profiles')
        .select('id, name')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!dp) {
        return {
          success: false,
          error: 'No active delivery pilot account found matching this email address.',
        };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'Password reset link sent to your registered email address. Please follow the instructions.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to request password reset.',
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    } finally {
      setDeliveryPerson(null);
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!deliveryPerson?.id) return;
    try {
      const { data } = await supabase
        .from('delivery_person_profiles')
        .select('*')
        .eq('id', deliveryPerson.id)
        .maybeSingle();

      if (data) {
        setDeliveryPerson(data as DeliveryPersonProfile);
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Error refreshing profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        deliveryPerson,
        loading,
        signIn,
        resetPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

