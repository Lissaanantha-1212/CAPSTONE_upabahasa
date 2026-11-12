/**
 * MODUL HASIL TEST SSPECT - UPA BAHASA POLNES (FULL VERSION UTUH + PRODI)
 * Menangani 1 file Excel SSPECT, auto-mapping peserta, bind NIM siswa susulan,
 * simpan permanen ke tabel HasilTes, dan auto-delete jadwal log setelah selesai.
 */

let parsedSspectData = null;
let globalSyncedSspectResults = [];

const SESI_RANGES_SSPECT = {
  "SESI 1 (08.00 - 10.30 WITA)": { startHour: 8, endHour: 10 },
  "SESI 2 (10.30 - 13.00 WITA)": { startHour: 10, endHour: 13 },
  "SESI 3 (14.00 - 16.30 WITA)": { startHour: 14, endHour: 16 }
};

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileSspectInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSspectUpload);
  }
});

function resetSspectFileInput() {
  const el = document.getElementById('fileSspectInput');
  const lbl = document.getElementById('labelSspectFile');
  if (el) el.value = '';
  if (lbl) {
    lbl.innerText = 'Belum ada file';
    lbl.classList.remove('text-polnes-main', 'font-bold');
  }
  parsedSspectData = null;
}

function parseFileInfoSspect(filename) {
  const dateMatch = filename.match(/(\d{2}-\d{2}-\d{4})/);
  const timeMatch = filename.match(/(\d{2}-\d{2}-\d{2})(?=\.\w+$)/);

  let dateStr = dateMatch ? dateMatch[0] : null;
  let timeStr = timeMatch ? timeMatch[0] : null;

  let hour = null;
  if (timeStr) hour = parseInt(timeStr.split('-')[0]);

  let dbDate = null;
  if (dateStr) {
    const parts = dateStr.split('-');
    dbDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return { dateStr, dbDate, timeStr, hour };
}

async function handleFileSspectUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const sesiSelect = document.getElementById('selectSesiSspect');
  const labSelect = document.getElementById('selectLabSspect');
  const sesiTerpilih = sesiSelect ? sesiSelect.value : '';
  const labTerpilih = labSelect ? labSelect.value : '';
  
  const fileInfo = parseFileInfoSspect(file.name);

  const rangeSesi = SESI_RANGES_SSPECT[sesiTerpilih];
  if (fileInfo.hour !== null && rangeSesi) {
    if (fileInfo.hour < rangeSesi.startHour || fileInfo.hour > rangeSesi.endHour) {
      alert(`[DITOLAK] Jam file (${fileInfo.hour}:xx) di luar rentang ${sesiTerpilih}.`);
      resetSspectFileInput();
      return;
    }
  }

  const label = document.getElementById('labelSspectFile');
  if (label) {
    label.innerText = file.name;
    label.classList.add('text-polnes-main', 'font-bold');
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      const parsedRows = parseExcelNilaiSspect(rows);
      parsedSspectData = { file: file, rows: parsedRows, name: file.name, info: fileInfo };

      await jalankanSspectAutoMappingEngine(labTerpilih, sesiTerpilih);

    } catch (err) {
      alert("Gagal memproses file Excel SSPECT: " + err.message);
      resetSspectFileInput();
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseExcelNilaiSspect(rows) {
  const results = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const idMejaVal = String(row[0] || "").trim().toUpperCase();
    const scoreValRaw = String(row[3] || "").trim();

    if (idMejaVal.startsWith('STUDENT') && idMejaVal !== 'STUDENT_NAME' && idMejaVal !== 'STUDENT NAME') {
      let skorAngka = 0;
      if (scoreValRaw.includes('/')) {
        skorAngka = Number(scoreValRaw.split('/')[0].trim());
      } else {
        skorAngka = Number(scoreValRaw);
      }
      if (isNaN(skorAngka)) skorAngka = 0;

      results.push({ id_meja: idMejaVal, skor: skorAngka });
    }
  }
  return results;
}

async function jalankanSspectAutoMappingEngine(lab, sesi) {
  const tanggalUjianDb = parsedSspectData.info.dbDate;

  const { data: jadwalList, error: errJadwal } = await window.supabaseClient
    .from('jadwal_log')
    .select('id, tanggal, nama_kelas')
    .eq('ruang_lab', lab)
    .eq('sesi', sesi)
    .eq('tanggal', tanggalUjianDb);

  if (errJadwal || !jadwalList || jadwalList.length === 0) {
    alert(`[VALIDASI GAGAL] Tidak ditemukan jadwal Modul 1 untuk ${lab}, ${sesi} pada tanggal ${tanggalUjianDb}.`);
    return;
  }

  const activeJadwal = jadwalList[0];

  const { data: existingLog } = await window.supabaseClient
    .from('HasilTes')
    .select('id')
    .eq('idJadwal', activeJadwal.id);

  if (existingLog && existingLog.length > 0) {
    alert('[DITOLAK] Hasil test SSPECT untuk sesi ini sudah pernah disimpan secara permanen ke database.');
    return;
  }

  const { data: pesertaUjian } = await window.supabaseClient
    .from('peserta_ujian')
    .select('*')
    .eq('jadwal_id', activeJadwal.id)
    .order('id_meja', { ascending: true });

  const dbPesertaList = pesertaUjian || [];
  const excelRows = parsedSspectData.rows;

  let idx = 1;
  globalSyncedSspectResults = [];

  // MAPPING PESERTA UTAMA
  dbPesertaList.forEach(p => {
    const matchedRow = excelRows.find(x => x.id_meja === p.id_meja) || { skor: 0 };

    globalSyncedSspectResults.push({
      no: idx++,
      idJadwal: activeJadwal.id,
      nim: p.nim,
      nama: p.nama,
      program_studi: p.program_studi || '-', // MENGAMBIL PRODI DARI DATABASE PESERTA UJIAN
      id_meja: p.id_meja,
      jenisTes: 'SSPECT',
      sec1Listening: matchedRow.skor,
      sec2Structure: 0,
      sec3Reading: 0,
      totalSkor: matchedRow.skor,
      status: 'MAPPED',
      tanggalUjian: activeJadwal.tanggal,
      nama_kelas: p.nama_kelas
    });
  });

  // MAPPING PESERTA SUSULAN
  const dbIdMejas = new Set(dbPesertaList.map(p => p.id_meja));
  const susulanRows = excelRows.filter(x => !dbIdMejas.has(x.id_meja));

  susulanRows.forEach(sus => {
    globalSyncedSspectResults.push({
      no: idx++,
      idJadwal: activeJadwal.id,
      nim: '',
      nama: '',
      program_studi: '', // KOSONG SEMENTARA SEBELUM DI-BIND
      id_meja: sus.id_meja,
      jenisTes: 'SSPECT',
      sec1Listening: sus.skor,
      sec2Structure: 0,
      sec3Reading: 0,
      totalSkor: sus.skor,
      status: 'UNMAPPED',
      tanggalUjian: activeJadwal.tanggal,
      nama_kelas: 'Susulan / Pindahan'
    });
  });

  renderTabelPratinjauSspect();

  const statusSync = document.getElementById('infoStatusSync');
  if (statusSync) {
    statusSync.innerHTML = `<span class="text-polnes-main font-bold">Sinkronisasi SSPECT Berhasil!</span> ${dbPesertaList.length} peserta sesuai jadwal. <b class="text-rose-500">${susulanRows.length > 0 ? susulanRows.length + ' Siswa Susulan terdeteksi.' : 'Semua data pas dan valid.'}</b>`;
  }
}

async function prosesBindNimSspect(idMeja) {
  const rowTarget = globalSyncedSspectResults.find(r => r.id_meja === idMeja);
  if (!rowTarget) return;

  const inputEl = document.getElementById(`input_nim_${idMeja}`);
  if (!inputEl) return;
  const inputNIM = inputEl.value.trim();

  if (!inputNIM) {
    alert("Harap ketik NIM mahasiswa terlebih dahulu!");
    inputEl.focus();
    return;
  }

  inputEl.disabled = true;

  try {
    let { data: dbMhs } = await window.supabaseClient
      .from('peserta_ujian')
      .select('nim, nama, nama_kelas, program_studi')
      .eq('nim', inputNIM)
      .limit(1);

    if (!dbMhs || dbMhs.length === 0) {
      const { data: dbAntrean } = await window.supabaseClient
        .from('antrean_mahasiswa')
        .select('nim, nama, nama_kelas, program_studi')
        .eq('nim', inputNIM)
        .limit(1);
      dbMhs = dbAntrean;
    }

    if (dbMhs && dbMhs.length > 0) {
      rowTarget.nim = dbMhs[0].nim;
      rowTarget.nama = dbMhs[0].nama;
      rowTarget.nama_kelas = dbMhs[0].nama_kelas;
      rowTarget.program_studi = dbMhs[0].program_studi || '-'; // BIND PRODI DARI DATABASE
      rowTarget.status = 'MAPPED';
      alert(`Berhasil Bind! Mahasiswa a.n ${rowTarget.nama}`);
    } else {
      const inputManualNama = prompt(`NIM ${inputNIM} tidak ditemukan di database. Ketik Nama Lengkap Mahasiswa secara manual:`);
      if (inputManualNama && inputManualNama.trim() !== '') {
        rowTarget.nim = inputNIM;
        rowTarget.nama = inputManualNama.toUpperCase();
        rowTarget.nama_kelas = 'Susulan Manual';
        rowTarget.program_studi = 'Input Manual'; // BIND MANUAL PRODI
        rowTarget.status = 'MAPPED';
        alert("Berhasil Bind dengan nama manual!");
      } else {
        alert("Bind dibatalkan.");
        inputEl.disabled = false;
        return;
      }
    }

    renderTabelPratinjauSspect();

  } catch (err) {
    alert("Gagal melakukan bind SSPECT: " + err.message);
    inputEl.disabled = false;
  }
}

function renderTabelPratinjauSspect() {
  const tbody = document.getElementById('tabelPratinjauSspectBody');
  if (!tbody) return;

  tbody.innerHTML = globalSyncedSspectResults.map((item) => {
    let nimHtml = '';
    let namaHtml = '';
    let actionHtml = '';

    if (item.status === 'MAPPED') {
      nimHtml = `<td class="px-4 py-3 text-xs font-bold text-slate-800">${item.nim}</td>`;
      namaHtml = `<td class="px-4 py-3 text-xs font-medium truncate max-w-[180px]">${item.nama}</td>`;
      actionHtml = `
        <span class="bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-md text-[10px] uppercase font-bold shadow-sm flex items-center justify-center w-max gap-1">
          <i class="ri-link"></i> Mapped
        </span>
      `;
    } else {
      nimHtml = `
        <td class="px-4 py-3 text-xs">
          <input type="text" id="input_nim_${item.id_meja}" placeholder="Ketik NIM..." class="px-2 py-1.5 border border-rose-300 bg-rose-50 rounded-lg text-xs w-28 focus:outline-none focus:border-rose-500 font-bold text-rose-700 placeholder-rose-300">
        </td>
      `;
      namaHtml = `<td class="px-4 py-3 text-xs font-semibold text-rose-500 italic">? (Siswa Susulan)</td>`;
      actionHtml = `
        <button onclick="prosesBindNimSspect('${item.id_meja}')" class="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-md text-[10px] uppercase font-bold shadow-sm flex items-center justify-center w-max gap-1 transition-all">
          <i class="ri-lock-unlock-line"></i> Bind NIM
        </button>
      `;
    }

    // KOLOM PROGRAM STUDI DITAMBAHKAN PADA TABEL SSPECT
    const prodiHtml = `<td class="px-4 py-3 text-[11px] font-semibold text-sky-700 uppercase">${item.program_studi}</td>`;

    return `
      <tr class="${item.status === 'UNMAPPED' ? 'bg-rose-50/30' : 'hover:bg-slate-50'} transition-colors">
        <td class="px-4 py-3 text-xs font-semibold">${item.no}</td>
        ${nimHtml}
        ${namaHtml}
        ${prodiHtml}
        <td class="px-4 py-3 text-xs font-mono font-bold text-emerald-600">${item.id_meja}</td>
        <td class="px-4 py-3 text-sm text-center font-extrabold text-polnes-dark bg-emerald-50/50">${item.totalSkor}</td>
        <td class="px-4 py-3 text-xs text-center">${actionHtml}</td>
      </tr>
    `;
  }).join('');
}

async function simpanPermanenSspectKeDatabase() {
  if (!globalSyncedSspectResults || globalSyncedSspectResults.length === 0) {
    alert("Belum ada data nilai SSPECT yang tersinkronisasi.");
    return;
  }

  const unmappedCount = globalSyncedSspectResults.filter(x => x.status === 'UNMAPPED').length;
  if (unmappedCount > 0) {
    alert(`[GAGAL] Masih ada ${unmappedCount} siswa susulan SSPECT yang belum di-Bind NIM-nya.`);
    return;
  }

  if (!confirm('Yakin ingin menyimpan data hasil test SSPECT ini secara permanen ke database tabel HasilTes? Histori jadwal sesi ini juga akan dibersihkan otomatis.')) return;

  try {
    const activeIdJadwal = globalSyncedSspectResults[0].idJadwal;

    // 1. Simpan payload ke tabel "HasilTes" (DITAMBAH PRODI)
    const payload = globalSyncedSspectResults.map(item => ({
      idJadwal: item.idJadwal,
      nim: item.nim,
      jenisTes: item.jenisTes,
      sec1Listening: item.sec1Listening,
      sec2Structure: 0,
      sec3Reading: 0,
      totalSkor: item.totalSkor,
      program_studi: item.program_studi // PAYLOAD PROGRAM STUDI
    }));

    const { error: insertErr } = await window.supabaseClient
      .from('HasilTes')
      .insert(payload);

    if (insertErr) throw insertErr;

    // 2. Hapus data peserta ujian terkait jadwal ini agar bersih
    await window.supabaseClient
      .from('peserta_ujian')
      .delete()
      .eq('jadwal_id', activeIdJadwal);

    // 3. Hapus data histori jadwal log agar bersih otomatis dari daftar sesi
    const { error: deleteJadwalErr } = await window.supabaseClient
      .from('jadwal_log')
      .delete()
      .eq('id', activeIdJadwal);

    if (deleteJadwalErr) throw deleteJadwalErr;

    alert("Berhasil! Data nilai SSPECT tersimpan permanen ke HasilTes dan histori jadwal sesi ini telah dibersihkan otomatis.");
    window.location.reload();

  } catch (err) {
    alert("Gagal menyimpan ke database SSPECT: " + err.message);
  }
}