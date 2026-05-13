"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !email.includes("@")) {
    redirect("/login?error=Invalid email or password format");
  }

  const supabase = await createClient();

  const data = {
    email: email,
    password: password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect("/login?error=Could not authenticate user");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !email.includes("@") || password.length < 6) {
    redirect("/signup?error=Invalid email or password (min 6 chars)");
  }

  const supabase = await createClient();

  const data = {
    email: email,
    password: password,
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  
  if (authData?.user && authData?.session === null) {
    redirect("/login?message=Check your email to confirm your account.");
  } else {
    redirect("/dashboard");
  }
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    redirect("/login/forgot-password?error=Invalid email format");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/login/reset-password`,
  });

  if (error) {
    redirect(`/login/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login/forgot-password?message=Check your email for the reset link.");
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    redirect("/login/reset-password?error=Password must be at least 6 characters");
  }

  if (password !== confirmPassword) {
    redirect("/login/reset-password?error=Passwords do not match");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/login/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Password updated successfully. You can now sign in.");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
