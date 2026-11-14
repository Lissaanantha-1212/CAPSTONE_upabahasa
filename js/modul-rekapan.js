// ============================================================================
// MODUL REKAPAN INDUK, PEMETAAN JURUSAN/PRODI POLNES & PENERBITAN SERTIFIKAT
// UPA BAHASA - POLITEKNIK NEGERI SAMARINDA
// ============================================================================

// ==================== 1. REFERENSI RESMI JURUSAN & PROGRAM STUDI POLNES ====================
const MASTER_JURUSAN_PRODI_POLNES = [
  {
    jurusan: "AKUNTANSI",
    prodiList: [
      { kode: "D3 - AKUNTANSI", label: "D3 - AKUNTANSI", jenjang: "D3", aliases: ["D3 AKUNTANSI", "D3- AKUNTANSI", "D3 - ACCOUNTING", "AKUNTANSI"] },
      { kode: "D4 - AKUNTANSI MANAJERIAL", label: "D4 - AKUNTANSI MANAJERIAL", jenjang: "D4", aliases: ["D4 AKUNTANSI MANAJERIAL", "D4- AKUNTANSI MANAJERIAL", "AKUNTANSI MANAJERIAL"] },
      { kode: "D4 - KEUANGAN PERBANKAN", label: "D4 - KEUANGAN PERBANKAN", jenjang: "D4", aliases: ["D4 KEUANGAN PERBANKAN", "D4- KEUANGAN PERBANKAN", "KEUANGAN PERBANKAN"] }
    ]
  },
  {
    jurusan: "ADMINISTRASI BISNIS",
    prodiList: [
      { kode: "D4 - MANAJEMEN PEMASARAN", label: "D4 - MANAJEMEN PEMASARAN", jenjang: "D4", aliases: ["D4 MANAJEMEN PEMASARAN", "D4- MANAJEMEN PEMASARAN", "MANAJEMEN PEMASARAN"] },
      { kode: "D4 - BISNIS DIGITAL", label: "D4 - BISNIS DIGITAL", jenjang: "D4", aliases: ["D4 BISNIS DIGITAL", "D4- BISNIS DIGITAL", "BISNIS DIGITAL"] },
      { kode: "D3 - ADMINISTRASI BISNIS", label: "D3 - ADMINISTRASI BISNIS", jenjang: "D3", aliases: ["D3 ADMINISTRASI BISNIS", "D3- ADMINISTRASI BISNIS", "ADMINISTRASI BISNIS"] }
    ]
  },
  {
    jurusan: "KEMARITIMAN",
    prodiList: [
      {
        kode: "D3 - KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN",
        label: "D3 - KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN",
        jenjang: "D3",
        aliases: [
          "D3- KPNK", "D3 - KPNK", "D3 KPNK", "KPNK",
          "KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN",
          "D3 - KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN",
          "KETATALAKSANAAN PELAYARAN NIAGA"
        ]
      },
      { kode: "D3 - TEKNIKA", label: "D3 - TEKNIKA", jenjang: "D3", aliases: ["D3- TEKNIKA", "D3 - TEKNIKA", "D3 TEKNIKA", "TEKNIKA"] },
      { kode: "D3 - NAUTIKA", label: "D3 - NAUTIKA", jenjang: "D3", aliases: ["D3- NAUTIKA", "D3 - NAUTIKA", "D3 NAUTIKA", "NAUTIKA"] }
    ]
  },
  {
    jurusan: "PARIWISATA",
    prodiList: [
      { kode: "D3 - PARIWISATA", label: "D3 - PARIWISATA", jenjang: "D3", aliases: ["D3- PARIWISATA", "D3 - PARIWISATA", "D3 PARIWISATA", "PARIWISATA"] },
      { kode: "D4 - USAHA PERJALANAN WISATA", label: "D4 - USAHA PERJALANAN WISATA", jenjang: "D4", aliases: ["D4- USAHA PERJALANAN WISATA", "D4 - USAHA PERJALANAN WISATA", "D4 USAHA PERJALANAN WISATA", "USAHA PERJALANAN WISATA"] },
      { kode: "D4 - PENGELOLAAN PERHOTELAN", label: "D4 - PENGELOLAAN PERHOTELAN", jenjang: "D4", aliases: ["D4- PENGELOLAAN PERHOTELAN", "PENGELOLAAN PERHOTELAN", "PERHOTELAN"] }
    ]
  },
  {
    jurusan: "TEKNIK SIPIL",
    prodiList: [
      { kode: "D3 - TEKNIK SIPIL", label: "D3 - TEKNIK SIPIL", jenjang: "D3", aliases: ["D3- TEKNIK SIPIL", "D3 TEKNIK SIPIL", "TEKNIK SIPIL"] },
      { kode: "D4 - REKAYASA JALAN DAN JEMBATAN", label: "D4 - REKAYASA JALAN DAN JEMBATAN", jenjang: "D4", aliases: ["D4- REKAYASA JALAN DAN JEMBATAN", "D4 REKAYASA JALAN DAN JEMBATAN", "REKAYASA JALAN DAN JEMBATAN"] },
      { kode: "D4 - TEKNOLOGI REKAYASA KONSTRUKSI BANGUNAN GEDUNG", label: "D4 - TEKNOLOGI REKAYASA KONSTRUKSI BANGUNAN GEDUNG", jenjang: "D4", aliases: ["D4- TEKNOLOGI REKAYASA KONSTRUKSI", "TEKNOLOGI REKAYASA KONSTRUKSI", "BANGUNAN GEDUNG"] },
      { kode: "D4 - ARSITEKTUR BANGUNAN GEDUNG", label: "D4 - ARSITEKTUR BANGUNAN GEDUNG", jenjang: "D4", aliases: ["D4- ARSITEKTUR BANGUNAN GEDUNG", "D4 ARSITEKTUR BANGUNAN GEDUNG", "ARSITEKTUR BANGUNAN GEDUNG"] }
    ]
  },
  {
    jurusan: "TEKNIK ELEKTRO",
    prodiList: [
      { kode: "D3 - TEKNIK LISTRIK", label: "D3 - TEKNIK LISTRIK", jenjang: "D3", aliases: ["D3- TEKNIK LISTRIK", "D3 TEKNIK LISTRIK", "TEKNIK LISTRIK"] },
      { kode: "D4 - TEKNIK LISTRIK", label: "D4 - TEKNIK LISTRIK", jenjang: "D4", aliases: ["D4- TEKNIK LISTRIK", "D4 TEKNIK LISTRIK"] }
    ]
  },
  {
    jurusan: "TEKNIK MESIN",
    prodiList: [
      { kode: "D3 - PERAWATAN DAN PERBAIKAN MESIN", label: "D3 - PERAWATAN DAN PERBAIKAN MESIN", jenjang: "D3", aliases: ["D3- PERAWATAN DAN PERBAIKAN MESIN", "PERAWATAN DAN PERBAIKAN MESIN"] },
      { kode: "D3 - TEKNIK ALAT BERAT", label: "D3 - TEKNIK ALAT BERAT", jenjang: "D3", aliases: ["D3- TEKNIK ALAT BERAT", "D3 TEKNIK ALAT BERAT", "TEKNIK ALAT BERAT"] },
      { kode: "D4 - TEKNIK MESIN PRODUKSI DAN PERAWATAN", label: "D4 - TEKNIK MESIN PRODUKSI DAN PERAWATAN", jenjang: "D4", aliases: ["D4- TEKNIK MESIN PRODUKSI DAN PERAWATAN", "D4- TEKNIK MESIN PRODUKSI", "TEKNIK MESIN PRODUKSI"] }
    ]
  },
  {
    jurusan: "TEKNIK KIMIA",
    prodiList: [
      { kode: "D3 - PETRO DAN OLEO KIMIA", label: "D3 - PETRO DAN OLEO KIMIA", jenjang: "D3", aliases: ["D3- PETRO DAN OLEO KIMIA", "PETRO DAN OLEO KIMIA"] },
      { kode: "D4 - TEKNOLOGI KIMIA INDUSTRI", label: "D4 - TEKNOLOGI KIMIA INDUSTRI", jenjang: "D4", aliases: ["D4- TEKNOLOGI KIMIA INDUSTRI", "TEKNOLOGI KIMIA INDUSTRI"] }
    ]
  },
  {
    jurusan: "TEKNOLOGI INFORMASI",
    prodiList: [
      { kode: "D3 - TEKNIK INFORMATIKA", label: "D3 - TEKNIK INFORMATIKA", jenjang: "D3", aliases: ["D3- TEKNIK INFORMATIKA", "D3 TEKNIK INFORMATIKA", "TEKNIK INFORMATIKA"] },
      { kode: "D3 - TEKNIK KOMPUTER", label: "D3 - TEKNIK KOMPUTER", jenjang: "D3", aliases: ["D3- TEKNIK KOMPUTER", "D3 TEKNIK KOMPUTER", "TEKNIK KOMPUTER"] },
      { kode: "D4 - TEKNIK INFORMATIKA MULTIMEDIA", label: "D4 - TEKNIK INFORMATIKA MULTIMEDIA", jenjang: "D4", aliases: ["D4- TEKNIK INFORMATIKA MULTIMEDIA", "TEKNIK INFORMATIKA MULTIMEDIA"] },
      { kode: "D4 - TEKNOLOGI REKAYASA KOMPUTER", label: "D4 - TEKNOLOGI REKAYASA KOMPUTER", jenjang: "D4", aliases: ["D4- TEKNOLOGI REKAYASA KOMPUTER", "D4 TEKNOLOGI REKAYASA KOMPUTER", "TEKNOLOGI REKAYASA KOMPUTER"] }
    ]
  }
];

// Fungsi pemetaan otomatis dari teks mentah Excel (mis. "D3- KPNK" atau "D4- Teknologi Rekayasa Komputer") ke Jurusan & Prodi baku POLNES
function normalisasiJurusanProdi(prodiRaw, jenjangRaw = "") {
  const cleanRaw = String(prodiRaw || "").trim().toUpperCase().replace(/\s+/g, " ");
  const jenjangClean = String(jenjangRaw || "").trim().toUpperCase();

  // Cek kecocokan spesifik per prodi dalam kamus resmi POLNES
  for (const grp of MASTER_JURUSAN_PRODI_POLNES) {
    for (const p of grp.prodiList) {
      for (const alias of p.aliases) {
        const aliasNorm = alias.toUpperCase().replace(/\s+/g, " ");
        if (cleanRaw === aliasNorm || cleanRaw.includes(aliasNorm) || aliasNorm.includes(cleanRaw) && cleanRaw.length >= 6) {
          // Pastikan jika "TEKNIK LISTRIK", bedakan D3 vs D4
          if (cleanRaw.includes("TEKNIK LISTRIK")) {
            const isD4 = cleanRaw.startsWith("D4") || jenjangClean === "D4";
            return {
              jurusan: "TEKNIK ELEKTRO",
              prodi: isD4 ? "D4 - TEKNIK LISTRIK" : "D3 - TEKNIK LISTRIK",
              jenjang: isD4 ? "D4" : "D3"
            };
          }
          return {
            jurusan: grp.jurusan,
            prodi: p.label,
            jenjang: jenjangClean || p.jenjang
          };
        }
      }
    }
  }

  // Fallback jika ada prodi baru di luar daftar tetap terdeteksi jenjangnya
  const detectedJenjang = jenjangClean || (cleanRaw.startsWith("D4") ? "D4" : "D3");
  return {
    jurusan: "JURUSAN LAINNYA",
    prodi: cleanRaw || "-",
    jenjang: detectedJenjang
  };
}

// ==================== 2. STATE GLOBAL REKAPAN ====================
window.semuaDataRekapan = [];
window.dataRekapanTersaring = [];
window.tahunTerpilihGlobal = "ALL";
window.mahasiswaSedangDibuka = null;
window.dataPreviewExcelSiapSimpan = [];

// ==================== 3. LOGIKA KELULUSAN & SYARAT SERTIFIKAT ====================
function hitungStatusKelulusanDanSertifikat(mhs) {
  const jenjang = String(mhs.jenjang || "").toUpperCase().includes("D4") ? "D4" : "D3";
  const ambangLulus = jenjang === "D4" ? 430 : 400;

  const skorSspect = parseInt(mhs.skor_sspect) || 0;
  const skorLatihan = parseInt(mhs.skor_latihan) || 0;
  const skorToefl = parseInt(mhs.skor_toefl || mhs.total_skor) || 0;
  const rem1 = parseInt(mhs.remedial_1) || 0;
  const rem2 = parseInt(mhs.remedial_2) || 0;
  const rem3 = parseInt(mhs.remedial_3) || 0;

  // Skor akhir TOEFL diambil dari nilai tertinggi antara TOEFL Utama & Remedial 1/2/3 (jika ada)
  const kandidatSkorToefl = [skorToefl, rem1, rem2, rem3].filter(v => v > 0);
  const skorAkhirToefl = kandidatSkorToefl.length > 0 ? Math.max(...kandidatSkorToefl) : 0;

  // Aturan 1: Sertifikat SSPECT tersedia HANYA jika nilai SSPECT ada (> 0)
  const bisaUnduhSspect = skorSspect > 0;

  // Aturan 2: Sertifikat TOEFL tersedia HANYA jika:
  // (a) Nilai Latihan ada (> 0)
  // (b) Nilai TOEFL Utama atau Remedial ada (> 0)
  // (c) Skor akhir memenuhi batas kelulusan (D3 >= 400, D4 >= 430)
  const adaNilaiLatihan = skorLatihan > 0;
  const adaNilaiToefl = skorAkhirToefl > 0;
  const memenuhiAmbang = skorAkhirToefl >= ambangLulus;
  const lulusToefl = adaNilaiLatihan && adaNilaiToefl && memenuhiAmbang;

  let alasanBelumLulus = "";
  if (!adaNilaiLatihan && !adaNilaiToefl) {
    alasanBelumLulus = "Nilai Latihan dan Nilai TOEFL belum diunggah.";
  } else if (!adaNilaiLatihan) {
    alasanBelumLulus = `Nilai TOEFL (${skorAkhirToefl}) sudah ada, namun Nilai Latihan belum tersedia (syarat wajib sertifikat).`;
  } else if (!adaNilaiToefl) {
    alasanBelumLulus = `Nilai Latihan (${skorLatihan}) sudah ada, menunggu hasil tes TOEFL Prediction.`;
  } else if (!memenuhiAmbang) {
    alasanBelumLulus = `Skor akhir (${skorAkhirToefl}) belum mencapai batas lulus ${jenjang} (minimal ${ambangLulus}). Mahasiswa perlu mengikuti Remedial.`;
  } else {
    alasanBelumLulus = `Memenuhi seluruh syarat kelulusan ${jenjang} (Latihan: ${skorLatihan}, Skor Akhir TOEFL: ${skorAkhirToefl} ≥ ${ambangLulus}).`;
  }

  return {
    jenjang,
    ambangLulus,
    skorSspect,
    skorLatihan,
    skorToefl,
    rem1,
    rem2,
    rem3,
    skorAkhirToefl,
    bisaUnduhSspect,
    lulusToefl,
    alasanBelumLulus
  };
}

// ==================== 4. MUAT DATA DARI SUPABASE (`arsip_master_rekapan`) ====================
async function muatDataRekapan() {
  const tbody = document.getElementById("tbodyRekapanMaster");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="11" class="px-6 py-12 text-center text-slate-400 italic">Memuat data rekapan induk dari database...</td></tr>`;

  try {
    if (!window.supabaseClient) {
      tbody.innerHTML = `<tr><td colspan="11" class="px-6 py-12 text-center text-rose-500 font-bold">Koneksi Supabase belum terkonfigurasi.</td></tr>`;
      return;
    }

    const { data, error } = await window.supabaseClient
      .from("arsip_master_rekapan")
      .select("*")
      .order("tahun_angkatan", { ascending: false })
      .order("nim", { ascending: true });

    if (error) throw error;

    // Normalisasi seluruh record agar pemetaan Jurusan, Prodi, Jenjang, Tahun selalu konsisten
    window.semuaDataRekapan = (data || []).map(row => {
      const tahunAuto = row.tahun_angkatan || (String(row.nim || "").length >= 2 ? parseInt("20" + String(row.nim).substring(0, 2)) : new Date().getFullYear());
      const infoProdi = normalisasiJurusanProdi(row.program_studi || row.prodi, row.jenjang);

      return {
        ...row,
        tahun_angkatan: tahunAuto,
        jurusan: row.jurusan || infoProdi.jurusan,
        program_studi: infoProdi.prodi,
        jenjang: row.jenjang || infoProdi.jenjang
      };
    });

    bangunNavigasiTahunAngkatan();
    isiDropdownJurusanDanProdi();
    terapkanFilterRekapan();
  } catch (err) {
    console.error("Gagal memuat rekapan:", err);
    tbody.innerHTML = `<tr><td colspan="11" class="px-6 py-12 text-center text-rose-500 font-bold">Gagal memuat data rekapan: ${err.message}</td></tr>`;
  }
}

// Navigasi Tahun Angkatan Ringkas (Pill maksimal 5 tahun terbaru + Dropdown sisanya agar tidak memenuhi layar)
function bangunNavigasiTahunAngkatan() {
  const container = document.getElementById("containerTabTahun");
  const selectLain = document.getElementById("selectTahunLainnya");
  if (!container) return;

  const daftarTahun = [...new Set(window.semuaDataRekapan.map(d => String(d.tahun_angkatan)).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const tahunUtama = daftarTahun.slice(0, 5);
  const tahunSisa = daftarTahun.slice(5);

  let html = `
    <button type="button" onclick="pilihTahunAngkatan('ALL')" class="px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
      window.tahunTerpilihGlobal === "ALL"
        ? "bg-[#169C53] text-white shadow-2xs"
        : "bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#169C53]"
    }">
      Semua (${window.semuaDataRekapan.length})
    </button>
  `;

  tahunUtama.forEach(thn => {
    const jml = window.semuaDataRekapan.filter(d => String(d.tahun_angkatan) === thn).length;
    const aktif = window.tahunTerpilihGlobal === thn;
    html += `
      <button type="button" onclick="pilihTahunAngkatan('${thn}')" class="px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
        aktif
          ? "bg-[#169C53] text-white shadow-2xs"
          : "bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-[#169C53]"
      }">
        Angkatan ${thn} (${jml})
      </button>
    `;
  });

  container.innerHTML = html;

  if (selectLain) {
    if (tahunSisa.length > 0) {
      selectLain.classList.remove("hidden");
      selectLain.innerHTML = `<option value="ALL">Tahun Lainnya (${tahunSisa.length})...</option>` +
        tahunSisa.map(thn => `<option value="${thn}" ${window.tahunTerpilihGlobal === thn ? "selected" : ""}>Angkatan ${thn}</option>`).join("");
    } else {
      selectLain.classList.add("hidden");
    }
  }
}

function pilihTahunAngkatan(tahun) {
  window.tahunTerpilihGlobal = String(tahun || "ALL");
  bangunNavigasiTahunAngkatan();
  terapkanFilterRekapan();
}

function isiDropdownJurusanDanProdi() {
  const selJur = document.getElementById("filterJurusan");
  const selProdi = document.getElementById("filterProdi");
  if (!selJur || !selProdi) return;

  const jurusanTersedia = MASTER_JURUSAN_PRODI_POLNES.map(j => j.jurusan);
  selJur.innerHTML = `<option value="ALL">Semua Jurusan</option>` +
    jurusanTersedia.map(j => `<option value="${j}">${j}</option>`).join("");

  updateOpsiProdiBerdasarkanJurusan("ALL");
}

function onChangeFilterJurusan() {
  const jur = document.getElementById("filterJurusan").value;
  updateOpsiProdiBerdasarkanJurusan(jur);
  terapkanFilterRekapan();
}

function updateOpsiProdiBerdasarkanJurusan(jurusanTerpilih) {
  const selProdi = document.getElementById("filterProdi");
  if (!selProdi) return;

  let daftarProdi = [];
  if (jurusanTerpilih === "ALL") {
    MASTER_JURUSAN_PRODI_POLNES.forEach(g => {
      g.prodiList.forEach(p => daftarProdi.push(p.label));
    });
  } else {
    const grp = MASTER_JURUSAN_PRODI_POLNES.find(g => g.jurusan === jurusanTerpilih);
    if (grp) daftarProdi = grp.prodiList.map(p => p.label);
  }

  selProdi.innerHTML = `<option value="ALL">Semua Program Studi</option>` +
    daftarProdi.map(p => `<option value="${p}">${p}</option>`).join("");
}

function terapkanFilterRekapan() {
  const q = (document.getElementById("inputCariRekapan")?.value || "").trim().toLowerCase();
  const jur = document.getElementById("filterJurusan")?.value || "ALL";
  const prodi = document.getElementById("filterProdi")?.value || "ALL";
  const statusFilter = document.getElementById("filterStatusSertif")?.value || "ALL";

  const hasil = window.semuaDataRekapan.filter(mhs => {
    if (window.tahunTerpilihGlobal !== "ALL" && String(mhs.tahun_angkatan) !== window.tahunTerpilihGlobal) {
      return false;
    }
    if (jur !== "ALL" && String(mhs.jurusan).toUpperCase() !== jur.toUpperCase()) {
      return false;
    }
    if (prodi !== "ALL" && String(mhs.program_studi).toUpperCase() !== prodi.toUpperCase()) {
      return false;
    }
    if (q) {
      const matchNim = String(mhs.nim || "").toLowerCase().includes(q);
      const matchNama = String(mhs.nama_mahasiswa || mhs.nama || "").toLowerCase().includes(q);
      if (!matchNim && !matchNama) return false;
    }
    if (statusFilter !== "ALL") {
      const evalStatus = hitungStatusKelulusanDanSertifikat(mhs);
      if (statusFilter === "LULUS" && !evalStatus.lulusToefl) return false;
      if (statusFilter === "BELUM" && evalStatus.lulusToefl) return false;
    }
    return true;
  });

  window.dataRekapanTersaring = hasil;
  updateStatistikRekapan(hasil);
  renderTabelRekapanMaster(hasil);
}

function updateStatistikRekapan(list) {
  let jmlLulus = 0;
  list.forEach(m => {
    if (hitungStatusKelulusanDanSertifikat(m).lulusToefl) jmlLulus++;
  });

  const elTotal = document.getElementById("statTotalMhs");
  const elLulus = document.getElementById("statLulusToefl");
  const elBelum = document.getElementById("statBelumLulus");

  if (elTotal) elTotal.textContent = list.length;
  if (elLulus) elLulus.textContent = jmlLulus;
  if (elBelum) elBelum.textContent = list.length - jmlLulus;
}

// ==================== 5. RENDER TABEL INDUK REKAPAN ====================
function renderTabelRekapanMaster(list) {
  const tbody = document.getElementById("tbodyRekapanMaster");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="px-6 py-12 text-center text-slate-400 italic">
          Belum ada data rekapan mahasiswa yang sesuai dengan filter saat ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((mhs, idx) => {
    const evalInfo = hitungStatusKelulusanDanSertifikat(mhs);
    const nama = mhs.nama_mahasiswa || mhs.nama || "-";

    const badgeStatus = evalInfo.lulusToefl
      ? `<span class="px-2.5 py-1 rounded-full bg-emerald-50 text-[#169C53] border border-emerald-200 text-[10px] font-extrabold">LULUS (${evalInfo.jenjang} ≥${evalInfo.ambangLulus})</span>`
      : `<span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">BELUM LULUS</span>`;

    return `
      <tr class="hover:bg-slate-50/90 transition-colors">
        <td class="px-4 py-3.5 font-bold text-slate-400">${idx + 1}</td>
        <td class="px-4 py-3.5">
          <div class="font-extrabold text-slate-900 uppercase">${nama}</div>
          <div class="text-[11px] font-mono font-bold text-[#169C53]">${mhs.nim}</div>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-bold text-slate-800">${mhs.program_studi}</div>
          <div class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">JURUSAN ${mhs.jurusan}</div>
        </td>
        <td class="px-4 py-3.5 text-center font-extrabold text-slate-700">${mhs.tahun_angkatan}</td>
        <td class="px-4 py-3.5 text-center font-mono font-bold ${evalInfo.skorSspect > 0 ? "text-sky-600" : "text-slate-300"}">
          ${evalInfo.skorSspect > 0 ? evalInfo.skorSspect : "-"}
        </td>
        <td class="px-4 py-3.5 text-center font-mono font-bold ${evalInfo.skorLatihan > 0 ? "text-slate-800" : "text-slate-300"}">
          ${evalInfo.skorLatihan > 0 ? evalInfo.skorLatihan : "-"}
        </td>
        <td class="px-4 py-3.5 text-center font-mono font-bold ${evalInfo.skorToefl > 0 ? "text-slate-900" : "text-slate-300"}">
          ${evalInfo.skorToefl > 0 ? evalInfo.skorToefl : "-"}
        </td>
        <td class="px-4 py-3.5 text-center font-mono text-[11px] text-slate-500">
          ${evalInfo.rem1 || "-"} / ${evalInfo.rem2 || "-"} / ${evalInfo.rem3 || "-"}
        </td>
        <td class="px-4 py-3.5 text-center">
          <span class="px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-extrabold text-slate-900">
            ${evalInfo.skorAkhirToefl > 0 ? evalInfo.skorAkhirToefl : "-"}
          </span>
        </td>
        <td class="px-4 py-3.5 text-center">${badgeStatus}</td>
        <td class="px-4 py-3.5 text-center">
          <div class="inline-flex items-center gap-1.5">
            <button type="button" onclick="bukaDetailMahasiswa('${mhs.nim}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#169C53] border border-slate-200 hover:border-emerald-200 text-[11px] font-extrabold transition-all flex items-center gap-1">
              <i class="ri-eye-line"></i>
              <span>Detail</span>
            </button>
            ${evalInfo.lulusToefl ? `
              <button type="button" onclick="bukaDetailMahasiswa('${mhs.nim}', 'TOEFL')" class="px-2.5 py-1.5 rounded-xl bg-[#169C53] hover:bg-[#0E7A3F] text-white text-[11px] font-extrabold shadow-2xs" title="Unduh Sertifikat TOEFL">
                <i class="ri-award-fill"></i>
              </button>
            ` : ""}
            ${evalInfo.bisaUnduhSspect ? `
              <button type="button" onclick="bukaDetailMahasiswa('${mhs.nim}', 'SSPECT')" class="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold shadow-2xs" title="Unduh Sertifikat SSPECT">
                <i class="ri-medal-fill"></i>
              </button>
            ` : ""}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// ==================== 6. MODAL DETAIL MAHASISWA, KOTAK RIWAYAT & SERTIFIKAT ====================
function bukaDetailMahasiswa(nim, langsungCetakJenis = null) {
  const mhs = window.semuaDataRekapan.find(m => String(m.nim) === String(nim));
  if (!mhs) return;

  window.mahasiswaSedangDibuka = mhs;
  const evalInfo = hitungStatusKelulusanDanSertifikat(mhs);

  document.getElementById("detBadgeAngkatan").textContent = `Angkatan ${mhs.tahun_angkatan}`;
  document.getElementById("detBadgeJenjang").textContent = `${evalInfo.jenjang} (Batas Lulus: ${evalInfo.ambangLulus})`;

  const badgeStatus = document.getElementById("detBadgeStatusLulus");
  if (evalInfo.lulusToefl) {
    badgeStatus.className = "px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0E7A3F] text-[11px] font-extrabold";
    badgeStatus.textContent = "LULUS TOEFL & SYARAT TERPENUHI";
  } else {
    badgeStatus.className = "px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold";
    badgeStatus.textContent = "BELUM LULUS / SYARAT BELUM LENGKAP";
  }

  document.getElementById("detNamaMahasiswa").textContent = mhs.nama_mahasiswa || mhs.nama || "-";
  document.getElementById("detInfoProdiJurusan").textContent = `NIM: ${mhs.nim} • JURUSAN ${mhs.jurusan} • ${mhs.program_studi}`;

  // Render 6 Kotak Riwayat Nilai (SSPECT, LATIHAN, TOEFL, REMEDIAL 1, REMEDIAL 2, REMEDIAL 3)
  const kotakItems = [
    { label: "SSPECT", val: evalInfo.skorSspect > 0 ? evalInfo.skorSspect : "-" },
    { label: `LAT. ${evalInfo.jenjang}`, val: evalInfo.skorLatihan > 0 ? evalInfo.skorLatihan : "-" },
    { label: `TOEFL ${evalInfo.jenjang}`, val: evalInfo.skorToefl > 0 ? evalInfo.skorToefl : "-" },
    { label: "REMEDIAL 1", val: evalInfo.rem1 > 0 ? evalInfo.rem1 : "-" },
    { label: "REMEDIAL 2", val: evalInfo.rem2 > 0 ? evalInfo.rem2 : "-" },
    { label: "REMEDIAL 3", val: evalInfo.rem3 > 0 ? evalInfo.rem3 : "-" }
  ];

  document.getElementById("gridKotakRiwayatNilai").innerHTML = kotakItems.map(k => `
    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-1">
      <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">${k.label}</div>
      <div class="text-xl font-extrabold ${k.val !== "-" ? "text-slate-900" : "text-slate-400"}">${k.val}</div>
    </div>
  `).join("");

  document.getElementById("detKeteranganSertifikat").textContent = evalInfo.alasanBelumLulus;

  // Atur visibilitas 2 tombol sertifikat (Sertifikat SSPECT & Sertifikat TOEFL)
  const btnSspect = document.getElementById("btnUnduhSertifSspect");
  const btnToefl = document.getElementById("btnUnduhSertifToefl");

  if (evalInfo.bisaUnduhSspect) {
    btnSspect.classList.remove("hidden");
    btnSspect.classList.add("inline-flex");
  } else {
    btnSspect.classList.add("hidden");
    btnSspect.classList.remove("inline-flex");
  }

  if (evalInfo.lulusToefl) {
    btnToefl.classList.remove("hidden");
    btnToefl.classList.add("inline-flex");
  } else {
    btnToefl.classList.add("hidden");
    btnToefl.classList.remove("inline-flex");
  }

  // Isi default field cetak sertifikat & form edit
  document.getElementById("inputDetTtl").value = mhs.tempat_tgl_lahir || "Samarinda, -";
  document.getElementById("inputDetTglTes").value = mhs.tanggal_tes || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  document.getElementById("inputDetNoSertif").value = mhs.nomor_sertifikat || `${String(mhs.id || 1).padStart(4, "0")} / PL7.18 / UPA.BAHASA / TOEFL-P / ${new Date().getFullYear()}`;

  document.getElementById("editMhsNama").value = mhs.nama_mahasiswa || mhs.nama || "";
  document.getElementById("editMhsProdi").value = mhs.program_studi || "";
  document.getElementById("editMhsAngkatan").value = mhs.tahun_angkatan || "";
  document.getElementById("editSkorSspect").value = evalInfo.skorSspect || "";
  document.getElementById("editSkorLatihan").value = evalInfo.skorLatihan || "";
  document.getElementById("editSkorToefl").value = evalInfo.skorToefl || "";
  document.getElementById("editSkorRem1").value = evalInfo.rem1 || "";
  document.getElementById("editSkorRem2").value = evalInfo.rem2 || "";
  document.getElementById("editSkorRem3").value = evalInfo.rem3 || "";
  document.getElementById("editSec1").value = mhs.listening || "";
  document.getElementById("editSec2").value = mhs.structure || "";
  document.getElementById("editSec3").value = mhs.reading || "";

  document.getElementById("modalDetailMahasiswa").classList.remove("hidden");

  if (langsungCetakJenis === "TOEFL" && evalInfo.lulusToefl) {
    bukaPreviewSertifikat("TOEFL");
  } else if (langsungCetakJenis === "SSPECT" && evalInfo.bisaUnduhSspect) {
    bukaPreviewSertifikat("SSPECT");
  }
}

function tutupModalDetailMahasiswa() {
  document.getElementById("modalDetailMahasiswa").classList.add("hidden");
  window.mahasiswaSedangDibuka = null;
}

// ==================== 7. PREVIEW & CETAK SERTIFIKAT RESMI (TOEFL / SSPECT) ====================
function bukaPreviewSertifikat(jenisSertifikat) {
  const mhs = window.mahasiswaSedangDibuka;
  if (!mhs) return;

  const evalInfo = hitungStatusKelulusanDanSertifikat(mhs);
  const ttl = document.getElementById("inputDetTtl").value.trim() || "-";
  const tglTes = document.getElementById("inputDetTglTes").value.trim() || "-";
  let noSertif = document.getElementById("inputDetNoSertif").value.trim();

  const isSspect = jenisSertifikat === "SSPECT";

  document.getElementById("badgeJenisSertifPreview").textContent = isSspect
    ? "SERTIFIKAT SSPECT TEST"
    : "SERTIFIKAT TOEFL PREDICTION";

  // Sesuaikan nomor & sub-judul sertifikat sesuai jenis tes (TOEFL Prediction vs SSPECT)
  if (isSspect) {
    noSertif = noSertif.replace("TOEFL-P", "SSPECT");
    document.getElementById("certSubJudulTes").textContent = "Achieved the following score on SSPECT Test";
    document.getElementById("certSec1").textContent = mhs.sspect_listening || mhs.listening || "-";
    document.getElementById("certSec2").textContent = mhs.sspect_structure || mhs.structure || "-";
    document.getElementById("certSec3").textContent = mhs.sspect_reading || mhs.reading || "-";
    document.getElementById("certTotalSkor").textContent = evalInfo.skorSspect;
  } else {
    noSertif = noSertif.replace("SSPECT", "TOEFL-P");
    document.getElementById("certSubJudulTes").textContent = "Achieved the following score on Toefl Prediction Test";
    document.getElementById("certSec1").textContent = mhs.listening || "-";
    document.getElementById("certSec2").textContent = mhs.structure || "-";
    document.getElementById("certSec3").textContent = mhs.reading || "-";
    document.getElementById("certTotalSkor").textContent = evalInfo.skorAkhirToefl;
  }

  document.getElementById("certNomor").textContent = noSertif;
  document.getElementById("certNama").textContent = (mhs.nama_mahasiswa || mhs.nama || "-").toUpperCase();
  document.getElementById("certNim").textContent = mhs.nim || "-";
  document.getElementById("certTtl").textContent = ttl;
  document.getElementById("certProdi").textContent = mhs.program_studi || "-";
  document.getElementById("certTglTes").textContent = tglTes;
  document.getElementById("certTanggalCetak").textContent = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  document.getElementById("modalPreviewSertifikat").classList.remove("hidden");
}

function tutupPreviewSertifikat() {
  document.getElementById("modalPreviewSertifikat").classList.add("hidden");
}

function cetakSertifikatPdf() {
  window.print();
}

// ==================== 8. SIMPAN PERUBAHAN EDIT MAHASISWA KE DATABASE ====================
async function simpanPerubahanMahasiswa(e) {
  e.preventDefault();
  const mhs = window.mahasiswaSedangDibuka;
  if (!mhs || !window.supabaseClient) return;

  const namaBaru = document.getElementById("editMhsNama").value.trim().toUpperCase();
  const prodiRaw = document.getElementById("editMhsProdi").value.trim();
  const angkatanBaru = parseInt(document.getElementById("editMhsAngkatan").value) || mhs.tahun_angkatan;
  const infoProdi = normalisasiJurusanProdi(prodiRaw, mhs.jenjang);

  const sspect = parseInt(document.getElementById("editSkorSspect").value) || null;
  const latihan = parseInt(document.getElementById("editSkorLatihan").value) || null;
  const toefl = parseInt(document.getElementById("editSkorToefl").value) || null;
  const rem1 = parseInt(document.getElementById("editSkorRem1").value) || null;
  const rem2 = parseInt(document.getElementById("editSkorRem2").value) || null;
  const rem3 = parseInt(document.getElementById("editSkorRem3").value) || null;
  const sec1 = parseInt(document.getElementById("editSec1").value) || null;
  const sec2 = parseInt(document.getElementById("editSec2").value) || null;
  const sec3 = parseInt(document.getElementById("editSec3").value) || null;

  const kandidatAkhir = [toefl, rem1, rem2, rem3].filter(v => v && v > 0);
  const skorAkhir = kandidatAkhir.length > 0 ? Math.max(...kandidatAkhir) : null;

  const payload = {
    nama_mahasiswa: namaBaru,
    program_studi: infoProdi.prodi,
    jurusan: infoProdi.jurusan,
    jenjang: infoProdi.jenjang,
    tahun_angkatan: angkatanBaru,
    skor_sspect: sspect,
    skor_latihan: latihan,
    skor_toefl: toefl,
    remedial_1: rem1,
    remedial_2: rem2,
    remedial_3: rem3,
    total_skor: skorAkhir,
    listening: sec1,
    structure: sec2,
    reading: sec3,
    tempat_tgl_lahir: document.getElementById("inputDetTtl").value.trim(),
    tanggal_tes: document.getElementById("inputDetTglTes").value.trim(),
    nomor_sertifikat: document.getElementById("inputDetNoSertif").value.trim()
  };

  try {
    const { error } = await window.supabaseClient
      .from("arsip_master_rekapan")
      .update(payload)
      .eq("nim", mhs.nim);

    if (error) throw error;

    alert("Data rekapan mahasiswa berhasil diperbarui!");
    await muatDataRekapan();
    bukaDetailMahasiswa(mhs.nim);
  } catch (err) {
    alert("Gagal memperbarui data: " + err.message);
  }
}

// ==================== 9. IMPORT EXCEL NILAI (LATIHAN, TOEFL, SSPECT, REMEDIAL) ====================
function bukaModalUploadExcel() {
  document.getElementById("fileInputExcelRekapan").value = "";
  document.getElementById("boxPreviewExcel").classList.add("hidden");
  document.getElementById("btnSimpanExcelDb").disabled = true;
  window.dataPreviewExcelSiapSimpan = [];
  document.getElementById("modalUploadExcel").classList.remove("hidden");
}

function tutupModalUploadExcel() {
  document.getElementById("modalUploadExcel").classList.add("hidden");
}

function deteksiKategoriBarisExcel(tipeRaw, pilihanManual) {
  if (pilihanManual && pilihanManual !== "AUTO") return pilihanManual;
  const t = String(tipeRaw || "").toUpperCase();
  if (t.includes("SSPECT")) return "SSPECT";
  if (t.includes("LATIHAN") || t.includes("PRACTICE") || t.includes("TRYOUT")) return "LATIHAN";
  if (t.includes("REM") && t.includes("3")) return "REMEDIAL_3";
  if (t.includes("REM") && t.includes("2")) return "REMEDIAL_2";
  if (t.includes("REM")) return "REMEDIAL_1";
  return "TOEFL"; // Default untuk "Semester Akhir" / "TOEFL Prediction"
}

function previewFileExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  const pilihanKategori = document.getElementById("selectKategoriUpload").value;
  const tahunDefaultInput = parseInt(document.getElementById("inputTahunUploadDefault").value) || null;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

      const parsedList = [];

      rows.forEach(r => {
        const nim = String(r.NIM || r.nim || r.Nim || "").trim();
        const nama = String(r.Nama || r.NAMA || r.nama || r.Nama_Mahasiswa || "").trim().toUpperCase();
        if (!nim || !nama) return;

        const tahunExcel = parseInt(r.Tahun_Angkatan || r.Tahun || r.Angkatan || r.tahun_angkatan) ||
          tahunDefaultInput ||
          (nim.length >= 2 ? parseInt("20" + nim.substring(0, 2)) : new Date().getFullYear());

        const jenjangExcel = String(r.Jenjang || r.jenjang || "").trim().toUpperCase();
        const prodiExcel = String(r.Program_Studi || r.Prodi || r.program_studi || "").trim();
        const infoProdi = normalisasiJurusanProdi(prodiExcel, jenjangExcel);

        const tipeExcel = r.Tipe_Ujian || r.Tipe || r.Jenis_Tes || "";
        const kategori = deteksiKategoriBarisExcel(tipeExcel, pilihanKategori);

        const sec1 = parseInt(r.Section_1 || r.Listening || r.listening) || null;
        const sec2 = parseInt(r.Section_2 || r.Structure || r.structure) || null;
        const sec3 = parseInt(r.Section_3 || r.Reading || r.reading) || null;
        const total = parseInt(r.Total_Score || r.Total || r.Skor || r.total_skor) || 0;

        parsedList.push({
          nim,
          nama,
          tahun_angkatan: tahunExcel,
          jenjang: infoProdi.jenjang,
          jurusan: infoProdi.jurusan,
          program_studi: infoProdi.prodi,
          kategori,
          sec1,
          sec2,
          sec3,
          total
        });
      });

      window.dataPreviewExcelSiapSimpan = parsedList;
      document.getElementById("lblJumlahBarisExcel").textContent = parsedList.length;
      document.getElementById("boxPreviewExcel").classList.remove("hidden");
      document.getElementById("btnSimpanExcelDb").disabled = parsedList.length === 0;

      const tbody = document.getElementById("tbodyPreviewExcel");
      tbody.innerHTML = parsedList.slice(0, 30).map(item => `
        <tr>
          <td class="px-3 py-1.5 font-mono font-bold">${item.nim}</td>
          <td class="px-3 py-1.5 font-bold">${item.nama}</td>
          <td class="px-3 py-1.5">${item.tahun_angkatan}</td>
          <td class="px-3 py-1.5">${item.program_studi} <span class="text-slate-400">(${item.jurusan})</span></td>
          <td class="px-3 py-1.5 font-extrabold text-[#169C53]">${item.kategori}</td>
          <td class="px-3 py-1.5 text-right font-mono">${item.sec1 || "-"} / ${item.sec2 || "-"} / ${item.sec3 || "-"} / <b>${item.total}</b></td>
        </tr>
      `).join("");
    } catch (err) {
      alert("Gagal membaca file Excel: " + err.message);
    }
  };
  reader.readAsBinaryString(file);
}

async function simpanExcelKeDatabase() {
  const list = window.dataPreviewExcelSiapSimpan;
  if (!list || list.length === 0 || !window.supabaseClient) return;

  const btn = document.getElementById("btnSimpanExcelDb");
  btn.disabled = true;
  btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> <span>Menyimpan ${list.length} Data...</span>`;

  try {
    // Ambil data eksisting berdasarkan NIM agar nilai baru menggabungkan (merge) kolom yang relevan tanpa menghapus riwayat nilai sebelumnya
    const nims = list.map(i => i.nim);
    const { data: existingRows, error: errFetch } = await window.supabaseClient
      .from("arsip_master_rekapan")
      .select("*")
      .in("nim", nims);

    if (errFetch) throw errFetch;

    const mapExisting = {};
    (existingRows || []).forEach(r => {
      mapExisting[String(r.nim)] = r;
    });

    const upsertPayloads = list.map(item => {
      const lama = mapExisting[item.nim] || {};

      const record = {
        nim: item.nim,
        nama_mahasiswa: item.nama || lama.nama_mahasiswa,
        tahun_angkatan: item.tahun_angkatan || lama.tahun_angkatan,
        jenjang: item.jenjang || lama.jenjang,
        jurusan: item.jurusan || lama.jurusan,
        program_studi: item.program_studi || lama.program_studi,
        skor_sspect: lama.skor_sspect || null,
        skor_latihan: lama.skor_latihan || null,
        skor_toefl: lama.skor_toefl || null,
        remedial_1: lama.remedial_1 || null,
        remedial_2: lama.remedial_2 || null,
        remedial_3: lama.remedial_3 || null,
        listening: lama.listening || null,
        structure: lama.structure || null,
        reading: lama.reading || null,
        total_skor: lama.total_skor || null
      };

      if (item.kategori === "SSPECT") {
        record.skor_sspect = item.total;
        record.sspect_listening = item.sec1;
        record.sspect_structure = item.sec2;
        record.sspect_reading = item.sec3;
      } else if (item.kategori === "LATIHAN") {
        record.skor_latihan = item.total;
      } else if (item.kategori === "REMEDIAL_1") {
        record.remedial_1 = item.total;
        record.listening = item.sec1 || record.listening;
        record.structure = item.sec2 || record.structure;
        record.reading = item.sec3 || record.reading;
      } else if (item.kategori === "REMEDIAL_2") {
        record.remedial_2 = item.total;
        record.listening = item.sec1 || record.listening;
        record.structure = item.sec2 || record.structure;
        record.reading = item.sec3 || record.reading;
      } else if (item.kategori === "REMEDIAL_3") {
        record.remedial_3 = item.total;
        record.listening = item.sec1 || record.listening;
        record.structure = item.sec2 || record.structure;
        record.reading = item.sec3 || record.reading;
      } else {
        // TOEFL Utama (Semester Akhir)
        record.skor_toefl = item.total;
        record.listening = item.sec1 || record.listening;
        record.structure = item.sec2 || record.structure;
        record.reading = item.sec3 || record.reading;
      }

      const kandidatAkhir = [record.skor_toefl, record.remedial_1, record.remedial_2, record.remedial_3].filter(v => v && v > 0);
      if (kandidatAkhir.length > 0) {
        record.total_skor = Math.max(...kandidatAkhir);
      }

      return record;
    });

    const { error: errUpsert } = await window.supabaseClient
      .from("arsip_master_rekapan")
      .upsert(upsertPayloads, { onConflict: "nim" });

    if (errUpsert) throw errUpsert;

    alert(`Berhasil mengimpor dan menggabungkan ${upsertPayloads.length} data mahasiswa ke database!`);
    tutupModalUploadExcel();
    await muatDataRekapan();
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan Excel ke database: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ri-save-3-line"></i> <span>Simpan & Gabungkan ke Database</span>`;
  }
}

// ==================== 10. INPUT MANUAL MAHASISWA BARU ====================
function bukaModalTambahManual() {
  document.getElementById("modalTambahManual").classList.remove("hidden");
}

function tutupModalTambahManual() {
  document.getElementById("modalTambahManual").classList.add("hidden");
}

async function submitTambahManual(e) {
  e.preventDefault();
  if (!window.supabaseClient) return;

  const nim = document.getElementById("addNim").value.trim();
  const angkatan = parseInt(document.getElementById("addAngkatan").value);
  const nama = document.getElementById("addNama").value.trim().toUpperCase();
  const jenjang = document.getElementById("addJenjang").value;
  const prodiRaw = document.getElementById("addProdi").value.trim();
  const infoProdi = normalisasiJurusanProdi(prodiRaw, jenjang);

  try {
    const { error } = await window.supabaseClient
      .from("arsip_master_rekapan")
      .upsert([{
        nim,
        nama_mahasiswa: nama,
        tahun_angkatan: angkatan,
        jenjang: infoProdi.jenjang,
        jurusan: infoProdi.jurusan,
        program_studi: infoProdi.prodi
      }], { onConflict: "nim" });

    if (error) throw error;

    alert(`Mahasiswa ${nama} (${nim}) berhasil ditambahkan!`);
    e.target.reset();
    tutupModalTambahManual();
    await muatDataRekapan();
  } catch (err) {
    alert("Gagal menambahkan mahasiswa: " + err.message);
  }
}

// ==================== 11. REALTIME SYNC SUPABASE & INISIALISASI ====================
function aktifkanRealtimeRekapan() {
  if (!window.supabaseClient) return;

  window.supabaseClient
    .channel("upa-rekapan-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "arsip_master_rekapan" }, () => {
      muatDataRekapan();
    })
    .subscribe();
}

document.addEventListener("DOMContentLoaded", () => {
  muatDataRekapan();
  aktifkanRealtimeRekapan();
});