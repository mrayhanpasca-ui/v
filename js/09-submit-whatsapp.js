/* ================= SUBMIT ================= */

    async function submitReport(){

      const cfg =
        CATEGORY_CONFIG[
          activeCategory
        ];

      const data =
        {};
      const pendingImageFiles = {};

      for(
        const f of cfg.fields
      ){

        /* MEMBER */

        if(
          f.type === 'members'
        ){

          const selected =
            Array.from(
              document.querySelectorAll(
                '.member-checkbox:checked'
              )
            )
            .map(
              el =>
                el.value
            );

          if(
            f.required &&
            selected.length === 0
          ){

            showToast(
              'Pilih minimal satu anggota regu',
              true
            );

            return;

          }

          data[f.key] =
            selected;

          continue;

        }

        /* LOCATION */

        if(
          f.type === 'location'
        ){

          const alamatEl =
            document.getElementById(
              'f-' + f.key
            );

          const val =
            alamatEl.value.trim();

          if(
            f.required &&
            !val
          ){

            alamatEl.focus();

            alamatEl.style.borderColor =
              'var(--damkar)';

            showToast(
              'Lengkapi field wajib: ' +
              f.label,
              true
            );

            return;

          }

          data[f.key] =
            val;

          let koordinat =
            alamatEl.dataset.koordinat ||
            '';

          let mapsUrl =
            alamatEl.dataset.maps ||
            '';

          /* Jaga-jaga: kalau admin belum sempat klik
             tombol Ubah ke Alamat / Buka Google Maps,
             tetap coba deteksi koordinat dari teks
             yang ada supaya link Google Maps di laporan
             selalu bisa dibuka. */

          if(
            !koordinat &&
            val
          ){

            const coords =
              extractLatLng(val);

            if(coords){

              koordinat =
                coords.lat.toFixed(6) +
                ',' +
                coords.lng.toFixed(6);

            }

          }

          if(!mapsUrl){

            if(koordinat){

              mapsUrl =
                buildMapsUrlFromKoordinat(
                  koordinat
                );

            } else if(val){

              mapsUrl =
                buildMapsUrlFromAlamat(
                  val
                );

            }

          }

          if(koordinat){

            data[f.key + 'Koordinat'] =
              koordinat;

          }

          if(mapsUrl){

            data[f.key + 'GoogleMaps'] =
              mapsUrl;

          }

          continue;

        }

        /* IMAGE */

        if(
          f.type === 'images'
        ){

          const input =
            document.getElementById(
              'f-' + f.key
            );

          const files =
            Array.from(
              input.files
            );

          if(
            files.length > 3
          ){

            showToast(
              'Dokumentasi maksimal 3 gambar',
              true
            );

            return;

          }

          data[f.key] =
            [];
          pendingImageFiles[f.key] = files;

          continue;

        }

        /* NORMAL */

        const elm =
          document.getElementById(
            'f-' + f.key
          );

        const val =
          elm.value.trim();

        if(
          f.required &&
          !val
        ){

          elm.focus();

          elm.style.borderColor =
            'var(--damkar)';

          showToast(
            'Lengkapi field wajib: ' +
            f.label,
            true
          );

          return;

        }

        data[f.key] =
          val;

      }

      if(
        data.anggota
      ){

        data.jumlahPersonel =
          data.anggota.length;

      }

      data.status =
        'Belum Selesai';

      const report = {

        id:
          'r_' +
          Date.now() +
          '_' +
          Math.random()
            .toString(36)
            .slice(2,7),

        kategori:
          activeCategory,

        data,

        createdAt:
          Date.now(),

        createdBy:
          adminName

      };

      for (const key of Object.keys(pendingImageFiles)) {
        const uploadedFiles = Array.isArray(pendingImageFiles[key]) ? pendingImageFiles[key] : [];

        if (uploadedFiles.length === 0) {
          data[key] = [];
          continue;
        }

        try {
          const uploadResult = await uploadReportImages(report.id, uploadedFiles);
          data[key] = Array.isArray(uploadResult && uploadResult.urls) ? uploadResult.urls : [];

          if (uploadResult && uploadResult.failed > 0) {
            showToast(`Beberapa foto gagal diupload (${uploadResult.failed}).`, false);
          }
        }
        catch (error) {
          showToast(error.message || 'Upload foto laporan gagal.', true);
          return;
        }
      }

      report.data = data;

      reports.push(
        report
      );

      await saveReports();

      renderStats();

      renderList();

      closeModal();

      showToast(
        'Laporan berhasil disimpan'
      );

    }


/* ================= WHATSAPP ================= */

    function formatWhatsAppNumber(
      number
    ){

      let n =
        String(number)
          .replace(/\D/g,'');

      if(
        n.startsWith('0')
      ){

        n =
          '62' +
          n.substring(1);

      }

      return n;

    }

