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

      <div class="dashboard-heading">

        <div>

          <div class="eyebrow">
            SUPERADMIN
          </div>

          <h2>
            Dashboard Sistem
          </h2>

          <p>
            Pantau seluruh laporan,
            pengguna, dan aktivitas sistem.
          </p>

        </div>

        <div class="role-badge superadmin-badge">
          SUPERADMIN
        </div>

      </div>

      ${renderOverviewStats(allReports)}

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

      <div class="superadmin-tools">

        <div class="management-card">

          <div class="management-icon">
            👥
          </div>

          <div>

            <strong>
              Manajemen User
            </strong>

            <p>
              Kelola Admin dan Petugas
              yang menggunakan sistem.
            </p>

          </div>

          <button
            class="btn btn-ghost"
            onclick="openUserManagement()"
          >
            Kelola User
          </button>

        </div>


        <div class="management-card">

          <div class="management-icon">
            🕘
          </div>

          <div>

            <strong>
              Audit Log
            </strong>

            <p>
              Lihat riwayat perubahan
              dan aktivitas laporan.
            </p>

          </div>

          <button
            class="btn btn-ghost"
            onclick="openAuditLog()"
          >
            Lihat Histori
          </button>

        </div>

      </div>

    </section>

  `;

  renderDashboardReports(
    allReports,
    false
  );
}
