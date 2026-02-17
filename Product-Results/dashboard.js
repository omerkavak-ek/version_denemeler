(() => {
  const body = document.body;
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const navbarToggle = document.getElementById('navbarToggle');
  const fullscreenBtn = document.querySelector('.fullscreen-btn');
  const theme = document.querySelector('.theme-toggle');
  const themeLightBtn = theme ? theme.querySelector('button:first-child') : null;
  const themeDarkBtn = theme ? theme.querySelector('button:last-child') : null;

  function setSidebar(expanded) {
    body.classList.toggle('sidebar-expanded', expanded);
    body.classList.toggle('sidebar-mini', !expanded);
  }

  function closeOtherSubmenus(activeParentId) {
    document.querySelectorAll('.nav-item-parent.expanded').forEach(parent => {
      if (activeParentId && parent.id === activeParentId) return;
      parent.classList.remove('expanded');
    });
    document.querySelectorAll('.nav-submenu.show').forEach(menu => {
      if (activeParentId && menu.getAttribute('data-parent') === activeParentId) return;
      menu.classList.remove('show');
    });
  }

  function bindSidebarSubmenus() {
    const parents = Array.from(document.querySelectorAll('.nav-item-parent'));
    if (!parents.length) return;

    parents.forEach(parent => {
      parent.addEventListener('click', function (e) {
        e.preventDefault();

        const id = parent.id;
        if (!id) return;

        const submenu = document.querySelector(`.nav-submenu[data-parent="${CSS.escape(id)}"]`);
        if (!submenu) return;

        const willOpen = !submenu.classList.contains('show');

        closeOtherSubmenus(willOpen ? id : null);

        submenu.classList.toggle('show', willOpen);
        parent.classList.toggle('expanded', willOpen);
      });
    });
  }

  // default expanded
  setSidebar(true);

  bindSidebarSubmenus();

  // sidebar hamburger collapses to mini
  sidebarToggle && sidebarToggle.addEventListener('click', () => {
    const isExpanded = body.classList.contains('sidebar-expanded');
    setSidebar(!isExpanded);
  });
  // navbar hamburger expands to full
  navbarToggle && navbarToggle.addEventListener('click', () => setSidebar(true));

  fullscreenBtn && fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // Theme Management
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  if (savedTheme === 'dark' || (!savedTheme && systemTheme === 'dark')) {
    body.classList.add('dark');
  }

  themeLightBtn && themeLightBtn.addEventListener('click', () => {
    body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });

  themeDarkBtn && themeDarkBtn.addEventListener('click', () => {
    body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  });

  // Custom Multiselect
  const multiselect = document.querySelector('.custom-multiselect');
  if (multiselect) {
    const display = multiselect.querySelector('.multiselect-display');
    const dropdown = multiselect.querySelector('.multiselect-dropdown');
    const selectedItemsContainer = multiselect.querySelector('.selected-items');
    const searchInput = multiselect.querySelector('.multiselect-search-input');
    const options = multiselect.querySelectorAll('.multiselect-option');
    const checkboxes = multiselect.querySelectorAll('.multiselect-option input[type="checkbox"]');

    let selectedValues = [];

    // Toggle dropdown
    display.addEventListener('click', (e) => {
      if (e.target.closest('.selected-item i')) return;
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!multiselect.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Search functionality
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      options.forEach(option => {
        const text = option.querySelector('span').textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? 'flex' : 'none';
      });
    });

    // Handle checkbox changes
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        updateSelectedItems();
      });
    });

    function updateSelectedItems() {
      selectedValues = [];
      selectedItemsContainer.innerHTML = '';

      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedValues.push(checkbox.value);
        }
      });

      if (selectedValues.length === 0) {
        selectedItemsContainer.innerHTML = '<span style="color: var(--brand-passive-border); font-size: 14px;">Seçiniz...</span>';
      } else {
        selectedValues.forEach((value, index) => {
          const item = document.createElement('span');
          item.className = 'selected-item';
          item.innerHTML = `
            ${value}
            <i class="fa-solid fa-xmark"></i>
          `;

          // Add remove functionality
          item.querySelector('i').addEventListener('click', (e) => {
            e.stopPropagation();
            const checkbox = Array.from(checkboxes).find(cb => cb.value === value);
            if (checkbox) {
              checkbox.checked = false;
              updateSelectedItems();
            }
          });

          selectedItemsContainer.appendChild(item);

          // Add comma separator except for last item
          if (index < selectedValues.length - 1) {
            const comma = document.createElement('span');
            comma.textContent = ',';
            comma.style.color = 'var(--brand-secondary-text)';
            comma.style.marginRight = '2px';
            selectedItemsContainer.appendChild(comma);
          }
        });
      }
    }

    // Initialize
    updateSelectedItems();
  }

  // Dropdown Butonlar
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  const portalMenuMap = new Map();
  const columnFilterPortalMap = new Map();
  const tableOriginalRowsMap = new WeakMap();
  const tableColumnFiltersMap = new WeakMap();

  function ensureOriginalTableRows(table) {
    if (!table) return;
    if (tableOriginalRowsMap.has(table)) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    tableOriginalRowsMap.set(table, Array.from(tbody.querySelectorAll('tr')));
  }

  function getCellText(row, columnIndex) {
    if (!row) return '';
    const cells = row.querySelectorAll('th, td');
    const cell = cells[columnIndex];
    return cell ? (cell.textContent || '').trim() : '';
  }

  function sortTableByColumn(table, columnIndex, direction) {
    const tbody = table ? table.querySelector('tbody') : null;
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const dir = direction === 'desc' ? -1 : 1;

    rows.sort((a, b) => {
      const aText = getCellText(a, columnIndex);
      const bText = getCellText(b, columnIndex);

      const aNum = Number(String(aText).replace(/\./g, '').replace(',', '.'));
      const bNum = Number(String(bText).replace(/\./g, '').replace(',', '.'));
      const aIsNum = !Number.isNaN(aNum) && /\d/.test(String(aText));
      const bIsNum = !Number.isNaN(bNum) && /\d/.test(String(bText));

      if (aIsNum && bIsNum) return (aNum - bNum) * dir;
      return aText.localeCompare(bText, 'tr-TR', { numeric: true, sensitivity: 'base' }) * dir;
    });

    rows.forEach(r => tbody.appendChild(r));
  }

  function clearTableSort(table) {
    const tbody = table ? table.querySelector('tbody') : null;
    if (!tbody) return;
    ensureOriginalTableRows(table);
    const originalRows = tableOriginalRowsMap.get(table);
    if (!originalRows) return;
    originalRows.forEach(r => tbody.appendChild(r));
  }

  function positionPortalMenu(toggleEl, menuEl) {
    if (!toggleEl || !menuEl) return;

    const rect = toggleEl.getBoundingClientRect();
    const margin = 4;

    // B tipi genişlik: en az toggle kadar, içerik uzunsa büyüsün
    menuEl.style.width = 'max-content';
    menuEl.style.minWidth = `${rect.width}px`;

    // Ensure it has measurable size
    menuEl.style.visibility = 'hidden';
    menuEl.style.top = '0px';
    menuEl.style.left = '0px';

    const menuWidth = menuEl.offsetWidth || 160;

    let left = rect.right - menuWidth;
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - menuWidth - 8);
    left = Math.min(Math.max(left, minLeft), maxLeft);

    let top = rect.bottom + margin;
    const maxTop = window.innerHeight - 8;
    if (top > maxTop) top = maxTop;

    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
    menuEl.style.visibility = '';
  }

  function portalMenu(dropdownEl, toggleEl, menuEl) {
    if (!dropdownEl || !toggleEl || !menuEl) return;
    if (portalMenuMap.has(menuEl)) return;

    portalMenuMap.set(menuEl, {
      dropdownEl,
      nextSibling: menuEl.nextSibling
    });

    menuEl.classList.add('dropdown-menu-portal');
    document.body.appendChild(menuEl);
    positionPortalMenu(toggleEl, menuEl);
  }

  function unportalMenu(menuEl) {
    const data = portalMenuMap.get(menuEl);
    if (!data) return;

    menuEl.classList.remove('dropdown-menu-portal');
    menuEl.style.top = '';
    menuEl.style.left = '';
    menuEl.style.minWidth = '';
    menuEl.style.width = '';

    if (data.nextSibling) {
      data.dropdownEl.insertBefore(menuEl, data.nextSibling);
    } else {
      data.dropdownEl.appendChild(menuEl);
    }

    portalMenuMap.delete(menuEl);
  }

  function closeMenu(menuEl) {
    if (!menuEl) return;
    menuEl.classList.remove('show');

    const mapped = portalMenuMap.get(menuEl);
    const toggle = mapped
      ? mapped.dropdownEl.querySelector('.dropdown-toggle')
      : menuEl.closest('.dropdown')?.querySelector('.dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');

    if (mapped) {
      unportalMenu(menuEl);
    }
  }

  function closeAllDropdowns(exceptMenu) {
    document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
      if (exceptMenu && openMenu === exceptMenu) return;
      closeMenu(openMenu);
    });
  }

  function positionColumnFilterPortal(anchorEl, dropdownEl) {
    if (!anchorEl || !dropdownEl) return;

    const rect = anchorEl.getBoundingClientRect();
    const margin = 4;

    // B tipi genişlik: en az anchor kadar, içerik uzunsa büyüsün
    dropdownEl.style.width = 'max-content';
    dropdownEl.style.minWidth = `${rect.width}px`;

    dropdownEl.style.visibility = 'hidden';
    dropdownEl.style.top = '0px';
    dropdownEl.style.left = '0px';

    const menuWidth = dropdownEl.offsetWidth || 200;

    let left = rect.left;
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - menuWidth - 8);
    left = Math.min(Math.max(left, minLeft), maxLeft);

    let top = rect.bottom + margin;
    const maxTop = window.innerHeight - 8;
    if (top > maxTop) top = maxTop;

    dropdownEl.style.left = `${left}px`;
    dropdownEl.style.top = `${top}px`;
    dropdownEl.style.visibility = '';
  }

  function portalColumnFilterDropdown(anchorEl, dropdownEl) {
    if (!anchorEl || !dropdownEl) return;

    if (columnFilterPortalMap.has(dropdownEl)) {
      positionColumnFilterPortal(anchorEl, dropdownEl);
      return;
    }

    columnFilterPortalMap.set(dropdownEl, {
      anchorEl,
      parentEl: dropdownEl.parentElement,
      nextSibling: dropdownEl.nextSibling
    });

    dropdownEl.classList.add('column-filter-dropdown-portal');
    document.body.appendChild(dropdownEl);
    positionColumnFilterPortal(anchorEl, dropdownEl);
  }

  function unportalColumnFilterDropdown(dropdownEl) {
    const data = columnFilterPortalMap.get(dropdownEl);
    if (!data) return;

    dropdownEl.classList.remove('column-filter-dropdown-portal');
    dropdownEl.style.top = '';
    dropdownEl.style.left = '';
    dropdownEl.style.minWidth = '';
    dropdownEl.style.width = '';

    if (data.nextSibling) {
      data.parentEl.insertBefore(dropdownEl, data.nextSibling);
    } else {
      data.parentEl.appendChild(dropdownEl);
    }

    columnFilterPortalMap.delete(dropdownEl);
  }

  function closeAllColumnFilters(exceptDropdownEl) {
    document.querySelectorAll('.column-filter-dropdown.show').forEach(openDropdown => {
      if (exceptDropdownEl && openDropdown === exceptDropdownEl) return;
      openDropdown.classList.remove('show');
      openDropdown.parentElement.classList.remove('filter-active');
      unportalColumnFilterDropdown(openDropdown);
    });
  }

  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = this.closest('.dropdown');
      if (!dropdown) return;

      const menu = dropdown.querySelector('.dropdown-menu');
      if (!menu) return;

      if (this.classList.contains('table-settings-btn') && menu.classList.contains('dropdown-menu-columns')) {
        const table = getTableForColumnsMenu(menu);
        if (table) {
          buildColumnsMenuForTable(table);
        }
      }

      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Diğer tüm açık dropdown'ları kapat
      closeAllDropdowns(menu);

      // Bu dropdown'ı aç/kapat
      if (isExpanded) {
        closeMenu(menu);
      } else {
        menu.classList.add('show');
        this.setAttribute('aria-expanded', 'true');

        if (isPortalDropdown(dropdown)) {
          portalMenu(dropdown, this, menu);
          requestAnimationFrame(() => positionPortalMenu(this, menu));
        }
      }
    });
  });

  // Dropdown dışına tıklandığında kapat
  document.addEventListener('click', function (e) {
    if (e.target.closest('.dropdown')) return;
    if (e.target.closest('.dropdown-menu')) return;
    closeAllDropdowns();
  });

  document.addEventListener('click', function (e) {
    const item = e.target.closest('.dropdown-menu .dropdown-item');
    if (!item) return;

    e.preventDefault();

    const menu = item.closest('.dropdown-menu');
    if (!menu) return;

    const mapped = portalMenuMap.get(menu);
    const dropdown = mapped ? mapped.dropdownEl : item.closest('.dropdown');
    if (!dropdown) return;

    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (!toggle) return;

    const value = (item.textContent || '').trim();
    if (!value) return;

    const toggleHasVisibleText = Array.from(toggle.childNodes).some(node => {
      return node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim().length > 0;
    }) || !!toggle.querySelector('span');

    if (toggleHasVisibleText) {
      const icons = Array.from(toggle.querySelectorAll('i'));
      const iconsHtml = icons.map(i => i.outerHTML).join(' ');
      toggle.innerHTML = `${value}${iconsHtml ? ' ' + iconsHtml : ''}`.trim();
    }

    const menuToClose = dropdown.querySelector('.dropdown-menu');
    if (menuToClose) closeMenu(menuToClose);
  });

  function updateOpenPortalMenus() {
    portalMenuMap.forEach((data, menuEl) => {
      const toggleEl = data.dropdownEl.querySelector('.dropdown-toggle');
      if (!toggleEl) return;
      if (!menuEl.classList.contains('show')) return;
      positionPortalMenu(toggleEl, menuEl);
    });
  }

  function updateOpenColumnFilterPortals() {
    columnFilterPortalMap.forEach((data, dropdownEl) => {
      if (!dropdownEl.classList.contains('show')) return;
      positionColumnFilterPortal(data.anchorEl, dropdownEl);
    });
  }

  window.addEventListener('resize', function () {
    updateOpenPortalMenus();
    updateOpenColumnFilterPortals();
  });
  window.addEventListener('scroll', function () {
    updateOpenPortalMenus();
    updateOpenColumnFilterPortals();
  }, true);

  // ==============================
  // TABLO - KOLON GÖRÜNÜRLÜĞÜ (CHECKBOX)
  // ==============================
  function isColumnsSettingsMenu(menuEl) {
    if (!menuEl) return false;
    const dropdown = menuEl.closest('.dropdown');
    if (!dropdown) return false;
    return !!dropdown.querySelector('.table-settings-btn');
  }

  function getTableForColumnsMenu(menuEl) {
    const card = menuEl.closest('.card');
    if (!card) return null;
    return card.querySelector('table.table');
  }

  function getHeaderKey(th, index) {
    if (!th) return null;
    if (th.dataset && th.dataset.colKey) return th.dataset.colKey;

    const getHeaderPlainText = function (headerEl) {
      const clone = headerEl.cloneNode(true);
      clone.querySelectorAll('input, .column-filter-dropdown').forEach(el => el.remove());
      return (clone.textContent || '').trim();
    };

    const role = th.getAttribute('data-role');
    if (role) {
      th.dataset.colKey = `role:${role}`;
      return th.dataset.colKey;
    }

    const text = getHeaderPlainText(th);
    const key = text ? `text:${text}` : `idx:${index}`;
    th.dataset.colKey = key;
    return key;
  }

  function getHeaderIndexByKey(table, key) {
    const headers = Array.from(table.querySelectorAll('thead th'));
    const idx = headers.findIndex(th => (th.dataset && th.dataset.colKey) === key);
    return idx;
  }

  function setColumnVisibilityByKey(table, key, isVisible) {
    const columnIndex = getHeaderIndexByKey(table, key);
    if (columnIndex < 0) return;

    const headers = table.querySelectorAll('thead th');
    if (headers[columnIndex]) {
      headers[columnIndex].style.display = isVisible ? '' : 'none';
    }

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      if (cells[columnIndex]) {
        cells[columnIndex].style.display = isVisible ? '' : 'none';
      }
    });
  }

  function buildColumnsMenuForTable(table) {
    const card = table.closest('.card');
    if (!card) return;

    const menu = card.querySelector('.dropdown-menu-columns');
    if (!menu) return;

    menu.innerHTML = '';

    const getHeaderPlainText = function (headerEl) {
      const clone = headerEl.cloneNode(true);
      clone.querySelectorAll('input, .column-filter-dropdown').forEach(el => el.remove());
      return (clone.textContent || '').trim();
    };

    const headers = Array.from(table.querySelectorAll('thead th'));
    headers.forEach((th, index) => {
      const key = getHeaderKey(th, index);
      const role = th.getAttribute('data-role');
      const baseText = getHeaderPlainText(th);
      const labelText = baseText || (role === 'select' ? 'Seçim' : role === 'actions' ? 'Eylemler' : `Kolon ${index + 1}`);
      const isSpecial = role === 'select' || role === 'actions';
      const isVisible = th.style.display !== 'none';

      const li = document.createElement('li');
      li.className = 'dropdown-item-checkbox';

      const wrapper = document.createElement('div');
      wrapper.className = 'form-check';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'form-check-input';
      input.checked = isSpecial ? true : isVisible;
      input.disabled = isSpecial;
      input.setAttribute('data-colkey', key);

      const label = document.createElement('label');
      label.className = 'form-check-label';
      label.textContent = labelText;

      const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, '_');
      input.id = `colvis_${safeKey}`;
      label.htmlFor = input.id;

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      li.appendChild(wrapper);
      menu.appendChild(li);
    });
  }

  document.addEventListener('change', function (e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== 'checkbox') return;
    if (!target.closest('.dropdown-menu-columns')) return;
    if (!target.closest('.dropdown-item-checkbox')) return;

    e.stopPropagation();

    const menu = target.closest('.dropdown-menu-columns');
    if (!menu) return;
    if (!isColumnsSettingsMenu(menu)) return;

    const table = getTableForColumnsMenu(menu);
    if (!table) return;

    const key = target.getAttribute('data-colkey');
    if (!key) return;

    if (target.disabled) {
      target.checked = true;
      return;
    }

    setColumnVisibilityByKey(table, key, target.checked);
  });

  document.addEventListener('click', function (e) {
    const label = e.target.closest('.dropdown-item-checkbox .form-check-label');
    if (!label) return;
    const menu = label.closest('.dropdown-menu-columns');
    if (!menu) return;
    if (!isColumnsSettingsMenu(menu)) return;
    e.stopPropagation();
  });

  // ==============================
  // TABLO - SÜRÜKLE/BIRAK, YENİDEN BOYUTLANDIRMA, KOLON FİLTRE MENÜSÜ
  // ==============================
  const tables = Array.from(document.querySelectorAll('.table'));
  tables.forEach(table => {
    ensureOriginalTableRows(table);
    let draggedColumn = null;
    let draggedColumnIndex = -1;

    let currentResizingColumn = null;
    let resizeStartX = 0;
    let resizeStartWidth = 0;

    const handleMouseMove = function (e) {
      if (currentResizingColumn) {
        const diff = e.clientX - resizeStartX;
        const newWidth = Math.max(50, resizeStartWidth + diff);
        currentResizingColumn.style.width = newWidth + 'px';
        currentResizingColumn.style.minWidth = newWidth + 'px';
      }
    };

    const handleMouseUp = function () {
      if (currentResizingColumn) {
        currentResizingColumn = null;
        document.body.style.cursor = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    function getCurrentIndex(th) {
      const headers = Array.from(table.querySelectorAll('thead th'));
      return headers.indexOf(th);
    }

    function isSpecialColumnByIndex(index) {
      const headers = Array.from(table.querySelectorAll('thead th'));
      const th = headers[index];
      if (!th) return false;
      const role = th.getAttribute('data-role');
      return role === 'select' || role === 'actions';
    }

    function pinSpecialColumns() {
      const headers = Array.from(table.querySelectorAll('thead th'));
      const selectIndex = headers.findIndex(th => th.getAttribute('data-role') === 'select');
      const actionsIndex = headers.findIndex(th => th.getAttribute('data-role') === 'actions');

      if (selectIndex > 0) {
        swapColumns(table, selectIndex, 0, true);
      }

      const headersAfterSelect = Array.from(table.querySelectorAll('thead th'));
      const actionsIndexAfterSelect = headersAfterSelect.findIndex(th => th.getAttribute('data-role') === 'actions');
      if (actionsIndexAfterSelect >= 0 && actionsIndexAfterSelect !== headersAfterSelect.length - 1) {
        swapColumns(table, actionsIndexAfterSelect, headersAfterSelect.length - 1, true);
      }
    }

    function ensureColumnKeys() {
      const headers = Array.from(table.querySelectorAll('thead th'));
      headers.forEach((th, idx) => {
        getHeaderKey(th, idx);
      });
    }

    function isNearResizeHandle(clientX, rect) {
      return clientX > rect.right - 20;
    }

    function isOnFilterIcon(clientX, rect) {
      return clientX >= rect.right - 44 && clientX <= rect.right - 20;
    }

    function initializeResizeAndFilter() {
      const headers = table.querySelectorAll('thead th');

      headers.forEach((th, index) => {
        const role = th.getAttribute('data-role');
        const isSpecialColumn = role === 'select' || role === 'actions';
        if (isSpecialColumn) return;

        const existingDropdown = th.querySelector('.column-filter-dropdown');
        if (existingDropdown) {
          existingDropdown.remove();
        }

        const filterDropdown = document.createElement('div');
        filterDropdown.className = 'column-filter-dropdown';
        filterDropdown.innerHTML = `
          <div class="column-filter-search">
            <i class="fa-solid fa-search"></i>
            <input type="text" placeholder="Ara..." class="column-filter-search-input">
          </div>
          <div class="column-filter-divider"></div>
          <div class="column-filter-item" data-action="hide-column">
            <i class="fa-regular fa-eye-slash"></i>
            <span>Sütunu gizle</span>
          </div>
          <div class="column-filter-divider"></div>
          <div class="column-filter-item" data-action="sort-asc">
            <i class="fa-solid fa-arrow-up-wide-short"></i>
            <span>Artan sıralama</span>
          </div>
          <div class="column-filter-item" data-action="sort-desc">
            <i class="fa-solid fa-arrow-down-short-wide"></i>
            <span>Azalan sıralama</span>
          </div>
          <div class="column-filter-item" data-action="clear-sort">
            <i class="fa-solid fa-xmark"></i>
            <span>Sıralamayı temizle</span>
          </div>
          <div class="column-filter-divider"></div>
          <div class="column-filter-item" data-action="auto-width">
            <i class="fa-solid fa-arrows-left-right"></i>
            <span>Büyüklüğünü Otomatik Ayarla</span>
          </div>
          <div class="column-filter-divider"></div>
          <div class="column-filter-item" data-action="align-left">
            <i class="fa-solid fa-align-left"></i>
            <span>Satırları Sola Hizala</span>
          </div>
          <div class="column-filter-item" data-action="align-center">
            <i class="fa-solid fa-align-center"></i>
            <span>Satırları Ortala</span>
          </div>
          <div class="column-filter-item" data-action="align-right">
            <i class="fa-solid fa-align-right"></i>
            <span>Satırları Sağa Hizala</span>
          </div>
        `;

        th.style.position = 'relative';
        th.appendChild(filterDropdown);

        const searchInput = filterDropdown.querySelector('.column-filter-search-input');
        const searchContainer = filterDropdown.querySelector('.column-filter-search');

        if (searchInput) {
          searchInput.addEventListener('click', function (e) {
            e.stopPropagation();
          });
        }

        if (searchContainer) {
          searchContainer.addEventListener('click', function (e) {
            e.stopPropagation();
          });
        }

        filterDropdown.querySelectorAll('.column-filter-item').forEach(item => {
          item.addEventListener('click', function (e) {
            e.stopPropagation();
            const action = this.getAttribute('data-action');

            switch (action) {
              case 'hide-column': {
                const key = getHeaderKey(th, index);
                if (key) {
                  setColumnVisibilityByKey(table, key, false);
                }
                const openColumnsMenu = table.closest('.card')?.querySelector('.dropdown-menu-columns');
                if (openColumnsMenu) {
                  buildColumnsMenuForTable(table);
                }
                break;
              }
              case 'sort-asc':
                ensureOriginalTableRows(table);
                sortTableByColumn(table, index, 'asc');
                break;
              case 'sort-desc':
                ensureOriginalTableRows(table);
                sortTableByColumn(table, index, 'desc');
                break;
              case 'clear-sort':
                ensureOriginalTableRows(table);
                clearTableSort(table);
                break;
              case 'auto-width':
                autoFitColumnWidth(table, index);
                break;
              case 'align-left':
                alignColumn(table, index, 'left');
                break;
              case 'align-center':
                alignColumn(table, index, 'center');
                break;
              case 'align-right':
                alignColumn(table, index, 'right');
                break;
              default:
                break;
            }

            filterDropdown.classList.remove('show');
            th.classList.remove('filter-active');
            unportalColumnFilterDropdown(filterDropdown);
          });
        });
      });
    }

    function initializeDragAndDrop() {
      const headers = table.querySelectorAll('thead th');

      headers.forEach(th => {
        if (th && th.dataset) {
          delete th.dataset.dndInitialized;
        }
      });

      headers.forEach((th) => {
        const role = th.getAttribute('data-role');
        const isSpecialColumn = role === 'select' || role === 'actions';
        if (isSpecialColumn) {
          th.removeAttribute('draggable');
          return;
        }

        th.setAttribute('draggable', 'true');
        th.style.cursor = 'grab';

        th.addEventListener('dragstart', function (e) {
          const rect = th.getBoundingClientRect();
          const isNearRightEdge = isNearResizeHandle(e.clientX, rect);
          const isFilterIconArea = isOnFilterIcon(e.clientX, rect);
          if (isNearRightEdge || isFilterIconArea) {
            e.preventDefault();
            return;
          }

          draggedColumn = th;
          draggedColumnIndex = getCurrentIndex(th);
          th.classList.add('dragging');
          document.body.style.cursor = 'grabbing';
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/html', th.innerHTML);
        });

        th.addEventListener('dragover', function (e) {
          if (e.preventDefault) {
            e.preventDefault();
          }

          e.dataTransfer.dropEffect = 'move';
          if (draggedColumn && draggedColumn !== th) {
            th.classList.add('drag-over');
          }
          return false;
        });

        th.addEventListener('dragleave', function () {
          th.classList.remove('drag-over');
        });

        th.addEventListener('drop', function (e) {
          if (e.stopPropagation) {
            e.stopPropagation();
          }

          th.classList.remove('drag-over');

          if (draggedColumn && draggedColumn !== th) {
            const targetIndex = getCurrentIndex(th);
            swapColumns(table, draggedColumnIndex, targetIndex);

            pinSpecialColumns();
            ensureColumnKeys();
            buildColumnsMenuForTable(table);

            initializeDragAndDrop();
            initializeResizeAndFilter();
            initializeColumnInteractions();
          }
          return false;
        });

        th.addEventListener('dragend', function () {
          th.classList.remove('dragging');
          table.querySelectorAll('th.drag-over').forEach(header => header.classList.remove('drag-over'));
          draggedColumn = null;
          draggedColumnIndex = -1;
          document.body.style.cursor = '';
        });

        th.dataset.dndInitialized = '1';
      });
    }

    function initializeColumnInteractions() {
      const headers = table.querySelectorAll('thead th');

      headers.forEach(th => {
        if (th && th.dataset) {
          delete th.dataset.interactionsInitialized;
        }
      });

      headers.forEach((th) => {
        const role = th.getAttribute('data-role');
        const isSpecialColumn = role === 'select' || role === 'actions';
        if (isSpecialColumn) return;

        const filterDropdown = th.querySelector('.column-filter-dropdown');
        if (!filterDropdown) return;

        th.addEventListener('click', function (e) {
          const rect = th.getBoundingClientRect();
          const isFilterIconArea = isOnFilterIcon(e.clientX, rect);
          if (!isFilterIconArea || currentResizingColumn) return;

          e.stopPropagation();

          closeAllColumnFilters(filterDropdown);

          const isOpen = filterDropdown.classList.toggle('show');
          if (isOpen) {
            th.classList.add('filter-active');
            portalColumnFilterDropdown(th, filterDropdown);
            requestAnimationFrame(() => positionColumnFilterPortal(th, filterDropdown));
          } else {
            th.classList.remove('filter-active');
            unportalColumnFilterDropdown(filterDropdown);
          }
        });

        th.addEventListener('mousedown', function (e) {
          const rect = th.getBoundingClientRect();
          const isNearRightEdge = isNearResizeHandle(e.clientX, rect);
          if (!isNearRightEdge) return;

          currentResizingColumn = th;
          resizeStartX = e.clientX;
          resizeStartWidth = th.offsetWidth;
          document.body.style.cursor = 'col-resize';
          e.preventDefault();
        });

        th.dataset.interactionsInitialized = '1';
      });
    }

    pinSpecialColumns();
    ensureColumnKeys();
    buildColumnsMenuForTable(table);
    initializeResizeAndFilter();
    initializeDragAndDrop();
    initializeColumnInteractions();
  });

  // DIŞARI TIKLAYINCA KOLON FİLTRESİNİ KAPAT
  document.addEventListener('click', function (e) {
    if (e.target.closest('.column-filter-dropdown')) return;
    if (e.target.closest('th')) return;
    document.querySelectorAll('.column-filter-dropdown.show').forEach(dropdown => {
      dropdown.classList.remove('show');
      dropdown.parentElement.classList.remove('filter-active');
      unportalColumnFilterDropdown(dropdown);
    });
  });

  // ==============================
  // HELPERS
  // ==============================
  function alignColumn(table, columnIndex, alignment) {
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      if (cells[columnIndex]) {
        cells[columnIndex].style.textAlign = alignment;
      }
    });
  }

  function swapColumns(table, fromIndex, toIndex, force) {
    if (fromIndex === toIndex) return;

    const headers = Array.from(table.querySelectorAll('thead th'));
    const fromHeader = headers[fromIndex];
    const toHeader = headers[toIndex];
    const fromRole = fromHeader ? fromHeader.getAttribute('data-role') : null;
    const toRole = toHeader ? toHeader.getAttribute('data-role') : null;

    if (!force && (fromRole === 'select' || fromRole === 'actions' || toRole === 'select' || toRole === 'actions')) return;

    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      if (cells[fromIndex] && cells[toIndex]) {
        const fromCell = cells[fromIndex];
        const toCell = cells[toIndex];

        const placeholder = document.createElement('td');
        toCell.parentNode.insertBefore(placeholder, toCell);
        placeholder.parentNode.insertBefore(fromCell, placeholder);

        if (fromIndex < toIndex) {
          const referenceCell = cells[fromIndex + 1];
          if (referenceCell && referenceCell !== toCell) {
            referenceCell.parentNode.insertBefore(toCell, referenceCell);
          } else {
            fromCell.parentNode.insertBefore(toCell, fromCell);
          }
        } else {
          if (fromCell.nextSibling) {
            fromCell.parentNode.insertBefore(toCell, fromCell.nextSibling);
          } else {
            fromCell.parentNode.appendChild(toCell);
          }
        }

        placeholder.remove();
      }
    });
  }

  // FILTER BUTTON - EXPAND CARD
  function toggleFilterCardExpanded(buttonEl) {
    const filterCard = buttonEl.closest('.card');
    if (!filterCard) return;

    filterCard.classList.toggle('expanded');

    const icon = buttonEl.querySelector('i');
    if (!icon) return;

    if (filterCard.classList.contains('expanded')) {
      if (icon.classList.contains('fa-chevron-down')) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
      }
      if (icon.classList.contains('fa-plus')) {
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
      }
    } else {
      if (icon.classList.contains('fa-chevron-up')) {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
      }
      if (icon.classList.contains('fa-minus')) {
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
      }
    }
  }

  const filterBtn = document.getElementById('filter-btn');
  filterBtn && filterBtn.addEventListener('click', function () {
    toggleFilterCardExpanded(this);
  });

  const filterExpandedBtn = document.getElementById('filter-expanded-button');
  if (filterExpandedBtn) {
    // Remove old listener if any to prevent duplicates or conflicts, though difficult without named function. 
    // Assuming simple append is fine as previous logic was simple.
    // Actually, existing logic is fine. just adding selectAll logic.
    filterExpandedBtn.addEventListener('click', function () {
      toggleFilterCardExpanded(this);
    });
  }

  // Table Select All Logic
  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const checkboxes = document.querySelectorAll('tbody .checkbox-col input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = isChecked);
    });
  }

  document.addEventListener('change', function (e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== 'checkbox') return;
    if (!target.closest('tbody')) return;
    if (!target.closest('.checkbox-col')) return;

    // Update header checkbox
    if (selectAll) {
      const checkboxes = Array.from(document.querySelectorAll('tbody .checkbox-col input[type="checkbox"]'));
      const allChecked = checkboxes.every(cb => cb.checked);
      const someChecked = checkboxes.some(cb => cb.checked);
      selectAll.checked = allChecked;
      selectAll.indeterminate = someChecked && !allChecked;
    }
  });

})();