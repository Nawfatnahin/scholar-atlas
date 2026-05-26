"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { ADMIN_EMAILS, PRO_EMAILS } from "@/lib/constants";

interface SubscriptionContextType {
  user: User | null;
  isPro: boolean;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  supabase: ReturnType<typeof createClient>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  user: null,
  isPro: false,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
  supabase: {} as ReturnType<typeof createClient>, 
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = useMemo(() => createClient(), []);

  const fetchSubscription = useCallback(async (currentUser: User | null, isMounted: { current: boolean }) => {
    if (!currentUser) {
      setIsPro(false);
      setIsAdmin(false);
      if (isMounted.current) setLoading(false);
      return;
    }
    
    // Set admin status immediately so the UI doesn't wait for DB if there's network latency
    const adminCheck = currentUser.email ? ADMIN_EMAILS.includes(currentUser.email) : false;
    const proCheck = currentUser.email ? PRO_EMAILS.includes(currentUser.email) : false;
    
    if (adminCheck && isMounted.current) {
      setIsAdmin(true);
      setIsPro(true);
    } else if (proCheck && isMounted.current) {
      setIsPro(true);
    }
    
    // Check if we already have this user's data to avoid redundant fetches
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle();
      
      if (error) {
        console.warn('Subscription fetch error:', error.message);
      }
      
      let hasProPlan = data?.plan === 'pro';
      if (hasProPlan && data?.premium_until) {
        const isExpired = new Date(data.premium_until) < new Date();
        if (isExpired) {
          hasProPlan = false;
        }
      }
      
      if (isMounted.current) {
        setIsAdmin(prev => prev === adminCheck ? prev : adminCheck);
        setIsPro(prev => prev === (hasProPlan || adminCheck) ? prev : (hasProPlan || adminCheck));
      }
    } catch (err) {
      console.error('Subscription system error:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [supabase]);

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);
      await fetchSubscription(currentUser, { current: true });
    } catch (err) {
      console.error('Refresh error:', err);
      setLoading(false);
    }
  }, [supabase, fetchSubscription]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsPro(false);
      setIsAdmin(false);
      setLoading(false);
      window.location.href = "/";
    }
  }, [supabase]);

  useEffect(() => {
    const mounted = { current: true };

    // Safety timeout: Never stay in loading state more than 1.5 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted.current && loading) {
        console.warn('Auth safety timeout reached');
        setLoading(false);
      }
    }, 1500);

    const applyUserTheme = (theme: string | undefined) => {
      if (theme === 'dark' || theme === 'light') {
        document.documentElement.classList.add("no-transition");
        if (theme === 'dark') {
          document.documentElement.classList.add("dark");
          localStorage.setItem("scholar-atlas-theme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("scholar-atlas-theme", "light");
        }
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("no-transition");
        });
      }
    };

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session fetch error:", error);
          if (mounted.current) setLoading(false);
          return;
        }

        const currentUser = session?.user || null;
        
        if (mounted.current) {
          setUser(currentUser);
          if (currentUser) {
            applyUserTheme(currentUser.user_metadata?.theme);
            await fetchSubscription(currentUser, mounted);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
        if (mounted.current) setLoading(false);
      }
    };

    // Explicitly initialize session
    initSession();

    // Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log(`Supabase Auth Event: ${event}`, session?.user?.email);
      
      const currentUser = session?.user || null;
      
      setUser(prevUser => {
        // If it's a USER_UPDATED event, always return the new user object to ensure metadata changes trigger a re-render
        if (event === 'USER_UPDATED') {
          return currentUser;
        }
        
        if (prevUser?.id === currentUser?.id && prevUser?.email === currentUser?.email) {
          return prevUser;
        }
        return currentUser;
      });
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (currentUser) {
          applyUserTheme(currentUser.user_metadata?.theme);
        }
        await fetchSubscription(currentUser, mounted);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsPro(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, fetchSubscription]);


  return (
    <SubscriptionContext.Provider value={{ user, isPro, isAdmin, loading, refresh, logout, supabase }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
