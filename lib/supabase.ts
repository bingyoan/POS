import { createClient } from '@supabase/supabase-js';

// --- 這裡直接填入你的 Supabase 網址和 Key (不要用 getEnvVar) ---

const supabaseUrl = 'https://ggsrdallyybowygbdrde.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnc3JkYWxseXlib3d5Z2JkcmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MTQ4ODgsImV4cCI6MjA4MjI5MDg4OH0.yb-lFzA7CuEdg2Wszdl82DPHKDDsp24vmrqEpnQWv1w';

// -----------------------------------------------------------

// 建立並匯出 Supabase 客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
