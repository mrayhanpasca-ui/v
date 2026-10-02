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
let currentGroup = 'none';
let currentAppView = ({
  '#laporan': 'reports',
  '#users': 'users',
  '#audit-log': 'audit'
})[window.location.hash] || 'dashboard';
let dashboardChartReports = [];
let dashboardSelectedMonth = '';
let dashboardLeafletMap = null;
let dashboardLeafletLayer = null;


/* =========================================================
   DASHBOARD UTAMA
========================================================= */

async function showDashboard(forceRefresh = false) {

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
    if (['users', 'audit'].includes(currentAppView)) {
      if (isSuperadmin()) {
        if (currentAppView === 'users') renderUserManagement();
        else renderAuditLog();
        return;
      }

      currentAppView = 'dashboard';
      history.replaceState({ appView: 'dashboard' }, '', '#dashboard');
    }

    if (currentAppView === 'reports') {
      renderReportsPage();
      return;
    }

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
    forceRefresh ||
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
    if (typeof loadDashboardData === 'function') {
      await loadDashboardData();
    } else {
      await Promise.all([
        typeof loadUsers === 'function' ? loadUsers() : Promise.resolve([]),
        typeof loadReports === 'function' ? loadReports() : Promise.resolve([])
      ]);
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


function formatDashboardToday() {
  return formatDeviceDate(new Date(), {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}


function renderDashboardPageHeader(title, description, canCreate = false) {
  return `
    <div class="dashboard-page-header">
      <div>
        <div class="dashboard-kicker">SIKOMPAK / ${escapeDashboardHtml(currentUser?.role || 'USER')}</div>
        <h1>${escapeDashboardHtml(title)}</h1>
        <p>${escapeDashboardHtml(formatDashboardToday())} · ${escapeDashboardHtml(description)}</p>
      </div>
      ${canCreate ? `<button class="btn btn-add dashboard-primary-action" onclick="openModal()"><span aria-hidden="true">＋</span> Buat Laporan Baru</button>` : ''}
    </div>
  `;
}


function renderDashboardAlert(data, petugasMode = false) {
  const pendingReports = data.filter(report => getReportStatus(report) === REPORT_STATUS.MENUNGGU_LAPORAN_DETAIL);
  const target = pendingReports[0];
  if (!target) return '';
  const action = petugasMode
    ? `openPetugasTask('${escapeDashboardAttribute(target.id)}', event)`
    : `openAdminReport('${escapeDashboardAttribute(target.id)}', event)`;
  return `
    <div class="dashboard-alert">
      <span class="dashboard-alert-icon" aria-hidden="true">!</span>
      <div><strong>${formatNumber(pendingReports.length)} laporan menunggu laporan detail</strong><span>Petugas telah selesai. Lengkapi laporan detail untuk menutup kasus.</span></div>
      <button type="button" onclick="${action}">Lengkapi <span aria-hidden="true">→</span></button>
    </div>
  `;
}


function renderDashboardMonitoring(data) {
  dashboardChartReports = Array.isArray(data) ? data : [];
  const reportMonthKeys = dashboardChartReports
    .map(getDashboardReportDate)
    .filter(Boolean)
    .map(date => getDeviceDateKey(date).slice(0, 7));
  const currentDate = new Date();
  const recentMonthKeys = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
  const monthKeys = [...new Set([...reportMonthKeys, ...recentMonthKeys])].sort();

  if (!monthKeys.includes(dashboardSelectedMonth)) {
    dashboardSelectedMonth = monthKeys[monthKeys.length - 1] || '';
  }

  const monthOptions = monthKeys.map(key => {
    const [year, month] = key.split('-').map(Number);
    const label = formatDeviceDate(new Date(year, month - 1, 1), {
      month: 'long',
      year: 'numeric'
    });
    return `<option value="${key}" ${key === dashboardSelectedMonth ? 'selected' : ''}>${escapeDashboardHtml(label)}</option>`;
  }).join('');

  window.setTimeout(renderDashboardVisualizations, 0);

  return `
    <section class="dashboard-visualizations" aria-label="Analisis laporan">
      <article class="monitoring-card daily-chart-card">
        <div class="monitoring-card-header">
          <div><h2>Laporan Harian</h2><p id="daily-chart-summary">Jumlah laporan pada setiap tanggal dalam bulan</p></div>
          <label class="chart-month-control"><span>Bulan</span><select id="dashboard-chart-month" aria-label="Pilih bulan laporan" onchange="setDashboardChartMonth(this.value)">${monthOptions || '<option value="">Belum ada data</option>'}</select></label>
        </div>
        <div class="daily-chart-scroll"><div id="daily-reports-chart" class="daily-reports-chart"></div></div>
      </article>
      <article class="monitoring-card regional-chart-card">
        <div class="monitoring-card-header"><div><h2>Sebaran Kasus</h2><p id="regional-chart-summary">Kasus menurut wilayah untuk bulan terpilih</p></div><span class="chart-map-key"><i></i>Jumlah kasus</span></div>
        <div id="regional-reports-map" class="regional-reports-map" role="img" aria-label="Peta titik laporan per wilayah"></div>
        <div id="regional-chart-empty" class="chart-empty" hidden>Belum ada laporan dengan koordinat pada bulan ini.</div>
      </article>
      <article class="monitoring-card type-chart-card">
        <div class="monitoring-card-header"><div><h2>Kasus per Jenis</h2><p>Komposisi laporan untuk bulan terpilih</p></div></div>
        <div class="type-chart-layout"><div id="report-type-chart" class="report-type-chart"></div><div id="report-type-legend" class="report-type-legend"></div></div>
      </article>
    </section>
  `;
}


function getDashboardReportDate(report) {
  const awal = report?.laporanAwal || {};
  const value = awal.tanggal || awal.waktuLaporanMasuk || report?.createdAt;
  return parseDeviceDate(value);
}


function setDashboardChartMonth(monthKey) {
  dashboardSelectedMonth = monthKey;
  const monthSelect = document.getElementById('dashboard-chart-month');
  if (monthSelect && monthSelect.value !== monthKey) monthSelect.value = monthKey;
  renderDashboardVisualizations();
}


function getDashboardReportsForSelectedMonth() {
  return dashboardChartReports.filter(report => {
    const date = getDashboardReportDate(report);
    return date && getDeviceDateKey(date).slice(0, 7) === dashboardSelectedMonth;
  });
}


function getDashboardReportType(report) {
  const awal = report?.laporanAwal || {};
  const detailType = awal.jenisKegiatan || awal.jenisPelanggaran || awal.jenisKebakaran || awal.jenisKejadian;
  if (detailType) return detailType;

  const category = awal.jenisLaporan || report?.kategori || '';
  return CATEGORY_CONFIG[category]?.label || category || 'Lainnya';
}


function renderDashboardVisualizations() {
  const dailyContainer = document.getElementById('daily-reports-chart');
  const typeContainer = document.getElementById('report-type-chart');
  const legendContainer = document.getElementById('report-type-legend');
  if (!dailyContainer || !typeContainer || !legendContainer) return;

  const [year, month] = dashboardSelectedMonth.split('-').map(Number);
  const monthReports = getDashboardReportsForSelectedMonth();
  const reportDate = year && month ? new Date(year, month - 1, 1) : null;
  const daysInMonth = reportDate ? new Date(year, month, 0).getDate() : 0;
  const dailyCounts = Array.from({ length: daysInMonth }, () => 0);

  monthReports.forEach(report => {
    const date = getDashboardReportDate(report);
    if (date) dailyCounts[date.getDate() - 1] += 1;
  });

  const monthLabel = reportDate
    ? formatDeviceDate(reportDate, { month: 'long', year: 'numeric' })
    : 'bulan terpilih';
  const summary = document.getElementById('daily-chart-summary');
  if (summary) summary.textContent = `${formatNumber(monthReports.length)} laporan · ${monthLabel}`;

  if (!daysInMonth) {
    dailyContainer.innerHTML = '<div class="chart-empty">Belum ada data tanggal laporan.</div>';
  } else {
    dailyContainer.innerHTML = renderDailyReportSvg(dailyCounts, monthLabel);
  }

  renderReportTypePie(monthReports, typeContainer, legendContainer);
  renderRegionalReportMap(monthReports);
}


function renderDailyReportSvg(counts, monthLabel) {
  const width = 960;
  const height = 250;
  const left = 40;
  const right = 12;
  const top = 16;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const max = Math.max(...counts, 1);
  const step = chartWidth / counts.length;
  const barWidth = Math.min(18, step * .66);
  const yTicks = [...new Set(Array.from({ length: 5 }, (_, index) =>
    Math.round(max * (4 - index) / 4)
  ))].sort((left, right) => right - left);
  const grid = yTicks.map(value => {
    const y = top + chartHeight * (1 - value / max);
    return `<g class="daily-chart-grid"><line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text x="${left - 10}" y="${y + 4}" text-anchor="end">${value}</text></g>`;
  }).join('');
  const bars = counts.map((value, index) => {
    const x = left + index * step + (step - barWidth) / 2;
    const barHeight = value ? Math.max(3, chartHeight * value / max) : 0;
    const y = top + chartHeight - barHeight;
    const label = `${String(index + 1).padStart(2, '0')} ${monthLabel}: ${value} laporan`;
    const dayLabel = index === 0 || (index + 1) % 5 === 0 || index === counts.length - 1
      ? `<text class="daily-chart-day" x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle">${index + 1}</text>`
      : '';
    return `<g class="daily-chart-bar-group"><title>${escapeDashboardHtml(label)}</title><rect class="daily-chart-bar ${value ? 'has-value' : ''}" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${Math.min(4, barWidth / 2)}"/><rect class="daily-chart-hit-area" x="${left + index * step}" y="${top}" width="${step}" height="${chartHeight}"/>${dayLabel}</g>`;
  }).join('');

  return `<svg class="daily-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Jumlah laporan harian untuk ${escapeDashboardAttribute(monthLabel)}">${grid}${bars}</svg>`;
}


function renderReportTypePie(reportsForMonth, chartContainer, legendContainer) {
  const typeCounts = new Map();
  reportsForMonth.forEach(report => {
    const type = getDashboardReportType(report);
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });

  const sorted = [...typeCounts.entries()].sort((left, right) => right[1] - left[1]);
  const colors = ['#315A91', '#E12D24', '#A98B56', '#3E8E5B', '#7C1828', '#557C9E'];
  if (!sorted.length) {
    chartContainer.innerHTML = '<div class="pie-empty">Belum ada data</div>';
    legendContainer.innerHTML = '';
    return;
  }

  const center = 100;
  const radius = 82;
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  let angle = -Math.PI / 2;
  const paths = sorted.length === 1
    ? `<circle cx="${center}" cy="${center}" r="${radius}" fill="${colors[0]}"><title>${escapeDashboardHtml(sorted[0][0])}: ${sorted[0][1]} kasus</title></circle>`
    : sorted.map(([label, count], index) => {
    const nextAngle = angle + Math.PI * 2 * count / total;
    const x1 = center + radius * Math.cos(angle);
    const y1 = center + radius * Math.sin(angle);
    const x2 = center + radius * Math.cos(nextAngle);
    const y2 = center + radius * Math.sin(nextAngle);
    const largeArc = nextAngle - angle > Math.PI ? 1 : 0;
    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const slice = `<path d="${path}" fill="${colors[index % colors.length]}" stroke="#fff" stroke-width="2"><title>${escapeDashboardHtml(label)}: ${count} kasus</title></path>`;
    angle = nextAngle;
    return slice;
    }).join('');

  chartContainer.innerHTML = `<svg class="report-type-pie-svg" viewBox="0 0 200 200" role="img" aria-label="Komposisi ${total} kasus menurut jenis">${paths}</svg><div class="pie-total"><strong>${formatNumber(total)}</strong><span>kasus</span></div>`;
  legendContainer.innerHTML = sorted.map(([label, count], index) => `<div class="report-type-legend-item"><i style="--legend-color:${colors[index % colors.length]}"></i><span title="${escapeDashboardAttribute(label)}">${escapeDashboardHtml(label)}</span><strong>${count}</strong></div>`).join('');
}


function getDashboardCoordinates(report) {
  const location = report?.laporanAwal?.lokasi || {};
  const rawLatitude = location.latitude ?? location.lat;
  const rawLongitude = location.longitude ?? location.lng ?? location.lon;
  let latitude = rawLatitude === '' || rawLatitude == null ? Number.NaN : Number(rawLatitude);
  let longitude = rawLongitude === '' || rawLongitude == null ? Number.NaN : Number(rawLongitude);

  if ((!Number.isFinite(latitude) || !Number.isFinite(longitude)) && typeof extractLatLng === 'function') {
    const parsed = extractLatLng(location.googleMapsUrl || location.mapsUrl || location.alamat || location.inputAsli || '');
    if (parsed) {
      latitude = parsed.lat;
      longitude = parsed.lng;
    }
  }

  return Number.isFinite(latitude) && Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}


function renderRegionalReportMap(reportsForMonth) {
  const mapElement = document.getElementById('regional-reports-map');
  const emptyElement = document.getElementById('regional-chart-empty');
  if (!mapElement || !emptyElement) return;

  const grouped = new Map();
  reportsForMonth.forEach(report => {
    const coordinates = getDashboardCoordinates(report);
    if (!coordinates) return;

    const location = report?.laporanAwal?.lokasi || {};
    const region = location.kecamatan || location.desaKelurahan || location.kelurahan ||
      location.kabupaten || `Area ${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}`;
    const key = String(region).trim().toLocaleLowerCase('id-ID');
    const group = grouped.get(key) || { name: String(region).trim(), count: 0, latitude: 0, longitude: 0 };
    group.count += 1;
    group.latitude += coordinates.latitude;
    group.longitude += coordinates.longitude;
    grouped.set(key, group);
  });

  const locations = [...grouped.values()].map(group => ({
    ...group,
    latitude: group.latitude / group.count,
    longitude: group.longitude / group.count
  }));
  emptyElement.hidden = locations.length > 0;
  mapElement.classList.toggle('is-empty', locations.length === 0);

  if (!window.L) {
    emptyElement.hidden = false;
    emptyElement.textContent = 'Peta belum dapat dimuat. Periksa koneksi internet.';
    return;
  }

  if (!dashboardLeafletMap || dashboardLeafletMap.getContainer() !== mapElement) {
    if (dashboardLeafletMap) dashboardLeafletMap.remove();
    dashboardLeafletMap = L.map(mapElement, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(dashboardLeafletMap);
    dashboardLeafletLayer = L.layerGroup().addTo(dashboardLeafletMap);
  }

  dashboardLeafletLayer.clearLayers();
  if (locations.length) {
    const bounds = [];
    locations.forEach(location => {
      const point = [location.latitude, location.longitude];
      bounds.push(point);
      const radius = Math.min(22, 8 + Math.sqrt(location.count) * 4);
      const tooltip = `<strong>${escapeDashboardHtml(location.name)}</strong><br>${location.count} ${location.count === 1 ? 'kasus' : 'kasus'}`;
      L.circleMarker(point, {
        radius,
        color: '#fff',
        weight: 2,
        fillColor: '#E12D24',
        fillOpacity: .82
      }).bindTooltip(tooltip, { direction: 'top', opacity: .98, sticky: true })
        .bindPopup(tooltip)
        .addTo(dashboardLeafletLayer);
    });
    dashboardLeafletMap.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
  } else {
    dashboardLeafletMap.setView([-3.25, 116.2], 8);
  }

  window.requestAnimationFrame(() => dashboardLeafletMap?.invalidateSize());
}


function renderReportsPanelStart() {
  return '';
}


function renderReportsPanelEnd() {
  return '</section>';
}


function toggleAppSidebar() {
  const appScreen = document.getElementById('app-screen');
  if (!appScreen) return;

  if (window.matchMedia('(max-width: 760px)').matches) {
    appScreen.classList.toggle('sidebar-open');
    return;
  }

  appScreen.classList.toggle('sidebar-collapsed');
}


function navigateSidebarLink(event, view) {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  setSidebarView(view);
}


function setSidebarView(view, fromHistory = false) {
  if (view === 'profile') {
    showToast('Profil pengguna sedang aktif di topbar.');
    return;
  }

  if (!['dashboard', 'reports', 'users', 'audit'].includes(view)) return;
  if (['users', 'audit'].includes(view) && !isSuperadmin()) {
    history.replaceState({ appView: 'dashboard' }, '', '#dashboard');
    setSidebarView('dashboard', true);
    showToast('Halaman ini hanya dapat diakses Superadmin.', true);
    return;
  }

  currentAppView = view;
  if (!fromHistory) {
    const nextHash = ({
      dashboard: '#dashboard',
      reports: '#laporan',
      users: '#users',
      audit: '#audit-log'
    })[view];
    if (window.location.hash !== nextHash) history.pushState({ appView: view }, '', nextHash);
  }
  const topbarSearch = document.getElementById('topbar-dashboard-search');
  if (topbarSearch) topbarSearch.value = currentSearch;

  const appScreen = document.getElementById('app-screen');
  appScreen?.classList.toggle('reports-view', view === 'reports');
  appScreen?.classList.remove('sidebar-open');
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    const itemView = item.dataset.appView || (item.textContent.trim().toLowerCase().startsWith('laporan') ? 'reports' : 'dashboard');
    item.classList.toggle('active', view === itemView);
  });

  if (view === 'reports') {
    renderReportsPage();
  } else if (view === 'users') {
    renderUserManagement();
  } else if (view === 'audit') {
    renderAuditLog();
  } else {
    renderDashboardHome();
  }
}


function renderDashboardHome() {
  const container = document.getElementById('dashboard-container');
  if (!container || !currentUser) return;

  document.getElementById('app-screen')?.classList.remove('reports-view');
  if (currentAppView === 'users' && isSuperadmin()) renderUserManagement();
  else if (currentAppView === 'audit' && isSuperadmin()) renderAuditLog();
  else if (isSuperadmin()) renderSuperadminDashboard();
  else if (isAdmin()) renderAdminDashboard();
  else if (isPetugas()) renderPetugasDashboard();
}


function renderRecentReportsPanel(sourceReports, petugasMode = false) {
  const recentReports = (Array.isArray(sourceReports) ? sourceReports : [])
    .slice()
    .sort((left, right) => String(right.createdAt || right.updatedAt || '').localeCompare(String(left.createdAt || left.updatedAt || '')))
    .slice(0, 5);

  return `
    <section class="reports-panel recent-reports-panel">
      <div class="reports-panel-header">
        <div><h2>Laporan Terbaru</h2><p>${recentReports.length ? `Menampilkan ${recentReports.length} laporan terbaru` : 'Belum ada laporan'}</p></div>
        <a class="reports-view-link" href="#laporan" onclick="if (!event.ctrlKey && !event.metaKey && event.button === 0) { event.preventDefault(); setSidebarView('reports'); }">Lihat Semua <span aria-hidden="true">→</span></a>
      </div>
      <div class="report-list recent-report-list">
        ${recentReports.length
          ? recentReports.map(report => renderDashboardCard(report, petugasMode)).join('')
          : '<div class="empty-state dashboard-empty"><div class="display">Belum ada laporan</div><div>Belum ada laporan untuk ditampilkan.</div></div>'}
      </div>
    </section>
  `;
}


function renderReportsPage() {
  const container = document.getElementById('dashboard-container');
  if (!container || !currentUser) return;

  document.getElementById('app-screen')?.classList.add('reports-view');
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.classList.toggle('active', item.textContent.trim().toLowerCase().startsWith('laporan'));
  });
  const reportsForUser = getCurrentDashboardReports();
  const petugasMode = isPetugas();
  const description = petugasMode
    ? 'Daftar lengkap laporan yang ditugaskan kepada Anda'
    : 'Daftar lengkap laporan lapangan';

  container.innerHTML = `
    <section class="dashboard-page reports-list-page">
      <div class="dashboard-page-header">
        <div>
          <div class="dashboard-kicker">SIKOMPAK / ${escapeDashboardHtml(currentUser.role || 'USER')}</div>
          <h1>Daftar Laporan</h1>
          <p>${escapeDashboardHtml(description)}</p>
        </div>
        ${!petugasMode ? '<button class="btn btn-add dashboard-primary-action" onclick="openModal()"><span aria-hidden="true">＋</span> Buat Laporan Baru</button>' : ''}
      </div>
      <section class="reports-panel full-reports-panel">
        <div class="reports-panel-header"><div><h2>Semua Laporan</h2><p id="full-report-count">${formatNumber(reportsForUser.length)} laporan</p></div></div>
        <div class="dashboard-toolbar">
          ${renderSearchFilter()}
        </div>
        <div id="report-list-area"></div>
      </section>
    </section>
  `;

  renderDashboardReports(reportsForUser, petugasMode);
}


window.addEventListener('popstate', () => {
  const view = ({ '#laporan': 'reports', '#users': 'users', '#audit-log': 'audit' })[window.location.hash] || 'dashboard';
  if (view !== currentAppView) setSidebarView(view, true);
});

window.addEventListener('hashchange', () => {
  const view = ({ '#laporan': 'reports', '#users': 'users', '#audit-log': 'audit' })[window.location.hash] || 'dashboard';
  if (view !== currentAppView) setSidebarView(view, true);
});


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

function renderSearchFilter(includeSearch = true) {
  const searchControl = includeSearch ? `
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input type="search" id="dashboard-search" placeholder="Cari laporan..." value="${escapeDashboardHtml(currentSearch)}" oninput="setDashboardSearch(this.value)">
      </div>
  ` : '';

  return `

    <div class="toolbar-left dashboard-search-area">
      ${searchControl}

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

        <label class="dashboard-select-label">
          Kelompokkan
          <select onchange="setDashboardGroup(this.value)">
            <option value="none" ${currentGroup === 'none' ? 'selected' : ''}>Tanpa grup</option>
            <option value="sector" ${currentGroup === 'sector' ? 'selected' : ''}>Sektor</option>
            <option value="status" ${currentGroup === 'status' ? 'selected' : ''}>Status</option>
            <option value="month" ${currentGroup === 'month' ? 'selected' : ''}>Bulan</option>
            <option value="district" ${currentGroup === 'district' ? 'selected' : ''}>Kecamatan</option>
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

  const topbarSearch = document.getElementById('topbar-dashboard-search');
  if (topbarSearch && topbarSearch.value !== currentSearch) topbarSearch.value = currentSearch;
  const reportSearch = document.getElementById('dashboard-search');
  if (reportSearch && reportSearch.value !== currentSearch) reportSearch.value = currentSearch;

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


function setDashboardGroup(group) {
  currentGroup = group || 'none';
  refreshDashboardList();
}


/* =========================================================
   REFRESH
========================================================= */

function refreshDashboardList() {
  if (currentAppView !== 'reports') return;

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

  const countLabel = document.getElementById('full-report-count');
  if (countLabel) countLabel.textContent = `${formatNumber(filtered.length)} laporan`;


  /*
    EMPTY
  */

  if (
    filtered.length === 0
  ) {

    if (countLabel) countLabel.textContent = '0 laporan';

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

  const cardMarkup = report => renderDashboardCard(report, petugasMode);
  let listMarkup = '';

  if (currentGroup === 'none') {
    listMarkup = filtered.map(cardMarkup).join('');
  } else {
    const groups = new Map();
    filtered.forEach(report => {
      let label = 'Tidak diketahui';
      if (currentGroup === 'sector') label = getReportSector(report) === 'satpol' ? 'Satpol PP' : 'Damkar';
      if (currentGroup === 'status') label = getStatusLabelSafe(getReportStatus(report));
      if (currentGroup === 'district') label = report?.laporanAwal?.lokasi?.kecamatan || 'Kecamatan belum diisi';
      if (currentGroup === 'month') {
        const date = getDashboardReportDate(report);
        label = date ? formatDeviceDate(date, { month: 'long', year: 'numeric' }) : 'Tanggal belum diisi';
      }
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(report);
    });

    listMarkup = [...groups.entries()].map(([label, groupReports]) => `
      <section class="report-list-group">
        <h2><span>${escapeDashboardHtml(label)}</span><small>${groupReports.length} laporan</small></h2>
        ${groupReports.map(cardMarkup).join('')}
      </section>
    `).join('');
  }

  container.innerHTML = `<div class="report-list">${listMarkup}</div>`;

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
    lokasi.alamatAsli ||
    lokasi.inputAsli ||
    lokasi.latitude !== null ||
    lokasi.longitude !== null
  ) {

    const locationRows = [
      ['Kelurahan/Desa', lokasi.kelurahan],
      ['Kecamatan', lokasi.kecamatan],
      ['Kabupaten/Kota', lokasi.kabupaten],
      ['Provinsi', lokasi.provinsi],
      ['Kode Pos', lokasi.kodePos]
    ].filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
    const locationStatus = lokasi.statusWilayah || 'BELUM_DIDETEKSI';
    const detectedOutside = lokasi.hasilDeteksiKabupaten &&
      lokasi.hasilDeteksiKabupaten !== SYSTEM_REGION.kabupaten;

    html += `

      <div class="detail-item full">

        <div class="dl">
          Lokasi
        </div>

        <div class="dv">

          <strong>Alamat asli</strong><br>
          ${escapeDashboardHtml(lokasi.alamatAsli || lokasi.inputAsli || lokasi.alamat || 'Belum diisi')}

        </div>

        ${locationRows.length ? `
          <div class="location-detail-grid">
            ${locationRows.map(([label, value]) => `
              <div>
                <span>${label}</span>
                <strong>${escapeDashboardHtml(value)}</strong>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="location-status ${detectedOutside ? 'is-warning' : ''}">
          <span>Status wilayah</span>
          <strong>${escapeDashboardHtml(locationStatus.replaceAll('_', ' '))}</strong>
          ${detectedOutside ? `<small>Hasil deteksi: ${escapeDashboardHtml(lokasi.hasilDeteksiKabupaten)}${lokasi.hasilDeteksiProvinsi ? `, ${escapeDashboardHtml(lokasi.hasilDeteksiProvinsi)}` : ''}. Laporan tetap berada dalam konteks ${escapeDashboardHtml(SYSTEM_REGION.kabupaten)}.</small>` : ''}
        </div>


        ${
          lokasi.latitude !== null &&
          lokasi.latitude !== undefined &&
          lokasi.longitude !== null &&
          lokasi.longitude !== undefined

          ? `

            <div class="dv mono location-coordinates">

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
          (lokasi.mapsUrl || lokasi.googleMapsUrl)

          ? `

            <div class="detail-loc-meta">

              <a
                class="loc-maps-link"
                href="${escapeDashboardAttribute(
                  lokasi.mapsUrl || lokasi.googleMapsUrl
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


  const reportDocumentation = [
    ...(Array.isArray(awal.dokumentasi) ? awal.dokumentasi : []),
    ...(Array.isArray(pelaksanaan.dokumentasi) ? pelaksanaan.dokumentasi : []),
    ...(Array.isArray(report?.data?.dokumentasi) ? report.data.dokumentasi : [])
  ];

  const documentationImages = reportDocumentation
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
        .filter((image, index, images) =>
          images.findIndex(item => item.src === image.src) === index
        );

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


  if (detail) detail.classList.toggle('open');

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

  setSidebarView('users');

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

async function openAdminReport(
  id,
  event
) {

  if (event) {
    event.stopPropagation();
  }


  let report =
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

  const detailedReport = await getReportById(id);

  if (detailedReport) {
    const index = reports.findIndex(item => item.id === id);
    report = detailedReport;

    if (index !== -1) {
      reports[index] = detailedReport;
    }
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


  const date = parseDeviceDate(value);
  if (!date) return String(value);

  return formatDeviceDate(date, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
  });

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