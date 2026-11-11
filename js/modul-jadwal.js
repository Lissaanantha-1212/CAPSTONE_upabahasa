/**
 * MODUL PENJADWALAN - UPA BAHASA POLNES
 * Integrasi 100% Database Supabase (Tanpa LocalStorage)
 */

let selectedFilesData = { 1: null, 2: null, 3: null };

document.addEventListener('DOMContentLoaded', () => {
  setupFileListeners();
  renderTabelAntreanDariSupabase();
  loadHistoriJadwalDariSupabase();
});

// 1. SETUP EVENT LISTENER UPLOAD FILE EXCEL
function setupFileListeners() {
  [1, 2, 3].forEach(slot => {
    const fileInput = document.getElementById(`excelFileInput${slot}`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          bacaExcelSlot(file, slot);
        }
      });
    }
  });
}

// 2. PARSING EXCEL & HITUNG JUMLAH MAHASISWA
function bacaExcelSlot(file, slot) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const parsedMhs = jsonData.map(row => ({
      nim: String(row.NIM || row.nim || row.Nim || '').trim(),
      nama: String(row.NAMA || row.Nama || row.nama || '').trim()
    })).filter(m => m.nim !== '' && m.nama !== '');

    selectedFilesData[slot] = parsedMhs;

    const fileNameElement = document.getElementById(`fileName${slot}`);
    if (fileNameElement) {
      fileNameElement.innerText = `${file.name} (Terbaca ${parsedMhs.length} Mahasiswa)`;
      fileNameElement.classList.add('text-emerald-600', 'font-bold');
    }
  };
  reader.readAsArrayBuffer(file);
}

// 3. UPLOAD SLOT KE SUPABASE (TABEL antrean_mahasiswa)
async function prosesProsesUploadMultiSlot() {
  let countAdded = 0;

  // Fetch data NIM yang sudah ada di DB (antrean & peserta resmi) untuk cegah duplikasi
  const { data: dbAntrean } = await supabaseClient.from('antrean_mahasiswa').select('nim');
  const { data: dbPeserta } = await supabaseClient.from('peserta_ujian').select('nim');

  const existingNIMSet = new Set([
    ...(dbAntrean ? dbAntrean.map(a => a.nim) : []),
    ...(dbPeserta ? dbPeserta.map(p => p.nim) : [])
  ]);

  for (let slot = 1; slot <= 3; slot++) {
    const namaKelas = document.getElementById(`namaKelasInput${slot}`).value.trim();
    const dataMhs = selectedFilesData[slot];

    if (!namaKelas || !dataMhs || dataMhs.length === 0) continue;

    // Cek duplikasi Nama Kelas di histori jadwal
    const { data: existingClass } = await supabaseClient
      .from('jadwal_log')
      .select('nama_kelas')
      .eq('nama_kelas', namaKelas);

    if (existingClass && existingClass.length > 0) {
      alert(`[PENOLAKAN] Kelas "${namaKelas}" sudah pernah dikunci di database!`);
      continue;
    }

    const payloadBatch = [];
    for (let mhs of dataMhs) {
      if (!existingNIMSet.has(mhs.nim)) {
        payloadBatch.push({
          nim: mhs.nim,
          nama: mhs.nama,
          nama_kelas: namaKelas
        });
        existingNIMSet.add(mhs.nim);
      }
    }

    if (payloadBatch.length > 0) {
      const { error } = await supabaseClient.from('antrean_mahasiswa').insert(payloadBatch);
      if (!error) countAdded++;
    }
  }

  // Clear input form
  [1, 2, 3].forEach(slot => {
    document.getElementById(`namaKelasInput${slot}`).value = '';
    document.getElementById(`fileName${slot}`).innerText = 'Belum ada file dipilih';
    document.getElementById(`fileName${slot}`).classList.remove('text-emerald-600', 'font-bold');
    selectedFilesData[slot] = null;
  });

  renderTabelAntreanDariSupabase();

  if (countAdded > 0) {
    alert(`Berhasil menyimpan ${countAdded} kelas ke antrean database Supabase.`);
  }
}

// 4. RENDER TABEL ANTREAN LANGSUNG DARI SUPABASE
async function renderTabelAntreanDariSupabase() {
  const tbody = document.getElementById('tabelAntreanMhsBody');
  const statusText = document.getElementById('antreanStatusText');
  if (!tbody) return;

  const { data: antreanData, error } = await supabaseClient
    .from('antrean_mahasiswa')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !antreanData || antreanData.length === 0) {
    if (statusText) statusText.innerText = `0 Kelas Menunggu Plotting dalam antrean.`;
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 text-xs italic">Semua kelas sudah dijadwalkan atau belum ada antrean di database.</td></tr>`;
    return;
  }

  const uniqueClasses = [...new Set(antreanData.map(m => m.nama_kelas))];
  if (statusText) statusText.innerText = `${uniqueClasses.length} Kelas Menunggu Plotting dalam antrean (${antreanData.length} Mahasiswa).`;

  tbody.innerHTML = antreanData.map((mhs, idx) => {
    const idMeja = `STUDENT${String(idx + 1).padStart(2, '0')}`;
    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3"><input type="checkbox" class="mhs-checkbox rounded text-polnes-main cursor-pointer" value="${mhs.nim}" data-nama="${mhs.nama}" data-kelas="${mhs.nama_kelas}" checked></td>
        <td class="px-4 py-3 text-xs font-semibold">${idx + 1}</td>
        <td class="px-4 py-3 text-xs font-bold text-slate-800">${mhs.nim}</td>
        <td class="px-4 py-3 text-xs font-medium">${mhs.nama}</td>
        <td class="px-4 py-3 text-xs text-slate-500">${mhs.nama_kelas}</td>
        <td class="px-4 py-3 text-xs font-mono font-bold text-emerald-600">${idMeja}</td>
      </tr>
    `;
  }).join('');
}

function toggleSelectAllMhs(master) {
  document.querySelectorAll('.mhs-checkbox').forEach(cb => cb.checked = master.checked);
}

// 5. KUNCI SESI UJIAN (TRANSFER DARI antrean_mahasiswa KE jadwal_log & peserta_ujian)
async function kunciSesiUjianKeSupabase() {
  const jenisTes = document.getElementById('selectJenisTes').value;
  const tanggal = document.getElementById('inputTanggalUjian').value;
  const sesi = document.getElementById('selectSesi').value;
  const lab = document.getElementById('selectLab').value;

  if (!tanggal) {
    alert("Harap pilih tanggal ujian terlebih dahulu!");
    return;
  }

  const checkedBoxes = Array.from(document.querySelectorAll('.mhs-checkbox:checked'));
  if (checkedBoxes.length === 0) {
    alert("Pilih minimal 1 mahasiswa untuk dijadwalkan!");
    return;
  }

  const mhsToSchedule = checkedBoxes.map(cb => ({
    nim: cb.value,
    nama: cb.getAttribute('data-nama'),
    nama_kelas: cb.getAttribute('data-kelas')
  }));

  const jumlahMhsPlot = mhsToSchedule.length;

  if (jumlahMhsPlot > 30) {
    alert(`[PENOLAKAN] Jumlah mahasiswa (${jumlahMhsPlot}) melebihi batas fisik ruangan lab (Maksimal 30)!`);
    return;
  }

  // VALIDASI 1: CEK BENTROK JADWAL (TANGGAL + SESI + LAB)
  const { data: jadwalBentrok } = await supabaseClient
    .from('jadwal_log')
    .select('id')
    .eq('tanggal', tanggal)
    .eq('sesi', sesi)
    .eq('ruang_lab', lab);

  if (jadwalBentrok && jadwalBentrok.length > 0) {
    alert(`[JADWAL BENTROK] Sesi "${sesi}" di ${lab} pada tanggal ${tanggal} sudah digunakan!`);
    return;
  }

  // VALIDASI 2: ATURAN LAB CADANGAN (JIKA LAB PASANGAN = 30 MHS, MAKA LAB INI WAJIB < 30)
  const labPasangan = (lab === 'Lab A') ? 'Lab B' : 'Lab A';

  const { data: jadwalPasangan } = await supabaseClient
    .from('jadwal_log')
    .select('jumlah_mhs')
    .eq('tanggal', tanggal)
    .eq('sesi', sesi)
    .eq('ruang_lab', labPasangan);

  if (jadwalPasangan && jadwalPasangan.length > 0) {
    const mhsPasangan = jadwalPasangan[0].jumlah_mhs;

    if (mhsPasangan >= 30 && jumlahMhsPlot >= 30) {
      alert(`[ATURAN CADANGAN DITOLAK] ${labPasangan} pada ${sesi} sudah diisi ${mhsPasangan} mahasiswa. ${lab} WAJIB diisi di bawah 30 mahasiswa agar ada unit komputer cadangan!`);
      return;
    }
  }

  const namaKelasSesi = [...new Set(mhsToSchedule.map(m => m.nama_kelas))].join(', ');

  // 1. Insert ke `jadwal_log`
  const { data: logData, error: logErr } = await supabaseClient
    .from('jadwal_log')
    .insert([{
      jenis_tes: jenisTes,
      nama_kelas: namaKelasSesi,
      tanggal: tanggal,
      sesi: sesi,
      ruang_lab: lab,
      jumlah_mhs: jumlahMhsPlot,
      status: 'DIKUNCI'
    }])
    .select();

  if (logErr) {
    alert("Gagal menyimpan ke Supabase: " + logErr.message);
    return;
  }

  const jadwalId = logData[0].id;

  // 2. Insert ke `peserta_ujian`
  const pesertaPayload = mhsToSchedule.map((mhs, idx) => ({
    jadwal_id: jadwalId,
    nim: mhs.nim,
    nama: mhs.nama,
    nama_kelas: mhs.nama_kelas,
    id_meja: `STUDENT${String(idx + 1).padStart(2, '0')}`
  }));

  await supabaseClient.from('peserta_ujian').insert(pesertaPayload);

  // 3. Hapus data yang sudah dikunci dari tabel `antrean_mahasiswa` Supabase
  const selectedNIMs = mhsToSchedule.map(m => m.nim);
  await supabaseClient.from('antrean_mahasiswa').delete().in('nim', selectedNIMs);

  renderTabelAntreanDariSupabase();
  loadHistoriJadwalDariSupabase();
  alert(`Sesi ${jenisTes} di ${lab} (${jumlahMhsPlot} Mahasiswa) Berhasil Dikunci Permanen ke Database!`);
}

// 6. LOAD HISTORI DARI SUPABASE
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

// 7. CETAK BERITA ACARA PDF
async function cetakBeritaAcaraPDF(jadwalId, jenisTes, namaKelas, tanggal, sesi, ruangLab) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const { data: peserta } = await supabaseClient
    .from('peserta_ujian')
    .select('*')
    .eq('jadwal_id', jadwalId);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("POLITEKNIK NEGERI SAMARINDA", 105, 15, null, null, "center");
  doc.setFontSize(12);
  doc.text("UNIT PELAKSANA AKADEMIK (UPA) BAHASA", 105, 22, null, null, "center");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("JL. Cipto Mangunkusumo Kampus Gunung Lipan Samarinda 75131", 105, 27, null, null, "center");
  doc.line(14, 30, 196, 30);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`BERITA ACARA & DAFTAR HADIR UJIAN ${jenisTes}`, 14, 38);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama Kelas : ${namaKelas}`, 14, 44);
  doc.text(`Tanggal     : ${tanggal}`, 14, 49);
  doc.text(`Sesi & Jam  : ${sesi}`, 120, 44);
  doc.text(`Ruang Lab   : ${ruangLab}`, 120, 49);

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