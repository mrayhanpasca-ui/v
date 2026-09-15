/* ================= UTIL ================= */

    function escapeHtml(str){

      const d =
        document.createElement(
          'div'
        );

      d.textContent =
        str;

      return d.innerHTML;

    }

    function formatDate(dateStr){

      if(!dateStr){
        return '—';
      }

      const d =
        new Date(
          dateStr +
          'T00:00:00'
        );

      if(
        isNaN(d)
      ){
        return dateStr;
      }

      return d.toLocaleDateString(
        'id-ID',
        {
          day:'2-digit',
          month:'short',
          year:'numeric'
        }
      );

    }

    let toastTimer;

    function showToast(
      msg,
      isError = false
    ){

      const t =
        document.getElementById(
          'toast'
        );

      const toastText =
        document.getElementById(
          'toast-text'
        );

      if (!t || !toastText) {
        return;
      }

      toastText.textContent =
        msg || 'Proses selesai.';

      t
        .querySelector(
          '.tdot'
        )
        .style
        .background =
          isError
            ? 'var(--damkar)'
            : 'var(--green)';

      t.classList.add(
        'show'
      );

      clearTimeout(
        toastTimer
      );

      toastTimer =
        setTimeout(
          () =>
            t.classList.remove(
              'show'
            ),
          3200
        );

    }

    function getFriendlyUploadError(error, fallback = 'Upload foto gagal.') {
      if (!error) return fallback;

      const message = String(error.message || error || fallback);

      if (message.includes('reportId')) {
        return 'Upload foto gagal: ID laporan belum siap. Silakan ulangi proses penyimpanan.';
      }

      if (message.includes('Failed to fetch') || message.includes('fetch')) {
        return 'Upload foto gagal karena koneksi atau server tidak responsif. Coba lagi.';
      }

      if (message.includes('Maksimal')) {
        return message;
      }

      if (message.includes('gambar') || message.includes('image')) {
        return 'Format file tidak valid. Pastikan file yang dipilih adalah foto (JPG/PNG/WebP).';
      }

      if (message.includes('Drive') || message.includes('folder')) {
        return 'Upload foto gagal saat menyimpan ke Drive. Periksa pengaturan folder Drive.';
      }

      return message || fallback;
    }

    function showUploadStatus(title, message, isError = false) {
      const status = document.getElementById('upload-status');
      const statusTitle = document.getElementById('upload-status-title');
      const statusText = document.getElementById('upload-status-text');
      const statusIcon = document.getElementById('upload-status-icon');

      if (!status || !statusTitle || !statusText || !statusIcon) return;

      statusTitle.textContent = title || 'Upload sedang berlangsung';
      statusText.textContent = message || 'Laporan sudah tersimpan. Anda dapat melanjutkan pekerjaan lain.';

      const isSuccess = !isError && /berhasil|sukses|selesai|tersimpan/i.test(title || '')
        || (!isError && /berhasil|sukses|selesai|tersimpan/i.test(message || ''));

      statusIcon.textContent = isError ? '!' : '✓';
      status.classList.toggle('is-error', isError);
      status.classList.toggle('is-success', !isError && isSuccess);
      status.classList.add('show');
    }

    function hideUploadStatus() {
      const status = document.getElementById('upload-status');
      if (status) status.classList.remove('show');
    }

