/**
 * MODUL PENJADWALAN - UPA BAHASA POLNES
 * Robust Excel Parsing (Fleksibel Kolom NIM/Nama) + Supabase Direct Sync
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTabelAntreanDariSupabase();
  loadHistoriJadwalDariSupabase();
});

// 1. KLIK TOMBOL PILIH FILE EXCEL
function handleSelectFileClick() {
  const namaKelas = document.getElementById('namaKelasInput').value.trim();
  if (!namaKelas) {
    alert("Harap masukkan Nama Kelas Baru terlebih dahulu!");
    return;
  }
  document.getElementById('excelFileInput').click();
}

// 2. HANDLER SAAT FILE BERHASIL DIPILIH
function handleFileSelected(inputElement) {
  const file = inputElement.files[0];
  if (file) {
    bacaDanUploadExcelOtomatis(file);
  }
}

// 3. PROSES BACA EXCEL & UPLOAD LANGSUNG KE SUPABASE
async function bacaDanUploadExcelOtomatis(file) {
  const namaKelas = document.getElementById('namaKelasInput').value.trim();
  const fileNameText = document.getElementById('fileNameText');

  if (!namaKelas) {
    alert("Harap masukkan Nama Kelas Baru terlebih dahulu!");
    document.getElementById('excelFileInput').value = '';
    return;
  }

  if (fileNameText) {
    fileNameText.innerText = `Membaca ${file.name}...`;
    fileNameText.className = "truncate text-polnes-main font-bold";
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        alert("File Excel kosong!");
        resetFileInputUI();
        return;
      }

      // Parsing Kolom Fleksibel (Mendukung NIM, Nim, NAMA, Nama, Nama Mahasiswa, dll.)
      const parsedMhs = jsonData.map(row => {
        const keys = Object.keys(row);
        const nimKey = keys.find(k => k.trim().toUpperCase() === 'NIM');
        const namaKey = keys.find(k => ['NAMA', 'NAMA MAHASISWA', 'NAMA_MAHASISWA', 'NAME'].includes(k.trim().toUpperCase()));

        return {
          nim: nimKey ? String(row[nimKey]).trim() : '',
          nama: namaKey ? String(row[namaKey]).trim() : ''
        };
      }).filter(m => m.nim !== '' && m.nama !== '');

      if (parsedMhs.length === 0) {
        alert("Format kolom Excel tidak sesuai! Pastikan terdapat header kolom 'NIM' dan 'NAMA' (atau 'NAMA MAHASISWA').");
        resetFileInputUI();
        return;
      }

      // UAT-2.3: Validasi Nama Kelas di Supabase
      const { data: existingClass } = await supabaseClient
        .from('jadwal_log')
        .select('nama_kelas')
        .eq('nama_kelas', namaKelas);

      if (existingClass && existingClass.length > 0) {
        alert(`[PENOLAKAN] Kelas "${namaKelas}" sudah pernah dikunci di database!`);
        resetFileInputUI();
        return;
      }

      // UAT-2.4: Fetch NIM yang sudah ada di DB
      const { data: dbAntrean } = await supabaseClient.from('antrean_mahasiswa').select('nim');
      const { data: dbPeserta } = await supabaseClient.from('peserta_ujian').select('nim');

      const existingNIMSet = new Set([
        ...(dbAntrean ? dbAntrean.map(a => a.nim) : []),
        ...(dbPeserta ? dbPeserta.map(p => p.nim) : [])
      ]);

      const payloadBatch = [];
      for (let mhs of parsedMhs) {
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
          alert("Gagal mengunggah ke Supabase: " + error.message);
          resetFileInputUI();
          return;
        }
        alert(`Berhasil mengunggah ${payloadBatch.length} mahasiswa kelas "${namaKelas}" ke antrean!`);
      } else {
        alert("Semua mahasiswa dalam file Excel ini sudah pernah terdaftar!");
      }

      // Reset Form Input & Refresh Tabel
      resetFileInputUI();
      document.getElementById('namaKelasInput').value = '';
      await renderTabelAntreanDariSupabase();

    } catch (err) {
      alert("Error membaca file Excel: " + err.message);
      resetFileInputUI();
    }
  };
  reader.readAsArrayBuffer(file);
}

function resetFileInputUI() {
  const fileNameText = document.getElementById('fileNameText');
  const excelFileInput = document.getElementById('excelFileInput');
  if (excelFileInput) excelFileInput.value = '';
  if (fileNameText) {
    fileNameText.innerText = "Klik untuk Pilih File Excel...";
    fileNameText.className = "truncate text-slate-400";
  }
}

// 4. RENDER TABEL ANTREAN DARI SUPABASE (AUTO CHECK ALL)
async function renderTabelAntreanDariSupabase() {
  const tbody = document.getElementById('tabelAntreanMhsBody');
  const statusText = document.getElementById('antreanStatusText');
  const masterCheckbox = document.getElementById('selectAllCheckbox');
  if (!tbody) return;

  const { data: antreanData, error } = await supabaseClient
    .from('antrean_mahasiswa')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !antreanData || antreanData.length === 0) {
    if (statusText) statusText.innerText = `0 Kelas Menunggu Plotting dalam antrean.`;
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 text-xs italic">Semua kelas sudah dijadwalkan atau belum ada antrean di database.</td></tr>`;
    if (masterCheckbox) masterCheckbox.checked = true;
    return;
  }

  const uniqueClasses = [...new Set(antreanData.map(m => m.nama_kelas))];
  if (statusText) statusText.innerText = `${uniqueClasses.length} Kelas Menunggu Plotting dalam antrean (${antreanData.length} Mahasiswa).`;

  if (masterCheckbox) masterCheckbox.checked = true;

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

// 5. KUNCI SESI UJIAN (TRANSFER DARI ANTREAN KE LOG SUPABASE)
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

  // VALIDASI BENTROK
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

  // VALIDASI ATURAN LAB CADANGAN (< 30)
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

  // Insert Header Log
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

  // Insert Detail Peserta
  const pesertaPayload = mhsToSchedule.map((mhs, idx) => ({
    jadwal_id: jadwalId,
    nim: mhs.nim,
    nama: mhs.nama,
    nama_kelas: mhs.nama_kelas,
    id_meja: `STUDENT${String(idx + 1).padStart(2, '0')}`
  }));

  await supabaseClient.from('peserta_ujian').insert(pesertaPayload);

  // Hapus dari antrean
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
        <button onclick="cetakBeritaAcaraPDF('${item.id}', '${item.jenis_tes}', '${item.nama_kelas}', '${item.tanggal}', '${item.sesi}', '${item.ruang_lab}')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold transition-all flex items-center gap-1 shadow-sm">
          <i class="ri-file-pdf-line"></i> Cetak / PDF
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
  doc.text(`JADWAL & BERITA ACARA UJIAN ${jenisTes}`, 14, 38);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama Kelas / Prodi : ${namaKelas}`, 14, 44);
  doc.text(`Tanggal Ujian      : ${tanggal}`, 14, 49);
  doc.text(`Sesi & Waktu       : ${sesi}`, 120, 44);
  doc.text(`Ruang Lab          : ${ruangLab}`, 120, 49);

  const tableRows = (peserta || []).map((p, index) => [
    index + 1,
    p.nim,
    p.nama,
    p.nama_kelas,
    p.id_meja,
    "........................"
  ]);

  doc.autoTable({
    startY: 54,
    head: [['No', 'NIM', 'Nama Mahasiswa', 'Kelas / Prodi', 'ID Meja', 'Tanda Tangan']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 195, 93] }
  });

  doc.save(`Jadwal_${jenisTes}_${namaKelas}_${tanggal}.pdf`);
}