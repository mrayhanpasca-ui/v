/* =========================================================
   STATE & STORAGE
========================================================= */

const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyDHjwaFtKyp4Ap8xdbzuWqmppGQOnKO3RpXww-8Lb8vt-GB6zzqkRJ3W4bcSnYhHUB/exec';

let users = [];
let reports = [];
let currentUser = null;
let saveReportsQueue = Promise.resolve();

const SIKOMPAK_TOKEN_KEY = 'sikompaKToken';
const SIKOMPAK_USER_KEY = 'sikompaKUser';
const SIKOMPAK_EXPIRES_AT_KEY = 'sikompaKExpiresAt';
const API_REQUEST_TIMEOUT_MS = 180000;


function cloneData(data) {

  return JSON.parse(JSON.stringify(data));

}


async function fetchJsonFromGoogleSheet(payload = {}) {

  if (!GOOGLE_SHEET_WEB_APP_URL) {
    throw new Error('URL Apps Script belum diatur.');
  }

  const action = payload.action || 'getData';
  const params = new URLSearchParams();
  params.set('action', action);

  const token = action === 'login'
    ? ''
    : payload.token || localStorage.getItem(SIKOMPAK_TOKEN_KEY) || '';
  if (token) {
    params.set('token', token);
  }

  if (payload.data !== undefined) {
    params.set('data', JSON.stringify(payload.data));
  }

  const usePost = [
    'syncAll',
    'saveUsers',
    'saveReports',
    'uploadImages'
  ].includes(action);

  if (action === 'login' || !usePost) {
    params.set('_', String(Date.now()));
  }

  const url = GOOGLE_SHEET_WEB_APP_URL;

  if (!usePost) {
    return fetchJsonpFromGoogleSheet(url, params);
  }

  const requestUrl = url;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  try {

    const response = await fetch(requestUrl, {
      method: usePost ? 'POST' : 'GET',
      mode: usePost ? 'no-cors' : 'cors',
      headers: usePost ? {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      } : {
        'Accept': 'application/json'
      },
      body: usePost ? params.toString() : undefined,
      signal: controller.signal
    });

    if (usePost && response.type === 'opaque') {
      return {
        accepted: true
      };
    }

    if (!response.ok) {
      throw new Error(`Google Sheets request gagal: ${response.status}`);
    }

    const result = await response.json();

    if (result && result.error === 'TOKEN_INVALID_OR_EXPIRED') {
      if (typeof clearStoredSession === 'function') {
        clearStoredSession();
      }
      if (typeof showLoginScreen === 'function') {
        showLoginScreen();
      }
    }

    if (!result || result.ok === false) {
      throw new Error(result?.error || result?.message || 'Response Apps Script gagal.');
    }

    return result;

  }
  catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('Koneksi ke server terlalu lama. Silakan coba lagi.');
    }
    throw error;
  }
  finally {
    clearTimeout(timeoutId);
  }

}


function fetchJsonpFromGoogleSheet(url, params) {

  return new Promise((resolve, reject) => {
    const callbackName = `sikompaKJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Koneksi ke server terlalu lama. Silakan coba lagi.'));
    }, API_REQUEST_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = result => {
      cleanup();

      if (result && result.error === 'TOKEN_INVALID_OR_EXPIRED') {
        if (typeof clearStoredSession === 'function') clearStoredSession();
        if (typeof showLoginScreen === 'function') showLoginScreen();
      }

      if (!result || result.ok === false) {
        reject(new Error(result?.error || result?.message || 'Response Apps Script gagal.'));
        return;
      }

      resolve(result);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Koneksi ke server gagal. Periksa URL dan deployment Apps Script.'));
    };

    params.set('callback', callbackName);
    params.set('_', String(Date.now()));
    script.src = `${url}?${params.toString()}`;
    document.head.appendChild(script);
  });

}


async function loadUsers() {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getData'
  });

  if (response && response.data) {
    const fetchedUsers = Array.isArray(response.data.users) ? response.data.users : [];

    if (fetchedUsers.length > 0) {
      users = fetchedUsers.map(normalizeUserRole);
      return users;
    }
  }

  throw new Error('Data user tidak tersedia di database.');

}


async function saveUsers() {

  await fetchJsonFromGoogleSheet({
    action: 'saveUsers',
    data: users
  });

}


async function loadReports() {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getData'
  });

  if (response && response.data) {
    const fetchedReports = Array.isArray(response.data.reports) ? response.data.reports : [];

    if (fetchedReports.length > 0) {
      reports = fetchedReports;
      return reports;
    }
  }

  throw new Error('Data laporan tidak tersedia di database.');

}


async function uploadReportImages(reportId, files) {

  const list = Array.isArray(files) ? files : [];

  if (!reportId) {
    throw new Error('Upload foto gagal: ID laporan belum siap. Silakan ulangi proses penyimpanan.');
  }

  if (list.length === 0) {
    return {
      urls: [],
      failed: 0,
      saved: []
    };
  }

  const validFiles = list.filter(file => file && file.type && file.type.startsWith('image/'));

  if (validFiles.length === 0) {
    throw new Error('Format file tidak valid. Pastikan file yang dipilih adalah foto (JPG/PNG/WebP).');
  }

  try {
    const images = await Promise.all(validFiles.map(async (file, index) => ({
      name: file.name || `foto-${index + 1}.${(file.type || 'image/jpeg').split('/').pop() || 'jpg'}`,
      type: file.type || 'image/jpeg',
      dataUrl: await convertImageToBase64(file)
    })));

    const token = localStorage.getItem(SIKOMPAK_TOKEN_KEY) || '';

    const response = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify({
        action: 'uploadImages',
        reportId: String(reportId),
        token,
        data: {
          reportId: String(reportId),
          images
        }
      })
    });

    if (response.type === 'opaque') {
      return {
        accepted: true,
        urls: [],
        failed: 0,
        saved: [],
        errors: [],
        persistenceErrors: []
      };
    }

    if (!response.ok) {
      throw new Error(`Upload dokumentasi gagal: ${response.status}. Pastikan folder Drive aktif dan koneksi internet stabil.`);
    }

    const result = await response.json();

    if (!result || result.ok === false) {
      throw new Error(result?.error || result?.message || 'Upload dokumentasi gagal. Coba lagi setelah beberapa saat.');
    }

    if (Number(result.failed || 0) > 0 && Number(result.failed) === validFiles.length) {
      const detail = Array.isArray(result.errors) && result.errors.length > 0
        ? ` Detail: ${result.errors.map(item => item.message).join('; ')}`
        : '';
      throw new Error(`Semua foto gagal diupload.${detail}`);
    }

    return {
      urls: Array.isArray(result.urls) ? result.urls : [],
      failed: Number(result.failed || 0),
      saved: Array.isArray(result.saved) ? result.saved : [],
      errors: Array.isArray(result.errors) ? result.errors : [],
      persistenceErrors: Array.isArray(result.persistenceErrors) ? result.persistenceErrors : []
    };
  }
  catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error('Upload foto terlalu lama. Coba pilih ukuran file yang lebih kecil atau ulangi proses.');
    }
    throw new Error(getFriendlyUploadError(error, 'Upload foto gagal. Coba lagi.'));
  }

}


async function saveReports() {

  const saveOperation = saveReportsQueue.then(() => fetchJsonFromGoogleSheet({
    action: 'syncAll',
    data: {
      users,
      reports
    }
  }));

  saveReportsQueue = saveOperation.catch(() => {});
  await saveOperation;

}
