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

    /* ---- Reverse geocoding: koordinat -> alamat ---- */

    async function reverseGeocode(lat, lng){

      try{

        const res =
          await fetch(
            'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
            lat +
            '&lon=' +
            lng +
            '&zoom=18&addressdetails=0'
          );

        if(!res.ok) return null;

        const json =
          await res.json();

        return (
          json &&
          json.display_name
        ) || null;

      } catch(err){

        return null;

      }

    }

    /* ---- Forward geocoding: alamat -> koordinat ---- */

    async function geocodeAlamat(alamat){

      try{

        const res =
          await fetch(
            'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
            encodeURIComponent(alamat)
          );

        if(!res.ok) return null;

        const json =
          await res.json();

        if(
          json &&
          json.length > 0
        ){

          const lat =
            parseFloat(json[0].lat);

          const lng =
            parseFloat(json[0].lon);

          if(
            isValidLatLng(lat, lng)
          ){
            return { lat, lng };
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

    /* ---- Tombol "Ubah ke Alamat" ---- */

    async function ubahKeAlamat(key, btn){

      const el =
        document.getElementById(
          'f-' + key
        );

      const raw =
        el.value.trim();

      if(!raw){

        showToast(
          '⚠️ Isi lokasi terlebih dahulu.',
          true
        );

        return;

      }

      const originalLabel =
        btn ? btn.textContent : '';

      if(btn){
        btn.disabled = true;
        btn.textContent = 'Memproses...';
      }

      try{

        const coords =
          extractLatLng(raw);

        if(coords){

          const koordStr =
            coords.lat.toFixed(6) +
            ',' +
            coords.lng.toFixed(6);

          el.dataset.koordinat =
            koordStr;

          el.dataset.maps =
            buildMapsUrlFromKoordinat(
              koordStr
            );

          const alamat =
            await reverseGeocode(
              coords.lat,
              coords.lng
            );

          if(alamat){

            el.value =
              alamat;

            showToast(
              'Alamat berhasil dideteksi. Bisa diedit manual jika kurang tepat.'
            );

          } else {

            showToast(
              '⚠️ Lokasi berhasil dibaca, tetapi alamat tidak dapat ditemukan. Koordinat tetap disimpan.',
              true
            );

          }

        } else {

          const geo =
            await geocodeAlamat(raw);

          if(geo){

            const koordStr =
              geo.lat.toFixed(6) +
              ',' +
              geo.lng.toFixed(6);

            el.dataset.koordinat =
              koordStr;

            el.dataset.maps =
              buildMapsUrlFromKoordinat(
                koordStr
              );

            showToast(
              'Koordinat berhasil ditemukan untuk alamat ini.'
            );

          } else {

            el.dataset.maps =
              buildMapsUrlFromAlamat(
                raw
              );

            showToast(
              '⚠️ Koordinat tidak dikenali. Alamat tetap disimpan apa adanya.',
              true
            );

          }

        }

      } catch(err){

        showToast(
          '⚠️ Gagal memproses lokasi. Periksa koneksi internet.',
          true
        );

      } finally{

        if(btn){
          btn.disabled = false;
          btn.textContent = originalLabel;
        }

      }

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

