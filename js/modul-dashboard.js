// ============================================================================
// MODUL DASHBOARD & ANALISIS TREN REAL-TIME (UPA BAHASA POLNES)
// Terhubung langsung ke: arsip_master_rekapan, Rekapan, HasilTes, Mahasiswa,
// serta tabel pendaftaran/jadwal tes.
// ============================================================================

const dashState = {
  semuaMahasiswa: [],
  dataTersaring: [],
  pendaftaranList: [],
  chartTahun: null,
  chartJurusan: null,
  chartProdi: null
};

function getDbClientDash() {
  return window.supabaseClient || window.supabase || null;
}

const MAP_JURUSAN_PRODI_DASH = [
  {
    jurusan: "AKUNTANSI",
    prodi: [
      { nama: "D3 - AKUNTANSI", kw: ["D3 - AKUNTANSI", "D3 AKUNTANSI"] },
      { nama: "D4 - AKUNTANSI MANAJERIAL", kw: ["AKUNTANSI MANAJERIAL"] },
      { nama: "D4 - KEUANGAN PERBANKAN", kw: ["KEUANGAN PERBANKAN"] }
    ]
  },
  {
    jurusan: "ADMINISTRASI BISNIS",
    prodi: [
      { nama: "D4 - MANAJEMEN PEMASARAN", kw: ["MANAJEMEN PEMASARAN"] },
      { nama: "D4 - BISNIS DIGITAL", kw: ["BISNIS DIGITAL"] },
      { nama: "D3 - ADMINISTRASI BISNIS", kw: ["ADMINISTRASI BISNIS"] }
    ]
  },
  {
    jurusan: "KEMARITIMAN",
    prodi: [
      { nama: "D3 - KETATALAKSANAAN PELAYARAN DAN NIAGA KEPELABUHAN", kw: ["KETATALAKSANAAN PELAYARAN", "KPNK", "NIAGA KEPELABUHAN"] },
      { nama: "D3 - TEKNIKA", kw: ["TEKNIKA"] },
      { nama: "D3 - NAUTIKA", kw: ["NAUTIKA"] }
    ]
  },
  {
    jurusan: "PARIWISATA",
    prodi: [
      { nama: "D3 - PARIWISATA", kw: ["D3 - PARIWISATA", "D3 PARIWISATA"] },
      { nama: "D4 - USAHA PERJALANAN WISATA", kw: ["USAHA PERJALANAN WISATA", "UPW"] },
      { nama: "D4 - PENGELOLAAN PERHOTELAN", kw: ["PERHOTELAN"] }
    ]
  },
  {
    jurusan: "TEKNOLOGI INFORMASI",
    prodi: [
      { nama: "D3 - TEKNIK INFORMATIKA", kw: ["D3 - TEKNIK INFORMATIKA", "D3 TEKNIK INFORMATIKA"] },
      { nama: "D3 - TEKNIK KOMPUTER", kw: ["D3 - TEKNIK KOMPUTER", "D3 TEKNIK KOMPUTER"] },
      { nama: "D4 - TEKNIK INFORMATIKA MULTIMEDIA", kw: ["INFORMATIKA MULTIMEDIA", "TIM"] },
      { nama: "D4 - TEKNOLOGI REKAYASA KOMPUTER", kw: ["TEKNOLOGI REKAYASA KOMPUTER", "TRK"] }
    ]
  },
  {
    jurusan: "DESAIN",
    prodi: [
      { nama: "D4 - DESAIN PRODUK KAYU DAN SERAT", kw: ["DESAIN PRODUK KAYU", "KAYU DAN SERAT"] },
      { nama: "D4 - ARSITEKTUR BANGUNAN GEDUNG", kw: ["ARSITEKTUR BANGUNAN GEDUNG"] }
    ]
  },
  {
    jurusan: "TEKNIK KIMIA",
    prodi: [
      { nama: "D3 - PETRO DAN OLEO KIMIA", kw: ["PETRO DAN OLEO KIMIA", "PETRO"] },
      { nama: "D4 - TEKNOLOGI KIMIA INDUSTRI", kw: ["TEKNOLOGI KIMIA INDUSTRI", "KIMIA INDUSTRI"] }
    ]
  },
  {
    jurusan: "TEKNIK SIPIL",
    prodi: [
      { nama: "D4 - TEKNOLOGI REKAYASA KONSTRUKSI BANGUNAN GEDUNG", kw: ["REKAYASA KONSTRUKSI BANGUNAN GEDUNG", "TRKBG"] },
      { nama: "D4 - REKAYASA JALAN DAN JEMBATAN", kw: ["REKAYASA JALAN DAN JEMBATAN", "JALAN DAN JEMBATAN"] },
      { nama: "D4 - REKAYASA KONSTRUKSI BANGUNAN AIR", kw: ["REKAYASA KONSTRUKSI BANGUNAN AIR", "BANGUNAN AIR"] },
      { nama: "D3 - TEKNIK SIPIL", kw: ["TEKNIK SIPIL"] }
    ]
  },
  {
    jurusan: "TEKNIK MESIN",
    prodi: [
      { nama: "D3 - PERAWATAN DAN PERBAIKAN MESIN", kw: ["PERAWATAN DAN PERBAIKAN MESIN"] },
      { nama: "D3 - TEKNIK ALAT BERAT", kw: ["TEKNIK ALAT BERAT", "ALAT BERAT"] },
      { nama: "D4 - TEKNIK MESIN PRODUKSI DAN PERAWATAN", kw: ["TEKNIK MESIN PRODUKSI", "PRODUKSI DAN PERAWATAN"] }
    ]
  },
  {
    jurusan: "TEKNIK ELEKTRO",
    prodi: [
      { nama: "D3 - TEKNIK LISTRIK", kw: ["D3 - TEKNIK LISTRIK", "D3 TEKNIK LISTRIK", "D3 - TEKNIK ELEKTRO"] },
      { nama: "D4 - TEKNIK LISTRIK", kw: ["D4 - TEKNIK LISTRIK", "D4 TEKNIK LISTRIK", "D4 - TEKNI LISTRIK", "D4 - TEKNIK ELEKTRO"] }
    ]
  }
];

function deteksiProdiJurusanDash(prodiRaw, jurusanFallback = "-") {
  const teks = String(prodiRaw || "").trim().toUpperCase().replace(/\s+/g, " ");
  if (!teks || teks === "-") {
    return { jurusan: String(jurusanFallback || "LAINNYA").toUpperCase(), prodi: "BELUM TERDATA", jenjang: "D3" };
  }
  for (const kel of MAP_JURUSAN_PRODI_DASH) {
    for (const item of kel.prodi) {
      if (item.kw.some(k => teks.includes(k))) {
        const jenjang = item.nama.startsWith("D4") || teks.includes("D4") ? "D4" : "D3";
        return { jurusan: kel.jurusan, prodi: item.nama, jenjang };
      }
    }
  }
  return {
    jurusan: String(jurusanFallback || "LAINNYA").toUpperCase(),
    prodi: teks,
    jenjang: teks.includes("D4") ? "D4" : "D3"
  };
}

function ekstrakTahunNimDash(nimRaw, fallback = null) {
  const clean = String(nimRaw || "").replace(/\D/g, "");
  if (clean.length >= 2) {
    const dua = parseInt(clean.substring(0, 2), 10);
    if (!isNaN(dua) && dua >= 0 && dua <= 99) return 2000 + dua;
  }
  if (fallback) {
    const thn = parseInt(String(fallback).replace(/\D/g, ""), 10);
    if (!isNaN(thn) && thn > 0) return thn < 100 ? 2000 + thn : thn;
  }
  return new Date().getFullYear();
}

async function fetchAllRowsDash(db, tabel) {
  const pageSize = 1000;
  let from = 0;
  let all = [];
  while (true) {
    const { data, error } = await db.from(tabel).select("*").range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// ==================== 1. TARIK DATA GABUNGAN DARI REKAPAN & PENDAFTARAN/JADWAL ====================
async function muatDataDashboardTerpadu(notif = false) {
  const db = getDbClientDash();
  if (!db) return;

  try {
    // Tarik dari tabel rekapan/arsip + tabel pendaftaran/jadwal secara paralel
    const [rowsMaster, rowsRekapan, rowsHasilTes, rowsMahasiswa, rowsPendaftaran, rowsPesertaJadwal] = await Promise.all([
      fetchAllRowsDash(db, "arsip_master_rekapan"),
      fetchAllRowsDash(db, "Rekapan"),
      fetchAllRowsDash(db, "HasilTes"),
      fetchAllRowsDash(db, "Mahasiswa"),
      fetchAllRowsDash(db, "Pendaftaran"),
      fetchAllRowsDash(db, "PesertaJadwal")
    ]);

    const mapMhs = new Map();

    const pastikanRecord = (nimKey, raw = {}) => {
      if (!mapMhs.has(nimKey)) {
        const info = deteksiProdiJurusanDash(raw.program_studi || raw.prodi || raw.kelas, raw.jurusan);
        mapMhs.set(nimKey, {
          nim: nimKey,
          nama: String(raw.nama || raw.nama_mahasiswa || "-").toUpperCase(),
          jurusan: info.jurusan,
          prodi: info.prodi,
          jenjang: info.jenjang,
          tahun: String(ekstrakTahunNimDash(nimKey, raw.tahun_angkatan || raw.angkatan)),
          skor_sspect: null,
          skor_latihan: null,
          skor_toefl: null,
          remedial_1: null,
          remedial_2: null,
          remedial_3: null,
          sudah_daftar: false,
          sudah_dijadwalkan: false
        });
      }
      return mapMhs.get(nimKey);
    };

    const parseNum = (v) => {
      if (v === null || v === undefined || String(v).trim() === "") return null;
      const n = Number(String(v).replace(",", ".").trim());
      return !isNaN(n) && n > 0 ? Math.round(n) : null;
    };

    // 1. Gabung dari arsip_master_rekapan
    rowsMaster.forEach(r => {
      const nim = String(r.nim || "").trim();
      if (!nim) return;
      const rec = pastikanRecord(nim, r);
      const info = deteksiProdiJurusanDash(r.program_studi || r.prodi, r.jurusan || rec.jurusan);
      if (info.prodi !== "BELUM TERDATA") rec.prodi = info.prodi;
      if (info.jurusan !== "LAINNYA") rec.jurusan = info.jurusan;
      rec.jenjang = info.jenjang;
      if (r.tahun_angkatan) rec.tahun = String(r.tahun_angkatan);

      rec.skor_sspect = parseNum(r.skor_sspect ?? r.nilai_sspect) ?? rec.skor_sspect;
      rec.skor_latihan = parseNum(r.skor_latihan ?? r.nilai_latihan) ?? rec.skor_latihan;
      rec.skor_toefl = parseNum(r.skor_toefl ?? r.nilai_toefl) ?? rec.skor_toefl;
      rec.remedial_1 = parseNum(r.remedial_1) ?? rec.remedial_1;
      rec.remedial_2 = parseNum(r.remedial_2) ?? rec.remedial_2;
      rec.remedial_3 = parseNum(r.remedial_3) ?? rec.remedial_3;
    });

    // 2. Gabung dari Mahasiswa
    rowsMahasiswa.forEach(m => {
      const nim = String(m.nim || "").trim();
      if (!nim) return;
      const rec = pastikanRecord(nim, m);
      const info = deteksiProdiJurusanDash(m.program_studi || m.prodi, rec.jurusan);
      if (info.prodi !== "BELUM TERDATA") rec.prodi = info.prodi;
      if (info.jurusan !== "LAINNYA") rec.jurusan = info.jurusan;
      rec.jenjang = info.jenjang;
    });

    // 3. Gabung dari Rekapan & HasilTes (otomatis jika ada hasil tes masuk dari alur ujian)
    [...rowsRekapan, ...rowsHasilTes].forEach(h => {
      const nim = String(h.nim || h.nim_mahasiswa || "").trim();
      if (!nim) return;
      const rec = pastikanRecord(nim, h);
      const kat = String(h.kategori_tes || h.jenis_tes || "").toUpperCase();
      const tot = parseNum(h.skor_total ?? h.total_skor ?? h.nilai);
      if (tot) {
        if (kat.includes("SSPECT")) rec.skor_sspect = tot;
        else if (kat.includes("LATIHAN")) rec.skor_latihan = tot;
        else if (kat.includes("REM") && kat.includes("3")) rec.remedial_3 = tot;
        else if (kat.includes("REM") && kat.includes("2")) rec.remedial_2 = tot;
        else if (kat.includes("REM")) rec.remedial_1 = tot;
        else if (kat.includes("TOEFL")) rec.skor_toefl = tot;
      }
      rec.skor_sspect = parseNum(h.skor_sspect) ?? rec.skor_sspect;
      rec.skor_latihan = parseNum(h.skor_latihan) ?? rec.skor_latihan;
      rec.skor_toefl = parseNum(h.skor_toefl) ?? rec.skor_toefl;
      rec.remedial_1 = parseNum(h.remedial_1) ?? rec.remedial_1;
      rec.remedial_2 = parseNum(h.remedial_2) ?? rec.remedial_2;
      rec.remedial_3 = parseNum(h.remedial_3) ?? rec.remedial_3;
    });

    // 4. Gabung status dari tabel Pendaftaran & PesertaJadwal (untuk 4 card operasional)
    const setSudahTerjadwal = new Set(
      rowsPesertaJadwal.map(p => String(p.nim || p.nim_mahasiswa || "").trim()).filter(Boolean)
    );

    rowsPendaftaran.forEach(p => {
      const nim = String(p.nim || p.nim_mahasiswa || "").trim();
      if (!nim) return;
      const rec = pastikanRecord(nim, p);
      rec.sudah_daftar = true;
      const statusPendaftaran = String(p.status || p.status_jadwal || "").toUpperCase();
      if (
        p.jadwal_id ||
        p.id_jadwal ||
        setSudahTerjadwal.has(nim) ||
        statusPendaftaran.includes("JADWAL") ||
        statusPendaftaran.includes("SELESAI")
      ) {
        rec.sudah_dijadwalkan = true;
      }
    });

    setSudahTerjadwal.forEach(nim => {
      if (mapMhs.has(nim)) {
        const rec = mapMhs.get(nim);
        rec.sudah_daftar = true;
        rec.sudah_dijadwalkan = true;
      }
    });

    // Finalisasi skor tertinggi & status kelulusan
    dashState.semuaMahasiswa = Array.from(mapMhs.values()).map(m => {
      const daftarToefl = [m.remedial_3, m.remedial_2, m.remedial_1, m.skor_toefl].filter(v => v !== null && v > 0);
      const skorAkhir = daftarToefl.length > 0 ? Math.max(...daftarToefl) : null;
      const batas = m.jenjang === "D4" ? 450 : 400;
      const lulus = skorAkhir !== null && skorAkhir >= batas;

      // Jika sudah memiliki nilai tes/arsip, otomatis terhitung sudah daftar & sudah dijadwalkan
      const punyaRiwayatTes = skorAkhir !== null || m.skor_sspect !== null || m.skor_latihan !== null;

      return {
        ...m,
        skor_toefl_akhir: skorAkhir,
        batas_lulus: batas,
        is_lulus: lulus,
        sudah_daftar: m.sudah_daftar || punyaRiwayatTes,
        sudah_dijadwalkan: m.sudah_dijadwalkan || punyaRiwayatTes
      };
    });

    isiDropdownFilterDashboard();
    terapkanFilterDashboard();

    if (notif) {
      alert(`Data Dashboard berhasil diperbarui (${dashState.semuaMahasiswa.length} mahasiswa).`);
    }
  } catch (err) {
    console.error("Gagal memuat dashboard:", err);
  }
}

// ==================== 2. ISI DROPDOWN TAHUN & JURUSAN OTOMATIS ====================
function isiDropdownFilterDashboard() {
  const selTahun = document.getElementById("dashFilterTahun");
  const selJurusan = document.getElementById("dashFilterJurusan");
  if (!selTahun || !selJurusan) return;

  const valTahunLama = selTahun.value;
  const valJurusanLama = selJurusan.value;

  const daftarTahun = Array.from(new Set(dashState.semuaMahasiswa.map(m => m.tahun)))
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));

  selTahun.innerHTML =
    `<option value="SEMUA">Semua Angkatan (${daftarTahun.length} Tahun)</option>` +
    daftarTahun.map(t => `<option value="${t}">Angkatan ${t}</option>`).join("");

  const daftarJurusan = Array.from(new Set(dashState.semuaMahasiswa.map(m => m.jurusan)))
    .filter(j => j && j !== "LAINNYA")
    .sort();

  selJurusan.innerHTML =
    `<option value="SEMUA">Semua Jurusan (${daftarJurusan.length} Jurusan)</option>` +
    daftarJurusan.map(j => `<option value="${j}">${j}</option>`).join("");

  if (daftarTahun.includes(valTahunLama)) selTahun.value = valTahunLama;
  if (daftarJurusan.includes(valJurusanLama)) selJurusan.value = valJurusanLama;
}

// ==================== 3. TERAPKAN FILTER & RENDER SEMUA KOMPONEN ====================
function terapkanFilterDashboard() {
  const fTahun = document.getElementById("dashFilterTahun")?.value || "SEMUA";
  const fJurusan = document.getElementById("dashFilterJurusan")?.value || "SEMUA";

  dashState.dataTersaring = dashState.semuaMahasiswa.filter(m => {
    if (fTahun !== "SEMUA" && String(m.tahun) !== String(fTahun)) return false;
    if (fJurusan !== "SEMUA" && String(m.jurusan) !== String(fJurusan)) return false;
    return true;
  });

  renderEmpatCardUtama();
  renderInsightOtomatis();
  renderChartTrenPerTahun();
  renderChartPerJurusan();
  renderAnalisisPerProdi();
}

// ==================== 4. RENDER 4 CARD PENTING ====================
function renderEmpatCardUtama() {
  const data = dashState.dataTersaring;
  const totalMhs = data.length;
  const sudahDaftar = data.filter(m => m.sudah_daftar).length;
  const belumJadwal = data.filter(m => m.sudah_daftar && !m.sudah_dijadwalkan).length;
  const sudahJadwal = data.filter(m => m.sudah_dijadwalkan).length;

  document.getElementById("cardTotalMahasiswa").textContent = totalMhs.toLocaleString("id-ID");
  document.getElementById("cardSudahDaftar").textContent = sudahDaftar.toLocaleString("id-ID");
  document.getElementById("cardBelumDijadwalkan").textContent = belumJadwal.toLocaleString("id-ID");
  document.getElementById("cardSudahDijadwalkan").textContent = sudahJadwal.toLocaleString("id-ID");
}

// ==================== 5. RINGKASAN INSIGHT OTOMATIS ====================
function renderInsightOtomatis() {
  const box = document.getElementById("boxInsightOtomatis");
  if (!box) return;

  const data = dashState.dataTersaring;
  if (data.length === 0) {
    box.innerHTML = `<div class="col-span-3 text-slate-400 italic">Belum ada data pada filter yang dipilih.</div>`;
    return;
  }

  const pesertaToefl = data.filter(m => m.skor_toefl_akhir !== null);
  const jmlLulus = pesertaToefl.filter(m => m.is_lulus).length;
  const persenLulus = pesertaToefl.length > 0 ? ((jmlLulus / pesertaToefl.length) * 100).toFixed(1) : "0.0";
  const rataToefl = pesertaToefl.length > 0
    ? Math.round(pesertaToefl.reduce((acc, cur) => acc + cur.skor_toefl_akhir, 0) / pesertaToefl.length)
    : 0;

  // Cari prodi dengan rata-rata TOEFL tertinggi (minimal 3 peserta)
  const mapProdi = new Map();
  pesertaToefl.forEach(m => {
    if (m.prodi === "BELUM TERDATA") return;
    const item = mapProdi.get(m.prodi) || { nama: m.prodi, sum: 0, count: 0, lulus: 0 };
    item.sum += m.skor_toefl_akhir;
    item.count += 1;
    if (m.is_lulus) item.lulus += 1;
    mapProdi.set(m.prodi, item);
  });

  let topProdi = "-";
  let topAvg = 0;
  mapProdi.forEach(v => {
    const avg = v.sum / v.count;
    if (avg > topAvg) {
      topAvg = avg;
      topProdi = v.nama;
    }
  });

  box.innerHTML = `
    <div class="bg-white/5 rounded-2xl p-3.5 border border-white/10">
      <p class="text-[11px] text-slate-400 font-bold uppercase">Tingkat Kelulusan TOEFL</p>
      <p class="text-lg font-extrabold text-emerald-400 mt-0.5">${persenLulus}% <span class="text-xs font-normal text-slate-300">(${jmlLulus} dari ${pesertaToefl.length} peserta)</span></p>
    </div>
    <div class="bg-white/5 rounded-2xl p-3.5 border border-white/10">
      <p class="text-[11px] text-slate-400 font-bold uppercase">Rata-Rata Skor Tertinggi</p>
      <p class="text-lg font-extrabold text-sky-400 mt-0.5">${rataToefl || "-"} <span class="text-xs font-normal text-slate-300">poin (termasuk Remedial)</span></p>
    </div>
    <div class="bg-white/5 rounded-2xl p-3.5 border border-white/10">
      <p class="text-[11px] text-slate-400 font-bold uppercase">Prodi Performa Terbaik</p>
      <p class="text-sm font-extrabold text-amber-300 mt-0.5 truncate" title="${topProdi}">${topProdi}</p>
      <p class="text-[11px] text-slate-300">Rata-rata skor: <b>${Math.round(topAvg) || "-"}</b></p>
    </div>
  `;
}

// ==================== 6. GRAFIK TREN PER TAHUN (ANGKATAN) ====================
function renderChartTrenPerTahun() {
  const ctx = document.getElementById("chartTrenPerTahun");
  if (!ctx) return;

  // Gunakan seluruh data sesuai filter jurusan agar tren antar tahun tetap terlihat
  const fJurusan = document.getElementById("dashFilterJurusan")?.value || "SEMUA";
  const sumber = dashState.semuaMahasiswa.filter(m => fJurusan === "SEMUA" || m.jurusan === fJurusan);

  const mapTahun = new Map();
  sumber.forEach(m => {
    const obj = mapTahun.get(m.tahun) || { tahun: m.tahun, lulus: 0, belum: 0, sumSkor: 0, countSkor: 0 };
    if (m.is_lulus) obj.lulus++;
    else obj.belum++;
    if (m.skor_toefl_akhir !== null) {
      obj.sumSkor += m.skor_toefl_akhir;
      obj.countSkor++;
    }
    mapTahun.set(m.tahun, obj);
  });

  const sorted = Array.from(mapTahun.values()).sort((a, b) => Number(a.tahun) - Number(b.tahun));
  const labels = sorted.map(x => `Angkatan ${x.tahun}`);
  const dataLulus = sorted.map(x => x.lulus);
  const dataBelum = sorted.map(x => x.belum);
  const dataAvg = sorted.map(x => (x.countSkor > 0 ? Math.round(x.sumSkor / x.countSkor) : 0));

  if (dashState.chartTahun) dashState.chartTahun.destroy();

  dashState.chartTahun = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Lulus TOEFL",
          data: dataLulus,
          backgroundColor: "#169C53",
          borderRadius: 6,
          yAxisID: "y"
        },
        {
          label: "Belum Lulus",
          data: dataBelum,
          backgroundColor: "#F59E0B",
          borderRadius: 6,
          yAxisID: "y"
        },
        {
          label: "Rata-rata Skor",
          data: dataAvg,
          type: "line",
          borderColor: "#0284C7",
          backgroundColor: "#0284C7",
          borderWidth: 2.5,
          tension: 0.3,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11, weight: "bold" } } } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Jumlah Mahasiswa", font: { size: 10 } } },
        y1: { beginAtZero: false, min: 300, max: 650, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Skor Rata-rata", font: { size: 10 } } }
      }
    }
  });
}

// ==================== 7. GRAFIK ANALISIS PER JURUSAN ====================
function renderChartPerJurusan() {
  const ctx = document.getElementById("chartAnalisisJurusan");
  if (!ctx) return;

  const mapJur = new Map();
  dashState.dataTersaring.forEach(m => {
    if (!m.jurusan || m.jurusan === "LAINNYA") return;
    const obj = mapJur.get(m.jurusan) || { jurusan: m.jurusan, lulus: 0, total: 0, sumSkor: 0, countSkor: 0 };
    obj.total++;
    if (m.is_lulus) obj.lulus++;
    if (m.skor_toefl_akhir !== null) {
      obj.sumSkor += m.skor_toefl_akhir;
      obj.countSkor++;
    }
    mapJur.set(m.jurusan, obj);
  });

  const sorted = Array.from(mapJur.values()).sort((a, b) => b.lulus - a.lulus);
  const labels = sorted.map(x => x.jurusan);
  const persenLulus = sorted.map(x => (x.total > 0 ? Number(((x.lulus / x.total) * 100).toFixed(1)) : 0));
  const avgSkor = sorted.map(x => (x.countSkor > 0 ? Math.round(x.sumSkor / x.countSkor) : 0));

  if (dashState.chartJurusan) dashState.chartJurusan.destroy();

  dashState.chartJurusan = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Tingkat Kelulusan (%)",
          data: persenLulus,
          backgroundColor: "#169C53",
          borderRadius: 6,
          yAxisID: "y"
        },
        {
          label: "Rata-rata Skor TOEFL",
          data: avgSkor,
          backgroundColor: "#0EA5E9",
          borderRadius: 6,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11, weight: "bold" } } } },
      scales: {
        x: { ticks: { font: { size: 10, weight: "bold" } } },
        y: { beginAtZero: true, max: 100, title: { display: true, text: "Kelulusan (%)", font: { size: 10 } } },
        y1: { beginAtZero: false, min: 300, max: 650, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Skor TOEFL", font: { size: 10 } } }
      }
    }
  });
}

// ==================== 8. GRAFIK & TABEL DETAIL PER PROGRAM STUDI ====================
function renderAnalisisPerProdi() {
  const ctx = document.getElementById("chartAnalisisProdi");
  const tbody = document.getElementById("tbodyAnalisisProdi");
  const badgeCount = document.getElementById("badgeJumlahProdiAktif");
  if (!tbody) return;

  const mapProdi = new Map();
  dashState.dataTersaring.forEach(m => {
    if (!m.prodi || m.prodi === "BELUM TERDATA") return;
    const obj = mapProdi.get(m.prodi) || {
      prodi: m.prodi,
      jurusan: m.jurusan,
      batas: m.batas_lulus,
      total: 0,
      lulus: 0,
      sumSspect: 0,
      countSspect: 0,
      sumToefl: 0,
      countToefl: 0
    };
    obj.total++;
    if (m.is_lulus) obj.lulus++;
    if (m.skor_sspect !== null) {
      obj.sumSspect += m.skor_sspect;
      obj.countSspect++;
    }
    if (m.skor_toefl_akhir !== null) {
      obj.sumToefl += m.skor_toefl_akhir;
      obj.countToefl++;
    }
    mapProdi.set(m.prodi, obj);
  });

  const listProdi = Array.from(mapProdi.values()).sort((a, b) => {
    const rA = a.total > 0 ? a.lulus / a.total : 0;
    const rB = b.total > 0 ? b.lulus / b.total : 0;
    return rB - rA;
  });

  if (badgeCount) badgeCount.textContent = `${listProdi.length} Program Studi`;

  // Render Chart Prodi
  if (ctx) {
    if (dashState.chartProdi) dashState.chartProdi.destroy();
    dashState.chartProdi = new Chart(ctx, {
      type: "bar",
      data: {
        labels: listProdi.map(p => p.prodi),
        datasets: [
          {
            label: "Rasio Kelulusan (%)",
            data: listProdi.map(p => (p.total > 0 ? Number(((p.lulus / p.total) * 100).toFixed(1)) : 0)),
            backgroundColor: "#169C53",
            borderRadius: 5
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, max: 100, title: { display: true, text: "Persentase Kelulusan (%)", font: { size: 11 } } },
          y: { ticks: { font: { size: 10, weight: "bold" } } }
        }
      }
    });
  }

  // Render Tabel Prodi
  if (listProdi.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="px-4 py-8 text-center text-slate-400 italic">Tidak ada data program studi pada filter ini.</td></tr>`;
    return;
  }

  tbody.innerHTML = listProdi
    .map((p, idx) => {
      const belum = p.total - p.lulus;
      const avgSspect = p.countSspect > 0 ? Math.round(p.sumSspect / p.countSspect) : "-";
      const avgToefl = p.countToefl > 0 ? Math.round(p.sumToefl / p.countToefl) : "-";
      const rasio = p.total > 0 ? ((p.lulus / p.total) * 100).toFixed(1) : "0.0";
      const warnaRasio = Number(rasio) >= 70 ? "bg-emerald-50 text-[#169C53]" : Number(rasio) >= 40 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-600";

      return `
        <tr class="hover:bg-slate-50">
          <td class="px-4 py-3 font-bold text-slate-400">${idx + 1}</td>
          <td class="px-4 py-3 font-extrabold text-slate-800">${p.prodi}</td>
          <td class="px-4 py-3 text-slate-500 font-semibold">${p.jurusan}</td>
          <td class="px-4 py-3 text-center font-bold text-slate-600">${p.batas}</td>
          <td class="px-4 py-3 text-center font-extrabold text-slate-800">${p.total}</td>
          <td class="px-4 py-3 text-center font-extrabold text-[#169C53]">${p.lulus}</td>
          <td class="px-4 py-3 text-center font-bold text-amber-600">${belum}</td>
          <td class="px-4 py-3 text-center font-bold text-sky-700">${avgSspect}</td>
          <td class="px-4 py-3 text-center font-extrabold text-slate-900">${avgToefl}</td>
          <td class="px-4 py-3 text-center">
            <span class="px-2.5 py-1 rounded-lg font-extrabold text-[11px] ${warnaRasio}">${rasio}%</span>
          </td>
        </tr>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  muatDataDashboardTerpadu(false);
});