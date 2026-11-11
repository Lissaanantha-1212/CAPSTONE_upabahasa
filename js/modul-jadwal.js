/**
 * MODUL PENJADWALAN - UPA BAHASA POLNES
 * Deep-Scan Excel Parser + Supabase Sync + PDF Preview Modal (1 Halaman Padat & Rapi)
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTabelAntreanDariSupabase();
  loadHistoriJadwalDariSupabase();
});

function handleSelectFileClick() {
  const namaKelas = document.getElementById('namaKelasInput').value.trim();
  if (!namaKelas) {
    alert("Harap ketik 'Nama Kelas Baru' terlebih dahulu!");
    return;
  }
  document.getElementById('excelFileInput').click();
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) bacaDanUploadExcelOtomatis(file);
    });
  }
});

async function bacaDanUploadExcelOtomatis(file) {
  try {
    const namaKelas = document.getElementById('namaKelasInput').value.trim();
    const fileNameText = document.getElementById('fileNameText');

    if (!namaKelas) {
      alert("Harap masukkan Nama Kelas Baru terlebih dahulu!");
      resetFileInputUI();
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
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (!rows || rows.length === 0) {
          throw new Error("File Excel kosong.");
        }

        let nimColIndex = -1;
        let namaColIndex = -1;
        let startRowIndex = 0;

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          for (let c = 0; c < row.length; c++) {
            const val = String(row[c]).trim().toLowerCase();
            if (val === 'nim' || val === 'no mhs' || val === 'nomor induk') {
              nimColIndex = c;
              startRowIndex = r + 1;
            }
            if (val === 'nama' || val === 'nama mahasiswa' || val === 'name') {
              namaColIndex = c;
            }
          }
          if (nimColIndex !== -1 && namaColIndex !== -1) break;
        }

        let parsedMhs = [];

        if (nimColIndex !== -1 && namaColIndex !== -1) {
          for (let r = startRowIndex; r < rows.length; r++) {
            const row = rows[r];
            if (!row) continue;
            let nimVal = String(row[nimColIndex] || '').trim();
            let namaVal = String(row[namaColIndex] || '').trim();

            if (nimVal && namaVal && nimVal.toLowerCase() !== 'nim' && nimVal.toLowerCase() !== 'no') {
              parsedMhs.push({ nim: nimVal, nama: namaVal, nama_kelas: namaKelas });
            }
          }
        }

        if (parsedMhs.length === 0) {
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            if (!row) continue;
            
            let foundNim = '';
            let foundNama = '';

            for (let c = 0; c < row.length; c++) {
              const cellStr = String(row[c]).trim();
              if (/^\d{8,15}$/.test(cellStr)) {
                foundNim = cellStr;
              } else if (cellStr.length > 3 && isNaN(cellStr) && cellStr.toLowerCase() !== 'nama' && cellStr.toLowerCase() !== 'nim') {
                if (!foundNama) foundNama = cellStr;
              }
            }

            if (foundNim && foundNama) {
              parsedMhs.push({ nim: foundNim, nama: foundNama, nama_kelas: namaKelas });
            }
          }
        }

        if (parsedMhs.length === 0) {
          throw new Error("Sistem gagal mendeteksi data mahasiswa di dalam file Excel.");
        }

        const { data: existingClass, error: errCek } = await window.supabaseClient
          .from('jadwal_log')
          .select('nama_kelas')
          .eq('nama_kelas', namaKelas);

        if (errCek) throw errCek;

        if (existingClass && existingClass.length > 0) {
          alert(`[DITOLAK] Kelas "${namaKelas}" sudah pernah dikunci di database!`);
          resetFileInputUI();
          return;
        }

        const { data: dbAntrean } = await window.supabaseClient.from('antrean_mahasiswa').select('nim');
        const { data: dbPeserta } = await window.supabaseClient.from('peserta_ujian').select('nim');

        const existingNIMSet = new Set([
          ...(dbAntrean ? dbAntrean.map(a => a.nim) : []),
          ...(dbPeserta ? dbPeserta.map(p => p.nim) : [])
        ]);

        const payloadBatch = [];
        parsedMhs.forEach(mhs => {
          if (!existingNIMSet.has(mhs.nim)) {
            payloadBatch.push(mhs);
            existingNIMSet.add(mhs.nim);
          }
        });

        if (payloadBatch.length > 0) {
          const { error: insertErr } = await window.supabaseClient.from('antrean_mahasiswa').insert(payloadBatch);
          if (insertErr) throw insertErr;

          alert(`Sukses! ${payloadBatch.length} mahasiswa dari kelas "${namaKelas}" berhasil dimuat ke antrean.`);
        } else {
          alert("Semua mahasiswa di file ini sudah terdaftar di antrean atau database.");
        }

        resetFileInputUI();
        document.getElementById('namaKelasInput').value = '';
        await renderTabelAntreanDariSupabase();

      } catch (err) {
        alert("Gagal parsing Excel: " + err.message);
        resetFileInputUI();
      }
    };

    reader.readAsArrayBuffer(file);
  } catch (errGlobal) {
    alert("Error sistem: " + errGlobal.message);
    resetFileInputUI();
  }
}

function resetFileInputUI() {
  const fileInput = document.getElementById('excelFileInput');
  const fileNameText = document.getElementById('fileNameText');
  if (fileInput) fileInput.value = '';
  if (fileNameText) {
    fileNameText.innerText = "Klik untuk Pilih File Excel...";
    fileNameText.className = "truncate text-slate-400";
  }
}

async function renderTabelAntreanDariSupabase() {
  const tbody = document.getElementById('tabelAntreanMhsBody');
  const statusText = document.getElementById('antreanStatusText');
  const masterCheckbox = document.getElementById('selectAllCheckbox');
  if (!tbody) return;

  const { data: antreanData, error } = await window.supabaseClient
    .from('antrean_mahasiswa')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !antreanData || antreanData.length === 0) {
    if (statusText) statusText.innerText = `0 Kelas Menunggu Plotting dalam antrean.`;
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 text-xs italic">Belum ada kelas di dalam antrean jadwal.</td></tr>`;
    if (masterCheckbox) masterCheckbox.checked = false;
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
    alert("Centang minimal 1 mahasiswa di tabel untuk dijadwalkan!");
    return;
  }

  const mhsToSchedule = checkedBoxes.map(cb => ({
    nim: cb.value,
    nama: cb.getAttribute('data-nama'),
    nama_kelas: cb.getAttribute('data-kelas')
  }));

  const jumlahMhsPlot = mhsToSchedule.length;

  if (jumlahMhsPlot > 30) {
    alert(`[PENOLAKAN] Jumlah mahasiswa (${jumlahMhsPlot}) melebihi batas kapasitas lab (Maksimal 30)!`);
    return;
  }

  try {
    const { data: jadwalBentrok } = await window.supabaseClient
      .from('jadwal_log')
      .select('id')
      .eq('tanggal', tanggal)
      .eq('sesi', sesi)
      .eq('ruang_lab', lab);

    if (jadwalBentrok && jadwalBentrok.length > 0) {
      alert(`[BENTROK] Sesi "${sesi}" di ${lab} pada tanggal ${tanggal} sudah digunakan!`);
      return;
    }

    const labPasangan = (lab === 'Lab A') ? 'Lab B' : 'Lab A';
    const { data: jadwalPasangan } = await window.supabaseClient
      .from('jadwal_log')
      .select('jumlah_mhs')
      .eq('tanggal', tanggal)
      .eq('sesi', sesi)
      .eq('ruang_lab', labPasangan);

    if (jadwalPasangan && jadwalPasangan.length > 0) {
      if (jadwalPasangan[0].jumlah_mhs >= 30 && jumlahMhsPlot >= 30) {
        alert(`[DITOLAK] ${labPasangan} pada sesi ini sudah terisi 30 mahasiswa. ${lab} WAJIB diisi di bawah 30 mahasiswa agar ada unit komputer cadangan!`);
        return;
      }
    }

    const namaKelasSesi = [...new Set(mhsToSchedule.map(m => m.nama_kelas))].join(', ');

    const { data: logData, error: logErr } = await window.supabaseClient
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

    if (logErr) throw logErr;
    const jadwalId = logData[0].id;

    const pesertaPayload = mhsToSchedule.map((mhs, idx) => ({
      jadwal_id: jadwalId,
      nim: mhs.nim,
      nama: mhs.nama,
      nama_kelas: mhs.nama_kelas,
      id_meja: `STUDENT${String(idx + 1).padStart(2, '0')}`
    }));

    const { error: pesertaErr } = await window.supabaseClient.from('peserta_ujian').insert(pesertaPayload);
    if (pesertaErr) throw pesertaErr;

    const selectedNIMs = mhsToSchedule.map(m => m.nim);
    await window.supabaseClient.from('antrean_mahasiswa').delete().in('nim', selectedNIMs);

    renderTabelAntreanDariSupabase();
    loadHistoriJadwalDariSupabase();
    alert(`Sesi ${jenisTes} di ${lab} (${jumlahMhsPlot} Mahasiswa) Berhasil Dikunci ke Database!`);

  } catch (err) {
    alert("Gagal mengunci sesi: " + err.message);
  }
}

async function loadHistoriJadwalDariSupabase() {
  const tbody = document.getElementById('tabelHistoriJadwalBody');
  if (!tbody) return;

  const { data: logs, error } = await window.supabaseClient
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
        <button onclick="bukaPreviewPDF('${item.id}', '${item.jenis_tes}', '${item.nama_kelas}', '${item.tanggal}', '${item.sesi}', '${item.ruang_lab}')" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold transition-all flex items-center gap-1 shadow-sm">
          <i class="ri-file-pdf-line"></i> Cetak / PDF
        </button>
      </td>
    </tr>
  `).join('');
}

// FUNGSI MEMBUAT PDF (Padat, Jarak Rapat, Pasti 1 Halaman)
async function generatePDFDoc(jenisTes, namaKelas, tanggal, sesi, ruangLab, peserta) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // KOP SURAT (Jarak Atas Lebih Padat)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI", 105, 8, null, null, "center");
  doc.text("POLITEKNIK NEGERI SAMARINDA", 105, 12.5, null, null, "center");
  
  doc.setFontSize(10.5);
  doc.text("UPT. BAHASA", 105, 17.5, null, null, "center");
  
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Jalan Dr. Ciptomangunkusumo Kampus Gunung Panjang Samarinda", 105, 21.5, null, null, "center");
  doc.text("Telepon : PABX(0541)260588 - 260553 - 262018 FAX (0541) 260355", 105, 25, null, null, "center");
  doc.text("Website: www.polnes.ac.id Email : polnes@polnes.ac.id", 105, 28.5, null, null, "center");
  
  // Garis Bawah Kop Ganda
  doc.setLineWidth(0.6);
  doc.line(14, 31, 196, 31);
  doc.setLineWidth(0.15);
  doc.line(14, 32, 196, 32);

  // JUDUL DOKUMEN (RATA TENGAH)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`JADWAL & BERITA ACARA UJIAN ${jenisTes}`, 105, 37.5, null, null, "center");

  // INFORMASI DETAIL (2 Kolom Lebih Rapat)
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama Kelas / Prodi : ${namaKelas}`, 14, 43);
  doc.text(`Tanggal Ujian      : ${tanggal}`, 14, 47.5);
  
  doc.text(`Sesi & Waktu       : ${sesi}`, 115, 43);
  doc.text(`Ruang Lab          : ${ruangLab}`, 115, 47.5);

  // DATA TABEL PESERTA
  const tableRows = (peserta || []).map((p, index) => [
    index + 1,
    p.nim,
    p.nama,
    p.nama_kelas,
    p.id_meja,
    "........................"
  ]);

  // AUTO TABLE (Diatur sangat kompak agar pas 1 halaman mutlak)
  doc.autoTable({
    startY: 51,
    head: [['No', 'NIM', 'Nama Mahasiswa', 'Kelas / Prodi', 'ID Meja', 'Tanda Tangan']],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [16, 195, 93], 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
      cellPadding: 1.5
    },
    styles: { 
      fontSize: 7.5,          // Font sangat ringkas agar muat 30 baris dalam 1 halaman
      cellPadding: 1.2,       // Padding tipis agar tidak makan tempat
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 32 },
      2: { cellWidth: 65 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 22 }
    },
    pageBreak: 'avoid'
  });

  return doc;
}

// BUKA MODAL PREVIEW PDF
async function bukaPreviewPDF(jadwalId, jenisTes, namaKelas, tanggal, sesi, ruangLab) {
  const { data: peserta } = await window.supabaseClient
    .from('peserta_ujian')
    .select('*')
    .eq('jadwal_id', jadwalId);

  const doc = await generatePDFDoc(jenisTes, namaKelas, tanggal, sesi, ruangLab, peserta);
  const pdfBlobUrl = doc.output('bloburl');

  const iframe = document.getElementById('pdfPreviewIframe');
  const modal = document.getElementById('pdfPreviewModal');
  if (iframe && modal) {
    iframe.src = pdfBlobUrl;
    modal.classList.remove('hidden');

    document.getElementById('btnActionDownload').onclick = () => {
      doc.save(`Jadwal_${jenisTes}_${namaKelas}_${tanggal}.pdf`);
    };

    document.getElementById('btnActionPrint').onclick = () => {
      iframe.contentWindow.print();
    };
  }
}

function tutupPreviewPDF() {
  const modal = document.getElementById('pdfPreviewModal');
  const iframe = document.getElementById('pdfPreviewIframe');
  if (modal) modal.classList.add('hidden');
  if (iframe) iframe.src = '';
}