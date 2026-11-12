/**
 * MODUL PENJADWALAN - UPA BAHASA POLNES (FULL VERSION UTUH + PRODI)
 * Menangani Upload Excel, Antrean, Filter Kelas, Validasi Kapasitas Lab (Maks 30),
 * Validasi Pasangan Lab A & Lab B (Tidak Boleh Sama-Sama 30), Kunci Sesi, Histori, & PDF Paten.
 */

let uploadedMahasiswaList = [];
let selectedKelasFilter = '';

document.addEventListener('DOMContentLoaded', async () => {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('inputTanggalUjian');
  if (dateInput) dateInput.value = today;

  initDynamicSesiListener();
  bersihkanTombolSemuaKelasStatik();

  await loadAntreanDariSupabase();
  await loadHistoriJadwalDariSupabase();

  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleExcelUpload);
  }
});

function bersihkanTombolSemuaKelasStatik() {
  const buttons = document.querySelectorAll('button, span, div');
  buttons.forEach(el => {
    if (el.innerText && el.innerText.includes('Semua Kelas')) {
      el.remove();
    }
  });
}

function initDynamicSesiListener() {
  const selectJenisTes = document.getElementById('selectJenisTes');
  const selectSesi = document.getElementById('selectSesi');

  if (selectJenisTes && selectSesi) {
    selectJenisTes.addEventListener('change', (e) => {
      const jenis = e.target.value;
      selectSesi.innerHTML = '';

      if (jenis === 'TOEFL') {
        selectSesi.innerHTML = `
          <option value="SESI 1 (08.00 - 10.00 WITA)">SESI 1 (08.00 - 10.00 WITA)</option>
          <option value="SESI 2 (10.00 - 12.00 WITA)">SESI 2 (10.00 - 12.00 WITA)</option>
          <option value="SESI 3 (14.00 - 16.00 WITA)">SESI 3 (14.00 - 16.00 WITA)</option>
        `;
      } else if (jenis === 'SSPECT') {
        selectSesi.innerHTML = `
          <option value="SESI 1 (08.00 - 10.30 WITA)">SESI 1 (08.00 - 10.30 WITA)</option>
          <option value="SESI 2 (10.30 - 13.00 WITA)">SESI 2 (10.30 - 13.00 WITA)</option>
          <option value="SESI 3 (14.00 - 16.30 WITA)">SESI 3 (14.00 - 16.30 WITA)</option>
        `;
      }
    });
  }
}

function handleSelectFileClick() {
  const fileInput = document.getElementById('excelFileInput');
  if (fileInput) fileInput.click();
}

async function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const namaKelasInput = document.getElementById('namaKelasInput').value.trim();
  const selectProdi = document.getElementById('selectProdi');
  const prodiInput = selectProdi ? selectProdi.value : '';

  if (!namaKelasInput) {
    alert("Harap isi 'Nama Kelas Baru' terlebih dahulu sebelum memilih file Excel!");
    e.target.value = '';
    return;
  }
  
  if (!prodiInput) {
    alert("Harap pilih 'Program Studi' terlebih dahulu sebelum memilih file Excel!");
    e.target.value = '';
    return;
  }

  const fileNameText = document.getElementById('fileNameText');
  if (fileNameText) {
    fileNameText.innerText = file.name;
    fileNameText.classList.add('text-polnes-main', 'font-bold');
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      let parsedMhs = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const nim = String(row[1] || row[0] || '').trim();
        const nama = String(row[2] || row[1] || '').trim();

        if (nim && nama && nim.toLowerCase() !== 'nim' && nama.toLowerCase() !== 'nama') {
          parsedMhs.push({
            nim: nim,
            nama: nama.toUpperCase(),
            nama_kelas: namaKelasInput.toUpperCase(),
            program_studi: prodiInput
          });
        }
      }

      if (parsedMhs.length === 0) {
        alert("Tidak ada data mahasiswa yang valid ditemukan di file Excel ini.");
        return;
      }

      const payload = parsedMhs.map(m => ({
        nim: m.nim,
        nama: m.nama,
        nama_kelas: m.nama_kelas,
        program_studi: m.program_studi
      }));

      const { error } = await window.supabaseClient
        .from('antrean_mahasiswa')
        .insert(payload);

      if (error) throw error;

      alert(`Berhasil! ${parsedMhs.length} mahasiswa dari kelas "${namaKelasInput}" ditambahkan ke antrean.`);
      document.getElementById('namaKelasInput').value = '';
      if(selectProdi) selectProdi.value = '';
      e.target.value = '';
      if (fileNameText) {
        fileNameText.innerText = 'Klik untuk Pilih File Excel...';
        fileNameText.classList.remove('text-polnes-main', 'font-bold');
      }

      await loadAntreanDariSupabase();

    } catch (err) {
      alert("Gagal membaca atau mengunggah file Excel: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

async function loadAntreanDariSupabase() {
  try {
    const { data, error } = await window.supabaseClient
      .from('antrean_mahasiswa')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    uploadedMahasiswaList = data || [];

    const kelasSet = [...new Set(uploadedMahasiswaList.map(m => m.nama_kelas))];
    if (!kelasSet.includes(selectedKelasFilter) && kelasSet.length > 0) {
      selectedKelasFilter = kelasSet[0];
    }

    renderFilterKelasButtons();
    renderTabelAntrean();
    bersihkanTombolSemuaKelasStatik();

  } catch (err) {
    console.error("Gagal memuat antrean:", err);
  }
}

function renderFilterKelasButtons() {
  const container = document.getElementById('filterKelasContainer');
  if (!container) return;

  const kelasSet = [...new Set(uploadedMahasiswaList.map(m => m.nama_kelas))];

  if (kelasSet.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  kelasSet.forEach(k => {
    const count = uploadedMahasiswaList.filter(m => m.nama_kelas === k).length;
    const isActive = selectedKelasFilter === k;
    html += `<button onclick="filterKelas('${k}')" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-polnes-main text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">${k} (${count})</button>`;
  });

  container.innerHTML = html;
}

function filterKelas(namaKelas) {
  selectedKelasFilter = namaKelas;
  renderFilterKelasButtons();
  renderTabelAntrean();
}

function renderTabelAntrean() {
  const tbody = document.getElementById('tabelAntreanMhsBody');
  const statusText = document.getElementById('antreanStatusText');
  if (!tbody) return;

  const kelasSet = [...new Set(uploadedMahasiswaList.map(m => m.nama_kelas))];
  if (!kelasSet.includes(selectedKelasFilter) && kelasSet.length > 0) {
    selectedKelasFilter = kelasSet[0];
  }

  let filteredList = uploadedMahasiswaList.filter(m => m.nama_kelas === selectedKelasFilter);

  if (statusText) {
    statusText.innerText = `Menampilkan antrean untuk kelas: ${selectedKelasFilter} (${filteredList.length} orang).`;
  }

  if (filteredList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400 text-xs italic">Belum ada data mahasiswa dalam antrean. Silakan upload file Excel di atas.</td></tr>`;
    return;
  }

  let tableHtml = '';
  filteredList.forEach((mhs, idx) => {
    const autoMeja = `STUDENT${String(idx + 1).padStart(2, '0')}`;

    tableHtml += `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3 text-center">
          <input type="checkbox" value="${mhs.id}" class="mhs-checkbox rounded text-polnes-main cursor-pointer" checked>
        </td>
        <td class="px-4 py-3 text-xs font-semibold">${idx + 1}</td>
        <td class="px-4 py-3 text-xs font-bold text-slate-800">${mhs.nim}</td>
        <td class="px-4 py-3 text-xs font-medium">${mhs.nama}</td>
        <td class="px-4 py-3 text-xs font-semibold text-slate-600">${mhs.nama_kelas}</td>
        <td class="px-4 py-3 text-[11px] font-bold text-sky-700 uppercase">${mhs.program_studi || '-'}</td>
        <td class="px-4 py-3 text-xs font-mono font-bold text-emerald-600">${autoMeja}</td>
      </tr>
    `;
  });
  
  tbody.innerHTML = tableHtml;
}

function toggleSelectAllMhs(masterCheckbox) {
  const checkboxes = document.querySelectorAll('.mhs-checkbox');
  checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
}

// --- KUNCI SESI DENGAN ATURAN KAPASITAS & PASANGAN LAB (LAB A & LAB B) ---
async function kunciSesiUjianKeSupabase() {
  const checkboxes = document.querySelectorAll('.mhs-checkbox:checked');
  if (checkboxes.length === 0) {
    alert("Pilih minimal 1 mahasiswa yang akan dimasukkan ke sesi ujian!");
    return;
  }

  const jenisTes = document.getElementById('selectJenisTes').value;
  const tanggal = document.getElementById('inputTanggalUjian').value;
  const sesi = document.getElementById('selectSesi').value;
  const ruangLabDipilih = document.getElementById('selectLab').value;

  if (!tanggal) {
    alert("Harap tentukan tanggal ujian terlebih dahulu!");
    return;
  }

  const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
  const mahasiswaTerpilih = uploadedMahasiswaList.filter(m => selectedIds.includes(m.id));
  const jumlahDipilih = mahasiswaTerpilih.length;

  if (jumlahDipilih > 30) {
    alert(`[DITOLAK] Kapasitas ${ruangLabDipilih} maksimal adalah 30 mahasiswa! Anda memilih ${jumlahDipilih} mahasiswa.`);
    return;
  }

  try {
    const { data: sesiAktifList, error: checkErr } = await window.supabaseClient
      .from('jadwal_log')
      .select('*')
      .eq('tanggal', tanggal)
      .eq('sesi', sesi);

    if (checkErr) throw checkErr;

    const labSudahDipakai = sesiAktifList.find(s => s.ruang_lab === ruangLabDipilih);
    if (labSudahDipakai) {
      alert(`[DITOLAK] ${ruangLabDipilih} pada tanggal ${tanggal} (${sesi}) sudah digunakan oleh kelas "${labSudahDipakai.nama_kelas}"!`);
      return;
    }

    const labLain = sesiAktifList.find(s => s.ruang_lab !== ruangLabDipilih);
    if (labLain) {
      if (labLain.jumlah_mhs === 30 && jumlahDipilih === 30) {
        alert(`[DITOLAK] Aturan UPA Bahasa: Lab pasangan (${labLain.ruang_lab}) sudah berisi 30 mahasiswa penuh. Lab ${ruangLabDipilih} tidak boleh sama-sama 30 orang penuh di sesi yang sama! Silakan kurangi jumlah mahasiswa di bawah 30.`);
        return;
      }
    }

    const kelasUnik = [...new Set(mahasiswaTerpilih.map(m => m.nama_kelas))].join(', ');

    if (!confirm(`Yakin ingin mengunci ${jumlahDipilih} mahasiswa ke sesi ${sesi} (${ruangLabDipilih}) untuk kelas ${kelasUnik}?`)) {
      return;
    }

    const { data: jadwalData, error: jadwalErr } = await window.supabaseClient
      .from('jadwal_log')
      .insert([{
        jenis_tes: jenisTes,
        tanggal: tanggal,
        sesi: sesi,
        ruang_lab: ruangLabDipilih,
        nama_kelas: kelasUnik,
        jumlah_mhs: jumlahDipilih,
        status: 'TERKUNCI'
      }])
      .select();

    if (jadwalErr) throw jadwalErr;
    const jadwalId = jadwalData[0].id;

    const pesertaPayload = mahasiswaTerpilih.map((m, idx) => ({
      jadwal_id: jadwalId,
      nim: m.nim,
      nama: m.nama,
      nama_kelas: m.nama_kelas,
      program_studi: m.program_studi,
      id_meja: `STUDENT${String(idx + 1).padStart(2, '0')}`
    }));

    const { error: pesertaErr } = await window.supabaseClient
      .from('peserta_ujian')
      .insert(pesertaPayload);

    if (pesertaErr) throw pesertaErr;

    const { error: deleteErr } = await window.supabaseClient
      .from('antrean_mahasiswa')
      .delete()
      .in('id', selectedIds);

    if (deleteErr) throw deleteErr;

    alert("Sesi ujian berhasil dikunci dan disimpan ke database!");
    
    await loadAntreanDariSupabase();
    await loadHistoriJadwalDariSupabase();

  } catch (err) {
    alert("Gagal mengunci sesi ujian: " + err.message);
  }
}

async function hapusAntreanSupabase() {
  if (!confirm("Yakin ingin menghapus seluruh data yang ada di antrean saat ini?")) return;

  try {
    const { error } = await window.supabaseClient
      .from('antrean_mahasiswa')
      .delete()
      .neq('id', 0);

    if (error) throw error;

    alert("Antrean berhasil dibersihkan.");
    await loadAntreanDariSupabase();
  } catch (err) {
    alert("Gagal menghapus antrean: " + err.message);
  }
}

async function loadHistoriJadwalDariSupabase() {
  const tbody = document.getElementById('tabelHistoriJadwalBody');
  if (!tbody) return;

  try {
    const { data, error } = await window.supabaseClient
      .from('jadwal_log')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="px-4 py-6 text-center text-slate-400 text-xs italic">Belum ada riwayat sesi jadwal yang dikunci.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((item, idx) => `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="px-4 py-3 text-xs font-semibold border-r border-slate-100">${idx + 1}</td>
        <td class="px-4 py-3 text-xs font-bold text-polnes-dark border-r border-slate-100">${item.jenis_tes}</td>
        <td class="px-4 py-3 text-xs font-semibold text-slate-700 border-r border-slate-100">${item.nama_kelas}</td>
        <td class="px-4 py-3 text-xs text-slate-600 border-r border-slate-100">${item.tanggal}</td>
        <td class="px-4 py-3 text-xs font-medium text-sky-700 border-r border-slate-100">${item.sesi}</td>
        <td class="px-4 py-3 text-xs font-bold text-emerald-600 border-r border-slate-100">${item.ruang_lab}</td>
        <td class="px-4 py-3 text-xs text-center font-bold border-r border-slate-100">${item.jumlah_mhs}</td>
        <td class="px-4 py-3 text-xs border-r border-slate-100 text-center">
          <span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">${item.status}</span>
        </td>
        <td class="px-4 py-3 text-xs">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="bukaPreviewPDF(${item.id})" class="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1">
              <i class="ri-file-pdf-line"></i> PDF
            </button>
            <button onclick="hapusHistoriJadwal(${item.id})" class="px-2 py-1.5 bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-600 rounded-lg text-[10px] transition-all">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error("Gagal memuat histori jadwal:", err);
  }
}

async function hapusHistoriJadwal(id) {
  if (!confirm("Hapus histori sesi ini? Peserta di dalam sesi ini juga akan dihapus.")) return;

  try {
    await window.supabaseClient.from('peserta_ujian').delete().eq('jadwal_id', id);
    const { error } = await window.supabaseClient.from('jadwal_log').delete().eq('id', id);

    if (error) throw error;

    await loadHistoriJadwalDariSupabase();
    alert("Histori berhasil dihapus.");
  } catch (err) {
    alert("Gagal menghapus: " + err.message);
  }
}

// --- GENERATE BERITA ACARA PDF (FORMAT PATEN: 1 HALAMAN, ADA LOGO, TABEL PRODI & AMAN AUTO-TABLE) ---
async function bukaPreviewPDF(jadwalId) {
  try {
    const { data: jadwalData } = await window.supabaseClient
      .from('jadwal_log')
      .select('*')
      .eq('id', jadwalId)
      .single();

    const { data: pesertaData } = await window.supabaseClient
      .from('peserta_ujian')
      .select('*')
      .eq('jadwal_id', jadwalId)
      .order('id_meja', { ascending: true });

    if (!jadwalData || !pesertaData) {
      alert("Data sesi tidak ditemukan.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    try {
      doc.addImage('./img/polnes.png', 'PNG', 15, 10, 18, 18);
    } catch(err) {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI", 105, 12, { align: "center" });
    doc.setFontSize(12);
    doc.text("POLITEKNIK NEGERI SAMARINDA", 105, 17, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("UNIT PENGELOLA AKADEMIK (UPA) BAHASA", 105, 22, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Jl. Cipto Mangunkusumo Kampus Gunung Lipan Samarinda 75131", 105, 26, { align: "center" });
    
    doc.setLineWidth(0.4);
    doc.line(15, 29, 195, 29);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BERITA ACARA & DAFTAR HADIR PELAKSANAAN UJIAN", 105, 35, { align: "center" });
    doc.setFontSize(9);
    doc.text(`JENIS TES: ${jadwalData.jenis_tes.toUpperCase()}`, 105, 40, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let startY = 46;
    doc.text(`Hari / Tanggal : ${jadwalData.tanggal}`, 20, startY);
    doc.text(`Ruang Lab      : ${jadwalData.ruang_lab}`, 120, startY);
    
    doc.text(`Waktu Sesi     : ${jadwalData.sesi}`, 20, startY + 5);
    doc.text(`Kelas Peserta  : ${jadwalData.nama_kelas}`, 120, startY + 5);

    const tableRows = pesertaData.map((p, index) => [
      index + 1,
      p.nim,
      p.nama,
      p.program_studi || '-',
      p.id_meja,
      ""
    ]);

    // Pengecekan aman untuk fungsi autoTable di berbagai versi CDN jspdf
    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: startY + 10,
        head: [["NO", "NIM", "NAMA MAHASISWA", "PRODI", "ID MEJA", "TANDA TANGAN"]],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 195, 93], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 55 },
          3: { cellWidth: 35, fontSize: 7 },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 35 }
        },
        styles: { fontSize: 8, cellPadding: 1.5 }
      });
    } else {
      throw new Error("Plugin jspdf-autotable belum terinisialisasi dengan benar di halaman HTML.");
    }

    let finalY = doc.lastAutoTable.finalY + 8;
    
    doc.setFontSize(9);
    doc.text("Samarinda, " + new Date().toLocaleDateString('id-ID'), 140, finalY);
    doc.text("Pengawas Ujian,", 140, finalY + 4);
    
    doc.setFont("helvetica", "bold");
    doc.text("(_________________________)", 130, finalY + 22);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const iframe = document.getElementById('pdfPreviewIframe');
    const modal = document.getElementById('pdfPreviewModal');

    if (iframe && modal) {
      iframe.src = pdfUrl;
      modal.classList.remove('hidden');

      document.getElementById('btnActionDownload').onclick = () => {
        doc.save(`Berita_Acara_${jadwalData.jenis_tes}_${jadwalData.tanggal}.pdf`);
      };
      document.getElementById('btnActionPrint').onclick = () => {
        iframe.contentWindow.print();
      };
    }

  } catch (err) {
    alert("Gagal membuat dokumen PDF: " + err.message);
  }
}

function tutupPreviewPDF() {
  const modal = document.getElementById('pdfPreviewModal');
  if (modal) modal.classList.add('hidden');
}