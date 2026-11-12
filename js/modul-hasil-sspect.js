/**
 * MODUL HASIL TEST SSPECT - UPA BAHASA POLNES
 * Validasi 1 file Excel, auto-mapping, bind NIM, dan simpan permanen.
 */

let parsedSspectData = null;
let globalSyncedSspectResults = [];

const SSPECT_SESI_RANGES = {
  "SESI 1 (08.00 - 10.30 WITA)": { startHour: 8, startMin: 0, endHour: 10, endMin: 30 },
  "SESI 2 (10.30 - 13.00 WITA)": { startHour: 10, startMin: 30, endHour: 13, endMin: 0 },
  "SESI 3 (14.00 - 16.30 WITA)": { startHour: 14, startMin: 0, endHour: 16, endMin: 30 }
};

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileSspectInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSspectUpload);
  }
});

function resetSspectInput() {
  const el = document.getElementById('fileSspectInput');
  const lbl = document.getElementById('labelSspectFile');
  if (el) el.value = '';
  if (lbl) {
    lbl.innerText = 'Belum ada file';
    lbl.classList.remove('text-polnes-main', 'font-bold');
  }
  parsedSspectData = null;
}

function parseSspectFileInfo(filename) {
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  const timeMatch = filename.match(/(\d{2}-\d{2}-\d{2})(?=\.\w+$)/);

  let dateStr = dateMatch ? dateMatch[0] : null;
  let timeStr = timeMatch ? timeMatch[0] : null; 
  
  let hour = null;
  let minute = null;
  if (timeStr) {
    const timeParts = timeStr.split('-');
    hour = parseInt(timeParts[0]);
    minute = parseInt(timeParts[1]);
  }

  let dbDate = null;
  if (dateStr) {
    const parts = dateStr.split('-');
    dbDate = `${parts[0]}-${parts[2]}-${parts[1]}`;
  }

  return { dateStr, dbDate, timeStr, hour, minute };
}

async function handleFileSspectUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const sesiSelect = document.getElementById('selectSesiSspect');
  const labSelect = document.getElementById('selectLabSspect');
  const sesiTerpilih = sesiSelect ? sesiSelect.value : '';
  const labTerpilih = labSelect ? labSelect.value : '';
  
  const fileInfo = parseSspectFileInfo(file.name);

  const rangeSesi = SSPECT_SESI_RANGES[sesiTerpilih];
  if (fileInfo.hour !== null && rangeSesi) {
    const fileTotalMinutes = fileInfo.hour * 60 + fileInfo.minute;
    const startTotalMinutes = rangeSesi.startHour * 60 + rangeSesi.startMin;
    const endTotalMinutes = rangeSesi.endHour * 60 + rangeSesi.endMin;

    if (fileTotalMinutes < startTotalMinutes || fileTotalMinutes > endTotalMinutes) {
      alert(`[DITOLAK] Jam file (${fileInfo.hour}:${fileInfo.minute < 10 ? '0':''}${fileInfo.minute} WITA) di luar rentang ${sesiTerpilih}.`);
      resetSspectInput();
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

      const parsedRows = parseExcelSspectNilai(rows);
      parsedSspectData = { file, rows: parsedRows, name: file.name, info: fileInfo };

      await jalankanSspectAutoMappingEngine(labTerpilih, sesiTerpilih);

    } catch (err) {
      alert(`Gagal memproses file Excel SSPECT: ` + err.message);
      resetSspectInput();
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseExcelSspectNilai(rows) {
  const results = [];
  for (let r = 4; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const idMejaVal = String(row[0] || '').trim().toUpperCase(); 
    const scoreValRaw = String(row[3] || '').trim(); 

    if (idMejaVal.startsWith('STUDENT')) {
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
  const tanggalUjianDb = parsedSspectData.info.dbDate || parsedSspectData.info.dateStr;

  const { data: jadwalList, error: errJadwal } = await window.supabaseClient
    .from('jadwal_log')
    .select('id, tanggal, nama_kelas')
    .eq('ruang_lab', lab)
    .eq('sesi', sesi)
    .eq('tanggal', tanggalUjianDb);

  if (errJadwal || !jadwalList || jadwalList.length === 0) {
    alert(`[VALIDASI GAGAL] Tidak ditemukan jadwal SSPECT untuk ${lab}, ${sesi} pada tanggal ${tanggalUjianDb}.`);
    return;
  }

  const activeJadwal = jadwalList[0];

  const { data: existingLog } = await window.supabaseClient
    .from('HasilTes')
    .select('id')
    .eq('idJadwal', activeJadwal.id);

  if (existingLog && existingLog.length > 0) {
    alert(`[DITOLAK] Hasil test SSPECT untuk sesi ini sudah pernah disimpan secara permanen ke database.`);
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

  dbPesertaList.forEach(p => {
    const matchedRow = excelRows.find(x => x.id_meja === p.id_meja) || { skor: 0 };
    
    globalSyncedSspectResults.push({
      no: idx++,
      idJadwal: activeJadwal.id,
      nim: p.nim,
      nama: p.nama,
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

  const dbIdMejas = new Set(dbPesertaList.map(p => p.id_meja));
  const susulanRows = excelRows.filter(x => !dbIdMejas.has(x.id_meja));

  susulanRows.forEach(sus => {
    globalSyncedSspectResults.push({
      no: idx++,
      idJadwal: activeJadwal.id,
      nim: '',
      nama: '',
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
      .select('nim, nama, nama_kelas')
      .eq('nim', inputNIM)
      .limit(1);

    if (!dbMhs || dbMhs.length === 0) {
      const { data: dbAntrean } = await window.supabaseClient
        .from('antrean_mahasiswa')
        .select('nim, nama, nama_kelas')
        .eq('nim', inputNIM)
        .limit(1);
      dbMhs = dbAntrean;
    }

    if (dbMhs && dbMhs.length > 0) {
      rowTarget.nim = dbMhs[0].nim;
      rowTarget.nama = dbMhs[0].nama;
      rowTarget.nama_kelas = dbMhs[0].nama_kelas;
      rowTarget.status = 'MAPPED';
      alert(`Berhasil Bind! Mahasiswa a.n ${rowTarget.nama}`);
    } else {
      const inputManualNama = prompt(`NIM ${inputNIM} tidak ditemukan. Ketik Nama Lengkap Mahasiswa secara manual:`);
      if (inputManualNama && inputManualNama.trim() !== '') {
        rowTarget.nim = inputNIM;
        rowTarget.nama = inputManualNama.toUpperCase();
        rowTarget.nama_kelas = 'Susulan Manual';
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
    alert("Gagal melakukan bind: " + err.message);
    inputEl.disabled = false;
  }
}

function renderTabelPratinjauSspect() {
  const tbody = document.getElementById('tabelPratinjauSspectBody');
  if (!tbody) return;

  const statusSync = document.getElementById('infoStatusSync');
  const unmapped = globalSyncedSspectResults.filter(x => x.status === 'UNMAPPED').length;
  
  if (statusSync) {
    statusSync.innerHTML = `<span class="text-polnes-main font-bold">Sinkronisasi Selesai!</span> Total ${globalSyncedSspectResults.length} peserta. <span class="${unmapped > 0 ? 'text-rose-500 font-bold' : 'text-polnes-main font-bold'}">${unmapped > 0 ? unmapped + ' siswa susulan belum di-Bind.' : 'Semua data pas dan valid.'}</span>`;
  }

  tbody.innerHTML = globalSyncedSspectResults.map((item) => {
    let nimHtml = '';
    let namaHtml = '';
    let actionHtml = '';

    if (item.status === 'MAPPED') {
      nimHtml = `<td class="px-4 py-4 text-[13px] font-bold text-slate-800 border-b border-slate-100">${item.nim}</td>`;
      namaHtml = `<td class="px-4 py-4 text-[13px] font-medium text-slate-600 border-b border-slate-100 uppercase">${item.nama}</td>`;
      actionHtml = `
        <span class="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] uppercase font-bold shadow-sm inline-flex items-center justify-center gap-1">
          <i class="ri-link"></i> MAPPED
        </span>`;
    } else {
      nimHtml = `
        <td class="px-4 py-4 text-[13px] border-b border-slate-100">
          <input type="text" id="input_nim_${item.id_meja}" placeholder="Ketik NIM..." class="px-3 py-1.5 border border-rose-300 bg-rose-50 rounded-lg text-xs w-32 focus:outline-none focus:border-rose-500 font-bold text-rose-700 placeholder-rose-300">
        </td>`;
      namaHtml = `<td class="px-4 py-4 text-[13px] font-semibold text-rose-500 italic border-b border-slate-100">? (Siswa Susulan)</td>`;
      actionHtml = `
        <button onclick="prosesBindNimSspect('${item.id_meja}')" class="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[11px] uppercase font-bold shadow-sm inline-flex items-center justify-center gap-1 transition-all">
          <i class="ri-lock-unlock-line"></i> BIND
        </button>`;
    }

    return `
      <tr class="${item.status === 'UNMAPPED' ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'} transition-colors">
        <td class="px-4 py-4 text-[13px] font-semibold border-b border-slate-100">${item.no}</td>
        ${nimHtml}
        ${namaHtml}
        <td class="px-4 py-4 text-[13px] font-bold text-emerald-600 border-b border-slate-100 uppercase">${item.id_meja}</td>
        <td class="px-4 py-4 text-sm text-center font-extrabold text-polnes-dark bg-emerald-50/30 border-b border-slate-100">${item.totalSkor}</td>
        <td class="px-4 py-4 text-center border-b border-slate-100">${actionHtml}</td>
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

  if (!confirm(`Yakin ingin menyimpan hasil test SSPECT ini secara permanen ke database tabel HasilTes? Histori jadwal sesi ini juga akan dibersihkan otomatis.`)) return;

  try {
    const activeIdJadwal = globalSyncedSspectResults[0].idJadwal;

    const payload = globalSyncedSspectResults.map(item => ({
      idJadwal: item.idJadwal,
      nim: item.nim,
      jenisTes: item.jenisTes,
      sec1Listening: item.sec1Listening,
      sec2Structure: 0,
      sec3Reading: 0,
      totalSkor: item.totalSkor
    }));

    const { error: insertErr } = await window.supabaseClient
      .from('HasilTes')
      .insert(payload);

    if (insertErr) throw insertErr;

    await window.supabaseClient
      .from('peserta_ujian')
      .delete()
      .eq('jadwal_id', activeIdJadwal);

    const { error: deleteJadwalErr } = await window.supabaseClient
      .from('jadwal_log')
      .delete()
      .eq('id', activeIdJadwal);

    if (deleteJadwalErr) throw deleteJadwalErr;

    alert("Berhasil! Nilai SSPECT tersimpan permanen dan histori jadwal sesi ini telah dibersihkan otomatis.");
    window.location.reload();

  } catch (err) {
    alert("Gagal menyimpan ke database SSPECT: " + err.message);
  }
}