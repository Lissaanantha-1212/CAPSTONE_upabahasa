// js/supabase-config.js

// URL dan API Key Supabase milik UPA Bahasa POLNES
const supabaseUrl = 'https://aquqdodontgzjdfcvxgbs.supabase.co';
const supabaseKey = 'sb_publishable_aaAmOWSAFRFfnXfPFqftQw_v948Hbr0';

// Inisialisasi koneksi global yang aman (mencegah redeclare error)
window.supabaseClient = window.supabaseClient || window.supabase.createClient(supabaseUrl, supabaseKey);

// Log untuk memastikan sukses terkoneksi
console.log("Supabase berhasil diinisialisasi!");