/**
 * MODUL 4: KALKULASI & PUBLIKASI SCORE - UPA BAHASA POLNES (FULL VERSION UTUH)
 * Menampilkan pilihan sesi berdasarkan Nama Kelas dan Jenis Tes,
 * kalkulasi konversi live, dan Publish dengan validasi status.
 */

let globalDataAntrean = [];
let activeIdJadwal = null;

// Tabel Konversi Resmi ITP TOEFL
const TABEL_KONVERSI_TOEFL = {
  50: { l: 68, s: 68, r: 67 }, 49: { l: 67, s: 67, r: 66 }, 48: { l: 66, s: 65, r: 65 }, 47: { l: 65, s: 63, r: 63 },
  46: { l: 63, s: 61, r: 61 }, 45: { l: 62, s: 60, r: 60 }, 44: { l: 61, s: 59, r: 59 }, 43: { l: 60, s: 58, r: 58 },
  42: { l: 59, s: 57, r: 57 }, 41: { l: 58, s: 56, r: 56 }, 40: { l: 57, s: 68, r: 55 }, 39: { l: 57, s: 67, r: 54 },
  38: { l: 56, s: 65, r: 54 }, 37: { l: 55, s: 63, r: 53 }, 36: { l: 54, s: 61, r: 52 }, 35: { l: 54, s: 60, r: 52 },
  34: { l: 53, s: 58, r: 51 }, 33: { l: 52, s: 57, r: 50 }, 32: { l: 52, s: 56, r: 49 }, 31: { l: 51, s: 55, r: 48 },
  30: { l: 51, s: 54, r: 48 }, 29: { l: 50, s: 53, r: 47 }, 28: { l: 49, s: 52, r: 46 }, 27: { l: 49, s: 51, r: 46 },
  26: { l: 48, s: 50, r: 45 }, 25: { l: 48, s: 49, r: 44 }, 24: { l: 47, s: 48, r: 43 }, 23: { l: 47, s: 47, r: 43 },
  22: { l: 46, s: 46, r: 42 }, 21: { l: 45, s: 45, r: 41 }, 20: { l: 45, s: 44, r: 40 }, 19: { l: 44, s: 43, r: 39 },
  18: { l: 43, s: 42, r: 38 }
};

function hitungKonversiDetail(jumlahBenar, sectionType) {
  let scoreNum = parseInt(jumlahBenar) || 0;
  if (scoreNum > 50) scoreNum = 50;
  if (TABEL_KONVERSI_TOEFL[scoreNum]) {
    if (sectionType === 1) return TABEL_KONVERSI_TOEFL[scoreNum].l;
    if (sectionType === 2) return TABEL_KONVERSI_TOEFL[scoreNum].s;
    if (sectionType === 3) return TABEL_KONVERSI_TOEFL[scoreNum].r;
  }
  return Math.max(30, scoreNum + 20); // Fallback nilai dasar
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadAntreanSesi();
});

async function loadAntreanSesi() {
  const select = document.getElementById('selectAntreanSesi');
  if (!select) return;

  try {
    // 1. Ambil data idJadwal yang belum dipublish dari HasilTes
    const { data: listHasil, error } = await window.supabaseClient
      .from('HasilTes')
      .select('idJadwal, jenisTes, status')
      .neq('status', 'PUBLISHED');

    if (error) throw error;

    if (!listHasil || listHasil.length === 0) {
      select.innerHTML = '<option value="">Semua data telah ter-Publish (Tidak ada antrean)</option>';
      return;
    }

    // Ambil unique idJadwal
    const uniqueIds = [...new Set(listHasil.map(item => item.idJadwal))];

    // 2. Ambil detail dari jadwal_log untuk mendapatkan Nama Kelas dan detail lainnya
    const { data: jadwalList, error: jadwalErr } = await window.supabaseClient
      .from('jadwal_log')
      .select('*')
      .in('id', uniqueIds);

    if (jadwalErr) throw jadwalErr;

    // Tampilan dropdown: Nama Kelas di depan, Jenis Tes di belakang
    select.innerHTML = '<option value="">-- Pilih Kelas & Sesi Ujian --</option>' + (jadwalList || []).map(j => 
      `<option value="${j.id}">Kelas: ${j.nama_kelas} — ${j.jenis_tes.toUpperCase()} (${j.ruang_lab} | ${j.sesi} | Tgl: ${j.tanggal})</option>`
    ).join('');

  } catch (err) {
    select.innerHTML = '<option value="">Gagal memuat data antrean</option>';
    console.error("Error loadAntreanSesi:", err);
  }
}

async function muatDataKalkulasi() {
  const select = document.getElementById('selectAntreanSesi');
  if (!select) return;
  
  const idj = select.value;
  if (!idj) {
    alert("Pilih kelas dan sesi ujian terlebih dahulu.");
    return;
  }
  
  activeIdJadwal = idj;

  try {
    const { data: records, error } = await window.supabaseClient
      .from('HasilTes')
      .select('*')
      .eq('idJadwal', idj);

    if (error) throw error;

    globalDataAntrean = records || [];
    renderTabelKalkulasi();

  } catch (err) {
    alert("Gagal memuat detail sesi: " + err.message);
  }
}

function renderTabelKalkulasi() {
  const tbody = document.getElementById('tabelKalkulasiBody');
  if (!tbody) return;

  if (globalDataAntrean.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-slate-400 text-sm italic">Tidak ada data peserta di sesi ini.</td></tr>`;
    return;
  }

  tbody.innerHTML = globalDataAntrean.map((item, index) => {
    let tampilanL = '', tampilanS = '', tampilanR = '', tampilanTotal = '';
    const no = index + 1;

    if (item.jenisTes === 'TOEFL') {
      const konvL = hitungKonversiDetail(item.sec1Listening, 1);
      const konvS = hitungKonversiDetail(item.sec2Structure, 2);
      const konvR = hitungKonversiDetail(item.sec3Reading, 3);

      tampilanL = `<span class="text-slate-700">${item.sec1Listening}</span> <span class="text-slate-300 mx-1">→</span> <span class="text-sky-600 font-bold">${konvL}</span>`;
      tampilanS = `<span class="text-slate-700">${item.sec2Structure}</span> <span class="text-slate-300 mx-1">→</span> <span class="text-purple-600 font-bold">${konvS}</span>`;
      tampilanR = `<span class="text-slate-700">${item.sec3Reading}</span> <span class="text-slate-300 mx-1">→</span> <span class="text-amber-600 font-bold">${konvR}</span>`;
      tampilanTotal = Math.round(((konvL + konvS + konvR) * 10) / 3);
    } else {
      // SSPECT
      tampilanL = `<span class="text-slate-700 font-semibold">${item.sec1Listening || 0}</span>`;
      tampilanS = `-`;
      tampilanR = `-`;
      tampilanTotal = item.totalSkor || item.sec1Listening || 0;
    }

    return `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="px-4 py-4 text-[13px] font-semibold border-r border-slate-100 text-center">${no}</td>
        <td class="px-4 py-4 text-[13px] font-bold text-slate-800 border-r border-slate-100">${item.nim}</td>
        <td class="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase border-r border-slate-100 text-center">${item.jenisTes}</td>
        <td class="px-4 py-4 text-center border-r border-slate-100 text-[13px]">${tampilanL}</td>
        <td class="px-4 py-4 text-center border-r border-slate-100 text-[13px]">${tampilanS}</td>
        <td class="px-4 py-4 text-center border-r border-slate-100 text-[13px]">${tampilanR}</td>
        <td class="px-4 py-4 text-[15px] font-extrabold text-center text-polnes-dark bg-emerald-50/50">${tampilanTotal}</td>
      </tr>
    `;
  }).join('');
}

async function publishKeWebUtama() {
  if (!activeIdJadwal || globalDataAntrean.length === 0) {
    alert("Silakan proses kalkulasi kelas ujian terlebih dahulu.");
    return;
  }

  if (!confirm(`Yakin ingin MEM-PUBLISH data hasil test kelas ini? Setelah dipublikasikan, mahasiswa dapat langsung melihat skor resminya.`)) {
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('HasilTes')
      .update({ status: 'PUBLISHED' })
      .eq('idJadwal', activeIdJadwal);

    if (error) throw error;

    alert("Publikasi Berhasil! Data skor mahasiswa sekarang sudah LIVE dan dapat diakses di portal mahasiswa.");
    window.location.reload();

  } catch (err) {
    alert("Gagal melakukan publikasi: " + err.message);
  }
}