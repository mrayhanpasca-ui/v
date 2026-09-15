/* =========================================================
   05-dashboard.js
   DASHBOARD SIKOMPAK
   COMPATIBLE DENGAN INITIAL_REPORTS
========================================================= */


/* =========================================================
   STATE
========================================================= */

let currentFilter = 'semua';
let currentSearch = '';
let currentStatusFilter = 'semua';
let currentSort = 'terbaru';


/* =========================================================
   DASHBOARD UTAMA
========================================================= */

async function showDashboard() {

  const container =
    document.getElementById('dashboard-container');

  if (!container) {
    console.error(
      'dashboard-container tidak ditemukan.'
    );
    return;
  }

  if (!currentUser) {
    console.error(
      'currentUser belum tersedia.'
    );
    return;
  }

  function renderDashboardShell() {
    if (isSuperadmin()) {
      renderSuperadminDashboard();
      return;
    }

    if (isAdmin()) {
      renderAdminDashboard();
      return;
    }

    if (isPetugas()) {
      renderPetugasDashboard();
      return;
    }

    container.innerHTML = `
      <div class="empty-state">
        <div class="display">
          Role Tidak Dikenali
        </div>

        <div>
          Role akun tidak dikenali oleh sistem.
        </div>
      </div>
    `;
  }

  renderDashboardShell();

  const needsInitialLoad =
    !Array.isArray(users) || users.length === 0 ||
    !Array.isArray(reports) || reports.length === 0;

  if (!needsInitialLoad) {
    return;
  }

  showDatabaseLoading(
    'Memuat database',
    'Mengambil data pengguna dan laporan dari Google Sheets...'
  );

  try {
    const loadResults = await Promise.allSettled([
      typeof loadUsers === 'function'
        ? loadUsers()
        : Promise.resolve([]),
      typeof loadReports === 'function'
        ? loadReports()
        : Promise.resolve([])
    ]);

    const reportsResult = loadResults[1];

    if (reportsResult.status === 'rejected') {
      throw reportsResult.reason;
    }

    renderDashboardShell();
  }
  catch (error) {
    const reportListArea =
      document.getElementById('report-list-area') || container;

    reportListArea.innerHTML = `
      <div class="empty-state dashboard-empty">
        <div class="display">Database belum tersedia</div>
        <div>${escapeDashboardHtml(error?.message || 'Data laporan gagal dimuat.')}</div>
      </div>
    `;
  }
  finally {
    hideDatabaseLoading();
  }
}


/* =========================================================
   AMBIL SEMUA LAPORAN
========================================================= */

function getAllReports() {

  if (
    typeof reports !== 'undefined' &&
    Array.isArray(reports)
  ) {
    return reports.slice();
  }

  if (
    typeof INITIAL_REPORTS !== 'undefined' &&
    Array.isArray(INITIAL_REPORTS)
  ) {
    return INITIAL_REPORTS.slice();
  }

  return [];
}


/* =========================================================
   ADMIN REPORTS
========================================================= */

function getAdminReports() {

  /*
    Admin dapat melihat seluruh laporan.
  */

  return getAllReports();

}


/* =========================================================
   PETUGAS REPORTS
========================================================= */

function getMyPetugasReports() {

  const allReports =
    getAllReports();

  if (!currentUser) {
    return [];
  }

  const myId =
    String(
      currentUser.id || ''
    )
    .toLowerCase();

  const myUsername =
    String(
      currentUser.username || ''
    )
    .toLowerCase();

  const myNama =
    String(
      currentUser.nama || ''
    )
    .toLowerCase();


  return allReports.filter(
    report => {

      const laporanAwal =
        report?.laporanAwal || {};

      const petugasDitugaskan =
        Array.isArray(
          laporanAwal.petugasDitugaskan
        )
          ? laporanAwal.petugasDitugaskan
          : [];


      /*
        Struktur INITIAL_REPORTS:

        petugasDitugaskan: [
          'USR-005',
          'USR-006'
        ]
      */

      return petugasDitugaskan.some(
        petugas => {

          /*
            Kalau langsung berupa ID
          */

          if (
            String(petugas)
              .toLowerCase() === myId
          ) {
            return true;
          }


          /*
            Kalau berupa username
          */

          if (
            String(petugas)
              .toLowerCase() === myUsername
          ) {
            return true;
          }


          /*
            Kalau berupa nama
          */

          if (
            String(petugas)
              .toLowerCase() === myNama
          ) {
            return true;
          }


          return false;

        }
      );

    }
  );

}


/* =========================================================
   STATISTIK UMUM
========================================================= */

function renderOverviewStats(
  data
) {

  const total =
    data.length;


  const menunggu =
    data.filter(
      report =>
        getReportStatus(report) ===
        REPORT_STATUS.MENUNGGU_PENUGASAN
    ).length;


  const proses =
    data.filter(
      report =>
        getReportStatus(report) ===
        REPORT_STATUS.DIPROSES
    ).length;


  const selesai =
    data.filter(
      report => {

        const status =
          getReportStatus(report);

        return (
          status ===
            REPORT_STATUS.SELESAI ||
          status ===
            REPORT_STATUS.SELESAI_PENANGANAN
        );

      }
    ).length;


  return `

    <div class="stats-row dashboard-stats">

      <div class="stat-card">

        <div class="num">
          ${formatNumber(total)}
        </div>

        <div class="label">
          Total Laporan
        </div>

        <div class="sektor-mini">
          Seluruh laporan
        </div>

      </div>


      <div class="stat-card">

        <div class="num">
          ${formatNumber(menunggu)}
        </div>

        <div class="label">
          Menunggu Penugasan
        </div>

        <div class="sektor-mini">
          Belum ditugaskan
        </div>

      </div>


      <div class="stat-card">

        <div class="num">
          ${formatNumber(proses)}
        </div>

        <div class="label">
          Diproses
        </div>

        <div class="sektor-mini">
          Sedang ditangani
        </div>

      </div>


      <div class="stat-card">

        <div class="num">
          ${formatNumber(selesai)}
        </div>

        <div class="label">
          Selesai
        </div>

        <div class="sektor-mini">
          Penanganan selesai
        </div>

      </div>

    </div>

  `;
}


/* =========================================================
   STATISTIK PETUGAS
========================================================= */

function renderPetugasStats(
  reportsData
) {

  const total =
    reportsData.length;


  const proses =
    reportsData.filter(
      report =>
        getReportStatus(report) ===
        REPORT_STATUS.DIPROSES
    ).length;


  const selesai =
    reportsData.filter(
      report => {

        const status =
          getReportStatus(report);

        return (
          status ===
            REPORT_STATUS.SELESAI ||
          status ===
            REPORT_STATUS.SELESAI_PENANGANAN
        );

      }
    ).length;


  const belum =
    reportsData.filter(
      report => {

        const status =
          getReportStatus(report);

        return (
          status ===
            REPORT_STATUS.MENUNGGU_PENUGASAN ||
          status ===
            REPORT_STATUS.MENUNGGU_KONFIRMASI
        );

      }
    ).length;


  return `

    <div class="stats-row dashboard-stats">

      <div class="stat-card">

        <div class="num">
          ${formatNumber(total)}
        </div>

        <div class="label">
          Total Tugas
        </div>

        <div class="sektor-mini">
          Tugas saya
        </div>

      </div>


      <div class="stat-card">

        <div class="num">
          ${formatNumber(belum)}
        </div>

        <div class="label">
          Menunggu
        </div>

        <div class="sektor-mini">
          Belum mulai
        </div>

      </div>


      <div class="stat-card">

        <div class="num">
          ${formatNumber(proses)}
        </div>

        <div class="label">
          Diproses
        </div>

        <div class="sektor-mini">
          Sedang ditangani
        </div>

      </div>


      <div class="stat-card">

        <div class="num">
          ${formatNumber(selesai)}
        </div>

        <div class="label">
          Selesai
        </div>

        <div class="sektor-mini">
          Penanganan selesai
        </div>

      </div>

    </div>

  `;
}


/* =========================================================
   SEARCH + FILTER
========================================================= */

function renderSearchFilter() {

  return `

    <div class="toolbar-left dashboard-search-area">

      <div class="search-box">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >

          <circle
            cx="11"
            cy="11"
            r="7"
          />

          <path
            d="m20 20-4-4"
          />

        </svg>

        <input
          type="search"
          id="dashboard-search"
          placeholder="Cari laporan..."
          value="${escapeDashboardHtml(currentSearch)}"
          oninput="setDashboardSearch(this.value)"
        >

      </div>


      <div class="filter-tabs">

        <button
          class="filter-tab ${
            currentFilter === 'semua'
              ? 'active'
              : ''
          }"
          onclick="setDashboardFilter('semua')"
        >
          Semua
        </button>


        <button
          class="filter-tab ${
            currentFilter === 'satpol'
              ? 'active'
              : ''
          }"
          onclick="setDashboardFilter('satpol')"
        >
          Satpol PP
        </button>


        <button
          class="filter-tab ${
            currentFilter === 'damkar'
              ? 'active'
              : ''
          }"
          onclick="setDashboardFilter('damkar')"
        >
          Damkar
        </button>

      </div>

      <div class="dashboard-select-row">

        <label class="dashboard-select-label">
          Status
          <select
            onchange="setDashboardStatusFilter(this.value)"
          >
            <option value="semua" ${currentStatusFilter === 'semua' ? 'selected' : ''}>Semua status</option>
            ${Object.keys(REPORT_STATUS).map(status => `
              <option value="${status}" ${currentStatusFilter === status ? 'selected' : ''}>
                ${escapeDashboardHtml(getStatusLabelSafe(status))}
              </option>
            `).join('')}
          </select>
        </label>

        <label class="dashboard-select-label">
          Urutkan
          <select onchange="setDashboardSort(this.value)">
            <option value="terbaru" ${currentSort === 'terbaru' ? 'selected' : ''}>Terbaru</option>
            <option value="terlama" ${currentSort === 'terlama' ? 'selected' : ''}>Terlama</option>
            <option value="nomor-naik" ${currentSort === 'nomor-naik' ? 'selected' : ''}>Nomor kecil</option>
            <option value="nomor-turun" ${currentSort === 'nomor-turun' ? 'selected' : ''}>Nomor besar</option>
          </select>
        </label>

      </div>

    </div>

  `;
}


/* =========================================================
   SEARCH
========================================================= */

function setDashboardSearch(
  value
) {

  currentSearch =
    String(value || '')
      .trim()
      .toLowerCase();

  refreshDashboardList();

}


/* =========================================================
   FILTER
========================================================= */

function setDashboardFilter(
  filter
) {

  currentFilter =
    filter;

  refreshDashboardList();

}

function setDashboardStatusFilter(
  status
) {

  currentStatusFilter =
    status;

  refreshDashboardList();

}


function setDashboardSort(
  sort
) {

  currentSort =
    sort;

  refreshDashboardList();

}


/* =========================================================
   REFRESH
========================================================= */

function refreshDashboardList() {

  const data =
    getCurrentDashboardReports();

  renderDashboardReports(
    data,
    isPetugas()
  );


  document
    .querySelectorAll(
      '#dashboard-container .filter-tab'
    )
    .forEach(
      button => {

        const text =
          button.textContent
            .trim()
            .toLowerCase();

        let filter =
          'semua';

        if (
          text.includes('satpol')
        ) {
          filter = 'satpol';
        }

        if (
          text.includes('damkar')
        ) {
          filter = 'damkar';
        }

        button.classList.toggle(
          'active',
          filter === currentFilter
        );

      }
    );

}


/* =========================================================
   CURRENT REPORTS
========================================================= */

function getCurrentDashboardReports() {

  if (isSuperadmin()) {
    return getAllReports();
  }

  if (isAdmin()) {
    return getAdminReports();
  }

  if (isPetugas()) {
    return getMyPetugasReports();
  }

  return [];
}


/* =========================================================
   STATUS REPORT
========================================================= */

function getReportStatus(
  report
) {

  /*
    STRUKTUR BARU:

    report.status
  */

  if (
    report &&
    report.status
  ) {
    return report.status;
  }


  /*
    Fallback apabila ada
    data lama.
  */

  if (
    report?.data?.status
  ) {
    return report.data.status;
  }


  return REPORT_STATUS.MENUNGGU_PENUGASAN;

}


/* =========================================================
   RENDER REPORT LIST
========================================================= */

function renderDashboardReports(
  sourceReports,
  petugasMode = false
) {

  const container =
    document.getElementById(
      'report-list-area'
    );

  if (!container) {
    return;
  }


  let filtered =
    Array.isArray(sourceReports)
      ? sourceReports.slice()
      : [];


  /*
    FILTER UNIT
  */

  if (
    currentFilter !== 'semua'
  ) {

    filtered =
      filtered.filter(
        report =>
          getReportSector(report) ===
          currentFilter
      );

  }


  /*
    FILTER STATUS
  */

  if (
    currentStatusFilter !== 'semua'
  ) {

    filtered =
      filtered.filter(
        report =>
          getReportStatus(report) ===
          currentStatusFilter
      );

  }


  /*
    SEARCH
  */

  if (currentSearch) {

    filtered =
      filtered.filter(
        report =>
          reportMatchesSearch(
            report,
            currentSearch
          )
      );

  }


  /*
    SORT
  */

  filtered.sort(
    (a, b) => {

      if (
        currentSort === 'nomor-naik' ||
        currentSort === 'nomor-turun'
      ) {

        const comparison =
          String(a?.id || '').localeCompare(
            String(b?.id || ''),
            undefined,
            { numeric: true }
          );

        return currentSort === 'nomor-naik'
          ? comparison
          : -comparison;

      }

      const dateA =
        a?.updatedAt ||
        a?.createdAt ||
        '';

      const dateB =
        b?.updatedAt ||
        b?.createdAt ||
        '';

      const comparison = String(dateB)
        .localeCompare(String(dateA));

      return currentSort === 'terlama'
        ? -comparison
        : comparison;

    }
  );


  /*
    EMPTY
  */

  if (
    filtered.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-state dashboard-empty">

        <div class="display">
          ${
            petugasMode
              ? 'Belum ada tugas'
              : 'Belum ada laporan'
          }
        </div>

        <div>
          ${
            petugasMode
              ? 'Belum ada laporan yang ditugaskan kepada Anda.'
              : 'Belum ada laporan yang sesuai.'
          }
        </div>

      </div>

    `;

    return;

  }


  /*
    LIST
  */

  container.innerHTML = `

    <div class="report-list">

      ${filtered
        .map(
          report =>
            renderDashboardCard(
              report,
              petugasMode
            )
        )
        .join('')}

    </div>

  `;

}


/* =========================================================
   REPORT CARD
========================================================= */

function renderDashboardCard(
  report,
  petugasMode = false
) {

  const awal =
    report?.laporanAwal || {};

  const lokasi =
    awal.lokasi || {};


  const sektor =
    getReportSector(report);


  const sectorLabel =
    sektor === 'satpol'
      ? 'Satpol PP'
      : 'Damkar';


  const sectorClass =
    sektor === 'satpol'
      ? 'sk-satpol'
      : 'sk-damkar';


  const badgeClass =
    sektor === 'satpol'
      ? 'b-satpol'
      : 'b-damkar';


  const status =
    getReportStatus(report);


  const statusClass =
    getDashboardStatusClass(
      status
    );


  const reportId =
    report?.id || '';


  const nomor =
    report?.id ||
    '-';


  const alamat =
    lokasi.alamat ||
    lokasi.inputAsli ||
    'Lokasi belum diisi';


  const jenis =
    getReportType(report);


  const tanggal =
    awal.waktuLaporanMasuk ||
    report.createdAt ||
    '';


  const petugas =
    getAssignedPetugasNames(report);


  const subtitle =
    [
      awal.jenisLaporan,
      awal.jenisKegiatan
    ]
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.indexOf(value) === index
      )
      .join(' · ');


  return `

    <div
      class="report-card ${sectorClass}"
      onclick="toggleDashboardDetail(
        '${escapeDashboardAttribute(reportId)}',
        event
      )"
    >

      <div class="spine"></div>


      <div class="rc-main">


        <div class="rc-top">

          <span class="badge ${badgeClass}">

            ${escapeDashboardHtml(
              sectorLabel
            )}

            ·

            ${escapeDashboardHtml(
              jenis || 'Laporan'
            )}

          </span>


          <span
            class="status-badge ${statusClass}"
          >

            ${escapeDashboardHtml(
              getStatusLabelSafe(status)
            )}

          </span>


          <span class="rc-date mono">

            ${escapeDashboardHtml(
              formatDashboardDate(
                tanggal
              )
            )}

          </span>

        </div>


        <div class="report-number mono">

          #${escapeDashboardHtml(
            nomor
          )}

        </div>


        <div class="rc-loc">

          📍

          ${escapeDashboardHtml(
            alamat
          )}

        </div>


        <div class="rc-sub">

          ${escapeDashboardHtml(
            subtitle ||
            'Tidak ada keterangan tambahan'
          )}

        </div>


        <div class="rc-sub assignment-line">

          👤 Petugas:

          <strong>

            ${escapeDashboardHtml(
              petugas
            )}

          </strong>

        </div>


        <div
          class="rc-detail"
          id="dashboard-detail-${escapeDashboardAttribute(reportId)}"
        >

          ${renderDashboardDetail(
            report,
            petugasMode
          )}

        </div>


      </div>


      <div class="rc-actions">

        ${renderDashboardActions(
          report,
          petugasMode
        )}

      </div>

    </div>

  `;

}


/* =========================================================
   NAMA PETUGAS
========================================================= */

function getAssignedPetugasNames(
  report
) {

  const awal =
    report?.laporanAwal || {};

  const assigned =
    Array.isArray(
      awal.petugasDitugaskan
    )
      ? awal.petugasDitugaskan
      : [];


  if (
    assigned.length === 0
  ) {

    return 'Belum ditugaskan';

  }


  const names =
    assigned.map(
      userId => {

        /*
          Cari dari daftar users.
        */

        const user =
          getAllUsers().find(
            item =>
              String(item.id)
                .toLowerCase() ===
              String(userId)
                .toLowerCase()
          );


        if (user) {
          return user.nama ||
            user.username;
        }


        /*
          Kalau ternyata data
          sudah berupa nama.
        */

        return String(
          userId
        );

      }
    );


  return names.join(', ');

}


/* =========================================================
   GET USERS
========================================================= */

function getAllUsers() {

  if (
    typeof users !== 'undefined' &&
    Array.isArray(users)
  ) {

    return users;

  }


  if (
    typeof INITIAL_USERS !== 'undefined' &&
    Array.isArray(INITIAL_USERS)
  ) {

    return INITIAL_USERS;

  }


  return [];

}


/* =========================================================
   DETAIL
========================================================= */

function renderDashboardDetail(
  report,
  petugasMode
) {

  const awal =
    report?.laporanAwal || {};

  const pelaksanaan =
    report?.pelaksanaan || {};

  const detail =
    report?.laporanDetail || {};

  const lokasi =
    awal.lokasi || {};


  let html = '';


  /*
    NOMOR PELAPOR
  */

  if (
    awal.nomorPelapor
  ) {

    html += `

      <div class="detail-item">

        <div class="dl">
          Nomor Pelapor
        </div>

        <div class="dv">

          <a
            class="phone-link"
            href="https://wa.me/${formatDashboardWhatsApp(
              awal.nomorPelapor
            )}"
            target="_blank"
            onclick="event.stopPropagation()"
          >

            ${escapeDashboardHtml(
              awal.nomorPelapor
            )}

          </a>

        </div>

      </div>

    `;

  }


  /*
    LOKASI
  */

  if (
    lokasi.alamat ||
    lokasi.inputAsli
  ) {

    html += `

      <div class="detail-item full">

        <div class="dl">
          Lokasi
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            lokasi.alamat ||
            lokasi.inputAsli
          )}

        </div>


        ${
          lokasi.latitude !== null &&
          lokasi.latitude !== undefined &&
          lokasi.longitude !== null &&
          lokasi.longitude !== undefined

          ? `

            <div class="dv mono">

              (${escapeDashboardHtml(
                lokasi.latitude
              )},
              ${escapeDashboardHtml(
                lokasi.longitude
              )})

            </div>

          `
          : ''
        }


        ${
          lokasi.googleMapsUrl

          ? `

            <div class="detail-loc-meta">

              <a
                class="loc-maps-link"
                href="${escapeDashboardAttribute(
                  lokasi.googleMapsUrl
                )}"
                target="_blank"
                onclick="event.stopPropagation()"
              >

                🗺️ Buka Google Maps ↗

              </a>

            </div>

          `
          : ''
        }

      </div>

    `;

  }


  /*
    DESKRIPSI LOKASI
  */

  if (
    awal.deskripsiLokasi
  ) {

    html += `

      <div class="detail-item full">

        <div class="dl">
          Deskripsi Lokasi
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            awal.deskripsiLokasi
          )}

        </div>

      </div>

    `;

  }


  /*
    UNIT
  */

  html += `

    <div class="detail-item">

      <div class="dl">
        Unit Penanganan
      </div>

      <div class="dv">

        ${escapeDashboardHtml(
          getUnitLabel(
            awal.unit
          )
        )}

      </div>

    </div>

  `;


  /*
    PETUGAS
  */

  html += `

    <div class="detail-item">

      <div class="dl">
        Petugas / Regu
      </div>

      <div class="dv">

        ${escapeDashboardHtml(
          getAssignedPetugasNames(
            report
          )
        )}

        ${
          awal.regu
            ? `
              <br>
              Regu:
              ${escapeDashboardHtml(
                awal.regu
              )}
            `
            : ''
        }

      </div>

    </div>

  `;


  /*
    KONFIRMASI
  */

  if (
    awal.konfirmasiPenugasan
  ) {

    html += `

      <div class="detail-item">

        <div class="dl">
          Konfirmasi Penugasan
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            awal.konfirmasiPenugasan
          )}

        </div>

      </div>

    `;

  }


  /*
    WAKTU TIBA
  */

  if (
    pelaksanaan.waktuTiba
  ) {

    html += `

      <div class="detail-item">

        <div class="dl">
          Waktu Tiba
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            pelaksanaan.waktuTiba
          )}

        </div>

      </div>

    `;

  }


  /*
    WAKTU SELESAI
  */

  if (
    pelaksanaan.waktuSelesai
  ) {

    html += `

      <div class="detail-item">

        <div class="dl">
          Waktu Selesai
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            pelaksanaan.waktuSelesai
          )}

        </div>

      </div>

    `;

  }


  /*
    HASIL PENANGANAN
  */

  if (
    pelaksanaan.hasilPenanganan
  ) {

    html += `

      <div class="detail-item full">

        <div class="dl">
          Hasil Penanganan
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            pelaksanaan.hasilPenanganan
          )}

        </div>

      </div>

    `;

  }


  /*
    KRONOLOGI
  */

  if (
    detail.kronologi
  ) {

    html += `

      <div class="detail-item full">

        <div class="dl">
          Kronologi
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            detail.kronologi
          )}

        </div>

      </div>

    `;

  }


  /*
    PENYEBAB
  */

  if (
    detail.penyebab
  ) {

    html += `

      <div class="detail-item full">

        <div class="dl">
          Penyebab
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            detail.penyebab
          )}

        </div>

      </div>

    `;

  }


  /*
    KORBAN JIWA
  */

  html += `

    <div class="detail-item">

      <div class="dl">
        Korban Jiwa
      </div>

      <div class="dv">

        ${escapeDashboardHtml(
          detail.korbanJiwa ?? 0
        )}

      </div>

    </div>

  `;


  /*
    KORBAN LUKA
  */

  html += `

    <div class="detail-item">

      <div class="dl">
        Korban Luka
      </div>

      <div class="dv">

        ${escapeDashboardHtml(
          detail.korbanLuka ?? 0
        )}

      </div>

    </div>

  `;


  /*
    KERUGIAN
  */

  if (
    detail.kerugian !== undefined
  ) {

    html += `

      <div class="detail-item">

        <div class="dl">
          Kerugian
        </div>

        <div class="dv">

          Rp ${escapeDashboardHtml(
            Number(
              detail.kerugian || 0
            ).toLocaleString(
              'id-ID'
            )
          )}

        </div>

      </div>

    `;

  }


  /*
    KETERANGAN
  */

  if (
    detail.keterangan
  ) {

    html += `

      <div class="detail-item full">

        <div class="dl">
          Keterangan
        </div>

        <div class="dv">

          ${escapeDashboardHtml(
            detail.keterangan
          )}

        </div>

      </div>

    `;

  }


  const documentationImages = Array.isArray(pelaksanaan.dokumentasi)
    ? pelaksanaan.dokumentasi
        .map(function (image) {
          if (!image) return null;
          if (typeof image === 'string') {
            const source = normalizeDocumentImageUrl(image);
            const link = getDocumentOpenUrl(image);
            return source && link ? { src: source, href: link } : null;
          }
          if (typeof image === 'object') {
            const source = image.url || image.dataUrl || image.imageUrl || image.src || '';
            const normalized = normalizeDocumentImageUrl(source);
            const link = getDocumentOpenUrl(source);
            return normalized && link ? { src: normalized, href: link } : null;
          }
          return null;
        })
        .filter(Boolean)
    : [];

  if (documentationImages.length) {

    html += `

      <div class="detail-item full">

        <div class="dl">
          Dokumentasi
        </div>

        <div class="documentation-grid">

          ${
            documentationImages
              .map(
                image => `

                  <a
                    href="${escapeDashboardAttribute(image.href)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    onclick="event.stopPropagation();"
                    class="documentation-item"
                  >
                    <img
                      src="${escapeDashboardAttribute(image.src)}"
                      alt="Dokumentasi laporan"
                      loading="lazy"
                      data-fallback-urls="${escapeDashboardAttribute([
                        image.src,
                        image.src.replace('https://lh3.googleusercontent.com/d/', 'https://drive.google.com/uc?export=view&id=').replace(/=w1200$/, ''),
                        image.src.replace(/^https:\/\/lh3\.googleusercontent\.com\/d\/([^=]+)=w1200$/, 'https://drive.google.com/thumbnail?id=$1&sz=w1200')
                      ].join('|'))}"
                      onerror="if (this.dataset.fallbackUrls) { const urls = this.dataset.fallbackUrls.split('|'); urls.shift(); this.dataset.fallbackUrls = urls.join('|'); if (urls[0]) { this.src = urls[0]; } else { this.style.display='none'; this.parentElement.classList.add('media-error'); } }"
                    >
                  </a>

                `
              )
              .join('')
          }

        </div>

      </div>

    `;

  }


  return html;

}


/* =========================================================
   ACTIONS
========================================================= */

function renderDashboardActions(
  report,
  petugasMode
) {

  const id =
    report?.id || '';


  if (
    petugasMode
  ) {

    return `

      <button
        class="action-main"
        onclick="
          openPetugasTask(
            '${escapeDashboardAttribute(id)}',
            event
          )
        "
      >
        Buka Tugas
      </button>

    `;

  }


  if (
    isAdmin() ||
    isSuperadmin()
  ) {

    const deleteAction =
      isSuperadmin()
        ? `
          <button
            class="icon-btn delete-report-btn"
            title="Hapus laporan permanen"
            onclick="
              deleteSuperadminReport(
                '${escapeDashboardAttribute(id)}',
                event
              )
            "
          >
            <span aria-hidden="true">⌫</span>
            <span>Hapus</span>
          </button>
        `
        : '';

    return `

      <div class="report-action-group">

      <button
        class="icon-btn edit-report-btn"
        title="Kelola Laporan"
        onclick="
          openAdminReport(
            '${escapeDashboardAttribute(id)}',
            event
          )
        "
      >
        <span aria-hidden="true">✎</span>
        <span>Edit</span>
      </button>

      ${deleteAction}

      </div>

    `;

  }


  return '';

}


/* =========================================================
   TOGGLE DETAIL
========================================================= */

function toggleDashboardDetail(
  id,
  event
) {

  if (
    event &&
    event.target &&
    event.target.closest(
      'button,a,input,select'
    )
  ) {
    return;
  }


  const detail =
    document.getElementById(
      'dashboard-detail-' + id
    );


  if (detail) {

    detail.classList.toggle(
      'open'
    );

  }

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getDashboardStatusClass(
  status
) {

  const normalized =
    normalizeDashboardStatus(
      status
    );


  if (
    normalized ===
    REPORT_STATUS.SELESAI
  ) {
    return 'status-selesai';
  }


  if (
    normalized ===
    REPORT_STATUS.SELESAI_PENANGANAN
  ) {
    return 'status-selesai';
  }


  if (
    normalized ===
    REPORT_STATUS.DIPROSES
  ) {
    return 'status-proses';
  }


  if (
    normalized ===
    REPORT_STATUS.MENUNGGU_LAPORAN_DETAIL
  ) {
    return 'status-proses';
  }


  return 'status-belum-selesai';

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeDashboardStatus(
  status
) {

  return String(
    status || ''
  )
    .trim()
    .toUpperCase();

}


/* =========================================================
   STATUS LABEL
========================================================= */

function getStatusLabelSafe(
  status
) {

  if (
    typeof getStatusLabel ===
    'function'
  ) {

    return getStatusLabel(
      status
    );

  }


  const labels = {

    DRAFT:
      'Draft',

    MENUNGGU_PENUGASAN:
      'Menunggu Penugasan',

    MENUNGGU_KONFIRMASI:
      'Menunggu Konfirmasi',

    DIPROSES:
      'Diproses',

    SELESAI_PENANGANAN:
      'Selesai Penanganan',

    MENUNGGU_LAPORAN_DETAIL:
      'Menunggu Laporan Detail',

    SELESAI:
      'Selesai',

    DIBATALKAN:
      'Dibatalkan',

    DIARSIPKAN:
      'Diarsipkan'

  };


  return (
    labels[status] ||
    status ||
    '-'
  );

}


/* =========================================================
   GET SECTOR
========================================================= */

function getReportSector(
  report
) {

  const awal =
    report?.laporanAwal || {};


  const unit =
    String(
      awal.unit || ''
    )
      .trim()
      .toUpperCase();


  if (
    unit ===
    UNIT_PENANGANAN.SATPOL_PP
  ) {
    return 'satpol';
  }


  if (
    unit ===
    UNIT_PENANGANAN.DAMKAR
  ) {
    return 'damkar';
  }


  /*
    Fallback berdasarkan kategori.
  */

  const category =
    awal.jenisLaporan ||
    report?.kategori ||
    '';


  if (
    typeof CATEGORY_CONFIG !==
    'undefined'
  ) {

    const cfg =
      CATEGORY_CONFIG[
        category
      ];


    if (cfg) {
      return cfg.sektor;
    }

  }


  const categoryText =
    String(
      category
    ).toLowerCase();


  if (
    categoryText.includes(
      'satpol'
    )
  ) {
    return 'satpol';
  }


  return 'damkar';

}


/* =========================================================
   GET REPORT TYPE
========================================================= */

function getReportType(
  report
) {

  const awal =
    report?.laporanAwal || {};


  return (
    awal.jenisKegiatan ||
    awal.jenisLaporan ||
    report?.kategori ||
    'Laporan'
  );

}


/* =========================================================
   SEARCH MATCH
========================================================= */

function reportMatchesSearch(
  report,
  search
) {

  const awal =
    report?.laporanAwal || {};

  const pelaksanaan =
    report?.pelaksanaan || {};

  const detail =
    report?.laporanDetail || {};

  const lokasi =
    awal.lokasi || {};


  const values = [

    report?.id,

    report?.status,

    awal.nomorPelapor,

    awal.deskripsiLokasi,

    awal.unit,

    awal.jenisLaporan,

    awal.jenisKegiatan,

    awal.waktuLaporanMasuk,

    awal.regu,

    awal.konfirmasiPenugasan,

    lokasi.inputAsli,

    lokasi.alamat,

    lokasi.latitude,

    lokasi.longitude,

    lokasi.googleMapsUrl,

    pelaksanaan.hasilPenanganan,

    detail.kronologi,

    detail.penyebab,

    detail.keterangan

  ];


  /*
    Tambahkan nama petugas.
  */

  const petugasNames =
    getAssignedPetugasNames(
      report
    );


  values.push(
    petugasNames
  );


  const haystack =
    values
      .filter(
        value =>
          value !== null &&
          value !== undefined &&
          value !== ''
      )
      .join(' ')
      .toLowerCase();


  return haystack.includes(
    String(search)
      .toLowerCase()
  );

}


/* =========================================================
   USER MANAGEMENT
========================================================= */

function openUserManagement() {

  if (
    typeof renderUserManagement ===
    'function'
  ) {

    renderUserManagement();
    return;

  }


  showDashboardToast(
    'Menu Manajemen User belum tersedia.'
  );

}


/* =========================================================
   AUDIT LOG
========================================================= */

function openAuditLog() {

  if (
    typeof renderAuditLog ===
    'function'
  ) {

    renderAuditLog();
    return;

  }


  showDashboardToast(
    'Menu Audit Log belum tersedia.'
  );

}


/* =========================================================
   ADMIN REPORT
========================================================= */

function openAdminReport(
  id,
  event
) {

  if (event) {
    event.stopPropagation();
  }


  const report =
    getAllReports().find(
      item =>
        item.id === id
    );


  if (!report) {

    showDashboardToast(
      'Laporan tidak ditemukan.'
    );

    return;

  }


  if (
    typeof editReport ===
    'function'
  ) {

    editReport(id);
    return;

  }


  showDashboardToast(
    'Laporan ' +
    id +
    ' dipilih.'
  );

}


/* =========================================================
   PETUGAS TASK
========================================================= */

function openPetugasTask(
  id,
  event
) {

  if (event) {
    event.stopPropagation();
  }


  const report =
    getAllReports().find(
      item =>
        item.id === id
    );


  if (!report) {

    showDashboardToast(
      'Tugas tidak ditemukan.'
    );

    return;

  }


  if (
    typeof openPetugasForm ===
    'function'
  ) {

    openPetugasForm(id);
    return;

  }


  showDashboardToast(
    'Tugas ' +
    id +
    ' dibuka.'
  );

}


/* =========================================================
   UNIT LABEL
========================================================= */

function getUnitLabel(
  unit
) {

  if (
    typeof UNIT_LABELS !==
    'undefined' &&
    UNIT_LABELS[unit]
  ) {

    return UNIT_LABELS[unit];

  }


  if (
    unit === 'DAMKAR'
  ) {
    return 'Damkar';
  }


  if (
    unit === 'SATPOL_PP'
  ) {
    return 'Satpol PP';
  }


  return unit || '-';

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
  number
) {

  return String(
    Number(
      number || 0
    )
  )
    .padStart(
      2,
      '0'
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDashboardDate(
  value
) {

  if (!value) {
    return '-';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleDateString(
    'id-ID',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  );

}


/* =========================================================
   WHATSAPP
========================================================= */

function formatDashboardWhatsApp(
  number
) {

  let value =
    String(
      number || ''
    )
      .replace(
        /\D/g,
        ''
      );


  if (
    value.startsWith('0')
  ) {

    value =
      '62' +
      value.substring(1);

  }


  return value;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeDashboardHtml(
  value
) {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeDashboardAttribute(
  value
) {

  return escapeDashboardHtml(
    value
  );

}


function normalizeDocumentImageUrl(
  value
) {

  if (typeof value !== 'string') {
    return '';
  }

  const trimmed =
    value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  try {

    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host.includes('drive.google.com')) {

      const idFromQuery =
        url.searchParams.get('id');

      const idFromPath =
        url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];

      const fileId =
        idFromQuery || idFromPath;

      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1200`;
      }

    }

    return trimmed;

  } catch (error) {
    return trimmed;
  }

}


function getDocumentOpenUrl(
  value
) {

  if (typeof value !== 'string') {
    return '';
  }

  const trimmed =
    value.trim();

  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('data:image/')) {
    return '';
  }

  try {

    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host.includes('drive.google.com')) {

      const idFromQuery =
        url.searchParams.get('id');

      const idFromPath =
        url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];

      const fileId =
        idFromQuery || idFromPath;

      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/view`;
      }

      return trimmed;
    }

    return trimmed;

  } catch (error) {
    return trimmed;
  }

}


/* =========================================================
   TOAST
========================================================= */

function showDashboardToast(
  message
) {

  if (
    typeof showToast ===
    'function'
  ) {

    showToast(message);
    return;

  }


  const toast =
    document.getElementById(
      'toast'
    );

  const text =
    document.getElementById(
      'toast-text'
    );


  if (
    !toast ||
    !text
  ) {
    return;
  }


  text.textContent =
    message;


  toast.classList.add(
    'show'
  );


  setTimeout(
    () => {

      toast.classList.remove(
        'show'
      );

    },
    2500
  );

}