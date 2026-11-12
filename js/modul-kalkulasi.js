/**
 * MODUL 4: KALKULASI & PUBLIKASI SCORE - UPA BAHASA POLNES
 * Menampilkan antrean sesi, kalkulasi konversi live, dan Publish.
 */

let globalDataAntrean = [];
let activeIdJadwal = null;

// Tabel Konversi Resmi ITP
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
  try {
    // Ambil data idJadwal yang ada di tabel HasilTes (Group By simulasi)
    // Asumsi: status_publish = false atau column status != 'PUBLISHED'
    const { data: listHasil, error } = await window.supabaseClient
      .from('HasilTes')
      .select('idJadwal, jenisTes, status')
      .neq('status', 'PUBLISHED'); // Hanya ambil yang belum publish

    if (error) throw error;

    // Filter duplikat batch ID
    const uniqueBatches = [];
    const map = new Map();
    for (const item of listHasil) {
      if (!map.has(item.idJadwal)) {
        map.set(item.idJadwal, true);
        uniqueBatches.push({
          idJadwal: item.idJadwal,
          jenisTes: item.jenisTes
        });
      }
    }

    if (uniqueBatches.length === 0) {
      select.innerHTML = '<option value="">Semua data telah ter-Publish (Tidak ada antrean)</option>';
      return;
    }

    select.innerHTML = uniqueBatches.map(b => 
      `<option value="${b.idJadwal}">BATCH JADWAL ID: ${b.idJadwal} — (Tes: ${b.jenisTes})</option>`
    ).join('');

  } catch (err) {
    select.innerHTML = '<option value="">Gagal memuat data antrean</option>';
    console.error(err);
  }
}

async function muatDataKalkulasi() {
  const select = document.getElementById('selectAntreanSesi');
  const idJ = select.value;
  if (!idJ) {
    alert("Pilih batch antrean sesi terlebih dahulu.");
    return;
  }
  activeIdJadwal = idJ;

  try {
    const { data: records, error } = await window.supabaseClient
      .from('HasilTes')
      .select('*')
      .eq('idJadwal', idJ);

    if (error) throw error;

    globalDataAntrean = records;
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

  let no = 1;
  tbody.innerHTML = globalDataAntrean.map((item) => {
    let tampilanL, tampilanS, tampilanR, tampilanTotal;

    if (item.jenisTes === 'TOEFL') {
      // Hitung ulang untuk divisualisasikan: BENAR = KONVERSI
      const konvL = hitungKonversiDetail(item.sec1Listening, 1);
      const konvS = hitungKonversiDetail(item.sec2Structure, 2);
      const konvR = hitungKonversiDetail(item.sec3Reading, 3);
      
      tampilanL = `<b class="text-slate-700">${item.sec1Listening}</b> <span class="text-slate-300 mx-1">➔</span> <b class="text-sky-600">${konvL}</b>`;
      tampilanS = `<b class="text-slate-700">${item.sec2Structure}</b> <span class="text-slate-300 mx-1">➔</span> <b class="text-purple-600">${konvS}</b>`;
      tampilanR = `<b class="text-slate-700">${item.sec3Reading}</b> <span class="text-slate-300 mx-1">➔</span> <b class="text-amber-600">${konvR}</b>`;
      tampilanTotal = item.totalSkor;
    } else {
      // SSPECT
      tampilanL = `<b class="text-slate-700">${item.sec1Listening}</b> <span class="text-slate-300 mx-1">➔</span> <b class="text-sky-600">${item.sec1Listening}</b>`;
      tampilanS = `<span class="text-slate-300">-</span>`;
      tampilanR = `<span class="text-slate-300">-</span>`;
      tampilanTotal = item.totalSkor;
    }

    return `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="px-4 py-4 text-[13px] font-semibold border-r border-slate-100">${no++}</td>
        <td class="px-4 py-4 text-[13px] font-bold text-slate-800 border-r border-slate-100">${item.nim}</td>
        <td class="px-4 py-4 text-[11px] font-bold text-slate-500 border-r border-slate-100 bg-slate-50 uppercase">${item.jenisTes}</td>
        <td class="px-4 py-4 text-[13px] text-center border-r border-slate-100">${tampilanL}</td>
        <td class="px-4 py-4 text-[13px] text-center border-r border-slate-100">${tampilanS}</td>
        <td class="px-4 py-4 text-[13px] text-center border-r border-slate-100">${tampilanR}</td>
        <td class="px-4 py-4 text-[15px] font-extrabold text-center text-polnes-dark bg-emerald-50/50">${tampilanTotal}</td>
      </tr>
    `;
  }).join('');
}

async function publishKeWebUtama() {
  if (!activeIdJadwal || globalDataAntrean.length === 0) {
    alert("Silakan proses kalkulasi batch antrean terlebih dahulu.");
    return;
  }

  if (!confirm(`Yakin ingin MEM-PUBLISH data hasil test Batch ${activeIdJadwal} ini? Setelah dipublish, mahasiswa dapat langsung melihat skor resminya di web utama.`)) return;

  try {
    // Kita update kolom 'status' menjadi 'PUBLISHED' agar masuk ke web frontend mahasiswa
    const { error } = await window.supabaseClient
      .from('HasilTes')
      .update({ status: 'PUBLISHED' })
      .eq('idJadwal', activeIdJadwal);

    if (error) throw error;

    alert("🎉 Publikasi Berhasil! Data skor mahasiswa sekarang sudah LIVE dan dapat diakses di portal mahasiswa.");
    window.location.reload();

  } catch (err) {
    alert("Gagal melakukan publikasi: " + err.message);
  }
}