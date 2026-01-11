import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type UserRole = 'admin' | 'guru' | 'siswa';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole, metadata?: { jurusan?: string; angkatan?: number }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data?.role as UserRole;
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            const profileData = await fetchUserProfile(session.user.id);
            setUserRole(role);
            setProfile(profileData);
            setLoading(false);
          }, 0);
        } else {
          setUserRole(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        Promise.all([
          fetchUserRole(session.user.id),
          fetchUserProfile(session.user.id)
        ]).then(([role, profileData]) => {
          setUserRole(role);
          setProfile(profileData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    metadata?: { jurusan?: string; angkatan?: number }
  ) => {
    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role, // Menyimpan role di metadata untuk referensi
          ...metadata,
        },
      },
    });

    if (error) {
      return { error };
    }

    // If signup successful and user exists, update profile and role
    if (data.user) {
      // Update profile with additional metadata
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          jurusan: (metadata?.jurusan as 'trkj' | 'ti' | 'trmm') || null,
          angkatan: metadata?.angkatan || null,
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      // Update role if not 'siswa' (default dari trigger adalah 'siswa')
      if (role !== 'siswa') {
        // Coba update langsung terlebih dahulu
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: role })
          .eq('user_id', data.user.id);

        // Jika gagal karena RLS, gunakan RPC function
        if (roleError) {
          console.log('Direct update failed, trying RPC function...', roleError);
          const { error: rpcError } = await supabase
            .rpc('set_user_role', { 
              p_user_id: data.user.id, 
              p_role: role 
            });
          
          if (rpcError) {
            console.error('Error updating role via RPC:', rpcError);
          }
        }
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
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