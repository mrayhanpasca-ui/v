/* =========================================================
   05-petugas-dashboard.js
   DASHBOARD PETUGAS
========================================================= */

function renderPetugasDashboard() {

  const container =
    document.getElementById(
      'dashboard-container'
    );

  const myReports =
    getMyPetugasReports();

  container.innerHTML = `

    <section class="dashboard-page">
      ${renderDashboardPageHeader('Tugas Saya', 'Laporan yang ditugaskan kepada Anda')}
      ${renderDashboardAlert(myReports, true)}
      ${renderPetugasStats(myReports)}
      ${renderDashboardMonitoring(myReports)}
      ${renderRecentReportsPanel(myReports, true)}
    </section>

  `;

}
