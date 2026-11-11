/**
 * MODUL PENJADWALAN - UPA BAHASA POLNES
 * Compliant with UAT-2.1 to UAT-2.9 Requirements
 */

// State Antrean Plotting Lokal (Persistensi di LocalStorage)
let antreanMahasiswaState = JSON.parse(localStorage.getItem('upa_antrean_mhs')) || [];
let selectedFilesData = { 1: null, 2: null, 3: null };

// Inisialisasi saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
  setupFileListeners();
  renderTabelAntrean();
  loadHistoriJadwalDariSupabase();
});

// 1. EVENT LISTENERS UNTUK 3 SLOT UPLOAD FILE EXCEL
function setupFileListeners() {
  [1, 2, 3].forEach(slot => {
    const fileInput = document.getElementById(`excelFileInput${slot}`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          document.getElementById(`fileName${slot}`).innerText = file.name;
          bacaExcelSlot(file, slot);
        }
      });
    }
  });
}

// 2. PARSING EXCEL DENGAN SHEETJS (UAT-2.1)
function bacaExcelSlot(file, slot) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Parsing NIM dan Nama
    const parsedMhs = jsonData.map(row => ({
      nim: String(row.NIM || row.nim || row.Nim || '').trim(),
      nama: String(row.NAMA || row.Nama || row.nama || '').trim()
    })).filter(m => m.nim !== '' && m.nama !== '');

    selectedFilesData[slot] = parsedMhs;
  };
  reader.readAsArrayBuffer(file);
}

// 3. PROSES UPLOAD MULTI-SLOT & VALIDASI DUPLIKASI (UAT-2.3 & UAT-2.4)
async function prosesProsesUploadMultiSlot() {
  let countAdded = 0;

  for (let slot = 1; slot <= 3; slot++) {
    const namaKelas = document.getElementById(`namaKelasInput${slot}`).value.trim();
    const dataMhs = selectedFilesData[slot];

    if (!namaKelas || !dataMhs || dataMhs.length === 0) continue;

    // Validasi UAT-2.3: Mencegah Duplikasi Nama Kelas di Supabase
    const { data: existingClass } = await supabaseClient
      .from('jadwal_log')
      .select('nama_kelas')
      .eq('nama_kelas', namaKelas);

    if (existingClass && existingClass.length > 0) {
      alert(`[UAT-2.3 REJECTED] Kelas "${namaKelas}" sudah pernah dikunci/terdaftar di database!`);
      continue;
    }

    // Validasi UAT-2.4: Mencegah Duplikasi NIM Lintas File
    const { data: existingNIMs } = await supabaseClient
      .from('peserta_ujian')
      .select('nim');

    const dbNIMSet = new Set(existingNIMs ? existingNIMs.map(p => p.nim) : []);
    const localNIMSet = new Set(antreanMahasiswaState.map(m => m.nim));

    const validMhsList = [];
    for (let mhs of dataMhs) {
      if (dbNIMSet.has(mhs.nim) || localNIMSet.has(mhs.nim)) {
        console.warn(`[UAT-2.4 WARN] NIM ${mhs.nim} (${mhs.nama}) diabaikan karena sudah terdaftar di sesi lain.`);
      } else {
        validMhsList.push({ ...mhs, nama_kelas: namaKelas });
        localNIMSet.add(mhs.nim);
      }
    }

    if (validMhsList.length > 0) {
      antreanMahasiswaState.push(...validMhsList);
      countAdded++;
    }
  }

  // Simpan ke localStorage (UAT-2.7: Persistensi Antrean)
  localStorage.setItem('upa_antrean_mhs', JSON.stringify(antreanMahasiswaState));
  renderTabelAntrean();

  if (countAdded > 0) {
    alert(`Berhasil menambahkan ${countAdded} kelas ke antrean plotting.`);
  }
}

// 4. RENDER TABEL ANTREAN PLOTTING (UAT-2.2: ID Meja Otomatis)
function renderTabelAntrean() {
  const tbody = document.getElementById('tabelAntreanMhsBody');
  const statusText = document.getElementById('antreanStatusText');
  if (!tbody) return;

  const uniqueClasses = [...new Set(antreanMahasiswaState.map(m => m.nama_kelas))];
  if (statusText) statusText.innerText = `${uniqueClasses.length} Kelas Menunggu Plotting dalam antrean.`;

  if (antreanMahasiswaState.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 text-xs italic">Semua kelas sudah dijadwalkan atau belum ada antrean file.</td></tr>`;
    return;
  }

  tbody.innerHTML = antreanMahasiswaState.map((mhs, idx) => {
    // Generasi ID Meja Otomatis (STUDENT01, STUDENT02, dst.)
    const idMeja = `STUDENT${String(idx + 1).padStart(2, '0')}`;
    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3"><input type="checkbox" class="mhs-checkbox rounded text-polnes-main" value="${mhs.nim}" checked></td>
        <td class="px-4 py-3 text-xs font-semibold">${idx + 1}</td>
        <td class="px-4 py-3 text-xs font-bold text-slate-800">${mhs.nim}</td>
        <td class="px-4 py-3 text-xs font-medium">${mhs.nama}</td>
        <td class="px-4 py-3 text-xs text-slate-500">${mhs.nama_kelas}</td>
        <td class="px-4 py-3 text-xs font-mono font-bold text-emerald-600">${idMeja}</td>
      </tr>
    `;
  }).join('');
}

// Fitur Select All Checkbox
function toggleSelectAllMhs(master) {
  document.querySelectorAll('.mhs-checkbox').forEach(cb => cb.checked = master.checked);
}

// 5. KUNCI SESI UJIAN KE SUPABASE (UAT-2.2, UAT-2.5, UAT-2.6 & UAT-2.8)
async function kunciSesiUjianKeSupabase() {
  const jenisTes = document.getElementById('selectJenisTes').value;
  const tanggal = document.getElementById('inputTanggalUjian').value;
  const sesi = document.getElementById('selectSesi').value;
  const lab = document.getElementById('selectLab').value;

  if (!tanggal) {
    alert("Harap pilih tanggal ujian terlebih dahulu!");
    return;
  }

  // Mahasiswa yang Dicentang
  const selectedNIMs = Array.from(document.querySelectorAll('.mhs-checkbox:checked')).map(cb => cb.value);
  const mhsToSchedule = antreanMahasiswaState.filter(m => selectedNIMs.includes(m.nim));

  if (mhsToSchedule.length === 0) {
    alert("Pilih minimal 1 mahasiswa untuk dijadwalkan!");
    return;
  }

  // Validasi UAT-2.6: Fleksibilitas Kapasitas Max 30
  if (mhsToSchedule.length > 30) {
    alert(`[UAT-2.6 REJECTED] Jumlah mahasiswa yang dicentang (${mhsToSchedule.length}) melebihi kapasitas lab (Maksimal 30). Silakan bagi menjadi 2 sesi!`);
    return;
  }

  // Validasi UAT-2.5: Mencegah Bentrok Tanggal + Sesi + Lab
  const { data: bentrok } = await supabaseClient
    .from('jadwal_log')
    .select('id')
    .eq('tanggal', tanggal)
    .eq('sesi', sesi)
    .eq('ruang_lab', lab);

  if (bentrok && bentrok.length > 0) {
    alert(`[UAT-2.5 BENTROK REJECTED] ${lab} pada ${tanggal} (${sesi}) sudah dipakai oleh sesi lain!`);
    return;
  }

  const namaKelasSesi = [...new Set(mhsToSchedule.map(m => m.nama_kelas))].join(', ');

  // 1. Simpan Header Sesi ke Tabel 'jadwal_log' Supabase
  const { data: logData, error: logErr } = await supabaseClient
    .from('jadwal_log')
    .insert([{
      jenis_tes: jenisTes,
      nama_kelas: namaKelasSesi,
      tanggal: tanggal,
      sesi: sesi,
      ruang_lab: lab,
      jumlah_mhs: mhsToSchedule.length,
      status: 'DIKUNCI'
    }])
    .select();

  if (logErr) {
    alert("Gagal mengunci sesi ke Supabase: " + logErr.message);
    return;
  }

  const jadwalId = logData[0].id;

  // 2. Simpan Detail Peserta ke Tabel 'peserta_ujian' Supabase
  const pesertaPayload = mhsToSchedule.map((mhs, idx) => ({
    jadwal_id: jadwalId,
    nim: mhs.nim,
    nama: mhs.nama,
    nama_kelas: mhs.nama_kelas,
    id_meja: `STUDENT${String(idx + 1).padStart(2, '0')}`
  }));

  await supabaseClient.from('peserta_ujian').insert(pesertaPayload);

  // UAT-2.8: Pembersihan Antrean Dinamis (Hapus yang sudah dijadwalkan)
  antreanMahasiswaState = antreanMahasiswaState.filter(m => !selectedNIMs.includes(m.nim));
  localStorage.setItem('upa_antrean_mhs', JSON.stringify(antreanMahasiswaState));

  renderTabelAntrean();
  loadHistoriJadwalDariSupabase();
  alert("Sesi Ujian Berhasil Dikunci Permanen ke Database!");
}

// 6. LOAD HISTORI LOG JADWAL DARI SUPABASE
async function loadHistoriJadwalDariSupabase() {
  const tbody = document.getElementById('tabelHistoriJadwalBody');
  if (!tbody) return;

  const { data: logs, error } = await supabaseClient
    .from('jadwal_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="px-4 py-6 text-center text-slate-400 text-xs italic">Belum ada riwayat sesi yang dikunci.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map((item, idx) => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="px-4 py-3 text-xs font-semibold">${idx + 1}</td>
      <td class="px-4 py-3 text-xs font-bold text-slate-800">${item.jenis_tes}</td>
      <td class="px-4 py-3 text-xs">${item.nama_kelas}</td>
      <td class="px-4 py-3 text-xs font-medium">${item.tanggal}</td>
      <td class="px-4 py-3 text-xs">${item.sesi}</td>
      <td class="px-4 py-3 text-xs font-bold text-emerald-600">${item.ruang_lab}</td>
      <td class="px-4 py-3 text-xs font-bold">${item.jumlah_mhs} Mhs</td>
      <td class="px-4 py-3 text-xs"><span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">Dikunci</span></td>
      <td class="px-4 py-3 text-xs">
        <button onclick="cetakBeritaAcaraPDF('${item.id}', '${item.jenis_tes}', '${item.nama_kelas}', '${item.tanggal}', '${item.sesi}', '${item.ruang_lab}')" class="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md font-bold transition-all flex items-center gap-1">
          <i class="ri-file-pdf-line"></i> PDF
        </button>
      </td>
    </tr>
  `).join('');
}

// 7. CETAK BERITA ACARA / ABSENSI PDF (UAT-2.9)
async function cetakBeritaAcaraPDF(jadwalId, jenisTes, namaKelas, tanggal, sesi, ruangLab) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Fetch Peserta dari Supabase
  const { data: peserta } = await supabaseClient
    .from('peserta_ujian')
    .select('*')
    .eq('jadwal_id', jadwalId);

  // Kop Instansi UPA Bahasa POLNES
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("POLITEKNIK NEGERI SAMARINDA", 105, 15, null, null, "center");
  doc.setFontSize(12);
  doc.text("UNIT PELAKSANA AKADEMIK (UPA) BAHASA", 105, 22, null, null, "center");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("JL. Cipto Mangunkusumo Kampus Gunung Lipan Samarinda 75131", 105, 27, null, null, "center");
  doc.line(14, 30, 196, 30);

  // Detail Sesi Ujian
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`BERITA ACARA & DAFTAR HADIR UJIAN ${jenisTes}`, 14, 38);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama Kelas : ${namaKelas}`, 14, 44);
  doc.text(`Tanggal     : ${tanggal}`, 14, 49);
  doc.text(`Sesi & Jam  : ${sesi}`, 120, 44);
  doc.text(`Ruang Lab   : ${ruangLab}`, 120, 49);

  // Tabel Peserta Ujian
  const tableRows = (peserta || []).map((p, index) => [
    index + 1,
    p.nim,
    p.nama,
    p.id_meja,
    "........................"
  ]);

  doc.autoTable({
    startY: 54,
    head: [['No', 'NIM', 'Nama Mahasiswa', 'ID Meja', 'Tanda Tangan']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 195, 93] }
  });

  doc.save(`Berita_Acara_${jenisTes}_${namaKelas}_${tanggal}.pdf`);
}

// 8. LOGIC HAPUS LOG SETELAH MAPPING (DIPANGGIL DARI MODUL MAPPING)
async function hapusLogJadwalSetelahMapping(jadwalId) {
  // Menghapus data detail peserta & log jadwal di Supabase agar database tetap hemat & bersih
  await supabaseClient.from('peserta_ujian').delete().eq('jadwal_id', jadwalId);
  await supabaseClient.from('jadwal_log').delete().eq('id', jadwalId);
  console.log(`[CLEANUP SYSTEM] Log jadwal ID ${jadwalId} berhasil dibersihkan dari Supabase.`);
}