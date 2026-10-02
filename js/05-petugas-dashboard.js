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
      ${renderReportsPanelStart()}
      <div class="dashboard-toolbar">
        ${renderSearchFilter()}
      </div>
      <div id="report-list-area"></div>
      ${renderReportsPanelEnd()}
    </section>

  `;

  renderDashboardReports(
    myReports,
    true
  );
}
