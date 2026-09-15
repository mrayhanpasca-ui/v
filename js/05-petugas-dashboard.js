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

      <div class="dashboard-heading">

        <div>

          <div class="eyebrow">
            PETUGAS LAPANGAN
          </div>

          <h2>
            Tugas Saya
          </h2>

          <p>
            Daftar laporan yang
            ditugaskan kepada Anda.
          </p>

        </div>

        <div class="role-badge petugas-badge">
          PETUGAS
        </div>

      </div>

      ${renderPetugasStats(myReports)}

      <div class="dashboard-toolbar">

        ${renderSearchFilter()}

      </div>

      <div id="report-list-area"></div>

    </section>

  `;

  renderDashboardReports(
    myReports,
    true
  );
}
