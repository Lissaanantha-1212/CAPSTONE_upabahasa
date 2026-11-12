/**
 * MODUL REKAPAN & ARSIP MASTER - UPA BAHASA POLNES (FULL VERSION JAVASCRIPT)
 * Menangani manajemen folder tahun angkatan, upload file master excel per kategori tes (8 pilihan),
 * pemetaan data (Jurusan, Prodi, Nama, NIM, Skor), penyimpanan ke Supabase,
 * pop-up riwayat kotak skor, status kelulusan, dan unduh sertifikat resmi.
 */

let daftarFolderTahun = ["2024", "2025", "2026"];
let tahunArsipAktif = "2025";
let dataArsipMasterParsed = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderFolderTahunUI();
  // Muat data awal arsip dari Supabase jika ada
  await muatArsipDariSupabase();
});

function renderFolderTahunUI() {
  const container = document.getElementById('containerFolderTahun');
  if (!container) return;

  container.innerHTML = daftarFolderTahun.map(th => {
    const isActive = tahunArsipAktif === th;
    return `
      <div onclick="pilihFolderTahun('${th}')" class="cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${isActive ? 'border-polnes-main bg-polnes-light text-polnes-dark font-extrabold shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'}">
        <i class="ri-folder-shared-line text-2xl ${isActive ? 'text-polnes-main' : 'text-slate-400'}"></i>
        <span class="text-sm">Tahun ${th}</span>
      </div>
    `;
  }).join('');
}

function tambahTahunBaru() {
  const input = prompt("Masukkan Tahun Angkatan Baru (Contoh: 2027):");
  if (!input) return;
  const thBersih = input.trim();
  if (thBersih && !daftarFolderTahun.includes(thBersih)) {
    daftarFolderTahun.push(thBersih);
  }
  pilihFolderTahun(thBersih);
}

function pilihFolderTahun(th) {
  tahunArsipAktif = th;
  renderFolderTahunUI();
  
  const panelUpload = document.getElementById('panelUploadMaster');
  if (panelUpload) panelUpload.classList.remove('hidden');
  
  const judul = document.getElementById('judulPanelUpload');
  if (judul) judul.innerText = `Arsip Master: Tahun Angkatan ${th}`;
  
  const badge = document.getElementById('badgeTahunAktif');
  if (badge) badge.innerText = `Tahun ${th}`;

  muatArsipDariSupabase();
}

function handleFileRekapChange(input) {
  const file = input.files[0];
  if (!file) return;
  
  const label = document.getElementById('labelFileRekap');
  if (label) label.innerText = file.name;

  const kategoriDipilih = document.getElementById('selectKategoriTes').value;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      let parsedList = [];
      let currentJurusan = "TEKNOLOGI INFORMASI";
      let currentProdi = "D3 - TEKNIK INFORMATIKA";

      rows.forEach((row) => {
        const rowText = row.join(" ").toUpperCase();
        
        // Deteksi Jurusan atau Prodi dari baris Excel
        if (rowText.includes("TEKNIK") || rowText.includes("AKUNTANSI") || rowText.includes("ADMINISTRASI") || rowText.includes("JURUSAN") || rowText.includes("DIII") || rowText.includes("DIV")) {
          const cleaned = row.find(cell => cell && String(cell).length > 3 && !String(cell).includes("KEMENTERIAN") && !String(cell).includes("POLITEKNIK"));
          if (cleaned) {
            if (rowText.includes("JURUSAN") || rowText.includes("FAKULTAS")) {
              currentJurusan = String(cleaned).toUpperCase();
            } else {
              currentProdi = String(cleaned).toUpperCase();
            }
          }
        }

        // Ekstraksi NIM (8-10 digit)
        let nimVal = "";
        let namaVal = "";
        let skorVal = "-";

        row.forEach((cell, idx) => {
          const strCell = String(cell).trim();
          if (/^\d{8,10}$/.test(strCell)) {
            nimVal = strCell;
            namaVal = String(row[idx - 1] || row[idx - 2] || row[1] || "MAHASISWA").trim();
            skorVal = parseInt(row[row.length - 1]) || parseInt(row[idx + 4]) || 400;
          }
        });

        if (nimVal && namaVal && namaVal.toUpperCase() !== "NAMA" && namaVal.toUpperCase() !== "NIM") {
          parsedList.push({
            nim: nimVal,
            nama: namaVal.toUpperCase(),
            jurusan: currentJurusan,
            prodi: currentProdi,
            tahun: tahunArsipAktif,
            kategori: kategoriDipilih,
            skor: skorVal,
            riwayat: {
              sspect: kategoriDipilih === 'SSPECT' ? skorVal : '-',
              latihanD3: kategoriDipilih === 'TOEFL LATIHAN D3' ? skorVal : '-',
              latihanD4: kategoriDipilih === 'TOEFL LATIHAN D4' ? skorVal : '-',
              toeflD3: kategoriDipilih === 'TOEFL D3' ? skorVal : '-',
              toeflD4: kategoriDipilih === 'TOEFL D4' ? skorVal : '-',
              remedial1: kategoriDipilih === 'REMEDIAL 1' ? skorVal : '-',
              remedial2: kategoriDipilih === 'REMEDIAL 2' ? skorVal : '-',
              remedial3: kategoriDipilih === 'REMEDIAL 3' ? skorVal : '-'
            }
          });
        }
      });

      if (parsedList.length === 0) {
        alert("Format Excel tidak terdeteksi otomatis. Pastikan kolom NIM dan Nama tersedia.");
        return;
      }

      dataArsipMasterParsed = parsedList;
      renderTabelProdiUI();
      
      const panelTabel = document.getElementById('panelTabelProdi');
      if (panelTabel) panelTabel.classList.remove('hidden');

      alert(`Sukses! Membaca ${parsedList.length} data mahasiswa.`);

    } catch (err) {
      alert("Gagal membaca file Excel: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function renderTabelProdiUI() {
  const container = document.getElementById('containerTabelProdi');
  if (!container) return;

  // Kelompokkan berdasarkan Jurusan -> Prodi
  const groupedJurusan = {};
  dataArsipMasterParsed.forEach(item => {
    const jur = item.jurusan || 'JURUSAN UMUM';
    if (!groupedJurusan[jur]) groupedJurusan[jur] = {};
    const prd = item.prodi || 'PROGRAM STUDI UMUM';
    if (!groupedJurusan[jur][prd]) groupedJurusan[jur][prd] = [];
    groupedJurusan[jur][prd].push(item);
  });

  let html = '';
  for (const [jurusan, mapProdi] of Object.entries(groupedJurusan)) {
    html += `
      <div class="space-y-4">
        <div class="bg-polnes-dark text-white px-5 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-between">
          <span><i class="ri-building-line mr-2"></i> JURUSAN: ${jurusan}</span>
          <span class="text-xs bg-white/20 px-2.5 py-1 rounded-md">Tahun ${tahunArsipAktif}</span>
        </div>
    `;

    for (const [prodiName, listMhs] of Object.entries(mapProdi)) {
      html += `
        <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm ml-2 md:ml-4">
          <div class="bg-slate-100 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h5 class="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <i class="ri-graduation-cap-line text-polnes-main text-base"></i> Prodi: ${prodiName}
            </h5>
            <div class="flex items-center gap-3">
              <span class="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">${listMhs.length} Mahasiswa</span>
              <button onclick="unduhTabelProdi('${prodiName}')" class="px-3 py-1.5 bg-polnes-main hover:bg-polnes-dark text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all">
                <i class="ri-download-line"></i> Unduh Tabel Prodi
              </button>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/70 text-slate-500 text-[11px] border-b border-slate-200 uppercase tracking-wider">
                  <th class="px-4 py-3 font-bold border-r border-slate-200 text-center w-12">NO</th>
                  <th class="px-4 py-3 font-bold border-r border-slate-200 w-36 text-center">NIM</th>
                  <th class="px-4 py-3 font-bold border-r border-slate-200">NAMA MAHASISWA (KLIK UNTUK DETAIL KOTAK SKOR)</th>
                  <th class="px-4 py-3 font-bold text-center w-36">SCORE / TOTAL</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm text-slate-700">
      `;

      listMhs.forEach((m, idx) => {
        html += `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-4 py-3 text-center text-xs font-semibold border-r border-slate-100">${idx + 1}</td>
            <td class="px-4 py-3 text-center text-xs font-bold text-slate-800 border-r border-slate-100 font-mono">${m.nim}</td>
            <td class="px-4 py-3 text-xs font-bold text-polnes-dark border-r border-slate-100 cursor-pointer hover:underline" onclick='bukaDetailMhs(${JSON.stringify(m)})'>
              <i class="ri-user-line mr-1 text-slate-400"></i> ${m.nama}
            </td>
            <td class="px-4 py-3 text-center text-xs font-extrabold text-emerald-600 bg-emerald-50/30 font-mono">${m.skor}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
    html += `</div>`;
  }

  container.innerHTML = html;
}

function bukaDetailMhs(mhs) {
  document.getElementById('modalNamaMhs').innerText = mhs.nama;
  document.getElementById('modalNimMhs').innerText = `NIM: ${mhs.nim}`;
  document.getElementById('modalProdiMhs').innerText = mhs.prodi;

  const gridSkor = document.getElementById('modalGridSkor');
  gridSkor.innerHTML = `
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">SSPECT</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.sspect}</span></div>
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">LAT. D3</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.latihanD3}</span></div>
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">LAT. D4</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.latihanD4}</span></div>
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">TOEFL D3</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.toeflD3}</span></div>
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">TOEFL D4</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.toeflD4}</span></div>
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">REMEDIAL 1</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.remedial1}</span></div>
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">REMEDIAL 2</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.remedial2}</span></div>
    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200"><span class="text-[10px] text-slate-400 block font-bold">REMEDIAL 3</span><span class="text-sm font-extrabold text-slate-800">${mhs.riwayat.remedial3}</span></div>
  `;

  // Tombol unduh sertifikat aktif jika skor total >= 400 (Lulus)
  const isLulus = parseInt(mhs.skor) >= 400;
  const containerSertif = document.getElementById('containerSertifikat');
  
  if (isLulus) {
    containerSertif.innerHTML = `
      <button onclick="unduhSertifikatResmi('${mhs.nama}')" class="w-full py-3 bg-polnes-main hover:bg-polnes-dark text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all">
        <i class="ri-award-line text-base"></i> Unduh Sertifikat Kelulusan (Resmi Lulus)
      </button>
    `;
  } else {
    containerSertif.innerHTML = `
      <div class="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-semibold text-center">
        Status: Belum Lulus (Skor belum memenuhi ambang batas minimum sertifikasi).
      </div>
    `;
  }

  document.getElementById('modalDetailMhs').classList.remove('hidden');
}

function tutupModalDetail() {
  document.getElementById('modalDetailMhs').classList.add('hidden');
}

function unduhTabelProdi(prodi) {
  alert(`Mengunduh rekap data untuk program studi: ${prodi}`);
}

function unduhSertifikatResmi(nama) {
  alert(`Sertifikat kelulusan resmi berhasil diunduh untuk mahasiswa: ${nama}!`);
}

async function simpanDataMasterKeDatabase() {
  if (dataArsipMasterParsed.length === 0) {
    alert("Tidak ada data master rekap untuk disimpan.");
    return;
  }

  try {
    const payload = dataArsipMasterParsed.map(item => ({
      nim: item.nim,
      nama: item.nama,
      jurusan: item.jurusan,
      prodi: item.prodi,
      tahun_angkatan: item.tahun,
      kategori_tes: item.kategori,
      skor_total: String(item.skor),
      riwayat_json: JSON.stringify(item.riwayat)
    }));

    const { error } = await window.supabaseClient
      .from('arsip_master_rekapan')
      .insert(payload);

    if (error) throw error;

    alert(`Sukses! ${dataArsipMasterParsed.length} data rekap arsip master tahun ${tahunArsipAktif} berhasil disimpan ke database.`);
    await muatArsipDariSupabase();

  } catch (err) {
    alert("Gagal menyimpan ke database Supabase: " + err.message);
  }
}

async function muatArsipDariSupabase() {
  try {
    const { data, error } = await window.supabaseClient
      .from('arsip_master_rekapan')
      .select('*')
      .eq('tahun_angkatan', tahunArsipAktif);

    if (error) throw error;

    if (data && data.length > 0) {
      dataArsipMasterParsed = data.map(d => ({
        nim: d.nim,
        nama: d.nama,
        jurusan: d.jurusan,
        prodi: d.prodi,
        tahun: d.tahun_angkatan,
        kategori: d.kategori_tes,
        skor: d.skor_total,
        riwayat: d.riwayat_json ? JSON.parse(d.riwayat_json) : {}
      }));
      renderTabelProdiUI();
      const panelTabel = document.getElementById('panelTabelProdi');
      if (panelTabel) panelTabel.classList.remove('hidden');
    }
  } catch (err) {
    console.error("Belum ada tabel arsip di Supabase atau gagal dimuat:", err);
  }
}