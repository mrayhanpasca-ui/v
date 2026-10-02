/* =========================================================
   05-admin-dashboard.js
   DASHBOARD ADMIN
========================================================= */

function renderAdminDashboard() {

  const container =
    document.getElementById(
      'dashboard-container'
    );

  const adminReports =
    getAdminReports();

  container.innerHTML = `

    <section class="dashboard-page">
      ${renderDashboardPageHeader('Dashboard Admin', 'Pemantauan laporan lapangan', true)}
      ${renderDashboardAlert(adminReports)}
      ${renderOverviewStats(adminReports)}
      ${renderDashboardMonitoring(adminReports)}
      ${renderReportsPanelStart()}
      <div class="dashboard-toolbar">
        ${renderSearchFilter()}
        <div class="dashboard-actions">
          <button
            class="btn btn-add"
            onclick="openModal()"
          >
            + Tambah Laporan
          </button>

        </div>
      </div>
      <div id="report-list-area"></div>
      ${renderReportsPanelEnd()}
    </section>

  `;

  renderDashboardReports(
    adminReports,
    false
  );
}
