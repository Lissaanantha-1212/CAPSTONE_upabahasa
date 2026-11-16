/**
 * Modul Global Profil Pengguna, Ubah Username/Password (SHA-256), & Logout
 * Otomatis merender dropdown profil pada header semua halaman admin UPA Bahasa POLNES.
 */
(function () {
  const SALT_KEAMANAN_UPA = "UPA-BAHASA-POLNES-2026-SECURE-AUTH";

  async function hashPasswordSha256(plainText) {
    const gabungan = `${SALT_KEAMANAN_UPA}::${String(plainText)}`;
    const data = new TextEncoder().encode(gabungan);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return (
      "sha256$" +
      Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function getActiveStaff() {
    try {
      return JSON.parse(
        localStorage.getItem("upa_active_staff") ||
          '{"nama":"Admin UPA","username":"admin","role":"staff"}'
      );
    } catch {
      return { nama: "Admin UPA", username: "admin", role: "staff" };
    }
  }

  function getInisial(nama) {
    const clean = String(nama || "UP").trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase() || "UP";
  }

  function initGlobalAdminProfil() {
    const header = document.querySelector("main > header") || document.querySelector("header");
    if (!header) return;

    const user = getActiveStaff();
    const inisial = getInisial(user.nama || user.username);
    const labelRole =
      user.role === "kepala"
        ? "Kepala UPA Bahasa"
        : user.role === "superadmin"
        ? "Super Admin"
        : "Staff UPA Bahasa";

    const avatarHtml = user.avatar_url
      ? `<img src="${user.avatar_url}" alt="Avatar" class="w-full h-full object-cover rounded-full" referrerpolicy="no-referrer" />`
      : `<span id="userAvatarText">${inisial}</span>`;

    const widgetHtml = `
      <div class="relative z-[99]" id="dropdownProfilWrapper">
        <button type="button" id="btnToggleProfilGlobal" class="w-10 h-10 rounded-full bg-[#169C53] text-white flex items-center justify-center font-extrabold text-xs shadow-md hover:bg-[#0E7A3F] transition-all focus:outline-none overflow-hidden border-2 border-white">
          ${avatarHtml}
        </button>

        <div id="menuDropdownProfil" class="hidden absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[999] text-xs">
          <div class="px-4 py-3 border-b border-slate-100">
            <div class="flex items-center justify-between gap-2">
              <div class="font-extrabold text-slate-900 text-sm truncate" id="popupNamaUser">${user.nama || user.username}</div>
              <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-[#169C53] text-[10px] font-extrabold shrink-0">${labelRole}</span>
            </div>
            <div class="text-[11px] text-slate-400 font-mono mt-0.5 truncate" id="popupUsername">@${user.username}</div>
            ${user.email ? `<div class="text-[10px] text-slate-400 truncate mt-0.5">${user.email}</div>` : ""}
          </div>
          
          <button type="button" id="btnMenuUbahUsername" class="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold transition-all">
            <i class="ri-user-settings-line text-base text-[#169C53]"></i> Ubah Username
          </button>
          <button type="button" id="btnMenuUbahPassword" class="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-semibold transition-all">
            <i class="ri-lock-password-line text-base text-[#169C53]"></i> Ubah Kata Sandi
          </button>
          
          <div class="border-t border-slate-100 my-1"></div>
          
          <button type="button" id="btnMenuLogoutGlobal" class="w-full text-left px-4 py-3 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-extrabold transition-all">
            <i class="ri-logout-box-line text-base"></i> Log Out
          </button>
        </div>
      </div>
    `;

    // Ganti elemen avatar lama di pojok kanan header (misalnya lingkaran "ST" atau wrapper profil lama)
    const existingWrapper = document.getElementById("dropdownProfilWrapper");
    if (existingWrapper) {
      existingWrapper.outerHTML = widgetHtml;
    } else if (header.children.length >= 2) {
      header.lastElementChild.outerHTML = widgetHtml;
    } else {
      header.insertAdjacentHTML("beforeend", widgetHtml);
    }

    // Hapus modal lama jika sudah ada di halaman agar tidak duplikat ID
    document.getElementById("modalUbahUsername")?.remove();
    document.getElementById("modalUbahPassword")?.remove();

    // Pasang Modal Ubah Username & Ubah Kata Sandi ke body
    const modalsHtml = `
      <div id="modalUbahUsername" class="hidden fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-extrabold text-slate-900">Ubah Username Pengguna</h3>
            <button type="button" id="btnCloseModalUser" class="text-slate-400 hover:text-slate-600"><i class="ri-close-line text-lg"></i></button>
          </div>
          <form id="formGlobalUbahUsername" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Username Baru</label>
              <input type="text" id="inputUsernameBaru" required pattern="^[a-zA-Z0-9._]{4,24}$" value="${user.username}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:border-[#169C53] outline-none">
            </div>
            <button type="submit" id="btnSimpanUserGlobal" class="w-full py-2.5 rounded-xl bg-[#169C53] hover:bg-[#0E7A3F] text-white font-bold text-xs transition-all">Simpan Perubahan</button>
          </form>
        </div>
      </div>

      <div id="modalUbahPassword" class="hidden fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-sm font-extrabold text-slate-900">Ubah Kata Sandi</h3>
            <button type="button" id="btnCloseModalPass" class="text-slate-400 hover:text-slate-600"><i class="ri-close-line text-lg"></i></button>
          </div>
          <form id="formGlobalUbahPassword" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Kata Sandi Lama</label>
              <input type="password" id="inputPassLama" required placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#169C53]">
            </div>
            <div>
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Kata Sandi Baru (Min. 8 Karakter)</label>
              <input type="password" id="inputPassBaru" required minlength="8" placeholder="••••••••" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#169C53]">
            </div>
            <button type="submit" id="btnSimpanPassGlobal" class="w-full py-2.5 rounded-xl bg-[#169C53] hover:bg-[#0E7A3F] text-white font-bold text-xs transition-all">Perbarui Kata Sandi</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalsHtml);

    // Event Listeners Dropdown & Modals
    const menu = document.getElementById("menuDropdownProfil");
    document.getElementById("btnToggleProfilGlobal")?.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      const wrapper = document.getElementById("dropdownProfilWrapper");
      if (wrapper && !wrapper.contains(e.target)) {
        menu?.classList.add("hidden");
      }
    });

    document.getElementById("btnMenuUbahUsername")?.addEventListener("click", () => {
      menu.classList.add("hidden");
      document.getElementById("modalUbahUsername").classList.remove("hidden");
    });
    document.getElementById("btnCloseModalUser")?.addEventListener("click", () => {
      document.getElementById("modalUbahUsername").classList.add("hidden");
    });

    document.getElementById("btnMenuUbahPassword")?.addEventListener("click", () => {
      menu.classList.add("hidden");
      document.getElementById("modalUbahPassword").classList.remove("hidden");
    });
    document.getElementById("btnCloseModalPass")?.addEventListener("click", () => {
      document.getElementById("modalUbahPassword").classList.add("hidden");
    });

    // Proses Simpan Username Baru ke Supabase
    document.getElementById("formGlobalUbahUsername")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameBaru = document.getElementById("inputUsernameBaru").value.trim().toLowerCase();
      const btn = document.getElementById("btnSimpanUserGlobal");
      const current = getActiveStaff();

      if (!usernameBaru || usernameBaru === current.username) {
        document.getElementById("modalUbahUsername").classList.add("hidden");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Menyimpan...";

      try {
        if (window.supabaseClient && current.id) {
          const { data: cek } = await window.supabaseClient
            .from("user_app")
            .select("id")
            .eq("username", usernameBaru)
            .neq("id", current.id);

          if (cek && cek.length > 0) {
            alert("Username tersebut sudah digunakan pengguna lain!");
            return;
          }

          const payloadUpdate = { username: usernameBaru };
          if (current.nama === current.username) payloadUpdate.nama = usernameBaru;

          const { error } = await window.supabaseClient
            .from("user_app")
            .update(payloadUpdate)
            .eq("id", current.id);

          if (error) throw error;
          if (payloadUpdate.nama) current.nama = payloadUpdate.nama;
        }

        current.username = usernameBaru;
        localStorage.setItem("upa_active_staff", JSON.stringify(current));
        alert("Username berhasil diperbarui menjadi @" + usernameBaru);
        window.location.reload();
      } catch (err) {
        alert("Gagal memperbarui username: " + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "Simpan Perubahan";
      }
    });

    // Proses Simpan Password Baru (SHA-256) ke Supabase
    document.getElementById("formGlobalUbahPassword")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const passLama = document.getElementById("inputPassLama").value;
      const passBaru = document.getElementById("inputPassBaru").value;
      const btn = document.getElementById("btnSimpanPassGlobal");
      const current = getActiveStaff();

      btn.disabled = true;
      btn.textContent = "Memperbarui...";

      try {
        if (!window.supabaseClient || !current.id) {
          throw new Error("Sesi database tidak ditemukan. Silakan login ulang.");
        }

        const { data: dbUser, error: errFetch } = await window.supabaseClient
          .from("user_app")
          .select("*")
          .eq("id", current.id)
          .single();

        if (errFetch || !dbUser) throw new Error("Data akun tidak ditemukan.");

        const storedPass = String(dbUser.password || "");
        const oldHashed = await hashPasswordSha256(passLama);

        if (storedPass !== "OAUTH_GOOGLE_USER") {
          const cocok = storedPass.startsWith("sha256$")
            ? storedPass === oldHashed
            : storedPass === passLama;
          if (!cocok) {
            alert("Kata sandi lama yang Anda masukkan salah!");
            return;
          }
        }

        const newHashed = await hashPasswordSha256(passBaru);
        const { error: errUpd } = await window.supabaseClient
          .from("user_app")
          .update({ password: newHashed })
          .eq("id", current.id);

        if (errUpd) throw errUpd;

        alert("Kata sandi berhasil diperbarui dengan enkripsi SHA-256!");
        document.getElementById("modalUbahPassword").classList.add("hidden");
        e.target.reset();
      } catch (err) {
        alert("Gagal mengubah kata sandi: " + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "Perbarui Kata Sandi";
      }
    });

    // Proses Log Out (Hapus sesi lokal & sesi Google OAuth Supabase)
    document.getElementById("btnMenuLogoutGlobal")?.addEventListener("click", async () => {
      if (!confirm("Apakah Anda yakin ingin keluar dari sesi sistem?")) return;
      localStorage.removeItem("upa_active_staff");
      sessionStorage.removeItem("upa_session_only");
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut().catch(() => {});
      }
      window.location.href = "login.html";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalAdminProfil);
  } else {
    initGlobalAdminProfil();
  }
})();