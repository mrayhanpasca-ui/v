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
      ${renderRecentReportsPanel(adminReports, false)}
    </section>

  `;
}
