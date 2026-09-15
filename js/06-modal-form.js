/* ================= MODAL ================= */

    function openModal(){

      activeCategory =
        'pengendalian';

      renderCatTabs();

      renderForm();

      document
        .getElementById(
          'modal-overlay'
        )
        .classList
        .add('open');

    }

    function closeModal(){

      document
        .getElementById(
          'modal-overlay'
        )
        .classList
        .remove('open');

    }

    function renderCatTabs(){

      const el =
        document.getElementById(
          'cat-tabs'
        );

      el.innerHTML =
        CATEGORY_ORDER
          .map(cat=>{

            const cfg =
              CATEGORY_CONFIG[cat];

            const active =
              cat === activeCategory
                ? 'active'
                : '';

            return `
              <button
                type="button"
                class="cat-tab ${active} ${cfg.sektor}"
                onclick="selectCategory('${cat}')"
              >

                ${cfg.icon}

                <span>
                  ${cfg.label}
                </span>

              </button>
            `;

          })
          .join('');

    }

    function selectCategory(cat){

      activeCategory =
        cat;

      renderCatTabs();

      renderForm();

    }


/* ================= FORM ================= */

    function renderForm(){

      const cfg =
        CATEGORY_CONFIG[
          activeCategory
        ];

      const el =
        document.getElementById(
          'form-grid'
        );

      el.innerHTML =
        cfg.fields
          .map(f=>{

            const spanClass =
              f.span2 ||
              f.type === 'textarea' ||
              f.type === 'members' ||
              f.type === 'images' ||
              f.type === 'location'
                ? 'span2'
                : '';

            let input =
              '';

            /* LOCATION */

            if(
              f.type === 'location'
            ){

              input = `
                <div class="location-box">

                  <input
                    type="text"
                    id="f-${f.key}"
                    placeholder="Masukkan alamat / koordinat / Share Location WhatsApp"
                  >

                  <div class="loc-btn-row">

                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      onclick="ubahKeAlamat('${f.key}', this)"
                    >
                      📍 Ubah ke Alamat
                    </button>

                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      onclick="bukaGoogleMaps('${f.key}')"
                    >
                      🗺️ Buka Google Maps
                    </button>

                  </div>

                </div>
              `;

            }

            /* SELECT */

            else if(
              f.type === 'select'
            ){

              input = `
                <select id="f-${f.key}">

                  <option value="">
                    Pilih...
                  </option>

                  ${
                    f.options
                      .map(
                        o => `
                          <option value="${o}">
                            ${o}
                          </option>
                        `
                      )
                      .join('')
                  }

                </select>
              `;

            }

            /* TEXTAREA */

            else if(
              f.type === 'textarea'
            ){

              input = `
                <textarea
                  id="f-${f.key}"
                  rows="3"
                  placeholder="${f.placeholder || ''}"
                ></textarea>
              `;

            }

            /* MEMBER */

            else if(
              f.type === 'members'
            ){

              input = `
                <div class="member-box">

                  <div class="search-box" style="margin-bottom:14px;max-width:560px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            <input type="search" id="member-search-input" placeholder="Cari anggota..." oninput="setMemberSearch(this.value)">
          </div>
          <div class="member-list" id="member-list">

                    ${
                      DAFTAR_ANGGOTA
                        .map(
                          nama => `
                            <label
                              class="member-item"
                              data-nama="${nama.toLowerCase()}"
                            >

                              <input
                                type="checkbox"
                                class="member-checkbox"
                                value="${nama}"
                                onchange="updateMemberCount()"
                              >

                              <span>
                                ${nama}
                              </span>

                            </label>
                          `
                        )
                        .join('')
                    }

                  </div>

                  <div class="member-count">

                    Jumlah anggota dipilih:

                    <span
                      id="member-count"
                    >
                      0
                    </span>

                  </div>

                </div>
              `;

            }

            /* LEADER */

            else if(
              f.type === 'leader'
            ){

              input = `
                <select
                  id="f-${f.key}"
                >

                  <option value="">
                    Pilih Pemimpin Regu...
                  </option>

                </select>
              `;

            }

            /* READONLY */

            else if(
              f.type === 'readonly'
            ){

              input = `
                <input
                  type="number"
                  id="f-${f.key}"
                  value="0"
                  readonly
                >
              `;

            }

            /* IMAGES */

            else if(
              f.type === 'images'
            ){

              input = `
                <input
                  type="file"
                  id="f-${f.key}"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onchange="previewImages(this)"
                >

                <div
                  class="image-preview"
                ></div>

                <small
                  style="
                    color:var(--ink-faint);
                    font-size:11px;
                    display:block;
                    margin-top:8px;
                  "
                >

                  Maksimal 3 gambar.

                </small>
              `;

            }

            /* NORMAL INPUT */

            else{

              input = `
                <input
                  type="${f.type}"
                  id="f-${f.key}"
                  placeholder="${f.placeholder || ''}"
                >
              `;

            }

            return `
              <div
                class="field ${spanClass}"
              >

                <label>

                  ${f.label}

                  ${
                    f.required
                      ? `
                        <span class="req">
                          *
                        </span>
                      `
                      : ''
                  }

                </label>

                ${input}

              </div>
            `;

          })
          .join('');

    }

