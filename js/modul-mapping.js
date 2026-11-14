// ============================================================================
// MODUL MAPPING & PENCOCOKAN HASIL UJIAN (SECTION 1, SECTION 2, SECTION 3)
// DILENGKAPI ALUR PENOLAKAN SALAH SECTION, PENOLAKAN FILE DUPLIKAT / SUDAH TERSIMPAN,
// KONVERSI SKOR TOEFL, & INTEGRASI REKAPAN INDUK (AUTO 2 DIGIT DEPAN NIM)
// UPA BAHASA - POLITEKNIK NEGERI SAMARINDA
// ============================================================================

// ==================== 1. EKSTRAKSI TAHUN ANGKATAN DARI 2 DIGIT DEPAN NIM ====================
function ekstrakTahunAngkatanDariNimMapping(nimRaw, fallbackTahun = null) {
  const nimBersih = String(nimRaw || "").replace(/\D/g, "");
  if (nimBersih.length >= 2) {
    const duaDigit = parseInt(nimBersih.substring(0, 2), 10);
    if (!isNaN(duaDigit) && duaDigit >= 10 && duaDigit <= 99) {
      return 2000 + duaDigit;
    }
  }
  if (fallbackTahun && !isNaN(parseInt(fallbackTahun, 10))) {
    const thn = parseInt(fallbackTahun, 10);
    return thn < 100 ? 2000 + thn : thn;
  }
  return new Date().getFullYear();
}

// ==================== 2. KAMUS JURUSAN & PROGRAM STUDI BAKU POLNES ====================
const KAMUS_JURUSAN_PRODI_MAPPING = [
  {
    jurusan: "AKUNTANSI",
    prodiList: [
      { label: "D3 - AKUNTANSI", jenjang: "D3", aliases: ["D3 AKUNTANSI", "D3- AKUNTANSI", "D3 - ACCOUNTING", "AKUNTANSI"] },
      { label: "D4 - AKUNTANSI MANAJERIAL", jenjang: "D4", aliases: ["D4 AKUNTANSI MANAJERIAL", "D4- AKUNTANSI MANAJERIAL", "AKUNTANSI MANAJERIAL"] },
      { label: "D4 - KEUANGAN PERBANKAN", jenjang: "D4", aliases: ["D4 KEUANGAN PERBANKAN", "D4- KEUANGAN PERBANKAN", "KEUANGAN PERBANKAN"] }
    ]
  },
  {
    jurusan: "ADMINISTRASI BISNIS",
    prodiList: [
      { label: "D4 - MANAJEMEN PEMASARAN", jenjang: "D4", aliases: ["D4 MANAJEMEN PEMASARAN", "D4- MANAJEMEN PEMASARAN", "MANAJEMEN PEMASARAN"] },
      { label: "D4 - BISNIS DIGITAL", jenjang: "D4", aliases: ["D4 BISNIS DIGITAL", "D4- BISNIS DIGITAL", "BISNIS DIGITAL"] },
      { label: "D3 - ADMINISTRASI BISNIS", jenjang: "D3", aliases: ["D3 ADMINISTRASI BISNIS", "D3- ADMINISTRASI BISNIS", "ADMINISTRASI BISNIS"] }
    ]
  },
  {
    jurusan: "KEMARITIMAN",
    prodiList: [
      {
        label: "D3 - KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN",
        jenjang: "D3",
        aliases: [
          "D3- KPNK", "D3 - KPNK", "D3 KPNK", "KPNK",
          "KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN",
          "D3 - KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN"
        ]
      },
      { label: "D3 - TEKNIKA", jenjang: "D3", aliases: ["D3- TEKNIKA", "D3 - TEKNIKA", "D3 TEKNIKA", "TEKNIKA"] },
      { label: "D3 - NAUTIKA", jenjang: "D3", aliases: ["D3- NAUTIKA", "D3 - NAUTIKA", "D3 NAUTIKA", "NAUTIKA"] }
    ]
  },
  {
    jurusan: "PARIWISATA",
    prodiList: [
      { label: "D3 - PARIWISATA", jenjang: "D3", aliases: ["D3- PARIWISATA", "D3 - PARIWISATA", "D3 PARIWISATA", "PARIWISATA"] },
      { label: "D4 - USAHA PERJALANAN WISATA", jenjang: "D4", aliases: ["D4- USAHA PERJALANAN WISATA", "D4 - USAHA PERJALANAN WISATA", "USAHA PERJALANAN WISATA"] },
      { label: "D4 - PENGELOLAAN PERHOTELAN", jenjang: "D4", aliases: ["D4- PENGELOLAAN PERHOTELAN", "PENGELOLAAN PERHOTELAN"] }
    ]
  },
  {
    jurusan: "TEKNIK SIPIL",
    prodiList: [
      { label: "D3 - TEKNIK SIPIL", jenjang: "D3", aliases: ["D3- TEKNIK SIPIL", "D3 TEKNIK SIPIL", "TEKNIK SIPIL"] },
      { label: "D4 - REKAYASA JALAN DAN JEMBATAN", jenjang: "D4", aliases: ["D4- REKAYASA JALAN DAN JEMBATAN", "REKAYASA JALAN DAN JEMBATAN"] },
      { label: "D4 - TEKNOLOGI REKAYASA KONSTRUKSI BANGUNAN GEDUNG", jenjang: "D4", aliases: ["D4- TEKNOLOGI REKAYASA KONSTRUKSI", "TEKNOLOGI REKAYASA KONSTRUKSI"] },
      { label: "D4 - ARSITEKTUR BANGUNAN GEDUNG", jenjang: "D4", aliases: ["D4- ARSITEKTUR BANGUNAN GEDUNG", "D4 - ARSITEKTUR BANGUNAN GEDUNG", "ARSITEKTUR BANGUNAN GEDUNG"] }
    ]
  },
  {
    jurusan: "TEKNIK ELEKTRO",
    prodiList: [
      { label: "D3 - TEKNIK LISTRIK", jenjang: "D3", aliases: ["D3- TEKNIK LISTRIK", "D3 TEKNIK LISTRIK"] },
      { label: "D4 - TEKNIK LISTRIK", jenjang: "D4", aliases: ["D4- TEKNIK LISTRIK", "D4 TEKNIK LISTRIK"] }
    ]
  },
  {
    jurusan: "TEKNIK MESIN",
    prodiList: [
      { label: "D3 - PERAWATAN DAN PERBAIKAN MESIN", jenjang: "D3", aliases: ["D3- PERAWATAN DAN PERBAIKAN MESIN", "PERAWATAN DAN PERBAIKAN MESIN"] },
      { label: "D3 - TEKNIK ALAT BERAT", jenjang: "D3", aliases: ["D3- TEKNIK ALAT BERAT", "TEKNIK ALAT BERAT"] },
      { label: "D4 - TEKNIK MESIN PRODUKSI DAN PERAWATAN", jenjang: "D4", aliases: ["D4- TEKNIK MESIN PRODUKSI DAN PERAWATAN", "TEKNIK MESIN PRODUKSI"] }
    ]
  },
  {
    jurusan: "TEKNIK KIMIA",
    prodiList: [
      { label: "D3 - PETRO DAN OLEO KIMIA", jenjang: "D3", aliases: ["D3- PETRO DAN OLEO KIMIA", "PETRO DAN OLEO KIMIA"] },
      { label: "D4 - TEKNOLOGI KIMIA INDUSTRI", jenjang: "D4", aliases: ["D4- TEKNOLOGI KIMIA INDUSTRI", "TEKNOLOGI KIMIA INDUSTRI"] }
    ]
  },
  {
    jurusan: "TEKNOLOGI INFORMASI",
    prodiList: [
      { label: "D3 - TEKNIK INFORMATIKA", jenjang: "D3", aliases: ["D3- TEKNIK INFORMATIKA", "TEKNIK INFORMATIKA"] },
      { label: "D3 - TEKNIK KOMPUTER", jenjang: "D3", aliases: ["D3- TEKNIK KOMPUTER", "TEKNIK KOMPUTER"] },
      { label: "D4 - TEKNIK INFORMATIKA MULTIMEDIA", jenjang: "D4", aliases: ["D4- TEKNIK INFORMATIKA MULTIMEDIA", "TEKNIK INFORMATIKA MULTIMEDIA"] },
      { label: "D4 - TEKNOLOGI REKAYASA KOMPUTER", jenjang: "D4", aliases: ["D4- TEKNOLOGI REKAYASA KOMPUTER", "TEKNOLOGI REKAYASA KOMPUTER"] }
    ]
  }
];

function petakanJurusanProdiMapping(prodiRaw, jenjangRaw = "") {
  const clean = String(prodiRaw || "").trim().toUpperCase().replace(/\s+/g, " ");
  const jenjClean = String(jenjangRaw || "").trim().toUpperCase();

  for (const grp of KAMUS_JURUSAN_PRODI_MAPPING) {
    for (const p of grp.prodiList) {
      for (const alias of p.aliases) {
        const aNorm = alias.toUpperCase().replace(/\s+/g, " ");
        if (clean === aNorm || clean.includes(aNorm) || (aNorm.includes(clean) && clean.length >= 6)) {
          if (clean.includes("TEKNIK LISTRIK")) {
            const isD4 = clean.startsWith("D4") || jenjClean === "D4";
            return {
              jurusan: "TEKNIK ELEKTRO",
              prodi: isD4 ? "D4 - TEKNIK LISTRIK" : "D3 - TEKNIK LISTRIK",
              jenjang: isD4 ? "D4" : "D3"
            };
          }
          return {
            jurusan: grp.jurusan,
            prodi: p.label,
            jenjang: jenjClean || p.jenjang
          };
        }
      }
    }
  }

  return {
    jurusan: "JURUSAN LAINNYA",
    prodi: clean || "-",
    jenjang: jenjClean || (clean.startsWith("D4") ? "D4" : "D3")
  };
}

// ==================== 3. TABEL KONVERSI SKOR TOEFL PBT STANDAR ====================
const TABEL_KONVERSI_TOEFL = {
  s1: [
    24,25,26,27,28,29,30,31,32,32,33,35,37,38,39,41,41,42,43,44,
    45,45,46,47,47,48,48,49,49,50,51,51,52,52,53,54,54,55,56,57,
    57,58,59,60,61,62,63,65,66,67,68
  ],
  s2: [
    20,20,21,22,23,25,26,27,29,31,33,35,36,37,38,40,40,41,42,43,
    44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,60,61,63,65,67,68
  ],
  s3: [
    21,22,23,23,24,25,26,27,28,28,29,30,31,32,34,35,36,37,38,39,
    40,41,42,43,43,44,45,46,46,47,48,48,49,50,51,52,52,53,54,54,
    55,56,57,58,59,60,61,63,65,66,67
  ]
};

function hitungSkorKonversiToefl(benarS1, benarS2, benarS3, gunakanKonversi = true) {
  const b1 = Math.max(0, parseInt(benarS1) || 0);
  const b2 = Math.max(0, parseInt(benarS2) || 0);
  const b3 = Math.max(0, parseInt(benarS3) || 0);

  if (!gunakanKonversi) {
    const totalLangsung = Math.round(((b1 + b2 + b3) * 10) / 3);
    return { sec1: b1, sec2: b2, sec3: b3, total: totalLangsung };
  }

  const idx1 = Math.min(b1, TABEL_KONVERSI_TOEFL.s1.length - 1);
  const idx2 = Math.min(b2, TABEL_KONVERSI_TOEFL.s2.length - 1);
  const idx3 = Math.min(b3, TABEL_KONVERSI_TOEFL.s3.length - 1);

  const k1 = b1 > 0 ? TABEL_KONVERSI_TOEFL.s1[idx1] : 0;
  const k2 = b2 > 0 ? TABEL_KONVERSI_TOEFL.s2[idx2] : 0;
  const k3 = b3 > 0 ? TABEL_KONVERSI_TOEFL.s3[idx3] : 0;

  const total = Math.round(((k1 + k2 + k3) * 10) / 3);
  return { sec1: k1, sec2: k2, sec3: k3, total };
}

// ==================== 4. ALUR PENOLAKAN: VALIDASI SALAH SECTION & DUPLIKASI FILE ====================
const STORAGE_KEY_RIWAYAT_FILE_TERCOCOKKAN = "upa_riwayat_file_mapping_tersimpan_v1";

function ambilRiwayatFileTersimpan() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RIWAYAT_FILE_TERCOCOKKAN) || "[]");
  } catch {
    return [];
  }
}

function catatRiwayatFileTersimpan(daftarNamaFile, kodeSesi = "") {
  const lama = ambilRiwayatFileTersimpan();
  const baru = [...new Set([...lama, ...daftarNamaFile.filter(Boolean), kodeSesi].filter(Boolean))];
  localStorage.setItem(STORAGE_KEY_RIWAYAT_FILE_TERCOCOKKAN, JSON.stringify(baru));
}

/**
 * Validasi 1: Mengecek apakah file Excel sudah pernah dicocokkan & disimpan permanen sebelumnya
 * atau sedang terpasang ganda di slot section lain pada sesi yang sama.
 */
function cekPenolakanFileDuplikat(namaFile, nomorSectionTarget) {
  const namaClean = String(namaFile || "").trim().toUpperCase();
  if (!namaClean) return { ditolak: false };

  // A. Cek apakah file yang sama persis sedang terpasang di slot Section lain
  const slotLain = [1, 2, 3].filter(s => s !== nomorSectionTarget);
  for (const s of slotLain) {
    const fileDiSlot = window.mappingState.namaFilePerSection[s];
    if (fileDiSlot && fileDiSlot.toUpperCase() === namaClean) {
      return {
        ditolak: true,
        alasan: `UNGGAHAN DITOLAK (FILE GANDA):\nFile "${namaFile}" sudah terpasang di slot Section ${s}.\nAnda tidak boleh mengunggah file yang sama ke Section ${nomorSectionTarget}.`
      };
    }
  }

  // B. Cek apakah file ini sudah pernah dicocokkan & disimpan permanen ke database
  const riwayatTersimpan = ambilRiwayatFileTersimpan();
  if (riwayatTersimpan.some(f => String(f).toUpperCase() === namaClean)) {
    return {
      ditolak: true,
      alasan: `UNGGAHAN DITOLAK (SUDAH PERNAH DICOCOKKAN):\nFile "${namaFile}" sudah pernah dicocokkan dan disimpan permanen ke database sebelumnya.\nSistem menolak unggah ulang agar data nilai mahasiswa tidak ganda.`
    };
  }

  return { ditolak: false };
}

/**
 * Validasi 2: Mengecek kecocokan kamar Section (Section 1 vs Section 2 vs Section 3)
 * berdasarkan nama file, header kolom Excel, dan nama sheet di dalam file Excel.
 */
function cekPenolakanSalahSection(namaFile, workbook, rows, nomorSectionTarget) {
  const namaUpper = String(namaFile || "").toUpperCase();
  const sheetNamesUpper = (workbook?.SheetNames || []).join(" ").toUpperCase();
  const headerKeysUpper = rows && rows.length > 0 ? Object.keys(rows[0]).join(" ").toUpperCase() : "";
  const gabungTeks = `${namaUpper} ${sheetNamesUpper} ${headerKeysUpper}`;

  // Deteksi pola eksplisit Section 1 / Listening, Section 2 / Structure, Section 3 / Reading
  const deteksiSec1 = /\b(SECTION[\s_-]*1|SEC[\s_-]*1|S1|LISTENING)\b/.test(gabungTeks);
  const deteksiSec2 = /\b(SECTION[\s_-]*2|SEC[\s_-]*2|S2|STRUCTURE)\b/.test(gabungTeks);
  const deteksiSec3 = /\b(SECTION[\s_-]*3|SEC[\s_-]*3|S3|READING)\b/.test(gabungTeks);

  let sectionTerdeteksi = null;
  // Hitung hanya jika satu section terdeteksi dominan (tidak ambigu)
  const jumlahDeteksi = [deteksiSec1, deteksiSec2, deteksiSec3].filter(Boolean).length;
  if (jumlahDeteksi === 1) {
    if (deteksiSec1) sectionTerdeteksi = 1;
    if (deteksiSec2) sectionTerdeteksi = 2;
    if (deteksiSec3) sectionTerdeteksi = 3;
  }

  if (sectionTerdeteksi !== null && sectionTerdeteksi !== nomorSectionTarget) {
    const labelMap = {
      1: "Section 1 (Listening)",
      2: "Section 2 (Structure)",
      3: "Section 3 (Reading)"
    };
    return {
      ditolak: true,
      alasan:
        `UNGGAHAN DITOLAK (SALAH TEMPAT SECTION):\n` +
        `File "${namaFile}" terdeteksi sebagai ${labelMap[sectionTerdeteksi]},\n` +
        `tetapi Anda mengunggahnya di tombol ${labelMap[nomorSectionTarget]}.\n\n` +
        `Silakan unggah file tersebut pada tombol ${labelMap[sectionTerdeteksi]} yang sesuai.`
    };
  }

  // Validasi tambahan khusus Section 2 (Structure maksimal 40 soal; jika ada skor mentah > 40 & <= 50, kemungkinan besar Sec 1 atau Sec 3)
  if (nomorSectionTarget === 2 && Array.isArray(rows) && rows.length > 0) {
    const nilaiList = rows.map(r => {
      const val = r.Score || r.Skor || r.Nilai || r.Correct || r.Benar || r.Total || 0;
      return parseFloat(val) || 0;
    }).filter(v => v > 0);

    const adaSkorAntara41Dan50 = nilaiList.some(v => v >= 41 && v <= 50);
    const tidakAdaSkorKonversiTinggi = nilaiList.every(v => v <= 50);
    if (adaSkorAntara41Dan50 && tidakAdaSkorKonversiTinggi) {
      return {
        ditolak: true,
        alasan:
          `UNGGAHAN DITOLAK (JUMLAH SOAL TIDAK SESUAI SECTION 2):\n` +
          `Section 2 (Structure) maksimal memiliki 40 soal, namun file "${namaFile}" memuat jumlah benar di atas 40 (41–50).\n` +
          `File ini kemungkinan milik Section 1 (Listening) atau Section 3 (Reading).`
      };
    }
  }

  return { ditolak: false };
}

// ==================== 5. STATE MODUL MAPPING ====================
window.mappingState = {
  sec1Raw: {},
  sec2Raw: {},
  sec3Raw: {},
  namaFilePerSection: { 1: "", 2: "", 3: "" },
  daftarJadwalDb: [],
  jadwalTerpilih: null,
  pesertaTerjadwalDb: [],
  hasilSinkronisasiList: [],
  indexSedangUbahBind: null
};

// ==================== 6. MUAT JADWAL & PESERTA TERJADWAL DARI SUPABASE ====================
async function muatJadwalUntukMapping() {
  if (!window.supabaseClient) return;

  try {
    const { data: dataJadwal, error } = await window.supabaseClient
      .from("jadwal_tes")
      .select("*")
      .order("tanggal", { ascending: false });

    if (!error && Array.isArray(dataJadwal)) {
      window.mappingState.daftarJadwalDb = dataJadwal;
      isiDropdownJadwalMapping(dataJadwal);
    }
  } catch (err) {
    console.warn("Info muat jadwal mapping:", err.message);
  }
}

function isiDropdownJadwalMapping(listJadwal) {
  const selJadwal = document.getElementById("selectJadwalMapping") || document.getElementById("filterJadwalTes");
  if (!selJadwal) return;

  selJadwal.innerHTML = `<option value="">-- Pilih Jadwal Tes / Otomatis Cocokkan --</option>` +
    listJadwal.map(j => {
      const label = `${j.jenis_tes || "TOEFL"} • ${j.kelas || "-"} • ${j.ruangan || j.lab || "-"} • ${j.tanggal || "-"} • ${j.sesi || "-"}`;
      return `<option value="${j.id}">${label}</option>`;
    }).join("");
}

async function muatPesertaByJadwalId(jadwalId) {
  if (!window.supabaseClient || !jadwalId) return [];

  const { data, error } = await window.supabaseClient
    .from("peserta_jadwal_tes")
    .select("*")
    .eq("jadwal_id", jadwalId)
    .order("no_meja", { ascending: true });

  if (error) {
    console.warn("Gagal memuat peserta jadwal:", error.message);
    return [];
  }
  return data || [];
}

// ==================== 7. PEMBACAAN FILE EXCEL SECTION 1, SECTION 2, SECTION 3 ====================
function normalisasiIdMeja(rawId) {
  const str = String(rawId || "").trim().toUpperCase();
  if (!str) return "";
  const angka = str.replace(/\D/g, "");
  if (angka && (str.startsWith("STUDENT") || str.startsWith("PC") || str.startsWith("MEJA") || /^\d+$/.test(str))) {
    return "STUDENT" + angka.padStart(2, "0");
  }
  return str;
}

function handleUploadExcelSection(event, nomorSection) {
  const inputEl = event.target;
  const file = inputEl.files[0];
  if (!file) return;

  // CEK ALUR PENOLAKAN 1: Apakah file sudah pernah dicocokkan atau duplikat di slot lain?
  const cekDuplikat = cekPenolakanFileDuplikat(file.name, nomorSection);
  if (cekDuplikat.ditolak) {
    alert(cekDuplikat.alasan);
    inputEl.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows || rows.length === 0) {
        alert(`UNGGAHAN DITOLAK:\nFile "${file.name}" kosong atau tidak memiliki baris data yang valid.`);
        inputEl.value = "";
        return;
      }

      // CEK ALUR PENOLAKAN 2: Apakah file salah kamar Section (misal Sec 2 diunggah ke Sec 3)?
      const cekSalahSection = cekPenolakanSalahSection(file.name, workbook, rows, nomorSection);
      if (cekSalahSection.ditolak) {
        alert(cekSalahSection.alasan);
        inputEl.value = "";
        return;
      }

      // Lolos validasi! Tampilkan nama file di bawah tombol unggah
      window.mappingState.namaFilePerSection[nomorSection] = file.name;
      const labelFileEl = document.getElementById(`labelFileSec${nomorSection}`) ||
        document.getElementById(`namaFileSec${nomorSection}`);
      if (labelFileEl) {
        labelFileEl.textContent = file.name;
      }

      const mapHasilSec = {};

      rows.forEach((row, idx) => {
        const rawMeja = row.ID_Meja || row.ID_MEJA || row.Student_ID || row.User || row.Username ||
          row.PC || row.No_Meja || row.Meja || `STUDENT${String(idx + 1).padStart(2, "0")}`;
        const idMeja = normalisasiIdMeja(rawMeja);

        const rawNilai = row.Score || row.Skor || row.Nilai || row.Correct || row.Benar ||
          row.Total || row[`Section_${nomorSection}`] || row[`S${nomorSection}`] || 0;
        const skorNum = parseFloat(rawNilai) || 0;

        const nimExcel = String(row.NIM || row.nim || "").trim();
        const namaExcel = String(row.Nama || row.NAMA || row.nama || "").trim().toUpperCase();
        const prodiExcel = String(row.Program_Studi || row.Prodi || row.Kelas || "").trim();

        if (idMeja) {
          mapHasilSec[idMeja] = {
            idMeja,
            skor: skorNum,
            nimExcel,
            namaExcel,
            prodiExcel
          };
        }
      });

      if (nomorSection === 1) window.mappingState.sec1Raw = mapHasilSec;
      if (nomorSection === 2) window.mappingState.sec2Raw = mapHasilSec;
      if (nomorSection === 3) window.mappingState.sec3Raw = mapHasilSec;

      await otomatisCocokkanJadwalDanGabungkan(file.name);
    } catch (err) {
      alert(`Gagal membaca Excel Section ${nomorSection}: ` + err.message);
      inputEl.value = "";
    }
  };
  reader.readAsBinaryString(file);
}

// ==================== 8. PENCOCOKAN OTOMATIS JADWAL & PENGGABUNGAN S1 + S2 + S3 ====================
async function otomatisCocokkanJadwalDanGabungkan(namaFileTerbaru = "") {
  const { sec1Raw, sec2Raw, sec3Raw, daftarJadwalDb } = window.mappingState;

  const semuaIdMeja = [...new Set([
    ...Object.keys(sec1Raw),
    ...Object.keys(sec2Raw),
    ...Object.keys(sec3Raw)
  ])].sort();

  let jadwalAktif = window.mappingState.jadwalTerpilih;
  if (!jadwalAktif && daftarJadwalDb.length > 0) {
    const namaUpper = namaFileTerbaru.toUpperCase();
    jadwalAktif = daftarJadwalDb.find(j => {
      const tglMatch = j.tanggal && namaUpper.includes(String(j.tanggal).split("-").reverse().join("-"));
      const kelasMatch = j.kelas && namaUpper.includes(String(j.kelas).toUpperCase().replace(/\s+/g, ""));
      return tglMatch || kelasMatch;
    }) || daftarJadwalDb[0];

    window.mappingState.jadwalTerpilih = jadwalAktif;
  }

  let pesertaDb = window.mappingState.pesertaTerjadwalDb;
  if (jadwalAktif && (!pesertaDb || pesertaDb.length === 0)) {
    pesertaDb = await muatPesertaByJadwalId(jadwalAktif.id);
    window.mappingState.pesertaTerjadwalDb = pesertaDb;
  }

  updateBannerJadwalCocok(jadwalAktif, semuaIdMeja.length, pesertaDb.length);

  const hasilGabungan = semuaIdMeja.map((idMeja, idx) => {
    const d1 = sec1Raw[idMeja] || {};
    const d2 = sec2Raw[idMeja] || {};
    const d3 = sec3Raw[idMeja] || {};

    const cocokDb = pesertaDb.find(p => normalisasiIdMeja(p.no_meja || p.id_meja) === idMeja) || pesertaDb[idx] || {};

    const nim = String(cocokDb.nim || d1.nimExcel || d2.nimExcel || d3.nimExcel || "").trim();
    const nama = String(cocokDb.nama_mahasiswa || cocokDb.nama || d1.namaExcel || d2.namaExcel || d3.namaExcel || "BELUM TER-BIND").toUpperCase();
    const prodiRaw = String(cocokDb.program_studi || cocokDb.prodi || jadwalAktif?.kelas || d1.prodiExcel || "-").trim();
    const infoProdi = petakanJurusanProdiMapping(prodiRaw, cocokDb.jenjang);
    const tahunAngkatan = ekstrakTahunAngkatanDariNimMapping(nim);

    const rawS1 = d1.skor || 0;
    const rawS2 = d2.skor || 0;
    const rawS3 = d3.skor || 0;

    const sudahKonversi = rawS1 > 50 || rawS2 > 40 || rawS3 > 50;
    const hasilSkor = hitungSkorKonversiToefl(rawS1, rawS2, rawS3, !sudahKonversi);

    return {
      id_meja: idMeja,
      nim,
      nama_mahasiswa: nama,
      tahun_angkatan: tahunAngkatan,
      jenjang: infoProdi.jenjang,
      jurusan: infoProdi.jurusan,
      program_studi: infoProdi.prodi,
      s1_mentah: rawS1,
      s2_mentah: rawS2,
      s3_mentah: rawS3,
      section_1: hasilSkor.sec1,
      section_2: hasilSkor.sec2,
      section_3: hasilSkor.sec3,
      total_skor: hasilSkor.total,
      terbind: Boolean(nim && nama !== "BELUM TER-BIND")
    };
  });

  window.mappingState.hasilSinkronisasiList = hasilGabungan;
  renderTabelPratinjauMapping(hasilGabungan, pesertaDb.length);
}

function updateBannerJadwalCocok(jadwal, jmlExcel, jmlDb) {
  const bannerText = document.getElementById("textJadwalCocok");
  const badgeTerjadwal = document.getElementById("badgeJumlahTerjadwalDb");
  const badgeRatio = document.getElementById("badgeRatioPesertaExcel");

  if (bannerText && jadwal) {
    bannerText.textContent = `Jadwal Cocok: ${jadwal.jenis_tes || "TOEFL"} • Kelas ${jadwal.kelas || "-"} • ${jadwal.ruangan || jadwal.lab || "Lab"} • ${jadwal.tanggal || "-"} • ${jadwal.sesi || "-"}`;
  }
  if (badgeTerjadwal) {
    badgeTerjadwal.textContent = `${jmlDb || jmlExcel} Terjadwal di DB`;
  }
  if (badgeRatio) {
    badgeRatio.textContent = `${jmlExcel} Peserta (Excel) / ${jmlDb || jmlExcel} Jadwal`;
  }
}

// ==================== 9. RENDER TABEL PRATINJAU HASIL SINKRONISASI ====================
function renderTabelPratinjauMapping(list, totalJadwalDb = 0) {
  const tbody = document.getElementById("tbodyPratinjauMapping") || document.getElementById("tbodyHasilMapping");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="px-6 py-10 text-center text-slate-400 italic">
          Silakan unggah file Excel Section 1, Section 2, dan Section 3 untuk memulai pencocokan otomatis.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => {
    const warnaNama = item.terbind ? "text-[#169C53] font-extrabold" : "text-amber-600 font-bold italic";
    const duaDigitNim = item.nim ? item.nim.substring(0, 2) : "";

    return `
      <tr class="hover:bg-slate-50/90 transition-colors border-b border-slate-100">
        <td class="px-4 py-3.5 font-mono font-extrabold text-slate-800">${item.id_meja}</td>
        <td class="px-4 py-3.5 font-mono font-bold text-slate-800">
          ${item.nim ? `<span class="underline decoration-emerald-400">${duaDigitNim}</span>${item.nim.substring(2)}` : "-"}
          ${item.nim ? `<span class="block text-[10px] font-sans text-slate-400">Angkatan ${item.tahun_angkatan}</span>` : ""}
        </td>
        <td class="px-4 py-3.5 ${warnaNama} uppercase">${item.nama_mahasiswa}</td>
        <td class="px-4 py-3.5">
          <div class="font-bold text-slate-700">${item.program_studi}</div>
          <div class="text-[10px] font-bold text-slate-400 uppercase">${item.jurusan}</div>
        </td>
        <td class="px-4 py-3.5 text-center font-mono font-bold text-slate-700">${item.section_1}</td>
        <td class="px-4 py-3.5 text-center font-mono font-bold text-slate-700">${item.section_2}</td>
        <td class="px-4 py-3.5 text-center font-mono font-bold text-slate-700">${item.section_3}</td>
        <td class="px-4 py-3.5 text-center font-mono font-extrabold text-base text-[#169C53]">${item.total_skor}</td>
        <td class="px-4 py-3.5 text-center">
          <button type="button" onclick="bukaModalUbahBind(${idx})" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#169C53] border border-slate-200 text-[11px] font-extrabold inline-flex items-center gap-1.5 transition-all">
            <i class="ri-link"></i>
            <span>UBAH BIND</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// ==================== 10. FITUR UBAH BIND PESERTA PER MEJA ====================
function bukaModalUbahBind(indexBaris) {
  const item = window.mappingState.hasilSinkronisasiList[indexBaris];
  if (!item) return;

  window.mappingState.indexSedangUbahBind = indexBaris;

  const nimBaru = prompt(
    `Ubah Bind Peserta untuk ${item.id_meja}\nMasukkan NIM Mahasiswa (2 digit depan otomatis menjadi Tahun Angkatan):`,
    item.nim || ""
  );
  if (nimBaru === null) return;

  const namaBaru = prompt(
    `Masukkan Nama Lengkap Mahasiswa untuk NIM ${nimBaru.trim()}:`,
    item.nama_mahasiswa !== "BELUM TER-BIND" ? item.nama_mahasiswa : ""
  );
  if (namaBaru === null) return;

  const prodiBaru = prompt(
    `Masukkan Program Studi (contoh: D4 - ARSITEKTUR BANGUNAN GEDUNG atau D3 - KPNK):`,
    item.program_studi !== "-" ? item.program_studi : "D4 - ARSITEKTUR BANGUNAN GEDUNG"
  );
  if (prodiBaru === null) return;

  const nimClean = nimBaru.trim();
  const infoProdi = petakanJurusanProdiMapping(prodiBaru);
  const tahunAuto = ekstrakTahunAngkatanDariNimMapping(nimClean);

  window.mappingState.hasilSinkronisasiList[indexBaris] = {
    ...item,
    nim: nimClean,
    nama_mahasiswa: namaBaru.trim().toUpperCase(),
    tahun_angkatan: tahunAuto,
    jenjang: infoProdi.jenjang,
    jurusan: infoProdi.jurusan,
    program_studi: infoProdi.prodi,
    terbind: Boolean(nimClean && namaBaru.trim())
  };

  renderTabelPratinjauMapping(window.mappingState.hasilSinkronisasiList);
}

// ==================== 11. SIMPAN PERMANEN KE DATABASE (TERMASUK PENOLAKAN SESI GANDA) ====================
function deteksiTargetKategoriRekapan() {
  const selTarget = document.getElementById("selectTargetKategoriRekapan") ||
    document.getElementById("targetKategoriRekapan");
  const val = String(selTarget?.value || "").toUpperCase();

  if (val.includes("SSPECT")) return "SSPECT";
  if (val.includes("LATIHAN") || val.includes("PRACTICE")) return "LATIHAN";
  if (val.includes("REM") && val.includes("3")) return "REMEDIAL_3";
  if (val.includes("REM") && val.includes("2")) return "REMEDIAL_2";
  if (val.includes("REM")) return "REMEDIAL_1";
  return "TOEFL";
}

async function simpanPermanenKeDatabase() {
  const list = window.mappingState.hasilSinkronisasiList;
  if (!list || list.length === 0) {
    alert("Belum ada data hasil pencocokan untuk disimpan. Unggah Excel Section 1, 2, dan 3 terlebih dahulu.");
    return;
  }

  const dataValid = list.filter(i => i.nim && i.nama_mahasiswa && i.nama_mahasiswa !== "BELUM TER-BIND");
  if (dataValid.length === 0) {
    alert("Tidak ada baris dengan NIM dan Nama mahasiswa yang valid. Gunakan tombol UBAH BIND terlebih dahulu.");
    return;
  }

  if (!window.supabaseClient) {
    alert("Koneksi database Supabase belum tersedia.");
    return;
  }

  const targetKategori = deteksiTargetKategoriRekapan();
  const jadwalAktif = window.mappingState.jadwalTerpilih || {};
  const tanggalTes = jadwalAktif.tanggal || new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // Cek apakah kombinasi Jadwal + Kategori ini sudah pernah disimpan permanen sebelumnya
  const kodeSesiUnik = `SESI_${jadwalAktif.id || "MANUAL"}_${targetKategori}_${Object.values(window.mappingState.namaFilePerSection).join("_")}`.toUpperCase();
  const riwayatTersimpan = ambilRiwayatFileTersimpan();
  if (riwayatTersimpan.includes(kodeSesiUnik)) {
    alert(
      `PENYIMPANAN DITOLAK (SUDAH PERNAH DISIMPAN):\n` +
      `Hasil pencocokan untuk sesi dan kategori "${targetKategori}" ini sudah pernah disimpan permanen ke database sebelumnya.`
    );
    return;
  }

  const btnSimpan = document.getElementById("btnSimpanPermanenMapping") ||
    document.querySelector("[onclick*='simpanPermanenKeDatabase']");
  if (btnSimpan) {
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> <span>Menyimpan ${dataValid.length} Data...</span>`;
  }

  try {
    // 1. Cek di database apakah seluruh NIM pada batch ini sudah memiliki nilai identik pada kategori target
    const nims = [...new Set(dataValid.map(d => d.nim))];
    const { data: existingRows, error: errFetch } = await window.supabaseClient
      .from("arsip_master_rekapan")
      .select("*")
      .in("nim", nims);

    if (errFetch) throw errFetch;

    const mapExisting = {};
    (existingRows || []).forEach(r => {
      mapExisting[String(r.nim)] = r;
    });

    // Cek apakah semua peserta di batch ini sudah punya skor yang sama persis di kolom target (tanda batch sudah pernah dicocokkan)
    const semuaSudahIdentik = dataValid.every(item => {
      const lama = mapExisting[item.nim];
      if (!lama) return false;
      if (targetKategori === "SSPECT") return Number(lama.skor_sspect) === Number(item.total_skor);
      if (targetKategori === "LATIHAN") return Number(lama.skor_latihan) === Number(item.total_skor);
      if (targetKategori === "REMEDIAL_1") return Number(lama.remedial_1) === Number(item.total_skor);
      if (targetKategori === "REMEDIAL_2") return Number(lama.remedial_2) === Number(item.total_skor);
      if (targetKategori === "REMEDIAL_3") return Number(lama.remedial_3) === Number(item.total_skor);
      return Number(lama.skor_toefl) === Number(item.total_skor);
    });

    if (semuaSudahIdentik) {
      alert(
        `PENYIMPANAN DITOLAK (DATA SUDAH ADA DI DATABASE):\n` +
        `Seluruh ${dataValid.length} peserta dalam pencocokan ini sudah tercatat dengan nilai yang sama pada kategori "${targetKategori}" di Rekapan Master.`
      );
      catatRiwayatFileTersimpan(Object.values(window.mappingState.namaFilePerSection), kodeSesiUnik);
      return;
    }

    // 2. Simpan log ke riwayat `hasil_tes_toefl`
    const logPayloads = dataValid.map(item => ({
      nim: item.nim,
      nama_mahasiswa: item.nama_mahasiswa,
      program_studi: item.program_studi,
      jenjang: item.jenjang,
      tahun_angkatan: ekstrakTahunAngkatanDariNimMapping(item.nim),
      tipe_ujian: targetKategori,
      listening: item.section_1,
      structure: item.section_2,
      reading: item.section_3,
      total_skor: item.total_skor,
      tanggal_tes: tanggalTes
    }));

    await window.supabaseClient
      .from("hasil_tes_toefl")
      .insert(logPayloads)
      .then(() => {})
      .catch(() => {});

    // 3. Gabungkan (merge) skor baru ke `arsip_master_rekapan` dengan aturan 2 digit depan NIM = Tahun Angkatan
    const upsertRekapanPayloads = dataValid.map(item => {
      const lama = mapExisting[item.nim] || {};
      const tahunAutoNim = ekstrakTahunAngkatanDariNimMapping(item.nim, lama.tahun_angkatan);

      const rec = {
        nim: item.nim,
        nama_mahasiswa: item.nama_mahasiswa || lama.nama_mahasiswa,
        tahun_angkatan: tahunAutoNim,
        jenjang: item.jenjang || lama.jenjang,
        jurusan: item.jurusan || lama.jurusan,
        program_studi: item.program_studi || lama.program_studi,
        skor_sspect: lama.skor_sspect || null,
        sspect_listening: lama.sspect_listening || null,
        sspect_structure: lama.sspect_structure || null,
        sspect_reading: lama.sspect_reading || null,
        skor_latihan: lama.skor_latihan || null,
        skor_toefl: lama.skor_toefl || null,
        remedial_1: lama.remedial_1 || null,
        remedial_2: lama.remedial_2 || null,
        remedial_3: lama.remedial_3 || null,
        listening: lama.listening || null,
        structure: lama.structure || null,
        reading: lama.reading || null,
        total_skor: lama.total_skor || null,
        tanggal_tes: tanggalTes
      };

      if (targetKategori === "SSPECT") {
        rec.skor_sspect = item.total_skor;
        rec.sspect_listening = item.section_1;
        rec.sspect_structure = item.section_2;
        rec.sspect_reading = item.section_3;
      } else if (targetKategori === "LATIHAN") {
        rec.skor_latihan = item.total_skor;
      } else if (targetKategori === "REMEDIAL_1") {
        rec.remedial_1 = item.total_skor;
        rec.listening = item.section_1;
        rec.structure = item.section_2;
        rec.reading = item.section_3;
      } else if (targetKategori === "REMEDIAL_2") {
        rec.remedial_2 = item.total_skor;
        rec.listening = item.section_1;
        rec.structure = item.section_2;
        rec.reading = item.section_3;
      } else if (targetKategori === "REMEDIAL_3") {
        rec.remedial_3 = item.total_skor;
        rec.listening = item.section_1;
        rec.structure = item.section_2;
        rec.reading = item.section_3;
      } else {
        rec.skor_toefl = item.total_skor;
        rec.listening = item.section_1;
        rec.structure = item.section_2;
        rec.reading = item.section_3;
      }

      const kandidatAkhir = [rec.skor_toefl, rec.remedial_1, rec.remedial_2, rec.remedial_3].filter(v => v && v > 0);
      if (kandidatAkhir.length > 0) {
        rec.total_skor = Math.max(...kandidatAkhir);
      }

      return rec;
    });

    const { error: errUpsert } = await window.supabaseClient
      .from("arsip_master_rekapan")
      .upsert(upsertRekapanPayloads, { onConflict: "nim" });

    if (errUpsert) throw errUpsert;

    // Catat nama file & kode sesi ke daftar riwayat agar tidak bisa diunggah/dicocokkan ulang
    catatRiwayatFileTersimpan(Object.values(window.mappingState.namaFilePerSection), kodeSesiUnik);

    alert(
      `Berhasil menyimpan ${upsertRekapanPayloads.length} data hasil tes (${targetKategori}) ke Rekapan Master!\n` +
      `Setiap mahasiswa otomatis masuk ke Tahun Angkatan berdasarkan 2 digit depan NIM, dan file sesi ini telah dikunci agar tidak bisa diunggah ganda.`
    );
  } catch (err) {
    console.error("Gagal simpan permanen mapping:", err);
    alert("Gagal menyimpan permanen ke database: " + err.message);
  } finally {
    if (btnSimpan) {
      btnSimpan.disabled = false;
      btnSimpan.innerHTML = `<i class="ri-save-3-line"></i> <span>Simpan Permanen ke Database</span>`;
    }
  }
}

// ==================== 12. INISIALISASI EVENT LISTENER ====================
document.addEventListener("DOMContentLoaded", () => {
  muatJadwalUntukMapping();

  const inSec1 = document.getElementById("inputExcelSec1") || document.getElementById("fileSec1");
  const inSec2 = document.getElementById("inputExcelSec2") || document.getElementById("fileSec2");
  const inSec3 = document.getElementById("inputExcelSec3") || document.getElementById("fileSec3");

  if (inSec1) inSec1.addEventListener("change", (e) => handleUploadExcelSection(e, 1));
  if (inSec2) inSec2.addEventListener("change", (e) => handleUploadExcelSection(e, 2));
  if (inSec3) inSec3.addEventListener("change", (e) => handleUploadExcelSection(e, 3));
});