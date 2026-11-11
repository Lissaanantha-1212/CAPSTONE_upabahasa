// js/supabase-config.js

const supabaseUrl = 'https://aquqdodontgzjdfcvxgbs.supabase.co'; // Pastikan URL ini sesuai dengan dashboard Supabase kamu
const supabaseKey = 'sb_publishable_aaAmOWSAFRFfnXfPFqftQw_v948Hbr0';

// Inisialisasi koneksi global yang aman
window.supabaseClient = window.supabaseClient || window.supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase berhasil diinisialisasi!");