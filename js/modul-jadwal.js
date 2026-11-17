/**
 * MODUL PENJADWALAN - UPA BAHASA POLNES (FULL VERSION UTUH + VALIDASI KETAT LAB, SESI, & STATUS REKAPAN KELAS)
 * Menangani Upload Excel, Validasi Kelas Belum Masuk Rekapan, Antrean, Filter Kelas,
 * Validasi Kapasitas Lab (Maks 30), Validasi Ketat Lab & Sesi Terpakai, Kunci Sesi, Histori, & PDF Paten 1 Halaman.
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

/**
 * Helper: Mengecek apakah kelas / daftar NIM yang sudah pernah dijadwalkan
 * sudah menyelesaikan tahap pencocokan dan masuk ke Rekapan.
 */
async function validasiKelayakanUploadKelas(namaKelasUpper, daftarNim) {
  // 1. Cek apakah kelas masih berada di antrean_mahasiswa (belum dikunci)
  const { data: antreanKelas, error: errAntrean } = await window.supabaseClient
    .from('antrean_mahasiswa')
    .select('id, nama_kelas, nim')
    .ilike('nama_kelas', namaKelasUpper);

  if (!errAntrean && antreanKelas && antreanKelas.length > 0) {
    return {
      boleh: false,
      pesan: `[DITOLAK] Kelas "${namaKelasUpper}" masih berada di dalam daftar antrean (${antreanKelas.length} mahasiswa) dan belum dikunci/diproses!`
    };
  }

  // 2. Cek apakah salah satu NIM masih berada di antrean dengan nama kelas berbeda
  if (daftarNim.length > 0) {
    const { data: antreanNim } = await window.supabaseClient
      .from('antrean_mahasiswa')
      .select('nim, nama_kelas')
      .in('nim', daftarNim);

    if (antreanNim && antreanNim.length > 0) {
      return {
        boleh: false,
        pesan: `[DITOLAK] Sebanyak ${antreanNim.length} mahasiswa di file ini (contoh NIM: ${antreanNim[0].nim}) masih berada di antrean kelas "${antreanNim[0].nama_kelas}"!`
      };
    }
  }

  // 3. Cek apakah kelas sudah pernah dijadwalkan di jadwal_log
  const { data: historiJadwal, error: errJadwal } = await window.supabaseClient
    .from('jadwal_log')
    .select('id, jenis_tes, tanggal, sesi, nama_kelas, status')
    .ilike('nama_kelas', `%${namaKelasUpper}%`)
    .order('id', { ascending: false });

  if (errJadwal) throw errJadwal;

  // Juga cek lewat peserta_ujian berdasarkan NIM (antisipasi jika penulisan nama kelas sedikit beda spasi)
  let jadwalTerkaitPeserta = [];
  if (daftarNim.length > 0) {
    const { data: pesertaExisting } = await window.supabaseClient
      .from('peserta_ujian')
      .select('jadwal_id, nim, nama_kelas')
      .in('nim', daftarNim);

    if (pesertaExisting && pesertaExisting.length > 0) {
      const jadwalIds = [...new Set(pesertaExisting.map(p => p.jadwal_id).filter(Boolean))];
      if (jadwalIds.length > 0) {
        const { data: jadwalByNim } = await window.supabaseClient
          .from('jadwal_log')
          .select('id, jenis_tes, tanggal, sesi, nama_kelas, status')
          .in('id', jadwalIds)
          .order('id', { ascending: false });
        jadwalTerkaitPeserta = jadwalByNim || [];
      }
    }
  }

  // Gabungkan semua jadwal yang berkaitan dengan kelas atau NIM mahasiswa tersebut
  const mapJadwal = new Map();
  [...(historiJadwal || []), ...jadwalTerkaitPeserta].forEach(j => {
    if (j && j.id) mapJadwal.set(j.id, j);
  });
  const semuaJadwalTerkait = Array.from(mapJadwal.values());

  // Jika belum pernah dijadwalkan sama sekali -> DIIZINKAN upload
  if (semuaJadwalTerkait.length === 0) {
    return { boleh: true };
  }

  // 4. Jika sudah pernah dijadwalkan, pastikan jadwal terakhir sudah selesai pencocokan & masuk Rekapan
  const jadwalTerakhir = semuaJadwalTerkait[0];
  const jenisTesTerakhir = String(jadwalTerakhir.jenis_tes || '').toUpperCase();
  const statusJadwal = String(jadwalTerakhir.status || '').toUpperCase();

  // Jika status jadwal masih TERKUNCI / belum selesai, cek ke tabel rekapan apakah nilainya sudah masuk
  const kandidatTabelRekapan = ['rekapan_mahasiswa', 'hasil_test', 'nilai_mahasiswa'];
  let ditemukanDiRekapan = false;
  let jumlahSudahMasukRekapan = 0;

  for (const namaTabel of kandidatTabelRekapan) {
    try {
      const { data: rowsRekapan, error: errRek } = await window.supabaseClient
        .from(namaTabel)
        .select('*')
        .in('nim', daftarNim);

      if (!errRek && Array.isArray(rowsRekapan) && rowsRekapan.length > 0) {
        // Pastikan kolom skor untuk jenis tes yang dijadwalkan memang sudah terisi (bukan null/kosong)
        const terisiSkor = rowsRekapan.filter(r => {
          if (jenisTesTerakhir.includes('SSPECT')) {
            return (
              r.skor_sspect !== null && r.skor_sspect !== undefined && r.skor_sspect !== '' ||
              r.sspect !== null && r.sspect !== undefined && r.sspect !== '' ||
              r.total_score !== null && r.total_score !== undefined && r.total_score !== ''
            );
          }
          // Untuk TOEFL / tes reguler lainnya
          return (
            r.skor_toefl !== null && r.skor_toefl !== undefined && r.skor_toefl !== '' ||
            r.toefl !== null && r.toefl !== undefined && r.toefl !== '' ||
            r.skor_latihan !== null && r.skor_latihan !== undefined && r.skor_latihan !== '' ||
            r.total_score !== null && r.total_score !== undefined && r.total_score !== ''
          );
        });

        if (terisiSkor.length > 0) {
          ditemukanDiRekapan = true;
          jumlahSudahMasukRekapan = terisiSkor.length;
          break;
        }
      }
    } catch (_) {
      // Lanjut cek nama tabel rekapan berikutnya jika tabel tidak ada
    }
  }

  // Toleransi minimal 50% peserta kelas sudah masuk ke rekapan setelah pencocokan
  const ambangMinimal = Math.max(1, Math.ceil(daftarNim.length * 0.5));

  if (!ditemukanDiRekapan || jumlahSudahMasukRekapan < ambangMinimal) {
    return {
      boleh: false,
      pesan:
        `[DITOLAK] Kelas "${jadwalTerakhir.nama_kelas}" sudah dijadwalkan pada ${jadwalTerakhir.tanggal} (${jadwalTerakhir.sesi} - ${jadwalTerakhir.jenis_tes}, status: ${statusJadwal}) dan BELUM melalui proses pencocokan hingga masuk ke Rekapan!\n\n` +
        `Selesaikan proses pencocokan hasil test (${jadwalTerakhir.jenis_tes}) hingga data masuk ke Rekapan terlebih dahulu sebelum menjadwalkan ulang kelas ini.`
    };
  }

  return { boleh: true };
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

  const resetInputForm = () => {
    e.target.value = '';
    if (fileNameText) {
      fileNameText.innerText = 'Klik untuk Pilih File Excel...';
      fileNameText.classList.remove('text-polnes-main', 'font-bold');
    }
  };

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
        resetInputForm();
        return;
      }

      // VALIDASI KETAT: Tolak jika kelas masih dalam antrean atau sudah dijadwalkan tapi belum dicocokkan & masuk rekapan
      const daftarNim = parsedMhs.map(m => m.nim);
      const hasilValidasi = await validasiKelayakanUploadKelas(namaKelasInput.toUpperCase(), daftarNim);

      if (!hasilValidasi.boleh) {
        alert(hasilValidasi.pesan);
        resetInputForm();
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
      if (selectProdi) selectProdi.value = '';
      resetInputForm();

      await loadAntreanDariSupabase();

    } catch (err) {
      alert("Gagal membaca atau mengunggah file Excel: " + err.message);
      resetInputForm();
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

// --- KUNCI SESI DENGAN VALIDASI KETAT (LAB & SESI SUDAH TERPAKAI PADA TANGGAL TERSEBUT) ---
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
    // 1. Ambil seluruh jadwal yang sudah terkunci pada tanggal & sesi yang sama
    const { data: sesiAktifList, error: checkErr } = await window.supabaseClient
      .from('jadwal_log')
      .select('*')
      .eq('tanggal', tanggal)
      .eq('sesi', sesi);

    if (checkErr) throw checkErr;

    // 2. VALIDASI KETAT: Cek apakah ruang lab yang dipilih sudah digunakan di tanggal & sesi tersebut
    const labSudahDipakai = sesiAktifList.find(s => s.ruang_lab === ruangLabDipilih);
    if (labSudahDipakai) {
      alert(`[DITOLAK] ${ruangLabDipilih} pada tanggal ${tanggal} (${sesi}) sudah digunakan oleh kelas "${labSudahDipakai.nama_kelas}" (${labSudahDipakai.jenis_tes})! Lab fisik tidak dapat digunakan bersamaan.`);
      return;
    }

    // 3. VALIDASI KAPASITAS PASANGAN LAB (Lab A & Lab B tidak boleh sama-sama 30 penuh)
    const labLain = sesiAktifList.find(s => s.ruang_lab !== ruangLabDipilih);
    if (labLain) {
      if (labLain.jumlah_mhs === 30 && jumlahDipilih === 30) {
        alert(`[DITOLAK] Aturan UPA Bahasa: Lab pasangan (${labLain.ruang_lab}) sudah berisi 30 mahasiswa penuh. Lab ${ruangLabDipilih} tidak boleh sama-sama 30 orang penuh di sesi yang sama!`);
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

// --- GENERATE BERITA ACARA PDF (1 HALAMAN PENUH) ---
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
      doc.addImage('./img/polnes.png', 'PNG', 15, 8, 16, 16);
    } catch(err) {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI", 105, 10, { align: "center" });
    doc.setFontSize(11);
    doc.text("POLITEKNIK NEGERI SAMARINDA", 105, 14, { align: "center" });
    
    doc.setFontSize(9);
    doc.text("UNIT PENGELOLA AKADEMIK (UPA) BAHASA", 105, 18, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Jl. Cipto Mangunkusumo Kampus Gunung Lipan Samarinda 75131", 105, 22, { align: "center" });
    
    doc.setLineWidth(0.3);
    doc.line(15, 24, 195, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("BERITA ACARA & DAFTAR HADIR PELAKSANAAN UJIAN", 105, 29, { align: "center" });
    doc.setFontSize(8.5);
    doc.text(`JENIS TES: ${jadwalData.jenis_tes.toUpperCase()}`, 105, 33, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    let startY = 38;
    doc.text(`Hari / Tanggal : ${jadwalData.tanggal}`, 20, startY);
    doc.text(`Ruang Lab      : ${jadwalData.ruang_lab}`, 120, startY);
    
    doc.text(`Waktu Sesi     : ${jadwalData.sesi}`, 20, startY + 4.5);
    doc.text(`Kelas Peserta  : ${jadwalData.nama_kelas}`, 120, startY + 4.5);

    const tableRows = pesertaData.map((p, index) => [
      index + 1,
      p.nim,
      p.nama,
      p.program_studi || '-',
      p.id_meja,
      ""
    ]);

    const autoTableFn = doc.autoTable || window.jspdf.jsAutoTable;

    if (typeof autoTableFn === 'function') {
      doc.autoTable({
        startY: startY + 8,
        head: [["NO", "NIM", "NAMA MAHASISWA", "PRODI", "ID MEJA", "TANDA TANGAN"]],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [16, 195, 93], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold', 
          halign: 'center', 
          fontSize: 7.5,
          cellPadding: 1.2
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 24, halign: 'center' },
          2: { cellWidth: 52 },
          3: { cellWidth: 42, fontSize: 6.5 },
          4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 36 }
        },
        styles: { 
          fontSize: 7.5, 
          cellPadding: 0.9
        }
      });
    } else {
      throw new Error("Library autoTable tidak terdeteksi.");
    }

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : startY + 45;
    
    doc.setFontSize(8.5);
    doc.text("Samarinda, " + new Date().toLocaleDateString('id-ID'), 140, finalY);
    doc.text("Pengawas Ujian,", 140, finalY + 3.5);
    
    doc.setFont("helvetica", "bold");
    doc.text("(_________________________)", 130, finalY + 16);

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