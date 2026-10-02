/* =========================================================
   05-superadmin-dashboard.js
   DASHBOARD SUPERADMIN
========================================================= */

function renderSuperadminDashboard() {

  const container =
    document.getElementById(
      'dashboard-container'
    );

  const allReports =
    getAllReports();

  container.innerHTML = `

    <section class="dashboard-page">
      ${renderDashboardPageHeader('Dashboard Sistem', 'Pemantauan laporan dan aktivitas sistem', true)}
      ${renderDashboardAlert(allReports)}
      ${renderOverviewStats(allReports)}
      ${renderDashboardMonitoring(allReports)}
      ${renderRecentReportsPanel(allReports, false)}
    </section>

  `;

}
