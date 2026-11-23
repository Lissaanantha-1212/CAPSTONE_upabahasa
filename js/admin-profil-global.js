(function () {
  // 1. Tangkap data profil yang dikirim dari web Piya lewat URL (?piya_user=...)
  const urlParams = new URLSearchParams(window.location.search);
  const piyaParam = urlParams.get("piya_user");

  if (piyaParam) {
    try {
      const decoded = JSON.parse(
        decodeURIComponent(escape(atob(decodeURIComponent(piyaParam))))
      );
      if (decoded && decoded.email) {
        const staffSession = {
          id: decoded.id || "piya-admin",
          nama: decoded.fullName || "Admin UPA",
          username: decoded.fullName || "Admin UPA",
          email: decoded.email || "-",
          role: decoded.role || "Staf",
          staffNumber: decoded.staffNumber ?? 1,
          login_method: "piya_sso",
        };

        localStorage.setItem("piya_synced_admin", JSON.stringify(decoded));
        localStorage.setItem("adminUser", JSON.stringify(decoded));
        localStorage.setItem("upa_active_staff", JSON.stringify(staffSession));
      }
      // Bersihkan URL agar terlihat rapi
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      console.error("Gagal membaca profil dari Piya:", e);
    }
  } else {
    // Pastikan sesi tetap aktif saat berpindah antar-halaman di upabahasa.vercel.app
    const savedPiya = localStorage.getItem("piya_synced_admin");
    if (savedPiya) {
      try {
        const decoded = JSON.parse(savedPiya);
        const staffSession = {
          id: decoded.id || "piya-admin",
          nama: decoded.fullName || "Admin UPA",
          username: decoded.fullName || "Admin UPA",
          email: decoded.email || "-",
          role: decoded.role || "Staf",
          staffNumber: decoded.staffNumber ?? 1,
          login_method: "piya_sso",
        };
        localStorage.setItem("upa_active_staff", JSON.stringify(staffSession));
      } catch (e) {}
    }
  }

  function getActiveUser() {
    try {
      return (
        JSON.parse(
          localStorage.getItem("piya_synced_admin") ||
          localStorage.getItem("adminUser") ||
          localStorage.getItem("upa_active_staff") ||
          "{}"
        ) || {}
      );
    } catch (e) {
      return {};
    }
  }

  // 2. Render data profil ke Header & Dropdown pojok kanan atas
  function renderProfilAdmin() {
    const u = getActiveUser();
    const name = u.fullName || u.nama || "Admin UPA";
    const email = u.email || "-";
    const initial = name.trim().charAt(0).toUpperCase() || "A";
    const role = u.role
      ? u.role.charAt(0).toUpperCase() + u.role.slice(1)
      : "Administrator";
    const staffNumber = u.staffNumber;
    const adminNumber =
      staffNumber !== null && staffNumber !== undefined && staffNumber !== ""
        ? `Admin ${staffNumber}`
        : "Nomor admin belum tersedia";

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    // ID versi baru (jadwal-test.html)
    setText("headerAdminInitial", initial);
    setText("headerAdminName", name);
    setText("dropdownAdminInitial", initial);
    setText("dropdownAdminName", name);
    setText("dropdownAdminEmail", email);
    setText("dropdownAdminRole", role);
    setText("dropdownAdminNumber", adminNumber);

    // ID versi sebelumnya (jadwal-remedial, toefl, sspect, rekapan)
    setText("staffAvatarInitial", initial);
    setText("staffHeaderName", name);
    setText("staffDropdownInitial", initial);
    setText("staffDropdownName", name);
    setText("staffDropdownEmail", email);
    setText("staffDropdownRole", role);
    setText("staffDropdownNumber", adminNumber);
  }

  // 3. Teruskan parameter ?piya_user=... pada link sidebar antar-menu di web kamu
  function teruskanProfilKeLinkSidebar() {
    const u = getActiveUser();
    if (!u || !u.email || u.email === "-") return;

    const payload = {
      fullName: u.fullName || u.nama || "Admin UPA",
      email: u.email,
      role: u.role || "Staf",
      staffNumber: u.staffNumber ?? 1,
    };

    const encoded = encodeURIComponent(
      btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    );

    const pages = [
      "jadwal-test.html",
      "jadwal-remedial.html",
      "toefl.html",
      "sspect.html",
      "rekapan.html",
    ];

    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      if (pages.some((p) => href.includes(p)) && !href.includes("piya_user=")) {
        const sep = href.includes("?") ? "&" : "?";
        a.setAttribute("href", `${href}${sep}piya_user=${encoded}`);
      }
    });
  }

  // 4. Override semua fungsi Logout agar kembali ke halaman login Piya
  window.logoutKePiya = function () {
    localStorage.removeItem("upa_active_staff");
    localStorage.removeItem("piya_synced_admin");
    localStorage.removeItem("adminUser");
    sessionStorage.removeItem("piya_active_admin");
    window.location.href = "https://upabahasa-polnes-l7qi.vercel.app/admin/login";
  };
  window.logoutStaff = window.logoutKePiya;
  window.prosesLogoutStaff = window.logoutKePiya;
  window.handleLogout = window.logoutKePiya;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderProfilAdmin();
      teruskanProfilKeLinkSidebar();
      setTimeout(renderProfilAdmin, 250);
    });
  } else {
    renderProfilAdmin();
    teruskanProfilKeLinkSidebar();
    setTimeout(renderProfilAdmin, 250);
  }
})();