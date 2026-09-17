/* =========================================================
   11-workflow.js
   WORKFLOW FASE 1, 2, DAN 3
========================================================= */

let activeCategory = REPORT_CATEGORY.PENGENDALIAN;

const CATEGORY_ORDER = [
  REPORT_CATEGORY.PENGENDALIAN,
  REPORT_CATEGORY.PENEGAKAN,
  REPORT_CATEGORY.PEMADAMAN,
  REPORT_CATEGORY.PENYELAMATAN
];

const DAFTAR_ANGGOTA = [
  'Andi Pratama',
  'Budi Santoso',
  'Cahyo Nugroho',
  'Dedi Kurniawan'
];

Object.assign(CATEGORY_CONFIG, {
  [REPORT_CATEGORY.PENGENDALIAN]: {
    label: 'Pengendalian',
    sektor: 'satpol',
    icon: '◈',
    fields: [
      workflowField('tanggal', 'Tanggal', 'date', true),
      workflowField('lokasi', 'Lokasi', 'location', true, true),
      workflowField('deskripsiLokasi', 'Deskripsi Tambahan Lokasi', 'textarea', false, true),
      workflowField('nomorPelapor', 'Nomor Pelapor / WhatsApp', 'tel', true),
      workflowField('jenisKegiatan', 'Jenis Kegiatan', 'select', true, false, [
        'Patroli Rutin', 'Pengawasan Ketertiban Umum', 'Sosialisasi Perda', 'Operasi Gabungan', 'Lainnya'
      ]),
      workflowField('anggota', 'Anggota Regu', 'members', true, true),
      workflowField('pemimpinRegu', 'Pemimpin Regu', 'leader', true),
      workflowField('jumlahPersonel', 'Jumlah Personel', 'readonly'),
      workflowField('jumlahKendaraan', 'Jumlah Kendaraan', 'number'),
      workflowField('sasaran', 'Sasaran / Objek Pengawasan', 'text', false, true),
      workflowField('hasil', 'Hasil Kegiatan', 'textarea', false, true),
      workflowField('dokumentasi', 'Dokumentasi Gambar', 'images', false, true),
      workflowField('keterangan', 'Keterangan Tambahan', 'textarea', false, true)
    ]
  },
  [REPORT_CATEGORY.PENEGAKAN]: {
    label: 'Penegakan',
    sektor: 'satpol',
    icon: '⚖',
    fields: [
      workflowField('tanggal', 'Tanggal', 'date', true),
      workflowField('lokasi', 'Lokasi', 'location', true, true),
      workflowField('deskripsiLokasi', 'Deskripsi Tambahan Lokasi', 'textarea', false, true),
      workflowField('nomorPelapor', 'Nomor Pelapor / WhatsApp', 'tel', true),
      workflowField('jenisPelanggaran', 'Jenis Pelanggaran', 'select', true, false, [
        'PKL Liar', 'Bangunan Tanpa Izin', 'Reklame Ilegal', 'Gangguan Ketertiban Umum', 'Lainnya'
      ]),
      workflowField('tindakan', 'Tindakan', 'select', true, false, [
        'Teguran Lisan', 'Teguran Tertulis', 'Penertiban', 'Penyitaan Barang', 'Pembongkaran'
      ]),
      workflowField('anggota', 'Anggota Regu', 'members', true, true),
      workflowField('pemimpinRegu', 'Pemimpin Regu', 'leader', true),
      workflowField('jumlahPersonel', 'Jumlah Personel', 'readonly'),
      workflowField('jumlahPelanggar', 'Jumlah Pelanggar / Objek', 'number', true),
      workflowField('keterangan', 'Keterangan Tambahan', 'textarea', false, true),
      workflowField('dokumentasi', 'Dokumentasi Gambar', 'images', false, true)
    ]
  },
  [REPORT_CATEGORY.PEMADAMAN]: {
    label: 'Pemadaman',
    sektor: 'damkar',
    icon: '◉',
    fields: [
      workflowField('tanggal', 'Tanggal', 'date', true),
      workflowField('lokasi', 'Lokasi Kejadian', 'location', true, true),
      workflowField('deskripsiLokasi', 'Deskripsi Tambahan Lokasi', 'textarea', false, true),
      workflowField('nomorPelapor', 'Nomor Pelapor / WhatsApp', 'tel', true),
      workflowField('jenisKebakaran', 'Jenis Kebakaran', 'select', true, false, [
        'Bangunan / Rumah', 'Kendaraan', 'Lahan / Kebun', 'Hutan', 'Instalasi Listrik', 'Lainnya'
      ]),
      workflowField('waktuTiba', 'Waktu Tiba di Lokasi', 'time'),
      workflowField('anggota', 'Anggota Regu', 'members', true, true),
      workflowField('pemimpinRegu', 'Pemimpin Regu', 'leader', true),
      workflowField('jumlahPersonel', 'Jumlah Personel', 'readonly'),
      workflowField('jumlahUnit', 'Jumlah Unit Armada', 'number', true),
      workflowField('korbanJiwa', 'Korban Jiwa', 'number'),
      workflowField('estimasiKerugian', 'Estimasi Kerugian (Rp)', 'number'),
      workflowField('dokumentasi', 'Dokumentasi Gambar', 'images', false, true),
      workflowField('keterangan', 'Keterangan Tambahan', 'textarea', false, true)
    ]
  },
  [REPORT_CATEGORY.PENYELAMATAN]: {
    label: 'Penyelamatan',
    sektor: 'damkar',
    icon: '✚',
    fields: [
      workflowField('tanggal', 'Tanggal', 'date', true),
      workflowField('lokasi', 'Lokasi Kejadian', 'location', true, true),
      workflowField('deskripsiLokasi', 'Deskripsi Tambahan Lokasi', 'textarea', false, true),
      workflowField('nomorPelapor', 'Nomor Pelapor / WhatsApp', 'tel', true),
      workflowField('jenisKejadian', 'Jenis Kejadian', 'select', true, false, [
        'Evakuasi Hewan', 'Pohon Tumbang', 'Banjir', 'Kecelakaan Lalu Lintas', 'Orang Terjebak', 'Lainnya'
      ]),
      workflowField('anggota', 'Anggota Regu', 'members', true, true),
      workflowField('pemimpinRegu', 'Pemimpin Regu', 'leader', true),
      workflowField('jumlahPersonel', 'Jumlah Personel', 'readonly'),
      workflowField('jumlahKorbanDiselamatkan', 'Jumlah Korban Diselamatkan', 'number'),
      workflowField('dokumentasi', 'Dokumentasi Gambar', 'images', false, true),
      workflowField('keterangan', 'Keterangan Tambahan', 'textarea', false, true)
    ]
  }
});

function workflowField(key, label, type, required = false, span2 = false, options = []) {
  return { key, label, type, required, span2, options };
}

function renderForm() {
  const config = CATEGORY_CONFIG[activeCategory];
  document.getElementById('form-grid').innerHTML = config.fields
    .map(field => renderWorkflowField(field, '', false))
    .join('');
}

function renderWorkflowField(field, value, editMode, location = {}) {
  const spanClass = field.span2 || ['textarea', 'members', 'images', 'location'].includes(field.type)
    ? 'span2'
    : '';
  const id = field.type === 'location' ? 'f-lokasi' : (editMode ? 'edit-' : 'f-') + field.key;
  let input = '';

  if (field.type === 'location') {
    const locationPrefix = editMode ? 'edit-' : 'f-';
    const locationData = location || {};
    input = `
      <div class="location-box">
        <input type="text" id="${id}" value="${escapeDashboardAttribute(value || '')}"
          data-koordinat="${escapeDashboardAttribute(locationData.latitude !== null && locationData.latitude !== undefined && locationData.longitude !== null && locationData.longitude !== undefined ? locationData.latitude + ',' + locationData.longitude : '')}"
          data-maps="${escapeDashboardAttribute(locationData.mapsUrl || locationData.googleMapsUrl || '')}"
          oninput="this.dataset.koordinat=''; this.dataset.maps=''"
          placeholder="Alamat asli, koordinat, atau Share Location WhatsApp">
        <div class="loc-btn-row">
          <button type="button" class="btn btn-ghost btn-sm" onclick="deteksiWilayah('lokasi', this)">🔍 Deteksi Wilayah</button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="bukaGoogleMaps('lokasi')">🗺️ Buka Google Maps</button>
        </div>
        <div class="location-result">
          ${renderLocationAdminFields(locationPrefix, locationData)}
        </div>
      </div>`;
  } else if (field.type === 'select') {
    const options = value && !field.options.includes(value)
      ? [value, ...field.options]
      : field.options;
    input = `<select id="${id}"><option value="">Pilih...</option>${options.map(option =>
      `<option value="${escapeDashboardAttribute(option)}" ${option === value ? 'selected' : ''}>${escapeDashboardHtml(option)}</option>`
    ).join('')}</select>`;
  } else if (field.type === 'textarea') {
    input = `<textarea id="${id}" rows="3">${escapeDashboardHtml(value || '')}</textarea>`;
  } else if (field.type === 'members') {
    const members = workflowMembers();
    const selected = Array.isArray(value) ? value : [];
    input = `<div class="member-box"><div class="member-list">${members.map(member => `
      <label class="member-item" data-nama="${escapeDashboardAttribute(member.name.toLowerCase())}">
        <input type="checkbox" class="${editMode ? 'edit-petugas-checkbox' : 'member-checkbox'}" value="${escapeDashboardAttribute(member.name)}"
          ${selected.includes(member.name) ? 'checked' : ''}
          onchange="${editMode ? 'updateEditMemberCount()' : 'updateMemberCount()'}">
        <span>${escapeDashboardHtml(member.name)}</span>
      </label>`).join('')}</div>
      <div class="member-count">Jumlah Personel: <span id="${editMode ? 'edit-' : ''}member-count">${selected.length}</span></div></div>`;
  } else if (field.type === 'leader') {
    const members = Array.isArray(value) ? value : (value?.options || []);
    const selectedLeader = value?.selected || '';
    input = `<select id="${id}"><option value="">Pilih Pemimpin Regu...</option>${members.map(member =>
      `<option value="${escapeDashboardAttribute(member)}" ${member === selectedLeader ? 'selected' : ''}>${escapeDashboardHtml(member)}</option>`
    ).join('')}</select>`;
  } else if (field.type === 'readonly') {
    input = `<input type="number" id="${id}" value="${Number(value || 0)}" readonly>`;
  } else if (field.type === 'images') {
    input = `<input type="file" id="${id}" accept="image/*" capture="environment" multiple onchange="previewImages(this)"><div class="image-preview" id="${editMode ? 'edit-' : ''}image-preview"></div><small>Maksimal 3 gambar.</small>`;
  } else {
    input = `<input type="${field.type}" id="${id}" value="${escapeDashboardAttribute(value || '')}">`;
  }

  return `<div class="field ${spanClass}"><label>${escapeDashboardHtml(field.label)}${field.required ? ' <span class="req">*</span>' : ''}</label>${input}</div>`;
}

function workflowMembers() {
  const activeUsers = getAllUsers().filter(user => normalizeRoleName(user.role) === USER_ROLES.PETUGAS && user.aktif !== false);
  if (activeUsers.length) return activeUsers.map(user => ({ id: user.id, name: user.nama || user.username }));
  return DAFTAR_ANGGOTA.map(name => ({ id: '', name }));
}

function openModal() {
  if (!canCreateReport()) {
    showToast('Anda tidak memiliki akses membuat laporan.', true);
    return;
  }

  activeCategory = REPORT_CATEGORY.PENGENDALIAN;
  const overlay = document.getElementById('modal-overlay');
  overlay.querySelector('.modal-head h2').textContent = 'Tambah Laporan';
  overlay.querySelector('.modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-submit" onclick="submitReport()">Simpan Laporan</button>
  `;
  renderCatTabs();
  renderForm();
  overlay.classList.add('open');
}

async function submitReport() {
  if (!canCreateReport()) {
    showToast('Hanya Admin atau Superadmin yang dapat membuat laporan.', true);
    return;
  }

  const awal = await collectInitialReport();
  if (!awal) return;

  const reportId = generateReportId(reports);
  const now = getCurrentDateTime();
  const uploadedFiles = Array.isArray(awal.dokumentasi) ? awal.dokumentasi.filter(file => file && file.type && file.type.startsWith('image/')) : [];

  const report = {
    id: reportId,
    status: REPORT_STATUS.MENUNGGU_PENUGASAN,
    createdAt: now,
    updatedAt: now,
    createdBy: currentUser.id,
    kategori: activeCategory,
    laporanAwal: {
      ...awal,
      dokumentasi: []
    },
    pelaksanaan: {
      petugasPelaksana: [],
      waktuTiba: null,
      waktuSelesai: null,
      hasilPenanganan: '',
      dokumentasi: [],
      dataOperasional: {}
    },
    laporanDetail: {
      kronologi: '',
      penyebab: '',
      korbanJiwa: 0,
      korbanLuka: 0,
      kerugian: 0,
      keterangan: ''
    },
    auditLog: []
  };

  if (awal.petugasDitugaskan.length) {
    report.status = REPORT_STATUS.MENUNGGU_KONFIRMASI;
    report.laporanAwal.konfirmasiPenugasan = 'MENUNGGU_KONFIRMASI';
  }

  appendAuditLog(report, 'MEMBUAT_LAPORAN', null, 'Laporan awal dibuat');
  reports.push(report);
  closeModal();
  showDashboard();
  showToast('Laporan sedang disimpan ke database...');
  saveReportAndUploadInBackground(report, uploadedFiles);
}

async function saveReportAndUploadInBackground(report, files) {
  const uploadFiles = Array.isArray(files) ? files : [];
  activeUploadCount += 1;

  showUploadStatus(
    'Menyimpan laporan',
    `Laporan ${report.id} sedang disimpan ke database. Anda dapat melakukan pekerjaan lain.`
  );

  try {
    await saveReportRecord(report);

    if (uploadFiles.length === 0) {
      await showDashboard(true);
      showUploadStatus(
        'Laporan berhasil disimpan',
        `Laporan ${report.id} sudah tersimpan di database.`
      );
      return;
    }

    showUploadStatus(
      'Upload foto sedang berlangsung',
      `Laporan ${report.id} sudah tersimpan. Foto sedang dikirim ke Drive, Anda dapat melakukan pekerjaan lain.`
    );

    const uploadResult = await uploadReportImages(report.id, uploadFiles);
    const urls = Array.isArray(uploadResult?.urls) ? uploadResult.urls : [];

    if (urls.length === 0 && uploadFiles.length > 0 && !uploadResult?.accepted) {
      throw new Error('Tidak ada foto yang berhasil disimpan ke Drive.');
    }

    report.laporanAwal = report.laporanAwal || {};
    report.pelaksanaan = report.pelaksanaan || {};
    report.laporanAwal.dokumentasi = [...new Set([...(report.laporanAwal.dokumentasi || []), ...urls])];
    report.pelaksanaan.dokumentasi = [...new Set([...(report.pelaksanaan.dokumentasi || []), ...urls])];
    report.updatedAt = getCurrentDateTime();
    await saveReportRecord(report);
    await showDashboard(true);

    showUploadStatus(
      uploadResult.accepted
        ? 'Upload foto dikirim'
        : uploadResult.persistenceErrors && uploadResult.persistenceErrors.length
        ? 'Upload foto selesai dengan peringatan'
        : 'Upload foto selesai',
      uploadResult.accepted
        ? `Sebanyak ${uploadFiles.length} foto laporan ${report.id} berhasil dikirim dan sudah diverifikasi.`
        : uploadResult.persistenceErrors && uploadResult.persistenceErrors.length
        ? `${urls.length} foto tersimpan di Drive, tetapi sinkronisasi link laporan perlu diulang.`
        : `${urls.length} foto laporan ${report.id} berhasil disimpan ke Drive.`
    );
  }
  catch (error) {
    await showDashboard(true);
    showUploadStatus(
      'Upload foto gagal',
      `${getFriendlyUploadError(error, 'Foto belum berhasil disimpan ke Drive.')} Laporan tetap tersimpan.`,
      true
    );
  }
  finally {
    activeUploadCount = Math.max(0, activeUploadCount - 1);
  }
}

async function collectInitialReport() {
  const initial = {};
  const members = [];
  let location = null;

  for (const field of CATEGORY_CONFIG[activeCategory].fields) {
    if (field.type === 'members') {
      members.push(...Array.from(document.querySelectorAll('.member-checkbox:checked')).map(element => element.value));
      if (field.required && members.length === 0) {
        showToast('Pilih minimal satu anggota regu.', true);
        return null;
      }
      initial[field.key] = members;
      continue;
    }

    const element = document.getElementById('f-' + field.key);
    if (!element) continue;

    if (field.type === 'location') {
      const rawLocation = element.value.trim();
      if (field.required && !rawLocation) {
        showToast('Lengkapi lokasi kejadian.', true);
        return null;
      }
      const coordinates = element.dataset.koordinat || '';
      const coordinateParts = coordinates.split(',').map(Number);
      const parsed = coordinateParts.length === 2 && coordinateParts.every(Number.isFinite)
        ? { lat: coordinateParts[0], lng: coordinateParts[1] }
        : extractLatLng(rawLocation);
      const administrative = ['kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'kodePos'].reduce((result, key) => {
        const input = document.getElementById(`f-lokasi-${key}`);
        result[key] = input ? input.value.trim() : '';
        return result;
      }, {});
      location = {
        ...(element._locationData || {}),
        alamatAsli: rawLocation,
        inputAsli: rawLocation,
        alamat: rawLocation,
        ...administrative,
        latitude: parsed ? parsed.lat : null,
        longitude: parsed ? parsed.lng : null,
        mapsUrl: element.dataset.maps || (parsed ? buildMapsUrlFromKoordinat(`${parsed.lat},${parsed.lng}`) : buildMapsUrlFromAlamat(rawLocation)),
        googleMapsUrl: element.dataset.maps || (parsed ? buildMapsUrlFromKoordinat(`${parsed.lat},${parsed.lng}`) : buildMapsUrlFromAlamat(rawLocation)),
        sumberWilayah: Object.values(administrative).some(Boolean)
          ? 'admin'
          : (element._locationData?.sumberWilayah || 'belum_ditentukan'),
        sourceType: detectLocationSource(rawLocation),
        reverseGeocodingStatus: GEOCODING_STATUS.BELUM_DICEK,
        updatedAt: getCurrentDateTime()
      };
      initial[field.key] = location;
      continue;
    }

    if (field.type === 'images') {
      const files = Array.from(element.files || window.selectedReportImages[element.id] || []);
      try {
        validateImageFiles(files);
      }
      catch (error) {
        showToast(error.message || 'Dokumentasi foto tidak valid.', true);
        return null;
      }
      initial[field.key] = files;
      if (element.id) {
        window.selectedReportImages[element.id] = files;
      }
      continue;
    }

    const value = field.type === 'readonly' || field.type === 'number'
      ? Number(element.value || 0)
      : element.value.trim();
    if (field.required && !value) {
      showToast('Lengkapi field wajib: ' + field.label + '.', true);
      element.focus();
      return null;
    }
    initial[field.key] = value;
  }

  const assigned = getAllUsers().filter(user =>
    members.some(name => name.toLowerCase() === String(user.nama || user.username).toLowerCase())
  ).map(user => user.id);

  return {
    ...initial,
    unit: CATEGORY_CONFIG[activeCategory].unit,
    jenisLaporan: activeCategory,
    waktuLaporanMasuk: initial.tanggal || getCurrentDateTime(),
    petugasDitugaskan: assigned,
    konfirmasiPenugasan: assigned.length ? 'MENUNGGU_KONFIRMASI' : 'BELUM_DITUGASKAN'
  };
}

function detectLocationSource(value) {
  if (/google\.[^/]+\/maps|maps\.google|maps\.app\.goo\.gl/i.test(value)) {
    return LOCATION_SOURCE.GOOGLE_MAPS;
  }
  if (/https?:\/\//i.test(value)) return LOCATION_SOURCE.WHATSAPP;
  if (parseDMS(value)) return LOCATION_SOURCE.DMS;
  if (extractLatLng(value)) return LOCATION_SOURCE.DECIMAL;
  return LOCATION_SOURCE.ADDRESS;
}

function openAdminReport(id, event) {
  if (event) event.stopPropagation();
  if (!canEditReport()) {
    showToast('Anda tidak memiliki akses mengedit laporan.', true);
    return;
  }

  const report = reports.find(item => item.id === id);
  if (!report) {
    showToast('Laporan tidak ditemukan.', true);
    return;
  }

  const awal = report.laporanAwal || {};
  const detail = report.laporanDetail || {};
  const lokasi = awal.lokasi || {};
  const overlay = document.getElementById('modal-overlay');
  overlay.querySelector('.modal-head h2').textContent = 'Kelola Laporan ' + report.id;
  overlay.querySelector('.cat-tabs').innerHTML = '';
  overlay.querySelector('.form-grid').innerHTML = adminEditForm(report, lokasi, detail);
  overlay.querySelector('.modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-submit" onclick="saveAdminReport('${escapeDashboardAttribute(id)}')">Simpan Perubahan</button>
  `;
  overlay.classList.add('open');
}

function adminEditForm(report, lokasi, detail) {
  const awal = report.laporanAwal || {};
  const status = getReportStatus(report);
  return `
    <div class="field span2"><label>Status</label><select id="edit-status">
      ${Object.keys(STATUS_LABELS).map(value => `<option value="${value}" ${value === status ? 'selected' : ''}>${STATUS_LABELS[value]}</option>`).join('')}
    </select></div>
    ${adminInitialEditFields(report)}
    ${detailFields(detail)}
  `;
}

function adminInitialEditFields(report) {
  const awal = report.laporanAwal || {};
  const assignedIds = Array.isArray(awal.petugasDitugaskan) ? awal.petugasDitugaskan : [];
  const assignedNames = Array.isArray(awal.anggota)
    ? awal.anggota
    : getAllUsers().filter(user => assignedIds.includes(user.id)).map(user => user.nama || user.username);
  const categoryKey = awal.jenisLaporan || report.kategori || activeCategory;
  const legacyValue = {
    tanggal: awal.tanggal || String(awal.waktuLaporanMasuk || '').slice(0, 10),
    jenisPelanggaran: awal.jenisPelanggaran || (categoryKey === REPORT_CATEGORY.PENEGAKAN ? awal.jenisKegiatan : ''),
    jenisKebakaran: awal.jenisKebakaran || (categoryKey === REPORT_CATEGORY.PEMADAMAN ? awal.jenisKegiatan : ''),
    jenisKejadian: awal.jenisKejadian || (categoryKey === REPORT_CATEGORY.PENYELAMATAN ? awal.jenisKegiatan : ''),
    jumlahPersonel: awal.jumlahPersonel || assignedNames.length,
    dokumentasi: awal.dokumentasi || report.pelaksanaan?.dokumentasi || []
  };
  return CATEGORY_CONFIG[categoryKey].fields.map(field => {
    let value = awal[field.key] ?? legacyValue[field.key] ?? '';
    if (field.type === 'location') value = awal.lokasi?.alamatAsli || awal.lokasi?.inputAsli || awal.lokasi?.alamat || '';
    if (field.type === 'members') value = assignedNames;
    if (field.type === 'leader') value = { options: assignedNames, selected: awal.pemimpinRegu || '' };
    return renderWorkflowField(field, value, true, awal.lokasi || {});
  }).join('');
}

function detailFields(detail) {
  return `
    <div class="field span2"><label>Kronologi</label><textarea id="edit-kronologi">${escapeDashboardHtml(detail.kronologi || '')}</textarea></div>
    <div class="field span2"><label>Penyebab</label><textarea id="edit-penyebab">${escapeDashboardHtml(detail.penyebab || '')}</textarea></div>
    <div class="field"><label>Korban jiwa</label><input type="number" min="0" id="edit-korban-jiwa" value="${Number(detail.korbanJiwa || 0)}"></div>
    <div class="field"><label>Korban luka</label><input type="number" min="0" id="edit-korban-luka" value="${Number(detail.korbanLuka || 0)}"></div>
    <div class="field"><label>Kerugian</label><input type="number" min="0" id="edit-kerugian" value="${Number(detail.kerugian || 0)}"></div>
    <div class="field span2"><label>Keterangan</label><textarea id="edit-keterangan">${escapeDashboardHtml(detail.keterangan || '')}</textarea></div>
  `;
}

function updateEditMemberCount() {
  const count = document.querySelectorAll(
    '.edit-petugas-checkbox:checked'
  ).length;
  const countElement = document.getElementById('edit-member-count');
  if (countElement) countElement.textContent = count;
}

async function saveAdminReport(id) {
  const report = reports.find(item => item.id === id);
  if (!report) return;
  const before = cloneData(report);
  const locationElement = document.getElementById('f-lokasi');
  const locationText = locationElement.value.trim();
  const coordinates = locationElement.dataset.koordinat || '';
  const coordinateParts = coordinates.split(',').map(Number);
  const coords = coordinateParts.length === 2 && coordinateParts.every(Number.isFinite)
    ? { lat: coordinateParts[0], lng: coordinateParts[1] }
    : extractLatLng(locationText);
  const location = report.laporanAwal.lokasi || {};
  const administrative = ['kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'kodePos'].reduce((result, key) => {
    const input = document.getElementById(`edit-lokasi-${key}`) || document.getElementById(`f-lokasi-${key}`);
    result[key] = input ? input.value.trim() : (location[key] || '');
    return result;
  }, {});
  const regionChanged = Object.keys(administrative).some(key => administrative[key] !== String(location[key] || ''));

  const category = CATEGORY_CONFIG[report.laporanAwal.jenisLaporan || report.kategori || activeCategory];
  const initialValues = {};
  const imagesInput = document.getElementById('edit-dokumentasi') || document.getElementById('f-dokumentasi');
  const selectedImageFiles = Array.from((imagesInput && imagesInput.files) || window.selectedReportImages[imagesInput?.id] || []);

  for (const field of category.fields) {
    if (field.type === 'location') continue;
    if (field.type === 'members') {
      initialValues.anggota = Array.from(document.querySelectorAll('.edit-petugas-checkbox:checked')).map(checkbox => checkbox.value);
      continue;
    }
    const element = document.getElementById('edit-' + field.key);
    if (!element) continue;
    if (field.type === 'images') continue;
    initialValues[field.key] = field.type === 'number' || field.type === 'readonly'
      ? Number(element.value || 0)
      : element.value.trim();
  }

  const uploadedDocumentUrls = Array.isArray(report.laporanAwal.dokumentasi) ? [...report.laporanAwal.dokumentasi] : [];

  if (selectedImageFiles.length > 0) {
    try {
      validateImageFiles(selectedImageFiles);
    }
    catch (error) {
      showToast(error.message || 'Dokumentasi foto tidak valid.', true);
      return;
    }
  }

  report.laporanAwal = {
    ...report.laporanAwal,
    ...initialValues,
    dokumentasi: uploadedDocumentUrls,
    lokasi: {
    ...location,
    ...(locationElement._locationData || {}),
    alamatAsli: locationText,
    inputAsli: locationText,
    alamat: locationText,
    ...administrative,
    latitude: coords ? coords.lat : location.latitude,
    longitude: coords ? coords.lng : location.longitude,
    mapsUrl: locationElement.dataset.maps || location.mapsUrl || (coords ? buildMapsUrlFromKoordinat(coords.lat + ',' + coords.lng) : buildMapsUrlFromAlamat(locationText)),
    googleMapsUrl: locationElement.dataset.maps || location.googleMapsUrl || (coords ? buildMapsUrlFromKoordinat(coords.lat + ',' + coords.lng) : buildMapsUrlFromAlamat(locationText)),
    sumberWilayah: regionChanged ? 'admin' : (location.sumberWilayah || ''),
    sourceType: detectLocationSource(locationText),
    updatedAt: getCurrentDateTime()
    }
  };
  report.laporanAwal.petugasDitugaskan = Array.from(
    document.querySelectorAll('.edit-petugas-checkbox:checked')
  ).map(checkbox => checkbox.value);
  report.laporanAwal.petugasDitugaskan = getAllUsers().filter(user =>
    report.laporanAwal.anggota?.some(name =>
      name.toLowerCase() === String(user.nama || user.username).toLowerCase()
    )
  ).map(user => user.id);
  if (report.laporanAwal.petugasDitugaskan.length && report.status === REPORT_STATUS.MENUNGGU_PENUGASAN) {
    report.status = REPORT_STATUS.MENUNGGU_KONFIRMASI;
    report.laporanAwal.konfirmasiPenugasan = 'MENUNGGU_KONFIRMASI';
  }
  report.laporanDetail = {
    kronologi: document.getElementById('edit-kronologi').value.trim(),
    penyebab: document.getElementById('edit-penyebab').value.trim(),
    korbanJiwa: Number(document.getElementById('edit-korban-jiwa').value || 0),
    korbanLuka: Number(document.getElementById('edit-korban-luka').value || 0),
    kerugian: Number(document.getElementById('edit-kerugian').value || 0),
    keterangan: document.getElementById('edit-keterangan').value.trim()
  };
  report.pelaksanaan = report.pelaksanaan || {};
  report.pelaksanaan.dokumentasi = Array.isArray(report.pelaksanaan.dokumentasi)
    ? [...new Set([...report.pelaksanaan.dokumentasi, ...uploadedDocumentUrls])]
    : uploadedDocumentUrls;

  const nextStatus = document.getElementById('edit-status').value;
  if (nextStatus !== report.status) {
    if (!canChangeStatus(report.status, nextStatus) && !canBypassWorkflow()) {
      showToast('Perubahan status tidak mengikuti alur workflow.', true);
      return;
    }
    report.status = nextStatus;
    appendAuditLog(report, 'MENGUBAH_STATUS', before.status, nextStatus);
  }
  appendChangedFields(report, before);
  report.updatedAt = getCurrentDateTime();
  closeModal();
  showDashboard();
  showToast('Perubahan sedang disimpan ke database...');
  saveReportAndUploadInBackground(report, selectedImageFiles);
}

async function openPetugasTask(id, event) {
  if (event) event.stopPropagation();
  if (!isPetugas()) {
    showToast('Menu ini hanya untuk Petugas.', true);
    return;
  }

  let report = getMyPetugasReports().find(item => item.id === id);
  if (!report) {
    showToast('Tugas tidak ditemukan.', true);
    return;
  }

  const detailedReport = await getReportById(id);

  if (detailedReport) {
    const index = reports.findIndex(item => item.id === id);
    report = detailedReport;

    if (index !== -1) {
      reports[index] = detailedReport;
    }
  }

  const awal = report.laporanAwal || {};
  const pelaksanaan = report.pelaksanaan || {};
  const overlay = document.getElementById('modal-overlay');
  overlay.querySelector('.modal-head h2').textContent = 'Pelaksanaan ' + report.id;
  overlay.querySelector('.cat-tabs').innerHTML = '';
  overlay.querySelector('.form-grid').innerHTML = `
    <div class="field span2"><label>Lokasi kejadian</label><div class="detail-readonly">${escapeDashboardHtml(awal.lokasi?.alamat || awal.lokasi?.inputAsli || '-')}</div></div>
    <div class="field"><label>Status</label><div class="detail-readonly">${escapeDashboardHtml(getStatusLabelSafe(report.status))}</div></div>
    <div class="field"><label>Waktu tiba</label><input type="datetime-local" id="task-arrival" value="${toDatetimeLocal(pelaksanaan.waktuTiba)}"></div>
    <div class="field"><label>Waktu selesai</label><input type="datetime-local" id="task-finished" value="${toDatetimeLocal(pelaksanaan.waktuSelesai)}"></div>
    <div class="field span2"><label>Hasil penanganan</label><textarea id="task-result">${escapeDashboardHtml(pelaksanaan.hasilPenanganan || '')}</textarea></div>
    <div class="field span2">
      <label>Dokumentasi foto</label>
      <input type="file" id="task-images" accept="image/*" capture="environment" multiple>
      <label class="btn btn-ghost" for="task-images">Ambil Foto</label>
      <small>Maksimal 3 foto. Di HP, tombol ini membuka kamera atau galeri.</small>
    </div>
  `;
  overlay.querySelector('.modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
    <button class="btn btn-ghost" onclick="savePetugasTask('${escapeDashboardAttribute(id)}', false)">Simpan Progres</button>
    <button class="btn btn-submit" onclick="savePetugasTask('${escapeDashboardAttribute(id)}', true)">Selesaikan Penanganan</button>
  `;
  overlay.classList.add('open');
}

async function savePetugasTask(id, complete = false) {
  const report = getMyPetugasReports().find(item => item.id === id);
  if (!report) return;
  const before = cloneData(report);
  const files = Array.from(document.getElementById('task-images').files);
  if (files.length > 3) {
    showToast('Dokumentasi maksimal 3 gambar.', true);
    return;
  }

  report.pelaksanaan = report.pelaksanaan || {};
  report.pelaksanaan.petugasPelaksana = [currentUser.id];
  report.pelaksanaan.waktuTiba = document.getElementById('task-arrival').value || null;
  report.pelaksanaan.waktuSelesai = document.getElementById('task-finished').value || null;
  report.pelaksanaan.hasilPenanganan = document.getElementById('task-result').value.trim();

  if (complete && (!report.pelaksanaan.waktuSelesai || !report.pelaksanaan.hasilPenanganan)) {
    showToast('Isi waktu selesai dan hasil penanganan terlebih dahulu.', true);
    return;
  }

  if (report.status === REPORT_STATUS.MENUNGGU_KONFIRMASI) {
    report.status = REPORT_STATUS.DIPROSES;
    report.laporanAwal.konfirmasiPenugasan = 'DIPROSES';
  }
  if (complete) {
    report.status = REPORT_STATUS.SELESAI_PENANGANAN;
    report.laporanAwal.konfirmasiPenugasan = 'SELESAI_PENANGANAN';
  }
  appendChangedFields(report, before);
  report.updatedAt = getCurrentDateTime();
  closeModal();
  showDashboard();
  showToast('Data pelaksanaan sedang disimpan ke database...');
  saveReportAndUploadInBackground(report, files);
}

function toDatetimeLocal(value) {
  if (!value) return '';
  return String(value).slice(0, 16);
}

function appendAuditLog(report, action, before, after) {
  report.auditLog = Array.isArray(report.auditLog) ? report.auditLog : [];
  report.auditLog.push({
    id: 'LOG-' + Date.now(),
    waktu: getCurrentDateTime(),
    userId: currentUser?.id || '',
    username: currentUser?.username || '',
    action,
    field: null,
    before,
    after
  });
}

function appendChangedFields(report, before) {
  const fields = [
    ['laporanAwal.lokasi', before.laporanAwal?.lokasi, report.laporanAwal?.lokasi],
    ['laporanAwal.nomorPelapor', before.laporanAwal?.nomorPelapor, report.laporanAwal?.nomorPelapor],
    ['laporanDetail', before.laporanDetail, report.laporanDetail],
    ['pelaksanaan', before.pelaksanaan, report.pelaksanaan]
  ];
  fields.forEach(([field, oldValue, newValue]) => {
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      appendAuditLog(report, 'MENGUBAH_DATA', oldValue, newValue);
    }
  });
}

function appendSystemAuditLog(action, before, after) {
  const key = 'sikompak-system-audit-v1';
  const entries = JSON.parse(localStorage.getItem(key) || '[]');
  entries.push({
    id: 'SYS-' + Date.now(),
    waktu: getCurrentDateTime(),
    userId: currentUser?.id || '',
    username: currentUser?.username || '',
    action,
    reportId: 'SISTEM',
    before,
    after
  });
  localStorage.setItem(key, JSON.stringify(entries));
}

function renderUserManagement() {
  if (!isSuperadmin()) {
    showToast('Hanya Superadmin yang dapat mengelola user.', true);
    return;
  }

  const overlay = document.getElementById('modal-overlay');
  overlay.querySelector('.modal-head h2').textContent = 'Manajemen User';
  overlay.querySelector('.cat-tabs').innerHTML = '';
  overlay.querySelector('.form-grid').innerHTML = `
    <div class="management-toolbar field span2">
      <div>
        <strong>Daftar Pengguna</strong>
        <small>${users.length} akun terdaftar</small>
      </div>
      <button class="btn btn-submit btn-sm" onclick="renderUserForm()">+ Tambah User</button>
    </div>
    <div class="user-management-list field span2">
      ${users.map(user => `
        <article class="user-management-item ${user.aktif === false ? 'is-inactive' : ''}">
          <div class="user-management-avatar">${escapeDashboardHtml(String(user.nama || user.username).charAt(0).toUpperCase())}</div>
          <div class="user-management-info">
            <strong>${escapeDashboardHtml(user.nama || user.username)}</strong>
            <span>@${escapeDashboardHtml(user.username)} · ${escapeDashboardHtml(user.role)}</span>
            <small>${user.aktif === false ? 'Tidak aktif' : 'Aktif'}${user.unit ? ' · ' + escapeDashboardHtml(getUnitLabel(user.unit)) : ''}</small>
          </div>
          <div class="user-management-actions">
            <button class="icon-btn" title="Edit user" onclick="renderUserForm('${escapeDashboardAttribute(user.id)}')">Edit</button>
            <button class="icon-btn" title="Reset password" onclick="resetManagedPassword('${escapeDashboardAttribute(user.id)}')">Reset</button>
            <button class="icon-btn" title="Ubah status" onclick="toggleManagedUser('${escapeDashboardAttribute(user.id)}')">${user.aktif === false ? 'Aktifkan' : 'Nonaktifkan'}</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;
  overlay.querySelector('.modal-footer').innerHTML = '<button class="btn btn-ghost" onclick="closeModal()">Tutup</button>';
  overlay.classList.add('open');
}

function renderUserForm(id = '') {
  const user = users.find(item => item.id === id) || {
    id: '',
    username: '',
    nama: '',
    role: USER_ROLES.PETUGAS,
    unit: UNIT_PENANGANAN.DAMKAR,
    password: ''
  };
  const overlay = document.getElementById('modal-overlay');
  overlay.querySelector('.modal-head h2').textContent = id ? 'Edit User' : 'Tambah User';
  overlay.querySelector('.cat-tabs').innerHTML = '';
  overlay.querySelector('.form-grid').innerHTML = `
    <div class="field span2"><label>Nama lengkap</label><input id="user-name" value="${escapeDashboardAttribute(user.nama)}"></div>
    <div class="field"><label>Username</label><input id="user-username" value="${escapeDashboardAttribute(user.username)}" ${id ? 'readonly' : ''}></div>
    <div class="field"><label>Password ${id ? '(isi jika ingin mengganti)' : ''}</label><input type="password" id="user-password" value=""></div>
    <div class="field"><label>Role</label><select id="user-role">
      ${Object.values(USER_ROLES).map(role => `<option value="${role}" ${role === user.role ? 'selected' : ''}>${role}</option>`).join('')}
    </select></div>
    <div class="field"><label>Unit</label><select id="user-unit">
      <option value="${UNIT_PENANGANAN.DAMKAR}" ${user.unit === UNIT_PENANGANAN.DAMKAR ? 'selected' : ''}>Damkar</option>
      <option value="${UNIT_PENANGANAN.SATPOL_PP}" ${user.unit === UNIT_PENANGANAN.SATPOL_PP ? 'selected' : ''}>Satpol PP</option>
    </select></div>
  `;
  overlay.querySelector('.modal-footer').innerHTML = `
    <button class="btn btn-ghost" onclick="renderUserManagement()">Kembali</button>
    <button class="btn btn-submit" onclick="saveManagedUser('${escapeDashboardAttribute(id)}')">Simpan User</button>
  `;
  overlay.classList.add('open');
}

async function saveManagedUser(id) {
  if (!isSuperadmin()) return;
  const username = document.getElementById('user-username').value.trim();
  const name = document.getElementById('user-name').value.trim();
  const password = document.getElementById('user-password').value;
  if (!username || !name || (!id && !password)) {
    showToast('Nama, username, dan password wajib diisi.', true);
    return;
  }
  if (!id && users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    showToast('Username sudah digunakan.', true);
    return;
  }
  const existing = users.find(user => user.id === id);
  const before = existing ? cloneData(existing) : null;
  const user = existing || {
    id: 'USR-' + String(Date.now()).slice(-6),
    aktif: true,
    createdAt: getCurrentDateTime()
  };
  user.nama = name;
  user.username = username;
  user.role = normalizeRoleName(document.getElementById('user-role').value);
  user.unit = user.role === USER_ROLES.SUPERADMIN || user.role === USER_ROLES.ADMIN
    ? null
    : document.getElementById('user-unit').value;
  if (password) user.password = password;
  if (!existing) users.push(user);
  await saveUserRecord(user);
  appendSystemAuditLog(existing ? 'MENGUBAH_USER' : 'MEMBUAT_USER', before, { ...user, password: undefined });
  renderUserManagement();
  showToast('User berhasil disimpan.');
}

async function toggleManagedUser(id) {
  const user = users.find(item => item.id === id);
  if (!user || user.id === currentUser.id) {
    showToast('Akun yang sedang digunakan tidak dapat dinonaktifkan.', true);
    return;
  }
  const before = user.aktif !== false;
  user.aktif = !before;
  await saveUserRecord(user);
  appendSystemAuditLog(user.aktif ? 'MENGAKTIFKAN_USER' : 'MENONAKTIFKAN_USER', before, user.aktif);
  renderUserManagement();
}

async function resetManagedPassword(id) {
  const user = users.find(item => item.id === id);
  if (!user) return;
  const password = window.prompt('Masukkan password baru untuk ' + user.username + ':');
  if (!password) return;
  user.password = password;
  await saveUserRecord(user);
  appendSystemAuditLog('RESET_PASSWORD_USER', null, { userId: user.id });
  showToast('Password berhasil diubah.');
}

function openAuditLog() {
  if (!isSuperadmin()) {
    showToast('Hanya Superadmin yang dapat melihat audit log.', true);
    return;
  }

  const reportEntries = getAllReports().flatMap(report =>
    (Array.isArray(report.auditLog) ? report.auditLog : []).map(log => ({
      ...log,
      reportId: report.id
    }))
  );
  const systemEntries = JSON.parse(localStorage.getItem('sikompak-system-audit-v1') || '[]');
  const entries = [...reportEntries, ...systemEntries]
    .sort((a, b) => String(b.waktu).localeCompare(String(a.waktu)));
  const actionLabels = {
    MEMBUAT_LAPORAN: 'Membuat laporan',
    MENGUBAH_DATA: 'Mengubah data laporan',
    MENGUBAH_STATUS: 'Mengubah status',
    MEMBUAT_USER: 'Membuat user',
    MENGUBAH_USER: 'Mengubah user',
    MENGAKTIFKAN_USER: 'Mengaktifkan user',
    MENONAKTIFKAN_USER: 'Menonaktifkan user',
    RESET_PASSWORD_USER: 'Reset password user',
    MENGHAPUS_LAPORAN: 'Menghapus laporan'
  };
  const overlay = document.getElementById('modal-overlay');
  overlay.querySelector('.modal-head h2').textContent = 'Audit Log';
  overlay.querySelector('.cat-tabs').innerHTML = '';
  window.dashboardAuditEntries = entries;
  overlay.querySelector('.form-grid').innerHTML = entries.length
    ? `<div class="field span2"><div class="audit-log-layout">
        <div class="audit-log-list">${entries.map((log, index) => `
          <button type="button" class="audit-log-item ${index === 0 ? 'active' : ''}" onclick="selectAuditLog(${index})">
            <span class="audit-log-marker"></span>
            <span class="audit-log-content">
              <span class="audit-log-topline"><strong>${escapeDashboardHtml(actionLabels[log.action] || log.action)}</strong><time>${escapeDashboardHtml(new Date(log.waktu).toLocaleString('id-ID'))}</time></span>
              <span class="audit-log-meta">${escapeDashboardHtml(log.reportId || 'SISTEM')} · ${escapeDashboardHtml(log.username || '-')}</span>
            </span>
          </button>`).join('')}</div>
        <div class="audit-log-detail" id="audit-log-detail">${renderAuditLogDetail(entries[0], actionLabels)}</div>
      </div></div>`
    : '<div class="empty-state">Belum ada histori perubahan.</div>';
  overlay.querySelector('.modal-footer').innerHTML = '<button class="btn btn-ghost" onclick="closeModal()">Tutup</button>';
  overlay.classList.add('open');
}

function selectAuditLog(index) {
  const entry = window.dashboardAuditEntries?.[index];
  const detail = document.getElementById('audit-log-detail');
  if (!entry || !detail) return;
  document.querySelectorAll('.audit-log-item').forEach((item, itemIndex) => {
    item.classList.toggle('active', itemIndex === index);
  });
  detail.innerHTML = renderAuditLogDetail(entry, {
    MEMBUAT_LAPORAN: 'Membuat laporan',
    MENGUBAH_DATA: 'Mengubah data laporan',
    MENGUBAH_STATUS: 'Mengubah status',
    MEMBUAT_USER: 'Membuat user',
    MENGUBAH_USER: 'Mengubah user',
    MENGAKTIFKAN_USER: 'Mengaktifkan user',
    MENONAKTIFKAN_USER: 'Menonaktifkan user',
    RESET_PASSWORD_USER: 'Reset password user',
    MENGHAPUS_LAPORAN: 'Menghapus laporan'
  });
}

function renderAuditLogDetail(entry, actionLabels) {
  return `
    <div class="audit-detail-heading">
      <span class="eyebrow">Detail aktivitas</span>
      <h3>${escapeDashboardHtml(actionLabels[entry.action] || entry.action)}</h3>
      <p>${escapeDashboardHtml(entry.reportId || 'SISTEM')} · ${escapeDashboardHtml(entry.username || '-')} · ${escapeDashboardHtml(new Date(entry.waktu).toLocaleString('id-ID'))}</p>
    </div>
    <div class="audit-detail-section">
      <span>Sebelum perubahan</span>
      <pre>${escapeDashboardHtml(formatAuditValue(entry.before))}</pre>
    </div>
    <div class="audit-detail-section is-after">
      <span>Sesudah perubahan</span>
      <pre>${escapeDashboardHtml(formatAuditValue(entry.after))}</pre>
    </div>
  `;
}

async function deleteSuperadminReport(id, event) {
  if (event) event.stopPropagation();
  if (!isSuperadmin()) {
    showToast('Hanya Superadmin yang dapat menghapus laporan.', true);
    return;
  }
  const report = reports.find(item => item.id === id);
  if (!report) return;
  const confirmed = await requestDeleteConfirmation(report);
  if (!confirmed) return;
  appendSystemAuditLog('MENGHAPUS_LAPORAN', {
    reportId: report.id,
    status: report.status,
    createdBy: report.createdBy
  }, null);
  await deleteReport(id);
  reports = reports.filter(item => item.id !== id);
  showDashboard();
  showToast('Laporan berhasil dihapus.');
}

function requestDeleteConfirmation(report) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirmation-overlay';
    overlay.innerHTML = `
      <section class="delete-confirmation" role="dialog" aria-modal="true" aria-labelledby="delete-confirmation-title">
        <div class="delete-confirmation-head">
          <div class="delete-confirmation-icon">⌫</div>
          <div>
            <span class="eyebrow">Konfirmasi tindakan</span>
            <h2 id="delete-confirmation-title">Hapus laporan?</h2>
          </div>
          <button type="button" class="delete-confirmation-close" aria-label="Tutup">×</button>
        </div>
        <div class="delete-confirmation-body">
          <p>Laporan akan dinonaktifkan dari daftar dan tetap tersimpan untuk audit.</p>
          <div class="delete-confirmation-summary">
            <strong>${escapeDashboardHtml(report.id)}</strong>
            <span>${escapeDashboardHtml(report.laporanAwal?.lokasi?.alamat || report.laporanAwal?.lokasi?.inputAsli || 'Lokasi belum diisi')}</span>
          </div>
        </div>
        <div class="delete-confirmation-actions">
          <button type="button" class="btn btn-ghost delete-cancel">Batal</button>
          <button type="button" class="btn delete-confirm">Hapus Laporan</button>
        </div>
      </section>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const finish = value => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 180);
      resolve(value);
    };
    overlay.querySelector('.delete-cancel').onclick = () => finish(false);
    overlay.querySelector('.delete-confirmation-close').onclick = () => finish(false);
    overlay.querySelector('.delete-confirm').onclick = () => finish(true);
    overlay.onclick = event => {
      if (event.target === overlay) finish(false);
    };
  });
}

function formatAuditValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value !== 'object') return String(value);
  const labels = {
    inputAsli: 'Input lokasi',
    alamat: 'Alamat',
    latitude: 'Latitude',
    longitude: 'Longitude',
    googleMapsUrl: 'Google Maps',
    status: 'Status',
    petugasDitugaskan: 'Petugas',
    hasilPenanganan: 'Hasil penanganan',
    waktuTiba: 'Waktu tiba',
    waktuSelesai: 'Waktu selesai',
    nama: 'Nama',
    username: 'Username',
    role: 'Role',
    unit: 'Unit'
  };
  return Object.entries(value)
    .filter(([key, item]) => key !== 'password' && item !== '' && item !== null && item !== undefined)
    .map(([key, item]) => `${labels[key] || key}: ${Array.isArray(item) ? item.join(', ') : typeof item === 'object' ? formatAuditValue(item) : item}`)
    .join(' | ') || '-';
}
