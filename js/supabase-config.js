// js/supabase-config.js

const supabaseUrl = 'https://aquqdodontgzjdfcvxgbs.supabase.co';
const supabaseKey = 'sb_publishable_aaAmOWSAFRFfnXfPFqftQw_v948Hbr0';

// Inisialisasi koneksi global
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase berhasil diinisialisasi!");