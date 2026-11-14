// ============================================================================
// MODUL REKAPAN INDUK MAHASISWA & SERTIFIKAT RESMI (UPA BAHASA POLNES)
// ============================================================================

const rekapanState = {
  semuaData: [],
  dataTersaring: [],
  tabAngkatanAktif: "SEMUA",
  halamanSaatIni: 1,
  perHalaman: 25,
  mahasiswaDetailAktif: null
};

function getDbClientRekapan() {
  return window.supabaseClient || window.supabase || null;
}

// Helper mengambil nilai pertama yang tidak kosong dari beberapa kemungkinan nama kolom DB
function ambilNilaiKolom(obj, daftarKey, fallback = null) {
  if (!obj) return fallback;
  for (const key of daftarKey) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return obj[key];
    }
  }
  return fallback;
}

function ambilAngkaKolom(obj, daftarKey) {
  const raw = ambilNilaiKolom(obj, daftarKey, null);
  if (raw === null) return null;
  const num = Number(raw);
  return !isNaN(num) && num > 0 ? num : null;
}

function ekstrakAngkatanNim(nimRaw, fallback = null) {
  const clean = String(nimRaw || "").replace(/\D/g, "");
  if (clean.length >= 2) {
    const duaDigit = parseInt(clean.substring(0, 2), 10);
    if (!isNaN(duaDigit) && duaDigit >= 10 && duaDigit <= 99) {
      return 2000 + duaDigit;
    }
  }
  if (fallback && !isNaN(parseInt(fallback, 10))) {
    const thn = parseInt(fallback, 10);
    return thn < 100 ? 2000 + thn : thn;
  }
  return new Date().getFullYear();
}

function getBatasLulusJenjang(prodi, jenjangRaw) {
  const gabungan = `${jenjangRaw || ""} ${prodi || ""}`.toUpperCase();
  if (gabungan.includes("D4") || gabungan.includes("SARJANA TERAPAN")) return 450;
  return 400; // Default D3
}

function hitungSkorAkhirMahasiswa(m) {
  const skorToeflUtama = [m.remedial_3, m.remedial_2, m.remedial_1, m.skor_toefl]
    .map(v => Number(v))
    .filter(v => !isNaN(v) && v > 0);

  if (skorToeflUtama.length > 0) return Math.max(...skorToeflUtama);

  const semuaSkor = [m.skor_latihan, m.skor_sspect]
    .map(v => Number(v))
    .filter(v => !isNaN(v) && v > 0);

  return semuaSkor.length > 0 ? Math.max(...semuaSkor) : null;
}

function cekStatusKelulusan(m) {
  const batas = getBatasLulusJenjang(m.program_studi, m.jenjang);
  const nilaiKompetensi = [m.remedial_3, m.remedial_2, m.remedial_1, m.skor_toefl]
    .map(v => Number(v))
    .filter(v => !isNaN(v) && v > 0);

  if (nilaiKompetensi.length === 0) return "BELUM_LULUS";
  const tertinggi = Math.max(...nilaiKompetensi);
  return tertinggi >= batas ? "LULUS" : "BELUM_LULUS";
}

// Ambil SEMUA baris dari tabel Supabase tanpa terpotong limit default 1000
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

// ==================== 1. MUAT & SINKRONISASI SELURUH 1.836+ DATA DATABASE ====================
async function sinkronkanDatabaseRekapan(tampilkanNotif = false) {
  const db = getDbClientRekapan();
  if (!db) return;

  const tbody = document.getElementById("tbodyRekapanMaster");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400 italic">Menarik seluruh 1.836+ data mahasiswa & nilai dari database...</td></tr>`;
  }

  try {
    // 1. Ambil SEMUA baris dari arsip_master_rekapan (menembus limit 1000 baris Supabase)
    const { data: dataMaster, error: errMaster } = await fetchAllRowsSupabase(db, "arsip_master_rekapan", "nim");
    if (errMaster) throw errMaster;

    const mapByNim = new Map();

    (dataMaster || []).forEach(row => {
      const nimKey = String(ambilNilaiKolom(row, ["nim", "nim_mahasiswa", "student_id"], "")).trim();
      if (!nimKey) return;

      const namaAsli = String(
        ambilNilaiKolom(row, ["nama_mahasiswa", "nama", "nama_lengkap", "full_name", "student_name"], "-")
      ).toUpperCase();

      const prodiAsli = String(
        ambilNilaiKolom(row, ["program_studi", "prodi", "study_program", "kelas"], "-")
      ).toUpperCase();

      const jurusanAsli = String(
        ambilNilaiKolom(row, ["jurusan", "department"], "-")
      ).toUpperCase();

      mapByNim.set(nimKey, {
        ...row,
        nim: nimKey,
        nama_mahasiswa: namaAsli,
        jurusan: jurusanAsli,
        program_studi: prodiAsli,
        tahun_angkatan: ekstrakAngkatanNim(nimKey, ambilNilaiKolom(row, ["tahun_angkatan", "angkatan"], null)),
        skor_sspect: ambilAngkaKolom(row, ["skor_sspect", "nilai_sspect", "sspect"]),
        skor_latihan: ambilAngkaKolom(row, ["skor_latihan", "nilai_latihan", "latihan"]),
        skor_toefl: ambilAngkaKolom(row, ["skor_toefl", "nilai_toefl", "toefl", "skor_utama"]),
        remedial_1: ambilAngkaKolom(row, ["remedial_1", "rem_1", "rem1"]),
        remedial_2: ambilAngkaKolom(row, ["remedial_2", "rem_2", "rem2"]),
        remedial_3: ambilAngkaKolom(row, ["remedial_3", "rem_3", "rem3"]),
        listening: ambilAngkaKolom(row, ["listening", "section_1", "sec_1", "s1"]),
        structure: ambilAngkaKolom(row, ["structure", "section_2", "sec_2", "s2"]),
        reading: ambilAngkaKolom(row, ["reading", "section_3", "sec_3", "s3"]),
        tempat_tanggal_lahir: ambilNilaiKolom(row, ["tempat_tanggal_lahir", "ttl", "birth"], ""),
        tanggal_tes: ambilNilaiKolom(row, ["tanggal_tes", "tgl_tes", "test_date"], ""),
        nomor_sertifikat: ambilNilaiKolom(row, ["nomor_sertifikat", "no_sertifikat", "certificate_number"], "")
      });
    });

    // 2. Gabungkan juga tabel hasil tes / SSPECT / TOEFL jika disimpan terpisah
    const kandidatTabelHasil = ["hasil_sspect", "nilai_sspect", "sspect_hasil", "hasil_tes", "hasil_toefl"];
    for (const namaTabel of kandidatTabelHasil) {
      const { data: rowsHasil, error: errHasil } = await fetchAllRowsSupabase(db, namaTabel);
      if (!errHasil && Array.isArray(rowsHasil) && rowsHasil.length > 0) {
        rowsHasil.forEach(s => {
          const nimKey = String(ambilNilaiKolom(s, ["nim", "nim_mahasiswa", "student_id"], "")).trim();
          if (!nimKey) return;

          const jenis = String(ambilNilaiKolom(s, ["kategori_tes", "jenis_tes", "kategori"], namaTabel)).toUpperCase();
          const skorVal = ambilAngkaKolom(s, ["skor_sspect", "skor_toefl", "total_skor", "skor_akhir", "nilai"]);

          const namaDariHasil = String(
            ambilNilaiKolom(s, ["nama_mahasiswa", "nama", "nama_lengkap", "student_name"], "-")
          ).toUpperCase();

          const prodiDariHasil = String(
            ambilNilaiKolom(s, ["program_studi", "prodi", "kelas"], "-")
          ).toUpperCase();

          const existing = mapByNim.get(nimKey) || {
            nim: nimKey,
            nama_mahasiswa: namaDariHasil,
            jurusan: String(ambilNilaiKolom(s, ["jurusan"], "-")).toUpperCase(),
            program_studi: prodiDariHasil,
            tahun_angkatan: ekstrakAngkatanNim(nimKey, ambilNilaiKolom(s, ["tahun_angkatan", "angkatan"], null))
          };

          if ((existing.nama_mahasiswa === "-" || !existing.nama_mahasiswa) && namaDariHasil !== "-") {
            existing.nama_mahasiswa = namaDariHasil;
          }
          if ((existing.program_studi === "-" || !existing.program_studi) && prodiDariHasil !== "-") {
            existing.program_studi = prodiDariHasil;
          }

          if (skorVal) {
            if (jenis.includes("SSPECT")) {
              existing.skor_sspect = skorVal;
              existing.sspect_listening = existing.sspect_listening || ambilAngkaKolom(s, ["section_1", "listening"]);
              existing.sspect_structure = existing.sspect_structure || ambilAngkaKolom(s, ["section_2", "structure"]);
              existing.sspect_reading = existing.sspect_reading || ambilAngkaKolom(s, ["section_3", "reading"]);
            } else if (jenis.includes("LATIHAN")) {
              existing.skor_latihan = skorVal;
            } else if (jenis.includes("REM") && jenis.includes("3")) {
              existing.remedial_3 = skorVal;
            } else if (jenis.includes("REM") && jenis.includes("2")) {
              existing.remedial_2 = skorVal;
            } else if (jenis.includes("REM")) {
              existing.remedial_1 = skorVal;
            } else if (!existing.skor_toefl && jenis.includes("TOEFL")) {
              existing.skor_toefl = skorVal;
            }
          }

          existing.listening = existing.listening || ambilAngkaKolom(s, ["section_1", "listening"]);
          existing.structure = existing.structure || ambilAngkaKolom(s, ["section_2", "structure"]);
          existing.reading = existing.reading || ambilAngkaKolom(s, ["section_3", "reading"]);

          mapByNim.set(nimKey, existing);
        });
      }
    }

    rekapanState.semuaData = Array.from(mapByNim.values()).map(m => ({
      ...m,
      skor_akhir: hitungSkorAkhirMahasiswa(m),
      status_lulus: cekStatusKelulusan(m)
    }));

    renderTabAngkatan();
    terapkanFilterRekapan();

    if (tampilkanNotif) {
      alert(`Sinkronisasi selesai! Berhasil memuat seluruh ${rekapanState.semuaData.length} data mahasiswa dari database.`);
    }
  } catch (err) {
    console.error("Gagal memuat rekapan:", err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-rose-500 font-bold">Gagal memuat data dari database: ${err.message}</td></tr>`;
    }
  }
}

// ==================== 2. RENDER TAB ANGKATAN (AUTO-NIM) ====================
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

// ==================== 3. FILTER PENCARIAN OTOMATIS & RENDER TABEL ====================
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
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-slate-400 italic">Tidak ada data mahasiswa yang sesuai dengan filter pencarian.</td></tr>`;
    return;
  }

  tbody.innerHTML = sliceData
    .map((m, i) => {
      const noUrut = start + i + 1;
      const lulus = m.status_lulus === "LULUS";
      const badgeStatus = lulus
        ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#169C53] border border-emerald-200 text-[10px] font-extrabold">LULUS</span>`
        : `<span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">BELUM LULUS</span>`;

      const skorTampil = m.skor_akhir !== null ? m.skor_akhir : "-";

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
          <td class="px-4 py-3.5 text-center">
            <span class="px-3 py-1 rounded-lg bg-slate-100 font-mono font-extrabold text-slate-800 text-xs">${skorTampil}</span>
          </td>
          <td class="px-4 py-3.5 text-center">${badgeStatus}</td>
          <td class="px-4 py-3.5 text-center">
            <div class="inline-flex items-center gap-1.5">
              <button type="button" onclick="bukaModalDetailMahasiswa('${m.nim}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#169C53] text-xs font-extrabold inline-flex items-center gap-1 transition-colors">
                <i class="ri-eye-line"></i>
                <span>Detail</span>
              </button>
              <button type="button" onclick="unduhSertifikatByNim('${m.nim}')" class="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#169C53] text-[#169C53] hover:text-white border border-emerald-200 text-xs font-extrabold inline-flex items-center gap-1 transition-colors" title="Unduh Sertifikat">
                <i class="ri-award-line"></i>
              </button>
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

// ==================== 4. MODAL DETAIL MAHASISWA & SIMPAN SERTIFIKAT ====================
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
  document.getElementById("detailSubIdentitas").textContent = `NIM: ${m.nim} • ${m.jurusan || "-"} • ${m.program_studi || "-"}`;

  // Isi 6 kotak riwayat skor
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

  document.getElementById("inputDetailTtl").value = m.tempat_tanggal_lahir || "";
  document.getElementById("inputDetailTanggalTes").value = m.tanggal_tes || "";
  document.getElementById("inputDetailNomorSertifikat").value =
    m.nomor_sertifikat || `0001 / PL7.18 / UPA.BAHASA / TOEFL-P / ${new Date().getFullYear()}`;

  const modal = document.getElementById("modalDetailMahasiswa");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function tutupModalDetail() {
  const modal = document.getElementById("modalDetailMahasiswa");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

async function simpanPerubahanDetailMahasiswa() {
  const m = rekapanState.mahasiswaDetailAktif;
  const db = getDbClientRekapan();
  if (!m || !db) return;

  const ttl = document.getElementById("inputDetailTtl").value.trim();
  const tglTes = document.getElementById("inputDetailTanggalTes").value.trim();
  const noSertif = document.getElementById("inputDetailNomorSertifikat").value.trim();

  const { error } = await db
    .from("arsip_master_rekapan")
    .update({
      tempat_tanggal_lahir: ttl,
      tanggal_tes: tglTes,
      nomor_sertifikat: noSertif
    })
    .eq("nim", m.nim);

  if (error) {
    alert("Gagal menyimpan detail sertifikat: " + error.message);
    return;
  }

  m.tempat_tanggal_lahir = ttl;
  m.tanggal_tes = tglTes;
  m.nomor_sertifikat = noSertif;
  alert("Identitas & Nomor Sertifikat mahasiswa berhasil diperbarui!");
}

// ==================== 5. GENERATOR NOMOR SERTIFIKAT BERANTAI 1 ANGKATAN (A11 -> A12, A13...) ====================
function bukaModalBatchNomorSertifikat() {
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
  const clean = String(kodeAwal || "A11").trim().toUpperCase();
  const match = clean.match(/^([A-Z]*)(\d+)$/);
  if (!match) return `${clean}-${indeksOffset + 1}`;

  const prefixHuruf = match[1];
  const angkaStr = match[2];
  const panjangDigit = angkaStr.length;
  const angkaBaru = parseInt(angkaStr, 10) + indeksOffset;
  return `${prefixHuruf}${String(angkaBaru).padStart(panjangDigit, "0")}`;
}

function updatePreviewBatchNomor() {
  const awal = document.getElementById("batchKodeAwal")?.value || "A11";
  const suffix = document.getElementById("batchFormatSuffix")?.value || "";
  const previewEl = document.getElementById("previewUrutanBatchNomor");
  if (!previewEl) return;

  const baris = [0, 1, 2].map(idx => {
    const kode = generateNomorBerantai(awal, idx);
    return `${idx + 1}. <b>${kode}</b> ${suffix}`;
  });
  previewEl.innerHTML = baris.join("<br />");
}

async function eksekusiBatchNomorSertifikat() {
  const db = getDbClientRekapan();
  if (!db) return;

  const targetAngkatan = document.getElementById("batchTargetAngkatan").value;
  const kodeAwal = document.getElementById("batchKodeAwal").value.trim().toUpperCase();
  const suffix = document.getElementById("batchFormatSuffix").value.trim();

  if (!kodeAwal) {
    alert("Masukkan kode nomor awal terlebih dahulu (contoh: A11)!");
    return;
  }

  const daftarTarget = rekapanState.semuaData
    .filter(m => String(m.tahun_angkatan) === String(targetAngkatan))
    .sort((a, b) => String(a.nim).localeCompare(String(b.nim)));

  if (daftarTarget.length === 0) {
    alert(`Tidak ada data mahasiswa untuk Angkatan ${targetAngkatan}.`);
    return;
  }

  if (!confirm(`Terapkan penomoran otomatis mulai dari ${kodeAwal} ke ${daftarTarget.length} mahasiswa Angkatan ${targetAngkatan}?`)) {
    return;
  }

  const btn = document.getElementById("btnEksekusiBatchNomor");
  btn.disabled = true;

  try {
    // Update hanya kolom nomor_sertifikat per batch agar nama_mahasiswa, prodi, dan nilai asli tidak tertimpa
    const chunkSize = 200;
    for (let i = 0; i < daftarTarget.length; i += chunkSize) {
      const slice = daftarTarget.slice(i, i + chunkSize);
      const promises = slice.map((m, offsetLocal) => {
        const idxGlobal = i + offsetLocal;
        const kodeUrut = generateNomorBerantai(kodeAwal, idxGlobal);
        const nomorLengkap = suffix ? `${kodeUrut} ${suffix}` : kodeUrut;
        m.nomor_sertifikat = nomorLengkap;
        return db
          .from("arsip_master_rekapan")
          .update({ nomor_sertifikat: nomorLengkap })
          .eq("nim", m.nim);
      });
      await Promise.all(promises);
    }

    tutupModalBatchNomor();
    alert(`Berhasil! ${daftarTarget.length} nomor sertifikat Angkatan ${targetAngkatan} telah dibuat berurutan mulai dari ${kodeAwal}.`);
  } catch (err) {
    alert("Gagal menyimpan nomor sertifikat massal: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ==================== 6. UNDUH DATA EXCEL PER ANGKATAN & KATEGORI ====================
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
        "NOMOR SERTIFIKAT": m.nomor_sertifikat || "-"
      };
    }
    if (pilihKategori === "REMEDIAL") {
      return {
        ...dasar,
        "REMEDIAL 1": m.remedial_1 ?? "-",
        "REMEDIAL 2": m.remedial_2 ?? "-",
        "REMEDIAL 3": m.remedial_3 ?? "-",
        "SKOR AKHIR": m.skor_akhir ?? "-",
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
      "SKOR AKHIR": m.skor_akhir ?? "-",
      STATUS: m.status_lulus === "LULUS" ? "LULUS" : "BELUM LULUS",
      "NOMOR SERTIFIKAT": m.nomor_sertifikat || "-"
    };
  });

  const ws = XLSX.utils.json_to_sheet(rowsExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekapan_${pilihKategori}`);

  const namaFile = `Rekapan_${pilihKategori}_Angkatan_${pilihAngkatan}.xlsx`;
  XLSX.writeFile(wb, namaFile);
  tutupModalUnduhExcel();
}

// ==================== 7. UNDUH / CETAK SERTIFIKAT RESMI (TEMPLATE ./img/sertif.png A4 LANDSCAPE) ====================
function unduhSertifikatByNim(nimTarget) {
  const m = rekapanState.semuaData.find(x => String(x.nim) === String(nimTarget));
  if (!m) return;
  cetakHalamanSertifikatResmi(m);
}

function unduhSertifikatMahasiswaAktif() {
  const m = rekapanState.mahasiswaDetailAktif;
  if (!m) return;
  m.tempat_tanggal_lahir = document.getElementById("inputDetailTtl").value.trim() || m.tempat_tanggal_lahir;
  m.tanggal_tes = document.getElementById("inputDetailTanggalTes").value.trim() || m.tanggal_tes;
  m.nomor_sertifikat = document.getElementById("inputDetailNomorSertifikat").value.trim() || m.nomor_sertifikat;
  cetakHalamanSertifikatResmi(m);
}

function cetakHalamanSertifikatResmi(m) {
  // Deteksi apakah sertifikat TOEFL atau SSPECT berdasarkan nilai yang dimiliki
  const punyaToefl = Boolean(m.skor_toefl || m.remedial_1 || m.remedial_2 || m.remedial_3);
  const isSspectOnly = !punyaToefl && Boolean(m.skor_sspect);

  const jenisTesText = isSspectOnly ? "SSPECT Placement Test" : "Toefl Prediction Test";
  const defaultKodeSurat = isSspectOnly ? "SSPECT" : "TOEFL-P";
  const nomor = m.nomor_sertifikat || `0355 / PL7.18 / UPA.BAHASA / ${defaultKodeSurat} / ${new Date().getFullYear()}`;
  const ttl = m.tempat_tanggal_lahir || "Samarinda, -";
  const tglTes = m.tanggal_tes || "04 May 2026";

  const sec1 = isSspectOnly ? (m.sspect_listening ?? m.listening ?? "-") : (m.listening ?? m.sspect_listening ?? "-");
  const sec2 = isSspectOnly ? (m.sspect_structure ?? m.structure ?? "-") : (m.structure ?? m.sspect_structure ?? "-");
  const sec3 = isSspectOnly ? (m.sspect_reading ?? m.reading ?? "-") : (m.reading ?? m.sspect_reading ?? "-");
  const totalSkor = isSspectOnly ? (m.skor_sspect ?? "-") : (m.skor_akhir ?? "-");

  // Resolusi URL absolut untuk ./img/sertif.png agar tetap muncul di window.open
  const bgUrl = new URL("./img/sertif.png", window.location.href).href;

  const win = window.open("", "_blank", "width=1120,height=800");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak/mengunduh sertifikat PDF.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Sertifikat ${isSspectOnly ? "SSPECT" : "TOEFL"} - ${m.nama_mahasiswa} (${m.nim})</title>
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
        .toolbar-cetak select, .toolbar-cetak button {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-weight: bold;
          cursor: pointer;
        }
        .toolbar-cetak button {
          background: #169C53;
          color: #fff;
        }
        .page-a4 {
          width: 297mm;
          height: 210mm;
          position: relative;
          background-color: #ffffff;
          background-image: url('${bgUrl}');
          background-size: 100% 100%;
          background-repeat: no-repeat;
          background-position: center;
          overflow: hidden;
        }
        /* Area Konten Utama tepat di tengah template ./img/sertif.png */
        .cert-overlay {
          position: absolute;
          top: 42mm;
          left: 28mm;
          right: 22mm;
          bottom: 18mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #111827;
        }
        .cert-heading {
          text-align: center;
          margin-bottom: 3mm;
        }
        .cert-heading h1 {
          margin: 0;
          font-size: 17pt;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .cert-heading .no-surat {
          margin-top: 1.5mm;
          font-size: 11pt;
          font-weight: normal;
        }
        .presented-to {
          font-size: 11.5pt;
          font-style: italic;
          margin-bottom: 3mm;
        }
        .biodata-table {
          width: 155mm;
          border-collapse: collapse;
          font-size: 11.5pt;
          margin-bottom: 3.5mm;
        }
        .biodata-table td {
          padding: 1.2mm 2mm;
          vertical-align: top;
        }
        .biodata-table td.lbl {
          width: 48mm;
        }
        .biodata-table td.sep {
          width: 5mm;
          text-align: center;
        }
        .biodata-table td.val-name {
          font-weight: bold;
          font-size: 13pt;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .achieved-text {
          font-size: 11.5pt;
          font-style: italic;
          margin-bottom: 3mm;
        }
        .score-grid {
          width: 175mm;
          border-collapse: collapse;
          text-align: center;
          font-size: 11pt;
          margin-bottom: 5mm;
        }
        .score-grid th, .score-grid td {
          border: 1.2px solid #1e293b;
          padding: 2.2mm 3mm;
        }
        .score-grid th {
          font-weight: bold;
          font-style: italic;
          background: rgba(255, 255, 255, 0.72);
        }
        .score-grid td {
          font-size: 13pt;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.82);
        }
        .ttd-wrapper {
          width: 175mm;
          display: flex;
          justify-content: flex-start;
          padding-left: 10mm;
          margin-top: 1mm;
        }
        .ttd-box {
          font-size: 11pt;
          line-height: 1.35;
        }
        .ttd-space {
          height: 16mm;
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
          <span>Jenis Sertifikat: </span>
          <select id="pilihJenisSertif" onchange="gantiJenisSertifikat(this.value)">
            <option value="TOEFL" ${!isSspectOnly ? "selected" : ""}>Sertifikat TOEFL (Toefl Prediction Test)</option>
            <option value="SSPECT" ${isSspectOnly ? "selected" : ""}>Sertifikat SSPECT (SSPECT Placement Test)</option>
          </select>
        </div>
        <button type="button" onclick="window.print()">Cetak / Simpan PDF (A4 Landscape)</button>
      </div>

      <div class="page-a4">
        <div class="cert-overlay">
          <div class="cert-heading">
            <h1>CERTIFICATE OF ACHIEVEMENT</h1>
            <div class="no-surat" id="teksNomorSurat">No : ${nomor}</div>
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
              <td>${m.program_studi || "-"}</td>
            </tr>
            <tr>
              <td class="lbl">Date of test taken</td>
              <td class="sep">:</td>
              <td>${tglTes}</td>
            </tr>
          </table>

          <div class="achieved-text">
            Achieved the following score on <span id="teksJenisTes">${jenisTesText}</span>
          </div>

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
                <td id="cellSec1">${sec1}</td>
                <td id="cellSec2">${sec2}</td>
                <td id="cellSec3">${sec3}</td>
                <td id="cellTotal">${totalSkor}</td>
              </tr>
            </tbody>
          </table>

          <div class="ttd-wrapper">
            <div class="ttd-box">
              <div>Samarinda, ${tglTes}</div>
              <div>Head of UPA. Bahasa</div>
              <div class="ttd-space"></div>
              <div><b><u>Dwi Titi Maesaroh, S.Pd., M.Pd.</u></b></div>
              <div>NIP. 198901172024062002</div>
            </div>
          </div>
        </div>
      </div>

      <script>
        const dataCert = {
          toefl: {
            jenis: "Toefl Prediction Test",
            s1: "${m.listening ?? "-"}",
            s2: "${m.structure ?? "-"}",
            s3: "${m.reading ?? "-"}",
            total: "${m.skor_akhir ?? "-"}"
          },
          sspect: {
            jenis: "SSPECT Placement Test",
            s1: "${m.sspect_listening ?? m.listening ?? "-"}",
            s2: "${m.sspect_structure ?? m.structure ?? "-"}",
            s3: "${m.sspect_reading ?? m.reading ?? "-"}",
            total: "${m.skor_sspect ?? "-"}"
          }
        };

        function gantiJenisSertifikat(tipe) {
          const d = tipe === "SSPECT" ? dataCert.sspect : dataCert.toefl;
          document.getElementById("teksJenisTes").textContent = d.jenis;
          document.getElementById("cellSec1").textContent = d.s1;
          document.getElementById("cellSec2").textContent = d.s2;
          document.getElementById("cellSec3").textContent = d.s3;
          document.getElementById("cellTotal").textContent = d.total;
        }
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// ==================== 8. HELPER SIDEBAR & INIT ====================
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