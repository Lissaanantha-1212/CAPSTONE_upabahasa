// ==================== 1. KAMUS TERJEMAHAN LENGKAP ID <-> EN ====================
const translations = {
  id: {
    top_address: "Jl. Cipto Mangunkusumo, Samarinda Seberang",
    brand_subtitle: "POLITEKNIK NEGERI SAMARINDA",
    nav_beranda: "BERANDA",
    nav_tentang: "TENTANG",
    nav_layanan: "Layanan",
    nav_informasi: "Informasi",
    nav_pembelajaran: "Pembelajaran",
    nav_pengguna: "Layanan Pengguna",
    btn_login_staff: "Login Staff",
    mm_layanan_tes: "LAYANAN TES",
    mm_toefl_sub: "Info, Jadwal, Daftar Remedial & Cek Skor",
    mm_toefl_1: "Informasi TOEFL Prediction",
    mm_toefl_2: "Jadwal Tes & Jadwal Remedial",
    mm_toefl_3: "Pendaftaran Remedial",
    mm_toefl_4: "Cek Skor TOEFL",
    mm_sspect_sub: "Jadwal & Daftar Peserta Tes SSPECT",
    mm_toeic_sub: "Informasi TOEIC & Pengumuman Berita",
    mm_layanan_nontes: "LAYANAN NON-TES",
    mm_segera_hadir: "Segera Hadir",
    mm_nontes_1: "1. Kursus Bahasa Inggris",
    mm_nontes_1_sub: "Informasi, Jadwal & Pendaftaran Kursus",
    mm_nontes_2: "2. Kursus Bahasa Mandarin",
    mm_nontes_2_sub: "Informasi, Jadwal & Pendaftaran Kursus",
    mm_nontes_3: "3. Job Seeking Skills Training (JSST)",
    mm_nontes_3_sub: "Informasi & Pendaftaran JSST",
    pill_toefl_1: "1. Informasi Umum",
    pill_toefl_2: "2. Jadwal Tes & Remedial",
    pill_toefl_3: "3. Pendaftaran Remedial",
    pill_toefl_4: "4. Cek Skor TOEFL",
    toefl_info_badge: "INFORMASI LAYANAN",
    toefl_info_title: "Tentang TOEFL Prediction UPA Bahasa",
    toefl_box1_t: "Syarat Kelulusan",
    toefl_box1_d: "Memenuhi standar kompetensi bahasa Inggris institusi sebagai syarat administrasi kelulusan jenjang D3 dan D4.",
    toefl_box2_t: "Portofolio Karier",
    toefl_box2_d: "Digunakan sebagai bukti kemampuan bahasa Inggris saat melamar pekerjaan di perusahaan nasional, multinasional, maupun instansi pemerintah.",
    toefl_box3_t: "Struktur Pengujian",
    toefl_box3_d: "Mengukur penguasaan tiga aspek utama: Listening Comprehension, Structure & Written Expression, dan Reading Comprehension.",
    toefl_tbl1_badge: "JADWAL PELAKSANAAN UJIAN",
    toefl_tbl1_title: "Jadwal Ujian TOEFL Prediction per Kelas",
    toefl_tbl1_hint: "Klik tombol Lihat Peserta pada kelas Anda untuk menampilkan daftar nama mahasiswa beserta detail sesi dan ruang lab.",
    toefl_tbl2_badge: "DAFTAR PESERTA UJIAN",
    toefl_tbl2_title: "Daftar Nama Mahasiswa Peserta TOEFL Prediction",
    toefl_tbl2_hint: "Cari nama atau NIM Anda di kolom pencarian di samping untuk mengecek nomor meja, tanggal, sesi, dan ruang lab.",
    btn_segarkan_jadwal: "Segarkan Jadwal",
    btn_segarkan_file: "Segarkan Pengumuman",
    th_kelas_uji: "KELAS",
    th_prodi: "PROGRAM STUDI",
    th_tanggal: "TANGGAL UJIAN",
    th_sesi_jam: "SESI & JAM",
    th_ruang_lab: "RUANG LAB",
    th_detail: "DAFTAR PESERTA",
    th_nama_mhs: "NAMA MAHASISWA",
    th_kelas_prodi: "KELAS & PRODI",
    th_tgl_sesi: "TANGGAL, SESI & JAM",
    rem_tbl_badge: "PESERTA CAMPURAN LINTAS KELAS",
    rem_tbl_title: "Daftar Mahasiswa Peserta Remedial TOEFL",
    form_rem_badge: "PENGAJUAN MANDIRI",
    form_rem_title: "Formulir Pendaftaran Remedial TOEFL",
    form_rem_sub: "Lengkapi data NIM, Nama Lengkap, Program Studi, dan Kelas Anda untuk didaftarkan ke sesi ujian remedial.",
    lbl_nama_lengkap: "Nama Lengkap Mahasiswa *",
    lbl_prodi: "Program Studi *",
    lbl_kelas: "Kelas *",
    btn_kirim_remedial: "Kirim Pendaftaran Remedial",
    skor_badge: "VERIFIKASI NILAI",
    skor_title: "Cek Hasil Skor TOEFL Prediction",
    skor_sub: "Masukkan NIM Anda untuk memeriksa rincian nilai Listening, Structure, Reading, dan Total Skor.",
    btn_cek_skor: "Cek Skor Sekarang",
    sspect_tbl1_badge: "JADWAL PELAKSANAAN SSPECT",
    sspect_tbl1_title: "Jadwal Ujian SSPECT per Kelas",
    toeic_badge: "LAYANAN SERTIFIKASI INTERNASIONAL • TOEIC",
    toeic_heading: "Informasi Umum & Pengumuman Resmi TOEIC",
    toeic_sub: "Pusat informasi pelaksanaan tes TOEIC bagi mahasiswa POLNES serta publikasi resmi daftar peserta wajib dan hasil ujian dari staf UPA Bahasa.",
    toeic_info1_t: "Apa itu Tes TOEIC?",
    toeic_info1_d: "Test of English for International Communication (TOEIC) adalah ujian standar internasional untuk mengukur kemampuan komunikasi bahasa Inggris di dunia kerja dan industri global.",
    toeic_info2_t: "Peserta Wajib TOEIC",
    toeic_info2_d: "Daftar mahasiswa yang diwajibkan mengikuti program sertifikasi TOEIC diterbitkan melalui pengumuman resmi di bawah ini oleh staf UPA Bahasa.",
    toeic_info3_t: "Publikasi Hasil dari Pusat",
    toeic_info3_d: "Setelah pelaksanaan tes selesai dan rekap nilai diterima dari pusat penyelenggara, staf akan mempublikasikan pengumuman dan lampiran hasil resminya di portal ini.",
    toeic_files_title: "Pengumuman & Publikasi Resmi TOEIC",
    btn_back_toeic: "Kembali ke Daftar Pengumuman TOEIC",
    btn_download_doc: "Unduh / Buka Dokumen",
    footer_copyright: "© 2026 UPA Bahasa • Politeknik Negeri Samarinda. Hak cipta dilindungi."
  },
  en: {
    top_address: "Jl. Cipto Mangunkusumo, Samarinda Seberang",
    brand_subtitle: "STATE POLYTECHNIC OF SAMARINDA",
    nav_beranda: "HOME",
    nav_tentang: "ABOUT",
    nav_layanan: "Services",
    nav_informasi: "Information",
    nav_pembelajaran: "Learning",
    nav_pengguna: "User Services",
    btn_login_staff: "Staff Login",
    mm_layanan_tes: "TESTING SERVICES",
    mm_toefl_sub: "Info, Schedule, Remedial Registration & Score Check",
    mm_toefl_1: "TOEFL Prediction Information",
    mm_toefl_2: "Test & Remedial Schedules",
    mm_toefl_3: "Remedial Registration",
    mm_toefl_4: "Check TOEFL Score",
    mm_sspect_sub: "SSPECT Test Schedule & Participant Roster",
    mm_toeic_sub: "TOEIC Info & Official News Announcements",
    mm_layanan_nontes: "NON-TESTING SERVICES",
    mm_segera_hadir: "Coming Soon",
    mm_nontes_1: "1. English Language Course",
    mm_nontes_1_sub: "Course Information, Schedule & Registration",
    mm_nontes_2: "2. Mandarin Language Course",
    mm_nontes_2_sub: "Course Information, Schedule & Registration",
    mm_nontes_3: "3. Job Seeking Skills Training (JSST)",
    mm_nontes_3_sub: "JSST Information & Registration",
    pill_toefl_1: "1. General Information",
    pill_toefl_2: "2. Test & Remedial Schedule",
    pill_toefl_3: "3. Remedial Registration",
    pill_toefl_4: "4. Check TOEFL Score",
    toefl_info_badge: "SERVICE INFORMATION",
    toefl_info_title: "About UPA Bahasa TOEFL Prediction",
    toefl_box1_t: "Graduation Requirement",
    toefl_box1_d: "Fulfills institutional English competency standards as an administrative graduation requirement for D3 and D4 programs.",
    toefl_box2_t: "Career Portfolio",
    toefl_box2_d: "Serves as proof of English proficiency when applying to national companies, multinational corporations, and government institutions.",
    toefl_box3_t: "Test Structure",
    toefl_box3_d: "Measures mastery across three core areas: Listening Comprehension, Structure & Written Expression, and Reading Comprehension.",
    toefl_tbl1_badge: "EXAMINATION SCHEDULE",
    toefl_tbl1_title: "TOEFL Prediction Exam Schedule by Class",
    toefl_tbl1_hint: "Click the View Participants button on your class to display the list of students along with session and lab room details.",
    toefl_tbl2_badge: "EXAM PARTICIPANT LIST",
    toefl_tbl2_title: "TOEFL Prediction Student Participant Roster",
    toefl_tbl2_hint: "Search your name or NIM in the search bar to check your desk number, date, session, and lab room.",
    btn_segarkan_jadwal: "Refresh Schedule",
    btn_segarkan_file: "Refresh Announcements",
    th_kelas_uji: "CLASS",
    th_prodi: "STUDY PROGRAM",
    th_tanggal: "EXAM DATE",
    th_sesi_jam: "SESSION & TIME",
    th_ruang_lab: "LAB ROOM",
    th_detail: "PARTICIPANTS",
    th_nama_mhs: "STUDENT NAME",
    th_kelas_prodi: "CLASS & PROGRAM",
    th_tgl_sesi: "DATE, SESSION & TIME",
    rem_tbl_badge: "CROSS-CLASS PARTICIPANTS",
    rem_tbl_title: "TOEFL Remedial Student Participant Roster",
    form_rem_badge: "SELF-REGISTRATION",
    form_rem_title: "TOEFL Remedial Registration Form",
    form_rem_sub: "Complete your Student ID (NIM), Full Name, Study Program, and Class to register for a remedial exam session.",
    lbl_nama_lengkap: "Student Full Name *",
    lbl_prodi: "Study Program *",
    lbl_kelas: "Class *",
    btn_kirim_remedial: "Submit Remedial Registration",
    skor_badge: "SCORE VERIFICATION",
    skor_title: "Check TOEFL Prediction Score Results",
    skor_sub: "Enter your Student ID (NIM) to check your Listening, Structure, Reading, and Total Score details.",
    btn_cek_skor: "Check Score Now",
    sspect_tbl1_badge: "SSPECT EXAMINATION SCHEDULE",
    sspect_tbl1_title: "SSPECT Exam Schedule by Class",
    toeic_badge: "INTERNATIONAL CERTIFICATION SERVICE • TOEIC",
    toeic_heading: "TOEIC General Information & Official Announcements",
    toeic_sub: "Information center for TOEIC testing at POLNES along with official mandatory participant rosters and test result files uploaded by staff.",
    toeic_info1_t: "What is the TOEIC Test?",
    toeic_info1_d: "The Test of English for International Communication (TOEIC) is an international standard exam measuring English communication skills in the global workplace.",
    toeic_info2_t: "Mandatory TOEIC Participants",
    toeic_info2_d: "The roster of students required to participate in the TOEIC certification program is published via official announcements below by UPA Bahasa staff.",
    toeic_info3_t: "Official Result Publication",
    toeic_info3_d: "Once testing concludes and score reports are received from the central organizer, staff publish the official result documents on this portal.",
    toeic_files_title: "TOEIC Official Announcements & Publications",
    btn_back_toeic: "Back to TOEIC Announcements",
    btn_download_doc: "Download / Open Document",
    footer_copyright: "© 2026 UPA Bahasa • State Polytechnic of Samarinda. All rights reserved."
  }
};

window.currentLang = 'id';

function setLanguage(lang) {
  window.currentLang = lang;
  localStorage.setItem('upa_public_lang', lang);

  const btnId = document.getElementById('btnLangId');
  const btnEn = document.getElementById('btnLangEn');
  if (btnId && btnEn) {
    btnId.className = lang === 'id'
      ? 'px-1.5 py-0.5 rounded bg-white/25 text-white font-extrabold transition-all'
      : 'px-1.5 py-0.5 rounded text-emerald-100 hover:text-white font-semibold transition-all';
    btnEn.className = lang === 'en'
      ? 'px-1.5 py-0.5 rounded bg-white/25 text-white font-extrabold transition-all'
      : 'px-1.5 py-0.5 rounded text-emerald-100 hover:text-white font-semibold transition-all';
  }

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  const searchToefl = document.getElementById('inputCariMahasiswaToefl');
  const searchSspect = document.getElementById('inputCariMahasiswaSspect');
  const searchToeic = document.getElementById('inputCariFileToeic');
  if (searchToefl) searchToefl.placeholder = lang === 'en' ? 'Search Student Name or NIM...' : 'Cari Nama atau NIM...';
  if (searchSspect) searchSspect.placeholder = lang === 'en' ? 'Search Student Name or NIM...' : 'Cari Nama atau NIM...';
  if (searchToeic) searchToeic.placeholder = lang === 'en' ? 'Search announcement title...' : 'Cari judul pengumuman...';
}

// ==================== 2. NAVIGASI MEGA MENU & ROUTING TAB LAYANAN TES ====================
function tutupSemuaMegaMenu() {
  const el = document.getElementById('menuLayanan');
  if (el) el.classList.add('hidden');
}

function toggleMegaMenu(menuId, event) {
  if (event) event.stopPropagation();
  const target = document.getElementById(menuId);
  if (!target) return;
  const isHidden = target.classList.contains('hidden');
  tutupSemuaMegaMenu();
  if (isHidden) {
    target.classList.remove('hidden');
  }
}

document.addEventListener('click', (e) => {
  const w = document.getElementById('wrapMenuLayanan');
  if (w && !w.contains(e.target)) {
    tutupSemuaMegaMenu();
  }
});

function toggleMobileNav() {
  const panel = document.getElementById('mobileNavPanel');
  if (panel) panel.classList.toggle('hidden');
}

function bukaTabLayanan(namaTab, targetSectionId = null) {
  tutupSemuaMegaMenu();

  const views = ['viewToefl', 'viewSspect', 'viewToeic', 'viewToeicDetail'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });

  const btnMap = {
    toefl: document.getElementById('btnTabToefl'),
    sspect: document.getElementById('btnTabSspect'),
    toeic: document.getElementById('btnTabToeic')
  };
  Object.keys(btnMap).forEach(k => {
    const btn = btnMap[k];
    if (!btn) return;
    btn.className = k === namaTab
      ? 'px-4 py-1.5 rounded-full bg-[#169C53] text-white text-xs font-extrabold transition-all'
      : 'px-4 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#169C53] text-xs font-extrabold transition-all';
  });

  const url = new URL(window.location);
  url.searchParams.set('tab', namaTab);
  if (targetSectionId) {
    url.hash = targetSectionId;
  } else {
    url.hash = '';
  }
  window.history.replaceState({}, '', url);

  if (namaTab === 'sspect') {
    document.getElementById('viewSspect').classList.remove('hidden');
    tutupDetailPesertaSspect();
    muatDataSspect();
    if (targetSectionId) {
      setTimeout(() => {
        const el = document.getElementById(targetSectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else if (namaTab === 'toeic') {
    document.getElementById('viewToeic').classList.remove('hidden');
    muatFilePengumumanToeic();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('viewToefl').classList.remove('hidden');
    tutupDetailPesertaToefl();
    muatJadwalToefl();
    muatJadwalRemedial();

    if (targetSectionId) {
      setTimeout(() => {
        const el = document.getElementById(targetSectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function formatTanggalIndo(tglStr) {
  if (!tglStr) return '-';
  const d = new Date(tglStr);
  if (isNaN(d.getTime())) return tglStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function dapatkanProdiAkurat(kelasStr, prodiJadwal, daftarPesertaDb) {
  const kUpper = String(kelasStr || '').trim().toUpperCase();

  if (Array.isArray(daftarPesertaDb) && kUpper) {
    const mhsCocok = daftarPesertaDb.find(m =>
      String(m.nama_kelas || m.kelas || '').trim().toUpperCase() === kUpper &&
      (m.prodi || m.program_studi)
    );
    if (mhsCocok) {
      return mhsCocok.prodi || mhsCocok.program_studi;
    }
  }

  if (prodiJadwal && prodiJadwal !== '-') return prodiJadwal;

  if (kUpper.includes('AKS')) return 'D3 - AKUNTANSI';
  if (kUpper.includes('UPW')) return 'D4 - USAHA PERJALANAN WISATA';
  if (kUpper.includes('TNK')) return 'D3 - TEKNIKA';
  if (kUpper.includes('NTK')) return 'D3 - NAUTIKA';
  if (kUpper.includes('KPN')) return 'D3 - KETATALAKSANAAN PELAYARAN NIAGA';
  if (kUpper.includes('TKM')) return 'D3 - TEKNIK KIMIA';
  if (kUpper.includes('TI') || kUpper.includes('TRPL')) return 'TEKNOLOGI INFORMASI';
  if (kUpper.includes('SPL') || kUpper.includes('SIP')) return 'TEKNIK SIPIL';
  if (kUpper.includes('ELK') || kUpper.includes('LST')) return 'TEKNIK ELEKTRO';
  if (kUpper.includes('MSN')) return 'TEKNIK MESIN';
  if (kUpper.includes('ADM') || kUpper.includes('MBP')) return 'ADMINISTRASI BISNIS';
  return 'Politeknik Negeri Samarinda';
}

function isJadwalSudahDiLog(item) {
  const st = String(item.status || item.status_log || '').toUpperCase();
  if (['SELESAI', 'LOGGED', 'ARSIP', 'ARCHIVED', 'MATCHED', 'DONE', 'TERARSIP'].includes(st)) {
    return true;
  }
  if (item.is_logged === true || item.sudah_log === true) {
    return true;
  }
  return false;
}

// ==================== 3. JADWAL KELAS & DAFTAR MAHASISWA TOEFL ====================
window.jadwalKelasToeflGlobal = [];
window.semuaMahasiswaToeflGlobal = [];
window.mahasiswaKelasTerpilihToefl = [];

async function muatJadwalToefl() {
  const tbodyKelas = document.getElementById('tbodyJadwalKelasToefl');
  if (!tbodyKelas) return;

  tbodyKelas.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400 italic">Memuat jadwal kelas TOEFL...</td></tr>`;

  try {
    if (!window.supabaseClient) {
      tbodyKelas.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-rose-500 font-semibold">Koneksi Supabase belum terpasang.</td></tr>`;
      return;
    }

    const [resJadwal, resPeserta] = await Promise.all([
      window.supabaseClient.from('jadwal_log').select('*').order('tanggal', { ascending: true }),
      window.supabaseClient.from('peserta_ujian').select('*').order('id_meja', { ascending: true })
    ]);

    if (resJadwal.error) throw resJadwal.error;
    if (resPeserta.error) throw resPeserta.error;

    const dataJadwal = resJadwal.data || [];
    const dataPeserta = resPeserta.data || [];

    const jadwalAktif = dataJadwal.filter(item => {
      if (isJadwalSudahDiLog(item)) return false;
      const jenis = String(item.jenis_tes || item.jenis_ujian || item.kategori || 'TOEFL').toUpperCase();
      const status = String(item.status || '').toUpperCase();
      if (jenis.includes('SSPECT')) return false;
      if (jenis.includes('REMEDIAL') || status === 'REMEDIAL') return false;
      return true;
    });

    window.jadwalKelasToeflGlobal = jadwalAktif.map(item => {
      const kelasVal = item.nama_kelas || item.kelas || '-';
      return {
        ...item,
        prodi_akurat: dapatkanProdiAkurat(kelasVal, item.program_studi || item.prodi, dataPeserta)
      };
    });

    const daftarMahasiswaGabungan = [];
    dataPeserta.forEach(mhs => {
      const kelasMhs = String(mhs.nama_kelas || mhs.kelas || '').trim().toUpperCase();
      const jadwalCocok = window.jadwalKelasToeflGlobal.find(j =>
        (mhs.jadwal_id && j.id === mhs.jadwal_id) ||
        String(j.nama_kelas || j.kelas || '').trim().toUpperCase() === kelasMhs
      );

      if (jadwalCocok) {
        daftarMahasiswaGabungan.push({
          id: mhs.id,
          jadwal_id: jadwalCocok.id,
          nim: mhs.nim || mhs.id_meja || '-',
          id_meja: mhs.id_meja || '-',
          nama: mhs.nama || mhs.nama_mahasiswa || '-',
          kelas: jadwalCocok.nama_kelas || jadwalCocok.kelas || mhs.nama_kelas || '-',
          prodi: mhs.prodi || mhs.program_studi || jadwalCocok.prodi_akurat,
          tanggal: formatTanggalIndo(jadwalCocok.tanggal || jadwalCocok.tanggal_ujian),
          sesi: jadwalCocok.sesi || jadwalCocok.sesi_waktu || '-',
          lab: jadwalCocok.ruang_lab || jadwalCocok.lab || '-'
        });
      }
    });

    window.semuaMahasiswaToeflGlobal = daftarMahasiswaGabungan;
    renderTabelJadwalKelasToefl(window.jadwalKelasToeflGlobal);
  } catch (err) {
    console.error(err);
    tbodyKelas.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-rose-500 font-semibold">Gagal memuat jadwal: ${err.message}</td></tr>`;
  }
}

function renderTabelJadwalKelasToefl(list) {
  const tbody = document.getElementById('tbodyJadwalKelasToefl');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-5 py-10 text-center text-slate-400 italic">
          ${window.currentLang === 'en'
            ? 'No active TOEFL Prediction class schedules available.'
            : 'Belum ada jadwal kelas TOEFL Prediction aktif saat ini.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => {
    const kelasVal = item.nama_kelas || item.kelas || '-';
    const prodiVal = item.prodi_akurat || '-';
    const tglVal = formatTanggalIndo(item.tanggal || item.tanggal_ujian);
    const sesiVal = item.sesi || item.sesi_waktu || '-';
    const labVal = item.ruang_lab || item.lab || '-';

    return `
      <tr onclick="pilihKelasDetailToefl('${kelasVal.replace(/'/g, "\\'")}', ${item.id})" class="cursor-pointer hover:bg-emerald-50/60 transition-colors group">
        <td class="px-4 py-4 font-bold text-slate-400">${idx + 1}</td>
        <td class="px-4 py-4 font-extrabold text-slate-900 group-hover:text-[#169C53]">${kelasVal}</td>
        <td class="px-4 py-4 text-slate-700 font-semibold">${prodiVal}</td>
        <td class="px-4 py-4 font-bold text-slate-800">${tglVal}</td>
        <td class="px-4 py-4 text-sky-600 font-bold text-xs">${sesiVal}</td>
        <td class="px-4 py-4 text-center">
          <span class="px-3 py-1 rounded-lg bg-emerald-50 text-[#169C53] font-extrabold text-[11px] border border-emerald-200">
            ${labVal}
          </span>
        </td>
        <td class="px-4 py-4 text-center">
          <button type="button" class="px-3.5 py-1.5 rounded-full bg-[#169C53] group-hover:bg-[#0E7A3F] text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs transition-all">
            <i class="ri-group-line"></i>
            <span>Lihat Peserta</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function pilihKelasDetailToefl(namaKelas, jadwalId) {
  const boxDetail = document.getElementById('boxDetailPesertaToefl');
  const badge = document.getElementById('badgeFilterKelasToefl');
  const inputCari = document.getElementById('inputCariMahasiswaToefl');
  if (!boxDetail) return;

  if (inputCari) inputCari.value = '';

  const filtered = window.semuaMahasiswaToeflGlobal.filter(m =>
    (jadwalId && m.jadwal_id === jadwalId) ||
    String(m.kelas).trim().toUpperCase() === String(namaKelas).trim().toUpperCase()
  );

  window.mahasiswaKelasTerpilihToefl = filtered;

  if (badge) {
    badge.textContent = `Kelas: ${namaKelas} (${filtered.length} Peserta)`;
  }

  boxDetail.classList.remove('hidden');
  renderTabelMahasiswaToefl(filtered);
  boxDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function tutupDetailPesertaToefl() {
  const boxDetail = document.getElementById('boxDetailPesertaToefl');
  if (boxDetail) boxDetail.classList.add('hidden');
  window.mahasiswaKelasTerpilihToefl = [];
}

function filterDaftarMahasiswaToefl() {
  const q = (document.getElementById('inputCariMahasiswaToefl')?.value || '').trim().toLowerCase();
  const filtered = window.mahasiswaKelasTerpilihToefl.filter(m =>
    String(m.nama || '').toLowerCase().includes(q) ||
    String(m.nim || '').toLowerCase().includes(q) ||
    String(m.id_meja || '').toLowerCase().includes(q)
  );
  renderTabelMahasiswaToefl(filtered);
}

function renderTabelMahasiswaToefl(list) {
  const tbody = document.getElementById('tbodyMahasiswaToefl');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-5 py-10 text-center text-slate-400 italic">
          Tidak ada data peserta yang cocok pada kelas ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((m, idx) => `
    <tr class="hover:bg-slate-50/80 transition-colors">
      <td class="px-4 py-3.5 font-bold text-slate-400">${idx + 1}</td>
      <td class="px-4 py-3.5 font-mono font-bold text-slate-800 text-xs">
        <div>${m.nim}</div>
        ${m.id_meja && m.id_meja !== m.nim ? `<div class="text-[10px] text-slate-400">${m.id_meja}</div>` : ''}
      </td>
      <td class="px-4 py-3.5 font-extrabold text-[#169C53] uppercase">${m.nama}</td>
      <td class="px-4 py-3.5">
        <div class="font-extrabold text-slate-900">${m.kelas}</div>
        <div class="text-[11px] text-slate-500">${m.prodi}</div>
      </td>
      <td class="px-4 py-3.5">
        <div class="font-bold text-slate-900">${m.tanggal}</div>
        <div class="text-[11px] text-sky-600 font-bold">${m.sesi}</div>
      </td>
      <td class="px-4 py-3.5 text-center">
        <span class="px-3 py-1 rounded-lg bg-emerald-50 text-[#169C53] font-extrabold text-[11px] border border-emerald-200">
          ${m.lab}
        </span>
      </td>
    </tr>
  `).join('');
}

// ==================== 4. DAFTAR MAHASISWA REMEDIAL TOEFL ====================
window.daftarRemedialGlobal = [];

async function muatJadwalRemedial() {
  const tbody = document.getElementById('tbodyJadwalRemedial');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400 italic">Memuat daftar mahasiswa remedial...</td></tr>`;

  try {
    if (!window.supabaseClient) return;

    const [resAntrean, resJadwal, resPeserta] = await Promise.all([
      window.supabaseClient.from('pendaftaran_remedial').select('*').order('created_at', { ascending: false }),
      window.supabaseClient.from('jadwal_log').select('*').order('tanggal', { ascending: true }),
      window.supabaseClient.from('peserta_ujian').select('*').order('id_meja', { ascending: true })
    ]);

    if (resAntrean.error) throw resAntrean.error;

    const gabungan = [];

    // 1. Peserta remedial yang SUDAH dijadwalkan & dikunci staff di jadwal_log
    const jadwalRemAktif = (resJadwal.data || []).filter(j => {
      if (isJadwalSudahDiLog(j)) return false;
      const jenis = String(j.jenis_tes || '').toUpperCase();
      const st = String(j.status || '').toUpperCase();
      return jenis.includes('REMEDIAL') || st === 'REMEDIAL';
    });

    jadwalRemAktif.forEach(j => {
      const mhsSesi = (resPeserta.data || []).filter(p =>
        p.jadwal_id === j.id ||
        String(p.nama_kelas || '').trim().toUpperCase() === String(j.nama_kelas || '').trim().toUpperCase()
      );
      mhsSesi.forEach(m => {
        gabungan.push({
          nim: m.nim || '-',
          nama_mahasiswa: m.nama || '-',
          program_studi: m.prodi || '-',
          nama_kelas: m.nama_kelas || j.nama_kelas || '-',
          tanggal: j.tanggal,
          sesi: j.sesi || '-',
          ruang_lab: j.ruang_lab || 'TERJADWAL',
          terkunci: true
        });
      });
    });

    // 2. Mahasiswa yang BARU mendaftar & masih menunggu jadwal di tabel antrean
    (resAntrean.data || []).forEach(a => {
      gabungan.push({
        nim: a.nim || '-',
        nama_mahasiswa: a.nama_mahasiswa || '-',
        program_studi: a.program_studi || '-',
        nama_kelas: a.nama_kelas || '-',
        tanggal: null,
        sesi: 'Menunggu Jadwal Staff',
        ruang_lab: 'ANTREAN',
        terkunci: false
      });
    });

    window.daftarRemedialGlobal = gabungan;
    renderTabelRemedial(gabungan);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-rose-500">Gagal memuat jadwal remedial: ${err.message}</td></tr>`;
  }
}

function renderTabelRemedial(list) {
  const tbody = document.getElementById('tbodyJadwalRemedial');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-slate-400 italic">Belum ada mahasiswa peserta remedial aktif terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => {
    const kelasVal = item.nama_kelas || '-';
    const prodiVal = dapatkanProdiAkurat(kelasVal, item.program_studi, []);
    const tglVal = item.tanggal ? formatTanggalIndo(item.tanggal) : 'Belum Dijadwalkan';
    const sesiVal = item.sesi || 'Menunggu Jadwal Staff';
    const labVal = item.ruang_lab || 'ANTREAN';
    const badgeClass = item.terkunci
      ? 'bg-emerald-50 text-[#169C53] border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <td class="px-4 py-4 font-bold text-slate-400">${idx + 1}</td>
        <td class="px-4 py-4 font-mono font-bold text-slate-900">${item.nim || '-'}</td>
        <td class="px-4 py-4 font-extrabold text-[#169C53] uppercase">${item.nama_mahasiswa || '-'}</td>
        <td class="px-4 py-4">
          <div class="font-bold text-slate-900">${kelasVal}</div>
          <div class="text-[11px] text-slate-500">${prodiVal}</div>
        </td>
        <td class="px-4 py-4">
          <div class="font-bold text-slate-900">${tglVal}</div>
          <div class="text-[11px] ${item.terkunci ? 'text-sky-600' : 'text-amber-600'} font-bold">${sesiVal}</div>
        </td>
        <td class="px-4 py-4 text-center">
          <span class="px-2.5 py-1 rounded-full border text-[10px] font-extrabold ${badgeClass}">
            ${labVal}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTabelRemedial() {
  const q = (document.getElementById('inputCariRemedial')?.value || '').toLowerCase();
  const filtered = window.daftarRemedialGlobal.filter(item =>
    String(item.nim || '').toLowerCase().includes(q) ||
    String(item.nama_mahasiswa || '').toLowerCase().includes(q) ||
    String(item.nama_kelas || '').toLowerCase().includes(q)
  );
  renderTabelRemedial(filtered);
}

async function submitPendaftaranRemedial(e) {
  e.preventDefault();
  const nim = document.getElementById('inputRemNim').value.trim();
  const nama = document.getElementById('inputRemNama').value.trim();
  const prodi = document.getElementById('inputRemProdi').value.trim();
  const kelas = document.getElementById('inputRemKelas').value.trim();
  const btn = document.getElementById('btnSubmitRemedial');

  if (!window.supabaseClient) {
    alert("Koneksi Supabase belum terpasang.");
    return;
  }

  btn.disabled = true;
  try {
    const { error } = await window.supabaseClient
      .from('pendaftaran_remedial')
      .insert([{
        nim: nim,
        nama_mahasiswa: nama,
        program_studi: prodi,
        nama_kelas: kelas
      }]);

    if (error) throw error;

    alert(`Pendaftaran remedial untuk ${nama} (NIM: ${nim}) berhasil masuk antrean penjadwalan!`);
    e.target.reset();
    muatJadwalRemedial();
    document.getElementById('sec-jadwal-toefl').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert("Gagal mendaftar remedial: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

// ==================== 5. CEK SKOR TOEFL & SSPECT + SERTIFIKAT RESMI (100% SAMA REKAPAN) ====================
window.dataMahasiswaCekSkorAktif = null;

function ambilNilaiKolomPublik(obj, daftarKey, fallback = null) {
  if (!obj) return fallback;
  for (const key of daftarKey) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "" && String(obj[key]).trim().toUpperCase() !== "NULL") {
      return obj[key];
    }
  }
  return fallback;
}

function ambilAngkaKolomPublik(obj, daftarKey) {
  const raw = ambilNilaiKolomPublik(obj, daftarKey, null);
  if (raw === null) return null;
  const bersih = String(raw).replace(",", ".").trim();
  const num = Number(bersih);
  return !isNaN(num) && num > 0 ? Math.round(num) : null;
}

function normalisasiDataMahasiswaSertifikat(raw) {
  const prodi = ambilNilaiKolomPublik(raw, ["program_studi", "prodi", "kelas"], "-");
  const nama = String(ambilNilaiKolomPublik(raw, ["nama_mahasiswa", "nama", "nama_lengkap"], "-")).toUpperCase();
  const skorSspect = ambilAngkaKolomPublik(raw, ["skor_sspect", "nilai_sspect", "sspect"]);
  const skorLatihan = ambilAngkaKolomPublik(raw, ["skor_latihan", "nilai_latihan", "latihan"]);
  const skorToefl = ambilAngkaKolomPublik(raw, ["skor_toefl", "nilai_toefl", "toefl", "total_skor", "skor"]);
  const rem1 = ambilAngkaKolomPublik(raw, ["remedial_1", "rem_1"]);
  const rem2 = ambilAngkaKolomPublik(raw, ["remedial_2", "rem_2"]);
  const rem3 = ambilAngkaKolomPublik(raw, ["remedial_3", "rem_3"]);

  const daftarToefl = [rem3, rem2, rem1, skorToefl].filter(v => v !== null && v > 0);
  const skorToeflAkhir = daftarToefl.length > 0 ? Math.max(...daftarToefl) : null;

  const jenjang = String(prodi).toUpperCase().includes("D4") ? "D4" : "D3";
  const batasLulus = jenjang === "D4" ? 450 : 400;
  const statusLulus = skorToeflAkhir !== null && skorToeflAkhir >= batasLulus ? "LULUS" : "BELUM LULUS";

  return {
    nim: String(raw.nim || "-").trim(),
    nama_mahasiswa: nama,
    jurusan: ambilNilaiKolomPublik(raw, ["jurusan"], "-"),
    program_studi: prodi,
    jenjang,
    batas_lulus: batasLulus,
    status_lulus: statusLulus,
    skor_sspect: skorSspect,
    skor_latihan: skorLatihan,
    skor_toefl: skorToefl,
    remedial_1: rem1,
    remedial_2: rem2,
    remedial_3: rem3,
    skor_toefl_akhir: skorToeflAkhir,
    listening: ambilAngkaKolomPublik(raw, ["listening", "section_1"]),
    structure: ambilAngkaKolomPublik(raw, ["structure", "section_2"]),
    reading: ambilAngkaKolomPublik(raw, ["reading", "section_3"]),
    sspect_listening: ambilAngkaKolomPublik(raw, ["sspect_listening"]),
    sspect_structure: ambilAngkaKolomPublik(raw, ["sspect_structure"]),
    sspect_reading: ambilAngkaKolomPublik(raw, ["sspect_reading"]),
    tempat_tanggal_lahir: ambilNilaiKolomPublik(raw, ["tempat_tanggal_lahir", "ttl"], "Samarinda, -"),
    tanggal_tes: ambilNilaiKolomPublik(raw, ["tanggal_tes", "tgl_tes"], "04 May 2026"),
    nomor_sertifikat: ambilNilaiKolomPublik(raw, ["nomor_sertifikat", "no_sertifikat"], "")
  };
}

async function cariSkorToefl(e) {
  e.preventDefault();
  const nim = document.getElementById('inputCariNimSkor').value.trim();
  const box = document.getElementById('hasilCekSkorBox');
  box.classList.remove('hidden');
  box.innerHTML = `<span class="text-slate-500 italic">Mencari data skor untuk NIM ${nim}...</span>`;

  try {
    if (!window.supabaseClient) throw new Error("Koneksi Supabase tidak tersedia.");

    const { data, error } = await window.supabaseClient
      .from('arsip_master_rekapan')
      .select('*')
      .eq('nim', nim)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      box.innerHTML = `<div class="text-rose-600 font-bold">Data skor untuk NIM <span class="font-mono">${nim}</span> belum ditemukan dalam arsip rekapan.</div>`;
      return;
    }

    const m = normalisasiDataMahasiswaSertifikat(data);
    window.dataMahasiswaCekSkorAktif = m;

    const siapSertifikatToefl = m.skor_latihan !== null && m.skor_toefl_akhir !== null;
    const badgeLulus = m.status_lulus === "LULUS"
      ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0E7A3F] text-[10px] font-extrabold border border-emerald-200">LULUS (Batas ${m.batas_lulus})</span>`
      : `<span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-extrabold border border-amber-200">BELUM LULUS (Batas ${m.batas_lulus})</span>`;

    const tombolSertifikatHtml = siapSertifikatToefl
      ? `<div class="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
           <span class="text-[11px] text-slate-500 font-semibold">Sertifikat resmi tersedia (Latihan &amp; TOEFL terpenuhi).</span>
           <button type="button" onclick="unduhSertifikatPublik('TOEFL')" class="px-4 py-2 rounded-xl bg-[#169C53] hover:bg-[#0E7A3F] text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-all">
             <i class="ri-award-fill text-sm"></i>
             <span>Unduh Sertifikat TOEFL</span>
           </button>
         </div>`
      : `<div class="pt-3 border-t border-slate-200 text-[11px] text-slate-400 italic">
           Sertifikat TOEFL belum dapat diunduh karena data nilai Latihan atau TOEFL Utama belum lengkap.
         </div>`;

    box.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="font-extrabold text-slate-900 text-sm">${m.nama_mahasiswa}</div>
            ${badgeLulus}
          </div>
          <div class="text-[11px] text-slate-500 font-mono mt-0.5">NIM: ${m.nim} • ${m.program_studi}</div>
        </div>
        <div class="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-[#0E7A3F] font-extrabold text-sm self-start sm:self-auto">
          Skor Akhir: ${m.skor_toefl_akhir ?? '-'}
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-center">
        <div class="p-2 rounded-xl bg-white border border-slate-200">
          <div class="text-[10px] text-slate-400 font-bold uppercase">Latihan</div>
          <div class="font-extrabold text-slate-800 text-xs mt-0.5">${m.skor_latihan ?? '-'}</div>
        </div>
        <div class="p-2 rounded-xl bg-white border border-slate-200">
          <div class="text-[10px] text-slate-400 font-bold uppercase">TOEFL Utama</div>
          <div class="font-extrabold text-slate-800 text-xs mt-0.5">${m.skor_toefl ?? '-'}</div>
        </div>
        <div class="p-2 rounded-xl bg-white border border-slate-200">
          <div class="text-[10px] text-slate-400 font-bold uppercase">Remedial 1</div>
          <div class="font-extrabold text-slate-800 text-xs mt-0.5">${m.remedial_1 ?? '-'}</div>
        </div>
        <div class="p-2 rounded-xl bg-white border border-slate-200">
          <div class="text-[10px] text-slate-400 font-bold uppercase">Remedial 2</div>
          <div class="font-extrabold text-slate-800 text-xs mt-0.5">${m.remedial_2 ?? '-'}</div>
        </div>
        <div class="p-2 rounded-xl bg-white border border-slate-200 col-span-2 sm:col-span-1">
          <div class="text-[10px] text-slate-400 font-bold uppercase">Remedial 3</div>
          <div class="font-extrabold text-slate-800 text-xs mt-0.5">${m.remedial_3 ?? '-'}</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 pt-2 text-center">
        <div class="p-2.5 rounded-xl bg-white border border-slate-200">
          <div class="text-[10px] text-slate-400 font-bold uppercase">Listening</div>
          <div class="font-extrabold text-slate-800 text-sm mt-0.5">${m.listening ?? '-'}</div>
        </div>
        <div class="p-2.5 rounded-xl bg-white border border-slate-200">
          <div class="text-[10px] text-slate-400 font-bold uppercase">Structure</div>
          <div class="font-extrabold text-slate-800 text-sm mt-0.5">${m.structure ?? '-'}</div>
        </div>
        <div class="p-2.5 rounded-xl bg-white border border-slate-200">
          <div class="text-[10px] text-slate-400 font-bold uppercase">Reading</div>
          <div class="font-extrabold text-slate-800 text-sm mt-0.5">${m.reading ?? '-'}</div>
        </div>
      </div>

      ${tombolSertifikatHtml}
    `;
  } catch (err) {
    box.innerHTML = `<div class="text-rose-600 font-semibold">Terjadi kesalahan: ${err.message}</div>`;
  }
}

async function cariSkorSspect(e) {
  e.preventDefault();
  const nim = document.getElementById('inputCariNimSspect').value.trim();
  const box = document.getElementById('hasilCekSkorSspectBox');
  if (!box) return;

  box.classList.remove('hidden');
  box.innerHTML = `<span class="text-slate-500 italic">Mencari data skor SSPECT untuk NIM ${nim}...</span>`;

  try {
    if (!window.supabaseClient) throw new Error("Koneksi Supabase tidak tersedia.");

    const { data, error } = await window.supabaseClient
      .from('arsip_master_rekapan')
      .select('*')
      .eq('nim', nim)
      .maybeSingle();

    if (error) throw error;

    if (!data || !ambilAngkaKolomPublik(data, ["skor_sspect", "nilai_sspect", "sspect"])) {
      box.innerHTML = `<div class="text-rose-600 font-bold">Data skor SSPECT untuk NIM <span class="font-mono">${nim}</span> belum ditemukan dalam arsip rekapan.</div>`;
      return;
    }

    const m = normalisasiDataMahasiswaSertifikat(data);
    window.dataMahasiswaCekSkorAktif = m;

    box.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div class="font-extrabold text-slate-900 text-sm">${m.nama_mahasiswa}</div>
          <div class="text-[11px] text-slate-500 font-mono mt-0.5">NIM: ${m.nim} • ${m.program_studi}</div>
        </div>
        <div class="px-3.5 py-1.5 rounded-xl bg-sky-100 text-sky-800 font-extrabold text-sm self-start sm:self-auto">
          Skor SSPECT: ${m.skor_sspect}
        </div>
      </div>
      <div class="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span class="text-[11px] text-slate-500 font-semibold">Sertifikat resmi SSPECT Placement Test siap dicetak / disimpan PDF.</span>
        <button type="button" onclick="unduhSertifikatPublik('SSPECT')" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-all">
          <i class="ri-award-line text-sm"></i>
          <span>Unduh Sertifikat SSPECT</span>
        </button>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<div class="text-rose-600 font-semibold">Terjadi kesalahan: ${err.message}</div>`;
  }
}

function unduhSertifikatPublik(jenisSertifikat) {
  const m = window.dataMahasiswaCekSkorAktif;
  if (!m) return;
  cetakHalamanSertifikatResmiPublik(m, jenisSertifikat);
}

function formatProgramStudySertifikatPublik(prodiRaw) {
  const teks = String(prodiRaw || "-").trim();
  if (teks === "-") return "-";
  return teks
    .toLowerCase()
    .replace(/\bd3\b/gi, "D3")
    .replace(/\bd4\b/gi, "D4")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function cetakHalamanSertifikatResmiPublik(m, jenisSertifikat = "TOEFL") {
  const isSspect = String(jenisSertifikat).toUpperCase() === "SSPECT";

  const jenisTesText = isSspect ? "SSPECT Placement Test" : "Toefl Prediction Test";
  const defaultKodeSurat = isSspect ? "SSPECT" : "TOEFL-P";
  const nomor = m.nomor_sertifikat || `0355 / PL7.18 / UPA.BAHASA / ${defaultKodeSurat} / ${new Date().getFullYear()}`;
  const ttl = m.tempat_tanggal_lahir || "Samarinda, -";
  const tglTes = m.tanggal_tes || "04 May 2026";
  const prodiCantik = formatProgramStudySertifikatPublik(m.program_studi);

  const sec1 = isSspect ? (m.sspect_listening ?? m.listening ?? "-") : (m.listening ?? "-");
  const sec2 = isSspect ? (m.sspect_structure ?? m.structure ?? "-") : (m.structure ?? "-");
  const sec3 = isSspect ? (m.sspect_reading ?? m.reading ?? "-") : (m.reading ?? "-");
  const totalSkor = isSspect ? (m.skor_sspect ?? "-") : (m.skor_toefl_akhir ?? "-");

  const logoUrl = new URL("./img/polnes.png", window.location.href).href;
  const bgGedungUrl = new URL("./img/sertif.jpg", window.location.href).href;

  const urlValidasi = new URL(
    `./validasi-sertifikat.html?nim=${encodeURIComponent(m.nim)}&jenis=${encodeURIComponent(isSspect ? "SSPECT" : "TOEFL")}`,
    window.location.href
  ).href;

  let htmlTabelSkor = "";
  if (isSspect) {
    htmlTabelSkor = `
      <table class="score-grid">
        <thead>
          <tr>
            <th>Listening<br />Comprehension</th>
            <th>Reading<br />Comprehension</th>
            <th style="font-style:normal;">Total Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${sec1}</td>
            <td>${sec3}</td>
            <td>${totalSkor}</td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    htmlTabelSkor = `
      <table class="score-grid">
        <thead>
          <tr>
            <th>Listening<br />Comprehension</th>
            <th>Structure and<br />Written Expression</th>
            <th>Reading<br />Comprehension</th>
            <th style="font-style:normal;">Total Score</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${sec1}</td>
            <td>${sec2}</td>
            <td>${sec3}</td>
            <td>${totalSkor}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const win = window.open("", "_blank", "width=1160,height=820");
  if (!win) {
    alert("Pop-up diblokir browser. Izinkan pop-up untuk mencetak/mengunduh sertifikat PDF.");
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>Sertifikat ${isSspect ? "SSPECT" : "TOEFL"} - ${m.nama_mahasiswa} (${m.nim})</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #cbd5e1;
          font-family: 'Times New Roman', Times, serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .toolbar-cetak {
          width: 297mm;
          background: #0f172a;
          color: #fff;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: Arial, sans-serif;
          font-size: 13px;
        }
        .toolbar-cetak button {
          padding: 7px 16px;
          border-radius: 6px;
          border: none;
          font-weight: bold;
          cursor: pointer;
          background: #169C53;
          color: #fff;
        }
        .page-a4 {
          width: 297mm;
          height: 210mm;
          position: relative;
          background: #ffffff;
          overflow: hidden;
        }
        .outer-frame {
          position: absolute;
          top: 9mm;
          left: 11mm;
          right: 11mm;
          bottom: 9mm;
          border: 2.2px solid #2b6e44;
          border-top-left-radius: 46mm;
          border-bottom-right-radius: 46mm;
          overflow: hidden;
          background: #ffffff;
        }
        .watermark-gedung {
          position: absolute;
          inset: 0;
          background-image: url('${bgGedungUrl}');
          background-size: cover;
          background-position: center;
          opacity: 0.16;
          filter: saturate(0.85) contrast(1.05);
          pointer-events: none;
        }
        .doc-code {
          position: absolute;
          top: 4.5mm;
          right: 12mm;
          font-family: Arial, sans-serif;
          font-size: 7.5pt;
          color: #334155;
          letter-spacing: 0.3px;
        }
        .kop-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          padding: 5.5mm 14mm 3mm 26mm;
          gap: 5mm;
        }
        .kop-header img {
          width: 17mm;
          height: 17mm;
          object-fit: contain;
        }
        .kop-text {
          font-family: 'Times New Roman', Times, serif;
          color: #1e293b;
          line-height: 1.2;
        }
        .kop-text .ministry {
          font-size: 11pt;
          font-weight: bold;
          letter-spacing: 0.4px;
        }
        .kop-text .campus {
          font-size: 12.5pt;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .kop-text .unit {
          font-size: 11pt;
          font-weight: bold;
          letter-spacing: 0.4px;
        }
        .cert-body {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1mm 24mm 0 24mm;
          color: #111827;
        }
        .cert-title {
          text-align: center;
          margin-bottom: 2.5mm;
        }
        .cert-title h1 {
          margin: 0;
          font-size: 16pt;
          font-weight: bold;
          letter-spacing: 0.8px;
        }
        .cert-title .no-surat {
          font-size: 10.5pt;
          margin-top: 1mm;
        }
        .presented-to {
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 2.5mm;
        }
        .biodata-table {
          width: 155mm;
          border-collapse: collapse;
          font-size: 11pt;
          margin-bottom: 3mm;
        }
        .biodata-table td {
          padding: 1mm 1.5mm;
          vertical-align: top;
        }
        .biodata-table td.lbl {
          width: 46mm;
        }
        .biodata-table td.sep {
          width: 5mm;
          text-align: center;
        }
        .biodata-table td.val-name {
          font-weight: bold;
          font-size: 12.5pt;
          text-transform: uppercase;
        }
        .achieved-line {
          font-size: 11pt;
          font-style: italic;
          margin-bottom: 2.5mm;
        }
        .score-grid {
          width: 172mm;
          border-collapse: collapse;
          text-align: center;
          font-size: 10.5pt;
          margin-bottom: 4.5mm;
        }
        .score-grid th, .score-grid td {
          border: 1.2px solid #1e293b;
          padding: 2mm 3mm;
          background: rgba(255, 255, 255, 0.55);
        }
        .score-grid th {
          font-weight: bold;
          font-style: italic;
        }
        .score-grid td {
          font-size: 12.5pt;
          font-weight: bold;
        }
        .bottom-sign-row {
          width: 172mm;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-left: 8mm;
        }
        .ttd-box {
          font-size: 10.5pt;
          line-height: 1.35;
        }
        .ttd-space {
          height: 15mm;
        }
        .qr-verify-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: rgba(255, 255, 255, 0.85);
          padding: 2mm;
          border-radius: 2mm;
          border: 0.8px solid #cbd5e1;
        }
        .qr-verify-box span {
          font-family: Arial, sans-serif;
          font-size: 6.5pt;
          font-weight: bold;
          color: #1e293b;
          margin-top: 1mm;
        }
        .footer-kampus {
          position: absolute;
          left: 14mm;
          bottom: 3.5mm;
          z-index: 2;
          font-size: 7.5pt;
          font-style: italic;
          color: #334155;
          line-height: 1.3;
        }
        @media print {
          body { background: none; }
          .toolbar-cetak { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar-cetak">
        <div>
          <strong>Sertifikat Resmi ${isSspect ? "SSPECT" : "TOEFL"}</strong> &mdash; ${m.nama_mahasiswa} (${m.nim})
        </div>
        <button type="button" onclick="window.print()">Cetak / Simpan PDF (A4 Landscape)</button>
      </div>

      <div class="page-a4">
        <div class="doc-code">FM-P2M-04-01-01A/R3</div>

        <div class="outer-frame">
          <div class="watermark-gedung"></div>

          <div class="kop-header">
            <img src="${logoUrl}" alt="Logo POLNES" />
            <div class="kop-text">
              <div class="ministry">KEMENTERIAN PENDIDIKAN, TINGGI, SAINS, DAN TEKNOLOGI</div>
              <div class="campus">POLITEKNIK NEGERI SAMARINDA</div>
              <div class="unit">UPA. BAHASA</div>
            </div>
          </div>

          <div class="cert-body">
            <div class="cert-title">
              <h1>CERTIFICATE OF ACHIEVEMENT</h1>
              <div class="no-surat">No : ${nomor}</div>
            </div>

            <div class="presented-to">This is presented to</div>

            <table class="biodata-table">
              <tr>
                <td class="lbl">Name</td>
                <td class="sep">:</td>
                <td class="val-name">${m.nama_mahasiswa}</td>
              </tr>
              <tr>
                <td class="lbl">NIM</td>
                <td class="sep">:</td>
                <td>${m.nim}</td>
              </tr>
              <tr>
                <td class="lbl">Place, date of birth</td>
                <td class="sep">:</td>
                <td>${ttl}</td>
              </tr>
              <tr>
                <td class="lbl">Program Study</td>
                <td class="sep">:</td>
                <td>${prodiCantik}</td>
              </tr>
              <tr>
                <td class="lbl">Date of test taken</td>
                <td class="sep">:</td>
                <td>${tglTes}</td>
              </tr>
            </table>

            <div class="achieved-line">
              Achieved the following score on <span>${jenisTesText}</span>
            </div>

            ${htmlTabelSkor}

            <div class="bottom-sign-row">
              <div class="ttd-box">
                <div>Samarinda, ${tglTes}</div>
                <div>Head of UPA. Bahasa</div>
                <div class="ttd-space"></div>
                <div><b><u>Dwi Titi Maesaroh, S.Pd., M.Pd.</u></b></div>
                <div>NIP. 198901172024062002</div>
              </div>

              <div class="qr-verify-box">
                <div id="qrcodeContainer"></div>
                <span>Scan to Verify Certificate</span>
              </div>
            </div>
          </div>

          <div class="footer-kampus">
            <div>Jalan Dr. Ciptomangunkusumo Kampus Gunung Panjang Samarinda 75131</div>
            <div>Telepon: 0541-260588, 260553, 262018 FAX 260355</div>
            <div>Laman : www.polnes.ac.id Surel : bahasa@polnes.ac.id ; polnes@polnes.ac.id</div>
          </div>
        </div>
      </div>

      <script>
        new QRCode(document.getElementById("qrcodeContainer"), {
          text: "${urlValidasi}",
          width: 68,
          height: 68,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      </script>
    </body>
    </html>
  `);
  win.document.close();
}

// ==================== 6. JADWAL KELAS & DAFTAR MAHASISWA SSPECT ====================
window.jadwalKelasSspectGlobal = [];
window.semuaMahasiswaSspectGlobal = [];
window.mahasiswaKelasTerpilihSspect = [];

async function muatDataSspect() {
  const tbodyKelas = document.getElementById('tbodyJadwalKelasSspect');
  if (!tbodyKelas) return;

  tbodyKelas.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400 italic">Memuat jadwal kelas SSPECT...</td></tr>`;

  try {
    if (!window.supabaseClient) {
      tbodyKelas.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-rose-500 font-semibold">Koneksi Supabase belum terpasang.</td></tr>`;
      return;
    }

    const [resJadwal, resPeserta] = await Promise.all([
      window.supabaseClient.from('jadwal_log').select('*').order('tanggal', { ascending: true }),
      window.supabaseClient.from('peserta_ujian').select('*').order('id_meja', { ascending: true })
    ]);

    if (resJadwal.error) throw resJadwal.error;
    if (resPeserta.error) throw resPeserta.error;

    const dataJadwal = resJadwal.data || [];
    const dataPeserta = resPeserta.data || [];

    const sspectAktif = dataJadwal.filter(item => {
      if (isJadwalSudahDiLog(item)) return false;
      const jenis = String(item.jenis_tes || item.jenis_ujian || item.kategori || '').toUpperCase();
      return jenis.includes('SSPECT');
    });

    window.jadwalKelasSspectGlobal = sspectAktif.map(item => {
      const kelasVal = item.nama_kelas || item.kelas || '-';
      return {
        ...item,
        prodi_akurat: dapatkanProdiAkurat(kelasVal, item.program_studi || item.prodi, dataPeserta)
      };
    });

    const daftarMahasiswaSspect = [];
    dataPeserta.forEach(mhs => {
      const kelasMhs = String(mhs.nama_kelas || mhs.kelas || '').trim().toUpperCase();
      const jadwalCocok = window.jadwalKelasSspectGlobal.find(j =>
        (mhs.jadwal_id && j.id === mhs.jadwal_id) ||
        String(j.nama_kelas || j.kelas || '').trim().toUpperCase() === kelasMhs
      );

      if (jadwalCocok) {
        daftarMahasiswaSspect.push({
          id: mhs.id,
          jadwal_id: jadwalCocok.id,
          nim: mhs.nim || mhs.id_meja || '-',
          id_meja: mhs.id_meja || '-',
          nama: mhs.nama || mhs.nama_mahasiswa || '-',
          kelas: jadwalCocok.nama_kelas || jadwalCocok.kelas || mhs.nama_kelas || '-',
          prodi: mhs.prodi || mhs.program_studi || jadwalCocok.prodi_akurat,
          tanggal: formatTanggalIndo(jadwalCocok.tanggal || jadwalCocok.tanggal_ujian),
          sesi: jadwalCocok.sesi || jadwalCocok.sesi_waktu || '-',
          lab: jadwalCocok.ruang_lab || jadwalCocok.lab || '-'
        });
      }
    });

    window.semuaMahasiswaSspectGlobal = daftarMahasiswaSspect;
    renderTabelJadwalKelasSspect(window.jadwalKelasSspectGlobal);
  } catch (err) {
    console.error(err);
    tbodyKelas.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-rose-500 font-semibold">Gagal memuat jadwal SSPECT: ${err.message}</td></tr>`;
  }
}

function renderTabelJadwalKelasSspect(list) {
  const tbody = document.getElementById('tbodyJadwalKelasSspect');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-5 py-10 text-center text-slate-400 italic">
          ${window.currentLang === 'en'
            ? 'No active SSPECT class schedules available.'
            : 'Belum ada jadwal kelas SSPECT aktif saat ini.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((item, idx) => {
    const kelasVal = item.nama_kelas || item.kelas || '-';
    const prodiVal = item.prodi_akurat || '-';
    const tglVal = formatTanggalIndo(item.tanggal || item.tanggal_ujian);
    const sesiVal = item.sesi || item.sesi_waktu || '-';
    const labVal = item.ruang_lab || item.lab || '-';

    return `
      <tr onclick="pilihKelasDetailSspect('${kelasVal.replace(/'/g, "\\'")}', ${item.id})" class="cursor-pointer hover:bg-emerald-50/60 transition-colors group">
        <td class="px-4 py-4 font-bold text-slate-400">${idx + 1}</td>
        <td class="px-4 py-4 font-extrabold text-slate-900 group-hover:text-[#169C53]">${kelasVal}</td>
        <td class="px-4 py-4 text-slate-700 font-semibold">${prodiVal}</td>
        <td class="px-4 py-4 font-bold text-slate-800">${tglVal}</td>
        <td class="px-4 py-4 text-sky-600 font-bold text-xs">${sesiVal}</td>
        <td class="px-4 py-4 text-center">
          <span class="px-3 py-1 rounded-lg bg-emerald-50 text-[#169C53] font-extrabold text-[11px] border border-emerald-200">
            ${labVal}
          </span>
        </td>
        <td class="px-4 py-4 text-center">
          <button type="button" class="px-3.5 py-1.5 rounded-full bg-[#169C53] group-hover:bg-[#0E7A3F] text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs transition-all">
            <i class="ri-group-line"></i>
            <span>Lihat Peserta</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function pilihKelasDetailSspect(namaKelas, jadwalId) {
  const boxDetail = document.getElementById('boxDetailPesertaSspect');
  const badge = document.getElementById('badgeFilterKelasSspect');
  const inputCari = document.getElementById('inputCariMahasiswaSspect');
  if (!boxDetail) return;

  if (inputCari) inputCari.value = '';

  const filtered = window.semuaMahasiswaSspectGlobal.filter(m =>
    (jadwalId && m.jadwal_id === jadwalId) ||
    String(m.kelas).trim().toUpperCase() === String(namaKelas).trim().toUpperCase()
  );

  window.mahasiswaKelasTerpilihSspect = filtered;

  if (badge) {
    badge.textContent = `Kelas: ${namaKelas} (${filtered.length} Peserta)`;
  }

  boxDetail.classList.remove('hidden');
  renderTabelMahasiswaSspect(filtered);
  boxDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function tutupDetailPesertaSspect() {
  const boxDetail = document.getElementById('boxDetailPesertaSspect');
  if (boxDetail) boxDetail.classList.add('hidden');
  window.mahasiswaKelasTerpilihSspect = [];
}

function filterDaftarMahasiswaSspect() {
  const q = (document.getElementById('inputCariMahasiswaSspect')?.value || '').trim().toLowerCase();
  const filtered = window.mahasiswaKelasTerpilihSspect.filter(m =>
    String(m.nama || '').toLowerCase().includes(q) ||
    String(m.nim || '').toLowerCase().includes(q) ||
    String(m.id_meja || '').toLowerCase().includes(q)
  );
  renderTabelMahasiswaSspect(filtered);
}

function renderTabelMahasiswaSspect(list) {
  const tbody = document.getElementById('tbodyMahasiswaSspect');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-5 py-10 text-center text-slate-400 italic">
          Tidak ada data peserta SSPECT yang cocok pada kelas ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((m, idx) => `
    <tr class="hover:bg-slate-50/80 transition-colors">
      <td class="px-4 py-3.5 font-bold text-slate-400">${idx + 1}</td>
      <td class="px-4 py-3.5 font-mono font-bold text-slate-800 text-xs">
        <div>${m.nim}</div>
        ${m.id_meja && m.id_meja !== m.nim ? `<div class="text-[10px] text-slate-400">${m.id_meja}</div>` : ''}
      </td>
      <td class="px-4 py-3.5 font-extrabold text-[#169C53] uppercase">${m.nama}</td>
      <td class="px-4 py-3.5">
        <div class="font-extrabold text-slate-900">${m.kelas}</div>
        <div class="text-[11px] text-slate-500">${m.prodi}</div>
      </td>
      <td class="px-4 py-3.5">
        <div class="font-bold text-slate-900">${m.tanggal}</div>
        <div class="text-[11px] text-sky-600 font-bold">${m.sesi}</div>
      </td>
      <td class="px-4 py-3.5 text-center">
        <span class="px-3 py-1 rounded-lg bg-emerald-50 text-[#169C53] font-extrabold text-[11px] border border-emerald-200">
          ${m.lab}
        </span>
      </td>
    </tr>
  `).join('');
}

// ==================== 7. PENGUMUMAN & FILE TOEIC GAYA BERITA ====================
window.daftarFileToeicGlobal = [];
const DEFAULT_IMG_TOEIC = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80";

async function muatFilePengumumanToeic() {
  const container = document.getElementById('containerBeritaToeic');
  if (!container) return;

  try {
    if (!window.supabaseClient) {
      container.innerHTML = `<div class="bg-white rounded-3xl p-8 text-center text-rose-500 text-xs font-semibold border border-slate-200">Koneksi Supabase belum terpasang.</div>`;
      return;
    }

    const { data, error } = await window.supabaseClient
      .from('toeic_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    window.daftarFileToeicGlobal = data || [];
    renderBeritaToeic(window.daftarFileToeicGlobal);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs italic border border-slate-200">Belum ada pengumuman TOEIC yang dipublikasikan oleh staf.</div>`;
  }
}

function renderBeritaToeic(list) {
  const container = document.getElementById('containerBeritaToeic');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="bg-white rounded-3xl p-10 text-center text-slate-400 text-xs italic border border-slate-200">Belum ada pengumuman TOEIC yang dipublikasikan oleh staf.</div>`;
    return;
  }

  const headline = list[0];
  const headlineImg = headline.gambar_url || DEFAULT_IMG_TOEIC;
  const headlineKat = headline.kategori || 'Pengumuman TOEIC';

  let html = `
    <div onclick="bukaDetailPengumumanToeic(${headline.id})" class="cursor-pointer group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-[#169C53] shadow-sm hover:shadow-xl transition-all">
      <div class="w-full h-64 sm:h-96 bg-slate-100 overflow-hidden relative">
        <img src="${headlineImg}" onerror="this.src='${DEFAULT_IMG_TOEIC}'" alt="${headline.judul}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <span class="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-[#169C53] text-white text-[11px] font-extrabold shadow-md">
          ${headlineKat}
        </span>
      </div>
      <div class="p-6 sm:p-8 space-y-2.5">
        <div class="text-xs text-slate-400 font-semibold">${formatTanggalIndo(headline.created_at)}</div>
        <h3 class="text-xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-[#169C53] transition-colors leading-snug">
          ${headline.judul || 'Pengumuman Resmi UPA Bahasa'}
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 line-clamp-2">
          ${headline.keterangan || headline.isi_berita || 'Klik untuk membaca pengumuman selengkapnya dan mengunduh lampiran dokumen resmi.'}
        </p>
      </div>
    </div>
  `;

  const sisaBerita = list.slice(1);
  if (sisaBerita.length > 0) {
    html += `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">`;
    sisaBerita.forEach(item => {
      const imgUrl = item.gambar_url || DEFAULT_IMG_TOEIC;
      const kat = item.kategori || 'Pengumuman';
      html += `
        <div onclick="bukaDetailPengumumanToeic(${item.id})" class="cursor-pointer group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-[#169C53] shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between">
          <div>
            <div class="w-full h-44 bg-slate-100 overflow-hidden">
              <img src="${imgUrl}" onerror="this.src='${DEFAULT_IMG_TOEIC}'" alt="${item.judul}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            </div>
            <div class="p-5 space-y-2">
              <h4 class="font-extrabold text-slate-900 group-hover:text-[#169C53] text-sm sm:text-base leading-snug line-clamp-3 transition-colors">
                ${item.judul || 'Pengumuman TOEIC'}
              </h4>
            </div>
          </div>
          <div class="px-5 pb-5 pt-1 flex items-center justify-between text-[11px] font-bold">
            <span class="text-[#169C53]">${kat}</span>
            <span class="text-slate-400 font-normal">${formatTanggalIndo(item.created_at)}</span>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  container.innerHTML = html;
}

function filterTabelFileToeic() {
  const q = (document.getElementById('inputCariFileToeic')?.value || '').toLowerCase();
  const filtered = window.daftarFileToeicGlobal.filter(f =>
    String(f.judul || '').toLowerCase().includes(q) ||
    String(f.kategori || '').toLowerCase().includes(q) ||
    String(f.keterangan || '').toLowerCase().includes(q)
  );
  renderBeritaToeic(filtered);
}

function bukaDetailPengumumanToeic(id) {
  const item = window.daftarFileToeicGlobal.find(f => f.id === id);
  if (!item) return;

  ['viewToefl', 'viewSspect', 'viewToeic'].forEach(v => {
    const el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });
  document.getElementById('viewToeicDetail').classList.remove('hidden');

  document.getElementById('detailToeicImg').src = item.gambar_url || DEFAULT_IMG_TOEIC;
  document.getElementById('detailToeicKategori').textContent = item.kategori || 'Pengumuman TOEIC';
  document.getElementById('detailToeicTanggal').textContent = formatTanggalIndo(item.created_at);
  document.getElementById('detailToeicAuthor').textContent = item.uploaded_by ? `Oleh: ${item.uploaded_by}` : 'UPA Bahasa POLNES';
  document.getElementById('detailToeicJudul').textContent = item.judul || 'Pengumuman Resmi TOEIC';
  document.getElementById('detailToeicIsi').textContent = item.isi_berita || item.keterangan || 'Silakan unduh lampiran dokumen resmi melalui tombol di atas untuk melihat daftar lengkap peserta atau hasil tes TOEIC.';

  const fileBox = document.getElementById('detailToeicFileBox');
  const linkDownload = document.getElementById('detailToeicLinkDownload');
  const namaFileEl = document.getElementById('detailToeicNamaFile');

  if (item.file_url && item.file_url !== '#') {
    fileBox.classList.remove('hidden');
    linkDownload.href = item.file_url;
    namaFileEl.textContent = item.judul ? `${item.judul} (Lampiran Resmi)` : 'Dokumen_Lampiran_TOEIC';
  } else {
    fileBox.classList.add('hidden');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 8. SINKRONISASI REAL-TIME SUPABASE & BACA PARAMETER URL ====================
function aktifkanRealtimeSyncDatabase() {
  if (!window.supabaseClient) return;

  window.supabaseClient
    .channel('upa-layanan-tes-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pendaftaran_remedial' }, () => {
      muatJadwalRemedial();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jadwal_log' }, () => {
      muatJadwalToefl();
      muatJadwalRemedial();
      muatDataSspect();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_ujian' }, () => {
      muatJadwalToefl();
      muatJadwalRemedial();
      muatDataSspect();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'toeic_files' }, () => {
      muatFilePengumumanToeic();
    })
    .subscribe();
}

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('upa_public_lang') || 'id';
  setLanguage(savedLang);

  const params = new URLSearchParams(window.location.search);
  const tabParam = (params.get('tab') || 'toefl').toLowerCase();
  const hashTarget = window.location.hash ? window.location.hash.substring(1) : null;

  bukaTabLayanan(tabParam, hashTarget);
  aktifkanRealtimeSyncDatabase();
});