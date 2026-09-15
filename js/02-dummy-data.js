/* ================= INITIAL USERS ================= */

const INITIAL_USERS = [

  {
    id: 'USR-001',
    username: 'superadmin',
    password: 'superadmin123',
    nama: 'Super Admin',
    jabatan: 'Super Administrator',
    role: USER_ROLES.SUPERADMIN,
    unit: null,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  },

  {
    id: 'USR-002',
    username: 'admin',
    password: 'admin123',
    nama: 'Admin SIKOMPAK',
    jabatan: 'Admin Sistem',
    role: USER_ROLES.ADMIN,
    unit: null,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  },

  {
    id: 'USR-003',
    username: 'andi',
    password: 'andi123',
    nama: 'Andi Pratama',
    jabatan: 'Kepala Regu Damkar',
    role: USER_ROLES.PETUGAS,
    unit: UNIT_PENANGANAN.DAMKAR,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  },

  {
    id: 'USR-004',
    username: 'budi',
    password: 'budi123',
    nama: 'Budi Santoso',
    jabatan: 'Petugas Pemadam',
    role: USER_ROLES.PETUGAS,
    unit: UNIT_PENANGANAN.DAMKAR,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  },

  {
    id: 'USR-005',
    username: 'cahyo',
    password: 'cahyo123',
    nama: 'Cahyo Nugroho',
    jabatan: 'Petugas Penyelamatan',
    role: USER_ROLES.PETUGAS,
    unit: UNIT_PENANGANAN.DAMKAR,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  },

  {
    id: 'USR-006',
    username: 'dedi',
    password: 'dedi123',
    nama: 'Dedi Kurniawan',
    jabatan: 'Koordinator Satpol PP',
    role: USER_ROLES.PETUGAS,
    unit: UNIT_PENANGANAN.SATPOL_PP,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  },

  {
    id: 'USR-007',
    username: 'eka',
    password: 'eka123',
    nama: 'Eka Putri',
    jabatan: 'Petugas Pengendalian',
    role: USER_ROLES.PETUGAS,
    unit: UNIT_PENANGANAN.SATPOL_PP,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  },

  {
    id: 'USR-008',
    username: 'fajar',
    password: 'fajar123',
    nama: 'Fajar Maulana',
    jabatan: 'Petugas Penegakan',
    role: USER_ROLES.PETUGAS,
    unit: UNIT_PENANGANAN.SATPOL_PP,
    aktif: true,
    createdAt: '2026-08-25T08:00:00'
  }

];


/* ================= INITIAL REPORTS ================= */

const INITIAL_REPORTS = [

  {
    id: 'RPT-20260825-001',

    status: REPORT_STATUS.MENUNGGU_PENUGASAN,

    createdAt: '2026-08-25T08:30:00',

    createdBy: 'USR-002',

    updatedAt: '2026-08-25T08:30:00',


    laporanAwal: {

      nomorPelapor: '081234567890',

      lokasi: {

        inputAsli: '-7.983908, 112.621391',

        alamat: 'Jl. Soekarno Hatta, Malang',

        latitude: -7.983908,

        longitude: 112.621391,

        googleMapsUrl:
          'https://www.google.com/maps?q=-7.983908,112.621391',

        sourceType:
          LOCATION_SOURCE.DECIMAL,

        reverseGeocodingStatus:
          GEOCODING_STATUS.BERHASIL,

        updatedAt:
          '2026-08-25T08:30:00'

      },

      deskripsiLokasi:
        'Rumah berada di dekat minimarket.',

      unit:
        UNIT_PENANGANAN.DAMKAR,

      jenisLaporan:
        REPORT_CATEGORY.PEMADAMAN,

      jenisKegiatan:
        'Kebakaran Rumah',

      waktuLaporanMasuk:
        '2026-08-25T08:30:00',

      petugasDitugaskan: [],

      regu: null,

      konfirmasiPenugasan:
        'BELUM_DITUGASKAN'

    },


    pelaksanaan: {

      petugasPelaksana: [],

      waktuTiba: null,

      waktuSelesai: null,

      hasilPenanganan: '',

      dokumentasi: [],

      dataOperasional: {}

    },


    laporanDetail: {

      kronologi: '',

      penyebab: '',

      korbanJiwa: 0,

      korbanLuka: 0,

      kerugian: 0,

      keterangan: ''

    },


    auditLog: [

      {
        id: 'LOG-001',

        waktu:
          '2026-08-25T08:30:00',

        userId:
          'USR-002',

        username:
          'admin',

        action:
          'MEMBUAT_LAPORAN',

        field:
          null,

        before:
          null,

        after:
          'Laporan dibuat'

      }

    ]

  },


  {
    id: 'RPT-20260825-002',

    status:
      REPORT_STATUS.MENUNGGU_KONFIRMASI,

    createdAt:
      '2026-08-25T10:15:00',

    createdBy:
      'USR-002',

    updatedAt:
      '2026-08-25T10:20:00',


    laporanAwal: {

      nomorPelapor:
        '089876543210',

      lokasi: {

        inputAsli:
          'Jl. Raya Bandung No. 20',

        alamat:
          'Jl. Raya Bandung No. 20',

        latitude:
          null,

        longitude:
          null,

        googleMapsUrl:
          '',

        sourceType:
          LOCATION_SOURCE.ADDRESS,

        reverseGeocodingStatus:
          GEOCODING_STATUS.BELUM_DICEK,

        updatedAt:
          '2026-08-25T10:15:00'

      },

      deskripsiLokasi:
        'Bangunan di sebelah pasar.',

      unit:
        UNIT_PENANGANAN.SATPOL_PP,

      jenisLaporan:
        REPORT_CATEGORY.PENEGAKAN,

      jenisKegiatan:
        'Penertiban PKL',

      waktuLaporanMasuk:
        '2026-08-25T10:15:00',

      petugasDitugaskan: [
        'USR-005',
        'USR-006'
      ],

      regu:
        'Regu Satpol 1',

      konfirmasiPenugasan:
        'MENUNGGU_KONFIRMASI'

    },


    pelaksanaan: {

      petugasPelaksana: [],

      waktuTiba: null,

      waktuSelesai: null,

      hasilPenanganan: '',

      dokumentasi: [],

      dataOperasional: {}

    },


    laporanDetail: {

      kronologi: '',

      penyebab: '',

      korbanJiwa: 0,

      korbanLuka: 0,

      kerugian: 0,

      keterangan: ''

    },


    auditLog: []

  }

];