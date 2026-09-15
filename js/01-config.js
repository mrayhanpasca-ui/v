/* ================= SIKOMPAK CONFIG ================= */

/* ================= STORAGE ================= */

const STORAGE_KEY = 'sikompak-data-v3';
const USER_STORAGE_KEY = 'sikompak-users-v1';
const CURRENT_USER_STORAGE_KEY = 'sikompak-current-user';


/* ================= USER ROLES ================= */

const USER_ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  PETUGAS: 'PETUGAS'
};


/* ================= REPORT STATUS ================= */

const REPORT_STATUS = {
  DRAFT: 'DRAFT',

  MENUNGGU_PENUGASAN: 'MENUNGGU_PENUGASAN',

  MENUNGGU_KONFIRMASI: 'MENUNGGU_KONFIRMASI',

  DIPROSES: 'DIPROSES',

  SELESAI_PENANGANAN: 'SELESAI_PENANGANAN',

  MENUNGGU_LAPORAN_DETAIL: 'MENUNGGU_LAPORAN_DETAIL',

  SELESAI: 'SELESAI',

  DIBATALKAN: 'DIBATALKAN',

  DIARSIPKAN: 'DIARSIPKAN'
};


/* ================= STATUS LABEL ================= */

const STATUS_LABELS = {
  [REPORT_STATUS.DRAFT]: 'Draft',

  [REPORT_STATUS.MENUNGGU_PENUGASAN]:
    'Menunggu Penugasan',

  [REPORT_STATUS.MENUNGGU_KONFIRMASI]:
    'Menunggu Konfirmasi',

  [REPORT_STATUS.DIPROSES]:
    'Diproses',

  [REPORT_STATUS.SELESAI_PENANGANAN]:
    'Selesai Penanganan',

  [REPORT_STATUS.MENUNGGU_LAPORAN_DETAIL]:
    'Menunggu Laporan Detail',

  [REPORT_STATUS.SELESAI]:
    'Selesai',

  [REPORT_STATUS.DIBATALKAN]:
    'Dibatalkan',

  [REPORT_STATUS.DIARSIPKAN]:
    'Diarsipkan'
};


/* ================= STATUS WORKFLOW ================= */

const STATUS_TRANSITIONS = {

  [REPORT_STATUS.DRAFT]: [
    REPORT_STATUS.MENUNGGU_PENUGASAN,
    REPORT_STATUS.DIBATALKAN
  ],

  [REPORT_STATUS.MENUNGGU_PENUGASAN]: [
    REPORT_STATUS.MENUNGGU_KONFIRMASI,
    REPORT_STATUS.DIBATALKAN
  ],

  [REPORT_STATUS.MENUNGGU_KONFIRMASI]: [
    REPORT_STATUS.DIPROSES,
    REPORT_STATUS.DIBATALKAN
  ],

  [REPORT_STATUS.DIPROSES]: [
    REPORT_STATUS.SELESAI_PENANGANAN,
    REPORT_STATUS.DIBATALKAN
  ],

  [REPORT_STATUS.SELESAI_PENANGANAN]: [
    REPORT_STATUS.MENUNGGU_LAPORAN_DETAIL
  ],

  [REPORT_STATUS.MENUNGGU_LAPORAN_DETAIL]: [
    REPORT_STATUS.SELESAI
  ],

  [REPORT_STATUS.SELESAI]: [
    REPORT_STATUS.DIARSIPKAN
  ],

  [REPORT_STATUS.DIBATALKAN]: [
    REPORT_STATUS.DIARSIPKAN
  ],

  [REPORT_STATUS.DIARSIPKAN]: []
};


/* ================= UNIT ================= */

const UNIT_PENANGANAN = {
  DAMKAR: 'DAMKAR',
  SATPOL_PP: 'SATPOL_PP'
};


const UNIT_LABELS = {
  [UNIT_PENANGANAN.DAMKAR]: 'Damkar',
  [UNIT_PENANGANAN.SATPOL_PP]: 'Satpol PP'
};


/* ================= KATEGORI ================= */

const REPORT_CATEGORY = {
  PENGENDALIAN: 'pengendalian',
  PENEGAKAN: 'penegakan',
  PEMADAMAN: 'pemadaman',
  PENYELAMATAN: 'penyelamatan'
};


const CATEGORY_CONFIG = {

  [REPORT_CATEGORY.PENGENDALIAN]: {
    label: 'Pengendalian',
    unit: UNIT_PENANGANAN.SATPOL_PP,
    sektor: 'satpol'
  },

  [REPORT_CATEGORY.PENEGAKAN]: {
    label: 'Penegakan',
    unit: UNIT_PENANGANAN.SATPOL_PP,
    sektor: 'satpol'
  },

  [REPORT_CATEGORY.PEMADAMAN]: {
    label: 'Pemadaman',
    unit: UNIT_PENANGANAN.DAMKAR,
    sektor: 'damkar'
  },

  [REPORT_CATEGORY.PENYELAMATAN]: {
    label: 'Penyelamatan',
    unit: UNIT_PENANGANAN.DAMKAR,
    sektor: 'damkar'
  }

};


/* ================= LOCATION ================= */

const LOCATION_SOURCE = {
  ADDRESS: 'ADDRESS',
  DECIMAL: 'DECIMAL',
  DMS: 'DMS',
  GOOGLE_MAPS: 'GOOGLE_MAPS',
  WHATSAPP: 'WHATSAPP'
};


const GEOCODING_STATUS = {
  BELUM_DICEK: 'BELUM_DICEK',
  BERHASIL: 'BERHASIL',
  GAGAL: 'GAGAL'
};


/* ================= REPORT ID ================= */

function generateReportId(existingReports = []) {

  const now = new Date();

  const year = now.getFullYear();

  const month =
    String(now.getMonth() + 1).padStart(2, '0');

  const day =
    String(now.getDate()).padStart(2, '0');

  const prefix =
    `RPT-${year}${month}${day}-`;

  const todayReports =
    existingReports.filter(report =>
      report.id &&
      report.id.startsWith(prefix)
    );

  const sequence =
    String(todayReports.length + 1)
      .padStart(3, '0');

  return prefix + sequence;
}


/* ================= HELPERS ================= */

function getCurrentDateTime() {
  return new Date().toISOString();
}


function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}


function canChangeStatus(currentStatus, nextStatus) {

  const allowed =
    STATUS_TRANSITIONS[currentStatus] || [];

  return allowed.includes(nextStatus);
}