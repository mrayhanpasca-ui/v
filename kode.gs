/* =========================================================
   SIKOMPAK - Google Apps Script Backend
   =========================================================
   
   Fungsi:
   1. Menyimpan Users ke Google Sheets
   2. Menyimpan Reports/Laporan ke Google Sheets
   3. Membaca data dari Google Sheets
   4. Sinkronisasi data dari aplikasi web
   5. Upload dokumentasi/foto ke Google Drive
   6. Membuat folder laporan otomatis
   7. Menyediakan data default User dan Laporan
   8. Inisialisasi database
   
   ========================================================= */


// =========================================================
// KONFIGURASI NAMA SHEET
// =========================================================

const SHEET_NAMES = {
  USERS: 'Users',
  ROLES: 'Roles',
  STATUS: 'Status',
  LAPORAN: 'Laporan',
  LOKASI: 'Lokasi',
  PENUGASAN: 'Penugasan',
  PELAKSANAAN: 'Pelaksanaan',
  DOKUMENTASI: 'Dokumentasi',
  LAPORAN_DETAIL: 'LaporanDetail',
  AUDIT_LOG: 'AuditLog',
  MASTER_WILAYAH: 'MasterWilayah',
  SESSIONS: 'Sessions'
};


// =========================================================
// HEADER USERS
// =========================================================

const USERS_HEADERS = [
  'id',
  'username',
  'password',
  'nama',
  'jabatan',
  'role',
  'unit',
  'aktif',
  'createdAt',
  'rawDataJson'
];


// =========================================================
// HEADER LAPORAN
// =========================================================

const REPORT_HEADERS = [
  'id',
  'status',
  'createdAt',
  'updatedAt',
  'createdBy',
  'kategori',
  'nomorPelapor',
  'deskripsiLokasi',
  'jenisKegiatan',
  'petugasDitugaskan',
  'konfirmasiPenugasan',
  'deleted',
  'deletedAt',
  'deletedBy',
  'rawDataJson'
];


// =========================================================
// HEADER SESSIONS
// =========================================================

const SESSION_HEADERS = [
  'token',
  'userId',
  'username',
  'role',
  'createdAt',
  'expiresAt',
  'aktif'
];

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
const DATA_CACHE_KEY = 'sikompaK_data_v2';


// =========================================================
// MENDAPATKAN SPREADSHEET DATABASE
// =========================================================

function getDbSpreadsheet() {

  const ssId =
    PropertiesService
      .getScriptProperties()
      .getProperty('SPREADSHEET_ID');

  if (ssId && ssId.trim() !== '') {

    try {
      return SpreadsheetApp.openById(ssId.trim());

    } catch (error) {

      Logger.log(
        'SPREADSHEET_ID tidak valid: ' +
        error.toString()
      );

    }
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();

  if (!active) {
    throw new Error(
      'Spreadsheet database tidak ditemukan.'
    );
  }

  return active;
}


// =========================================================
// MENDAPATKAN SHEET
// =========================================================

function getSheet(sheetName) {

  const ss = getDbSpreadsheet();

  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {

    sheet = ss.insertSheet(sheetName);

  }

  return sheet;
}


// =========================================================
// MEMBUAT SEMUA SHEET YANG DIBUTUHKAN
// =========================================================

function ensureRequiredSheets() {

  const ss = getDbSpreadsheet();


  Object.values(SHEET_NAMES).forEach(function (sheetName) {

    if (!ss.getSheetByName(sheetName)) {

      ss.insertSheet(sheetName);

    }

  });


  // USERS
  ensureHeaderRow(
    SHEET_NAMES.USERS,
    USERS_HEADERS
  );


  // LAPORAN
  ensureHeaderRow(
    SHEET_NAMES.LAPORAN,
    REPORT_HEADERS
  );


  // SESSIONS
  ensureHeaderRow(
    SHEET_NAMES.SESSIONS,
    SESSION_HEADERS
  );


  // LOKASI
  ensureHeaderRow(
    SHEET_NAMES.LOKASI,
    [
      'reportId',
      'inputAsli',
      'alamat',
      'alamatAsli',
      'kelurahan',
      'kecamatan',
      'kabupaten',
      'provinsi',
      'kodePos',
      'latitude',
      'longitude',
      'googleMapsUrl',
      'mapsUrl',
      'sourceType',
      'reverseGeocodingStatus',
      'sumberWilayah',
      'terakhirDideteksi',
      'updatedAt'
    ]
  );


  // PENUGASAN
  ensureHeaderRow(
    SHEET_NAMES.PENUGASAN,
    [
      'reportId',
      'petugasId',
      'namaPetugas',
      'status',
      'createdAt'
    ]
  );


  // PELAKSANAAN
  ensureHeaderRow(
    SHEET_NAMES.PELAKSANAAN,
    [
      'reportId',
      'petugasPelaksana',
      'waktuTiba',
      'waktuSelesai',
      'hasilPenanganan',
      'dataOperasionalJson'
    ]
  );


  // DOKUMENTASI
  ensureHeaderRow(
    SHEET_NAMES.DOKUMENTASI,
    [
      'reportId',
      'namaFile',
      'url',
      'uploadedAt'
    ]
  );


  // LAPORAN DETAIL
  ensureHeaderRow(
    SHEET_NAMES.LAPORAN_DETAIL,
    [
      'reportId',
      'kronologi',
      'penyebab',
      'korbanJiwa',
      'korbanLuka',
      'kerugian',
      'keterangan'
    ]
  );


  // AUDIT LOG
  ensureHeaderRow(
    SHEET_NAMES.AUDIT_LOG,
    [
      'reportId',
      'logId',
      'waktu',
      'userId',
      'username',
      'action',
      'field',
      'before',
      'after'
    ]
  );

  // MASTER WILAYAH KOTABARU
  ensureHeaderRow(
    SHEET_NAMES.MASTER_WILAYAH,
    [
      'id',
      'kabupaten',
      'kecamatan',
      'desaKelurahan',
      'jenis',
      'kodePos',
      'aktif'
    ]
  );
}


// =========================================================
// MEMASTIKAN HEADER SHEET ADA
// =========================================================

function ensureHeaderRow(sheetName, headers) {

  const sheet = getSheet(sheetName);

  if (sheet.getMaxColumns() < headers.length) {

    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      headers.length - sheet.getMaxColumns()
    );

  }


  const firstRow =
    sheet
      .getRange(1, 1, 1, headers.length)
      .getValues()[0];


  const isEmpty =
    firstRow.every(function (cell) {

      return (
        cell === '' ||
        cell === null ||
        typeof cell === 'undefined'
      );

    });


  if (isEmpty) {

    sheet
      .getRange(1, 1, 1, headers.length)
      .setValues([headers]);

    return;

  }


  const existingHeader =
    firstRow.map(function (cell) {

      return String(cell || '').trim();

    });


  const missing =
    headers.filter(function (header) {

      return (
        existingHeader.indexOf(
          String(header)
        ) === -1
      );

    });


  if (missing.length > 0) {

    const startColumn =
      existingHeader.length + 1;

    if (
      sheet.getMaxColumns() <
      startColumn + missing.length - 1
    ) {

      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        (
          startColumn +
          missing.length -
          1
        ) - sheet.getMaxColumns()
      );

    }


    sheet
      .getRange(
        1,
        startColumn,
        1,
        missing.length
      )
      .setValues([missing]);

  }
}


function getRequiredSheet(sheetName, headers) {

  const sheet = getSheet(sheetName);

  if (Array.isArray(headers) && headers.length > 0) {
    ensureHeaderRow(sheetName, headers);
  }

  return sheet;
}


// =========================================================
// JSON PARSER AMAN
// =========================================================

function safeJsonParse(value) {

  if (
    value === null ||
    typeof value === 'undefined' ||
    value === ''
  ) {

    return null;

  }


  if (typeof value === 'object') {

    return value;

  }


  try {

    return JSON.parse(String(value));

  } catch (error) {

    return null;

  }
}


// =========================================================
// NORMALISASI BOOLEAN
// =========================================================

function normalizeBoolean(value) {

  if (
    value === true ||
    value === 'TRUE' ||
    value === 'true' ||
    value === 1 ||
    value === '1'
  ) {

    return true;

  }


  if (
    value === false ||
    value === 'FALSE' ||
    value === 'false' ||
    value === 0 ||
    value === '0'
  ) {

    return false;

  }


  return true;
}


// =========================================================
// ARRAY KE STRING
// =========================================================

function toCsvString(value) {

  if (Array.isArray(value)) {

    return JSON.stringify(value);

  }


  if (
    value === null ||
    typeof value === 'undefined'
  ) {

    return '';

  }


  return String(value);
}


// =========================================================
// MEMBACA BARIS SHEET
// =========================================================

function readSheetRows(sheetName) {

  const sheet = getSheet(sheetName);

  const values =
    sheet
      .getDataRange()
      .getValues();


  if (
    !values ||
    values.length <= 1
  ) {

    return [];

  }


  const headers = values[0];

  const rows = [];


  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    const row = values[i];


    if (
      !row ||
      !row.some(function (cell) {

        return (
          cell !== '' &&
          cell !== null &&
          typeof cell !== 'undefined'
        );

      })
    ) {

      continue;

    }


    const obj = {};


    headers.forEach(function (
      header,
      index
    ) {

      obj[String(header)] =
        row[index];

    });


    rows.push(obj);

  }


  return rows;
}


// =========================================================
// DEFAULT USERS
// =========================================================

function getDefaultUsers() {

  return [

    {
      id: 'USR-001',
      username: 'superadmin',
      password: 'superadmin123',
      nama: 'Super Admin',
      jabatan: 'Super Administrator',
      role: 'SUPERADMIN',
      unit: '',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    },

    {
      id: 'USR-002',
      username: 'admin',
      password: 'admin123',
      nama: 'Admin SIKOMPAK',
      jabatan: 'Admin Sistem',
      role: 'ADMIN',
      unit: '',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    },

    {
      id: 'USR-003',
      username: 'andi',
      password: 'andi123',
      nama: 'Andi Pratama',
      jabatan: 'Kepala Regu Damkar',
      role: 'PETUGAS',
      unit: 'DAMKAR',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    },

    {
      id: 'USR-004',
      username: 'budi',
      password: 'budi123',
      nama: 'Budi Santoso',
      jabatan: 'Petugas Pemadam',
      role: 'PETUGAS',
      unit: 'DAMKAR',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    },

    {
      id: 'USR-005',
      username: 'cahyo',
      password: 'cahyo123',
      nama: 'Cahyo Nugroho',
      jabatan: 'Petugas Penyelamatan',
      role: 'PETUGAS',
      unit: 'DAMKAR',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    },

    {
      id: 'USR-006',
      username: 'dedi',
      password: 'dedi123',
      nama: 'Dedi Kurniawan',
      jabatan: 'Koordinator Satpol PP',
      role: 'PETUGAS',
      unit: 'SATPOL_PP',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    },

    {
      id: 'USR-007',
      username: 'eka',
      password: 'eka123',
      nama: 'Eka Putri',
      jabatan: 'Petugas Pengendalian',
      role: 'PETUGAS',
      unit: 'SATPOL_PP',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    },

    {
      id: 'USR-008',
      username: 'fajar',
      password: 'fajar123',
      nama: 'Fajar Maulana',
      jabatan: 'Petugas Penegakan',
      role: 'PETUGAS',
      unit: 'SATPOL_PP',
      aktif: true,
      createdAt: '2026-08-25T08:00:00'
    }

  ];
}


// =========================================================
// DEFAULT REPORTS
// =========================================================

function getDefaultReports() {

  return [

    {
      id: 'RPT-20260825-001',

      status: 'MENUNGGU_PENUGASAN',

      createdAt: '2026-08-25T08:30:00',

      updatedAt: '2026-08-25T08:30:00',

      createdBy: 'USR-002',

      kategori: 'pemadaman',

      laporanAwal: {

        nomorPelapor:
          '081234567890',

        lokasi: {

          alamat:
            'Jl. Raya Bandung No. 20',

          latitude:
            -7.950000,

          longitude:
            112.610000,

          googleMapsUrl:
            'https://maps.google.com/?q=-7.95,112.61',

          sourceType:
            'DECIMAL',

          reverseGeocodingStatus:
            'BELUM_DICEK'

        },

        deskripsiLokasi:
          'Rumah berada di dekat minimarket.',

        jenisKegiatan:
          'Kebakaran Rumah',

        petugasDitugaskan:
          [],

        konfirmasiPenugasan:
          'BELUM_DITUGASKAN'

      },

      pelaksanaan: {

        petugasPelaksana:
          [],

        waktuTiba:
          null,

        waktuSelesai:
          null,

        hasilPenanganan:
          '',

        dokumentasi:
          []

      },

      laporanDetail: {

        kronologi:
          'Laporan masuk dari warga sekitar.',

        penyebab:
          'Korsleting listrik',

        korbanJiwa:
          0,

        korbanLuka:
          1,

        kerugian:
          25000000,

        keterangan:
          'Petugas sedang menunggu penugasan.'

      },

      auditLog:
        []

    },


    {
      id: 'RPT-20260825-002',

      status:
        'DIPROSES',

      createdAt:
        '2026-08-25T10:15:00',

      updatedAt:
        '2026-08-25T10:45:00',

      createdBy:
        'USR-002',

      kategori:
        'penegakan',

      laporanAwal: {

        nomorPelapor:
          '081234567891',

        lokasi: {

          alamat:
            'Area pasar tradisional pusat kota',

          latitude:
            -7.945000,

          longitude:
            112.625000,

          googleMapsUrl:
            'https://maps.google.com/?q=-7.945,112.625',

          sourceType:
            'DECIMAL',

          reverseGeocodingStatus:
            'BELUM_DICEK'

        },

        deskripsiLokasi:
          'Area pasar tradisional pusat kota.',

        jenisKegiatan:
          'Pengawasan Jalan',

        petugasDitugaskan:
          ['USR-006'],

        konfirmasiPenugasan:
          'DITERIMA'

      },

      pelaksanaan: {

        petugasPelaksana:
          ['USR-006'],

        waktuTiba:
          '2026-08-25T10:30:00',

        waktuSelesai:
          null,

        hasilPenanganan:
          'Pengecekan dan koordinasi dengan petugas lapangan.',

        dokumentasi:
          []

      },

      laporanDetail: {

        kronologi:
          'Warga melaporkan aktivitas yang mengganggu ketertiban.',

        penyebab:
          'Kegiatan tidak tertib di lokasi pasar',

        korbanJiwa:
          0,

        korbanLuka:
          0,

        kerugian:
          0,

        keterangan:
          'Penanganan sedang berlangsung.'

      },

      auditLog:
        []

    },


    {
      id:
        'RPT-20260825-003',

      status:
        'SELESAI',

      createdAt:
        '2026-08-25T13:00:00',

      updatedAt:
        '2026-08-25T15:00:00',

      createdBy:
        'USR-002',

      kategori:
        'penyelamatan',

      laporanAwal: {

        nomorPelapor:
          '081234567892',

        lokasi: {

          alamat:
            'Kawasan sungai belakang permukiman',

          latitude:
            -7.960000,

          longitude:
            112.620000,

          googleMapsUrl:
            'https://maps.google.com/?q=-7.96,112.62',

          sourceType:
            'DECIMAL',

          reverseGeocodingStatus:
            'BELUM_DICEK'

        },

        deskripsiLokasi:
          'Kawasan sungai belakang permukiman.',

        jenisKegiatan:
          'Penyelamatan Jiwa',

        petugasDitugaskan:
          [
            'USR-005',
            'USR-004'
          ],

        konfirmasiPenugasan:
          'SELESAI'

      },

      pelaksanaan: {

        petugasPelaksana:
          [
            'USR-005',
            'USR-004'
          ],

        waktuTiba:
          '2026-08-25T13:20:00',

        waktuSelesai:
          '2026-08-25T14:50:00',

        hasilPenanganan:
          'Korban berhasil dievakuasi dan ditangani tim medis.',

        dokumentasi:
          []

      },

      laporanDetail: {

        kronologi:
          'Terdapat korban yang tercebur dan membutuhkan evakuasi cepat.',

        penyebab:
          'Jatuh ke sungai saat hujan deras',

        korbanJiwa:
          0,

        korbanLuka:
          1,

        kerugian:
          0,

        keterangan:
          'Laporan ditutup setelah penanganan selesai.'

      },

      auditLog:
        []

    }

  ];
}


// =========================================================
// HELPER CRUD GENERIK SHEET
// =========================================================

function getColumnIndexes(sheet) {

  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    return {};
  }

  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0];
  const indexes = {};

  headers.forEach(function (header, index) {
    const name = String(header || '').trim();

    if (name) {
      indexes[name] = index;
    }
  });

  return indexes;
}


function findRowById(sheet, id, idColumnName) {

  const normalizedId = String(id || '').trim();
  const columnName = idColumnName || 'id';

  if (!normalizedId) {
    return null;
  }

  const indexes = getColumnIndexes(sheet);
  const idIndex = indexes[columnName];

  if (typeof idIndex === 'undefined') {
    return null;
  }

  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return null;
  }

  const values = sheet
    .getRange(2, idIndex + 1, lastRow - 1, 1)
    .getValues();

  for (let index = 0; index < values.length; index++) {
    if (String(values[index][0] || '').trim() === normalizedId) {
      return {
        rowNumber: index + 2,
        indexes: indexes,
        headers: Object.keys(indexes),
        values: sheet
          .getRange(index + 2, 1, 1, sheet.getLastColumn())
          .getValues()[0]
      };
    }
  }

  return null;
}


function getObjectByIdFromSheet(sheet, id, idColumnName) {

  const rowInfo = findRowById(sheet, id, idColumnName);

  if (!rowInfo) {
    return null;
  }

  const object = {};

  Object.keys(rowInfo.indexes).forEach(function (key) {
    object[key] = rowInfo.values[rowInfo.indexes[key]];
  });

  return {
    rowNumber: rowInfo.rowNumber,
    indexes: rowInfo.indexes,
    headers: rowInfo.headers,
    values: rowInfo.values,
    object: object
  };
}


function objectToSheetRow(sheet, object) {

  const indexes = getColumnIndexes(sheet);
  const row = new Array(sheet.getLastColumn()).fill('');

  Object.keys(object || {}).forEach(function (key) {
    if (typeof indexes[key] !== 'undefined') {
      row[indexes[key]] = object[key];
    }
  });

  return row;
}


function appendObjectToSheet(sheet, object) {

  const row = objectToSheetRow(sheet, object);
  const rowNumber = Math.max(sheet.getLastRow() + 1, 2);

  sheet
    .getRange(rowNumber, 1, 1, row.length)
    .setValues([row]);

  return rowNumber;
}


function updateObjectInSheet(sheet, id, object, idColumnName) {

  const found = findRowById(sheet, id, idColumnName);

  if (!found) {
    return null;
  }

  const row = objectToSheetRow(sheet, object);

  sheet
    .getRange(found.rowNumber, 1, 1, row.length)
    .setValues([row]);

  return found.rowNumber;
}


function updateObjectFieldsById(sheet, id, patch, idColumnName) {

  const found = getObjectByIdFromSheet(sheet, id, idColumnName);

  if (!found) {
    return null;
  }

  const row = found.values.slice();

  Object.keys(patch || {}).forEach(function (key) {
    if (typeof found.indexes[key] !== 'undefined') {
      row[found.indexes[key]] = patch[key];
    }
  });

  sheet
    .getRange(found.rowNumber, 1, 1, row.length)
    .setValues([row]);

  return found.rowNumber;
}


function withWriteLock(callback) {

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}


function deleteObjectFromSheet(sheet, id, idColumnName) {

  const found = findRowById(sheet, id, idColumnName);

  if (!found) {
    return false;
  }

  sheet.deleteRow(found.rowNumber);
  return true;
}


function normalizeUserForSheet(user) {

  const value = user || {};

  return {
    id: value.id || '',
    username: value.username || '',
    password: value.password || '',
    nama: value.nama || '',
    jabatan: value.jabatan || '',
    role: value.role || '',
    unit: value.unit || '',
    aktif: normalizeBoolean(value.aktif),
    createdAt: value.createdAt || new Date().toISOString(),
    rawDataJson: JSON.stringify(value)
  };
}


function normalizeReportForSheet(report) {

  const value = report || {};
  const awal = value.laporanAwal || {};
  const petugasDitugaskan = Array.isArray(awal.petugasDitugaskan)
    ? awal.petugasDitugaskan
    : [];
  const jenisKegiatan = awal.jenisKegiatan ||
    awal.jenisPelanggaran ||
    awal.jenisKebakaran ||
    awal.jenisKejadian ||
    '';

  return {
    id: value.id || '',
    status: value.status || '',
    createdAt: value.createdAt || new Date().toISOString(),
    updatedAt: value.updatedAt || new Date().toISOString(),
    createdBy: value.createdBy || '',
    kategori: value.kategori || awal.jenisLaporan || '',
    nomorPelapor: awal.nomorPelapor || '',
    deskripsiLokasi: awal.deskripsiLokasi || '',
    jenisKegiatan: jenisKegiatan,
    petugasDitugaskan: JSON.stringify(petugasDitugaskan),
    konfirmasiPenugasan: awal.konfirmasiPenugasan || '',
    deleted: report.deleted === true,
    deletedAt: report.deletedAt || '',
    deletedBy: report.deletedBy || '',
    rawDataJson: JSON.stringify(value)
  };
}


function normalizeLocationForSheet(reportId, location) {

  const value = location || {};

  return {
    reportId: String(reportId || ''),
    inputAsli: value.inputAsli || value.alamatAsli || value.alamat || '',
    alamat: value.alamat || value.alamatAsli || value.inputAsli || '',
    alamatAsli: value.alamatAsli || value.inputAsli || value.alamat || '',
    kelurahan: value.kelurahan || '',
    kecamatan: value.kecamatan || '',
    kabupaten: value.kabupaten || '',
    provinsi: value.provinsi || '',
    kodePos: value.kodePos || '',
    latitude: value.latitude ?? '',
    longitude: value.longitude ?? '',
    googleMapsUrl: value.googleMapsUrl || value.mapsUrl || '',
    mapsUrl: value.mapsUrl || value.googleMapsUrl || '',
    sourceType: value.sourceType || '',
    reverseGeocodingStatus: value.reverseGeocodingStatus || '',
    sumberWilayah: value.sumberWilayah || '',
    terakhirDideteksi: value.terakhirDideteksi || '',
    updatedAt: value.updatedAt || new Date().toISOString()
  };

}


function upsertLocationForReport(reportId, location) {

  const sheet = getRequiredSheet(SHEET_NAMES.LOKASI, [
    'reportId', 'inputAsli', 'alamat', 'alamatAsli', 'kelurahan',
    'kecamatan', 'kabupaten', 'provinsi', 'kodePos', 'latitude',
    'longitude', 'googleMapsUrl', 'mapsUrl', 'sourceType',
    'reverseGeocodingStatus', 'sumberWilayah', 'terakhirDideteksi', 'updatedAt'
  ]);
  const value = normalizeLocationForSheet(reportId, location);
  const existing = findRowById(sheet, reportId, 'reportId');

  if (existing) {
    updateObjectInSheet(sheet, reportId, value, 'reportId');
  } else {
    appendObjectToSheet(sheet, value);
  }

  return value;

}


function getLocationForReport(reportId) {

  const sheet = getRequiredSheet(SHEET_NAMES.LOKASI, [
    'reportId', 'inputAsli', 'alamat', 'alamatAsli', 'kelurahan',
    'kecamatan', 'kabupaten', 'provinsi', 'kodePos', 'latitude',
    'longitude', 'googleMapsUrl', 'mapsUrl', 'sourceType',
    'reverseGeocodingStatus', 'sumberWilayah', 'terakhirDideteksi', 'updatedAt'
  ]);
  const found = findRowById(sheet, reportId, 'reportId');

  return found ? found.object : null;

}


function isDeletedFlag(value) {

  return value === true ||
    value === 1 ||
    String(value || '').toLowerCase() === 'true' ||
    String(value || '') === '1';
}


function getActorContext(context) {

  const value = context || {};
  const user = value.user || {};

  return {
    userId: String(value.userId || user.userId || user.id || '').trim(),
    username: String(value.username || user.username || '').trim(),
    role: String(value.role || user.role || '').trim()
  };
}


function generateEntityId(prefix) {

  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}


function sanitizeUserForClient(user) {

  const value = user || {};

  return {
    id: value.id || '',
    username: value.username || '',
    nama: value.nama || '',
    jabatan: value.jabatan || '',
    role: value.role || '',
    unit: value.unit || '',
    aktif: normalizeBoolean(value.aktif),
    createdAt: value.createdAt || ''
  };
}


function parseUserSheetObject(object) {

  const row = object || {};
  const raw = safeJsonParse(row.rawDataJson) || {};

  return {
    id: row.id || raw.id || '',
    username: row.username || raw.username || '',
    password: row.password || raw.password || '',
    nama: row.nama || raw.nama || '',
    jabatan: row.jabatan || raw.jabatan || '',
    role: row.role || raw.role || 'PETUGAS',
    unit: row.unit || raw.unit || '',
    aktif: normalizeBoolean(
      row.aktif !== undefined ? row.aktif : raw.aktif
    ),
    createdAt: row.createdAt || raw.createdAt || ''
  };
}


function parseReportSheetObject(object, documentation) {

  const row = object || {};
  const raw = safeJsonParse(row.rawDataJson) || {};
  const reportId = row.id || raw.id || '';
  const savedDocumentation = Array.isArray(documentation)
    ? documentation
    : [];
  const existingDocumentation = raw.pelaksanaan &&
    Array.isArray(raw.pelaksanaan.dokumentasi)
    ? raw.pelaksanaan.dokumentasi
    : [];
  const initialDocumentation = raw.laporanAwal &&
    Array.isArray(raw.laporanAwal.dokumentasi)
    ? raw.laporanAwal.dokumentasi
    : [];
  const documentationList = initialDocumentation
    .concat(existingDocumentation, savedDocumentation)
    .filter(function (item, index, list) {
      return item && list.indexOf(item) === index;
    });
  const storedLocation = getLocationForReport(reportId) || {};
  const reportLocation = {
    ...storedLocation,
    ...(raw.laporanAwal && raw.laporanAwal.lokasi ? raw.laporanAwal.lokasi : {})
  };
  const laporanAwal = raw.laporanAwal || {
    nomorPelapor: row.nomorPelapor || '',
    deskripsiLokasi: row.deskripsiLokasi || '',
    jenisKegiatan: row.jenisKegiatan || '',
    petugasDitugaskan: safeJsonParse(row.petugasDitugaskan) || [],
    konfirmasiPenugasan: row.konfirmasiPenugasan || ''
  };
  laporanAwal.lokasi = reportLocation;
  const pelaksanaan = raw.pelaksanaan || {
    petugasPelaksana: [],
    waktuTiba: null,
    waktuSelesai: null,
    hasilPenanganan: '',
    dokumentasi: []
  };

  pelaksanaan.dokumentasi = documentationList;

  return {
    id: reportId,
    status: row.status || raw.status || '',
    createdAt: row.createdAt || raw.createdAt || '',
    updatedAt: row.updatedAt || raw.updatedAt || '',
    createdBy: row.createdBy || raw.createdBy || '',
    kategori: row.kategori || raw.kategori || '',
    laporanAwal: {
      ...laporanAwal,
      dokumentasi: documentationList
    },
    pelaksanaan: pelaksanaan,
    laporanDetail: raw.laporanDetail || {
      kronologi: '',
      penyebab: '',
      korbanJiwa: 0,
      korbanLuka: 0,
      kerugian: 0,
      keterangan: ''
    },
    auditLog: raw.auditLog || [],
    deleted: isDeletedFlag(
      row.deleted !== undefined ? row.deleted : raw.deleted
    ),
    deletedAt: row.deletedAt || raw.deletedAt || '',
    deletedBy: row.deletedBy || raw.deletedBy || ''
  };
}


function appendAuditLogEntry(reportId, action, field, before, after, context) {

  const actor = getActorContext(context);
  appendObjectToSheet(getRequiredSheet(SHEET_NAMES.AUDIT_LOG, [
    'reportId',
    'logId',
    'waktu',
    'userId',
    'username',
    'action',
    'field',
    'before',
    'after'
  ]), {
    reportId: reportId,
    logId: generateEntityId('LOG'),
    waktu: new Date().toISOString(),
    userId: actor.userId,
    username: actor.username,
    action: action,
    field: field || '*',
    before: JSON.stringify(before === undefined ? null : before),
    after: JSON.stringify(after === undefined ? null : after)
  });
}


function appendAuditChanges(reportId, before, after, context) {

  const fields = [
    'status',
    'kategori',
    'laporanAwal',
    'pelaksanaan',
    'laporanDetail',
    'deleted'
  ];
  let changed = false;

  fields.forEach(function (field) {
    const beforeValue = before && before[field];
    const afterValue = after && after[field];

    if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
      return;
    }

    changed = true;
    appendAuditLogEntry(
      reportId,
      'UPDATE',
      field,
      beforeValue,
      afterValue,
      context
    );
  });

  if (!changed) {
    appendAuditLogEntry(reportId, 'UPDATE', '*', before, after, context);
  }
}


function getDocumentationForReportId(reportId) {

  const normalizedId = String(reportId || '').trim();

  if (!normalizedId) {
    return [];
  }

  const sheet = getRequiredSheet(SHEET_NAMES.DOKUMENTASI, [
    'reportId',
    'namaFile',
    'url',
    'uploadedAt'
  ]);
  const indexes = getColumnIndexes(sheet);
  const reportIdIndex = indexes.reportId;
  const urlIndex = indexes.url;

  if (typeof reportIdIndex === 'undefined' || typeof urlIndex === 'undefined') {
    return [];
  }

  const matches = sheet
    .createTextFinder(normalizedId)
    .matchEntireCell(true)
    .findAll();
  const urls = [];

  matches.forEach(function (match) {
    if (match.getColumn() !== reportIdIndex + 1) {
      return;
    }

    const row = sheet
      .getRange(match.getRow(), 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const url = String(row[urlIndex] || '').trim();

    if (url && urls.indexOf(url) === -1) {
      urls.push(url);
    }
  });

  return urls;
}


function createUser(user, context) {

  return withWriteLock(function () {
    const sheet = getRequiredSheet(SHEET_NAMES.USERS, USERS_HEADERS);
    const input = user || {};
    const value = normalizeUserForSheet({
      ...input,
      id: input.id || generateEntityId('USR'),
      createdAt: new Date().toISOString()
    });
    const role = String(value.role || '').toUpperCase();

    if (!['SUPERADMIN', 'ADMIN', 'PETUGAS'].includes(role)) {
      throw new Error('Role user tidak valid.');
    }

    if (!value.username || !value.nama || !value.password) {
      throw new Error('Username, nama, dan password user wajib diisi.');
    }

    const existingUsername = findUserByUsername(value.username);

    if (existingUsername && String(existingUsername.id) !== String(value.id)) {
      throw new Error('Username sudah digunakan.');
    }

    if (findRowById(sheet, value.id, 'id')) {
      throw new Error('User dengan ID tersebut sudah ada.');
    }

    appendObjectToSheet(sheet, value);
    appendAuditLogEntry('USER:' + value.id, 'CREATE', '*', null,
      sanitizeUserForClient(value), context);
    invalidateDataCache();
    return sanitizeUserForClient(value);
  });
}


function getUserById(id) {

  const found = getObjectByIdFromSheet(
    getRequiredSheet(SHEET_NAMES.USERS, USERS_HEADERS),
    id,
    'id'
  );

  return found ? sanitizeUserForClient(parseUserSheetObject(found.object)) : null;
}


function getUsers(options) {

  const settings = options || {};
  const list = getUsersFromSheet().map(sanitizeUserForClient);
  const search = String(settings.search || '').toLowerCase();
  const filtered = list.filter(function (user) {
    return (!search || JSON.stringify(user).toLowerCase().indexOf(search) !== -1) &&
      (!settings.role || user.role === settings.role) &&
      (settings.aktif === undefined || user.aktif === normalizeBoolean(settings.aktif));
  });
  const offset = Math.max(Number(settings.offset) || 0, 0);
  const limit = Number(settings.limit);

  return limit > 0 ? filtered.slice(offset, offset + limit) : filtered.slice(offset);
}


function updateUser(id, patch, context) {

  return withWriteLock(function () {
    const sheet = getRequiredSheet(SHEET_NAMES.USERS, USERS_HEADERS);
    const found = getObjectByIdFromSheet(sheet, id, 'id');

    if (!found) {
      return null;
    }

    const existing = parseUserSheetObject(found.object);
    const nextRole = String((patch && patch.role) || existing.role).toUpperCase();

    if (!['SUPERADMIN', 'ADMIN', 'PETUGAS'].includes(nextRole)) {
      throw new Error('Role user tidak valid.');
    }

    const nextUsername = String(
      (patch && patch.username) || existing.username
    ).trim();
    const duplicateUser = findUserByUsername(nextUsername);
    const duplicate = duplicateUser &&
      String(duplicateUser.id) !== String(existing.id);

    if (duplicate) {
      throw new Error('Username sudah digunakan.');
    }

    const value = normalizeUserForSheet({
      ...existing,
      ...(patch || {}),
      id: existing.id,
      role: nextRole,
      createdAt: existing.createdAt
    });
    const before = sanitizeUserForClient(existing);
    const after = sanitizeUserForClient(value);

    updateObjectInSheet(sheet, id, value, 'id');
    appendAuditLogEntry('USER:' + id, 'UPDATE', '*', before, after, context);
    invalidateDataCache();
    return after;
  });
}


function deleteUser(id, context) {

  const before = getUserById(id);
  const result = updateUser(id, { aktif: false }, context);

  if (!result) {
    return false;
  }

  appendAuditLogEntry(
    'USER:' + id,
    'DELETE',
    'aktif',
    before ? before.aktif : true,
    false,
    context
  );

  return true;
}


function createReport(report, context) {

  return withWriteLock(function () {
    const sheet = getRequiredSheet(SHEET_NAMES.LAPORAN, REPORT_HEADERS);
    const input = report || {};
    const actor = getActorContext(context);
    const reportId = input.id || generateEntityId('RPT');
    const value = normalizeReportForSheet({
      ...input,
      id: reportId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actor.userId,
      deleted: false,
      deletedAt: '',
      deletedBy: ''
    });
    if (!value.kategori || !value.deskripsiLokasi) {
      throw new Error('Kategori dan deskripsi lokasi wajib diisi.');
    }

    if (findRowById(sheet, reportId, 'id')) {
      throw new Error('Laporan dengan ID tersebut sudah ada.');
    }

    appendObjectToSheet(sheet, value);
    upsertLocationForReport(reportId, input.laporanAwal && input.laporanAwal.lokasi);
    appendAuditLogEntry(reportId, 'CREATE', '*', null, value, context);
    invalidateDataCache();
    return getReportById(reportId, { includeDeleted: true });
  });
}


function getReportById(id, options) {

  const found = getObjectByIdFromSheet(
    getRequiredSheet(SHEET_NAMES.LAPORAN, REPORT_HEADERS),
    id,
    'id'
  );

  if (!found) {
    return null;
  }

  const report = parseReportSheetObject(
    found.object,
    getDocumentationForReportId(id)
  );

  if (report.deleted && !(options && options.includeDeleted)) {
    return null;
  }

  return report;
}


function canAccessReport(report, context) {

  const actor = getActorContext(context);

  if (!actor.role || actor.role === 'ADMIN' || actor.role === 'SUPERADMIN') {
    return true;
  }

  if (actor.role !== 'PETUGAS') {
    return false;
  }

  const awal = report && report.laporanAwal || {};
  const assigned = Array.isArray(awal.petugasDitugaskan)
    ? awal.petugasDitugaskan.map(String)
    : [];

  return assigned.indexOf(actor.userId) !== -1 ||
    assigned.indexOf(actor.username) !== -1;
}


function parseReportListRow(row) {

  const raw = safeJsonParse(row.rawDataJson) || {};
  const petugasDitugaskan = safeJsonParse(row.petugasDitugaskan);
  const assigned = Array.isArray(petugasDitugaskan)
    ? petugasDitugaskan
    : raw.laporanAwal && Array.isArray(raw.laporanAwal.petugasDitugaskan)
      ? raw.laporanAwal.petugasDitugaskan
      : [];

  return {
    id: row.id || raw.id || '',
    status: row.status || raw.status || '',
    createdAt: row.createdAt || raw.createdAt || '',
    updatedAt: row.updatedAt || raw.updatedAt || '',
    createdBy: row.createdBy || raw.createdBy || '',
    kategori: row.kategori || raw.kategori || '',
    laporanAwal: {
      nomorPelapor: row.nomorPelapor || raw.laporanAwal?.nomorPelapor || '',
      deskripsiLokasi: row.deskripsiLokasi || raw.laporanAwal?.deskripsiLokasi || '',
      jenisKegiatan: row.jenisKegiatan || raw.laporanAwal?.jenisKegiatan || '',
      lokasi: raw.laporanAwal?.lokasi || {},
      petugasDitugaskan: assigned,
      konfirmasiPenugasan: row.konfirmasiPenugasan || raw.laporanAwal?.konfirmasiPenugasan || ''
    },
    pelaksanaan: {
      petugasPelaksana: raw.pelaksanaan?.petugasPelaksana || [],
      waktuTiba: raw.pelaksanaan?.waktuTiba || null,
      waktuSelesai: raw.pelaksanaan?.waktuSelesai || null,
      hasilPenanganan: raw.pelaksanaan?.hasilPenanganan || ''
    },
    deleted: isDeletedFlag(row.deleted !== undefined ? row.deleted : raw.deleted)
  };
}


function getReports(options, context) {

  const settings = options || {};
  const search = String(settings.search || '').toLowerCase();
  const status = String(settings.status || '').trim();
  const kategori = String(settings.kategori || '').trim();
  const createdBy = String(settings.createdBy || '').trim();
  const assignedTo = String(settings.petugasId || settings.petugasDitugaskan || '').trim();
  const rows = readSheetRows(SHEET_NAMES.LAPORAN);
  const summaries = rows.map(parseReportListRow);
  const reports = summaries.filter(function (report) {
    const assigned = report.laporanAwal && report.laporanAwal.petugasDitugaskan;
    const assignedList = Array.isArray(assigned) ? assigned.map(String) : [];

    return !report.deleted &&
      canAccessReport(report, context) &&
      (!status || report.status === status) &&
      (!kategori || report.kategori === kategori) &&
      (!createdBy || report.createdBy === createdBy) &&
      (!assignedTo || assignedList.indexOf(assignedTo) !== -1) &&
      (!search || JSON.stringify(report).toLowerCase().indexOf(search) !== -1);
  });
  const sortBy = ['createdAt', 'updatedAt', 'status', 'kategori'].includes(settings.sortBy)
    ? settings.sortBy
    : '';
  const direction = String(settings.sortDirection || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  if (sortBy) {
    reports.sort(function (left, right) {
      return String(left[sortBy] || '').localeCompare(
        String(right[sortBy] || '')
      ) * direction;
    });
  }
  const pageSize = Number(settings.pageSize || settings.limit);
  const page = Math.max(Number(settings.page) || 1, 1);
  const offset = settings.pageSize
    ? (page - 1) * pageSize
    : Math.max(Number(settings.offset) || 0, 0);
  const limit = pageSize;
  const paged = limit > 0
    ? reports.slice(offset, offset + limit)
    : reports.slice(offset);

  if (settings.includeDetails === true) {
    return paged.map(function (summary) {
      return getReportById(summary.id, { includeDeleted: false }) || summary;
    });
  }

  return paged;
}


function updateReport(id, patch, context) {

  return withWriteLock(function () {
    const sheet = getRequiredSheet(SHEET_NAMES.LAPORAN, REPORT_HEADERS);
    const found = getObjectByIdFromSheet(sheet, id, 'id');

    if (!found) {
      return null;
    }

    const existing = parseReportSheetObject(
      found.object,
      getDocumentationForReportId(id)
    );
    const before = existing;
    const nextReport = {
      ...existing,
      ...(patch || {}),
      id: existing.id,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: new Date().toISOString()
    };
    const value = normalizeReportForSheet(nextReport);

    updateObjectInSheet(sheet, id, value, 'id');
    upsertLocationForReport(id, nextReport.laporanAwal && nextReport.laporanAwal.lokasi);
    appendAuditChanges(id, before, nextReport, context);
    invalidateDataCache();
    return getReportById(id, { includeDeleted: true });
  });
}


function deleteReport(id, context) {

  return withWriteLock(function () {
    const sheet = getRequiredSheet(SHEET_NAMES.LAPORAN, REPORT_HEADERS);
    const found = getObjectByIdFromSheet(sheet, id, 'id');
    const existing = getReportById(id, { includeDeleted: true });

    if (!found || !existing) {
      return false;
    }

    const actor = getActorContext(context);
    const deletedAt = new Date().toISOString();
    const value = normalizeReportForSheet({
      ...existing,
      deleted: true,
      deletedAt: deletedAt,
      deletedBy: actor.userId,
      updatedAt: deletedAt
    });

    updateObjectInSheet(sheet, id, value, 'id');
    invalidateDataCache();

    appendAuditLogEntry(id, 'DELETE', 'deleted', false, true, context);
    return true;
  });
}



// =========================================================
// SIMPAN USERS
// =========================================================

/**
 * @deprecated Compatibility migration wrapper. Use User CRUD actions.
 */
function saveUsersToSheet(users) {

  ensureRequiredSheets();

  const incomingUsers = Array.isArray(users) ? users : [];
  const userSheet = getSheet(SHEET_NAMES.USERS);

  incomingUsers.forEach(function (user) {
    const existing = user && user.id
      ? getObjectByIdFromSheet(userSheet, user.id, 'id')
      : null;
    const value = normalizeUserForSheet({
      ...(existing ? parseUserSheetObject(existing.object) : {}),
      ...(user || {})
    });

    if (!String(value.id).trim()) {
      return;
    }

    if (findRowById(userSheet, value.id, 'id')) {
      updateObjectInSheet(userSheet, value.id, value, 'id');
    } else {
      appendObjectToSheet(userSheet, value);
    }
  });

  invalidateDataCache();
  return incomingUsers.length;
}


// =========================================================
// SIMPAN REPORTS
// =========================================================

/**
 * @deprecated Compatibility migration wrapper. Use Report CRUD actions.
 */
function saveReportsToSheet(reports) {

  ensureRequiredSheets();

  const incomingReports = Array.isArray(reports) ? reports : [];
  const reportSheet = getSheet(SHEET_NAMES.LAPORAN);

  incomingReports.forEach(function (report) {
    const value = normalizeReportForSheet(report);

    if (!String(value.id).trim()) {
      return;
    }

    if (findRowById(reportSheet, value.id, 'id')) {
      updateObjectInSheet(reportSheet, value.id, value, 'id');
    } else {
      appendObjectToSheet(reportSheet, value);
    }

    upsertLocationForReport(
      value.id,
      report && report.laporanAwal && report.laporanAwal.lokasi
    );
  });

  invalidateDataCache();
  return incomingReports.length;
}


// =========================================================
// MEMBACA USERS
// =========================================================

function getUsersFromSheet() {

  const rows =
    readSheetRows(
      SHEET_NAMES.USERS
    );


  if (rows.length === 0) {

    return [];

  }


  return rows.map(function (row) {

    const raw =
      safeJsonParse(
        row.rawDataJson
      ) || {};


    return {

      id:
        row.id ||
        raw.id ||
        '',

      username:
        row.username ||
        raw.username ||
        '',

      password:
        row.password ||
        raw.password ||
        '',

      nama:
        row.nama ||
        raw.nama ||
        '',

      jabatan:
        row.jabatan ||
        raw.jabatan ||
        '',

      role:
        row.role ||
        raw.role ||
        'PETUGAS',

      unit:
        row.unit ||
        raw.unit ||
        '',

      aktif:
        normalizeBoolean(
          row.aktif !== undefined
            ? row.aktif
            : raw.aktif
        ),

      createdAt:
        row.createdAt ||
        raw.createdAt ||
        ''

    };

  });
}


function getMasterWilayah() {

  return readSheetRows(SHEET_NAMES.MASTER_WILAYAH)
    .filter(function (row) {
      return normalizeBoolean(row.aktif);
    })
    .map(function (row) {
      return {
        id: String(row.id || '').trim(),
        kabupaten: String(row.kabupaten || '').trim(),
        kecamatan: String(row.kecamatan || '').trim(),
        desaKelurahan: String(row.desaKelurahan || '').trim(),
        jenis: String(row.jenis || '').trim(),
        kodePos: String(row.kodePos || '').trim(),
        aktif: true
      };
    })
    .filter(function (row) {
      return row.kecamatan || row.desaKelurahan;
    });
}


function initializeMasterWilayah() {

  return withWriteLock(function () {
    const sheet = getRequiredSheet(SHEET_NAMES.MASTER_WILAYAH, [
      'id', 'kabupaten', 'kecamatan', 'desaKelurahan', 'jenis', 'kodePos', 'aktif'
    ]);
    const districtResponse = UrlFetchApp.fetch(
      'https://wilayah.id/api/districts/63.02.json',
      { muteHttpExceptions: true }
    );
    const districtPayload = JSON.parse(districtResponse.getContentText() || '{}');
    const districts = Array.isArray(districtPayload.data) ? districtPayload.data : [];
    let count = 0;

    districts.forEach(function (district) {
      const villageResponse = UrlFetchApp.fetch(
        'https://wilayah.id/api/villages/' + encodeURIComponent(district.code) + '.json',
        { muteHttpExceptions: true }
      );
      const villagePayload = JSON.parse(villageResponse.getContentText() || '{}');
      const villages = Array.isArray(villagePayload.data) ? villagePayload.data : [];

      villages.forEach(function (village) {
        const value = {
          id: village.code,
          kabupaten: 'Kabupaten Kotabaru',
          kecamatan: district.name,
          desaKelurahan: village.name,
          jenis: Number(String(village.code).split('.').pop()) < 2000
            ? 'Kelurahan'
            : 'Desa',
          kodePos: '',
          aktif: true
        };
        if (findRowById(sheet, value.id, 'id')) {
          updateObjectInSheet(sheet, value.id, value, 'id');
        } else {
          appendObjectToSheet(sheet, value);
        }
        count++;
      });
    });

    invalidateDataCache();
    return { ok: true, kecamatan: districts.length, desaKelurahan: count };
  });
}


// =========================================================
// MEMBACA REPORTS
// =========================================================

function getDocumentationByReportId() {

  if (arguments.length > 0) {
    return getDocumentationForReportId(arguments[0]);
  }

  const rows =
    readSheetRows(
      SHEET_NAMES.DOKUMENTASI
    );

  const documentationByReportId = {};

  rows.forEach(function (row) {

    const reportId = String(row.reportId || '').trim();
    const url = String(row.url || '').trim();

    if (!reportId || !url) {
      return;
    }

    if (!documentationByReportId[reportId]) {
      documentationByReportId[reportId] = [];
    }

    if (documentationByReportId[reportId].indexOf(url) === -1) {
      documentationByReportId[reportId].push(url);
    }

  });

  return documentationByReportId;
}

function getReportsFromSheet() {

  const rows =
    readSheetRows(
      SHEET_NAMES.LAPORAN
    );


  if (rows.length === 0) {

    return [];

  }

  const documentationByReportId =
    getDocumentationByReportId();


  return rows.map(function (row) {

    const raw =
      safeJsonParse(
        row.rawDataJson
      ) || {};


    let petugasDitugaskan = [];


    if (
      row.petugasDitugaskan
    ) {

      const parsed =
        safeJsonParse(
          row.petugasDitugaskan
        );

      if (Array.isArray(parsed)) {

        petugasDitugaskan =
          parsed;

      }

    }


    const laporanAwal =
      raw.laporanAwal || {

        nomorPelapor:
          row.nomorPelapor || '',

        deskripsiLokasi:
          row.deskripsiLokasi || '',

        jenisKegiatan:
          row.jenisKegiatan || '',

        petugasDitugaskan:
          petugasDitugaskan,

        konfirmasiPenugasan:
          row.konfirmasiPenugasan || ''

      };


    const savedDocumentation =
      documentationByReportId[String(row.id || raw.id || '').trim()] ||
      [];

    const existingDocumentation =
      raw.pelaksanaan &&
      Array.isArray(raw.pelaksanaan.dokumentasi)
        ? raw.pelaksanaan.dokumentasi
        : [];

    const initialDocumentation =
      raw.laporanAwal &&
      Array.isArray(raw.laporanAwal.dokumentasi)
        ? raw.laporanAwal.dokumentasi
        : [];

    const documentation =
      initialDocumentation
        .concat(existingDocumentation, savedDocumentation)
        .filter(function (item, index, list) {
        return list.indexOf(item) === index;
      });

    const pelaksanaan = raw.pelaksanaan || {

      petugasPelaksana: [],

      waktuTiba: null,

      waktuSelesai: null,

      hasilPenanganan: '',

      dokumentasi: []

    };

    pelaksanaan.dokumentasi = documentation;

    const hydratedLaporanAwal = {
      ...laporanAwal,
      dokumentasi: documentation
    };

    return {

      id:
        row.id ||
        raw.id ||
        '',

      status:
        row.status ||
        raw.status ||
        '',

      createdAt:
        row.createdAt ||
        raw.createdAt ||
        '',

      updatedAt:
        row.updatedAt ||
        raw.updatedAt ||
        '',

      createdBy:
        row.createdBy ||
        raw.createdBy ||
        '',

      kategori:
        row.kategori ||
        raw.kategori ||
        '',

      laporanAwal:
        hydratedLaporanAwal,

      pelaksanaan:
        pelaksanaan,

      laporanDetail:
        raw.laporanDetail || {

          kronologi: '',

          penyebab: '',

          korbanJiwa: 0,

          korbanLuka: 0,

          kerugian: 0,

          keterangan: ''

        },

      auditLog:
        raw.auditLog || []

      ,

      deleted:
        isDeletedFlag(
          row.deleted !== undefined
            ? row.deleted
            : raw.deleted
        ),

      deletedAt:
        row.deletedAt ||
        raw.deletedAt ||
        '',

      deletedBy:
        row.deletedBy ||
        raw.deletedBy ||
        ''

    };

  });
}


// =========================================================
// MEMBUAT DEFAULT USER
// =========================================================

function ensureDefaultUsersInSheet() {

  ensureRequiredSheets();

  const sheet =
    getSheet(SHEET_NAMES.USERS);

  const rows =
    readSheetRows(
      SHEET_NAMES.USERS
    );


  if (rows.length > 0) {

    return rows.length;

  }


  const defaults =
    getDefaultUsers();


  saveUsersToSheet(
    defaults
  );


  return defaults.length;
}


// =========================================================
// MEMBUAT DEFAULT REPORT
// =========================================================

function ensureDefaultReportsInSheet() {

  ensureRequiredSheets();

  const sheet =
    getSheet(SHEET_NAMES.LAPORAN);

  const rows =
    readSheetRows(
      SHEET_NAMES.LAPORAN
    );


  if (rows.length > 0) {

    return rows.length;

  }


  const defaults =
    getDefaultReports();


  saveReportsToSheet(
    defaults
  );


  return defaults.length;
}


// =========================================================
// SINKRONISASI DATA
// =========================================================

/**
 * @deprecated Compatibility migration wrapper. It performs per-ID upserts.
 */
function syncAllData(payload) {

  const data =
    payload &&
    typeof payload === 'object'
      ? payload
      : {};


  const users =
    Array.isArray(data.users)
      ? data.users
      : [];


  const reports =
    Array.isArray(data.reports)
      ? data.reports
      : [];


  ensureRequiredSheets();


  saveUsersToSheet(
    users
  );


  saveReportsToSheet(
    reports
  );

  invalidateDataCache();


  return {

    ok: true,

    usersCount:
      users.length,

    reportsCount:
      reports.length,

    message:
      'Data berhasil disinkronkan ke Google Sheets.'

  };
}


// =========================================================
// GET SEMUA DATA
// =========================================================

function getDataFromSheet() {

  return {

    users:
      getUsersFromSheet().map(
        sanitizeUserForClient
      ),

    reports:
      getReports(),

    masterWilayah:
      getMasterWilayah()

  };
}


function getDataForContext(context) {

  const actor = getActorContext(context);

  if (actor.role === 'PETUGAS') {
    return {
      users: getUsers(),
      reports: getReports({}, context),
      masterWilayah: getMasterWilayah()
    };
  }

  return getDataFromSheetCached();
}


function invalidateDataCache() {

  const cache = CacheService.getScriptCache();
  cache.remove(DATA_CACHE_KEY);
  cache.remove('sikompaK_data');

}


function getDataFromSheetCached() {

  const cache = CacheService.getScriptCache();
  const cached = cache.get(DATA_CACHE_KEY);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      cache.remove(DATA_CACHE_KEY);
    }
  }

  const data = getDataFromSheet();

  try {
    cache.put(
      DATA_CACHE_KEY,
      JSON.stringify(data),
      60
    );
  } catch (error) {
    Logger.log('Cache data tidak disimpan: ' + error.toString());
  }

  return data;
}


// =========================================================
// AUTENTIKASI DAN SESSION TOKEN
// =========================================================

function getTokenErrorResponse() {

  return {

    ok: false,

    error: 'TOKEN_INVALID_OR_EXPIRED',

    message: 'Sesi telah berakhir. Silakan login kembali.'

  };
}


function getForbiddenResponse() {

  return {

    ok: false,

    error: 'FORBIDDEN',

    message: 'Anda tidak memiliki izin untuk melakukan tindakan ini.'

  };
}


function getSessionColumnIndexes() {

  const indexes = {};

  SESSION_HEADERS.forEach(function (header, index) {

    indexes[header] = index;

  });

  return indexes;
}


function getSessionByToken(token) {

  const normalizedToken = String(token || '').trim();

  if (!normalizedToken) {

    return null;

  }

  const sheet = getRequiredSheet(SHEET_NAMES.SESSIONS, SESSION_HEADERS);
  const indexes = getSessionColumnIndexes();
  const tokenColumn = indexes.token + 1;
  const matches = sheet
    .getRange(2, tokenColumn, Math.max(sheet.getLastRow() - 1, 1), 1)
    .createTextFinder(normalizedToken)
    .matchEntireCell(true)
    .findAll();

  if (matches.length === 0) {
    return null;
  }

  const rowNumber = matches[0].getRow();
  return {
    rowNumber: rowNumber,
    row: sheet
      .getRange(rowNumber, 1, 1, sheet.getLastColumn())
      .getValues()[0],
    indexes: indexes
  };
}


function validateToken(token) {

  const session = getSessionByToken(token);

  if (!session) {

    return getTokenErrorResponse();

  }

  const row = session.row;
  const indexes = session.indexes;
  const sheet = getSheet(SHEET_NAMES.SESSIONS);

  if (!normalizeBoolean(row[indexes.aktif])) {

    return getTokenErrorResponse();

  }

  const expiresAt = new Date(row[indexes.expiresAt]);
  const now = new Date();

  if (isNaN(expiresAt.getTime()) || now.getTime() >= expiresAt.getTime()) {

    sheet.getRange(session.rowNumber, indexes.aktif + 1).setValue(false);

    return getTokenErrorResponse();

  }

  return {

    ok: true,

    userId: String(row[indexes.userId] || ''),

    username: String(row[indexes.username] || ''),

    role: String(row[indexes.role] || ''),

    user: {
      userId: String(row[indexes.userId] || ''),
      username: String(row[indexes.username] || ''),
      role: String(row[indexes.role] || '')
    }

  };
}


function cleanupExpiredSessions() {

  ensureRequiredSheets();

  const sheet = getSheet(SHEET_NAMES.SESSIONS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {

    return 0;

  }

  const indexes = getSessionColumnIndexes();
  const now = new Date().getTime();
  let deactivatedCount = 0;

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {

    const row = values[rowIndex];
    const expiresAt = new Date(row[indexes.expiresAt]).getTime();

    if (
      normalizeBoolean(row[indexes.aktif]) &&
      (!isFinite(expiresAt) || now >= expiresAt)
    ) {

      sheet.getRange(rowIndex + 1, indexes.aktif + 1).setValue(false);
      deactivatedCount++;

    }

  }

  return deactivatedCount;
}


function getPayloadDataObject(payload) {

  return payload && payload.data && typeof payload.data === 'object'
    ? payload.data
    : {};
}


function getPayloadToken(payload) {

  const data = getPayloadDataObject(payload);

  return payload && payload.token
    ? payload.token
    : data.token || '';
}


function findUserByUsername(username) {

  const normalizedUsername = String(username || '').trim().toLowerCase();

  if (!normalizedUsername) {
    return null;
  }

  const sheet = getRequiredSheet(SHEET_NAMES.USERS, USERS_HEADERS);
  const indexes = getColumnIndexes(sheet);
  const usernameIndex = indexes.username;

  if (typeof usernameIndex === 'undefined' || sheet.getLastRow() <= 1) {
    return null;
  }

  const matches = sheet
    .getRange(2, usernameIndex + 1, sheet.getLastRow() - 1, 1)
    .getValues();

  for (let index = 0; index < matches.length; index++) {
    if (String(matches[index][0] || '').trim().toLowerCase() !== normalizedUsername) {
      continue;
    }

    const rowNumber = index + 2;
    const values = sheet
      .getRange(rowNumber, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    const object = {};

    Object.keys(indexes).forEach(function (key) {
      object[key] = values[indexes[key]];
    });

    return parseUserSheetObject(object);
  }

  return null;
}


function loginUser(payload) {

  const data = getPayloadDataObject(payload);
  const username = String(
    payload.username || data.username || ''
  ).trim();
  const password = String(
    payload.password || data.password || ''
  );

  const user = findUserByUsername(username);

  if (!user || String(user.password) !== password || !normalizeBoolean(user.aktif)) {

    return {
      ok: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Username atau password salah.'
    };

  }

  const createdAt = new Date();
  const expiresAt = new Date(
    createdAt.getTime() + SESSION_DURATION_MS
  );
  const token = Utilities.getUuid() + '-' + Utilities.getUuid();

  withWriteLock(function () {
    const sheet = getRequiredSheet(SHEET_NAMES.SESSIONS, SESSION_HEADERS);

    sheet.appendRow([
      token,
      user.id,
      user.username,
      user.role,
      createdAt.toISOString(),
      expiresAt.toISOString(),
      true
    ]);
  });

  return {
    ok: true,
    token: token,
    expiresAt: expiresAt.toISOString(),
    user: sanitizeUserForClient(user)
  };
}


function logoutUser(token) {

  const session = getSessionByToken(token);

  if (!session) {

    return getTokenErrorResponse();

  }

  getRequiredSheet(SHEET_NAMES.SESSIONS, SESSION_HEADERS)
    .getRange(
      session.rowNumber,
      session.indexes.aktif + 1
    )
    .setValue(false);

  return {
    ok: true,
    message: 'Logout berhasil.'
  };
}


function authorizeRequest(payload, allowedRoles) {

  const tokenResult = validateToken(getPayloadToken(payload));

  if (!tokenResult.ok) {

    return tokenResult;

  }

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.indexOf(tokenResult.user.role) === -1
  ) {

    return getForbiddenResponse();

  }

  return tokenResult;
}


function getCrudData(payload) {

  return payload && payload.data && typeof payload.data === 'object'
    ? payload.data
    : {};
}


function getCrudId(payload) {

  const data = getCrudData(payload);
  return String(
    payload && (payload.id || payload.reportId || payload.userId) ||
    data.id || data.reportId || data.userId ||
    ''
  ).trim();
}


function handleCrudAction(payload, authorization) {

  const action = payload && payload.action;
  const data = getCrudData(payload);
  const id = getCrudId(payload);
  const context = authorization || {};
  let result;

  switch (action) {
    case 'initializeMasterWilayah':
      result = initializeMasterWilayah();
      return { ok: true, success: true, data: result, result: result };
    case 'createUser':
      result = createUser(data, context);
      return { ok: true, success: true, data: result, user: result };
    case 'getUser':
      result = getUserById(id);
      return result
        ? { ok: true, success: true, data: result, user: result }
        : { ok: false, error: 'USER_NOT_FOUND', message: 'User tidak ditemukan.' };
    case 'getUsers':
      result = getUsers(data);
      return { ok: true, success: true, data: result, users: result };
    case 'getMasterWilayah':
      result = getMasterWilayah();
      return { ok: true, success: true, data: result, masterWilayah: result };
    case 'updateUser':
      result = updateUser(id, data, context);
      return result
        ? { ok: true, success: true, data: result, user: result }
        : { ok: false, error: 'USER_NOT_FOUND', message: 'User tidak ditemukan.' };
    case 'deleteUser':
      result = deleteUser(id, context);
      return result
        ? { ok: true, success: true, data: { id: id, deleted: true }, deleted: true }
        : { ok: false, error: 'USER_NOT_FOUND', message: 'User tidak ditemukan.' };
    case 'createReport':
      result = createReport(data, context);
      return { ok: true, success: true, data: result, report: result };
    case 'getReport':
      result = getReportById(id, {
        includeDeleted: context.role === 'ADMIN' ||
          context.role === 'SUPERADMIN'
          ? data.includeDeleted
          : false
      });
      if (result && !canAccessReport(result, context)) {
        return getForbiddenResponse();
      }
      return result
        ? { ok: true, success: true, data: result, report: result }
        : { ok: false, error: 'REPORT_NOT_FOUND', message: 'Laporan tidak ditemukan.' };
    case 'getReports':
      result = getReports(data, context);
      return { ok: true, success: true, data: result, reports: result };
    case 'updateReport':
      result = getReportById(id, { includeDeleted: true });

      if (result && !canAccessReport(result, context)) {
        return getForbiddenResponse();
      }

      if (context.role === 'PETUGAS') {
        data = {
          status: data.status,
          pelaksanaan: data.pelaksanaan,
          laporanAwal: data.laporanAwal
            ? {
                konfirmasiPenugasan: data.laporanAwal.konfirmasiPenugasan,
                dokumentasi: data.laporanAwal.dokumentasi
              }
            : undefined
        };
      }

      result = updateReport(id, data, context);
      return result
        ? { ok: true, success: true, data: result, report: result }
        : { ok: false, error: 'REPORT_NOT_FOUND', message: 'Laporan tidak ditemukan.' };
    case 'deleteReport':
      result = deleteReport(id, context);
      return result
        ? { ok: true, success: true, data: { id: id, deleted: true }, deleted: true }
        : { ok: false, error: 'REPORT_NOT_FOUND', message: 'Laporan tidak ditemukan.' };
    default:
      return null;
  }
}


function getAllowedRolesForAction(action) {

  if (action === 'getUser') {
    return ['ADMIN', 'SUPERADMIN'];
  }

  if (action === 'initializeMasterWilayah') {
    return ['SUPERADMIN'];
  }

  if (
    action === 'saveUsers' ||
    action === 'syncAll' ||
    /^(create|update|delete)User$/.test(action) ||
    action === 'createReport' ||
    action === 'deleteReport' ||
    action === 'saveReports'
  ) {
    return ['ADMIN', 'SUPERADMIN'];
  }

  return null;
}


function getApiErrorResponse(error) {

  Logger.log('API ERROR: ' + error.toString());

  return {
    ok: false,
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Permintaan tidak dapat diproses.'
    }
  };
}


// =========================================================
// PARSE REQUEST
// =========================================================

function parseRequestPayload(e) {

  try {

    if (
      e &&
      e.parameter
    ) {

      const parameter =
        e.parameter || {};

      const action =
        parameter.action || '';

      let data = undefined;

      if (
        parameter.data
      ) {

        try {

          data =
            JSON.parse(
              parameter.data
            );

        } catch (error) {

          data =
            parameter.data;

        }

      }

      const nestedData =
        data && typeof data === 'object'
          ? data
          : {};

      const payload = {
        action: action,
        data: data,
        token: parameter.token || nestedData.token || '',
        username: parameter.username || nestedData.username || '',
        password: parameter.password || nestedData.password || '',
        id: parameter.id || nestedData.id || '',
        userId: parameter.userId || nestedData.userId || '',
        reportId: parameter.reportId || nestedData.reportId || '',
        images: parameter.images || nestedData.images || []
      };

      if (
        action ||
        parameter.reportId ||
        parameter.images ||
        data !== undefined
      ) {

        return payload;

      }

    }


    const raw =
      e &&
      e.postData &&
      e.postData.contents
        ? e.postData.contents
        : '{}';

    if (
      typeof raw === 'string' &&
      raw.trim().startsWith('{')
    ) {
      return JSON.parse(raw);
    }

    if (
      typeof raw === 'string' &&
      raw.trim().length > 0
    ) {
      const form = new URLSearchParams(raw);
      const formPayload = {};

      for (const [key, value] of form.entries()) {
        if (key === 'data' && value) {
          try {
            formPayload.data = JSON.parse(value);
          } catch (error) {
            formPayload.data = value;
          }
        } else {
          formPayload[key] = value;
        }
      }

      return formPayload;
    }


    return {};


  } catch (error) {

    Logger.log(
      'parseRequestPayload ERROR: ' +
      error.toString()
    );


    return {};

  }
}


// =========================================================
// DO GET
// =========================================================

function doGet(e) {
  const response = doGetJson(e);
  const callback = String(e && e.parameter && e.parameter.callback || '');

  if (/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${response.getContent()});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return response;
}


function doGetJson(e) {

  return handleRequest(e);
}


// =========================================================
// DO POST
// =========================================================

function handleRequest(e) {

  try {

    const payload =
      parseRequestPayload(e);

    if (!payload.action) {
      return ContentService
        .createTextOutput(
          JSON.stringify({
            ok: true,
            service: 'SIKOMPAK API',
            status: 'ONLINE',
            message: 'Google Apps Script berjalan.'
          })
        )
        .setMimeType(ContentService.MimeType.JSON);
    }


    if (payload.action === 'login') {

      return ContentService
        .createTextOutput(
          JSON.stringify(loginUser(payload))
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    if (payload.action === 'logout') {

      return ContentService
        .createTextOutput(
          JSON.stringify(logoutUser(getPayloadToken(payload)))
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    if (payload.action === 'initializeDatabase') {

      const setupAuthorization = getUsersFromSheet().length === 0
        ? { ok: true }
        : authorizeRequest(payload, ['SUPERADMIN']);

      if (!setupAuthorization.ok) {
        return ContentService
          .createTextOutput(JSON.stringify(setupAuthorization))
          .setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService
        .createTextOutput(
          JSON.stringify(initializeDatabase())
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    const authorization =
      authorizeRequest(
        payload,
        getAllowedRolesForAction(payload.action)
      );


    if (!authorization.ok) {

      return ContentService
        .createTextOutput(
          JSON.stringify(authorization)
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    const crudResult = handleCrudAction(payload, authorization);

    if (crudResult) {
      return ContentService
        .createTextOutput(
          JSON.stringify(crudResult)
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );
    }


    if (
      payload.action ===
      'syncAll'
    ) {

      const result =
        syncAllData(
          payload.data ||
          payload
        );


      return ContentService
        .createTextOutput(
          JSON.stringify({
            ok: true,
            result: result
          })
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    if (
      payload.action ===
      'getData'
    ) {

      return ContentService
        .createTextOutput(
          JSON.stringify({
            ok: true,
            data:
              getDataForContext(authorization)
          })
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    if (
      payload.action ===
      'saveUsers'
    ) {

      const count =
        saveUsersToSheet(
          Array.isArray(
            payload.data
          )
            ? payload.data
            : []
        );


      return ContentService
        .createTextOutput(
          JSON.stringify({
            ok: true,
            usersCount: count
          })
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    if (
      payload.action ===
      'saveReports'
    ) {

      const count =
        saveReportsToSheet(
          Array.isArray(
            payload.data
          )
            ? payload.data
            : []
        );


      return ContentService
        .createTextOutput(
          JSON.stringify({
            ok: true,
            reportsCount: count
          })
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    // =====================================================
    // UPLOAD IMAGES
    // =====================================================

    if (
      payload.action ===
      'uploadImages'
    ) {

      const nestedData =
        payload.data &&
        typeof payload.data === 'object'
          ? payload.data
          : {};

      const reportId =
        payload.reportId ||
        nestedData.reportId ||
        (e.parameter && e.parameter.reportId) ||
        '';


      const images =
        Array.isArray(payload.images) && payload.images.length > 0
          ? payload.images
          : (Array.isArray(nestedData.images)
              ? nestedData.images
              : (e.parameter && e.parameter.images) || []);


      if (!reportId) {

        return ContentService
          .createTextOutput(
            JSON.stringify({
              ok: false,
              error:
                'reportId wajib diisi untuk upload foto.'
            })
          )
          .setMimeType(
            ContentService.MimeType.JSON
          );

      }


      const report = getReportById(reportId);

      if (!report) {
        return ContentService
          .createTextOutput(
            JSON.stringify({
              ok: false,
              error: 'REPORT_NOT_FOUND',
              message: 'Laporan tidak ditemukan.'
            })
          )
          .setMimeType(
            ContentService.MimeType.JSON
          );
      }

      if (!canAccessReport(report, authorization)) {
        return ContentService
          .createTextOutput(JSON.stringify(getForbiddenResponse()))
          .setMimeType(ContentService.MimeType.JSON);
      }


      const result =
        uploadImagesToDrive(
          reportId,
          images
        );


      return ContentService
        .createTextOutput(
          JSON.stringify({
            ok: true,
            ...result
          })
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: false,
          message:
            'Action tidak dikenal.'
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );


  } catch (error) {

    return ContentService
      .createTextOutput(
        JSON.stringify(getApiErrorResponse(error))
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }
}


function doPost(e) {
  return handleRequest(e);
}


// =========================================================
// SANITIZE NAMA FILE
// =========================================================

function sanitizeFileName(name) {

  return String(
    name || 'foto'
  )

    .replace(
      /[^a-zA-Z0-9._-]/g,
      '-'
    )

    .replace(
      /-+/g,
      '-'
    )

    .replace(
      /^-|-$/g,
      ''
    )

    .toLowerCase()

    || 'foto';

}


// =========================================================
// SET DRIVE FOLDER ID
// =========================================================

function setDriveFolderId(folderId) {

  const normalized =
    String(
      folderId || ''
    ).trim();


  if (!normalized) {

    PropertiesService
      .getScriptProperties()
      .deleteProperty(
        'DRIVE_FOLDER_ID'
      );

    return getConfiguredDriveFolderId();

  }


  PropertiesService
    .getScriptProperties()
    .setProperty(
      'DRIVE_FOLDER_ID',
      normalized
    );


  return normalized;
}


// =========================================================
// GET DRIVE FOLDER ID
// =========================================================

function getConfiguredDriveFolderId() {

  const configuredId =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'DRIVE_FOLDER_ID'
      );


  if (
    configuredId &&
    configuredId.trim() !== ''
  ) {

    return configuredId.trim();

  }


  /*
   * ID folder default.
   *
   * Kalau ID ini tidak bisa diakses,
   * sistem akan otomatis membuat
   * folder SIKOMPAK.
   */

  return '1jz6QlcJlgRYAj8F06uFrsB7KJWujWFJJ';
}


// =========================================================
// MENDAPATKAN ROOT FOLDER DRIVE
// =========================================================

function getDriveRootFolder() {

  const folderId =
    getConfiguredDriveFolderId();


  // Jika ada ID folder
  if (
    folderId &&
    String(folderId).trim() !== ''
  ) {

    try {

      const folder =
        DriveApp.getFolderById(
          String(folderId).trim()
        );

      return folder;

    } catch (error) {

      Logger.log(
        'Folder ID tidak dapat diakses: ' +
        error.toString()
      );

    }

  }


  // Cari folder SIKOMPAK
  try {

    const folders =
      DriveApp.getFoldersByName(
        'SIKOMPAK'
      );


    if (folders.hasNext()) {

      return folders.next();

    }

  } catch (error) {

    Logger.log(
      'Gagal mencari folder SIKOMPAK: ' +
      error.toString()
    );

  }


  // Kalau belum ada → buat
  return DriveApp.createFolder(
    'SIKOMPAK'
  );
}


// =========================================================
// GET / CREATE SUBFOLDER
// =========================================================

function getOrCreateDriveFolder(
  folderName,
  parentFolder
) {

  const cleanName =
    String(
      folderName || 'Laporan'
    ).trim();


  if (!cleanName) {

    throw new Error(
      'Nama folder laporan tidak boleh kosong.'
    );

  }


  const folders =
    parentFolder
      ? parentFolder.getFoldersByName(
          cleanName
        )
      : DriveApp.getFoldersByName(
          cleanName
        );


  if (folders.hasNext()) {

    return folders.next();

  }


  return parentFolder
    ? parentFolder.createFolder(
        cleanName
      )
    : DriveApp.createFolder(
        cleanName
      );
}


// =========================================================
// MENYIMPAN DATA DOKUMENTASI
// =========================================================

function appendDocumentationRows(
  reportId,
  fileEntries
) {

  const sheet =
    getRequiredSheet(
      SHEET_NAMES.DOKUMENTASI,
      ['reportId', 'namaFile', 'url', 'uploadedAt']
    );


  const rows =
    Array.isArray(fileEntries)
      ? fileEntries
      : [];


  if (rows.length === 0) {

    return 0;

  }


  const values =
    rows.map(function (entry) {

      return [

        reportId,

        entry &&
        entry.namaFile
          ? entry.namaFile
          : '',

        entry &&
        entry.url
          ? entry.url
          : '',

        entry &&
        entry.uploadedAt
          ? entry.uploadedAt
          : new Date().toISOString()

      ];

    });


  const startRow =
    Math.max(
      sheet.getLastRow() + 1,
      2
    );


  sheet
    .getRange(
      startRow,
      1,
      values.length,
      4
    )
    .setValues(values);


  return values.length;
}


function attachDocumentationToReportRaw(
  reportId,
  fileEntries
) {

  const sheet = getSheet(SHEET_NAMES.LAPORAN);
  const found = getObjectByIdFromSheet(sheet, reportId, 'id');
  const entries = Array.isArray(fileEntries) ? fileEntries : [];
  const urls = entries.map(function (entry) {
    return entry && entry.url ? String(entry.url).trim() : '';
  }).filter(Boolean);

  if (!found || urls.length === 0) {
    return false;
  }

  const report = parseReportSheetObject(
    found.object,
    getDocumentationForReportId(reportId)
  );
  report.laporanAwal = report.laporanAwal || {};
  report.pelaksanaan = report.pelaksanaan || {};
  const documentation = (report.laporanAwal.dokumentasi || [])
    .concat(report.pelaksanaan.dokumentasi || [], urls)
    .filter(function (item, index, list) {
      return item && list.indexOf(item) === index;
    });
  report.laporanAwal.dokumentasi = documentation;
  report.pelaksanaan.dokumentasi = documentation;
  report.updatedAt = new Date().toISOString();

  const normalized = normalizeReportForSheet(report);
  updateObjectInSheet(sheet, reportId, normalized, 'id');
  return true;
}


function syncDocumentationToRawReports() {

  ensureRequiredSheets();

  const documentationByReportId =
    getDocumentationByReportId();

  let updatedCount = 0;

  Object.keys(documentationByReportId).forEach(function (reportId) {

    const entries = documentationByReportId[reportId].map(function (url) {
      return { url: url };
    });

    if (attachDocumentationToReportRaw(reportId, entries)) {
      updatedCount++;
    }

  });

  return {
    ok: true,
    updatedReports: updatedCount,
    message: 'Dokumentasi berhasil ditempelkan ke rawDataJson.'
  };
}


// =========================================================
// UPLOAD FOTO KE GOOGLE DRIVE
// =========================================================

function uploadImagesToDrive(
  reportId,
  images
) {

  const cleanReportId =
    String(
      reportId || ''
    ).trim();


  // Jangan pernah upload tanpa report ID
  if (!cleanReportId) {

    throw new Error(
      'reportId wajib diisi untuk upload foto.'
    );

  }


  const itemList =
    Array.isArray(images)
      ? images
      : [];


  if (itemList.length === 0) {

    invalidateDataCache();
    return {

      ok: true,

      reportId:
        cleanReportId,

      urls: [],

      saved: [],

      failed: 0

    };

  }


  const rootFolder =
    getDriveRootFolder();


  const reportFolder =
    getOrCreateDriveFolder(
      cleanReportId,
      rootFolder
    );


  const urls = [];

  const saved = [];

  const errors = [];

  let failed = 0;


  itemList.forEach(
    function (item, index) {

      try {

        const dataUrl =
          item &&
          item.dataUrl
            ? String(
                item.dataUrl
              ).trim()
            : '';


        let fileName =
          item &&
          item.name
            ? sanitizeFileName(
                item.name
              )
            : (
                'foto-' +
                (index + 1) +
                '.jpg'
              );


        if (!dataUrl) {

          failed++;

          errors.push({
            index: index,
            name: fileName,
            message: 'Data foto kosong.'
          });

          return;

        }


        if (
          !dataUrl.startsWith(
            'data:image/'
          )
        ) {

          failed++;

          errors.push({
            index: index,
            name: fileName,
            message: 'Format data foto tidak valid.'
          });

          return;

        }


        const match =
          dataUrl.match(
            /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/
          );


        if (!match) {

          failed++;

          errors.push({
            index: index,
            name: fileName,
            message: 'Data foto bukan Base64 image yang valid.'
          });

          return;

        }


        const mimeType =
          match[1];


        const base64Data =
          match[2].replace(/\s/g, '');


        const bytes =
          Utilities.base64Decode(
            base64Data
          );


        const blob =
          Utilities.newBlob(
            bytes,
            mimeType,
            fileName
          );


        const file =
          reportFolder.createFile(
            blob
          );

        try {

          file.setSharing(
            DriveApp.Access.ANYONE_WITH_LINK,
            DriveApp.Permission.VIEW
          );

        } catch (sharingError) {

          Logger.log(
            'Pengaturan sharing foto gagal: ' +
            sharingError.toString()
          );

        }

        const fileId =
          file.getId();

        const fileUrl =
          'https://lh3.googleusercontent.com/d/' +
          encodeURIComponent(fileId) +
          '=w1200';


        urls.push(
          fileUrl
        );


        saved.push({

          reportId:
            cleanReportId,

          namaFile:
            file.getName(),

          url:
            fileUrl,

          uploadedAt:
            new Date().toISOString()

        });


      } catch (error) {

        failed++;

        errors.push({
          index: index,
          name: fileName,
          message: error.toString()
        });

        Logger.log(
          'Upload foto gagal: ' +
          error.toString()
        );

      }

    }
  );


  const persistenceErrors = [];

  if (saved.length > 0) {
    withWriteLock(function () {
      try {
        appendDocumentationRows(
          cleanReportId,
          saved
        );
      } catch (error) {
        persistenceErrors.push('Dokumentasi: ' + error.toString());
        Logger.log('Penyimpanan dokumentasi gagal: ' + error.toString());
      }

      try {
        if (!attachDocumentationToReportRaw(cleanReportId, saved)) {
          persistenceErrors.push('rawDataJson laporan tidak ditemukan.');
        }
      } catch (error) {
        persistenceErrors.push('rawDataJson: ' + error.toString());
        Logger.log('Penempelan link ke rawDataJson gagal: ' + error.toString());
      }
    });
  }

  invalidateDataCache();


  return {

    ok: true,

    reportId:
      cleanReportId,

    urls:
      urls,

    saved:
      saved,

    failed: failed,

    errors: errors,
    persistenceErrors: persistenceErrors
  };
}


// =========================================================
// SET SPREADSHEET ID
// =========================================================

function setSpreadsheetId(
  spreadsheetId
) {

  const id =
    String(
      spreadsheetId || ''
    ).trim();


  if (!id) {

    throw new Error(
      'Spreadsheet ID tidak boleh kosong.'
    );

  }


  PropertiesService
    .getScriptProperties()
    .setProperty(
      'SPREADSHEET_ID',
      id
    );


  return id;
}


// =========================================================
// INITIALIZE DRIVE FOLDER
// =========================================================

function initializeDriveFolder(
  folderId
) {

  try {

    const normalized =
      String(
        folderId ||
        getConfiguredDriveFolderId() ||
        ''
      ).trim();


    const rootFolder =
      getDriveRootFolder();


    return {

      ok: true,

      driveFolderId:
        normalized ||
        rootFolder.getId(),

      rootFolderId:
        rootFolder.getId(),

      folderName:
        rootFolder.getName()

    };


  } catch (error) {

    return {

      ok: false,

      error:
        error.toString()

    };

  }
}


// =========================================================
// INITIALIZE DATABASE
// =========================================================

function initializeDatabase() {

  try {

    // Buat sheet
    ensureRequiredSheets();


    // Buat default User
    const usersCount =
      ensureDefaultUsersInSheet();


    // Buat default Report
    const reportsCount =
      ensureDefaultReportsInSheet();


    // Ambil ulang data
    const users =
      getUsersFromSheet();


    const reports =
      getReportsFromSheet();


    return {

      ok: true,

      message:
        'Database SIKOMPAK berhasil diinisialisasi.',

      sheetNames:
        Object.values(
          SHEET_NAMES
        ),

      usersCount:
        users.length,

      reportsCount:
        reports.length

    };


  } catch (error) {

    Logger.log(
      'initializeDatabase ERROR: ' +
      error.toString()
    );


    return {

      ok: false,

      message:
        'Gagal menginisialisasi database.',

      error:
        error.toString()

    };

  }
}


// =========================================================
// RESET DEFAULT DATABASE
// =========================================================
//
// PERHATIAN:
// Fungsi ini MENGHAPUS data Users dan Laporan lama
// kemudian memasukkan data default.
//
// Gunakan untuk testing.
//

function resetDefaultDatabase() {

  try {

    ensureRequiredSheets();


    // =====================================================
    // RESET USERS
    // =====================================================

    const usersSheet =
      getSheet(
        SHEET_NAMES.USERS
      );


    usersSheet.clearContents();


    usersSheet
      .getRange(
        1,
        1,
        1,
        USERS_HEADERS.length
      )
      .setValues([
        USERS_HEADERS
      ]);


    const defaultUsers =
      getDefaultUsers();


    const userValues =
      defaultUsers.map(
        function (user) {

          return [

            user.id || '',

            user.username || '',

            user.password || '',

            user.nama || '',

            user.jabatan || '',

            user.role || '',

            user.unit || '',

            normalizeBoolean(
              user.aktif
            ),

            user.createdAt || '',

            JSON.stringify(user)

          ];

        }
      );


    if (userValues.length > 0) {

      usersSheet
        .getRange(
          2,
          1,
          userValues.length,
          USERS_HEADERS.length
        )
        .setValues(
          userValues
        );

    }


    // =====================================================
    // RESET LAPORAN
    // =====================================================

    const laporanSheet =
      getSheet(
        SHEET_NAMES.LAPORAN
      );


    laporanSheet.clearContents();


    laporanSheet
      .getRange(
        1,
        1,
        1,
        REPORT_HEADERS.length
      )
      .setValues([
        REPORT_HEADERS
      ]);


    const defaultReports =
      getDefaultReports();


    const reportValues =
      defaultReports.map(
        function (report) {

          const awal =
            report.laporanAwal ||
            {};


          const petugas =
            Array.isArray(
              awal.petugasDitugaskan
            )
              ? awal.petugasDitugaskan
              : [];


          const jenisKegiatan =
            awal.jenisKegiatan ||
            awal.jenisPelanggaran ||
            awal.jenisKebakaran ||
            awal.jenisKejadian ||
            '';


          return [

            report.id || '',

            report.status || '',

            report.createdAt || '',

            report.updatedAt || '',

            report.createdBy || '',

            report.kategori || '',

            awal.nomorPelapor || '',

            awal.deskripsiLokasi || '',

            jenisKegiatan,

            JSON.stringify(
              petugas
            ),

            awal.konfirmasiPenugasan || '',

            false,

            '',

            '',

            JSON.stringify(report)

          ];

        }
      );


    if (reportValues.length > 0) {

      laporanSheet
        .getRange(
          2,
          1,
          reportValues.length,
          REPORT_HEADERS.length
        )
        .setValues(
          reportValues
        );

    }


    // =====================================================
    // HASIL
    // =====================================================

    return {

      ok: true,

      message:
        'Default User dan Laporan berhasil dibuat.',

      usersCount:
        defaultUsers.length,

      reportsCount:
        defaultReports.length,

      users:
        defaultUsers.map(
          function (user) {
            return user.username;
          }
        ),

      reports:
        defaultReports.map(
          function (report) {
            return report.id;
          }
        )

    };


  } catch (error) {

    Logger.log(
      'resetDefaultDatabase ERROR: ' +
      error.toString()
    );


    return {

      ok: false,

      message:
        'Gagal membuat default database.',

      error:
        error.toString()

    };

  }
}


// =========================================================
// CEK DATABASE
// =========================================================

function cekDatabase() {

  try {

    const ss =
      getDbSpreadsheet();


    const usersSheet =
      ss.getSheetByName(
        SHEET_NAMES.USERS
      );


    const laporanSheet =
      ss.getSheetByName(
        SHEET_NAMES.LAPORAN
      );


    const hasil = {

      ok: true,

      spreadsheetId:
        ss.getId(),

      spreadsheetName:
        ss.getName(),

      spreadsheetUrl:
        ss.getUrl(),

      users: {

        exists:
          !!usersSheet,

        rows:
          usersSheet
            ? usersSheet.getLastRow()
            : 0

      },

      laporan: {

        exists:
          !!laporanSheet,

        rows:
          laporanSheet
            ? laporanSheet.getLastRow()
            : 0

      }

    };


    Logger.log(
      JSON.stringify(
        hasil,
        null,
        2
      )
    );


    return hasil;


  } catch (error) {

    Logger.log(
      'cekDatabase ERROR: ' +
      error.toString()
    );


    return {

      ok: false,

      error:
        error.toString()

    };

  }
}


// =========================================================
// TEST DEFAULT REPORT
// =========================================================

function testDefaultReports() {

  try {

    const result =
      ensureDefaultReportsInSheet();


    const reports =
      getReportsFromSheet();


    Logger.log(
      'Jumlah report: ' +
      reports.length
    );


    Logger.log(
      JSON.stringify(
        reports,
        null,
        2
      )
    );


    return {

      ok: true,

      reportsCount:
        reports.length,

      reports:
        reports

    };


  } catch (error) {

    return {

      ok: false,

      error:
        error.toString()

    };

  }
}


// =========================================================
// TEST SYNC
// =========================================================

function testSync() {

  const sampleUsers = [

    {
      id:
        'USR-TEST-001',

      username:
        'demo',

      password:
        'demo123',

      nama:
        'User Demo',

      jabatan:
        'Petugas Demo',

      role:
        'PETUGAS',

      unit:
        'DAMKAR',

      aktif:
        true,

      createdAt:
        new Date().toISOString()

    }

  ];


  const sampleReports = [

    {

      id:
        'RPT-TEST-001',

      status:
        'MENUNGGU_PENUGASAN',

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

      createdBy:
        'USR-TEST-001',

      kategori:
        'pemadaman',

      laporanAwal: {

        nomorPelapor:
          '081234567890',

        lokasi: {

          alamat:
            'Jl. Test',

          latitude:
            -7.950000,

          longitude:
            112.610000,

          googleMapsUrl:
            'https://maps.google.com/?q=-7.95,112.61',

          sourceType:
            'DECIMAL',

          reverseGeocodingStatus:
            'BELUM_DICEK'

        },

        deskripsiLokasi:
          'Lokasi pengujian SIKOMPAK',

        jenisKegiatan:
          'Kebakaran Rumah',

        petugasDitugaskan:
          [],

        konfirmasiPenugasan:
          'BELUM_DITUGASKAN'

      },

      pelaksanaan: {

        petugasPelaksana:
          [],

        waktuTiba:
          null,

        waktuSelesai:
          null,

        hasilPenanganan:
          '',

        dokumentasi:
          []

      },

      laporanDetail: {

        kronologi:
          '',

        penyebab:
          '',

        korbanJiwa:
          0,

        korbanLuka:
          0,

        kerugian:
          0,

        keterangan:
          ''

      },

      auditLog:
        []

    }

  ];


  return syncAllData({

    users:
      sampleUsers,

    reports:
      sampleReports

  });

}
