/* =========================================================
   04-auth.js
   AUTHENTICATION + ROLE SYSTEM + LOGIN UI
========================================================= */


/* =========================================================
   LOGIN
========================================================= */

function normalizeRoleName(value) {

  return String(value || '').trim().toUpperCase();

}


function normalizeUserRole(user) {
  if (!user || typeof user !== 'object') return user;

  return {
    ...user,
    role: normalizeRoleName(user.role)
  };
}


function parseStoredUser(value) {

  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  }
  catch (error) {
    return null;
  }

}


async function login(username, password) {
  username = String(username || '').trim();
  password = String(password || '');

  if (!username || !password) {
    throw new Error('Username dan password wajib diisi.');
  }

  const response = await fetchJsonFromGoogleSheet({
    action: 'login',
    username,
    password,
    data: { username, password }
  });

  const user = normalizeUserRole(response.user);

  if (!response.token || !response.expiresAt || !user) {
    throw new Error('Response login dari server tidak lengkap.');
  }

  localStorage.setItem(SIKOMPAK_TOKEN_KEY, response.token);
  localStorage.setItem(SIKOMPAK_USER_KEY, JSON.stringify(user));
  localStorage.setItem(SIKOMPAK_EXPIRES_AT_KEY, response.expiresAt);

  currentUser = user;

  if (response.data) {
    if (Array.isArray(response.data.users)) {
      users = response.data.users.map(normalizeUserRole);
    }

    if (Array.isArray(response.data.reports)) {
      reports = response.data.reports;
    }
  }

  return currentUser;
}


async function handleLogin() {
  const usernameInput = document.getElementById('input-username');
  const passwordInput = document.getElementById('input-password');
  const errorElement = document.getElementById('login-error');
  const loginButton = document.querySelector('#login-screen .btn-primary');

  if (!usernameInput || !passwordInput) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  }

  if (!username || !password) {
    if (errorElement) {
      errorElement.textContent = 'Username dan password wajib diisi.';
      errorElement.classList.add('show');
    }
    return;
  }

  try {
    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = 'Memproses...';
    }

    await login(username, password);

    showAppScreen();
    updateUserHeader();

    if (typeof showDashboard === 'function') {
      await showDashboard();
    }
  }
  catch (error) {
    console.error('Login gagal:', error);
    hideDatabaseLoading();

    if (errorElement) {
      errorElement.textContent = error.message || 'Username atau password salah.';
      errorElement.classList.add('show');
    }
  }
  finally {
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = 'Login';
    }
  }
}


/* =========================================================
   UPDATE USER HEADER
========================================================= */

function updateUserHeader() {

  if (!currentUser) {
    return;
  }


  const nameLabel =
    document.getElementById(
      'admin-name-label'
    );


  const avatar =
    document.getElementById(
      'avatar-initial'
    );


  /* Yang ditampilkan username */
  const username =
    currentUser.username || 'User';


  if (nameLabel) {

    nameLabel.textContent =
      username;

  }


  if (avatar) {

    avatar.textContent =
      username
        .charAt(0)
        .toUpperCase();

  }

}


/* =========================================================
   SHOW APP SCREEN
========================================================= */

function showAppScreen() {

  const loginScreen =
    document.getElementById(
      'login-screen'
    );


  const appScreen =
    document.getElementById(
      'app-screen'
    );


  if (loginScreen) {

    loginScreen.style.display =
      'none';

    loginScreen.setAttribute('inert', '');

  }


  if (appScreen) {

    appScreen.style.display =
      'block';

    appScreen.removeAttribute('inert');

  }

}


/* =========================================================
   SHOW LOGIN SCREEN
========================================================= */

function showLoginScreen() {

  const loginScreen =
    document.getElementById(
      'login-screen'
    );


  const appScreen =
    document.getElementById(
      'app-screen'
    );


  if (loginScreen) {

    loginScreen.style.display =
      'flex';

    loginScreen.removeAttribute('inert');

  }


  if (appScreen) {

    appScreen.style.display =
      'none';

    appScreen.setAttribute('inert', '');

  }


  /* Bersihkan password */
  const passwordInput =
    document.getElementById(
      'input-password'
    );


  if (passwordInput) {

    passwordInput.value = '';

    passwordInput.type = 'password';

  }


  /* Bersihkan error */
  const errorElement =
    document.getElementById(
      'login-error'
    );


  if (errorElement) {

    errorElement.textContent = '';

    errorElement.classList.remove(
      'show'
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

function handleLogout() {

  logout();

}


async function logout() {

  const token = localStorage.getItem(SIKOMPAK_TOKEN_KEY) || '';

  clearStoredSession();
  currentUser = null;
  showLoginScreen();

  const usernameInput =
    document.getElementById(
      'input-username'
    );

  if (usernameInput) {
    usernameInput.value = '';
  }

  const passwordInput =
    document.getElementById(
      'input-password'
    );

  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.type = 'password';
  }

  if (token && typeof fetchJsonFromGoogleSheet === 'function') {
    try {
      await fetchJsonFromGoogleSheet({
        action: 'logout',
        token
      });
    }
    catch (error) {
      console.error('Logout server gagal:', error);
    }
  }

}


function clearStoredSession() {

  localStorage.removeItem(SIKOMPAK_TOKEN_KEY);
  localStorage.removeItem(SIKOMPAK_USER_KEY);
  localStorage.removeItem(SIKOMPAK_EXPIRES_AT_KEY);

}


/* =========================================================
   TOGGLE PASSWORD
========================================================= */

function togglePassword() {

  const input =
    document.getElementById(
      'input-password'
    );


  const icon =
    document.getElementById(
      'eye-icon'
    );


  if (!input) {
    return;
  }


  if (input.type === 'password') {

    input.type = 'text';

    const toggle = document.getElementById('password-toggle');
    if (toggle) {
      toggle.title = 'Sembunyikan password';
      toggle.setAttribute('aria-label', 'Sembunyikan password');
    }


    if (icon) {

      icon.innerHTML = `

        <path
          d="M3 3l18 18"
        />

        <path
          d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
        />

        <path
          d="M9.9 5.2A10.8 10.8 0 0 1 12 5c7 0 10 7 10 7a18.2 18.2 0 0 1-3.2 4.2"
        />

        <path
          d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.3-.5 4.7-1.2"
        />

      `;

    }

  }
  else {

    input.type = 'password';

    const toggle = document.getElementById('password-toggle');
    if (toggle) {
      toggle.title = 'Lihat password';
      toggle.setAttribute('aria-label', 'Lihat password');
    }


    if (icon) {

      icon.innerHTML = `

        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        />

        <circle
          cx="12"
          cy="12"
          r="3"
        />

      `;

    }

  }

}


/* =========================================================
   LOGIN STATUS
========================================================= */

function isLoggedIn() {

  return (
    typeof currentUser !== 'undefined' &&
    currentUser !== null
  );

}


/* =========================================================
   ROLE CHECK
========================================================= */

function hasRole(...roles) {

  if (!currentUser) {

    return false;

  }

  const allowedRoles = roles.map(function(role) {
    return normalizeRoleName(role);
  });

  return allowedRoles.includes(
    normalizeRoleName(currentUser.role)
  );

}


/* =========================================================
   ROLE HELPERS
========================================================= */

function isSuperadmin() {

  return hasRole(
    USER_ROLES.SUPERADMIN
  );

}


function isAdmin() {

  return hasRole(
    USER_ROLES.ADMIN
  );

}


function isPetugas() {

  return hasRole(
    USER_ROLES.PETUGAS
  );

}


/* =========================================================
   PERMISSIONS
========================================================= */

function canCreateReport() {

  return hasRole(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPERADMIN
  );

}


function canEditReport() {

  return hasRole(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPERADMIN
  );

}


function canAssignPetugas() {

  return hasRole(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPERADMIN
  );

}


function canFillPelaksanaan() {

  return hasRole(
    USER_ROLES.PETUGAS
  );

}


function canFillLaporanDetail() {

  return hasRole(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPERADMIN
  );

}


function canManageUsers() {

  return hasRole(
    USER_ROLES.SUPERADMIN
  );

}


function canBypassWorkflow() {

  return hasRole(
    USER_ROLES.ADMIN,
    USER_ROLES.SUPERADMIN
  );

}


function canArchiveReport() {

  return hasRole(
    USER_ROLES.SUPERADMIN
  );

}


/* =========================================================
   DASHBOARD TYPE
========================================================= */

function getDashboardType() {

  if (!currentUser) {

    return null;

  }


  switch (normalizeRoleName(currentUser.role)) {

    case USER_ROLES.SUPERADMIN:

      return 'SUPERADMIN';


    case USER_ROLES.ADMIN:

      return 'ADMIN';


    case USER_ROLES.PETUGAS:

      return 'PETUGAS';


    default:

      return null;

  }

}


/* =========================================================
   GET MY REPORTS
========================================================= */

function getMyReports() {

  if (
    typeof getReportsForCurrentUser ===
    'function'
  ) {

    return getReportsForCurrentUser();

  }


  if (
    typeof reports === 'undefined' ||
    !Array.isArray(reports)
  ) {

    return [];

  }


  if (!currentUser) {

    return [];

  }


  return reports.filter(function(report) {

    const data =
      report?.data || {};


    const assigned = [

      data.petugas,
      data.petugasId,
      data.petugasUsername,
      data.petugasNama,
      data.regu

    ]
      .filter(Boolean)
      .map(function(value) {

        return String(value)
          .toLowerCase()
          .trim();

      });


    const id =
      String(
        currentUser.id || ''
      )
        .toLowerCase()
        .trim();


    const username =
      String(
        currentUser.username || ''
      )
        .toLowerCase()
        .trim();


    const nama =
      String(
        currentUser.nama || ''
      )
        .toLowerCase()
        .trim();


    return (
      assigned.includes(id) ||
      assigned.includes(username) ||
      assigned.includes(nama)
    );

  });

}


/* =========================================================
   INITIALIZE AUTH
========================================================= */

function showDatabaseLoading(title, message) {
  const loading = document.getElementById('database-loading');
  const loadingTitle = document.getElementById('database-loading-title');
  const loadingText = document.getElementById('database-loading-text');

  if (!loading) return;

  document.body.appendChild(loading);
  loading.classList.remove('in-dashboard');

  if (loadingTitle) {
    loadingTitle.textContent = title || 'Menyiapkan database';
  }

  if (loadingText) {
    loadingText.textContent = message || 'Menghubungkan ke database laporan...';
  }

  loading.classList.add('show');
}

function hideDatabaseLoading() {
  const loading = document.getElementById('database-loading');
  if (loading) loading.classList.remove('show');
}

async function initializeAuth() {

  try {

    const token = localStorage.getItem(SIKOMPAK_TOKEN_KEY) || '';
    const storedUser = parseStoredUser(localStorage.getItem(SIKOMPAK_USER_KEY));
    const expiresAt = localStorage.getItem(SIKOMPAK_EXPIRES_AT_KEY) || '';

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() >= new Date(expiresAt).getTime()
    ) {
      clearStoredSession();
      currentUser = null;
      hideDatabaseLoading();
      showLoginScreen();
      return;
    }

    currentUser = normalizeUserRole(storedUser);
    showAppScreen();
    updateUserHeader();
    await showDashboard();
    hideDatabaseLoading();

  }
  catch (error) {

    console.error(
      'Gagal initialize auth:',
      error
    );

    hideDatabaseLoading();

    if (currentUser) {
      showAppScreen();
      updateUserHeader();
      return;
    }

    showLoginScreen();

  }

}


async function initializeDatabaseOnStartup() {

  showDatabaseLoading(
    'Menyiapkan database',
    'Memastikan database siap sebelum login...'
  );

  try {
    await fetchJsonFromGoogleSheet({
      action: 'initializeDatabase'
    });
  }
  catch (error) {
    console.error('Gagal menyiapkan database:', error);
  }
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function() {

    const usernameInput =
      document.getElementById(
        'input-username'
      );


    const passwordInput =
      document.getElementById(
        'input-password'
      );


    /* =========================================
       ENTER UNTUK LOGIN
    ========================================= */

    if (usernameInput) {

      usernameInput.addEventListener(
        'keydown',
        function(event) {

          if (event.key === 'Enter') {

            event.preventDefault();

            handleLogin();

          }

        }
      );

    }


    if (passwordInput) {

      passwordInput.addEventListener(
        'keydown',
        function(event) {

          if (event.key === 'Enter') {

            event.preventDefault();

            handleLogin();

          }

        }
      );

    }


    /* =========================================
       PASSWORD TOGGLE
    ========================================= */

    const passwordToggle =
      document.getElementById(
        'password-toggle'
      );


    if (passwordToggle) {

      passwordToggle.addEventListener(
        'click',
        function(event) {

          event.preventDefault();

          togglePassword();

        }
      );

    }


    /* =========================================
       INITIALIZE AUTH
    ========================================= */

    initializeAuth();

  }
);