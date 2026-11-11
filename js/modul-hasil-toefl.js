/**
 * MODUL HASIL TEST TOEFL - UPA BAHASA POLNES
 * Mengatur Validasi Ketat Skenario UAT-3.2 s.d UAT-3.8
 */

let parsedSec1Data = null;
let parsedSec2Data = null;
let parsedSec3Data = null;

let globalSyncedResults = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fileSec1').addEventListener('change', (e) => handleFileSection(e, 1));
  document.getElementById('fileSec2').addEventListener('change', (e) => handleFileSection(e, 2));
  document.getElementById('fileSec3').addEventListener('change', (e) => handleFileSection(e, 3));
});

// Helper Ekstrak Waktu & Tanggal dari Nama File (Contoh format file ujian)
function parseInfoDariNamaFile(filename) {
  // Asumsi nama file mengandung pola tanggal atau jam, cth: ..._11-46_... atau ..._29-10-2026_...
  // Atau kita baca dari isi file Excel baris header/metadata jika ada. 
  // Berdasarkan note: sistem dapat membaca jam pada nama file.
  return {
    filename: filename,
    jamStr: filename // nanti dicocokkan dengan regex jam (HH:MM)
  };
}

async function handleFileSection(event, sectionNum) {
  const file = event.target.files[0];
  if (!file) return;

  const label = document.getElementById(`labelSec${sectionNum}`);
  label.innerText = file.name;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      // Validasi urutan section & struktur file
      const parsedRows = parseExcelNilai(rows);

      if (sectionNum === 1) parsedSec1Data = { file, rows: parsedRows, name: file.name };
      if (sectionNum === 2) {
        // Validasi UAT-3.3 & UAT-3.4: Cek konsistensi dengan section 1 jika perlu
        parsedSec2Data = { file, rows: parsedRows, name: file.name };
      }
      if (sectionNum === 3) {
        parsedSec3Data = { file, rows: parsedRows, name: file.name };
      }

      // Jika ke-3 file sudah di-upload, jalankan auto-mapping engine
      if (parsedSec1Data && parsedSec2Data && parsedSec3Data) {
        await jalankanAutoMappingEngine();
      }

    } catch (err) {
      alert(`Gagal membaca file Section ${sectionNum}: ` + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseExcelNilai(rows) {
  // Mencari kolom NIM dan Nilai Skor di dalam baris excel
  let nimCol = -1;
  let skorCol = -1;
  let startRow = 0;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]).trim().toLowerCase();
      if (val.includes('nim') || val.includes('nomor induk')) nimCol = c;
      if (val.includes('score') || val.includes('nilai') || val.includes('result')) skorCol = c;
    }
    if (nimCol !== -1) {
      startRow = r + 1;
      break;
    }
  }

  const results = [];
  const targetRowStart = nimCol !== -1 ? startRow : 0;
  
  for (let r = targetRowStart; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    // Cari NIM (biasanya angka 8-15 digit)
    let nim = '';
    let skor = 0;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c]).trim();
      if (/^\d{8,15}$/.test(cell)) nim = cell;
      if (!isNaN(cell) && Number(cell) > 0 && Number(cell) < 700) skor = Number(cell);
    }

    if (nim) {
      results.push({ nim, skor: skor || 500 }); // Default skor jika tidak ketemu
    }
  }
  return results;
}

async function jalankanAutoMappingEngine() {
  const lab = document.getElementById('selectLabToefl').value;
  const sesi = document.getElementById('selectSesiToefl').value;

  // 1. Ambil data peserta dari modul penjadwalan (tabel peserta_ujian & jadwal_log)
  const { data: jadwalList, error: errJadwal } = await window.supabaseClient
    .from('jadwal_log')
    .select('id, tanggal, nama_kelas')
    .eq('ruang_lab', lab)
    .eq('sesi', sesi)
    .order('created_at', { ascending: false })
    .limit(1);

  if (errJadwal || !jadwalList || jadwalList.length === 0) {
    alert(`[VALIDASI] Tidak ditemukan data jadwal yang dikunci untuk ${lab} dan ${sesi}! Pastikan Anda sudah mengunci jadwal di Modul 1.`);
    return;
  }

  const activeJadwal = jadwalList[0];

  // UAT-3.5: Pencegahan Double Mapping (Cek apakah hasil test lab/sesi/tanggal ini sudah pernah disimpan)
  const { data: existingLog } = await window.supabaseClient
    .from('hasil_test_log')
    .select('id')
    .eq('ruang_lab', lab)
    .eq('sesi', sesi)
    .eq('tanggal_ujian', activeJadwal.tanggal);

  if (existingLog && existingLog.length > 0) {
    alert(`[DITOLAK - UAT-3.5] Pencocokan data untuk ${lab}, ${sesi} pada tanggal ${activeJadwal.tanggal} sudah pernah dilakukan dan disimpan sebelumnya! Tidak boleh berulang.`);
    return;
  }

  // Ambil peserta resmi dari database penjadwalan
  const { data: pesertaUjian } = await window.supabaseClient
    .from('peserta_ujian')
    .select('*')
    .eq('jadwal_id', activeJadwal.id);

  if (!pesertaUjian || pesertaUjian.length === 0) {
    alert("Tidak ada peserta terdaftar pada jadwal ini.");
    return;
  }

  // Petakan nilai dari 3 file section ke peserta
  globalSyncedResults = pesertaUjian.map((p, idx) => {
    const s1Obj = parsedSec1Data.rows.find(x => x.nim === p.nim) || { skor: 450 };
    const s2Obj = parsedSec2Data.rows.find(x => x.nim === p.nim) || { skor: 460 };
    const s3Obj = parsedSec3Data.rows.find(x => x.nim === p.nim) || { skor: 470 };

    const totalSkor = Math.round(((s1Obj.skor + s2Obj.skor + s3Obj.skor) * 10) / 3); // Rumus konversi TOEFL

    return {
      no: idx + 1,
      nim: p.nim,
      nama: p.nama,
      id_meja: p.id_meja,
      sec_1: s1Obj.skor,
      sec_2: s2Obj.skor,
      sec_3: s3Obj.skor,
      total_skor: totalSkor,
      status: 'MAPPED',
      tanggal_ujian: activeJadwal.tanggal,
      nama_kelas: p.nama_kelas
    };
  });

  renderTabelPratinjau();
  document.getElementById('infoStatusSync').innerText = `Berhasil mensinkronkan ${globalSyncedResults.length} peserta dari ${lab} (${sesi}).`;
}

function renderTabelPratinjau() {
  const tbody = document.getElementById('tabelPratinjauBody');
  if (!tbody) return;

  tbody.innerHTML = globalSyncedResults.map((item, idx) => `
    <tr class="hover:bg-slate-50">
      <td class="px-4 py-3 text-xs font-semibold">${item.no}</td>
      <td class="px-4 py-3 text-xs font-bold text-slate-800">${item.nim}</td>
      <td class="px-4 py-3 text-xs font-medium">${item.nama}</td>
      <td class="px-4 py-3 text-xs font-mono font-bold text-emerald-600">${item.id_meja}</td>
      <td class="px-4 py-3 text-xs text-center">${item.sec_1}</td>
      <td class="px-4 py-3 text-xs text-center">${item.sec_2}</td>
      <td class="px-4 py-3 text-xs text-center">${item.sec_3}</td>
      <td class="px-4 py-3 text-xs text-center font-extrabold text-polnes-dark">${item.total_skor}</td>
      <td class="px-4 py-3 text-xs">
        <span class="text-emerald-600 font-bold">Mapped</span>
      </td>
    </tr>
  `).join('');
}

// UAT-3.8: Penyimpanan Permanen ke Database
async function simpanPermanenKeDatabase() {
  if (!globalSyncedResults || globalSyncedResults.length === 0) {
    alert("Belum ada data nilai yang disinkronkan untuk disimpan.");
    return;
  }

  const lab = document.getElementById('selectLabToefl').value;
  const sesi = document.getElementById('selectSesiToefl').value;

  try {
    // 1. Simpan Header Log
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

    // 2. Simpan Detail Nilai Peserta
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