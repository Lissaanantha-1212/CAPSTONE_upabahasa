/**
 * MODUL HASIL TEST TOEFL - UPA BAHASA POLNES
 * Validasi Ketat Nama File, Rentang Jam, Tanggal, Mapping ID Meja, dan Fitur BIND Susulan
 */

let parsedSec1Data = null;
let parsedSec2Data = null;
let parsedSec3Data = null;
let globalSyncedResults = [];

// Rentang jam tiap sesi berdasarkan aturan baku
const SESI_RANGES = {
  "SESI 1 (08.00 - 10.00 WITA)": { startHour: 8, endHour: 10 },
  "SESI 2 (10.00 - 12.00 WITA)": { startHour: 10, endHour: 12 },
  "SESI 3 (14.00 - 16.00 WITA)": { startHour: 14, endHour: 16 }
};

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
  if (timeStr) {
    hour = parseInt(timeStr.split('-')[0]);
  }

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

  // Validasi Urutan & Nama Section
  if (fileInfo.secNum !== sectionNum) {
    alert(`[DITOLAK] Anda mengunggah file "${file.name}" ke kotak Section ${sectionNum}. Harap sesuaikan file dengan kotaknya!`);
    resetFileInput(sectionNum);
    return;
  }

  // Validasi Rentang Jam
  const rangeSesi = SESI_RANGES[sesiTerpilih];
  if (fileInfo.hour !== null && rangeSesi) {
    if (fileInfo.hour < rangeSesi.startHour || fileInfo.hour >= rangeSesi.endHour) {
      alert(`[DITOLAK] Rentang jam tidak sesuai! File ${file.name} menunjukkan jam ${fileInfo.hour}:xx, sedangkan ${sesiTerpilih} wajib di antara jam ${rangeSesi.startHour}:00 - ${rangeSesi.endHour}:00.`);
      resetFileInput(sectionNum);
      return;
    }
  }

  // Validasi Kesamaan Tanggal
  let referenceDate = null;
  if (parsedSec1Data) referenceDate = parsedSec1Data.info.dateStr;
  else if (parsedSec2Data) referenceDate = parsedSec2Data.info.dateStr;
  else if (parsedSec3Data) referenceDate = parsedSec3Data.info.dateStr;

  if (referenceDate && fileInfo.dateStr && fileInfo.dateStr !== referenceDate) {
    alert(`[DITOLAK] Tanggal file tidak konsisten! File ini bertanggal ${fileInfo.dateStr}, sedangkan section sebelumnya bertanggal ${referenceDate}.`);
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
      alert(`Gagal memproses data dalam Excel Section ${sectionNum}: ` + err.message);
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

async function jalankanAutoMappingEngine(lab, sesi) {
  const tanggalUjianDb = parsedSec1Data.info.dbDate;

  const { data: jadwalList, error: errJadwal } = await window.supabaseClient
    .from('jadwal_log')
    .select('id, tanggal, nama_kelas')
    .eq('ruang_lab', lab)
    .eq('sesi', sesi)
    .eq('tanggal', tanggalUjianDb);

  if (errJadwal || !jadwalList || jadwalList.length === 0) {
    alert(`[VALIDASI GAGAL] Tidak ditemukan jadwal Modul 1 untuk ${lab}, ${sesi} pada tanggal ${tanggalUjianDb}! Pastikan data penjadwalan sudah dikunci.`);
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
    alert(`[DITOLAK - DOUBLE MAPPING] Hasil test untuk kelas ini pada ${lab}, ${sesi} sudah pernah disinkronkan dan disimpan di database!`);
    return;
  }

  const { data: pesertaUjian } = await window.supabaseClient
    .from('peserta_ujian')
    .select('*')
    .eq('jadwal_id', activeJadwal.id);

  const dbPesertaList = pesertaUjian || [];
  
  // Ambil semua ID Meja dari Excel Section 1
  const excelIdMejas = parsedSec1Data.rows.map(r => r.id_meja);
  
  // Gabungkan ID Meja dari Jadwal DB dan Excel (Untuk menangkap anak susulan)
  const allIdMeja = new Set([
    ...dbPesertaList.map(p => p.id_meja),
    ...excelIdMejas
  ]);

  let idx = 1;
  globalSyncedResults = [];

  for (const id_meja of Array.from(allIdMeja).sort()) {
    const p = dbPesertaList.find(x => x.id_meja === id_meja);
    const s1Obj = parsedSec1Data.rows.find(x => x.id_meja === id_meja) || { skor: 0 };
    const s2Obj = parsedSec2Data.rows.find(x => x.id_meja === id_meja) || { skor: 0 };
    const s3Obj = parsedSec3Data.rows.find(x => x.id_meja === id_meja) || { skor: 0 };

    const rawTotal = s1Obj.skor + s2Obj.skor + s3Obj.skor;
    const toeflConverted = Math.round((rawTotal * 10) / 3); 

    if (p) {
      // Mahasiswa Terjadwal Sesuai Database
      globalSyncedResults.push({
        no: idx++,
        nim: p.nim,
        nama: p.nama,
        id_meja: id_meja,
        sec_1: s1Obj.skor,
        sec_2: s2Obj.skor,
        sec_3: s3Obj.skor,
        total_skor: toeflConverted,
        status: 'MAPPED',
        tanggal_ujian: activeJadwal.tanggal,
        nama_kelas: p.nama_kelas
      });
    } else {
      // Mahasiswa Susulan / Pindahan Lab (Ada di Excel, tidak ada di DB Sesi ini)
      globalSyncedResults.push({
        no: idx++,
        nim: '',
        nama: '',
        id_meja: id_meja,
        sec_1: s1Obj.skor,
        sec_2: s2Obj.skor,
        sec_3: s3Obj.skor,
        total_skor: toeflConverted,
        status: 'UNMAPPED',
        tanggal_ujian: activeJadwal.tanggal,
        nama_kelas: 'Susulan / Pindahan'
      });
    }
  }

  renderTabelPratinjau();
  
  const totalSusulan = globalSyncedResults.filter(x => x.status === 'UNMAPPED').length;
  document.getElementById('infoStatusSync').innerHTML = `<span class="text-polnes-main font-bold">Sinkronisasi Berhasil!</span> ${globalSyncedResults.length} baris di-mapping. <b class="text-rose-500">${totalSusulan > 0 ? totalSusulan + ' Siswa Susulan terdeteksi.' : ''}</b>`;
}

// LOGIKA BIND UNTUK MAHASISWA SUSULAN / PINDAHAN
async function prosesBindNim(idMeja) {
  const rowTarget = globalSyncedResults.find(r => r.id_meja === idMeja);
  if (!rowTarget) return;

  const inputEl = document.getElementById(`input_nim_${idMeja}`);
  const inputNIM = inputEl.value.trim();

  if (!inputNIM) {
    alert("Harap ketik NIM mahasiswa terlebih dahulu di kolom!");
    inputEl.focus();
    return;
  }

  inputEl.disabled = true;

  try {
    // 1. Cari NIM di seluruh jadwal (peserta_ujian) mungkin dia nyasar dari lab sebelah
    let { data: dbMhs } = await window.supabaseClient
      .from('peserta_ujian')
      .select('nim, nama, nama_kelas')
      .eq('nim', inputNIM)
      .limit(1);

    // 2. Jika tidak ada di jadwal, cari di antrean
    if (!dbMhs || dbMhs.length === 0) {
      const { data: dbAntrean } = await window.supabaseClient
        .from('antrean_mahasiswa')
        .select('nim, nama, nama_kelas')
        .eq('nim', inputNIM)
        .limit(1);
      dbMhs = dbAntrean;
    }

    if (dbMhs && dbMhs.length > 0) {
      // Data Ditemukan di Database!
      rowTarget.nim = dbMhs[0].nim;
      rowTarget.nama = dbMhs[0].nama;
      rowTarget.nama_kelas = dbMhs[0].nama_kelas;
      rowTarget.status = 'MAPPED';
      alert(`Berhasil Bind! Data mahasiswa a.n ${rowTarget.nama} ditemukan di sistem.`);
    } else {
      // Data Tidak Ditemukan, minta input manual
      const inputManualNama = prompt(`NIM ${inputNIM} tidak ditemukan di sistem penjadwalan. Silakan ketik Nama Lengkap Mahasiswa secara manual untuk di-bind:`);
      
      if (inputManualNama && inputManualNama.trim() !== '') {
        rowTarget.nim = inputNIM;
        rowTarget.nama = inputManualNama.toUpperCase();
        rowTarget.nama_kelas = 'Susulan Manual';
        rowTarget.status = 'MAPPED';
        alert("Berhasil Bind dengan input nama manual!");
      } else {
        alert("Bind dibatalkan. Nama mahasiswa wajib diisi jika data tidak ada di sistem.");
        inputEl.disabled = false;
        return;
      }
    }

    renderTabelPratinjau();

  } catch (err) {
    alert("Gagal melakukan pencarian di database: " + err.message);
    inputEl.disabled = false;
  }
}

function renderTabelPratinjau() {
  const tbody = document.getElementById('tabelPratinjauBody');
  if (!tbody) return;

  tbody.innerHTML = globalSyncedResults.map((item) => {
    
    // Tampilan Berbeda jika MAPPED vs UNMAPPED
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
      namaHtml = `<td class="px-4 py-3 text-xs font-semibold text-rose-500 italic">? (Menunggu Bind)</td>`;
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
    alert("Belum ada data nilai yang tersinkronisasi untuk disimpan.");
    return;
  }

  // Cek apakah masih ada yang Unmapped
  const unmappedCount = globalSyncedResults.filter(x => x.status === 'UNMAPPED').length;
  if (unmappedCount > 0) {
    alert(`[TIDAK BISA DISIMPAN] Masih ada ${unmappedCount} mahasiswa yang belum di-Bind NIM-nya. Silakan isi NIM dan klik Bind terlebih dahulu.`);
    return;
  }

  const lab = document.getElementById('selectLabToefl').value;
  const sesi = document.getElementById('selectSesiToefl').value;
  
  if (!confirm(`Yakin menyimpan hasil test untuk ${globalSyncedResults.length} mahasiswa ini ke database?`)) return;

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

    alert("Berhasil! Nilai TOEFL berhasil disimpan secara permanen ke database Supabase.");
    window.location.reload();

  } catch (err) {
    alert("Gagal menyimpan ke database: " + err.message);
  }
}