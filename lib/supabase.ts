
import { createClient } from '@supabase/supabase-js';

// Safely retrieve environment variables to prevent runtime errors
const getEnvVar = (key: string): string | undefined => {
  try {
    // Check import.meta.env (Standard Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors
  }
  
  try {
    // Check process.env (Legacy/Webpack/Node-shim)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Ignore reference errors if process is not defined
  }
  
  return undefined;
};

const supabaseUrl = getEnvVar('https://ggsrdallyybowygbdrde.supabase.co');
const supabaseAnonKey = getEnvVar('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnc3JkYWxseXlib3d5Z2JkcmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MTQ4ODgsImV4cCI6MjA4MjI5MDg4OH0.yb-lFzA7CuEdg2Wszdl82DPHKDDsp24vmrqEpnQWv1w');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Please check your environment variables.');
}

// Initialize with placeholders if missing to prevent app crash on load
// Requests will fail gracefully later if keys are invalid
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
