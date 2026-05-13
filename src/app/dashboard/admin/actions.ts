'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ADMIN_EMAILS } from "@/lib/constants";

export async function getSubscription(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error);
    return null;
  }
  
  return data;
}

export async function getAllSubscriptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all subscriptions:', error);
    return [];
  }
  
  return data;
}

export async function toggleProStatus(email: string, isPro: boolean, durationMonths?: number | null) {
  const supabase = await createClient();
  
  // Verify requester is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error('Unauthorized');
  }

  let premium_until = null;
  if (isPro && durationMonths) {
    const d = new Date();
    d.setMonth(d.getMonth() + durationMonths);
    premium_until = d.toISOString();
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert({ 
      email: email.toLowerCase(), 
      plan: isPro ? 'pro' : 'free',
      premium_until: premium_until,
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

  if (error) {
    console.error('Error toggling pro status:', error);
    throw error;
  }
  
  revalidatePath('/dashboard/admin');
}

export async function deleteSubscription(email: string) {
  try {
    const supabase = await createClient();
    
    // Verify requester is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return { success: false, error: 'Unauthorized user' };
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error deleting subscription:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/admin');
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}
