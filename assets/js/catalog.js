document.addEventListener('DOMContentLoaded', () => {

  initScrollTopButton();
  // ---------------------------
  // ПЕРЕМЕННЫЕ
  // ---------------------------
  let allCars = [];
  let filteredCars = [];

  function getColumnsCount() {
  const w = window.innerWidth;
  if (w < 640) return 1;      // mobile
  if (w < 1024) return 2;     // tablet
  return 3;                  // desktop
    }

function getPageSize() {
  const cols = getColumnsCount();
  // 20 норм для 1-2 колонок, для 3 колонок делаем 24 (кратно 3)
  if (cols === 3) return 24;
  return 20;
    }


  itemsToShow = getPageSize();


  const grid = document.getElementById('catalogGrid');
  const totalCountEl = document.getElementById('totalCount');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const filterForm = document.getElementById('filterForm');

  // Селекты и кнопки
  const brandSelect = document.getElementById('brandSelect');
  const modelSelect = document.getElementById('modelSelect');
  const sortSelect = document.getElementById('sortSelect');
  const resetBtn = document.getElementById('resetFilters');
  const chips = document.querySelectorAll('.chip');
  const countryButtons = document.querySelectorAll('.country-btn');


  // Если есть скрытое поле страны (как раньше)
  const hiddenCountry =
    document.getElementById('hiddenCountry') ||
    (filterForm ? filterForm.querySelector('[name="country_code"]') : null);

  // ---------------------------
  // ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ
  // ---------------------------
  const state = {
    country: "", // "" | "KR" | "CN" | "RU"
    chipFlags: new Set(), // budget, power_low, stock, passable (multi)
    overrides: {
      budget: null,     // { prevPriceTo: string } | null
      power_low: null,  // { prevHpTo: string } | null
      stock: null       // { prevInStock: boolean } | null
    }
  };

  // ---------------------------
  // УТИЛИТЫ
  // ---------------------------


  const escapeHtml = (s) => {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
      .format(Number(price) || 0);

  const formatMonth = (monthNum) => {
    const m = Number(monthNum) || 0;
    if (!m) return '';
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль',
         'Август', 'Сенябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return months[m - 1] || '';
  };

  const getAgeInMonths = (year, month = 1) => {
    const y = Number(year) || 0;
    const mo = Number(month) || 1;
    const now = new Date();
    return (now.getFullYear() - y) * 12 + (now.getMonth() - (mo - 1));
  };

  const normalizeCar = (car) => {
    car.id = car.id ?? '';
    car.country_code = car.country_code ?? '';
    car.brand = car.brand ?? '';
    car.model = car.model ?? '';
    let rawTitle = car.web_title ? car.web_title : `${car.brand} ${car.model}`;
    car.web_title = rawTitle.replace(/_/g, ' ');

    car.year = Number(car.year) || 0;
    car.month = Number(car.month) || 0;

    car.price = Number(car.price) || 0;
    car.added_at = car.added_at || 0;

    car.is_auction = !!car.is_auction;
    car.in_stock = !!car.in_stock;
    car.full_time = !!car.full_time;

    car.auction_benefit = Number(car.auction_benefit) || 0;

    car.assets_folder = car.assets_folder || '';

    if (!car.specs) car.specs = {};
    car.specs.hp = Number(car.specs.hp) || 0;
    car.specs.volume = Number(car.specs.volume) || 0;
    car.specs.mileage = Number(car.specs.mileage) || 0;
    car.specs.fuel = car.specs.fuel || '';

    // Кэши для ускорения на 1000+
    car._ageMonths = getAgeInMonths(car.year, car.month || 1);
    car._isPassable = (car._ageMonths >= 36 && car._ageMonths < 60);
    car._isLowPower = (car.specs.hp <= 160 && car.specs.volume > 0);

    // фото
    if (!Array.isArray(car.photos)) car.photos = [];
    return car;
  };

  function setFormValue(name, value) {
    if (!filterForm) return;
    const el = filterForm.elements[name];
    if (!el) return;
    el.value = value;
  }

  function getFormValue(name) {
    if (!filterForm) return '';
    const el = filterForm.elements[name];
    if (!el) return '';
    return el.value;
  }

  function setCheckbox(name, checked) {
    if (!filterForm) return;
    const el = filterForm.elements[name];
    if (!el) return;
    el.checked = !!checked;
  }

  function getCheckbox(name) {
    if (!filterForm) return false;
    const el = filterForm.elements[name];
    if (!el) return false;
    return !!el.checked;
  }

  function syncCountryToForm() {
    if (hiddenCountry) hiddenCountry.value = state.country;
    else setFormValue('country_code', state.country);
  }


 // Вешаем слушатели закрытия
if (closeSheetBtn) closeSheetBtn.addEventListener('click', closeSheet);
if (sheetOverlay) sheetOverlay.addEventListener('click', closeSheet);


  // ---------------------------
  // Делегирование hover (ДЛЯ ПК)
  // ---------------------------
  if (grid) {
    grid.addEventListener('mouseover', (e) => {
      // Ищем зону наведения
      const zone = e.target.closest('.hover-zone');
      if (!zone || !grid.contains(zone)) return;

      const wrap = zone.closest('.car-img-wrap');
      if (!wrap) return;

      // Получаем индекс зоны
      const idx = Number(zone.dataset.idx || 0);

      // 1. Переключаем картинки (добавляем/убираем класс active)
      const slides = wrap.querySelectorAll('.car-img-slide');
      slides.forEach((slide, i) => {
        if (i === idx) slide.classList.add('active');
        else slide.classList.remove('active');
      });

      // 2. Переключаем точки
      const dots = wrap.querySelectorAll('.slider-dot');
      dots.forEach((dot, i) => {
        if (i === idx) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    });

    // Reset при уходе мыши (возвращаем первую картинку)
    grid.addEventListener('mouseout', (e) => {
      const wrap = e.target.closest('.car-img-wrap');
      if (!wrap || !grid.contains(wrap)) return;
      
      // Если мышь перешла на дочерний элемент (например, бейдж), не сбрасываем
      if (e.relatedTarget && wrap.contains(e.relatedTarget)) return;

      // Возвращаем активность первому слайду
      const slides = wrap.querySelectorAll('.car-img-slide');
      slides.forEach((slide, i) => {
         if (i === 0) slide.classList.add('active');
         else slide.classList.remove('active');
      });

      // Возвращаем активность первой точке
      const dots = wrap.querySelectorAll('.slider-dot');
      dots.forEach((dot, i) => {
         if (i === 0) dot.classList.add('active');
         else dot.classList.remove('active');
      });
    });
  }

  // ---------------------------
  // ЧИПСЫ: UI sync
  // ---------------------------
  function syncChipsUI() {
  // 1) Верхние чипсы (теперь только multi)
  chips.forEach(chip => {
    const t = chip.dataset.filter;
    chip.classList.toggle('active', state.chipFlags.has(t));
  });

  // 2) Кнопки стран в сайдбаре (radio)
  countryButtons.forEach(btn => {
    const v = btn.dataset.country || "";
    const isActive = state.country === v;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}


  // ---------------------------
  // ЧИПСЫ -> форма (overrides)
  // ---------------------------
  function applyChipOverridesToForm(chipType, enable) {
    if (!filterForm) return;

    if (chipType === 'budget') {
      const el = filterForm.elements['price_to'];
      if (!el) return;

      if (enable) {
        if (!state.overrides.budget) state.overrides.budget = { prevPriceTo: el.value };
        const cur = Number(el.value);
        if (!cur || cur > 2000000) el.value = '2000000';
      } else {
        if (state.overrides.budget) {
          el.value = state.overrides.budget.prevPriceTo ?? '';
          state.overrides.budget = null;
        }
      }
    }

    if (chipType === 'power_low') {
      const el = filterForm.elements['hp_to'];
      if (!el) return;

      if (enable) {
        if (!state.overrides.power_low) state.overrides.power_low = { prevHpTo: el.value };
        const cur = Number(el.value);
        if (!cur || cur > 160) el.value = '160';
      } else {
        if (state.overrides.power_low) {
          el.value = state.overrides.power_low.prevHpTo ?? '';
          state.overrides.power_low = null;
        }
      }
    }

    if (chipType === 'stock') {
      const el = filterForm.elements['in_stock'];
      if (!el) return;

      if (enable) {
        if (!state.overrides.stock) state.overrides.stock = { prevInStock: !!el.checked };
        el.checked = true;
      } else {
        if (state.overrides.stock) {
          el.checked = !!state.overrides.stock.prevInStock;
          state.overrides.stock = null;
        }
      }
    }
  }

  // ---------------------------
  // Примирение: state <- form
  // ---------------------------
  function reconcileStateFromForm() {
    if (!filterForm) return;

    // страна
    const formCountry = getFormValue('country_code') || (hiddenCountry ? hiddenCountry.value : '');
    state.country = formCountry || "";

    // stock: если галку сняли руками — чип выключаем
    const inStockChecked = getCheckbox('in_stock');
    if (!inStockChecked && state.chipFlags.has('stock')) {
      state.chipFlags.delete('stock');
      state.overrides.stock = null;
    }

    // budget: если price_to стало пусто или >2м — чип выключаем
    const priceTo = Number(getFormValue('price_to') || 0);
    if (state.chipFlags.has('budget')) {
      if (!priceTo || priceTo > 2000000) {
        state.chipFlags.delete('budget');
        state.overrides.budget = null;
      }
    } else {
      // мягкая синхра: если руками выставили ровно 2м — подсветим
      if (priceTo === 2000000) state.chipFlags.add('budget');
    }

    // power_low
    const hpTo = Number(getFormValue('hp_to') || 0);
    if (state.chipFlags.has('power_low')) {
      if (!hpTo || hpTo > 160) {
        state.chipFlags.delete('power_low');
        state.overrides.power_low = null;
      }
    } else {
      if (hpTo === 160) state.chipFlags.add('power_low');
    }

    syncChipsUI();
  }

  // ---------------------------
  // РЕНДЕРИНГ СЕТКИ (FINAL GOLD VERSION)
  // ---------------------------
  function renderGrid() {
    if (!grid) return;

    const visibleCars = filteredCars.slice(0, itemsToShow);

    // Если машин нет
    if (visibleCars.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #64748B;">Ничего не найдено.</div>';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    const htmlParts = [];

    for (const car of visibleCars) {
      // --- 1. ФОТО И СЛАЙДЕР (Адаптивный: 5 тегов img) ---
      const safePhotos = (car.photos && car.photos.length > 0)
        ? car.photos.map(f => `assets/cars/${car.assets_folder}/${f}`)
        : ['assets/img/no-photo.png'];

      const photosToShow = safePhotos.slice(0, 5);
      
      let slidesHTML = ''; // Тут будут сами картинки
      let zonesHTML = '';  // Тут зоны для ховера (ПК)
      let dotsHTML = '';   // Тут точки (ПК)

      // Генерируем 5 картинок сразу
      for (let i = 0; i < photosToShow.length; i++) {
        const photoUrl = photosToShow[i];
        
        // Картинка: Первая получает класс active (для ПК)
        const isActive = (i === 0) ? 'active' : '';
        // loading="lazy" только для 2-й и далее, первую грузим сразу
        const loading = (i === 0) ? 'eager' : 'lazy'; 
        
        slidesHTML += `<img src="${escapeHtml(photoUrl)}" class="car-img-slide ${isActive}" loading="${loading}" alt="${escapeHtml(car.brand)}">`;

        // Зоны и точки (как раньше, для ПК)
        zonesHTML += `<div class="hover-zone" data-idx="${i}"></div>`;
        dotsHTML += `<div class="slider-dot ${isActive}"></div>`;
      }

      // Обертка трека
      const photosHTML = `<div class="car-slider-track">${slidesHTML}</div>`;

      // --- 2. ВЕРХНИЕ БЕЙДЖИ И ФЛАГ ---
      const bottomBadges = [];
      bottomBadges.push(car._isPassable
        ? '<div class="badge-glass green">Проходной</div>'
        : '<div class="badge-glass red">Высокая ставка</div>');

      if (car._isLowPower) bottomBadges.push('<div class="badge-glass yellow">Льготный</div>');

      let flagIcon = '';
      if (car.country_code === 'KR') flagIcon = 'assets/img/flag-korea.png';
      else if (car.country_code === 'CN') flagIcon = 'assets/img/flag-china.png';
      else if (car.country_code === 'RU') flagIcon = 'assets/img/flag-russia.png';
      const countryBadge = flagIcon ? `<img src="${flagIcon}" class="car-flag-icon" alt="${escapeHtml(car.country_code)}">` : '';

      const auctionIconHtml = car.is_auction ? `
        <div class="auction-badge-wrap" onclick="event.stopPropagation()">
          <img src="assets/img/hammer.png" class="auction-icon" alt="Аукцион">
          <div class="auction-tooltip">Авто с аукциона</div>
        </div>` : '';

      const stockBadge = car.in_stock ? '<div class="badge-stock">В наличии</div>' : '';

      // --- 3. ДАННЫЕ АВТО (Title, Specs) ---
      // Убираем подчеркивания из названия
      let rawTitle = car.web_title ? car.web_title : `${car.brand} ${car.model}`;
      const title = rawTitle.replace(/_/g, ' ');

      const volStr = (car.specs.volume / 1000).toFixed(1) + ' л';
      const hpStr = car.specs.hp + ' л.с.';
      const fuelStr = car.specs.fuel; 
      const kmStr = car.specs.mileage.toLocaleString() + ' км';
      
      const monthStr = car.month ? formatMonth(car.month) : '';
      const dateStr = (monthStr ? monthStr + ' ' : '') + car.year;

      // HTML Характеристик (ПК vs Мобилка)
      const specsHTML_PC = `
        <div class="specs-pc">
            <div class="specs-row">${escapeHtml(fuelStr)} • ${escapeHtml(volStr)} • ${escapeHtml(hpStr)}</div>
            <div class="specs-row">${escapeHtml(kmStr)} • ${escapeHtml(dateStr)}</div>
        </div>
      `;

      const specsHTML_Mobile = `
        <div class="specs-mobile">
            <div class="specs-row">${escapeHtml(fuelStr)}, ${escapeHtml(volStr)}</div>
            <div class="specs-row">${escapeHtml(hpStr)}, ${escapeHtml(kmStr)}</div>
            <div class="specs-row">${escapeHtml(dateStr)}</div>
        </div>
      `;

      // --- 4. ЛОГИКА ТУЛТИПОВ И ЦЕНЫ (Исправленная часть) ---
      
      // Тексты для шторки/тултипа
      const tooltipTextAuction = "Это предварительная цена авто с учетом аукционной скидки.";
      const tooltipTextSimple = "Со всеми расходами до Владивостока, включая пошлины, утиль и услуги брокера.";
      
      // Проверка типа цены
      const isAuctionType = (car.is_auction && car.auction_benefit > 0);
      const currentTooltipText = isAuctionType ? tooltipTextAuction : tooltipTextSimple;
      // Тип текста для JS-функции открытия шторки ('auction' или 'simple')
      const jsTextType = isAuctionType ? 'auction' : 'simple';

      // Генерация HTML блока выгоды
      let benefitHTML = '';
      if (isAuctionType) {
        benefitHTML = `
          <div class="benefit-block">
             <div class="benefit-value">-${formatPrice(car.auction_benefit)}</div>
             <div class="benefit-label">Ваша выгода</div>
          </div>
        `;
      } else {
        benefitHTML = `<div class="delivery-simple">до Владивостока</div>`;
      }

      const cardClass = car.is_auction ? 'car-card auction-card' : 'car-card';
      // === НОВАЯ ЛОГИКА ОТКРЫТИЯ ССЫЛКИ ===
      // Если ширина меньше 768px -> открываем в текущем окне (_self)
      // Иначе -> в новой вкладке (_blank)
      const targetAttr = window.innerWidth < 768 ? '_self' : '_blank';

      // --- 5. СБОРКА КАРТОЧКИ ---
      htmlParts.push(`
        <a class="${cardClass}" href="car.html?id=${encodeURIComponent(car.id)}" target="${targetAttr}" style="display:block; text-decoration:none; color:inherit;">
          <div class="car-img-wrap">
            
            ${photosHTML}

            <div class="hover-zones">${zonesHTML}</div>
            <div class="slider-pagination">${dotsHTML}</div>

            ${countryBadge}
            ${auctionIconHtml}
            ${stockBadge}

            <div class="badges-bottom-row">
              ${bottomBadges.join('')}
            </div>
          </div>
          
          <div class="car-content">
            <div class="car-title">${escapeHtml(title)}</div>

            <div class="car-specs-block">
                ${specsHTML_PC}
                ${specsHTML_Mobile}
            </div>

            <div class="car-footer">
              <div class="price-column">
                <div class="price-row-main">
                    <div class="car-price">${formatPrice(car.price)}</div>
                    
                    <div class="info-icon" onclick="openPriceInfo(event, '${jsTextType}')">
                        i
                        <div class="tooltip">${currentTooltipText}</div>
                    </div>
                </div>
                ${benefitHTML}
              </div>
            </div>
          </div>
        </a>
      `);
    }

    grid.innerHTML = htmlParts.join('');

    // Управление кнопкой "Показать еще"
    if (loadMoreBtn) {
      loadMoreBtn.style.display = itemsToShow >= filteredCars.length ? 'none' : 'inline-flex';
    }
  }

  function updateCounter() {
    if (!totalCountEl) return;
    totalCountEl.textContent = `${filteredCars.length}`;
  }

  // ---------------------------
  // СОРТИРОВКА
  // ---------------------------
  function sortCars() {
    const sortVal = sortSelect ? sortSelect.value : 'new';
    filteredCars.sort((a, b) => {
      if (sortVal === 'cheap') return (a.price - b.price);
      if (sortVal === 'expensive') return (b.price - a.price);
      if (sortVal === 'year_new') return (b.year - a.year);
      return new Date(b.added_at || 0) - new Date(a.added_at || 0);
    });
  }

  // ---------------------------
  // БРЕНДЫ/МОДЕЛИ (важно для UX)
  // ---------------------------
  function updateBrandList() {
    const country = state.country;
    const currentBrand = brandSelect ? brandSelect.value : '';

    const availableCars = country ? allCars.filter(c => c.country_code === country) : allCars;
    const brands = [...new Set(availableCars.map(c => c.brand))].sort();

    if (!brandSelect) return;

    brandSelect.innerHTML = '<option value="">Все марки</option>';
    for (const b of brands) {
      const selected = (b === currentBrand) ? 'selected' : '';
      brandSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(b)}" ${selected}>${escapeHtml(b)}</option>`);
    }

    // Если бренд исчез при смене страны — сбрасываем бренд+модель
    if (country && currentBrand && !brands.includes(currentBrand)) {
      brandSelect.value = "";
      if (modelSelect) {
        modelSelect.innerHTML = '<option value="">Сначала выберите марку</option>';
        modelSelect.disabled = true;
      }
    }

    updateModelList(); // всегда пересчитываем модели, чтобы не оставалась старая модель
  }

  function updateModelList() {
    if (!modelSelect || !brandSelect) return;

    const country = state.country;
    const brand = brandSelect.value || '';
    const currentModel = modelSelect.value || '';

    if (!brand) {
      modelSelect.innerHTML = '<option value="">Сначала выберите марку</option>';
      modelSelect.disabled = true;
      return;
    }

    const availableCars = allCars.filter(c => {
      if (country && c.country_code !== country) return false;
      return c.brand === brand;
    });

    const models = [...new Set(availableCars.map(c => c.model))].sort();

    modelSelect.disabled = false;
    modelSelect.innerHTML = '<option value="">Все модели</option>';
    for (const m of models) {
      const selected = (m === currentModel) ? 'selected' : '';
      modelSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(m)}" ${selected}>${escapeHtml(m)}</option>`);
    }

    // Если текущая модель не существует в новом списке — сброс
    if (currentModel && !models.includes(currentModel)) {
      modelSelect.value = '';
    }
  }

  // ---------------------------
  // APPLY FILTERS (единая точка)
  // ---------------------------
  function applyFilters() {
    if (!filterForm) return;

    reconcileStateFromForm();

    const fd = new FormData(filterForm);

    filteredCars = allCars.filter(car => {
      // 1) СТРАНА
      if (state.country && car.country_code !== state.country) return false;

      // 2) САЙДБАР
      if (fd.get('brand') && car.brand !== fd.get('brand')) return false;
      if (fd.get('model') && car.model !== fd.get('model')) return false;

      const pFrom = Number(fd.get('price_from')); if (pFrom && car.price < pFrom) return false;
      const pTo = Number(fd.get('price_to'));     if (pTo && car.price > pTo) return false;

      const yFrom = Number(fd.get('year_from'));  if (yFrom && car.year < yFrom) return false;
      const yTo = Number(fd.get('year_to'));      if (yTo && car.year > yTo) return false;

      const vFrom = Number(fd.get('volume_from')); if (vFrom && car.specs.volume < vFrom) return false;
      const vTo = Number(fd.get('volume_to'));     if (vTo && car.specs.volume > vTo) return false;

      const hpFrom = Number(fd.get('hp_from'));   if (hpFrom && car.specs.hp < hpFrom) return false;
      const hpTo = Number(fd.get('hp_to'));       if (hpTo && car.specs.hp > hpTo) return false;

      const fuels = fd.getAll('fuel');
      if (fuels.length > 0 && !fuels.includes(car.specs.fuel)) return false;

      if (fd.get('full_time') && !car.full_time) return false;
      if (fd.get('is_auction') && !car.is_auction) return false;
      if (fd.get('in_stock') && !car.in_stock) return false;

      // 3) ЧИПЫ-ФЛАГИ (multi)
      if (state.chipFlags.has('budget') && car.price > 2000000) return false;
      if (state.chipFlags.has('power_low') && car.specs.hp > 160) return false;
      if (state.chipFlags.has('stock') && !car.in_stock) return false;
      if (state.chipFlags.has('passable') && !car._isPassable) return false;

      return true;
    });

    sortCars();

    // пагинация: при любом изменении фильтров — показываем первые 20
    itemsToShow = getPageSize();

    renderGrid();
    updateCounter();
  }

  // ---------------------------
  // ЗАГРУЗКА ДАННЫХ
  // ---------------------------
  fetch('data/cars.json')
    .then(res => res.json())
    .then(data => {
      allCars = (Array.isArray(data) ? data : []).map(normalizeCar);

      // Сортировка по дате добавления
      allCars.sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0));
      filteredCars = [...allCars];

      // стартовое состояние — "all"
      state.country = "";
      syncCountryToForm();
      syncChipsUI();

      updateBrandList(); // заполнить бренды/модели
      renderGrid();
      updateCounter();
    })
    .catch(err => console.error('Ошибка:', err));

  // ---------------------------
  // СОБЫТИЯ
  // ---------------------------

  // Сайдбар -> фильтры
  if (filterForm) {
    filterForm.addEventListener('change', () => {
      // если меняли бренд/страну/что-то — актуализируем списки
      updateBrandList();
      applyFilters();
    });
  }

  // отдельные реакции (чуть аккуратнее UX)
  if (brandSelect) {
    brandSelect.addEventListener('change', () => {
      updateModelList();
      applyFilters();
    });
  }

  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      applyFilters();
    });
  }


// Страна (кнопки в сайдбаре) -> ПОЛНЫЙ СБРОС + выбор страны
  if (countryButtons.length) {
    countryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // 1. Сначала сбрасываем вообще всё
        if (filterForm) filterForm.reset();
        state.chipFlags.clear();
        state.overrides.budget = null;
        state.overrides.power_low = null;
        state.overrides.stock = null;
        
        // Сбрасываем марку и модель принудительно
        if (brandSelect) brandSelect.value = "";
        if (modelSelect) {
            modelSelect.innerHTML = '<option value="">Сначала выберите марку</option>';
            modelSelect.disabled = true;
        }

        // 2. Устанавливаем выбранную страну
        state.country = btn.dataset.country || "";
        
        // 3. Синхронизируем и обновляем
        syncCountryToForm();   
        syncChipsUI();         
        updateBrandList();     
        applyFilters();
      });
    });
  }


  // Чипсы -> state -> форма -> фильтры
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const t = chip.dataset.filter;

      // --- СТРАНА (radio) ---
      if (t === 'all' || t === 'korea' || t === 'china' || t === 'russia') {
        state.country = (t === 'all') ? "" : (t === 'korea') ? "KR" : (t === 'china') ? "CN" : "RU";
        syncCountryToForm();
        syncChipsUI();

        // смена страны => обновить бренды/модели
        updateBrandList();
        applyFilters();
        return;
      }

      // --- ФЛАГИ (multi) ---
      if (state.chipFlags.has(t)) {
        state.chipFlags.delete(t);
        applyChipOverridesToForm(t, false);
      } else {
        state.chipFlags.add(t);
        applyChipOverridesToForm(t, true);
      }

      syncChipsUI();
      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortCars();
      renderGrid();
    });
  }

if (resetBtn && filterForm) {
    resetBtn.addEventListener('click', () => {
      // 1. Сброс формы
      filterForm.reset();

      // 2. Сброс стейта
      state.country = ""; // Все страны
      state.chipFlags.clear();
      state.overrides.budget = null;
      state.overrides.power_low = null;
      state.overrides.stock = null;

      // 3. Сброс селектов (чтобы марка не залипала)
      if (brandSelect) brandSelect.value = "";
      if (modelSelect) {
        modelSelect.innerHTML = '<option value="">Сначала выберите марку</option>';
        modelSelect.disabled = true;
      }

      // 4. Обновление UI
      syncCountryToForm();
      syncChipsUI();
      updateBrandList();
      applyFilters();
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      itemsToShow += getPageSize();
      renderGrid();
    });
  }

// --- МОБИЛЬНАЯ ШТОРКА: ОТКРЫТИЕ/ЗАКРЫТИЕ ---
  const filterDrawer = document.getElementById('filterDrawer');
  const openFiltersBtn = document.getElementById('openFiltersBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerOverlay = document.getElementById('drawerOverlay'); // Должно совпадать с HTML

function toggleDrawer(isOpen) {
    if (!filterDrawer) return;
    
    filterDrawer.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : ''; // Блокируем фон
    
    // Если открываем — скроллим содержимое шторки наверх
    if (isOpen) {
      const drawerBody = filterDrawer.querySelector('.drawer-body');
      if (drawerBody) {
        drawerBody.scrollTop = 0;
      }
    }
  }

  if (openFiltersBtn) openFiltersBtn.onclick = () => toggleDrawer(true);
  if (closeDrawerBtn) closeDrawerBtn.onclick = () => toggleDrawer(false);
  if (drawerOverlay) drawerOverlay.onclick = () => toggleDrawer(false);

  // ---------------------------
  // АДАПТИВНЫЙ ПЕРЕНОС ФОРМЫ + СМЕНА ПОДПИСЕЙ
  // ---------------------------
  const sidebar = document.querySelector('.catalog-sidebar');
  const mobilePlace = document.getElementById('mobileFilterPlace');

  // Словарь: имя поля -> текст для мобильной версии
  const mobilePlaceholders = {
    'price_from': 'Цена от',   'price_to': 'Цена до',
    'year_from': 'Год от',     'year_to': 'Год до',
    'volume_from': 'Объем от', 'volume_to': 'Объем до',
    'hp_from': 'Л.с. от',      'hp_to': 'Л.с. до'
  };

  // Словарь: имя поля -> текст для ПК (стандартный)
  const desktopPlaceholders = {
    'price_from': 'От',        'price_to': 'До',
    'year_from': 'С 2020',     'year_to': 'По 2026',
    'volume_from': 'От',       'volume_to': 'До',
    'hp_from': 'От',           'hp_to': 'До'
  };

  function updatePlaceholders(isMobile) {
    if (!filterForm) return;
    
    // Перебираем все инпуты в словаре
    for (const [name, text] of Object.entries(isMobile ? mobilePlaceholders : desktopPlaceholders)) {
      const input = filterForm.querySelector(`[name="${name}"]`);
      if (input) input.placeholder = text;
    }
  }

function moveForm() {
    if (!filterForm || !sidebar || !mobilePlace) return;

    const isMobile = window.innerWidth < 768;
    const currentParent = filterForm.parentElement;

    // Ссылки на селекты
    const bSelect = filterForm.querySelector('#brandSelect');
    const mSelect = filterForm.querySelector('#modelSelect');

    if (isMobile) {
      // --- МОБИЛЬНЫЙ РЕЖИМ ---
      if (currentParent !== mobilePlace) {
        mobilePlace.appendChild(filterForm);
        updatePlaceholders(true); // Меняем инпуты на "Цена от"
        
        // Меняем селекты на короткие названия
        if (bSelect && bSelect.options.length > 0) bSelect.options[0].text = "Марка";
        if (mSelect && mSelect.options.length > 0) mSelect.options[0].text = "Модель";
      }
    } else {
      // --- ПК РЕЖИМ ---
      if (currentParent !== sidebar) {
        sidebar.appendChild(filterForm);
        updatePlaceholders(false); // Меняем инпуты на "От"
        
        // Возвращаем длинные названия
        if (bSelect && bSelect.options.length > 0) bSelect.options[0].text = "Все марки";
        // Для модели текст зависит от контекста, но вернем базу
        if (mSelect && mSelect.options.length > 0) {
           // Если марка не выбрана — длинный текст, если выбрана — "Все модели"
           // Упростим: просто вернем "Все модели" или "Выберите марку"
           mSelect.options[0].text = bSelect.value ? "Все модели" : "Сначала выберите марку";
        }
      }
    }
  }

  // Запускаем
  moveForm();
  window.addEventListener('resize', moveForm);


  // ---------------------------
  // КНОПКИ ВНУТРИ ШТОРКИ
  // ---------------------------
  const applyMobileBtn = document.getElementById('applyMobileFilters');
  const resetMobileBtn = document.getElementById('resetMobileFilters');

  if (applyMobileBtn) {
    applyMobileBtn.addEventListener('click', () => {
      // 1. Применяем фильтры (функция applyFilters уже есть)
      applyFilters();
      // 2. Закрываем шторку
      toggleDrawer(false);
      // 3. Можно скроллнуть к началу списка (опционально)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

if (resetMobileBtn) {
    resetMobileBtn.addEventListener('click', () => {
      // 1. Сбрасываем фильтры (вызываем клик по скрытой ПК-кнопке)
      if (resetBtn) resetBtn.click();
      
      // 2. Закрываем шторку
      toggleDrawer(false);
      
      // 3. Плавный скролл страницы наверх
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

// Конец document.addEventListener
});


/* ============================================================
   ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ШТОРКИ (Вставлено в самый конец файла)
   ============================================================ */

// Делаем функцию доступной для HTML (window.openPriceInfo)
window.openPriceInfo = function(event, textType) {
    // 1. Останавливаем клик, чтобы не открылась карточка авто
    if (event) {
        event.stopPropagation(); // Не даем событию подняться к карточке
        event.preventDefault();  // ЗАПРЕЩАЕМ переход по ссылке (<a>)
    }

    // 2. Если это ПК (ширина > 768), ничего не делаем (там работает наведение мыши)
    if (window.innerWidth > 768) return;

    // 3. Находим элементы (они уже должны быть в catalog.html внизу)
    const infoSheet = document.getElementById('infoSheet');
    const sheetOverlay = document.getElementById('sheetOverlay');
    const sheetTextEl = document.getElementById('sheetText');

    if (!infoSheet || !sheetOverlay) {
        console.error('Ошибка: Не найден блок #infoSheet или #sheetOverlay в HTML');
        return;
    }

    // 4. Подбираем текст
    let content = '';
    if (textType === 'auction') {
        content = `Это предварительная цена авто с учетом аукционной скидки. <br><br>
                   <span style="color:#16A34A; font-weight:700;">Ваша выгода</span> рассчитана относительно средней рыночной стоимости аналогичного авто в РФ.`;
    } else {
        content = `Со всеми расходами до Владивостока, включая таможенные пошлины, утилизационный сбор и услуги брокера.
        <br><br><strong>Больше ни за что платить не нужно.</strong>`;
    }

    // 5. Вставляем текст и открываем шторку
    if (sheetTextEl) sheetTextEl.innerHTML = content;
    
    infoSheet.classList.add('active');
    sheetOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку фона
};

// Функция закрытия шторки
window.closeSheet = function() {
    const infoSheet = document.getElementById('infoSheet');
    const sheetOverlay = document.getElementById('sheetOverlay');
    
    if (infoSheet) infoSheet.classList.remove('active');
    if (sheetOverlay) sheetOverlay.classList.remove('active');
    document.body.style.overflow = '';
};

// Вешаем обработчики на кнопку "Понятно" и на затемненный фон
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeSheetBtn');
    const overlay = document.getElementById('sheetOverlay');
    
    if (closeBtn) closeBtn.addEventListener('click', window.closeSheet);
    if (overlay) overlay.addEventListener('click', window.closeSheet);
});

/* =========================================
   SCROLL TO TOP BUTTON (Генерация кнопки)
   ========================================= */
function initScrollTopButton() {
    // 1. Создаем кнопку
    const btn = document.createElement('div');
    btn.className = 'scroll-top-btn';
    btn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 15l-6-6-6 6"/>
        </svg>
    `;
    document.body.appendChild(btn);

    // 2. Логика клика (плавный скролл наверх)
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 3. Логика появления (показывать после 400px прокрутки)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}