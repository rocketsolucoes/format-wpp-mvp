import React, { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';
import { toast } from './ui/Toaster';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          toast.error('Authentication error');
          setLocation('/auth');
          return;
        }

        if (!session) {
          toast.error('Please sign in to continue');
          setLocation('/auth');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast.error('Failed to verify access permissions');
          setLocation('/dashboard');
          return;
        }

        if (!profile || !profile.is_admin) {
          toast.error('Access denied. Admin only.');
          setLocation('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error('Error in admin check:', err);
        toast.error('An error occurred. Please try again.');
        setLocation('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
