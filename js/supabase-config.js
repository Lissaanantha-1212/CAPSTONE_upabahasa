// js/supabase-config.js

// Ganti URL dan KEY di bawah ini dengan milikmu dari setting Supabase
const supabaseUrl = 'https://aquqdodontgzjdfcvxgbs.supabase.co';
const supabaseKey = 'sb_publishable_aaAmOWSAFRFfnXfPFqftQw_v948Hbr0'; 

// Inisialisasi koneksi
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Log untuk memastikan sukses terkoneksi
console.log("Supabase berhasil diinisialisasi!");