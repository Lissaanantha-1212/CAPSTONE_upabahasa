// ============================================================================
// MODUL REKAPAN INDUK MAHASISWA & SERTIFIKAT RESMI (UPA BAHASA POLNES)
// Terkoneksi ke: arsip_master_rekapan, Rekapan, HasilTes, dan Mahasiswa
// Dinamis untuk seluruh angkatan (2020, 2021, 2022, 2023, 2024, dst.)
// ============================================================================

const rekapanState = {
  semuaData: [],
  dataTersaring: [],
  tabAngkatanAktif: "SEMUA",
  halamanSaatIni: 1,
  perHalaman: 25,
  mahasiswaDetailAktif: null,
  kolomTabelMaster: null
};

function getDbClientRekapan() {
  return window.supabaseClient || window.supabase || null;
}

// ==================== PEMETAAN SENSITIF 10 JURUSAN & 26 PRODI POLNES ====================
const DAFTAR_JURUSAN_PRODI_POLNES = [
  {
    jurusan: "AKUNTANSI",
    prodi: [
      { nama: "D3 - AKUNTANSI", kataKunci: ["D3 - AKUNTANSI", "D3 AKUNTANSI"] },
      { nama: "D4 - AKUNTANSI MANAJERIAL", kataKunci: ["AKUNTANSI MANAJERIAL"] },
      { nama: "D4 - KEUANGAN PERBANKAN", kataKunci: ["KEUANGAN PERBANKAN"] }
    ]
  },
  {
    jurusan: "ADMINISTRASI BISNIS",
    prodi: [
      { nama: "D4 - MANAJEMEN PEMASARAN", kataKunci: ["MANAJEMEN PEMASARAN"] },
      { nama: "D4 - BISNIS DIGITAL", kataKunci: ["BISNIS DIGITAL"] },
      { nama: "D3 - ADMINISTRASI BISNIS", kataKunci: ["ADMINISTRASI BISNIS"] }
    ]
  },
  {
    jurusan: "KEMARITIMAN",
    prodi: [
      { nama: "D3 - KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN", kataKunci: ["KETATALAKSANAAN PELAYARAN", "KPNK", "NIAGA KEPELABUHAN"] },
      { nama: "D3 - TEKNIKA", kataKunci: ["TEKNIKA"] },
      { nama: "D3 - NAUTIKA", kataKunci: ["NAUTIKA"] }
    ]
  },
  {
    jurusan: "PARIWISATA",
    prodi: [
      { nama: "D3 - PARIWISATA", kataKunci: ["D3 - PARIWISATA", "D3 PARIWISATA"] },
      { nama: "D4 - USAHA PERJALANAN WISATA", kataKunci: ["USAHA PERJALANAN WISATA", "UPW"] },
      { nama: "D4 - PENGELOLAAN PERHOTELAN", kataKunci: ["PERHOTELAN"] }
    ]
  },
  {
    jurusan: "TEKNOLOGI INFORMASI",
    prodi: [
      { nama: "D3 - TEKNIK INFORMATIKA", kataKunci: ["D3 - TEKNIK INFORMATIKA", "D3 TEKNIK INFORMATIKA"] },
      { nama: "D3 - TEKNIK KOMPUTER", kataKunci: ["D3 - TEKNIK KOMPUTER", "D3 TEKNIK KOMPUTER"] },
      { nama: "D4 - TEKNIK INFORMATIKA MULTIMEDIA", kataKunci: ["INFORMATIKA MULTIMEDIA", "TIM"] },
      { nama: "D4 - TEKNOLOGI REKAYASA KOMPUTER", kataKunci: ["TEKNOLOGI REKAYASA KOMPUTER", "TRK"] }
    ]
  },
  {
    jurusan: "DESAIN",
    prodi: [
      { nama: "D4 - DESAIN PRODUK KAYU DAN SERAT", kataKunci: ["DESAIN PRODUK KAYU", "KAYU DAN SERAT"] },
      { nama: "D4 - ARSITEKTUR BANGUNAN GEDUNG", kataKunci: ["ARSITEKTUR BANGUNAN GEDUNG"] }
    ]
  },
  {
    jurusan: "TEKNIK KIMIA",
    prodi: [
      { nama: "D3 - PETRO DAN OLEO KIMIA", kataKunci: ["PETRO DAN OLEO KIMIA", "PETRO"] },
      { nama: "D4 - TEKNOLOGI KIMIA INDUSTRI", kataKunci: ["TEKNOLOGI KIMIA INDUSTRI", "KIMIA INDUSTRI"] }
    ]
  },
  {
    jurusan: "TEKNIK SIPIL",
    prodi: [
      { nama: "D4 - TEKNOLOGI REKAYASA KONSTRUKSI BANGUNAN GEDUNG", kataKunci: ["REKAYASA KONSTRUKSI BANGUNAN GEDUNG", "TRKBG"] },
      { nama: "D4 - REKAYASA JALAN DAN JEMBATAN", kataKunci: ["REKAYASA JALAN DAN JEMBATAN", "JALAN DAN JEMBATAN"] },
      { nama: "D4 - REKAYASA KONSTRUKSI BANGUNAN AIR", kataKunci: ["REKAYASA KONSTRUKSI BANGUNAN AIR", "BANGUNAN AIR"] },
      { nama: "D3 - TEKNIK SIPIL", kataKunci: ["TEKNIK SIPIL"] }
    ]
  },
  {
    jurusan: "TEKNIK MESIN",
    prodi: [
      { nama: "D3 - PERAWATAN DAN PERBAIKAN MESIN", kataKunci: ["PERAWATAN DAN PERBAIKAN MESIN"] },
      { nama: "D3 - TEKNIK ALAT BERAT", kataKunci: ["TEKNIK ALAT BERAT", "ALAT BERAT"] },
      { nama: "D4 - TEKNIK MESIN PRODUKSI DAN PERAWATAN", kataKunci: ["TEKNIK MESIN PRODUKSI", "PRODUKSI DAN PERAWATAN"] }
    ]
  },
  {
    jurusan: "TEKNIK ELEKTRO",
    prodi: [
      { nama: "D3 - TEKNIK LISTRIK", kataKunci: ["D3 - TEKNIK LISTRIK", "D3 TEKNIK LISTRIK", "D3 - TEKNIK ELEKTRO", "D3 TEKNIK ELEKTRO"] },
      { nama: "D4 - TEKNIK LISTRIK", kataKunci: ["D4 - TEKNIK LISTRIK", "D4 TEKNIK LISTRIK", "D4 - TEKNI LISTRIK", "D4 - TEKNIK ELEKTRO"] }
    ]
  }
];

const KOLOM_SKOR_INTEGER = new Set([
  "tahun_angkatan",
  "angkatan",
  "skor_sspect",
  "nilai_sspect",
  "skor_latihan",
  "nilai_latihan",
  "skor_toefl",
  "nilai_toefl",
  "remedial_1",
  "remedial_2",
  "remedial_3",
  "listening",
  "structure",
  "reading",
  "sspect_listening",
  "sspect_structure",
  "sspect_reading"
]);

function deteksiJurusanDariProdiSensitif(prodiRaw, jurusanFallback = "-") {
  const teks = String(prodiRaw || "").trim().toUpperCase().replace(/\s+/g, " ");
  if (!teks || teks === "-") {
    return {
      jurusan: String(jurusanFallback || "-").toUpperCase(),
      prodi: "-",
      jenjang: "D3"
    };
  }

  for (const kelompok of DAFTAR_JURUSAN_PRODI_POLNES) {
    for (const item of kelompok.prodi) {
      for (const kw of item.kataKunci) {
        if (teks.includes(kw)) {
          const jenjang = item.nama.startsWith("D4") || teks.includes("D4") ? "D4" : "D3";
          return {
            jurusan: kelompok.jurusan,
            prodi: item.nama,
            jenjang
          };
        }
      }
    }
  }

  for (const kelompok of DAFTAR_JURUSAN_PRODI_POLNES) {
    for (const item of kelompok.prodi) {
      const namaTanpaJenjang = item.nama.replace(/^D[34]\s*-\s*/, "");
      if (teks.includes(namaTanpaJenjang)) {
        const jenjang = item.nama.startsWith("D4") || teks.includes("D4") ? "D4" : "D3";
        return {
          jurusan: kelompok.jurusan,
          prodi: item.nama,
          jenjang
        };
      }
    }
  }

  return {
    jurusan: String(jurusanFallback || "-").toUpperCase(),
    prodi: teks,
    jenjang: teks.includes("D4") ? "D4" : "D3"
  };
}

function ambilNilaiKolom(obj, daftarKey, fallback = null) {
  if (!obj) return fallback;
  for (const key of daftarKey) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "" && String(obj[key]).trim().toUpperCase() !== "NULL") {
      return obj[key];
    }
  }
  return fallback;
}

function ambilAngkaKolom(obj, daftarKey) {
  const raw = ambilNilaiKolom(obj, daftarKey, null);
  if (raw === null) return null;
  const bersih = String(raw).replace(",", ".").trim();
  const num = Number(bersih);
  return !isNaN(num) && num > 0 ? Math.round(num) : null;
}

// ==================== DETEKSI TAHUN ANGKATAN DINAMIS DARI 2 DIGIT AWAL NIM ====================
function ekstrakAngkatanNim(nimRaw, fallback = null) {
  const clean = String(nimRaw || "").replace(/\D/g, "");
  if (clean.length >= 2) {
    const duaDigit = parseInt(clean.substring(0, 2), 10);
    if (!isNaN(duaDigit) && duaDigit >= 0 && duaDigit <= 99) {
      return 2000 + duaDigit;
    }
  }
  if (fallback !== null && fallback !== undefined && String(fallback).trim() !== "") {
    const thn = parseInt(String(fallback).replace(/\D/g, ""), 10);
    if (!isNaN(thn) && thn > 0) {
      return thn < 100 ? 2000 + thn : thn;
    }
  }
  return new Date().getFullYear();
}

function normalisasiNamaPencocokan(namaRaw) {
  return String(namaRaw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBatasLulusJenjang(prodi, jenjangRaw) {
  const gabungan = `${jenjangRaw || ""} ${prodi || ""}`.toUpperCase();
  if (gabungan.includes("D4") || gabungan.includes("SARJANA TERAPAN")) return 450;
  return 400;
}

function hitungSkorToeflTertinggi(m) {
  const daftar = [m.remedial_3, m.remedial_2, m.remedial_1, m.skor_toefl]
    .map(v => Number(v))
    .filter(v => !isNaN(v) && v > 0);
  return daftar.length > 0 ? Math.round(Math.max(...daftar)) : null;
}

function cekStatusKelulusan(m) {
  const batas = getBatasLulusJenjang(m.program_studi, m.jenjang);
  const tertinggi = hitungSkorToeflTertinggi(m);
  if (tertinggi === null) return "BELUM_LULUS";
  return tertinggi >= batas ? "LULUS" : "BELUM_LULUS";
}

function cekSiapSertifikatToefl(m) {
  const adaLatihan = m.skor_latihan !== null && Number(m.skor_latihan) > 0;
  const adaToefl = hitungSkorToeflTertinggi(m) !== null;
  return adaLatihan && adaToefl;
}

function cekSiapSertifikatSspect(m) {
  return m.skor_sspect !== null && Number(m.skor_sspect) > 0;
}

async function fetchAllRowsSupabase(db, namaTabel, orderByCol = null) {
  const pageSize = 1000;
  let from = 0;
  let semuaBaris = [];

  while (true) {
    let query = db.from(namaTabel).select("*").range(from, from + pageSize - 1);
    if (orderByCol) {
      query = query.order(orderByCol, { ascending: true });
    }
    const { data, error } = await query;
    if (error) {
      return { data: semuaBaris, error };
    }
    if (!data || data.length === 0) {
      break;
    }
    semuaBaris = semuaBaris.concat(data);
    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return { data: semuaBaris, error: null };
}

function ekstrakSkorDariRiwayatJson(riwayatRaw) {
  if (!riwayatRaw) return {};
  let obj = riwayatRaw;
  if (typeof riwayatRaw === "string") {
    try {
      obj = JSON.parse(riwayatRaw);
    } catch (_) {
      return {};
    }
  }
  if (!obj || typeof obj !== "object") return {};

  return {
    sspect: ambilAngkaKolom(obj, ["sspect", "skor_sspect", "nilai_sspect"]),
    latihan: ambilAngkaKolom(obj, ["latihan", "latihan_d3", "latihan_d4", "skor_latihan"]),
    toefl: ambilAngkaKolom(obj, ["toefl", "toefl_d3", "toefl_d4", "skor_toefl", "toefl_utama"]),
    rem1: ambilAngkaKolom(obj, ["remedial_1", "rem1", "rem_1"]),
    rem2: ambilAngkaKolom(obj, ["remedial_2", "rem2", "rem_2"]),
    rem3: ambilAngkaKolom(obj, ["remedial_3", "rem3", "rem_3"]),
    listening: ambilAngkaKolom(obj, ["listening", "sec1", "section_1"]),
    structure: ambilAngkaKolom(obj, ["structure", "sec2", "section_2"]),
    reading: ambilAngkaKolom(obj, ["reading", "sec3", "section_3"])
  };
}

// ==================== SANITASI & PENYELARASAN NAMA KOLOM TABEL SUPABASE ====================
function saringPayloadSesuaiSkemaTabel(objRecord) {
  const kandidat = { ...objRecord };

  if (kandidat.nama_mahasiswa !== undefined && kandidat.nama === undefined) {
    kandidat.nama = kandidat.nama_mahasiswa;
  }
  if (kandidat.nama !== undefined && kandidat.nama_mahasiswa === undefined) {
    kandidat.nama_mahasiswa = kandidat.nama;
  }
  if (kandidat.program_studi !== undefined && kandidat.prodi === undefined) {
    kandidat.prodi = kandidat.program_studi;
  }
  if (kandidat.tahun_angkatan !== undefined && kandidat.angkatan === undefined) {
    kandidat.angkatan = kandidat.tahun_angkatan;
  }
  if (kandidat.skor_sspect !== undefined && kandidat.nilai_sspect === undefined) {
    kandidat.nilai_sspect = kandidat.skor_sspect;
  }
  if (kandidat.skor_latihan !== undefined && kandidat.nilai_latihan === undefined) {
    kandidat.nilai_latihan = kandidat.skor_latihan;
  }
  if (kandidat.skor_toefl !== undefined && kandidat.nilai_toefl === undefined) {
    kandidat.nilai_toefl = kandidat.skor_toefl;
  }

  const kolomValid = rekapanState.kolomTabelMaster;
  const hasil = {};

  Object.keys(kandidat).forEach(key => {
    if (kolomValid && kolomValid.size > 0 && !kolomValid.has(key)) {
      return;
    }
    const val = kandidat[key];
    if (val === undefined) return;

    if (KOLOM_SKOR_INTEGER.has(key)) {
      if (val === null || String(val).trim() === "") {
        hasil[key] = null;
      } else {
        const num = Number(String(val).replace(",", ".").trim());
        hasil[key] = !isNaN(num) ? Math.round(num) : null;
      }
    } else {
      hasil[key] = val;
    }
  });

  return hasil;
}

// ==================== 1. MUAT & SINKRONISASI DATA DARI SEMUA TABEL ASLI SUPABASE ====================
async function sinkronkanDatabaseRekapan(tampilkanNotif = false) {
  const db = getDbClientRekapan();
  if (!db) return;

  const tbody = document.getElementById("tbodyRekapanMaster");
  if (tbody && rekapanState.semuaData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-slate-400 italic">Menarik & menggabungkan seluruh data mahasiswa, jurusan, SSPECT, Latihan, dan TOEFL dari database...</td></tr>`;
  }

  try {
    const [resMaster, resRekapan, resHasilTes, resMahasiswa] = await Promise.all([
      fetchAllRowsSupabase(db, "arsip_master_rekapan", "nim"),
      fetchAllRowsSupabase(db, "Rekapan"),
      fetchAllRowsSupabase(db, "HasilTes"),
      fetchAllRowsSupabase(db, "Mahasiswa")
    ]);

    if (resMaster.data && resMaster.data.length > 0) {
      rekapanState.kolomTabelMaster = new Set(Object.keys(resMaster.data[0]));
    }

    const mapByNim = new Map();

    function getOrCreateRecord(nimKey, rawRow = {}) {
      if (!mapByNim.has(nimKey)) {
        const prodiRaw = ambilNilaiKolom(rawRow, ["program_studi", "prodi", "study_program", "kelas"], "-");
        const jurusanRaw = ambilNilaiKolom(rawRow, ["jurusan", "department"], "-");
        const infoProdi = deteksiJurusanDariProdiSensitif(prodiRaw, jurusanRaw);

        mapByNim.set(nimKey, {
          nim: nimKey,
          nama_mahasiswa: String(ambilNilaiKolom(rawRow, ["nama_mahasiswa", "nama", "nama_lengkap", "full_name"], "-")).toUpperCase(),
          jurusan: infoProdi.jurusan,
          program_studi: infoProdi.prodi,
          jenjang: infoProdi.jenjang,
          tahun_angkatan: ekstrakAngkatanNim(nimKey, ambilNilaiKolom(rawRow, ["tahun_angkatan", "angkatan"], null)),
          skor_sspect: null,
          skor_latihan: null,
          skor_toefl: null,
          remedial_1: null,
          remedial_2: null,
          remedial_3: null,
          listening: null,
          structure: null,
          reading: null,
          sspect_listening: null,
          sspect_structure: null,
          sspect_reading: null,
          tempat_tanggal_lahir: "",
          tanggal_tes: "",
          nomor_sertifikat: ""
        });
      }
      return mapByNim.get(nimKey);
    }

    // A. arsip_master_rekapan
    (resMaster.data || []).forEach(row => {
      const nimKey = String(ambilNilaiKolom(row, ["nim", "nim_mahasiswa"], "")).trim();
      if (!nimKey) return;

      const rec = getOrCreateRecord(nimKey, row);
      const nama = String(ambilNilaiKolom(row, ["nama_mahasiswa", "nama", "nama_lengkap"], "-")).toUpperCase();
      if (nama !== "-") rec.nama_mahasiswa = nama;

      const prodiRaw = ambilNilaiKolom(row, ["program_studi", "prodi", "kelas"], "-");
      const jurusanRaw = ambilNilaiKolom(row, ["jurusan"], rec.jurusan);
      const infoProdi = deteksiJurusanDariProdiSensitif(prodiRaw, jurusanRaw);
      if (infoProdi.prodi !== "-") rec.program_studi = infoProdi.prodi;
      if (infoProdi.jurusan !== "-") rec.jurusan = infoProdi.jurusan;
      rec.jenjang = infoProdi.jenjang;

      rec.skor_sspect = ambilAngkaKolom(row, ["skor_sspect", "nilai_sspect", "sspect"]) ?? rec.skor_sspect;
      rec.skor_latihan = ambilAngkaKolom(row, ["skor_latihan", "nilai_latihan", "latihan"]) ?? rec.skor_latihan;
      rec.skor_toefl = ambilAngkaKolom(row, ["skor_toefl", "nilai_toefl", "toefl", "skor_utama"]) ?? rec.skor_toefl;
      rec.remedial_1 = ambilAngkaKolom(row, ["remedial_1", "rem_1"]) ?? rec.remedial_1;
      rec.remedial_2 = ambilAngkaKolom(row, ["remedial_2", "rem_2"]) ?? rec.remedial_2;
      rec.remedial_3 = ambilAngkaKolom(row, ["remedial_3", "rem_3"]) ?? rec.remedial_3;

      rec.listening = ambilAngkaKolom(row, ["listening", "section_1"]) ?? rec.listening;
      rec.structure = ambilAngkaKolom(row, ["structure", "section_2"]) ?? rec.structure;
      rec.reading = ambilAngkaKolom(row, ["reading", "section_3"]) ?? rec.reading;
      rec.sspect_listening = ambilAngkaKolom(row, ["sspect_listening"]) ?? rec.sspect_listening;
      rec.sspect_structure = ambilAngkaKolom(row, ["sspect_structure"]) ?? rec.sspect_structure;
      rec.sspect_reading = ambilAngkaKolom(row, ["sspect_reading"]) ?? rec.sspect_reading;

      const dariJson = ekstrakSkorDariRiwayatJson(row.riwayat_json);
      if (dariJson.sspect) rec.skor_sspect = dariJson.sspect;
      if (dariJson.latihan) rec.skor_latihan = dariJson.latihan;
      if (dariJson.toefl) rec.skor_toefl = dariJson.toefl;
      if (dariJson.rem1) rec.remedial_1 = dariJson.rem1;
      if (dariJson.rem2) rec.remedial_2 = dariJson.rem2;
      if (dariJson.rem3) rec.remedial_3 = dariJson.rem3;

      rec.tempat_tanggal_lahir = ambilNilaiKolom(row, ["tempat_tanggal_lahir", "ttl"], rec.tempat_tanggal_lahir);
      rec.tanggal_tes = ambilNilaiKolom(row, ["tanggal_tes", "tgl_tes"], rec.tanggal_tes);
      rec.nomor_sertifikat = ambilNilaiKolom(row, ["nomor_sertifikat", "no_sertifikat"], rec.nomor_sertifikat);
    });

    // B. Mahasiswa
    (resMahasiswa.data || []).forEach(mhs => {
      const nimKey = String(ambilNilaiKolom(mhs, ["nim", "nim_mahasiswa"], "")).trim();
      if (!nimKey) return;
      const rec = getOrCreateRecord(nimKey, mhs);

      const nama = String(ambilNilaiKolom(mhs, ["nama_mahasiswa", "nama", "nama_lengkap"], "-")).toUpperCase();
      if ((rec.nama_mahasiswa === "-" || !rec.nama_mahasiswa) && nama !== "-") {
        rec.nama_mahasiswa = nama;
      }

      const prodiRaw = ambilNilaiKolom(mhs, ["program_studi", "prodi", "kelas"], "-");
      if (prodiRaw !== "-") {
        const infoProdi = deteksiJurusanDariProdiSensitif(prodiRaw, rec.jurusan);
        rec.program_studi = infoProdi.prodi;
        rec.jurusan = infoProdi.jurusan;
        rec.jenjang = infoProdi.jenjang;
      }
      rec.tempat_tanggal_lahir = ambilNilaiKolom(mhs, ["tempat_tanggal_lahir", "ttl"], rec.tempat_tanggal_lahir);
    });

    // C. Rekapan & HasilTes
    const gabunganHasilTes = [...(resRekapan.data || []), ...(resHasilTes.data || [])];
    gabunganHasilTes.forEach(item => {
      const nimKey = String(ambilNilaiKolom(item, ["nim", "nim_mahasiswa", "student_id"], "")).trim();
      if (!nimKey) return;

      const rec = getOrCreateRecord(nimKey, item);

      const nama = String(ambilNilaiKolom(item, ["nama_mahasiswa", "nama", "nama_lengkap"], "-")).toUpperCase();
      if ((rec.nama_mahasiswa === "-" || !rec.nama_mahasiswa) && nama !== "-") {
        rec.nama_mahasiswa = nama;
      }

      const prodiRaw = ambilNilaiKolom(item, ["program_studi", "prodi", "kelas"], "-");
      if (prodiRaw !== "-") {
        const infoProdi = deteksiJurusanDariProdiSensitif(prodiRaw, rec.jurusan);
        rec.program_studi = infoProdi.prodi;
        rec.jurusan = infoProdi.jurusan;
        rec.jenjang = infoProdi.jenjang;
      }

      const kategori = String(ambilNilaiKolom(item, ["kategori_tes", "jenis_tes", "kategori"], "")).toUpperCase();
      const skorTotal = ambilAngkaKolom(item, ["skor_total", "total_skor", "skor_akhir", "nilai"]);

      if (skorTotal) {
        if (kategori.includes("SSPECT")) {
          rec.skor_sspect = skorTotal;
        } else if (kategori.includes("LATIHAN")) {
          rec.skor_latihan = skorTotal;
        } else if (kategori.includes("REM") && kategori.includes("3")) {
          rec.remedial_3 = skorTotal;
        } else if (kategori.includes("REM") && kategori.includes("2")) {
          rec.remedial_2 = skorTotal;
        } else if (kategori.includes("REM")) {
          rec.remedial_1 = skorTotal;
        } else if (kategori.includes("TOEFL")) {
          rec.skor_toefl = skorTotal;
        }
      }

      rec.skor_sspect = ambilAngkaKolom(item, ["skor_sspect", "nilai_sspect"]) ?? rec.skor_sspect;
      rec.skor_latihan = ambilAngkaKolom(item, ["skor_latihan", "nilai_latihan"]) ?? rec.skor_latihan;
      rec.skor_toefl = ambilAngkaKolom(item, ["skor_toefl", "nilai_toefl"]) ?? rec.skor_toefl;
      rec.remedial_1 = ambilAngkaKolom(item, ["remedial_1", "rem_1"]) ?? rec.remedial_1;
      rec.remedial_2 = ambilAngkaKolom(item, ["remedial_2", "rem_2"]) ?? rec.remedial_2;
      rec.remedial_3 = ambilAngkaKolom(item, ["remedial_3", "rem_3"]) ?? rec.remedial_3;

      const dariJson = ekstrakSkorDariRiwayatJson(item.riwayat_json);
      if (dariJson.sspect) rec.skor_sspect = dariJson.sspect;
      if (dariJson.latihan) rec.skor_latihan = dariJson.latihan;
      if (dariJson.toefl) rec.skor_toefl = dariJson.toefl;
      if (dariJson.rem1) rec.remedial_1 = dariJson.rem1;
      if (dariJson.rem2) rec.remedial_2 = dariJson.rem2;
      if (dariJson.rem3) rec.remedial_3 = dariJson.rem3;

      const s1 = ambilAngkaKolom(item, ["listening", "section_1", "sec_1", "s1"]) ?? dariJson.listening;
      const s2 = ambilAngkaKolom(item, ["structure", "section_2", "sec_2", "s2"]) ?? dariJson.structure;
      const s3 = ambilAngkaKolom(item, ["reading", "section_3", "sec_3", "s3"]) ?? dariJson.reading;

      if (kategori.includes("SSPECT")) {
        if (s1) rec.sspect_listening = s1;
        if (s2) rec.sspect_structure = s2;
        if (s3) rec.sspect_reading = s3;
      } else {
        if (s1) rec.listening = s1;
        if (s2) rec.structure = s2;
        if (s3) rec.reading = s3;
      }
    });

    rekapanState.semuaData = Array.from(mapByNim.values()).map(m => {
      const fixedProdi = deteksiJurusanDariProdiSensitif(m.program_studi, m.jurusan);
      const itemFinal = {
        ...m,
        jurusan: fixedProdi.jurusan,
        program_studi: fixedProdi.prodi,
        jenjang: fixedProdi.jenjang
      };
      return {
        ...itemFinal,
        skor_toefl_akhir: hitungSkorToeflTertinggi(itemFinal),
        status_lulus: cekStatusKelulusan(itemFinal)
      };
    });

    renderTabAngkatan();
    terapkanFilterRekapan();

    if (tampilkanNotif) {
      await perbaikiDataMasterDiDatabase(db, rekapanState.semuaData);
      alert(`Sinkronisasi selesai! Total ${rekapanState.semuaData.length} data mahasiswa (termasuk hasil pencocokan SSPECT, Latihan, & TOEFL) berhasil diselaraskan.`);
    }
  } catch (err) {
    console.error("Gagal memuat rekapan:", err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-rose-500 font-bold">Gagal memuat data dari database: ${err.message}</td></tr>`;
    }
  }
}

async function perbaikiDataMasterDiDatabase(db, daftarMahasiswa) {
  const { data: existingRows } = await fetchAllRowsSupabase(db, "arsip_master_rekapan");
  const setNimAda = new Set((existingRows || []).map(r => String(r.nim || "").trim()));

  const untukInsert = [];
  const untukUpdate = [];

  daftarMahasiswa.forEach(m => {
    const payload = saringPayloadSesuaiSkemaTabel({
      nim: m.nim,
      nama: m.nama_mahasiswa || "-",
      nama_mahasiswa: m.nama_mahasiswa || "-",
      jurusan: m.jurusan,
      prodi: m.program_studi,
      program_studi: m.program_studi,
      angkatan: m.tahun_angkatan,
      tahun_angkatan: m.tahun_angkatan,
      skor_sspect: m.skor_sspect,
      skor_latihan: m.skor_latihan,
      skor_toefl: m.skor_toefl,
      remedial_1: m.remedial_1,
      remedial_2: m.remedial_2,
      remedial_3: m.remedial_3,
      listening: m.listening,
      structure: m.structure,
      reading: m.reading,
      sspect_listening: m.sspect_listening,
      sspect_structure: m.sspect_structure,
      sspect_reading: m.sspect_reading
    });

    if (setNimAda.has(String(m.nim).trim())) {
      untukUpdate.push(payload);
    } else {
      untukInsert.push(payload);
    }
  });

  const chunkSize = 200;
  for (let i = 0; i < untukInsert.length; i += chunkSize) {
    await db.from("arsip_master_rekapan").insert(untukInsert.slice(i, i + chunkSize));
  }

  for (let i = 0; i < untukUpdate.length; i += chunkSize) {
    const slice = untukUpdate.slice(i, i + chunkSize);
    await Promise.all(
      slice.map(item => {
        const { nim, ...fields } = item;
        return db.from("arsip_master_rekapan").update(fields).eq("nim", nim);
      })
    );
  }
}

// ==================== 2. IMPORT ARSIP CERDAS (MENDAFTAR MULTI-SHEET D3 & D4) ====================
function bukaModalImportArsip() {
  const fileInput = document.getElementById("inputFileExcelArsip");
  if (fileInput) fileInput.value = "";
  const modal = document.getElementById("modalImportArsipRekapan");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function tutupModalImportArsip() {
  const modal = document.getElementById("modalImportArsipRekapan");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function cariKolomBarisExcel(rowObj, daftarKandidat) {
  const keys = Object.keys(rowObj || {});
  for (const kandidat of daftarKandidat) {
    const kUpper = kandidat.toUpperCase();
    const foundKey = keys.find(k => k.trim().toUpperCase() === kUpper || k.trim().toUpperCase().includes(kUpper));
    if (foundKey && rowObj[foundKey] !== undefined && rowObj[foundKey] !== null && String(rowObj[foundKey]).trim() !== "") {
      return rowObj[foundKey];
    }
  }
  return null;
}

function parseSkorBulatExcel(valRaw) {
  if (valRaw === null || valRaw === undefined || String(valRaw).trim() === "") return null;
  const bersih = String(valRaw).replace(",", ".").trim();
  const angka = Number(bersih);
  return !isNaN(angka) && angka > 0 ? Math.round(angka) : null;
}

async function prosesImportArsipCerdas() {
  const db = getDbClientRekapan();
  if (!db) return;

  const kategoriImport = document.getElementById("importKategoriTes").value;
  const fileInput = document.getElementById("inputFileExcelArsip");
  const file = fileInput?.files?.[0];

  if (!file) {
    alert("Pilih file Excel (.xlsx / .xls / .csv) terlebih dahulu!");
    return;
  }

  const btn = document.getElementById("btnEksekusiImportArsip");
  btn.disabled = true;
  btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i><span>Memproses & Mencocokkan...</span>`;

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    // Kumpulkan semua baris dari semua sheet yang tersedia (misal: sheet D3, D4, dll.)
    let semuaBarisMentah = [];
    workbook.SheetNames.forEach(sheetName => {
      const ws = workbook.Sheets[sheetName];
      const jsonSheet = XLSX.utils.sheet_to_json(ws, { defval: "" });
      jsonSheet.forEach(row => {
        row.__sheet_source = sheetName;
        semuaBarisMentah.push(row);
      });
    });

    if (semuaBarisMentah.length === 0) {
      alert("File Excel kosong atau tidak terbaca.");
      return;
    }

    const mapDbByNim = new Map();
    const mapDbByNamaAngkatan = new Map();
    const setAngkatanSudahAdaDiDb = new Set();

    rekapanState.semuaData.forEach(m => {
      const nimClean = String(m.nim).trim();
      const thn = Number(m.tahun_angkatan);
      mapDbByNim.set(nimClean, m);
      if (!isNaN(thn) && thn > 0) {
        setAngkatanSudahAdaDiDb.add(thn);
      }
      const keyNama = `${normalisasiNamaPencocokan(m.nama_mahasiswa)}|${thn}`;
      if (!mapDbByNamaAngkatan.has(keyNama)) {
        mapDbByNamaAngkatan.set(keyNama, m);
      }
    });

    const mapPatchDbExisting = new Map();
    const mapInsertBaru = new Map();
    const setAngkatanTerdeteksi = new Set();
    let jmlDilewati = 0;

    semuaBarisMentah.forEach(row => {
      const nimRaw = String(cariKolomBarisExcel(row, ["NIM", "NO. INDUK", "NPM", "NO_INDUK"]) || "").replace(/\s+/g, "").trim();
      const namaRaw = String(cariKolomBarisExcel(row, ["NAMA MAHASISWA", "NAMA_MAHASISWA", "NAMA LENGKAP", "NAMA", "FULL NAME", "NAMA_MHS"]) || "").trim().toUpperCase();

      if (!nimRaw && !namaRaw) {
        jmlDilewati++;
        return;
      }

      const sourceSheet = String(row.__sheet_source || "").toUpperCase();
      const fallbackProdiSheet = sourceSheet.includes("D4") ? "D4 - PROGRAM STUDI" : sourceSheet.includes("D3") ? "D3 - PROGRAM STUDI" : "-";

      const angkatanNim = ekstrakAngkatanNim(nimRaw, cariKolomBarisExcel(row, ["TAHUN_ANGKATAN", "ANGKATAN", "TAHUN"]));
      setAngkatanTerdeteksi.add(angkatanNim);
      const angkatanSudahAdaDiDb = setAngkatanSudahAdaDiDb.has(angkatanNim);

      let existingDb = null;
      if (nimRaw && mapDbByNim.has(nimRaw)) {
        existingDb = mapDbByNim.get(nimRaw);
      } else if (!nimRaw && angkatanSudahAdaDiDb) {
        const keyNama = `${normalisasiNamaPencocokan(namaRaw)}|${angkatanNim}`;
        existingDb = mapDbByNamaAngkatan.get(keyNama) || null;
      }

      // Deteksi nilai skor utama atau total secara fleksibel dari berbagai variasi nama kolom Excel
      const skorUtamaRaw = cariKolomBarisExcel(row, [
        "TOTAL", "TOTAL_SCORE", "TOTAL SCORE", "SKOR TOTAL", "SKOR AKHIR", "SKOR", "SCORE", "NILAI",
        "SSPECT", "LATIHAN", "TOEFL", "REMEDIAL 1", "REMEDIAL 2", "REMEDIAL 3", "REMEDIAL"
      ]);
      const skorAngka = parseSkorBulatExcel(skorUtamaRaw);

      const s1 = parseSkorBulatExcel(cariKolomBarisExcel(row, ["SECTION 1", "SECTION_1", "SEC 1", "LISTENING", "S1"]));
      const s2 = parseSkorBulatExcel(cariKolomBarisExcel(row, ["SECTION 2", "SECTION_2", "SEC 2", "STRUCTURE", "S2"]));
      const s3 = parseSkorBulatExcel(cariKolomBarisExcel(row, ["SECTION 3", "SECTION_3", "SEC 3", "READING", "S3"]));

      const terapkanSkorKeObjek = (targetObj) => {
        let terisi = false;
        if (kategoriImport === "SSPECT" && (skorAngka || s1 || s3)) {
          targetObj.skor_sspect = skorAngka || (s1 && s3 ? s1 + s3 : null);
          if (s1) targetObj.sspect_listening = s1;
          if (s2) targetObj.sspect_structure = s2;
          if (s3) targetObj.sspect_reading = s3;
          terisi = true;
        } else if (kategoriImport === "LATIHAN" && skorAngka) {
          targetObj.skor_latihan = skorAngka;
          if (s1) targetObj.listening = s1;
          if (s2) targetObj.structure = s2;
          if (s3) targetObj.reading = s3;
          terisi = true;
        } else if (kategoriImport === "TOEFL" && (skorAngka || s1 || s3)) {
          targetObj.skor_toefl = skorAngka || (s1 && s3 ? s1 + s3 : null);
          if (s1) targetObj.listening = s1;
          if (s2) targetObj.structure = s2;
          if (s3) targetObj.reading = s3;
          terisi = true;
        } else if (kategoriImport === "REMEDIAL_1" && skorAngka) {
          targetObj.remedial_1 = skorAngka;
          if (s1) targetObj.listening = s1;
          if (s2) targetObj.structure = s2;
          if (s3) targetObj.reading = s3;
          terisi = true;
        } else if (kategoriImport === "REMEDIAL_2" && skorAngka) {
          targetObj.remedial_2 = skorAngka;
          if (s1) targetObj.listening = s1;
          if (s2) targetObj.structure = s2;
          if (s3) targetObj.reading = s3;
          terisi = true;
        } else if (kategoriImport === "REMEDIAL_3" && skorAngka) {
          targetObj.remedial_3 = skorAngka;
          if (s1) targetObj.listening = s1;
          if (s2) targetObj.structure = s2;
          if (s3) targetObj.reading = s3;
          terisi = true;
        } else if (kategoriImport === "BIODATA_TTL") {
          const ttlGabungan = cariKolomBarisExcel(row, ["PLACE, DATE OF BIRTH", "TEMPAT TANGGAL LAHIR", "TTL"]);
          const tempat = cariKolomBarisExcel(row, ["TEMPAT LAHIR", "KOTA LAHIR"]);
          const tglLahir = cariKolomBarisExcel(row, ["TANGGAL LAHIR", "TGL LAHIR"]);
          const finalTtl = ttlGabungan || (tempat && tglLahir ? `${tempat}, ${tglLahir}` : "");
          if (finalTtl) {
            targetObj.tempat_tanggal_lahir = String(finalTtl).trim();
            terisi = true;
          }
        }
        return terisi;
      };

      if (existingDb) {
        const patch = mapPatchDbExisting.get(existingDb.nim) || { nim: existingDb.nim };
        const adaSkor = terapkanSkorKeObjek(patch);
        if (adaSkor) {
          mapPatchDbExisting.set(existingDb.nim, patch);
        } else {
          jmlDilewati++;
        }
      } else {
        if (!nimRaw) {
          jmlDilewati++;
          return;
        }

        const prodiRaw = cariKolomBarisExcel(row, ["PROGRAM STUDI", "PROGRAM_STUDI", "PRODI", "KELAS", "JURUSAN"]) || fallbackProdiSheet;
        const jurusanRaw = cariKolomBarisExcel(row, ["JURUSAN", "DEPARTMENT"]) || "-";
        const infoProdi = deteksiJurusanDariProdiSensitif(prodiRaw, jurusanRaw);
        const namaFinal = namaRaw || "-";

        const recBaru = mapInsertBaru.get(nimRaw) || {
          nim: nimRaw,
          nama: namaFinal,
          nama_mahasiswa: namaFinal,
          jurusan: infoProdi.jurusan,
          prodi: infoProdi.prodi,
          program_studi: infoProdi.prodi,
          angkatan: angkatanNim,
          tahun_angkatan: angkatanNim
        };

        terapkanSkorKeObjek(recBaru);
        mapInsertBaru.set(nimRaw, recBaru);
      }
    });

    const daftarUpdateExisting = Array.from(mapPatchDbExisting.values());
    const daftarInsertBaru = Array.from(mapInsertBaru.values());

    const chunkSize = 150;
    for (let i = 0; i < daftarUpdateExisting.length; i += chunkSize) {
      const slice = daftarUpdateExisting.slice(i, i + chunkSize);
      const results = await Promise.all(
        slice.map(patch => {
          const { nim, ...fields } = patch;
          const cleanFields = saringPayloadSesuaiSkemaTabel(fields);
          return db.from("arsip_master_rekapan").update(cleanFields).eq("nim", nim);
        })
      );
      const firstErr = results.find(r => r.error)?.error;
      if (firstErr) {
        throw new Error(`Gagal memperbarui skor mahasiswa lama: ${firstErr.message}`);
      }
    }

    for (let i = 0; i < daftarInsertBaru.length; i += chunkSize) {
      const batchBaru = daftarInsertBaru.slice(i, i + chunkSize).map(item => saringPayloadSesuaiSkemaTabel(item));
      const { error: errInsert } = await db
        .from("arsip_master_rekapan")
        .insert(batchBaru);

      if (errInsert) {
        throw new Error(`Gagal menyimpan data angkatan baru ke database: ${errInsert.message}`);
      }
    }

    tutupModalImportArsip();
    rekapanState.tabAngkatanAktif = "SEMUA";
    await sinkronkanDatabaseRekapan(false);

    const daftarAngkatanStr = Array.from(setAngkatanTerdeteksi).sort().join(", ") || "-";

    alert(
      `Import Kategori ${kategoriImport} (Angkatan: ${daftarAngkatanStr}) Selesai!\n` +
      `• Skor digabung ke data mahasiswa lama: ${daftarUpdateExisting.length} mahasiswa (tanpa duplikat)\n` +
      `• Data mahasiswa baru diterima: ${daftarInsertBaru.length} mahasiswa\n` +
      `• Baris kosong/tanpa skor dilewati: ${jmlDilewati}`
    );
  } catch (err) {
    console.error("Error Import Arsip:", err);
    alert("Gagal memproses import: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ri-upload-cloud-2-line"></i><span>Proses Import &amp; Gabung Skor</span>`;
  }
}

// ==================== 3. RENDER TAB ANGKATAN (DINAMIS AUTO-NIM) ====================
function renderTabAngkatan() {
  const container = document.getElementById("containerTabAngkatan");
  const selectBatch = document.getElementById("batchTargetAngkatan");
  const selectExport = document.getElementById("exportPilihAngkatan");
  if (!container) return;

  const hitungPerTahun = {};
  rekapanState.semuaData.forEach(m => {
    const thn = String(m.tahun_angkatan || "LAINNYA");
    hitungPerTahun[thn] = (hitungPerTahun[thn] || 0) + 1;
  });

  const daftarTahun = Object.keys(hitungPerTahun).sort((a, b) => Number(b) - Number(a));

  let htmlTabs = `
    <button type="button" onclick="pilihTabAngkatan('SEMUA')" class="px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
      rekapanState.tabAngkatanAktif === "SEMUA"
        ? "bg-[#169C53] text-white shadow-2xs"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }">
      Semua (${rekapanState.semuaData.length})
    </button>
  `;

  daftarTahun.forEach(thn => {
    const aktif = String(rekapanState.tabAngkatanAktif) === String(thn);
    htmlTabs += `
      <button type="button" onclick="pilihTabAngkatan('${thn}')" class="px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
        aktif
          ? "bg-[#169C53] text-white shadow-2xs"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }">
        Angkatan ${thn} (${hitungPerTahun[thn]})
      </button>
    `;
  });

  container.innerHTML = htmlTabs;

  if (selectBatch) {
    selectBatch.innerHTML = daftarTahun
      .map(thn => `<option value="${thn}">Angkatan ${thn} (${hitungPerTahun[thn]} Mahasiswa)</option>`)
      .join("");
  }
  if (selectExport) {
    selectExport.innerHTML =
      `<option value="SEMUA">Semua Angkatan (${rekapanState.semuaData.length} Mahasiswa)</option>` +
      daftarTahun.map(thn => `<option value="${thn}">Angkatan ${thn} (${hitungPerTahun[thn]} Mahasiswa)</option>`).join("");
  }
}

function pilihTabAngkatan(tahun) {
  rekapanState.tabAngkatanAktif = tahun;
  rekapanState.halamanSaatIni = 1;
  renderTabAngkatan();
  terapkanFilterRekapan();
}

// ==================== 4. FILTER PENCARIAN & RENDER TABEL UTAMA ====================
function terapkanFilterRekapan() {
  const keyword = String(document.getElementById("inputCariRekapan")?.value || "").trim().toUpperCase();
  const statusFilter = document.getElementById("filterStatusRekapan")?.value || "SEMUA";

  const hasil = rekapanState.semuaData.filter(m => {
    if (rekapanState.tabAngkatanAktif !== "SEMUA" && String(m.tahun_angkatan) !== String(rekapanState.tabAngkatanAktif)) {
      return false;
    }
    if (statusFilter !== "SEMUA" && m.status_lulus !== statusFilter) {
      return false;
    }
    if (keyword) {
      const gabungan = `${m.nim} ${m.nama_mahasiswa} ${m.jurusan || ""} ${m.program_studi || ""}`.toUpperCase();
      if (!gabungan.includes(keyword)) return false;
    }
    return true;
  });

  rekapanState.dataTersaring = hasil;
  rekapanState.halamanSaatIni = 1;

  const jmlLulus = hasil.filter(x => x.status_lulus === "LULUS").length;
  const jmlBelum = hasil.length - jmlLulus;
  document.getElementById("statTotalMahasiswa").textContent = `Total: ${hasil.length}`;
  document.getElementById("statLulusToefl").textContent = `Lulus TOEFL: ${jmlLulus}`;
  document.getElementById("statBelumLulus").textContent = `Belum Lulus: ${jmlBelum}`;

  renderTabelRekapan();
}

function renderTabelRekapan() {
  const tbody = document.getElementById("tbodyRekapanMaster");
  if (!tbody) return;

  const total = rekapanState.dataTersaring.length;
  const totalHal = Math.max(1, Math.ceil(total / rekapanState.perHalaman));
  if (rekapanState.halamanSaatIni > totalHal) rekapanState.halamanSaatIni = totalHal;

  const start = (rekapanState.halamanSaatIni - 1) * rekapanState.perHalaman;
  const end = start + rekapanState.perHalaman;
  const sliceData = rekapanState.dataTersaring.slice(start, end);

  document.getElementById("infoPaginationRekapan").textContent =
    total === 0 ? "Menampilkan 0 data" : `Menampilkan ${start + 1} - ${Math.min(end, total)} dari ${total} mahasiswa`;
  document.getElementById("labelHalamanRekapan").textContent = `Hal ${rekapanState.halamanSaatIni} / ${totalHal}`;
  document.getElementById("btnPrevPageRekapan").disabled = rekapanState.halamanSaatIni <= 1;
  document.getElementById("btnNextPageRekapan").disabled = rekapanState.halamanSaatIni >= totalHal;

  if (sliceData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 italic">Tidak ada data mahasiswa yang sesuai dengan filter pencarian.</td></tr>`;
    return;
  }

  tbody.innerHTML = sliceData
    .map((m, i) => {
      const noUrut = start + i + 1;
      const lulus = m.status_lulus === "LULUS";
      const badgeStatus = lulus
        ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#169C53] border border-emerald-200 text-[10px] font-extrabold">LULUS</span>`
        : `<span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">BELUM LULUS</span>`;

      const siapSspect = cekSiapSertifikatSspect(m);
      const siapToefl = cekSiapSertifikatToefl(m);

      const btnUnduhSspect = siapSspect
        ? `<button type="button" onclick="unduhSertifikatByNim('${m.nim}', 'SSPECT')" class="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors" title="Unduh Sertifikat SSPECT">
             <i class="ri-award-line"></i>
             <span>SSPECT</span>
           </button>`
        : "";

      const btnUnduhToefl = siapToefl
        ? `<button type="button" onclick="unduhSertifikatByNim('${m.nim}', 'TOEFL')" class="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#169C53] text-[#169C53] hover:text-white border border-emerald-200 text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors" title="Unduh Sertifikat TOEFL">
             <i class="ri-award-fill"></i>
             <span>TOEFL</span>
           </button>`
        : "";

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-4 py-3.5 text-slate-400 font-bold">${noUrut}</td>
          <td class="px-4 py-3.5">
            <div class="font-extrabold text-slate-800 uppercase">${m.nama_mahasiswa}</div>
            <div class="text-xs font-mono font-bold text-[#169C53]">${m.nim}</div>
          </td>
          <td class="px-4 py-3.5">
            <div class="font-bold text-slate-700 text-xs">${m.program_studi || "-"}</div>
            <div class="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">${m.jurusan || "-"}</div>
          </td>
          <td class="px-4 py-3.5 text-center font-extrabold text-slate-700">${m.tahun_angkatan}</td>
          <td class="px-4 py-3.5 text-center">${badgeStatus}</td>
          <td class="px-4 py-3.5 text-center">
            <div class="inline-flex flex-wrap items-center justify-center gap-1.5">
              <button type="button" onclick="bukaModalDetailMahasiswa('${m.nim}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#169C53] text-xs font-extrabold inline-flex items-center gap-1 transition-colors">
                <i class="ri-eye-line"></i>
                <span>Detail</span>
              </button>
              ${btnUnduhSspect}
              ${btnUnduhToefl}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function gantiHalamanRekapan(delta) {
  rekapanState.halamanSaatIni += delta;
  renderTabelRekapan();
}

// ==================== 5. MODAL DETAIL MAHASISWA ====================
function bukaModalDetailMahasiswa(nimTarget) {
  const m = rekapanState.semuaData.find(x => String(x.nim) === String(nimTarget));
  if (!m) return;

  rekapanState.mahasiswaDetailAktif = m;
  const jenjang = String(m.jenjang || (String(m.program_studi || "").startsWith("D4") ? "D4" : "D3")).toUpperCase();
  const batas = getBatasLulusJenjang(m.program_studi, jenjang);

  document.getElementById("detailBadgeAngkatan").textContent = `Angkatan ${m.tahun_angkatan}`;
  document.getElementById("detailBadgeBatasLulus").textContent = `${jenjang} (Batas Lulus: ${batas})`;

  const badgeStatus = document.getElementById("detailBadgeStatusLulus");
  if (m.status_lulus === "LULUS") {
    badgeStatus.textContent = "LULUS TOEFL";
    badgeStatus.className = "px-3 py-1 rounded-full bg-emerald-50 text-[#169C53] border border-emerald-200 text-xs font-extrabold";
  } else {
    badgeStatus.textContent = "BELUM LULUS / SYARAT BELUM LENGKAP";
    badgeStatus.className = "px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-extrabold";
  }

  document.getElementById("detailNamaMahasiswa").textContent = m.nama_mahasiswa;
  document.getElementById("detailSubIdentitas").textContent = `NIM: ${m.nim} • JURUSAN ${m.jurusan || "-"} • ${m.program_studi || "-"}`;

  document.getElementById("boxSkorSspect").textContent = m.skor_sspect ?? "-";
  document.getElementById("labelBoxLatihan").textContent = `LAT. ${jenjang}`;
  document.getElementById("boxSkorLatihan").textContent = m.skor_latihan ?? "-";
  document.getElementById("labelBoxToefl").textContent = `TOEFL ${jenjang}`;
  document.getElementById("boxSkorToefl").textContent = m.skor_toefl ?? "-";
  document.getElementById("boxSkorRem1").textContent = m.remedial_1 ?? "-";
  document.getElementById("boxSkorRem2").textContent = m.remedial_2 ?? "-";
  document.getElementById("boxSkorRem3").textContent = m.remedial_3 ?? "-";

  document.getElementById("detailSec1").textContent = m.listening ?? m.sspect_listening ?? "-";
  document.getElementById("detailSec2").textContent = m.structure ?? m.sspect_structure ?? "-";
  document.getElementById("detailSec3").textContent = m.reading ?? m.sspect_reading ?? "-";

  const infoNomorTgl = document.getElementById("detailInfoNomorTanggal");
  if (infoNomorTgl) {
    infoNomorTgl.textContent = `No. Sertifikat: ${m.nomor_sertifikat || "Belum diatur"} • Tanggal Terbit: ${m.tanggal_tes || "Belum diatur"}`;
  }

  const containerBtn = document.getElementById("containerTombolSertifikatDetail");
  const siapSspect = cekSiapSertifikatSspect(m);
  const siapToefl = cekSiapSertifikatToefl(m);

  let htmlBtns = "";
  if (siapSspect) {
    htmlBtns += `
      <button type="button" onclick="unduhSertifikatMahasiswaAktif('SSPECT')" class="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-all">
        <i class="ri-download-2-line text-sm"></i>
        <span>Unduh Sertifikat SSPECT</span>
      </button>
    `;
  }
  if (siapToefl) {
    htmlBtns += `
      <button type="button" onclick="unduhSertifikatMahasiswaAktif('TOEFL')" class="px-4 py-2.5 rounded-xl bg-[#169C53] hover:bg-[#0E7A3F] text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-all">
        <i class="ri-download-2-line text-sm"></i>
        <span>Unduh Sertifikat TOEFL</span>
      </button>
    `;
  }
  if (!siapSspect && !siapToefl) {
    htmlBtns = `<span class="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold">Sertifikat belum tersedia (skor belum lengkap)</span>`;
  }
  containerBtn.innerHTML = htmlBtns;

  const modal = document.getElementById("modalDetailMahasiswa");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function tutupModalDetail() {
  const modal = document.getElementById("modalDetailMahasiswa");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// ==================== 6. ATUR NOMOR & TANGGAL SERTIFIKAT 1 ANGKATAN ====================
function formatTanggalInggrisSertifikat(dateIsoStr) {
  if (!dateIsoStr) return "04 May 2026";
  const parts = dateIsoStr.split("-");
  if (parts.length !== 3) return dateIsoStr;
  const bulanInggris = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const tahun = parts[0];
  const bulanIdx = parseInt(parts[1], 10) - 1;
  const hari = parts[2].padStart(2, "0");
  return `${hari} ${bulanInggris[bulanIdx] || "May"} ${tahun}`;
}

function bukaModalBatchNomorSertifikat() {
  const tglInput = document.getElementById("batchTanggalTerbit");
  if (tglInput && !tglInput.value) {
    tglInput.value = new Date().toISOString().split("T")[0];
  }
  updatePreviewBatchNomor();
  const modal = document.getElementById("modalBatchNomorSertifikat");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function tutupModalBatchNomor() {
  const modal = document.getElementById("modalBatchNomorSertifikat");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function generateNomorBerantai(kodeAwal, indeksOffset) {
  const clean = String(kodeAwal || "0355").trim().toUpperCase();
  const match = clean.match(/^([A-Z]*)(\d+)$/);
  if (!match) return `${clean}-${indeksOffset + 1}`;

  const prefixHuruf = match[1];
  const angkaStr = match[2];
  const panjangDigit = angkaStr.length;
  const angkaBaru = parseInt(angkaStr, 10) + indeksOffset;
  return `${prefixHuruf}${String(angkaBaru).padStart(panjangDigit, "0")}`;
}

function updatePreviewBatchNomor() {
  const awal = document.getElementById("batchKodeAwal")?.value || "0355";
  const suffix = document.getElementById("batchFormatSuffix")?.value || "";
  const tglRaw = document.getElementById("batchTanggalTerbit")?.value || "";
  const tglFormatted = formatTanggalInggrisSertifikat(tglRaw);
  const previewEl = document.getElementById("previewUrutanBatchNomor");
  if (!previewEl) return;

  const baris = [0, 1, 2].map(idx => {
    const kode = generateNomorBerantai(awal, idx);
    return `${idx + 1}. <b>${kode}</b> ${suffix} &bull; <span style="color:#0E7A3F">${tglFormatted}</span>`;
  });
  previewEl.innerHTML = baris.join("<br />");
}

async function eksekusiBatchNomorSertifikat() {
  const db = getDbClientRekapan();
  if (!db) return;

  const targetAngkatan = document.getElementById("batchTargetAngkatan").value;
  const kodeAwal = document.getElementById("batchKodeAwal").value.trim().toUpperCase();
  const suffix = document.getElementById("batchFormatSuffix").value.trim();
  const tglRaw = document.getElementById("batchTanggalTerbit").value;

  if (!kodeAwal || !tglRaw) {
    alert("Nomor urut awal dan Tanggal Terbit Sertifikat wajib diisi!");
    return;
  }

  const tanggalTerbitFormatted = formatTanggalInggrisSertifikat(tglRaw);

  const daftarTarget = rekapanState.semuaData
    .filter(m => String(m.tahun_angkatan) === String(targetAngkatan))
    .sort((a, b) => String(a.nim).localeCompare(String(b.nim)));

  if (daftarTarget.length === 0) {
    alert(`Tidak ada data mahasiswa untuk Angkatan ${targetAngkatan}.`);
    return;
  }

  if (!confirm(`Terapkan penomoran mulai dari ${kodeAwal} dan tanggal terbit "${tanggalTerbitFormatted}" ke ${daftarTarget.length} mahasiswa Angkatan ${targetAngkatan}?`)) {
    return;
  }

  const btn = document.getElementById("btnEksekusiBatchNomor");
  btn.disabled = true;

  try {
    const chunkSize = 200;
    for (let i = 0; i < daftarTarget.length; i += chunkSize) {
      const slice = daftarTarget.slice(i, i + chunkSize);
      const promises = slice.map((m, offsetLocal) => {
        const idxGlobal = i + offsetLocal;
        const kodeUrut = generateNomorBerantai(kodeAwal, idxGlobal);
        const nomorLengkap = suffix ? `${kodeUrut} ${suffix}` : kodeUrut;
        m.nomor_sertifikat = nomorLengkap;
        m.tanggal_tes = tanggalTerbitFormatted;
        return db
          .from("arsip_master_rekapan")
          .update(
            saringPayloadSesuaiSkemaTabel({
              nomor_sertifikat: nomorLengkap,
              tanggal_tes: tanggalTerbitFormatted
            })
          )
          .eq("nim", m.nim);
      });
      await Promise.all(promises);
    }

    tutupModalBatchNomor();
    alert(`Berhasil! Nomor sertifikat (${kodeAwal} dst.) dan tanggal terbit (${tanggalTerbitFormatted}) telah diterapkan ke ${daftarTarget.length} mahasiswa Angkatan ${targetAngkatan}.`);
  } catch (err) {
    alert("Gagal menyimpan pengaturan sertifikat massal: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ==================== 7. UNDUH DATA EXCEL PER ANGKATAN & KATEGORI ====================
function bukaModalUnduhExcelRekapan() {
  const modal = document.getElementById("modalUnduhExcelRekapan");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function tutupModalUnduhExcel() {
  const modal = document.getElementById("modalUnduhExcelRekapan");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function eksekusiUnduhExcelRekapan() {
  const pilihAngkatan = document.getElementById("exportPilihAngkatan").value;
  const pilihKategori = document.getElementById("exportPilihKategori").value;

  let sumber = rekapanState.semuaData;
  if (pilihAngkatan !== "SEMUA") {
    sumber = sumber.filter(m => String(m.tahun_angkatan) === String(pilihAngkatan));
  }

  if (sumber.length === 0) {
    alert("Tidak ada data mahasiswa untuk kriteria angkatan tersebut.");
    return;
  }

  const rowsExcel = sumber.map((m, idx) => {
    const dasar = {
      NO: idx + 1,
      NIM: m.nim,
      "NAMA MAHASISWA": m.nama_mahasiswa,
      ANGKATAN: m.tahun_angkatan,
      JURUSAN: m.jurusan || "-",
      "PROGRAM STUDI": m.program_studi || "-"
    };

    if (pilihKategori === "SSPECT") {
      return {
        ...dasar,
        "SKOR SSPECT": m.skor_sspect ?? "-"
      };
    }
    if (pilihKategori === "LATIHAN") {
      return {
        ...dasar,
        "SKOR LATIHAN TOEFL": m.skor_latihan ?? "-"
      };
    }
    if (pilihKategori === "TOEFL") {
      return {
        ...dasar,
        LISTENING: m.listening ?? "-",
        STRUCTURE: m.structure ?? "-",
        READING: m.reading ?? "-",
        "SKOR TOEFL UTAMA": m.skor_toefl ?? "-",
        STATUS: m.status_lulus === "LULUS" ? "LULUS" : "BELUM LULUS",
        "NOMOR SERTIFIKAT": m.nomor_sertifikat || "-",
        "TANGGAL TERBIT": m.tanggal_tes || "-"
      };
    }
    if (pilihKategori === "REMEDIAL") {
      return {
        ...dasar,
        "REMEDIAL 1": m.remedial_1 ?? "-",
        "REMEDIAL 2": m.remedial_2 ?? "-",
        "REMEDIAL 3": m.remedial_3 ?? "-",
        "SKOR TOEFL AKHIR": m.skor_toefl_akhir ?? "-",
        STATUS: m.status_lulus === "LULUS" ? "LULUS" : "BELUM LULUS"
      };
    }

    return {
      ...dasar,
      SSPECT: m.skor_sspect ?? "-",
      "LATIHAN TOEFL": m.skor_latihan ?? "-",
      "TOEFL UTAMA": m.skor_toefl ?? "-",
      "REMEDIAL 1": m.remedial_1 ?? "-",
      "REMEDIAL 2": m.remedial_2 ?? "-",
      "REMEDIAL 3": m.remedial_3 ?? "-",
      "SKOR TOEFL AKHIR": m.skor_toefl_akhir ?? "-",
      STATUS: m.status_lulus === "LULUS" ? "LULUS" : "BELUM LULUS",
      "NOMOR SERTIFIKAT": m.nomor_sertifikat || "-",
      "TANGGAL TERBIT": m.tanggal_tes || "-"
    };
  });

  const ws = XLSX.utils.json_to_sheet(rowsExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekapan_${pilihKategori}`);

  const namaFile = `Rekapan_${pilihKategori}_Angkatan_${pilihAngkatan}.xlsx`;
  XLSX.writeFile(wb, namaFile);
  tutupModalUnduhExcel();
}

// ==================== 8. CETAK SERTIFIKAT RESMI (100% SAMA CONTOH + QR VERIFIKASI) ====================
function unduhSertifikatByNim(nimTarget, jenisSertifikat) {
  const m = rekapanState.semuaData.find(x => String(x.nim) === String(nimTarget));
  if (!m) return;
  cetakHalamanSertifikatResmi(m, jenisSertifikat);
}

function unduhSertifikatMahasiswaAktif(jenisSertifikat) {
  const m = rekapanState.mahasiswaDetailAktif;
  if (!m) return;
  cetakHalamanSertifikatResmi(m, jenisSertifikat);
}

function formatProgramStudySertifikat(prodiRaw) {
  const teks = String(prodiRaw || "-").trim();
  if (teks === "-") return "-";
  return teks
    .toLowerCase()
    .replace(/\bd3\b/gi, "D3")
    .replace(/\bd4\b/gi, "D4")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function cetakHalamanSertifikatResmi(m, jenisSertifikat = "TOEFL") {
  const isSspect = String(jenisSertifikat).toUpperCase() === "SSPECT";

  const jenisTesText = isSspect ? "SSPECT Placement Test" : "Toefl Prediction Test";
  const defaultKodeSurat = isSspect ? "SSPECT" : "TOEFL-P";
  const nomor = m.nomor_sertifikat || `0355 / PL7.18 / UPA.BAHASA / ${defaultKodeSurat} / ${new Date().getFullYear()}`;
  const ttl = m.tempat_tanggal_lahir || "Samarinda, -";
  const tglTes = m.tanggal_tes || "04 May 2026";
  const prodiCantik = formatProgramStudySertifikat(m.program_studi);

  const sec1 = isSspect ? (m.sspect_listening ?? m.listening ?? "-") : (m.listening ?? "-");
  const sec2 = isSspect ? (m.sspect_structure ?? m.structure ?? "-") : (m.structure ?? "-");
  const sec3 = isSspect ? (m.sspect_reading ?? m.reading ?? "-") : (m.reading ?? "-");
  const totalSkor = isSspect ? (m.skor_sspect ?? "-") : (m.skor_toefl_akhir ?? "-");

  const logoUrl = new URL("./img/polnes.png", window.location.href).href;
  const bgGedungUrl = new URL("./img/sertif.jpg", window.location.href).href;

  const urlValidasi = new URL(
    `./validasi-sertifikat.html?nim=${encodeURIComponent(m.nim)}&jenis=${encodeURIComponent(isSspect ? "SSPECT" : "TOEFL")}`,
    window.location.href
  ).href;

  let htmlTabelSkor = "";
  if (isSspect) {
    htmlTabelSkor = `
      <table class="score-grid">
        <thead>
          <tr>
            <th>Listening<br />Comprehension</th>
            <th>Reading<br />Comprehension</th>
            <th style="font-style:normal;">Total Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${sec1}</td>
            <td>${sec3}</td>
            <td>${totalSkor}</td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    htmlTabelSkor = `
      <table class="score-grid">
        <thead>
          <tr>
            <th>Listening<br />Comprehension</th>
            <th>Structure and<br />Written Expression</th>
            <th>Reading<br />Comprehension</th>
            <th style="font-style:normal;">Total Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${sec1}</td>
            <td>${sec2}</td>
            <td>${sec3}</td>
            <td>${totalSkor}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const win = window.open("", "_blank", "width=1160,height=820");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak/mengunduh sertifikat PDF.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Sertifikat ${isSspect ? "SSPECT" : "TOEFL"} - ${m.nama_mahasiswa} (${m.nim})</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #cbd5e1;
          font-family: 'Times New Roman', Times, serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .toolbar-cetak {
          width: 297mm;
          background: #0f172a;
          color: #fff;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: Arial, sans-serif;
          font-size: 13px;
        }
        .toolbar-cetak button {
          padding: 7px 16px;
          border-radius: 6px;
          border: none;
          font-weight: bold;
          cursor: pointer;
          background: #169C53;
          color: #fff;
        }
        .page-a4 {
          width: 297mm;
          height: 210mm;
          position: relative;
          background: #ffffff;
          overflow: hidden;
        }
        .outer-frame {
          position: absolute;
          top: 9mm;
          left: 11mm;
          right: 11mm;
          bottom: 9mm;
          border: 2.2px solid #2b6e44;
          border-top-left-radius: 46mm;
          border-bottom-right-radius: 46mm;
          overflow: hidden;
          background: #ffffff;
        }
        .watermark-gedung {
          position: absolute;
          inset: 0;
          background-image: url('${bgGedungUrl}');
          background-size: cover;
          background-position: center;
          opacity: 0.16;
          filter: saturate(0.85) contrast(1.05);
          pointer-events: none;
        }
        .doc-code {
          position: absolute;
          top: 4.5mm;
          right: 12mm;
          font-family: Arial, sans-serif;
          font-size: 7.5pt;
          color: #334155;
          letter-spacing: 0.3px;
        }
        .kop-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          padding: 5.5mm 14mm 3mm 26mm;
          gap: 5mm;
        }
        .kop-header img {
          width: 17mm;
          height: 17mm;
          object-fit: contain;
        }
        .kop-text {
          font-family: 'Times New Roman', Times, serif;
          color: #1e293b;
          line-height: 1.2;
        }
        .kop-text .ministry {
          font-size: 11pt;
          font-weight: bold;
          letter-spacing: 0.4px;
        }
        .kop-text .campus {
          font-size: 12.5pt;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .kop-text .unit {
          font-size: 11pt;
          font-weight: bold;
          letter-spacing: 0.4px;
        }
        .cert-body {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1mm 24mm 0 24mm;
          color: #111827;
        }
        .cert-title {
          text-align: center;
          margin-bottom: 2.5mm;
        }
        .cert-title h1 {
          margin: 0;
          font-size: 16pt;
          font-weight: bold;
          letter-spacing: 0.8px;
        }
        .cert-title .no-surat {
          font-size: 10.5pt;
          margin-top: 1mm;
        }
        .presented-to {
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 2.5mm;
        }
        .biodata-table {
          width: 155mm;
          border-collapse: collapse;
          font-size: 11pt;
          margin-bottom: 3mm;
        }
        .biodata-table td {
          padding: 1mm 1.5mm;
          vertical-align: top;
        }
        .biodata-table td.lbl {
          width: 46mm;
        }
        .biodata-table td.sep {
          width: 5mm;
          text-align: center;
        }
        .biodata-table td.val-name {
          font-weight: bold;
          font-size: 12.5pt;
          text-transform: uppercase;
        }
        .achieved-line {
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 2.5mm;
        }
        .score-grid {
          width: 172mm;
          border-collapse: collapse;
          text-align: center;
          font-size: 10.5pt;
          margin-bottom: 4.5mm;
        }
        .score-grid th, .score-grid td {
          border: 1.2px solid #1e293b;
          padding: 2mm 3mm;
          background: rgba(255, 255, 255, 0.55);
        }
        .score-grid th {
          font-weight: bold;
          font-style: italic;
        }
        .score-grid td {
          font-size: 12.5pt;
          font-weight: bold;
        }
        .bottom-sign-row {
          width: 172mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-left: 8mm;
        }
        .ttd-box {
          font-size: 10.5pt;
          line-height: 1.35;
        }
        .ttd-space {
          height: 15mm;
        }
        .qr-verify-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: rgba(255, 255, 255, 0.85);
          padding: 2mm;
          border-radius: 2mm;
          border: 0.8px solid #cbd5e1;
        }
        .qr-verify-box span {
          font-family: Arial, sans-serif;
          font-size: 6.5pt;
          font-weight: bold;
          color: #1e293b;
          margin-top: 1mm;
        }
        .footer-kampus {
          position: absolute;
          left: 14mm;
          bottom: 3.5mm;
          z-index: 2;
          font-size: 7.5pt;
          font-style: italic;
          color: #334155;
          line-height: 1.3;
        }
        @media print {
          body { background: none; }
          .toolbar-cetak { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar-cetak">
        <div>
          <strong>Sertifikat Resmi ${isSspect ? "SSPECT" : "TOEFL"}</strong> &mdash; ${m.nama_mahasiswa} (${m.nim})
        </div>
        <button type="button" onclick="window.print()">Cetak / Simpan PDF (A4 Landscape)</button>
      </div>

      <div class="page-a4">
        <div class="doc-code">FM-P2M-04-01-01A/R3</div>

        <div class="outer-frame">
          <div class="watermark-gedung"></div>

          <div class="kop-header">
            <img src="${logoUrl}" alt="Logo POLNES" />
            <div class="kop-text">
              <div class="ministry">KEMENTERIAN PENDIDIKAN, TINGGI, SAINS, DAN TEKNOLOGI</div>
              <div class="campus">POLITEKNIK NEGERI SAMARINDA</div>
              <div class="unit">UPA. BAHASA</div>
            </div>
          </div>

          <div class="cert-body">
            <div class="cert-title">
              <h1>CERTIFICATE OF ACHIEVEMENT</h1>
              <div class="no-surat">No : ${nomor}</div>
            </div>

            <div class="presented-to">This is presented to</div>

            <table class="biodata-table">
              <tr>
                <td class="lbl">Name</td>
                <td class="sep">:</td>
                <td class="val-name">${m.nama_mahasiswa}</td>
              </tr>
              <tr>
                <td class="lbl">NIM</td>
                <td class="sep">:</td>
                <td>${m.nim}</td>
              </tr>
              <tr>
                <td class="lbl">Place, date of birth</td>
                <td class="sep">:</td>
                <td>${ttl}</td>
              </tr>
              <tr>
                <td class="lbl">Program Study</td>
                <td class="sep">:</td>
                <td>${prodiCantik}</td>
              </tr>
              <tr>
                <td class="lbl">Date of test taken</td>
                <td class="sep">:</td>
                <td>${tglTes}</td>
              </tr>
            </table>

            <div class="achieved-line">
              Achieved the following score on <span>${jenisTesText}</span>
            </div>

            ${htmlTabelSkor}

            <div class="bottom-sign-row">
              <div class="ttd-box">
                <div>Samarinda, ${tglTes}</div>
                <div>Head of UPA. Bahasa</div>
                <div class="ttd-space"></div>
                <div><b><u>Dwi Titi Maesaroh, S.Pd., M.Pd.</u></b></div>
                <div>NIP. 198901172024062002</div>
              </div>

              <div class="qr-verify-box">
                <div id="qrcodeContainer"></div>
                <span>Scan to Verify Certificate</span>
              </div>
            </div>
          </div>

          <div class="footer-kampus">
            <div>Jalan Dr. Ciptomangunkusumo Kampus Gunung Panjang Samarinda 75131</div>
            <div>Telepon: 0541-260588, 260553, 262018 FAX 260355</div>
            <div>Laman : www.polnes.ac.id Surel : bahasa@polnes.ac.id ; polnes@polnes.ac.id</div>
          </div>
        </div>
      </div>

      <script>
        new QRCode(document.getElementById("qrcodeContainer"), {
          text: "${urlValidasi}",
          width: 68,
          height: 68,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// ==================== 9. HELPER SIDEBAR & INIT ====================
function toggleMobileSidebar() {
  const sb = document.getElementById("sidebarMenu");
  if (!sb) return;
  sb.classList.toggle("hidden");
  sb.classList.toggle("flex");
}

function toggleSubmenuSidebar(submenuId, chevronId) {
  const sub = document.getElementById(submenuId);
  const chev = document.getElementById(chevronId);
  if (sub) sub.classList.toggle("hidden");
  if (chev) chev.classList.toggle("rotate-180");
}

document.addEventListener("DOMContentLoaded", () => {
  sinkronkanDatabaseRekapan(false);
});