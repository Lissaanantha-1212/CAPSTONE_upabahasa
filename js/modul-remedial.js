// ============================================================================
// MODUL PENJADWALAN UJIAN REMEDIAL TOEFL (UPA BAHASA POLNES)
// - Antrean mentah dibaca dari tabel `pendaftaran_remedial`
// - Saat dikunci, sesi masuk ke `jadwal_log` + `peserta_ujian`
// - Antrean mentah di `pendaftaran_remedial` langsung dihapus & disembunyikan
// - Setelah dicocokkan di Hasil Test / Rekapan, log otomatis hilang dari tabel
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

function formatNomorMejaStudent(rawMeja, urutanIdx = 0) {
  const str = String(rawMeja || "").trim().toUpperCase();
  if (/^STUDENT\d+$/i.test(str)) {
    const angka = str.replace(/\D/g, "");
    return `STUDENT${angka.padStart(2, "0")}`;
  }
  const matchAngka = str.match(/(\d+)$/);
  if (matchAngka) {
    return `STUDENT${matchAngka[1].padStart(2, "0")}`;
  }
  return `STUDENT${String(urutanIdx + 1).padStart(2, "0")}`;
}

function getCacheProdiLocalRem() {
  try {
    return JSON.parse(localStorage.getItem("upa_cache_prodi_nim") || "{}");
  } catch (e) {
    return {};
  }
}

function simpanCacheProdiLocalRem(nim, prodi) {
  const nimClean = String(nim || "").trim();
  const prodiClean = String(prodi || "").trim();
  if (!nimClean || !prodiClean || prodiClean === "-" || prodiClean === "Peserta Remedial") return;
  try {
    const cache = getCacheProdiLocalRem();
    cache[nimClean] = prodiClean;
    localStorage.setItem("upa_cache_prodi_nim", JSON.stringify(cache));
  } catch (e) {}
}

function ambilProdiPesertaRem(p) {
  if (!p) return "-";
  const nimClean = String(p.nim || "").trim();

  // 1. Cek langsung dari properti object peserta
  const langsung = String(p.program_studi || p.prodi || p.jurusan || "").trim();
  if (langsung && langsung !== "-" && langsung !== "Peserta Remedial") {
    return langsung;
  }

  // 2. Cek jika prodi tersimpan di field nama_kelas dengan pemisah " | "
  const kelasRaw = String(p.nama_kelas || "").trim();
  if (kelasRaw.includes("|")) {
    const bagian = kelasRaw.split("|").map(s => s.trim());
    if (bagian[1] && bagian[1] !== "-") return bagian[1];
  }

  // 3. Cek dari cache lokal NIM -> Prodi
  const cache = getCacheProdiLocalRem();
  if (nimClean && cache[nimClean]) {
    return cache[nimClean];
  }

  // 4. Cari dari riwayat `peserta_ujian` lain dengan NIM yang sama (misal dari Jadwal Test reguler)
  if (nimClean && Array.isArray(remedialState.semuaPesertaUjian)) {
    const riwayatLain = remedialState.semuaPesertaUjian.find(item => {
      if (String(item.nim || "").trim() !== nimClean) return false;
      const pr = String(item.program_studi || item.prodi || item.jurusan || "").trim();
      return pr && pr !== "-" && pr !== "Peserta Remedial";
    });
    if (riwayatLain) {
      const prFound = String(riwayatLain.program_studi || riwayatLain.prodi || riwayatLain.jurusan).trim();
      simpanCacheProdiLocalRem(nimClean, prFound);
      return prFound;
    }
  }

  return "-";
}

function isRowSudahSelesaiLog(item) {
  if (!item) return true;
  const st = String(item.status || item.status_log || "").trim().toUpperCase();
  if ([
    "SELESAI",
    "LOGGED",
    "ARSIP",
    "ARCHIVED",
    "MATCHED",
    "DONE",
    "TERARSIP",
    "SUDAH DICOCOKKAN",
    "DICOCOKKAN",
    "COMPLETED"
  ].includes(st)) {
    return true;
  }
  if (item.is_logged === true || item.sudah_log === true || item.is_matched === true) {
    return true;
  }
  return false;
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

    const rawAntrean = resAntrean.data || [];
    const allJadwal = resJadwal.data || [];
    const allPeserta = resPeserta.data || [];

    // Simpan cache NIM -> Program Studi selagi data ada di antrean atau riwayat peserta_ujian
    rawAntrean.forEach(a => simpanCacheProdiLocalRem(a.nim, a.program_studi || a.prodi));
    allPeserta.forEach(p => simpanCacheProdiLocalRem(p.nim, p.program_studi || p.prodi));

    remedialState.semuaJadwalLog = allJadwal;
    remedialState.semuaPesertaUjian = allPeserta;

    // 1. Filter Sesi Remedial Terkunci (hanya yang BELUM dicocokkan / belum selesai di Hasil Test)
    const terkunci = allJadwal.filter(item => {
      if (isRowSudahSelesaiLog(item)) return false;
      const jenis = String(item.jenis_tes || "").toUpperCase();
      const st = String(item.status || "").toUpperCase();
      return jenis.includes("REMEDIAL") || st === "REMEDIAL";
    });

    // Kumpulkan semua NIM yang sudah masuk sesi remedial aktif agar tidak pernah muncul ganda di antrean
    const idSesiAktifSet = new Set(terkunci.map(j => j.id));
    const namaKelasAktifSet = new Set(terkunci.map(j => String(j.nama_kelas || "").trim().toUpperCase()));
    const nimSudahDijadwalkanSet = new Set(
      allPeserta
        .filter(p => idSesiAktifSet.has(p.jadwal_id) || namaKelasAktifSet.has(String(p.nama_kelas || "").split("|")[0].trim().toUpperCase()))
        .map(p => String(p.nim || "").trim())
    );

    // 2. Filter Antrean Menunggu (kecualikan NIM yang sudah terjadwal)
    const antrean = rawAntrean.filter(item => !nimSudahDijadwalkanSet.has(String(item.nim || "").trim()));

    const validIdSet = new Set(antrean.map(x => String(x.id)));
    Array.from(remedialState.selectedIds).forEach(idStr => {
      if (!validIdSet.has(idStr)) remedialState.selectedIds.delete(idStr);
    });

    remedialState.antreanMenunggu = antrean;
    remedialState.sesiTerkunci = terkunci;

    const inputNamaRombongan = document.getElementById("remNamaRombongan");
    if (inputNamaRombongan && inputNamaRombongan.tagName === "INPUT" && !inputNamaRombongan.value.trim()) {
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
  const elRombongan = document.getElementById("remNamaRombongan");
  const customNama = String(elRombongan?.value || "").trim().toUpperCase();

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

  if (!confirm(`Kunci sesi "${kodeRombongan}" untuk ${pesertaTerpilih.length} mahasiswa di ${ruangLab} pada ${formatTanggalIndoRem(tanggal)} (${sesi})?`)) {
    return;
  }

  const btn = document.getElementById("btnKunciSesiRemedial");
  btn.disabled = true;
  btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i><span>Mengunci Sesi &amp; Plotting Meja...</span>`;

  try {
    // 1. Insert 1 baris sesi FIX ke `jadwal_log` memakai kolom asli tabel
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

    // 2. Simpan cache Prodi per NIM sebelum antrean dihapus & siapkan payload `peserta_ujian`
    pesertaTerpilih.forEach(mhs => {
      simpanCacheProdiLocalRem(mhs.nim, mhs.program_studi || mhs.prodi);
    });

    const basePayload = pesertaTerpilih.map((mhs, idx) => ({
      jadwal_id: insertedJadwal.id,
      id_meja: `STUDENT${String(idx + 1).padStart(2, "0")}`,
      nim: String(mhs.nim || "").trim(),
      nama: String(mhs.nama_mahasiswa || "-").toUpperCase(),
      nama_kelas: kodeRombongan
    }));

    // Coba insert dengan kolom `program_studi`, lalu `prodi`, dan fallback menyisipkan info prodi di `nama_kelas` bila kolom tidak ada di DB
    let { error: errPeserta } = await db.from("peserta_ujian").insert(
      basePayload.map((row, idx) => ({
        ...row,
        program_studi: String(pesertaTerpilih[idx].program_studi || pesertaTerpilih[idx].prodi || "-").trim()
      }))
    );

    if (errPeserta) {
      const retryProdi = await db.from("peserta_ujian").insert(
        basePayload.map((row, idx) => ({
          ...row,
          prodi: String(pesertaTerpilih[idx].program_studi || pesertaTerpilih[idx].prodi || "-").trim()
        }))
      );
      errPeserta = retryProdi.error;
    }

    if (errPeserta) {
      const retryKelasWithProdi = await db.from("peserta_ujian").insert(
        basePayload.map((row, idx) => {
          const prodiMhs = String(pesertaTerpilih[idx].program_studi || pesertaTerpilih[idx].prodi || "-").trim();
          return {
            ...row,
            nama_kelas: prodiMhs && prodiMhs !== "-" ? `${kodeRombongan} | ${prodiMhs}` : kodeRombongan
          };
        })
      );
      errPeserta = retryKelasWithProdi.error;
    }

    if (errPeserta) throw errPeserta;

    // 3. Hapus antrean mentah dari `pendaftaran_remedial` berdasarkan ID & NIM agar daftar antrean langsung bersih
    const idsUntukHapus = pesertaTerpilih.map(m => m.id);
    const nimsUntukHapus = pesertaTerpilih.map(m => String(m.nim || "").trim()).filter(Boolean);

    await db.from("pendaftaran_remedial").delete().in("id", idsUntukHapus);
    if (nimsUntukHapus.length > 0) {
      await db.from("pendaftaran_remedial").delete().in("nim", nimsUntukHapus);
    }

    remedialState.selectedIds.clear();
    if (elRombongan && elRombongan.tagName === "INPUT") {
      elRombongan.value = "";
    }
    const checkAll = document.getElementById("checkAllAntrean");
    if (checkAll) checkAll.checked = false;

    await muatSemuaDataRemedial(false);

    alert(
      `Sesi "${kodeRombongan}" Berhasil Dikunci & Masuk Jadwal Log!\n` +
      `• Lokasi & Waktu: ${ruangLab}, ${formatTanggalIndoRem(tanggal)} (${sesi})\n` +
      `• Total Peserta Terplot: ${basePayload.length} Mahasiswa (Meja STUDENT01 s/d STUDENT${String(basePayload.length).padStart(2, "0")})\n` +
      `• Daftar antrean telah dibersihkan otomatis.`
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
          Belum ada sesi ujian remedial aktif yang terkunci (sesi yang sudah dicocokkan nilainya otomatis dipindahkan ke Rekapan).
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
        String(p.nama_kelas || "").split("|")[0].trim().toUpperCase() === String(namaRombongan).trim().toUpperCase()
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
    String(p.nama_kelas || "").split("|")[0].trim().toUpperCase() === String(namaRombongan).trim().toUpperCase()
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
            <td class="px-3 py-2.5 font-mono font-extrabold text-[#169C53]">${formatNomorMejaStudent(p.id_meja, idx)}</td>
            <td class="px-3 py-2.5 font-mono font-bold text-slate-800">${p.nim || "-"}</td>
            <td class="px-3 py-2.5 font-extrabold text-slate-900 uppercase">${p.nama || "-"}</td>
            <td class="px-3 py-2.5 text-slate-600">${ambilProdiPesertaRem(p)}</td>
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
      String(p.nama_kelas || "").split("|")[0].trim().toUpperCase() === String(namaRombongan).trim().toUpperCase()
    );

    if (pesertaSesi.length > 0) {
      const kembalikanAntrean = pesertaSesi.map(p => ({
        nim: p.nim,
        nama_mahasiswa: p.nama,
        program_studi: ambilProdiPesertaRem(p),
        nama_kelas: String(p.nama_kelas || "-").split("|")[0].trim()
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

// ==================== 6. CETAK PDF BERITA ACARA & ABSENSI RESMI (IDENTIK JADWAL TEST & SSPECT) ====================
function cetakPdfBeritaAcaraRemedial(jadwalId) {
  const sesiObj = remedialState.sesiTerkunci.find(x => x.id === jadwalId);
  if (!sesiObj) return;

  const namaRombongan = String(sesiObj.nama_kelas || "REMEDIAL-1").trim().toUpperCase();
  const pesertaSesi = remedialState.semuaPesertaUjian.filter(p =>
    p.jadwal_id === sesiObj.id ||
    String(p.nama_kelas || "").split("|")[0].trim().toUpperCase() === namaRombongan
  );

  const logoUrl = new URL("./img/polnes.png", window.location.href).href;
  const tanggalIso = String(sesiObj.tanggal || "-").trim();
  const tanggalSamarinda = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const barisPesertaHtml = pesertaSesi
    .map((p, idx) => {
      const idMejaStudent = formatNomorMejaStudent(p.id_meja, idx);
      const prodiTampil = ambilProdiPesertaRem(p);
      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${p.nim || "-"}</td>
          <td style="text-transform:uppercase;">${p.nama || "-"}</td>
          <td style="text-transform:uppercase;">${prodiTampil}</td>
          <td style="text-align:center; font-weight:bold;">${idMejaStudent}</td>
          <td style="height:22px;"></td>
        </tr>
      `;
    })
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
      <title>Berita Acara &amp; Daftar Hadir Pelaksanaan Ujian - ${namaRombongan}</title>
      <style>
        @page { size: A4 portrait; margin: 12mm 14mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; padding: 0; background: #cbd5e1; font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
        .toolbar { background: #0f172a; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }
        .toolbar button { background: #169C53; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .sheet { width: 210mm; min-height: 297mm; margin: 12px auto; background: #fff; padding: 12mm 14mm; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
        .kop { display: flex; align-items: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; gap: 14px; }
        .kop img { width: 64px; height: 64px; object-fit: contain; }
        .kop-teks { flex: 1; text-align: center; line-height: 1.25; }
        .kop-teks .kementerian { font-size: 10.5pt; font-weight: bold; }
        .kop-teks .kampus { font-size: 12.5pt; font-weight: bold; }
        .kop-teks .unit { font-size: 10.5pt; font-weight: bold; }
        .kop-teks .alamat { font-size: 8pt; color: #334155; margin-top: 2px; }
        .judul-dok { text-align: center; margin-bottom: 12px; }
        .judul-dok h2 { margin: 0; font-size: 11.5pt; font-weight: bold; letter-spacing: 0.3px; }
        .judul-dok p { margin: 2px 0 0 0; font-size: 9.5pt; font-weight: bold; }
        .meta-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px; }
        .meta-table td { padding: 2px 4px; }
        .absen-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 18px; }
        .absen-table th, .absen-table td { border: 1px solid #cbd5e1; padding: 5px 6px; }
        .absen-table th { background: #169C53; color: #ffffff; font-weight: bold; text-align: center; font-size: 8.5pt; }
        .absen-table tbody tr:nth-child(even) { background: #f8fafc; }
        .ttd-wrap { width: 100%; display: flex; justify-content: flex-end; margin-top: 14px; font-size: 9.5pt; }
        .ttd-box { width: 220px; text-align: left; line-height: 1.35; }
        .ttd-space { height: 52px; }
        @media print {
          body { background: none; }
          .toolbar { display: none !important; }
          .sheet { width: 100%; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <div><strong>Berita Acara &amp; Daftar Hadir Pelaksanaan Ujian</strong> &mdash; ${namaRombongan}</div>
        <button type="button" onclick="window.print()">Cetak / Simpan PDF</button>
      </div>

      <div class="sheet">
        <div class="kop">
          <img src="${logoUrl}" alt="Logo POLNES" />
          <div class="kop-teks">
            <div class="kementerian">KEMENTERIAN PENDIDIKAN, TINGGI, SAINS, DAN TEKNOLOGI</div>
            <div class="kampus">POLITEKNIK NEGERI SAMARINDA</div>
            <div class="unit">UNIT PENGELOLA AKADEMIK (UPA) BAHASA</div>
            <div class="alamat">Jl. Cipto Mangunkusumo Kampus Gunung Panjang Samarinda 75131</div>
          </div>
        </div>

        <div class="judul-dok">
          <h2>BERITA ACARA &amp; DAFTAR HADIR PELAKSANAAN UJIAN</h2>
          <p>JENIS TES: ${namaRombongan}</p>
        </div>

        <table class="meta-table">
          <tr>
            <td style="width:105px;">Hari / Tanggal</td>
            <td style="width:10px;">:</td>
            <td>${tanggalIso}</td>
            <td style="width:95px;">Ruang Lab</td>
            <td style="width:10px;">:</td>
            <td>${sesiObj.ruang_lab || "-"}</td>
          </tr>
          <tr>
            <td>Waktu Sesi</td>
            <td>:</td>
            <td>${sesiObj.sesi || "-"}</td>
            <td>Kelas Peserta</td>
            <td>:</td>
            <td>${namaRombongan}</td>
          </tr>
        </table>

        <table class="absen-table">
          <thead>
            <tr>
              <th style="width:32px;">NO</th>
              <th style="width:92px;">NIM</th>
              <th>NAMA MAHASISWA</th>
              <th style="width:170px;">PRODI</th>
              <th style="width:88px;">ID MEJA</th>
              <th style="width:110px;">TANDA TANGAN</th>
            </tr>
          </thead>
          <tbody>
            ${barisPesertaHtml}
          </tbody>
        </table>

        <div class="ttd-wrap">
          <div class="ttd-box">
            <div>Samarinda, ${tanggalSamarinda}</div>
            <div>Pengawas Ujian,</div>
            <div class="ttd-space"></div>
            <div>( __________________________ )</div>
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