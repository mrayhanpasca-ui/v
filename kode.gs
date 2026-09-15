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
      'latitude',
      'longitude',
      'googleMapsUrl',
      'sourceType',
      'reverseGeocodingStatus',
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
// SIMPAN USERS
// =========================================================

function saveUsersToSheet(users) {

  ensureRequiredSheets();

  const sheet =
    getSheet(SHEET_NAMES.USERS);

  const list =
    Array.isArray(users)
      ? users
      : [];


  // Bersihkan isi lama
  sheet.clearContents();


  // Tulis header
  sheet
    .getRange(
      1,
      1,
      1,
      USERS_HEADERS.length
    )
    .setValues([
      USERS_HEADERS
    ]);


  if (list.length === 0) {

    invalidateDataCache();
    return 0;

  }


  const values =
    list.map(function (user) {

      const clean = {

        id:
          user.id || '',

        username:
          user.username || '',

        password:
          user.password || '',

        nama:
          user.nama || '',

        jabatan:
          user.jabatan || '',

        role:
          user.role || '',

        unit:
          user.unit || '',

        aktif:
          normalizeBoolean(user.aktif),

        createdAt:
          user.createdAt ||
          new Date().toISOString(),

        rawDataJson:
          JSON.stringify(user)

      };


      return [

        clean.id,

        clean.username,

        clean.password,

        clean.nama,

        clean.jabatan,

        clean.role,

        clean.unit,

        clean.aktif,

        clean.createdAt,

        clean.rawDataJson

      ];

    });


  sheet
    .getRange(
      2,
      1,
      values.length,
      USERS_HEADERS.length
    )
    .setValues(values);


  invalidateDataCache();
  return list.length;
}


// =========================================================
// SIMPAN REPORTS
// =========================================================

function saveReportsToSheet(reports) {

  ensureRequiredSheets();

  const sheet =
    getSheet(SHEET_NAMES.LAPORAN);

  const list =
    Array.isArray(reports)
      ? reports
      : [];


  // Bersihkan isi lama
  sheet.clearContents();


  // Tulis header
  sheet
    .getRange(
      1,
      1,
      1,
      REPORT_HEADERS.length
    )
    .setValues([
      REPORT_HEADERS
    ]);


  if (list.length === 0) {

    invalidateDataCache();
    return 0;

  }


  const values =
    list.map(function (report) {

      const awal =
        report &&
        report.laporanAwal
          ? report.laporanAwal
          : {};


      const petugasDitugaskan =
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

        report.createdAt ||
          new Date().toISOString(),

        report.updatedAt ||
          new Date().toISOString(),

        report.createdBy || '',

        report.kategori ||
          awal.jenisLaporan ||
          '',

        awal.nomorPelapor || '',

        awal.deskripsiLokasi || '',

        jenisKegiatan,

        JSON.stringify(
          petugasDitugaskan
        ),

        awal.konfirmasiPenugasan || '',

        JSON.stringify(report)

      ];

    });


  sheet
    .getRange(
      2,
      1,
      values.length,
      REPORT_HEADERS.length
    )
    .setValues(values);


  invalidateDataCache();
  return list.length;
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


// =========================================================
// MEMBACA REPORTS
// =========================================================

function getDocumentationByReportId() {

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
      getUsersFromSheet(),

    reports:
      getReportsFromSheet()

  };
}


function invalidateDataCache() {

  CacheService
    .getScriptCache()
    .remove('sikompaK_data');

}


function getDataFromSheetCached() {

  const cache = CacheService.getScriptCache();
  const cached = cache.get('sikompaK_data');

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (error) {
      cache.remove('sikompaK_data');
    }
  }

  const data = getDataFromSheet();

  try {
    cache.put(
      'sikompaK_data',
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

  const sheet = getSheet(SHEET_NAMES.SESSIONS);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {

    return null;

  }

  const indexes = getSessionColumnIndexes();

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {

    const row = values[rowIndex];

    if (String(row[indexes.token] || '').trim() === normalizedToken) {

      return {
        rowNumber: rowIndex + 1,
        row: row,
        indexes: indexes
      };

    }

  }

  return null;
}


function validateToken(token) {

  ensureRequiredSheets();

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


function loginUser(payload) {

  ensureRequiredSheets();
  cleanupExpiredSessions();

  const data = getPayloadDataObject(payload);
  const username = String(
    payload.username || data.username || ''
  ).trim();
  const password = String(
    payload.password || data.password || ''
  );

  const user = getUsersFromSheet().find(function (candidate) {

    return candidate.username === username &&
      String(candidate.password) === password &&
      normalizeBoolean(candidate.aktif);

  });

  if (!user) {

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
  let token = '';

  do {

    token = Utilities.getUuid() + '-' + Utilities.getUuid();

  } while (getSessionByToken(token));

  const sheet = getSheet(SHEET_NAMES.SESSIONS);

  sheet.appendRow([
    token,
    user.id,
    user.username,
    user.role,
    createdAt.toISOString(),
    expiresAt.toISOString(),
    true
  ]);

  return {
    ok: true,
    token: token,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role
    },
    data: {
      users: getUsersFromSheet(),
      reports: getReportsFromSheet()
    }
  };
}


function logoutUser(token) {

  ensureRequiredSheets();

  const session = getSessionByToken(token);

  if (!session) {

    return getTokenErrorResponse();

  }

  getSheet(SHEET_NAMES.SESSIONS)
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

  try {

    const payload =
      parseRequestPayload(e);


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
        .setMimeType(
          ContentService.MimeType.JSON
        );

    }


    if (payload.action === 'initializeDatabase') {

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
        payload.action === 'saveUsers' ||
        payload.action === 'syncAll'
          ? ['ADMIN', 'SUPERADMIN']
          : null
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
              getDataFromSheetCached()
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


    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: true,
          data:
            getDataFromSheetCached()
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );


  } catch (error) {

    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: false,
          error:
            error.toString()
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }
}


// =========================================================
// DO POST
// =========================================================

function doPost(e) {

  try {

    const payload =
      parseRequestPayload(e);


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
        payload.action === 'saveUsers' ||
        payload.action === 'syncAll'
          ? ['ADMIN', 'SUPERADMIN']
          : null
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
              getDataFromSheetCached()
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
        JSON.stringify({
          ok: false,
          error:
            error.toString()
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }
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

  ensureRequiredSheets();


  const sheet =
    getSheet(
      SHEET_NAMES.DOKUMENTASI
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

  const sheet =
    getSheet(
      SHEET_NAMES.LAPORAN
    );

  const values =
    sheet
      .getDataRange()
      .getValues();

  if (values.length <= 1) {
    return false;
  }

  const headers = values[0].map(function (header) {
    return String(header || '').trim();
  });

  const idIndex = headers.indexOf('id');
  const rawIndex = headers.indexOf('rawDataJson');
  const updatedAtIndex = headers.indexOf('updatedAt');

  if (idIndex === -1 || rawIndex === -1) {
    return false;
  }

  const cleanReportId = String(reportId || '').trim();
  const entries = Array.isArray(fileEntries) ? fileEntries : [];
  const urls = entries.map(function (entry) {
    return entry && entry.url ? String(entry.url).trim() : '';
  }).filter(Boolean);

  if (!cleanReportId || urls.length === 0) {
    return false;
  }

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {

    if (String(values[rowIndex][idIndex] || '').trim() !== cleanReportId) {
      continue;
    }

    const raw = safeJsonParse(values[rowIndex][rawIndex]) || {};
    raw.laporanAwal = raw.laporanAwal || {};
    raw.pelaksanaan = raw.pelaksanaan || {};

    const currentInitial = Array.isArray(raw.laporanAwal.dokumentasi)
      ? raw.laporanAwal.dokumentasi
      : [];
    const currentExecution = Array.isArray(raw.pelaksanaan.dokumentasi)
      ? raw.pelaksanaan.dokumentasi
      : [];
    const documentation = currentInitial
      .concat(currentExecution, urls)
      .filter(function (item, index, list) {
        return item && list.indexOf(item) === index;
      });

    raw.laporanAwal.dokumentasi = documentation;
    raw.pelaksanaan.dokumentasi = documentation;
    raw.updatedAt = new Date().toISOString();

    sheet
      .getRange(rowIndex + 1, rawIndex + 1)
      .setValue(JSON.stringify(raw));

    if (updatedAtIndex !== -1) {
      sheet
        .getRange(rowIndex + 1, updatedAtIndex + 1)
        .setValue(raw.updatedAt);
    }

    return true;
  }

  return false;
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
