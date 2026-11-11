/**
 * MODUL PENJADWALAN - UPA BAHASA POLNES
 * Single Upload Excel + Supabase DB Direct (Zero LocalStorage)
 */

let tempSelectedData = null;

document.addEventListener('DOMContentLoaded', () => {
  setupSingleFileListener();
  renderTabelAntreanDariSupabase();
  loadHistoriJadwalDariSupabase();
});

// 1. SETUP FILE LISTENER UNTUK SINGLE EXCEL UPLOAD
function setupSingleFileListener() {
  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        bacaExcelFile(file);
      }
    });
  }
}

// 2. PARSING SINGLE EXCEL FILE
function bacaExcelFile(file) {
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

    tempSelectedData = parsedMhs;

    const fileNameText = document.getElementById('fileNameText');
    if (fileNameText) {
      fileNameText.innerText = `${file.name} (${parsedMhs.length} Mhs)`;
      fileNameText.classList.add('text-emerald-600', 'font-bold');
    }
  };
  reader.readAsArrayBuffer(file);
}

// 3. UPLOAD SINGLE KELAS LANGSUNG KE TABEL `antrean_mahasiswa` SUPABASE
async function prosesUploadSingleClass() {
  const namaKelas = document.getElementById('namaKelasInput').value.trim();

  if (!namaKelas) {
    alert("Harap masukkan Nama Kelas Baru terlebih dahulu!");
    return;
  }

  if (!tempSelectedData || tempSelectedData.length === 0) {
    alert("Harap pilih file Excel mahasiswa terlebih dahulu!");
    return;
  }

  // VALIDASI UAT-2.3: Cek Duplikasi Nama Kelas di histori DB
  const { data: existingClass } = await supabaseClient
    .from('jadwal_log')
    .select('nama_kelas')
    .eq('nama_kelas', namaKelas);

  if (existingClass && existingClass.length > 0) {
    alert(`[PENOLAKAN] Kelas "${namaKelas}" sudah pernah dikunci di database!`);
    return;
  }

  // VALIDASI UAT-2.4: Fetch NIM yang ada di DB untuk cegah duplikasi
  const { data: dbAntrean } = await supabaseClient.from('antrean_mahasiswa').select('nim');
  const { data: dbPeserta } = await supabaseClient.from('peserta_ujian').select('nim');

  const existingNIMSet = new Set([
    ...(dbAntrean ? dbAntrean.map(a => a.nim) : []),
    ...(dbPeserta ? dbPeserta.map(p => p.nim) : [])
  ]);

  const payloadBatch = [];
  for (let mhs of tempSelectedData) {
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
    if (error) {
      alert("Gagal mengunggah ke database: " + error.message);
      return;
    }
    alert(`Berhasil mengunggah ${payloadBatch.length} mahasiswa dari kelas "${namaKelas}" ke antrean database!`);
  } else {
    alert("Semua mahasiswa dalam file Excel ini sudah terdaftar di sesi lain/antrean!");
  }

  // Reset Input Form
  document.getElementById('namaKelasInput').value = '';
  document.getElementById('fileNameText').innerText = 'Pilih File Excel...';
  document.getElementById('fileNameText').classList.remove('text-emerald-600', 'font-bold');
  document.getElementById('excelFileInput').value = '';
  tempSelectedData = null;

  renderTabelAntreanDariSupabase();
}

// 4. RENDER TABEL ANTREAN DARI SUPABASE
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

// 5. KUNCI SESI UJIAN (TRANSFER ANTREAN KE LOG HISTORI SUPABASE)
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

  // VALIDASI 1: BENTROK TANGGAL + SESI + LAB
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

  // VALIDASI 2: LAB CADANGAN (JIKA LAB PASANGAN = 30 MHS, LAB INI WAJIB < 30)
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

  // Insert Header ke `jadwal_log`
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

  // Insert Detail ke `peserta_ujian`
  const pesertaPayload = mhsToSchedule.map((mhs, idx) => ({
    jadwal_id: jadwalId,
    nim: mhs.nim,
    nama: mhs.nama,
    nama_kelas: mhs.nama_kelas,
    id_meja: `STUDENT${String(idx + 1).padStart(2, '0')}`
  }));

  await supabaseClient.from('peserta_ujian').insert(pesertaPayload);

  // Hapus dari `antrean_mahasiswa` Supabase
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