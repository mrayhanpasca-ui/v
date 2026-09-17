/* ================= LOCATION FIELD ================= */

    /* ---- DMS parser: 7°56'25.1"S 112°37'27.9"E dan variasinya ---- */

    function parseDMS(text){

      if(!text) return null;

      const re =
        /(\d{1,3})\s*[°ºo]\s*(\d{1,2})\s*['′]\s*(\d+(?:\.\d+)?)\s*(?:["″]|'')?\s*([NnSsEeWw])/g;

      let m;

      let lat =
        null;

      let lng =
        null;

      while(
        (m = re.exec(text)) !== null
      ){

        const deg =
          parseFloat(m[1]);

        const min =
          parseFloat(m[2]);

        const sec =
          parseFloat(m[3]);

        const dir =
          m[4].toUpperCase();

        let dec =
          deg +
          (min / 60) +
          (sec / 3600);

        if(
          dir === 'S' ||
          dir === 'W'
        ){
          dec =
            -dec;
        }

        if(
          dir === 'N' ||
          dir === 'S'
        ){
          lat =
            dec;
        } else {
          lng =
            dec;
        }

      }

      if(
        lat !== null &&
        lng !== null
      ){
        return { lat, lng };
      }

      return null;

    }

    /* ---- Validasi rentang koordinat ---- */

    function isValidLatLng(lat, lng){

      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180
      );

    }

    /* ---- Parser gabungan: link Maps, decimal, berlabel, DMS ---- */

    function extractLatLng(text){

      if(!text) return null;

      const t =
        text.trim();

      if(!t) return null;

      /* Link Share Location WhatsApp / Google Maps: ?q=LAT,LNG */
      let m =
        t.match(
          /[?&]q=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/
        );

      /* Link Google Maps: @LAT,LNG,zoom */
      if(!m){
        m =
          t.match(
            /@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/
          );
      }

      /* Berlabel: "Lat: -7.9, Lng: 112.6" */
      if(!m){
        m =
          t.match(
            /lat(?:itude)?[:\s]*(-?\d{1,3}\.\d+)[,\s]+(?:lng|lon|long(?:itude)?)[:\s]*(-?\d{1,3}\.\d+)/i
          );
      }

      /* Decimal dengan koma: "-7.9,112.6" */
      if(!m){
        m =
          t.match(
            /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/
          );
      }

      /* Decimal dengan spasi: "-7.9 112.6" */
      if(!m){
        m =
          t.match(
            /(-?\d{1,3}\.\d+)\s+(-?\d{1,3}\.\d+)/
          );
      }

      if(m){

        const lat =
          parseFloat(m[1]);

        const lng =
          parseFloat(m[2]);

        if(
          isValidLatLng(lat, lng)
        ){
          return { lat, lng };
        }

      }

      /* Terakhir, coba format DMS */

      const dms =
        parseDMS(t);

      if(
        dms &&
        isValidLatLng(dms.lat, dms.lng)
      ){
        return dms;
      }

      return null;

    }

    function getAddressComponent(components, types){

      const list = Array.isArray(components) ? components : [];
      const wanted = Array.isArray(types) ? types : [];
      const component = list.find(item =>
        Array.isArray(item?.types) && wanted.some(type => item.types.includes(type))
      );

      return component ? String(component.long_name || component.longName || '').trim() : '';

    }

    function normalizeRegionName(value){
      return String(value || '')
        .toLowerCase()
        .replace(/\b(kabupaten|kab\.?|kota|kec\.?|kecamatan|kel\.?|kelurahan|desa)\b/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    }

    function getMasterRegionRows(){
      return Array.isArray(masterWilayah) ? masterWilayah : [];
    }

    function getMasterKecamatanOptions(){
      const kecamatanList = [...new Set(getMasterRegionRows()
        .filter(row => normalizeRegionName(row.kabupaten) === normalizeRegionName(SYSTEM_REGION.kabupaten))
        .map(row => row.kecamatan)
        .filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, 'id'));
      console.log('Kecamatan:', kecamatanList);
      return kecamatanList;
    }

    function getMasterDesaOptions(kecamatan){
      const normalized = normalizeRegionName(kecamatan);
      const desaList = [...new Set(getMasterRegionRows()
        .filter(row => normalizeRegionName(row.kabupaten) === normalizeRegionName(SYSTEM_REGION.kabupaten))
        .filter(row => !normalized || normalizeRegionName(row.kecamatan) === normalized)
        .map(row => row.desaKelurahan)
        .filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, 'id'));
      console.log('Desa berdasarkan Kecamatan:', desaList);
      return desaList;
    }

    function locationDropdownOptions(prefix, kind, query = ''){
      const source = kind === 'kecamatan'
        ? getMasterKecamatanOptions()
        : getMasterDesaOptions(document.getElementById(`${prefix}lokasi-kecamatan`)?.value || '');
      const normalizedQuery = normalizeRegionName(query);

      return source
        .filter(option => !normalizedQuery || normalizeRegionName(option).includes(normalizedQuery))
        .sort((left, right) => {
          const leftStarts = normalizeRegionName(left).startsWith(normalizedQuery);
          const rightStarts = normalizeRegionName(right).startsWith(normalizedQuery);
          return Number(rightStarts) - Number(leftStarts) || left.localeCompare(right, 'id');
        });
    }

    function renderLocationDropdown(prefix, kind, options){
      const listId = `${prefix}lokasi-${kind}-dropdown`;
      const emptyText = getMasterRegionRows().length === 0
        ? 'MasterWilayah belum memiliki data.'
        : 'Tidak ada pilihan yang cocok.';

      return `<div class="location-dropdown" id="${listId}" role="listbox">
        ${options.length
          ? options.map(option => `<button type="button" class="location-dropdown-option" role="option" data-value="${escapeDashboardAttribute(option)}" onclick="selectLocationOption('${prefix}', '${kind}', this.dataset.value)">${escapeDashboardHtml(option)}</button>`).join('')
          : `<div class="location-dropdown-empty">${emptyText}</div>`}
      </div>`;
    }

    function openLocationDropdown(prefix, kind){
      const input = document.getElementById(`${prefix}lokasi-${kind}`);
      const dropdown = document.getElementById(`${prefix}lokasi-${kind}-dropdown`);
      if (!input || !dropdown) return;
      filterLocationDropdown(prefix, kind, input.value);
      document.querySelectorAll('.location-dropdown.open').forEach(item => {
        if (item !== dropdown) item.classList.remove('open');
      });
      dropdown.classList.add('open');
    }

    function filterLocationDropdown(prefix, kind, query){
      const dropdown = document.getElementById(`${prefix}lokasi-${kind}-dropdown`);
      if (!dropdown) return;
      const options = locationDropdownOptions(prefix, kind, query);
      dropdown.innerHTML = options.length
        ? options.map(option => `<button type="button" class="location-dropdown-option" role="option" data-value="${escapeDashboardAttribute(option)}" onclick="selectLocationOption('${prefix}', '${kind}', this.dataset.value)">${escapeDashboardHtml(option)}</button>`).join('')
        : `<div class="location-dropdown-empty">${getMasterRegionRows().length === 0 ? 'MasterWilayah belum memiliki data.' : 'Tidak ada pilihan yang cocok.'}</div>`;
      dropdown.classList.add('open');
    }

    function selectLocationOption(prefix, kind, value){
      const input = document.getElementById(`${prefix}lokasi-${kind}`);
      if (!input) return;
      input.value = value;
      document.getElementById(`${prefix}lokasi-${kind}-dropdown`)?.classList.remove('open');

      if (kind === 'kecamatan') {
        const desa = document.getElementById(`${prefix}lokasi-kelurahan`);
        if (desa) desa.value = '';
        updateLocationVillageOptions(prefix);
      }
    }

    document.addEventListener('click', event => {
      if (!event.target.closest('.location-combobox')) {
        document.querySelectorAll('.location-dropdown.open').forEach(dropdown => {
          dropdown.classList.remove('open');
        });
      }
    });

    function renderLocationAdminFields(prefix, location){
      const kecamatanId = `${prefix}lokasi-kecamatan`;
      const desaId = `${prefix}lokasi-kelurahan`;
      const kecamatanOptions = getMasterKecamatanOptions();
      const desaOptions = getMasterDesaOptions(location.kecamatan || '');

      return `
        <div class="location-result-heading">Wilayah administratif <span>hasil deteksi dapat dikoreksi</span></div>
        <div class="location-combobox"><label class="location-admin-field"><span>Kelurahan/Desa</span><input type="text" id="${desaId}" value="${escapeDashboardAttribute(location.kelurahan || location.desaKelurahan || '')}" placeholder="Pilih Desa/Kelurahan" autocomplete="off" onfocus="openLocationDropdown('${prefix}', 'kelurahan')" oninput="filterLocationDropdown('${prefix}', 'kelurahan', this.value)"></label>${renderLocationDropdown(prefix, 'kelurahan', desaOptions)}</div>
        <div class="location-combobox"><label class="location-admin-field"><span>Kecamatan</span><input type="text" id="${kecamatanId}" value="${escapeDashboardAttribute(location.kecamatan || '')}" placeholder="Pilih Kecamatan" autocomplete="off" onfocus="openLocationDropdown('${prefix}', 'kecamatan')" oninput="filterLocationDropdown('${prefix}', 'kecamatan', this.value)"></label>${renderLocationDropdown(prefix, 'kecamatan', kecamatanOptions)}</div>
        <label class="location-admin-field"><span>Kabupaten/Kota</span><input type="text" value="${escapeDashboardAttribute(SYSTEM_REGION.kabupaten)}" readonly></label>
        <label class="location-admin-field"><span>Provinsi</span><input type="text" value="${escapeDashboardAttribute(SYSTEM_REGION.provinsi)}" readonly></label>
        <label class="location-admin-field"><span>Kode Pos</span><input type="text" id="${prefix}lokasi-kodePos" value="${escapeDashboardAttribute(location.kodePos || '')}" placeholder="Kode pos (opsional)"></label>
        <small class="loc-hint">Alamat asli tidak akan ditimpa oleh hasil deteksi.</small>
      `;
    }

    function updateLocationVillageOptions(prefix){
      const kecamatan = document.getElementById(`${prefix}lokasi-kecamatan`);
      const desaList = document.getElementById(`${prefix}lokasi-kelurahan-dropdown`);
      if (!kecamatan || !desaList) return;
      const desaOptions = locationDropdownOptions(prefix, 'kelurahan', '');
      desaList.innerHTML = desaOptions.length
        ? desaOptions.map(option => `<button type="button" class="location-dropdown-option" role="option" data-value="${escapeDashboardAttribute(option)}" onclick="selectLocationOption('${prefix}', 'kelurahan', this.dataset.value)">${escapeDashboardHtml(option)}</button>`).join('')
        : `<div class="location-dropdown-empty">${getMasterRegionRows().length === 0 ? 'MasterWilayah belum memiliki data.' : 'Pilih Kecamatan terlebih dahulu.'}</div>`;
      const desa = document.getElementById(`${prefix}lokasi-kelurahan`);
      if (desa && desa.value && !desaOptions.some(option => normalizeRegionName(option) === normalizeRegionName(desa.value))) {
        desa.value = '';
      }
    }

    function resolveAdministrativeArea(result){

      const components = Array.isArray(result?.address_components)
        ? result.address_components
        : [];
      const address = result?.address || {};

      const pick = (types, fallbackKeys) => {
        const fromComponents = getAddressComponent(components, types);
        if (fromComponents) return fromComponents;
        return (fallbackKeys || [])
          .map(key => String(address[key] || '').trim())
          .find(Boolean) || '';
      };

      return {
        kelurahan: pick([
          'administrative_area_level_4',
          'administrative_area_level_5',
          'sublocality_level_1',
          'sublocality',
          'village',
          'suburb'
        ], ['village', 'suburb', 'town']),
        kecamatan: pick([
          'administrative_area_level_3'
        ], ['district', 'municipality', 'town']),
        kabupaten: pick([
          'administrative_area_level_2'
        ], ['county', 'city']),
        provinsi: pick([
          'administrative_area_level_1'
        ], ['state', 'province']),
        kodePos: pick([
          'postal_code'
        ], ['postcode'])
      };

    }

    function normalizeDetectedLocation(result, coordinates){

      const area = resolveAdministrativeArea(result);
      const location = result?.geometry?.location;
      const rawLat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
      const rawLng = typeof location?.lng === 'function' ? location.lng() : location?.lng;
      const lat = Number(coordinates?.lat ?? rawLat);
      const lng = Number(coordinates?.lng ?? rawLng);

      return {
        ...area,
        latitude: isValidLatLng(lat, lng) ? lat : null,
        longitude: isValidLatLng(lat, lng) ? lng : null,
        formattedAddress: String(result?.formatted_address || result?.display_name || '').trim()
      };

    }

    function geocodeWithGoogle(request){

      if (
        typeof google === 'undefined' ||
        !google.maps ||
        typeof google.maps.Geocoder !== 'function'
      ) {
        return Promise.resolve(null);
      }

      return new Promise(resolve => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(request, (results, status) => {
          if (status !== 'OK' || !Array.isArray(results) || !results[0]) {
            resolve(null);
            return;
          }

          const location = results[0].geometry?.location;
          const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
          const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng;
          resolve(normalizeDetectedLocation(results[0], { lat, lng }));
        });
      });

    }

    /* ---- Reverse geocoding: koordinat -> wilayah ---- */

    async function reverseGeocode(lat, lng){

      try{
        const googleResult = await geocodeWithGoogle({
          location: { lat, lng }
        });
        if (googleResult) return googleResult;

        const res =
          await fetch(
            'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
            lat +
            '&lon=' +
            lng +
            '&zoom=18&addressdetails=1',
            { headers: { 'Accept-Language': 'id-ID' } }
          );

        if(!res.ok) return null;

        const json =
          await res.json();

        return normalizeDetectedLocation(json, { lat, lng });

      } catch(err){

        return null;

      }

    }

    /* ---- Forward geocoding: alamat -> koordinat dan wilayah ---- */

    async function geocodeAlamat(alamat){

      try{
        const googleResult = await geocodeWithGoogle({ address: alamat });
        if (googleResult) return googleResult;

        const queries = [
          alamat,
          alamat
            .replace(/\b(?:No\.?|Nomor)\s*[\w.-]+/gi, '')
            .replace(/\b(?:RT|RW)\.?\s*[\w./-]+/gi, '')
            .replace(/\s*,\s*,/g, ',')
            .replace(/^\s*,|,\s*$/g, '')
            .trim(),
          alamat
            .split(',')
            .slice(-4)
            .join(',')
            .replace(/\bKec(?:amatan)?\.?\s*/gi, '')
            .replace(/\bKab(?:upaten)?\.?\s*/gi, '')
            .replace(/\bKota\s+/gi, '')
            .replace(/\s+\d{5,6}\b/g, '')
            .trim(),
          alamat
            .replace(/\b(?:No\.?|Nomor)\s*[\w.-]+/gi, '')
            .replace(/\b(?:RT|RW)\.?\s*[\w./-]+/gi, '')
            .replace(/\bKec(?:amatan)?\.?\s*/gi, '')
            .replace(/\bKab(?:upaten)?\.?\s*/gi, '')
            .replace(/\bKota\s+/gi, '')
            .replace(/\s+\d{5,6}\b/g, '')
            .replace(/\s*,\s*,/g, ',')
            .replace(/^\s*,|,\s*$/g, '')
            .trim()
        ].filter((query, index, list) => query && list.indexOf(query) === index);

        for (const query of queries){
          const res = await fetch(
            'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=id&accept-language=id&q=' +
            encodeURIComponent(query),
            { headers: { 'Accept-Language': 'id-ID' } }
          );

          if(!res.ok) continue;

          const json = await res.json();
          const result = Array.isArray(json) ? json[0] : null;
          const lat = parseFloat(result?.lat);
          const lng = parseFloat(result?.lon);

          if(result && isValidLatLng(lat, lng)){
            return normalizeDetectedLocation(result, { lat, lng });
          }
        }

        return null;

      } catch(err){

        return null;

      }

    }

    function buildMapsUrlFromKoordinat(koordinat){

      return (
        'https://maps.google.com/?q=' +
        koordinat
      );

    }

    function buildMapsUrlFromAlamat(alamat){

      return (
        'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(alamat)
      );

    }

    async function deteksiWilayah(key, btn){

      const el = document.getElementById('f-' + key);
      if (!el) return;

      const raw = el.value.trim();
      const originalLabel = btn ? btn.textContent : '';
      const existingLocation = el._locationData || {};

      if (!raw && !el.dataset.koordinat){
        showToast('Isi alamat atau koordinat terlebih dahulu.', true);
        return;
      }

      if (btn){
        btn.disabled = true;
        btn.textContent = '🔍 Mendeteksi...';
      }

      try{
        let coordinates = extractLatLng(el.dataset.koordinat || raw);
        let detected = null;
        const currentValues = ['kelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'kodePos'].reduce((result, name) => {
          const input = document.getElementById(`edit-${key}-${name}`) || document.getElementById(`f-${key}-${name}`);
          result[name] = input ? input.value.trim() : '';
          return result;
        }, {});

        if (coordinates){
          detected = await reverseGeocode(coordinates.lat, coordinates.lng);
        } else {
          detected = await geocodeAlamat(raw);
          coordinates = detected && detected.latitude !== null
            ? { lat: detected.latitude, lng: detected.longitude }
            : null;
        }

        if (!detected){
          throw new Error('Wilayah tidak ditemukan.');
        }

        const coordinateText = coordinates
          ? `${Number(coordinates.lat).toFixed(6)},${Number(coordinates.lng).toFixed(6)}`
          : '';
        const detectedKabupaten = detected.kabupaten || '';
        const detectedProvinsi = detected.provinsi || '';
        const outsideSystemRegion = detectedKabupaten &&
          normalizeRegionName(detectedKabupaten) !== normalizeRegionName(SYSTEM_REGION.kabupaten);
        const masterMatch = getMasterRegionRows().some(row =>
          normalizeRegionName(row.kecamatan) === normalizeRegionName(detected.kecamatan) &&
          normalizeRegionName(row.desaKelurahan) === normalizeRegionName(detected.kelurahan)
        );
        const nextLocation = {
          ...existingLocation,
          alamatAsli: raw,
          inputAsli: raw,
          alamat: raw,
          kelurahan: detected.kelurahan || currentValues.kelurahan,
          kecamatan: detected.kecamatan || currentValues.kecamatan,
          kabupaten: detected.kabupaten || currentValues.kabupaten,
          provinsi: detected.provinsi || currentValues.provinsi,
          kodePos: detected.kodePos || currentValues.kodePos,
          desaKelurahan: detected.kelurahan || currentValues.kelurahan,
          alamatHasilDeteksi: detected.formattedAddress || '',
          kabupatenSistem: SYSTEM_REGION.kabupaten,
          provinsiSistem: SYSTEM_REGION.provinsi,
          hasilDeteksiKabupaten: detectedKabupaten,
          hasilDeteksiProvinsi: detectedProvinsi,
          statusWilayah: outsideSystemRegion
            ? 'DI_LUAR_JANGKAUAN'
            : masterMatch
              ? 'VALID'
              : 'PERLU_DIPERIKSA',
          latitude: detected.latitude ?? coordinates?.lat ?? existingLocation.latitude ?? null,
          longitude: detected.longitude ?? coordinates?.lng ?? existingLocation.longitude ?? null,
          mapsUrl: coordinateText ? buildMapsUrlFromKoordinat(coordinateText) : buildMapsUrlFromAlamat(raw),
          googleMapsUrl: coordinateText ? buildMapsUrlFromKoordinat(coordinateText) : buildMapsUrlFromAlamat(raw),
          sumberWilayah: 'google',
          sourceType: detectLocationSource(raw),
          reverseGeocodingStatus: 'BERHASIL',
          terakhirDideteksi: getCurrentDateTime(),
          updatedAt: getCurrentDateTime()
        };

        el._locationData = nextLocation;
        el.dataset.koordinat = coordinateText;
        el.dataset.maps = nextLocation.mapsUrl;
        syncLocationResult(key, nextLocation);
        showToast(
          outsideSystemRegion
            ? `Wilayah terdeteksi di luar ${SYSTEM_REGION.kabupaten}. Laporan tetap dapat disimpan.`
            : masterMatch
              ? 'Wilayah berhasil dideteksi dan cocok dengan MasterWilayah.'
              : 'Wilayah terdeteksi, tetapi perlu diperiksa dan dicocokkan dengan MasterWilayah.'
        );

      } catch (error){
        showToast('Wilayah belum dapat dideteksi. Alamat asli tetap tersimpan, silakan isi wilayah secara manual.', true);
      } finally {
        if (btn){
          btn.disabled = false;
          btn.textContent = originalLabel;
        }
      }

    }

    function syncLocationResult(key, location){
      const values = {
        kelurahan: location.kelurahan || location.desaKelurahan || '',
        kecamatan: location.kecamatan || '',
        kabupaten: location.kabupaten || '',
        provinsi: location.provinsi || '',
        kodePos: location.kodePos || ''
      };

      Object.entries(values).forEach(([name, value]) => {
        const input = document.getElementById(`edit-${key}-${name}`) || document.getElementById(`f-${key}-${name}`);
        if (input) input.value = value;
      });
    }

    /* Kompatibilitas untuk call site lama. */
    async function ubahKeAlamat(key, btn){
      return deteksiWilayah(key, btn);
    }

    /* ---- Tombol "Buka Google Maps" ---- */

    function bukaGoogleMaps(key){

      const el =
        document.getElementById(
          'f-' + key
        );

      const raw =
        el.value.trim();

      if(
        !raw &&
        !el.dataset.koordinat
      ){

        showToast(
          '⚠️ Isi lokasi terlebih dahulu.',
          true
        );

        return;

      }

      let url =
        el.dataset.maps;

      if(!url){

        if(el.dataset.koordinat){

          url =
            buildMapsUrlFromKoordinat(
              el.dataset.koordinat
            );

        } else {

          const coords =
            extractLatLng(raw);

          if(coords){

            const koordStr =
              coords.lat.toFixed(6) +
              ',' +
              coords.lng.toFixed(6);

            el.dataset.koordinat =
              koordStr;

            url =
              buildMapsUrlFromKoordinat(
                koordStr
              );

          } else {

            url =
              buildMapsUrlFromAlamat(
                raw
              );

          }

        }

        el.dataset.maps =
          url;

      }

      window.open(
        url,
        '_blank'
      );

    }

