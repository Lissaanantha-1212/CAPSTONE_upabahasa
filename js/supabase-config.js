// js/supabase-config.js

const SUPABASE_URL = 'https://aquqdodontgzjdfcvxgbs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aaAmOWSAFRFfnXfPFqftQw_v948Hbr0';

// Inisialisasi global aman
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase berhasil diinisialisasi!");