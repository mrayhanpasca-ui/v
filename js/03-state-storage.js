/* =========================================================
   STATE & STORAGE
========================================================= */

const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxryKvCJwQT7Q7TL6zYkcUCf4YNFK1sAL9WpjRF4t8l6-yffL-VvtCXmadtIVFqNTpaug/exec';

let users = [];
let reports = [];
let masterWilayah = [];
let currentUser = null;
let saveReportsQueue = Promise.resolve();

const SIKOMPAK_TOKEN_KEY = 'sikompaKToken';
const SIKOMPAK_USER_KEY = 'sikompaKUser';
const SIKOMPAK_EXPIRES_AT_KEY = 'sikompaKExpiresAt';
const API_REQUEST_TIMEOUT_MS = 180000;
const API_REQUEST_RETRY_COUNT = 2;
const API_REQUEST_RETRY_DELAY_MS = 1500;


function cloneData(data) {

  return JSON.parse(JSON.stringify(data));

}


function getApiErrorMessage(error, fallback = 'Response Apps Script gagal.') {

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    return String(
      error.message ||
      error.error ||
      error.code ||
      fallback
    );
  }

  return String(error || fallback);

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

  ['id', 'reportId', 'userId'].forEach(key => {
    if (payload[key] !== undefined && payload[key] !== null) {
      params.set(key, String(payload[key]));
    }
  });

  const usePost = [
    'uploadImages',
    'createUser',
    'updateUser',
    'deleteUser',
    'createReport',
    'updateReport',
    'deleteReport'
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

    const errorCode = result && typeof result.error === 'object'
      ? result.error.code
      : result?.error;

    if (errorCode === 'TOKEN_INVALID_OR_EXPIRED') {
      if (typeof clearStoredSession === 'function') {
        clearStoredSession();
      }
      if (typeof showLoginScreen === 'function') {
        showLoginScreen();
      }
    }

    if (!result || result.ok === false) {
      throw new Error(getApiErrorMessage(
        result?.error || result?.message,
        'Response Apps Script gagal.'
      ));
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


function fetchJsonpFromGoogleSheet(url, params, attempt = 0) {

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

      const errorCode = result && typeof result.error === 'object'
        ? result.error.code
        : result?.error;

      if (errorCode === 'TOKEN_INVALID_OR_EXPIRED') {
        if (typeof clearStoredSession === 'function') clearStoredSession();
        if (typeof showLoginScreen === 'function') showLoginScreen();
      }

      if (!result || result.ok === false) {
        reject(new Error(getApiErrorMessage(
          result?.error || result?.message,
          'Response Apps Script gagal.'
        )));
        return;
      }

      resolve(result);
    };

    script.onerror = () => {
      cleanup();

      if (attempt < API_REQUEST_RETRY_COUNT) {
        setTimeout(() => {
          fetchJsonpFromGoogleSheet(
            url,
            params,
            attempt + 1
          ).then(resolve, reject);
        }, API_REQUEST_RETRY_DELAY_MS * (attempt + 1));
        return;
      }

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
    action: 'getUsers'
  });

  if (response && response.data) {
    const fetchedUsers = Array.isArray(response.users) ? response.users : [];

    users = fetchedUsers.map(normalizeUserRole);
    return users;
  }

  throw new Error('Data user tidak tersedia di database.');

}


async function saveUserRecord(user) {

  let savedUser;

  try {
    savedUser = await updateUser(user.id, user);
  } catch (error) {
    if (!String(error?.message || '').includes('USER_NOT_FOUND')) {
      throw error;
    }
    savedUser = await createUser(user);
  }

  const index = users.findIndex(item => item.id === user.id);
  if (index !== -1 && savedUser) {
    const nextUser = {
      ...users[index],
      ...savedUser
    };
    delete nextUser.password;
    users[index] = nextUser;
  }

  return savedUser;
}


async function loadReports() {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getReports',
    data: {
      page: 1,
      pageSize: 20
    }
  });

  if (response) {
    const fetchedReports = Array.isArray(response.reports) ? response.reports : [];

    reports = fetchedReports;
    return reports;
  }

  throw new Error('Data laporan tidak tersedia di database.');

}


async function loadDashboardData() {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getData'
  });
  const data = response && response.data ? response.data : {};

  if (!Array.isArray(data.users) || !Array.isArray(data.reports)) {
    throw new Error('Data dashboard tidak tersedia di database.');
  }

  users = data.users.map(normalizeUserRole);
  reports = data.reports;
  masterWilayah = Array.isArray(data.masterWilayah) ? data.masterWilayah : [];
  console.log('MasterWilayah:', masterWilayah);
  console.log('Jumlah MasterWilayah:', masterWilayah.length);

  return { users, reports };

}


async function createReport(report) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'createReport',
    data: report
  });

  return response.report;
}


async function getReportById(reportId) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getReport',
    reportId: reportId
  });

  return response.report || null;
}

async function waitForReportPersistence(
  reportId,
  minimumDocumentationCount = null,
  minimumUpdatedAt = null
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const savedReport = await getReportById(reportId);
    const documentation = savedReport?.laporanAwal?.dokumentasi;
    const documentationCount = Array.isArray(documentation) ? documentation.length : 0;

    if (
      savedReport &&
      (minimumDocumentationCount === null || documentationCount >= minimumDocumentationCount) &&
      (!minimumUpdatedAt || String(savedReport.updatedAt || '') >= String(minimumUpdatedAt))
    ) {
      return savedReport;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return null;
}


async function getReports(options = {}) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getReports',
    data: options
  });

  return Array.isArray(response.reports) ? response.reports : [];
}


async function getUserById(userId) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getUser',
    userId: userId
  });

  return response.user || null;
}


async function getUsers(options = {}) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'getUsers',
    data: options
  });

  return Array.isArray(response.users) ? response.users : [];
}


async function updateReport(reportId, report) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'updateReport',
    reportId: reportId,
    data: report
  });

  return response.report;
}


async function deleteReport(reportId) {

  return fetchJsonFromGoogleSheet({
    action: 'deleteReport',
    reportId: reportId
  });
}


async function createUser(user) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'createUser',
    data: user
  });

  return response.user;
}


async function updateUser(userId, user) {

  const response = await fetchJsonFromGoogleSheet({
    action: 'updateUser',
    userId: userId,
    data: user
  });

  return response.user;
}


async function deleteUser(userId) {

  return fetchJsonFromGoogleSheet({
    action: 'deleteUser',
    userId: userId
  });
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
    const reportBeforeUpload = await getReportById(reportId);
    const existingDocumentation = reportBeforeUpload?.laporanAwal?.dokumentasi;
    const existingDocumentationCount = Array.isArray(existingDocumentation)
      ? existingDocumentation.length
      : 0;

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
      const savedReport = await waitForReportPersistence(
        reportId,
        existingDocumentationCount + validFiles.length
      );

      if (!savedReport) {
        throw new Error('Server belum mengonfirmasi penyimpanan foto. Silakan coba lagi.');
      }

      return {
        accepted: true,
        verified: true,
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


async function saveReportRecord(report) {

  const saveOperation = saveReportsQueue.then(async () => {
    let savedReport;

    try {
      savedReport = await updateReport(report.id, report);
    } catch (error) {
      if (!String(error?.message || '').includes('REPORT_NOT_FOUND')) {
        throw error;
      }
    }

    if (!savedReport) {
      savedReport = await waitForReportPersistence(report.id, null, report.updatedAt);
    }

    if (!savedReport) {
      savedReport = await createReport(report);
    }

    if (!savedReport) {
      savedReport = await waitForReportPersistence(report.id, null, report.updatedAt);
    }

    const index = reports.findIndex(item => item.id === report.id);
    if (index !== -1 && savedReport) {
      reports[index] = savedReport;
    }

    if (!savedReport) {
      savedReport = await waitForReportPersistence(report.id);
      if (!savedReport) {
        throw new Error('Server belum mengonfirmasi penyimpanan laporan. Silakan coba lagi.');
      }
    }

    return savedReport;
  });

  saveReportsQueue = saveOperation.catch(() => {});
  return saveOperation;
}
