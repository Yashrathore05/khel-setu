import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vspylpttdhwvoxprtwdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcHlscHR0ZGh3dm94cHJ0d2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTM1MjMsImV4cCI6MjA3NDEyOTUyM30.mG-3iYYfAKVMZFTulz-uhweAOz5uZ4R9DxqnoQAJA34';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
