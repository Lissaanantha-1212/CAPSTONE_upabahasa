/**
 * MODUL HASIL TEST TOEFL - UPA BAHASA POLNES
 * Menggunakan Backend Tabel Konversi Resmi TOEFL ITP PBT
 */

let parsedSec1Data = null;
let parsedSec2Data = null;
let parsedSec3Data = null;
let globalSyncedResults = [];

const SESI_RANGES = {
  "SESI 1 (08.00 - 10.00 WITA)": { startHour: 8, endHour: 10 },
  "SESI 2 (10.00 - 12.00 WITA)": { startHour: 10, endHour: 12 },
  "SESI 3 (14.00 - 16.00 WITA)": { startHour: 14, endHour: 16 }
};

// TABEL KONVERSI RESMI TOEFL ITP PBT (Sebagai acuan Backend)
const TABEL_KONVERSI_TOEFL = {
  50: { l: 68, s: 68, r: 67 },
  49: { l: 67, s: 67, r: 66 },
  48: { l: 66, s: 65, r: 65 },
  47: { l: 65, s: 63, r: 63 },
  46: { l: 63, s: 61, r: 61 },
  45: { l: 62, s: 60, r: 60 },
  44: { l: 61, s: 59, r: 59 },
  43: { l: 60, s: 58, r: 58 },
  42: { l: 59, s: 57, r: 57 },
  41: { l: 58, s: 56, r: 56 },
  40: { l: 57, s: 68, r: 55 },
  39: { l: 57, s: 67, r: 54 },
  38: { l: 56, s: 65, r: 54 },
  37: { l: 55, s: 63, r: 53 },
  36: { l: 54, s: 61, r: 52 },
  35: { l: 54, s: 60, r: 52 },
  34: { l: 53, s: 58, r: 51 },
  33: { l: 52, s: 57, r: 50 },
  32: { l: 52, s: 56, r: 49 },
  31: { l: 51, s: 55, r: 48 },
  30: { l: 51, s: 54, r: 48 },
  29: { l: 50, s: 53, r: 47 },
  28: { l: 49, s: 52, r: 46 },
  27: { l: 49, s: 51, r: 46 },
  26: { l: 48, s: 50, r: 45 },
  25: { l: 48, s: 49, r: 44 },
  24: { l: 47, s: 48, r: 43 },
  23: { l: 47, s: 47, r: 43 },
  22: { l: 46, s: 46, r: 42 },
  21: { l: 45, s: 45, r: 41 },
  20: { l: 45, s: 44, r: 40 },
  19: { l: 44, s: 43, r: 39 },
  18: { l: 43, s: 42, r: 38 }
};

// Fungsi Helper untuk Mendapatkan Angka Konversi Berdasarkan Tabel B
function konversiSkor(jumlahBenar, sectionType) {
  let scoreNum = parseInt(jumlahBenar) || 0;
  if (scoreNum > 50) scoreNum = 50;
  
  // Jika ada di tabel
  if (TABEL_KONVERSI_TOEFL[scoreNum]) {
    if (sectionType === 1) return TABEL_KONVERSI_TOEFL[scoreNum].l; // Listening
    if (sectionType === 2) return TABEL_KONVERSI_TOEFL[scoreNum].s; // Structure
    if (sectionType === 3) return TABEL_KONVERSI_TOEFL[scoreNum].r; // Reading
  }
  
  // Fallback jika di bawah 18 (estimasi dasar)
  return Math.max(30, scoreNum + 20);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fileSec1').addEventListener('change', (e) => handleFileSection(e, 1));
  document.getElementById('fileSec2').addEventListener('change', (e) => handleFileSection(e, 2));
  document.getElementById('fileSec3').addEventListener('change', (e) => handleFileSection(e, 3));
});

function resetFileInput(sectionNum) {
  document.getElementById(`fileSec${sectionNum}`).value = '';
  document.getElementById(`labelSec${sectionNum}`).innerText = 'Belum ada file';
  document.getElementById(`labelSec${sectionNum}`).classList.remove('text-polnes-main', 'font-bold');
  if (sectionNum === 1) parsedSec1Data = null;
  if (sectionNum === 2) parsedSec2Data = null;
  if (sectionNum === 3) parsedSec3Data = null;
}

function parseFileInfo(filename) {
  const dateMatch = filename.match(/(\d{2}-\d{2}-\d{4})/);
  const timeMatch = filename.match(/(\d{2}-\d{2}-\d{2})(?=\.\w+$)/);
  const sectionMatch = filename.match(/SECTION\s+(\d)/i);

  let dateStr = dateMatch ? dateMatch[0] : null;
  let timeStr = timeMatch ? timeMatch[0] : null; 
  let secNum = sectionMatch ? parseInt(sectionMatch[1]) : null;
  
  let hour = null;
  if (timeStr) hour = parseInt(timeStr.split('-')[0]);

  let dbDate = null;
  if (dateStr) {
    const parts = dateStr.split('-');
    dbDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return { secNum, dateStr, dbDate, timeStr, hour };
}

async function handleFileSection(event, sectionNum) {
  const file = event.target.files[0];
  if (!file) return;

  const sesiTerpilih = document.getElementById('selectSesiToefl').value;
  const labTerpilih = document.getElementById('selectLabToefl').value;
  const fileInfo = parseFileInfo(file.name);

  if (fileInfo.secNum !== sectionNum) {
    alert(`[DITOLAK] File "${file.name}" tidak sesuai untuk Section ${sectionNum}.`);
    resetFileInput(sectionNum);
    return;
  }

  const rangeSesi = SESI_RANGES[sesiTerpilih];
  if (fileInfo.hour !== null && rangeSesi) {
    if (fileInfo.hour < rangeSesi.startHour || fileInfo.hour >= rangeSesi.endHour) {
      alert(`[DITOLAK] Jam file (${fileInfo.hour}:xx) di luar rentang ${sesiTerpilih}.`);
      resetFileInput(sectionNum);
      return;
    }
  }

  let referenceDate = null;
  if (parsedSec1Data) referenceDate = parsedSec1Data.info.dateStr;
  else if (parsedSec2Data) referenceDate = parsedSec2Data.info.dateStr;
  else if (parsedSec3Data) referenceDate = parsedSec3Data.info.dateStr;

  if (referenceDate && fileInfo.dateStr && fileInfo.dateStr !== referenceDate) {
    alert(`[DITOLAK] Tanggal antar file section tidak konsisten.`);
    resetFileInput(sectionNum);
    return;
  }

  const label = document.getElementById(`labelSec${sectionNum}`);
  label.innerText = file.name;
  label.classList.add('text-polnes-main', 'font-bold');

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      const parsedRows = parseExcelNilai(rows);
      const sectionData = { file, rows: parsedRows, name: file.name, info: fileInfo };

      if (sectionNum === 1) parsedSec1Data = sectionData;
      if (sectionNum === 2) parsedSec2Data = sectionData;
      if (sectionNum === 3) parsedSec3Data = sectionData;

      if (parsedSec1Data && parsedSec2Data && parsedSec3Data) {
        await jalankanAutoMappingEngine(labTerpilih, sesiTerpilih);
      }

    } catch (err) {
      alert(`Gagal memproses file Excel: ` + err.message);
      resetFileInput(sectionNum);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseExcelNilai(rows) {
  const results = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const idMejaVal = String(row[0] || '').trim().toUpperCase(); 
    const scoreValRaw = String(row[3] || '').trim(); 

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

async function jalankanAutoMappingEngine(lab, sesi) {
  const tanggalUjianDb = parsedSec1Data.info.dbDate;

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
    .from('hasil_test_log')
    .select('id')
    .eq('ruang_lab', lab)
    .eq('sesi', sesi)
    .eq('tanggal_ujian', activeJadwal.tanggal);

  if (existingLog && existingLog.length > 0) {
    alert(`[DITOLAK] Hasil test untuk sesi ini sudah pernah disimpan secara permanen.`);
    return;
  }

  const { data: pesertaUjian } = await window.supabaseClient
    .from('peserta_ujian')
    .select('*')
    .eq('jadwal_id', activeJadwal.id)
    .order('id_meja', { ascending: true });

  const dbPesertaList = pesertaUjian || [];
  const excelRows = parsedSec1Data.rows;

  let idx = 1;
  globalSyncedResults = [];

  // 1. Mapping Peserta Terjadwal dengan Kalkulasi Tabel Konversi Resmi
  dbPesertaList.forEach(p => {
    const s1Raw = (excelRows.find(x => x.id_meja === p.id_meja) || { skor: 0 }).skor;
    const s2Raw = (parsedSec2Data.rows.find(x => x.id_meja === p.id_meja) || { skor: 0 }).skor;
    const s3Raw = (parsedSec3Data.rows.find(x => x.id_meja === p.id_meja) || { skor: 0 }).skor;

    // Ubah jumlah benar mentah menjadi Skor Konversi Tabel TOEFL
    const konvS1 = konversiSkor(s1Raw, 1);
    const konvS2 = konversiSkor(s2Raw, 2);
    const konvS3 = konversiSkor(s3Raw, 3);

    // Rumus Total Skor Akhir TOEFL: ((L + S + R) * 10) / 3
    const totalSkorAkhir = Math.round(((konvS1 + konvS2 + konvS3) * 10) / 3);

    globalSyncedResults.push({
      no: idx++,
      nim: p.nim,
      nama: p.nama,
      id_meja: p.id_meja,
      sec_1: s1Raw, // Menampilkan angka benar asli di tabel UI
      sec_2: s2Raw,
      sec_3: s3Raw,
      total_skor: totalSkorAkhir, // Total hasil konversi resmi
      status: 'MAPPED',
      tanggal_ujian: activeJadwal.tanggal,
      nama_kelas: p.nama_kelas
    });
  });

  // 2. Deteksi Siswa Susulan / Pindahan Lab
  const dbIdMejas = new Set(dbPesertaList.map(p => p.id_meja));
  const susulanRows = excelRows.filter(x => !dbIdMejas.has(x.id_meja));

  susulanRows.forEach(sus => {
    const s1Raw = sus.skor;
    const s2Raw = (parsedSec2Data.rows.find(x => x.id_meja === sus.id_meja) || { skor: 0 }).skor;
    const s3Raw = (parsedSec3Data.rows.find(x => x.id_meja === sus.id_meja) || { skor: 0 }).skor;

    const konvS1 = konversiSkor(s1Raw, 1);
    const konvS2 = konversiSkor(s2Raw, 2);
    const konvS3 = konversiSkor(s3Raw, 3);
    const totalSkorAkhir = Math.round(((konvS1 + konvS2 + konvS3) * 10) / 3);

    globalSyncedResults.push({
      no: idx++,
      nim: '',
      nama: '',
      id_meja: sus.id_meja,
      sec_1: s1Raw,
      sec_2: s2Raw,
      sec_3: s3Raw,
      total_skor: totalSkorAkhir,
      status: 'UNMAPPED',
      tanggal_ujian: activeJadwal.tanggal,
      nama_kelas: 'Susulan / Pindahan'
    });
  });

  renderTabelPratinjau();
  
  const totalSusulan = susulanRows.length;
  document.getElementById('infoStatusSync').innerHTML = `<span class="text-polnes-main font-bold">Sinkronisasi Berhasil!</span> ${dbPesertaList.length} peserta sesuai jadwal. <b class="text-rose-500">${totalSusulan > 0 ? totalSusulan + ' Siswa Susulan terdeteksi.' : 'Semua data pas dan valid.'}</b>`;
}

async function prosesBindNim(idMeja) {
  const rowTarget = globalSyncedResults.find(r => r.id_meja === idMeja);
  if (!rowTarget) return;

  const inputEl = document.getElementById(`input_nim_${idMeja}`);
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
      const inputManualNama = prompt(`NIM ${inputNIM} tidak ditemukan di database. Ketik Nama Lengkap Mahasiswa secara manual:`);
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

    renderTabelPratinjau();

  } catch (err) {
    alert("Gagal melakukan bind: " + err.message);
    inputEl.disabled = false;
  }
}

function renderTabelPratinjau() {
  const tbody = document.getElementById('tabelPratinjauBody');
  if (!tbody) return;

  tbody.innerHTML = globalSyncedResults.map((item) => {
    let nimHtml = '';
    let namaHtml = '';
    let actionHtml = '';

    if (item.status === 'MAPPED') {
      nimHtml = `<td class="px-4 py-3 text-xs font-bold text-slate-800">${item.nim}</td>`;
      namaHtml = `<td class="px-4 py-3 text-xs font-medium truncate max-w-[150px]">${item.nama}</td>`;
      actionHtml = `
        <span class="bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-md text-[10px] uppercase font-bold shadow-sm flex items-center justify-center w-max gap-1">
          <i class="ri-link"></i> Mapped
        </span>`;
    } else {
      nimHtml = `
        <td class="px-4 py-3 text-xs">
          <input type="text" id="input_nim_${item.id_meja}" placeholder="Ketik NIM..." class="px-2 py-1.5 border border-rose-300 bg-rose-50 rounded-lg text-xs w-28 focus:outline-none focus:border-rose-500 font-bold text-rose-700 placeholder-rose-300">
        </td>`;
      namaHtml = `<td class="px-4 py-3 text-xs font-semibold text-rose-500 italic">? (Siswa Susulan)</td>`;
      actionHtml = `
        <button onclick="prosesBindNim('${item.id_meja}')" class="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1.5 rounded-md text-[10px] uppercase font-bold shadow-sm flex items-center justify-center w-max gap-1 transition-all">
          <i class="ri-lock-unlock-line"></i> Bind NIM
        </button>`;
    }

    return `
      <tr class="${item.status === 'UNMAPPED' ? 'bg-rose-50/30' : 'hover:bg-slate-50'} transition-colors">
        <td class="px-4 py-3 text-xs font-semibold">${item.no}</td>
        ${nimHtml}
        ${namaHtml}
        <td class="px-4 py-3 text-xs font-mono font-bold text-emerald-600">${item.id_meja}</td>
        <td class="px-4 py-3 text-xs text-center font-semibold text-sky-600">${item.sec_1}</td>
        <td class="px-4 py-3 text-xs text-center font-semibold text-purple-600">${item.sec_2}</td>
        <td class="px-4 py-3 text-xs text-center font-semibold text-amber-600">${item.sec_3}</td>
        <td class="px-4 py-3 text-sm text-center font-extrabold text-polnes-dark bg-emerald-50/50">${item.total_skor}</td>
        <td class="px-4 py-3 text-xs">${actionHtml}</td>
      </tr>
    `;
  }).join('');
}

async function simpanPermanenKeDatabase() {
  if (!globalSyncedResults || globalSyncedResults.length === 0) {
    alert("Belum ada data nilai yang tersinkronisasi.");
    return;
  }

  const unmappedCount = globalSyncedResults.filter(x => x.status === 'UNMAPPED').length;
  if (unmappedCount > 0) {
    alert(`[GAGAL] Masih ada ${unmappedCount} siswa susulan yang belum di-Bind NIM-nya.`);
    return;
  }

  const lab = document.getElementById('selectLabToefl').value;
  const sesi = document.getElementById('selectSesiToefl').value;
  
  if (!confirm(`Yakin ingin menyimpan data hasil test ini secara permanen ke database?`)) return;

  try {
    const { data: logData, error: logErr } = await window.supabaseClient
      .from('hasil_test_log')
      .insert([{
        jenis_tes: 'TOEFL',
        ruang_lab: lab,
        sesi: sesi,
        tanggal_ujian: globalSyncedResults[0].tanggal_ujian,
        nama_kelas: globalSyncedResults[0].nama_kelas,
        jumlah_peserta: globalSyncedResults.length
      }])
      .select();

    if (logErr) throw logErr;
    const hasilTestId = logData[0].id;

    const detailPayload = globalSyncedResults.map(item => ({
      hasil_test_id: hasilTestId,
      nim: item.nim,
      nama: item.nama,
      id_meja: item.id_meja,
      sec_1: item.sec_1,
      sec_2: item.sec_2,
      sec_3: item.sec_3,
      total_skor: item.total_skor,
      status_mapping: item.status
    }));

    const { error: detailErr } = await window.supabaseClient
      .from('detail_nilai_peserta')
      .insert(detailPayload);

    if (detailErr) throw detailErr;

    alert("Berhasil! Data nilai TOEFL tersimpan permanen ke database.");
    window.location.reload();

  } catch (err) {
    alert("Gagal menyimpan ke database: " + err.message);
  }
}