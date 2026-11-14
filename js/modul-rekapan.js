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
  const kandidat = [
    m.remedial_3,
    m.remedial_2,
    m.remedial_1,
    m.skor_toefl,
    m.skor_latihan,
    m.skor_sspect
  ]
    .map(v => Number(v))
    .filter(v => !isNaN(v) && v > 0);

  if (kandidat.length === 0) return null;
  // Ambil skor TOEFL/Remedial tertinggi jika ada, atau skor tes yang tersedia
  const skorToeflUtama = [m.remedial_3, m.remedial_2, m.remedial_1, m.skor_toefl]
    .map(v => Number(v))
    .filter(v => !isNaN(v) && v > 0);

  if (skorToeflUtama.length > 0) return Math.max(...skorToeflUtama);
  return Math.max(...kandidat);
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

// ==================== 1. MUAT & SINKRONISASI DATA DATABASE (TERMASUK SSPECT) ====================
async function sinkronkanDatabaseRekapan(tampilkanNotif = false) {
  const db = getDbClientRekapan();
  if (!db) return;

  const tbody = document.getElementById("tbodyRekapanMaster");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-slate-400 italic">Menarik & menggabungkan data arsip serta skor SSPECT dari database...</td></tr>`;
  }

  try {
    // 1. Ambil arsip_master_rekapan
    const { data: dataMaster, error: errMaster } = await db
      .from("arsip_master_rekapan")
      .select("*")
      .order("nim", { ascending: true });

    if (errMaster) throw errMaster;

    const mapByNim = new Map();

    (dataMaster || []).forEach(row => {
      const nimKey = String(row.nim || "").trim();
      if (!nimKey) return;
      mapByNim.set(nimKey, {
        ...row,
        nim: nimKey,
        nama_mahasiswa: String(row.nama_mahasiswa || "-").toUpperCase(),
        tahun_angkatan: ekstrakAngkatanNim(nimKey, row.tahun_angkatan),
        skor_sspect: row.skor_sspect ?? row.nilai_sspect ?? null,
        skor_latihan: row.skor_latihan ?? row.nilai_latihan ?? null,
        skor_toefl: row.skor_toefl ?? row.nilai_toefl ?? null,
        remedial_1: row.remedial_1 ?? null,
        remedial_2: row.remedial_2 ?? null,
        remedial_3: row.remedial_3 ?? null
      });
    });

    // 2. Cek & gabungkan tabel SSPECT jika data SSPECT disimpan di tabel terpisah (mis. hasil_sspect / sspect_results)
    const kandidatTabelSspect = ["hasil_sspect", "nilai_sspect", "sspect_hasil", "hasil_tes"];
    for (const namaTabel of kandidatTabelSspect) {
      const { data: rowsSspect, error: errSspect } = await db
        .from(namaTabel)
        .select("*")
        .limit(5000);

      if (!errSspect && Array.isArray(rowsSspect) && rowsSspect.length > 0) {
        rowsSspect.forEach(s => {
          const nimKey = String(s.nim || s.nim_mahasiswa || "").trim();
          if (!nimKey) return;

          const jenis = String(s.kategori_tes || s.jenis_tes || namaTabel).toUpperCase();
          const skorVal = Number(s.skor_sspect ?? s.total_skor ?? s.skor_akhir ?? s.nilai ?? 0);
          if (!skorVal || isNaN(skorVal)) return;

          const existing = mapByNim.get(nimKey) || {
            nim: nimKey,
            nama_mahasiswa: String(s.nama_mahasiswa || s.nama || "-").toUpperCase(),
            jurusan: s.jurusan || "-",
            program_studi: s.program_studi || s.prodi || "-",
            tahun_angkatan: ekstrakAngkatanNim(nimKey, s.tahun_angkatan)
          };

          if (jenis.includes("SSPECT")) {
            existing.skor_sspect = skorVal;
            existing.sspect_listening = existing.sspect_listening || s.section_1 || s.listening || null;
            existing.sspect_structure = existing.sspect_structure || s.section_2 || s.structure || null;
            existing.sspect_reading = existing.sspect_reading || s.section_3 || s.reading || null;
          } else if (jenis.includes("LATIHAN")) {
            existing.skor_latihan = skorVal;
          } else if (!existing.skor_toefl && jenis.includes("TOEFL")) {
            existing.skor_toefl = skorVal;
          }

          if (!existing.listening && (s.section_1 || s.listening)) existing.listening = s.section_1 || s.listening;
          if (!existing.structure && (s.section_2 || s.structure)) existing.structure = s.section_2 || s.structure;
          if (!existing.reading && (s.section_3 || s.reading)) existing.reading = s.section_3 || s.reading;

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
      alert(`Sinkronisasi selesai! Total ${rekapanState.semuaData.length} data mahasiswa & riwayat nilai SSPECT/TOEFL dimuat.`);
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

  // Isi opsi modal Batch Nomor Sertifikat & Modal Export Excel
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

  // Update Statistik
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

  document.getElementById("inputDetailTtl").value = m.tempat_tanggal_lahir || "Samarinda, -";
  document.getElementById("inputDetailTanggalTes").value = m.tanggal_tes || "15 November 2026";
  document.getElementById("inputDetailNomorSertifikat").value =
    m.nomor_sertifikat || `L7.18 / UPA.BAHASA / TOEFL-P / ${new Date().getFullYear()}`;

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
    const payloads = daftarTarget.map((m, idx) => {
      const kodeUrut = generateNomorBerantai(kodeAwal, idx);
      const nomorLengkap = suffix ? `${kodeUrut} ${suffix}` : kodeUrut;
      m.nomor_sertifikat = nomorLengkap;
      return {
        nim: m.nim,
        nama_mahasiswa: m.nama_mahasiswa,
        tahun_angkatan: m.tahun_angkatan,
        nomor_sertifikat: nomorLengkap
      };
    });

    const { error } = await db
      .from("arsip_master_rekapan")
      .upsert(payloads, { onConflict: "nim" });

    if (error) throw error;

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

// ==================== 7. UNDUH / CETAK SERTIFIKAT RESMI UPA BAHASA POLNES ====================
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
  const nomor = m.nomor_sertifikat || "A11 / PL7.18 / UPA.BAHASA / TOEFL-P / 2026";
  const ttl = m.tempat_tanggal_lahir || "Samarinda, -";
  const tglTes = m.tanggal_tes || "15 November 2026";
  const sec1 = m.listening ?? m.sspect_listening ?? "-";
  const sec2 = m.structure ?? m.sspect_structure ?? "-";
  const sec3 = m.reading ?? m.sspect_reading ?? "-";
  const totalSkor = m.skor_akhir ?? "-";

  const win = window.open("", "_blank", "width=1050,height=760");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak/mengunduh sertifikat PDF.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Sertifikat TOEFL - ${m.nama_mahasiswa} (${m.nim})</title>
      <style>
        @page { size: A4 landscape; margin: 0; }
        body {
          margin: 0;
          padding: 24px;
          background: #e2e8f0;
          font-family: 'Times New Roman', Georgia, serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .sheet {
          width: 297mm;
          height: 210mm;
          background: #ffffff;
          box-sizing: border-box;
          padding: 14mm 18mm;
          position: relative;
          border: 8px double #0f5132;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .inner-border {
          border: 2px solid #b8860b;
          height: 100%;
          box-sizing: border-box;
          padding: 10mm 14mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0f5132;
          padding-bottom: 8px;
        }
        .ministry {
          font-size: 11pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .polnes {
          font-size: 14pt;
          font-weight: bold;
          color: #0f5132;
          text-transform: uppercase;
          margin: 2px 0;
        }
        .upa {
          font-size: 12pt;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .address {
          font-size: 9pt;
          font-family: Arial, sans-serif;
          color: #475569;
          margin-top: 2px;
        }
        .title-block {
          text-align: center;
          margin-top: 6px;
        }
        .cert-title {
          font-size: 24pt;
          font-weight: bold;
          letter-spacing: 3px;
          color: #0f5132;
          margin: 0;
        }
        .cert-no {
          font-family: Arial, sans-serif;
          font-size: 10pt;
          font-weight: bold;
          margin-top: 4px;
          color: #1e293b;
        }
        .body-text {
          text-align: center;
          font-size: 12pt;
          line-height: 1.5;
        }
        .student-name {
          font-size: 20pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #0f172a;
          border-bottom: 1.5px solid #0f5132;
          display: inline-block;
          padding: 2px 24px;
          margin: 4px 0;
        }
        .meta-table {
          margin: 6px auto;
          font-size: 11pt;
          text-align: left;
        }
        .meta-table td {
          padding: 2px 10px;
        }
        .score-table {
          width: 78%;
          margin: 8px auto;
          border-collapse: collapse;
          font-family: Arial, sans-serif;
          font-size: 10.5pt;
        }
        .score-table th, .score-table td {
          border: 1px solid #334155;
          padding: 6px 12px;
        }
        .score-table th {
          background: #f1f5f9;
          text-align: left;
        }
        .score-val {
          text-align: center;
          font-weight: bold;
          width: 110px;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 11pt;
          margin-top: 6px;
        }
        .sign-box {
          text-align: left;
          width: 260px;
        }
        .sign-space {
          height: 52px;
        }
        @media print {
          body { background: none; padding: 0; }
          .sheet { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="inner-border">
          <div class="header">
            <div class="ministry">Ministry of Higher Education, Science, and Technology</div>
            <div class="polnes">Politeknik Negeri Samarinda</div>
            <div class="upa">LANGUAGE SUPPORT UNIT (UPA BAHASA)</div>
            <div class="address">Jl. Dr. Ciptomangunkusumo Kampus Gunung Lipan Samarinda 75131 Kalimantan Timur</div>
          </div>

          <div class="title-block">
            <h1 class="cert-title">CERTIFICATE OF ACHIEVEMENT</h1>
            <div class="cert-no">Number: ${nomor}</div>
          </div>

          <div class="body-text">
            <div>This is to certify that</div>
            <div class="student-name">${m.nama_mahasiswa}</div>
            <table class="meta-table">
              <tr>
                <td>Student ID (NIM)</td>
                <td>: <b>${m.nim}</b></td>
                <td style="padding-left: 28px;">Study Program</td>
                <td>: <b>${m.program_studi || "-"}</b></td>
              </tr>
              <tr>
                <td>Place, Date of Birth</td>
                <td>: ${ttl}</td>
                <td style="padding-left: 28px;">Date of Test Taken</td>
                <td>: ${tglTes}</td>
              </tr>
            </table>
            <div>has taken the <b>English Proficiency Test (TOEFL-Equivalent)</b> with the following scores:</div>

            <table class="score-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th style="text-align:center;">Converted Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Section 1: Listening Comprehension</td>
                  <td class="score-val">${sec1}</td>
                </tr>
                <tr>
                  <td>Section 2: Structure and Written Expression</td>
                  <td class="score-val">${sec2}</td>
                </tr>
                <tr>
                  <td>Section 3: Reading Comprehension</td>
                  <td class="score-val">${sec3}</td>
                </tr>
                <tr style="background:#ecfdf5;">
                  <td><b>TOTAL SCORE</b></td>
                  <td class="score-val" style="font-size:12pt;color:#0f5132;">${totalSkor}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div style="font-size:9pt;font-family:Arial,sans-serif;color:#64748b;">
              Valid for 2 (two) years from the date of test taken.<br />
              Verified by UPA Bahasa Politeknik Negeri Samarinda.
            </div>
            <div class="sign-box">
              <div>Samarinda, ${tglTes}</div>
              <div>Head of UPA Bahasa,</div>
              <div class="sign-space"></div>
              <div><b><u>Rina Sari, S.Pd., M.Pd.</u></b></div>
              <div style="font-size:9.5pt;">NIP. 19800512 200501 2 002</div>
            </div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 400);
        };
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