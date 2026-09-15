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

      <div class="dashboard-heading">

        <div>

          <div class="eyebrow">
            ADMINISTRATOR
          </div>

          <h2>
            Dashboard Laporan
          </h2>

          <p>
            Buat, kelola, tugaskan,
            dan lengkapi laporan.
          </p>

        </div>

        <div class="role-badge admin-badge">
          ADMIN
        </div>

      </div>

      ${renderOverviewStats(adminReports)}

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

    </section>

  `;

  renderDashboardReports(
    adminReports,
    false
  );
}
