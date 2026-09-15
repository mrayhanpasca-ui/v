window.selectedReportImages = window.selectedReportImages || {};

/* ================= MEMBER SEARCH / COUNT ================= */

    function setMemberSearch(value){

      const q =
        value.trim().toLowerCase();

      document
        .querySelectorAll(
          '#member-list .member-item'
        )
        .forEach(item=>{

          const nama =
            item.dataset.nama ||
            item.textContent
              .trim()
              .toLowerCase();

          item.style.display =
            nama.includes(q)
              ? 'flex'
              : 'none';

        });

    }

    function updateMemberCount(){

      const checked =
        Array.from(
          document.querySelectorAll(
            '.member-checkbox:checked'
          )
        );

      const count =
        checked.length;

      const countLabel =
        document.getElementById(
          'member-count'
        );

      const jumlahInput =
        document.getElementById(
          'f-jumlahPersonel'
        );

      const leaderSelect =
        document.getElementById(
          'f-pemimpinRegu'
        );

      if(countLabel){

        countLabel.textContent =
          count;

      }

      if(jumlahInput){

        jumlahInput.value =
          count;

      }

      if(leaderSelect){

        const previousValue =
          leaderSelect.value;

        leaderSelect.innerHTML = `
          <option value="">
            Pilih Pemimpin Regu...
          </option>

          ${
            checked
              .map(
                el => `
                  <option
                    value="${el.value}"
                  >
                    ${el.value}
                  </option>
                `
              )
              .join('')
          }
        `;

        if(
          checked.some(
            el =>
              el.value === previousValue
          )
        ){

          leaderSelect.value =
            previousValue;

        }

      }

    }


/* ================= IMAGE PREVIEW ================= */

    function formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 KB';
      const units = ['B', 'KB', 'MB'];
      const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
      const size = bytes / (1024 ** index);
      return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
    }

    function previewImages(input){

      if(!input){
        return;
      }

      const preview =
        input.parentElement
          ? input.parentElement.querySelector('.image-preview')
          : null;

      if(!preview){
        console.error(
          'Preview container tidak ditemukan untuk input:',
          input.id || input.name || 'unknown'
        );
        return;
      }

      const files = Array.from(input.files || []);
      if (input && input.id) {
        window.selectedReportImages[input.id] = files;
      }

      preview.innerHTML =
        '';

      if(files.length > 3){

        showToast(
          'Maksimal hanya 3 gambar untuk satu laporan.',
          true
        );

        input.value =
          '';
        if (input && input.id) {
          window.selectedReportImages[input.id] = [];
        }
        return;

      }

      const validFiles =
        files.filter(file =>
          file && file.type && file.type.startsWith('image/')
        );

      if(validFiles.length === 0){
        preview.innerHTML = `
          <div class="image-empty-state">
            <span>Belum ada foto yang dipilih</span>
          </div>
        `;
        return;
      }

      validFiles.forEach((file, index) => {

        const reader =
          new FileReader();

        reader.onload =
          function(e){

            const item =
              document.createElement('div');

            item.className =
              'image-thumb';

            const img =
              document.createElement('img');

            img.src =
              e.target.result;
            img.alt =
              `Foto ${index + 1}`;
            img.loading =
              'lazy';
            img.onerror =
              function(){
                this.style.display = 'none';

                const fallback =
                  document.createElement('div');

                fallback.className =
                  'image-thumb-fallback';
                fallback.innerHTML = `
                  <span>🖼️</span>
                  <small>Gambar tidak dapat dimuat</small>
                `;

                item.appendChild(fallback);
              };

            const meta = document.createElement('div');
            meta.className = 'image-thumb-meta';

            const label = document.createElement('span');
            label.textContent = `Foto ${index + 1}`;

            const size = document.createElement('small');
            size.textContent = formatFileSize(file.size);

            meta.appendChild(label);
            meta.appendChild(size);

            item.appendChild(img);
            item.appendChild(meta);
            preview.appendChild(item);

          };

        reader.readAsDataURL(file);

      });

    }


/* ================= IMAGE VALIDATION / BASE64 ================= */

    function validateImageFiles(files){

      const list =
        Array.from(files || []);

      if(list.length === 0){
        return [];
      }

      if(list.length > 3){
        throw new Error('Maksimal hanya 3 gambar dalam satu laporan.');
      }

      const invalid =
        list.filter(file =>
          !(file && file.type && file.type.startsWith('image/'))
        );

      if(invalid.length > 0){
        throw new Error('File yang dipilih harus berupa foto. Format JPG, PNG, atau WebP saja.');
      }

      const tooLarge =
        list.filter(file => (file.size || 0) > 2 * 1024 * 1024);

      if(tooLarge.length > 0){
        throw new Error('Ukuran foto terlalu besar. Maksimal 2 MB per foto.');
      }

      return list;

    }

    function convertImageToBase64(file){

      return new Promise(
        (resolve,reject)=>{

          const reader =
            new FileReader();

          reader.onload =
            () =>
              resolve(
                reader.result
              );

          reader.onerror =
            () =>
              reject(
                new Error('Gagal membaca file gambar.')
              );

          reader.readAsDataURL(
            file
          );

        }
      );

    }

