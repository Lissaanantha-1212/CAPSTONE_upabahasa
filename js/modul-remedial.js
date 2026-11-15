// ============================================================================
// MODUL PENJADWALAN UJIAN REMEDIAL TOEFL (UPA BAHASA POLNES)
// - Antrean mentah dibaca dari tabel `pendaftaran_remedial`
// - Saat dikunci, sesi masuk ke `jadwal_log` (kolom asli) + `peserta_ujian`
// - Antrean mentah di `pendaftaran_remedial` otomatis dihapus setelah dikunci
// ============================================================================

const KAPASITAS_MAKS_LAB_REMEDIAL = 25;

const remedialState = {
  semuaJadwalLog: [],
  semuaPesertaUjian: [],
  antreanMenunggu: [],
  sesiTerkunci: [],
  selectedIds: new Set()
};

function getDbRemedial() {
  return window.supabaseClient || window.supabase || null;
}

function formatTanggalIndoRem(tglStr) {
  if (!tglStr) return "-";
  const d = new Date(tglStr);
  if (isNaN(d.getTime())) return tglStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function isRowSudahSelesaiLog(item) {
  const st = String(item.status || "").toUpperCase();
  return ["SELESAI", "LOGGED", "ARSIP", "ARCHIVED", "MATCHED", "DONE", "TERARSIP"].includes(st);
}

// ==================== 1. MUAT ANTREAN & LOG TERKUNCI ====================
async function muatSemuaDataRemedial(tampilkanNotif = false) {
  const db = getDbRemedial();
  if (!db) return;

  const tbodyAntrean = document.getElementById("tbodyAntreanRemedial");
  const tbodyTerkunci = document.getElementById("tbodyLogTerkunciRemedial");

  try {
    const [resAntrean, resJadwal, resPeserta] = await Promise.all([
      db.from("pendaftaran_remedial").select("*").order("created_at", { ascending: true }),
      db.from("jadwal_log").select("*").order("id", { ascending: true }),
      db.from("peserta_ujian").select("*").order("id_meja", { ascending: true })
    ]);

    if (resAntrean.error) throw resAntrean.error;
    if (resJadwal.error) throw resJadwal.error;
    if (resPeserta.error) throw resPeserta.error;

    const antrean = resAntrean.data || [];
    const allJadwal = resJadwal.data || [];
    const allPeserta = resPeserta.data || [];

    remedialState.antreanMenunggu = antrean;
    remedialState.semuaJadwalLog = allJadwal;
    remedialState.semuaPesertaUjian = allPeserta;

    // Sesi remedial yang sudah dikunci masuk ke jadwal_log dengan jenis_tes / status REMEDIAL
    const terkunci = allJadwal.filter(item => {
      if (isRowSudahSelesaiLog(item)) return false;
      const jenis = String(item.jenis_tes || "").toUpperCase();
      const st = String(item.status || "").toUpperCase();
      return jenis.includes("REMEDIAL") || st === "REMEDIAL";
    });

    const validIdSet = new Set(antrean.map(x => String(x.id)));
    Array.from(remedialState.selectedIds).forEach(idStr => {
      if (!validIdSet.has(idStr)) remedialState.selectedIds.delete(idStr);
    });

    remedialState.sesiTerkunci = terkunci;

    const inputNamaRombongan = document.getElementById("remNamaRombongan");
    if (inputNamaRombongan && !inputNamaRombongan.value.trim()) {
      inputNamaRombongan.placeholder = `Otomatis: REMEDIAL-${terkunci.length + 1}`;
    }

    document.getElementById("countAntreanRemedial").textContent = antrean.length;
    document.getElementById("countTerkunciRemedial").textContent = terkunci.length;

    updateBadgeTerpilih();
    renderTabelAntreanRemedial(antrean);
    renderTabelLogTerkunciRemedial(terkunci);
    cekBentrokRealtimeRemedial();

    if (tampilkanNotif) {
      alert(`Sinkronisasi selesai! ${antrean.length} mahasiswa menunggu jadwal, ${terkunci.length} sesi remedial terkunci.`);
    }
  } catch (err) {
    console.error("Gagal memuat data remedial:", err);
    if (tbodyAntrean) {
      tbodyAntrean.innerHTML = `<tr><td colspan="8" class="px-6 py-10 text-center text-rose-500 font-bold">Gagal memuat antrean: ${err.message}</td></tr>`;
    }
    if (tbodyTerkunci) {
      tbodyTerkunci.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-rose-500 font-bold">Gagal memuat log terkunci: ${err.message}</td></tr>`;
    }
  }
}

// ==================== 2. SELEKSI ANTREAN (MAX 25 PER LAB) ====================
function updateBadgeTerpilih() {
  const jml = remedialState.selectedIds.size;
  const badge = document.getElementById("badgeJumlahDipilihRemedial");
  if (!badge) return;

  badge.textContent = `Terpilih: ${jml} / ${KAPASITAS_MAKS_LAB_REMEDIAL} Mahasiswa`;
  badge.className = jml > 0
    ? "px-3.5 py-1.5 rounded-full bg-emerald-50 text-[#169C53] border border-emerald-200 text-xs font-extrabold"
    : "px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-extrabold";
}

function togglePilihBarisAntrean(idRow, checkboxEl) {
  const key = String(idRow);
  if (checkboxEl.checked) {
    if (remedialState.selectedIds.size >= KAPASITAS_MAKS_LAB_REMEDIAL) {
      checkboxEl.checked = false;
      alert(`Kapasitas maksimal tiap ruang lab dibatasi ${KAPASITAS_MAKS_LAB_REMEDIAL} peserta per sesi!`);
      return;
    }
    remedialState.selectedIds.add(key);
  } else {
    remedialState.selectedIds.delete(key);
  }
  updateBadgeTerpilih();
}

function toggleCheckAllAntrean(masterCheckbox) {
  if (!masterCheckbox.checked) {
    resetPilihanAntrean();
    return;
  }
  pilihMaksimal25Antrean();
}

function pilihMaksimal25Antrean() {
  remedialState.selectedIds.clear();
  const limit = Math.min(KAPASITAS_MAKS_LAB_REMEDIAL, remedialState.antreanMenunggu.length);
  for (let i = 0; i < limit; i++) {
    remedialState.selectedIds.add(String(remedialState.antreanMenunggu[i].id));
  }
  updateBadgeTerpilih();
  filterAntreanRemedial();
}

function resetPilihanAntrean() {
  remedialState.selectedIds.clear();
  const checkAll = document.getElementById("checkAllAntrean");
  if (checkAll) checkAll.checked = false;
  updateBadgeTerpilih();
  filterAntreanRemedial();
}

function filterAntreanRemedial() {
  const q = String(document.getElementById("inputCariAntreanRemedial")?.value || "").trim().toLowerCase();
  const hasil = remedialState.antreanMenunggu.filter(item => {
    if (!q) return true;
    const gab = `${item.nim || ""} ${item.nama_mahasiswa || ""} ${item.program_studi || ""} ${item.nama_kelas || ""}`.toLowerCase();
    return gab.includes(q);
  });
  renderTabelAntreanRemedial(hasil);
}

function renderTabelAntreanRemedial(list) {
  const tbody = document.getElementById("tbodyAntreanRemedial");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-12 text-center text-slate-400 italic">
          Antrean bersih! Belum ada pendaftar remedial baru yang menunggu penjadwalan.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list
    .map((item, idx) => {
      const isChecked = remedialState.selectedIds.has(String(item.id)) ? "checked" : "";
      const nama = item.nama_mahasiswa || "-";
      const prodi = item.program_studi || "-";
      const kelas = item.nama_kelas || "-";

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-4 py-3.5 text-center">
            <input type="checkbox" ${isChecked} onchange="togglePilihBarisAntrean(${item.id}, this)" class="w-4 h-4 accent-[#169C53] rounded cursor-pointer" />
          </td>
          <td class="px-4 py-3.5 font-bold text-slate-400">${idx + 1}</td>
          <td class="px-4 py-3.5 font-mono font-bold text-slate-800 text-xs">${item.nim || "-"}</td>
          <td class="px-4 py-3.5 font-extrabold text-slate-900 uppercase">${nama}</td>
          <td class="px-4 py-3.5 text-xs font-semibold text-slate-700">${prodi}</td>
          <td class="px-4 py-3.5">
            <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">${kelas}</span>
          </td>
          <td class="px-4 py-3.5 text-center">
            <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">
              MENUNGGU JADWAL
            </span>
          </td>
          <td class="px-4 py-3.5 text-center">
            <button type="button" onclick="hapusAntreanTunggal(${item.id}, '${nama.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-[11px] font-bold transition-all" title="Hapus pengajuan ini">
              <i class="ri-delete-bin-line"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function hapusAntreanTunggal(idRow, namaMhs) {
  const db = getDbRemedial();
  if (!db) return;
  if (!confirm(`Hapus pengajuan antrean remedial atas nama "${namaMhs}"?`)) return;

  try {
    const { error } = await db.from("pendaftaran_remedial").delete().eq("id", idRow);
    if (error) throw error;
    remedialState.selectedIds.delete(String(idRow));
    await muatSemuaDataRemedial(false);
  } catch (err) {
    alert("Gagal menghapus antrean: " + err.message);
  }
}

// ==================== 3. VALIDASI BENTROK LAB & SESI REAL-TIME ====================
function cekBentrokJadwal(tanggal, sesi, lab) {
  if (!tanggal || !sesi || !lab) return null;
  const tglNorm = String(tanggal).trim();
  const sesiNorm = String(sesi).trim().toUpperCase();
  const labNorm = String(lab).trim().toUpperCase();

  return (
    remedialState.semuaJadwalLog.find(j => {
      if (isRowSudahSelesaiLog(j)) return false;
      const jTgl = String(j.tanggal || "").trim();
      const jSesi = String(j.sesi || "").trim().toUpperCase();
      const jLab = String(j.ruang_lab || "").trim().toUpperCase();
      return jTgl === tglNorm && jSesi === sesiNorm && jLab === labNorm;
    }) || null
  );
}

function cekBentrokRealtimeRemedial() {
  const tgl = document.getElementById("remTanggalUjian")?.value || "";
  const sesi = document.getElementById("remSesiUjian")?.value || "";
  const lab = document.getElementById("remRuangLab")?.value || "";
  const alertBox = document.getElementById("alertStatusBentrokRemedial");
  if (!alertBox) return false;

  if (!tgl) {
    alertBox.classList.add("hidden");
    return false;
  }

  const bentrok = cekBentrokJadwal(tgl, sesi, lab);
  if (bentrok) {
    const namaKelasBentrok = bentrok.nama_kelas || "Jadwal Lain";
    alertBox.className = "px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5";
    alertBox.innerHTML = `
      <i class="ri-error-warning-fill text-base shrink-0"></i>
      <span>BENTROK RUANGAN TERDETEKSI: <b>${lab}</b> pada <b>${formatTanggalIndoRem(tgl)} (${sesi})</b> sudah terisi oleh <b>${namaKelasBentrok}</b>! Silakan pilih sesi atau ruang lab lain.</span>
    `;
    alertBox.classList.remove("hidden");
    return true;
  }

  alertBox.className = "px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0E7A3F] text-xs font-bold flex items-center gap-2.5";
  alertBox.innerHTML = `
    <i class="ri-checkbox-circle-fill text-base shrink-0"></i>
    <span>Ruang &amp; Sesi Tersedia: <b>${lab}</b> pada <b>${formatTanggalIndoRem(tgl)} (${sesi})</b> kosong dan siap dikunci (Maks. 25 peserta).</span>
  `;
  alertBox.classList.remove("hidden");
  return false;
}

// ==================== 4. KUNCI SESI -> MASUK KE `jadwal_log` & `peserta_ujian` ====================
async function kunciSesiRemedial() {
  const db = getDbRemedial();
  if (!db) return;

  const tanggal = document.getElementById("remTanggalUjian").value;
  const sesi = document.getElementById("remSesiUjian").value;
  const ruangLab = document.getElementById("remRuangLab").value;
  const customNama = document.getElementById("remNamaRombongan").value.trim().toUpperCase();

  if (remedialState.selectedIds.size === 0) {
    alert("Centang minimal 1 mahasiswa dari daftar antrean remedial terlebih dahulu!");
    return;
  }

  if (remedialState.selectedIds.size > KAPASITAS_MAKS_LAB_REMEDIAL) {
    alert(`Gagal! Jumlah peserta terpilih (${remedialState.selectedIds.size}) melebihi kapasitas maksimal ruang lab (${KAPASITAS_MAKS_LAB_REMEDIAL} peserta).`);
    return;
  }

  if (!tanggal || !sesi || !ruangLab) {
    alert("Tanggal Ujian, Sesi, dan Ruang Lab wajib diisi!");
    return;
  }

  const bentrok = cekBentrokJadwal(tanggal, sesi, ruangLab);
  if (bentrok) {
    alert(`Penguncian Sesi Ditolak! ${ruangLab} pada ${formatTanggalIndoRem(tanggal)} (${sesi}) sudah digunakan oleh "${bentrok.nama_kelas || "Jadwal Lain"}".`);
    return;
  }

  const pesertaTerpilih = remedialState.antreanMenunggu.filter(item =>
    remedialState.selectedIds.has(String(item.id))
  );

  const kodeRombongan = customNama || `REMEDIAL-${remedialState.sesiTerkunci.length + 1}`;
  const kodePrefixMeja = ruangLab.toUpperCase().includes("B") ? "LABB" : "LABA";

  if (!confirm(`Kunci sesi "${kodeRombongan}" untuk ${pesertaTerpilih.length} mahasiswa di ${ruangLab} pada ${formatTanggalIndoRem(tanggal)} (${sesi})?`)) {
    return;
  }

  const btn = document.getElementById("btnKunciSesiRemedial");
  btn.disabled = true;
  btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i><span>Mengunci Sesi &amp; Plotting Meja...</span>`;

  try {
    // 1. Insert 1 baris sesi FIX ke `jadwal_log` memakai kolom asli tabelmu
    const { data: insertedJadwal, error: errJadwal } = await db
      .from("jadwal_log")
      .insert([{
        jenis_tes: "TOEFL REMEDIAL",
        nama_kelas: kodeRombongan,
        tanggal: tanggal,
        sesi: sesi,
        ruang_lab: ruangLab,
        jumlah_mhs: pesertaTerpilih.length,
        status: "REMEDIAL"
      }])
      .select()
      .single();

    if (errJadwal) throw errJadwal;

    // 2. Masukkan rincian mahasiswa & nomor mejanya ke `peserta_ujian`
    const payloadPeserta = pesertaTerpilih.map((mhs, idx) => {
      const noMeja = `${kodePrefixMeja}-${String(idx + 1).padStart(2, "0")}`;
      return {
        jadwal_id: insertedJadwal.id,
        id_meja: noMeja,
        nim: String(mhs.nim || "").trim(),
        nama: String(mhs.nama_mahasiswa || "-").toUpperCase(),
        nama_kelas: kodeRombongan,
        prodi: mhs.program_studi || "-"
      };
    });

    const { error: errPeserta } = await db.from("peserta_ujian").insert(payloadPeserta);
    if (errPeserta) throw errPeserta;

    // 3. Hapus antrean mentah dari `pendaftaran_remedial`
    const idsUntukHapus = pesertaTerpilih.map(m => m.id);
    const { error: errHapusAntrean } = await db
      .from("pendaftaran_remedial")
      .delete()
      .in("id", idsUntukHapus);

    if (errHapusAntrean) throw errHapusAntrean;

    remedialState.selectedIds.clear();
    document.getElementById("remNamaRombongan").value = "";
    const checkAll = document.getElementById("checkAllAntrean");
    if (checkAll) checkAll.checked = false;

    await muatSemuaDataRemedial(false);

    alert(
      `Sesi "${kodeRombongan}" Berhasil Dikunci & Masuk Jadwal Log!\n` +
      `• Lokasi & Waktu: ${ruangLab}, ${formatTanggalIndoRem(tanggal)} (${sesi})\n` +
      `• Total Peserta Terplot: ${payloadPeserta.length} Mahasiswa (Meja ${kodePrefixMeja}-01 s/d ${kodePrefixMeja}-${String(payloadPeserta.length).padStart(2, "0")})`
    );
  } catch (err) {
    console.error("Gagal mengunci sesi remedial:", err);
    alert("Gagal mengunci sesi remedial: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ri-lock-2-line text-sm"></i><span>Kunci Sesi Remedial</span>`;
  }
}

// ==================== 5. RENDER LOG TERKUNCI & MODAL DETAIL PESERTA ====================
function renderTabelLogTerkunciRemedial(list) {
  const tbody = document.getElementById("tbodyLogTerkunciRemedial");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-10 text-center text-slate-400 italic">
          Belum ada sesi ujian remedial yang dikunci.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list
    .map((item, idx) => {
      const namaRombongan = item.nama_kelas || `REMEDIAL-${idx + 1}`;
      const pesertaSesi = remedialState.semuaPesertaUjian.filter(p =>
        p.jadwal_id === item.id ||
        String(p.nama_kelas || "").trim().toUpperCase() === String(namaRombongan).trim().toUpperCase()
      );
      const jmlPeserta = pesertaSesi.length || item.jumlah_mhs || 0;

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-4 py-4 font-bold text-slate-400">${idx + 1}</td>
          <td class="px-4 py-4">
            <div class="font-extrabold text-slate-900">${namaRombongan}</div>
            <div class="text-[11px] text-amber-600 font-bold">${item.jenis_tes || "TOEFL REMEDIAL"}</div>
          </td>
          <td class="px-4 py-4 font-bold text-slate-800">${formatTanggalIndoRem(item.tanggal)}</td>
          <td class="px-4 py-4 text-xs font-bold text-sky-600">${item.sesi || "-"}</td>
          <td class="px-4 py-4 text-center">
            <span class="px-3 py-1 rounded-lg bg-emerald-50 text-[#169C53] border border-emerald-200 text-[11px] font-extrabold">
              ${item.ruang_lab || "-"}
            </span>
          </td>
          <td class="px-4 py-4 text-center font-extrabold text-slate-800">${jmlPeserta} Mhs</td>
          <td class="px-4 py-4 text-center">
            <div class="inline-flex flex-wrap items-center justify-center gap-1.5">
              <button type="button" onclick="bukaModalPesertaSesiRemedial(${item.id})" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold inline-flex items-center gap-1 transition-all">
                <i class="ri-group-line"></i>
                <span>Peserta</span>
              </button>
              <button type="button" onclick="cetakPdfBeritaAcaraRemedial(${item.id})" class="px-3 py-1.5 rounded-xl bg-[#169C53] hover:bg-[#0E7A3F] text-white text-xs font-extrabold inline-flex items-center gap-1 shadow-2xs transition-all">
                <i class="ri-file-pdf-2-line"></i>
                <span>Cetak PDF</span>
              </button>
              <button type="button" onclick="batalkanKunciSesiRemedial(${item.id}, '${namaRombongan.replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-bold transition-all" title="Batalkan sesi & kembalikan peserta ke antrean">
                <i class="ri-arrow-go-back-line"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function bukaModalPesertaSesiRemedial(jadwalId) {
  const sesiObj = remedialState.sesiTerkunci.find(x => x.id === jadwalId);
  if (!sesiObj) return;

  const namaRombongan = sesiObj.nama_kelas || "REMEDIAL";
  const pesertaSesi = remedialState.semuaPesertaUjian.filter(p =>
    p.jadwal_id === sesiObj.id ||
    String(p.nama_kelas || "").trim().toUpperCase() === String(namaRombongan).trim().toUpperCase()
  );

  document.getElementById("modalJudulSesiRem").textContent = `${namaRombongan} • ${sesiObj.ruang_lab}`;
  document.getElementById("modalSubSesiRem").textContent = `${formatTanggalIndoRem(sesiObj.tanggal)} • ${sesiObj.sesi} • Total ${pesertaSesi.length} Peserta`;

  const tbody = document.getElementById("tbodyModalPesertaSesiRem");
  tbody.innerHTML = pesertaSesi.length === 0
    ? `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400 italic">Tidak ada rincian peserta pada sesi ini.</td></tr>`
    : pesertaSesi
        .map((p, idx) => `
          <tr class="hover:bg-slate-50">
            <td class="px-3 py-2.5 font-bold text-slate-400">${idx + 1}</td>
            <td class="px-3 py-2.5 font-mono font-extrabold text-[#169C53]">${p.id_meja || "-"}</td>
            <td class="px-3 py-2.5 font-mono font-bold text-slate-800">${p.nim || "-"}</td>
            <td class="px-3 py-2.5 font-extrabold text-slate-900 uppercase">${p.nama || "-"}</td>
            <td class="px-3 py-2.5 text-slate-600">${p.prodi || "-"}</td>
          </tr>
        `)
        .join("");

  const btnPdf = document.getElementById("btnCetakPdfDariModalRem");
  if (btnPdf) {
    btnPdf.onclick = () => cetakPdfBeritaAcaraRemedial(jadwalId);
  }

  const modal = document.getElementById("modalPesertaSesiRemedial");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function tutupModalPesertaSesiRemedial() {
  const modal = document.getElementById("modalPesertaSesiRemedial");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

async function batalkanKunciSesiRemedial(jadwalId, namaRombongan) {
  const db = getDbRemedial();
  if (!db) return;

  if (!confirm(`Batalkan penguncian sesi "${namaRombongan}" dan kembalikan seluruh pesertanya ke antrean?`)) {
    return;
  }

  try {
    const pesertaSesi = remedialState.semuaPesertaUjian.filter(p =>
      p.jadwal_id === jadwalId ||
      String(p.nama_kelas || "").trim().toUpperCase() === String(namaRombongan).trim().toUpperCase()
    );

    if (pesertaSesi.length > 0) {
      const kembalikanAntrean = pesertaSesi.map(p => ({
        nim: p.nim,
        nama_mahasiswa: p.nama,
        program_studi: p.prodi || "-",
        nama_kelas: p.nama_kelas || "-"
      }));
      await db.from("pendaftaran_remedial").insert(kembalikanAntrean);
      await db.from("peserta_ujian").delete().eq("jadwal_id", jadwalId);
    }

    await db.from("jadwal_log").delete().eq("id", jadwalId);
    await muatSemuaDataRemedial(false);
    alert(`Sesi "${namaRombongan}" dibatalkan dan peserta dikembalikan ke antrean.`);
  } catch (err) {
    alert("Gagal membatalkan sesi: " + err.message);
  }
}

// ==================== 6. CETAK PDF BERITA ACARA & ABSENSI RESMI REMEDIAL ====================
function cetakPdfBeritaAcaraRemedial(jadwalId) {
  const sesiObj = remedialState.sesiTerkunci.find(x => x.id === jadwalId);
  if (!sesiObj) return;

  const namaRombongan = sesiObj.nama_kelas || "REMEDIAL";
  const pesertaSesi = remedialState.semuaPesertaUjian.filter(p =>
    p.jadwal_id === sesiObj.id ||
    String(p.nama_kelas || "").trim().toUpperCase() === String(namaRombongan).trim().toUpperCase()
  );

  const logoUrl = new URL("./img/polnes.png", window.location.href).href;
  const tanggalCetak = formatTanggalIndoRem(sesiObj.tanggal);

  const barisPesertaHtml = pesertaSesi
    .map((p, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center; font-weight:bold;">${p.id_meja || "-"}</td>
        <td style="text-align:center;">${p.nim || "-"}</td>
        <td style="text-transform:uppercase; font-weight:bold;">${p.nama || "-"}</td>
        <td>${p.prodi || "-"}</td>
        <td style="height:24px;">${idx % 2 === 0 ? `${idx + 1}.` : ""}</td>
        <td style="height:24px;">${idx % 2 === 1 ? `${idx + 1}.` : ""}</td>
      </tr>
    `)
    .join("");

  const win = window.open("", "_blank", "width=1000,height=820");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak PDF Berita Acara & Absensi.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Berita Acara &amp; Daftar Hadir Remedial - ${namaRombongan}</title>
      <style>
        @page { size: A4 portrait; margin: 14mm 15mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; padding: 0; background: #cbd5e1; font-family: 'Times New Roman', Times, serif; color: #0f172a; }
        .toolbar { background: #0f172a; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; font-family: Arial, sans-serif; font-size: 13px; }
        .toolbar button { background: #169C53; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .sheet { width: 210mm; min-height: 297mm; margin: 12px auto; background: #fff; padding: 14mm 15mm; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
        .kop { display: flex; align-items: center; border-bottom: 3px double #0f172a; padding-bottom: 8px; margin-bottom: 14px; gap: 14px; }
        .kop img { width: 64px; height: 64px; object-fit: contain; }
        .kop-teks { flex: 1; text-align: center; line-height: 1.25; }
        .kop-teks .kementerian { font-size: 11pt; font-weight: bold; }
        .kop-teks .kampus { font-size: 13pt; font-weight: bold; }
        .kop-teks .unit { font-size: 11.5pt; font-weight: bold; }
        .kop-teks .alamat { font-size: 8.5pt; font-style: italic; margin-top: 2px; }
        .judul-dok { text-align: center; margin-bottom: 12px; }
        .judul-dok h2 { margin: 0; font-size: 12.5pt; text-decoration: underline; letter-spacing: 0.5px; }
        .judul-dok p { margin: 3px 0 0 0; font-size: 10pt; font-weight: bold; }
        .meta-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 12px; }
        .meta-table td { padding: 2.5px 4px; }
        .absen-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 16px; }
        .absen-table th, .absen-table td { border: 1px solid #1e293b; padding: 5px 6px; }
        .absen-table th { background: #f1f5f9; font-weight: bold; text-align: center; }
        .berita-acara-box { border: 1px solid #1e293b; padding: 8px 10px; font-size: 9.5pt; line-height: 1.45; margin-bottom: 18px; }
        .ttd-grid { width: 100%; display: flex; justify-content: space-between; font-size: 10pt; margin-top: 10px; }
        .ttd-col { width: 45%; }
        .ttd-space { height: 54px; }
        @media print {
          body { background: none; }
          .toolbar { display: none !important; }
          .sheet { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <div><strong>Berita Acara &amp; Daftar Hadir Ujian Remedial</strong> &mdash; ${namaRombongan}</div>
        <button type="button" onclick="window.print()">Cetak / Simpan PDF</button>
      </div>

      <div class="sheet">
        <div class="kop">
          <img src="${logoUrl}" alt="Logo POLNES" />
          <div class="kop-teks">
            <div class="kementerian">KEMENTERIAN PENDIDIKAN, TINGGI, SAINS, DAN TEKNOLOGI</div>
            <div class="kampus">POLITEKNIK NEGERI SAMARINDA</div>
            <div class="unit">UNIT PENUNJANG AKADEMIK (UPA) BAHASA</div>
            <div class="alamat">Jalan Dr. Ciptomangunkusumo Kampus Gunung Panjang Samarinda 75131 &bull; Telp. (0541) 260588</div>
          </div>
        </div>

        <div class="judul-dok">
          <h2>BERITA ACARA &amp; DAFTAR HADIR UJIAN REMEDIAL TOEFL</h2>
          <p>ROMBONGAN: ${namaRombongan}</p>
        </div>

        <table class="meta-table">
          <tr>
            <td style="width:130px;"><b>Hari / Tanggal</b></td>
            <td style="width:12px;">:</td>
            <td>${tanggalCetak}</td>
            <td style="width:120px;"><b>Ruang Lab</b></td>
            <td style="width:12px;">:</td>
            <td>${sesiObj.ruang_lab || "-"}</td>
          </tr>
          <tr>
            <td><b>Sesi &amp; Waktu</b></td>
            <td>:</td>
            <td>${sesiObj.sesi || "-"}</td>
            <td><b>Jumlah Peserta</b></td>
            <td>:</td>
            <td>${pesertaSesi.length} Mahasiswa</td>
          </tr>
        </table>

        <table class="absen-table">
          <thead>
            <tr>
              <th style="width:30px;">NO</th>
              <th style="width:68px;">NO. MEJA</th>
              <th style="width:85px;">NIM</th>
              <th>NAMA MAHASISWA</th>
              <th style="width:145px;">PROGRAM STUDI</th>
              <th colspan="2" style="width:115px;">TANDA TANGAN</th>
            </tr>
          </thead>
          <tbody>
            ${barisPesertaHtml}
          </tbody>
        </table>

        <div class="berita-acara-box">
          <b>Catatan Berita Acara Pelaksanaan Ujian:</b><br />
          Pada hari ini, tanggal <b>${tanggalCetak}</b>, telah dilaksanakan Ujian Remedial TOEFL Prediction bertempat di <b>${sesiObj.ruang_lab}</b> pada <b>${sesiObj.sesi}</b> dengan rincian:
          Jumlah Peserta Terdaftar: <b>${pesertaSesi.length}</b> orang | Hadir: _______ orang | Tidak Hadir: _______ orang.
        </div>

        <div class="ttd-grid">
          <div class="ttd-col">
            <div>Pengawas / Teknisi Lab UPA Bahasa,</div>
            <div class="ttd-space"></div>
            <div>( .......................................................... )</div>
            <div>NIP / NIK.</div>
          </div>
          <div class="ttd-col" style="text-align:left;">
            <div>Samarinda, ${tanggalCetak}</div>
            <div>Mengetahui, Kepala UPA. Bahasa</div>
            <div class="ttd-space"></div>
            <div><b><u>Dwi Titi Maesaroh, S.Pd., M.Pd.</u></b></div>
            <div>NIP. 198901172024062002</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
}

// ==================== 7. HELPER SIDEBAR & REAL-TIME SYNC ====================
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

function logoutStaff() {
  if (confirm("Keluar dari panel staf UPA Bahasa?")) {
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tglInput = document.getElementById("remTanggalUjian");
  if (tglInput && !tglInput.value) {
    tglInput.value = new Date().toISOString().split("T")[0];
  }

  muatSemuaDataRemedial(false);

  const db = getDbRemedial();
  if (db) {
    db.channel("upa-jadwal-remedial-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pendaftaran_remedial" }, () => {
        muatSemuaDataRemedial(false);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "jadwal_log" }, () => {
        muatSemuaDataRemedial(false);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "peserta_ujian" }, () => {
        muatSemuaDataRemedial(false);
      })
      .subscribe();
  }
});