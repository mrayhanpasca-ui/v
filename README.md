# SIKOMPAK - Struktur File

File ini merupakan pemecahan dari `sikompak(2).html` menjadi file yang lebih mudah dipelihara. Logika JavaScript dipertahankan dan hanya dipindahkan berdasarkan bagian/fiturnya.

## Struktur
- index.html - struktur halaman utama
- css/style.css - CSS dari file asli
- js/01-config.js - konfigurasi, anggota, kategori dan field
- js/02-dummy-data.js - data dummy laporan
- js/03-state-storage.js - state aplikasi dan localStorage
- js/04-auth.js - login/logout
- js/05-dashboard.js - init, statistik, filter, daftar dan card laporan
- js/06-modal-form.js - modal dan form laporan
- js/07-location.js - parser koordinat, reverse/forward geocoding dan Google Maps
- js/08-members-images.js - anggota regu dan gambar
- js/09-submit-whatsapp.js - submit laporan dan WhatsApp
- js/10-utils.js - fungsi utilitas

## Cara menjalankan
Buka `index.html` melalui server lokal jika browser memblokir resource lokal. Untuk VS Code, gunakan Live Server.

## Catatan
Versi ini belum menghubungkan database Google Sheets/Apps Script. Ini hanya merapikan struktur file dari versi HTML yang diberikan.

# v
