import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSiteUrl(): string {
  // Check for explicit site URL first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL;
    return url.startsWith('http') ? url : `https://${url}`;
  }
  
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default to production URL if in production, otherwise localhost
  if (process.env.NODE_ENV === 'production') {
    return 'https://2x.ai';
  }
  
  return 'http://localhost:3000';
}

export function getClientSiteUrl(): string {
  // On client side, in production always use the production URL
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return 'https://2x.ai';
  }
  
  // On client side in development, use window location
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    return window.location.origin;
  }
  
  // Fallback to server-side utility
  return getSiteUrl();
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
