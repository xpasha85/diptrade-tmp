document.addEventListener('DOMContentLoaded', () => {
    
    // ПЕРЕМЕННЫЕ
    let allCars = [];
    let filteredCars = [];
    let itemsToShow = 20;
    // 6. ЧИПСЫ: теперь это массив или просто логика "вкл/выкл". 
    // Для простоты оставим одну переменную, но добавим логику сброса при повторном клике.
    let activeChip = null; // По умолчанию ничего не выбрано (значит "Все")

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

    // УТИЛИТЫ
    const formatPrice = (price) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);
    
    const formatMonth = (monthNum) => {
        if (!monthNum) return '';
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        return months[monthNum - 1] || '';
    };

    const getAgeInMonths = (year, month = 1) => {
        const now = new Date();
        return (now.getFullYear() - year) * 12 + (now.getMonth() - (month - 1));
    };

    // ЗАГРУЗКА ДАННЫХ
    fetch('data/cars.json')
        .then(res => res.json())
        .then(data => {
            allCars = data;
            // Сортировка по дате добавления
            allCars.sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0));
            filteredCars = [...allCars];
            initBrands(); 
            renderGrid(); 
            updateCounter();
        })
        .catch(err => console.error('Ошибка:', err));


    // --- РЕНДЕРИНГ СЕТКИ ---
    function renderGrid() {
        if (!grid) return;
        grid.innerHTML = '';

        const visibleCars = filteredCars.slice(0, itemsToShow);

        if (visibleCars.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #64748B;">Ничего не найдено.</div>';
            loadMoreBtn.style.display = 'none';
            return;
        }

        visibleCars.forEach((car) => {
            const ageMonths = getAgeInMonths(car.year, car.month || 1);
            
            // --- 1. ФОТО ---
            let safePhotos = (car.photos && car.photos.length > 0) 
                ? car.photos.map(f => `${car.assets_folder}/${f}`) 
                : ['assets/img/no-photo.png'];
            
            const photosToShow = safePhotos.slice(0, 5);
            const mainPhotoId = `car-img-${car.id}`;
            const dotsId = `dots-${car.id}`;
            
            // Слайдер (оставил компактно)
            let zonesHTML = ''; let dotsHTML = '';
            photosToShow.forEach((photoUrl, i) => {
                zonesHTML += `<div class="hover-zone" onmouseover="document.getElementById('${mainPhotoId}').src='${photoUrl}'; document.getElementById('${dotsId}').querySelectorAll('.slider-dot').forEach(d => d.classList.remove('active')); document.getElementById('${dotsId}').children[${i}].classList.add('active');"></div>`;
                dotsHTML += `<div class="slider-dot ${i === 0 ? 'active' : ''}"></div>`;
            });
            const resetAction = `document.getElementById('${mainPhotoId}').src='${safePhotos[0]}'; document.getElementById('${dotsId}').querySelectorAll('.slider-dot').forEach(d => d.classList.remove('active')); document.getElementById('${dotsId}').children[0].classList.add('active');`;

            // --- 2. БЕЙДЖИ (ТЕХНИЧЕСКИЕ) ---
            // Собираем массив бейджей для низа фото
            let bottomBadges = [];

            // Проходной / Непроходной
            if (ageMonths >= 36 && ageMonths < 60) {
                bottomBadges.push('<div class="badge-glass green">Проходной</div>');
            } else {
                bottomBadges.push('<div class="badge-glass red">Высокая ставка</div>');
            }

            // Льготный (если подходит)
            if (car.specs.hp <= 160 && car.specs.volume > 0) {
                bottomBadges.push('<div class="badge-glass yellow">Льготный</div>');
            }

            // --- 3. ВЕРХНИЕ ИКОНКИ ---
            // Флаг
            let flagIcon = '';
            if (car.country_code === 'KR') flagIcon = 'assets/img/flag-korea.png';
            else if (car.country_code === 'CN') flagIcon = 'assets/img/flag-china.png';
            else if (car.country_code === 'RU') flagIcon = 'assets/img/flag-russia.png';
            const countryBadge = flagIcon ? `<img src="${flagIcon}" class="car-flag-icon" alt="${car.country_code}">` : '';

            // Молоток
            let auctionIconHtml = '';
            if (car.is_auction) {
                auctionIconHtml = `
                <div class="auction-badge-wrap" onclick="event.stopPropagation()">
                    <img src="assets/img/hammer.png" class="auction-icon" alt="Аукцион">
                    <div class="auction-tooltip">Авто с аукциона</div>
                </div>`;
            }

            // Наличие
            const stockBadge = car.in_stock ? '<div class="badge-stock">В наличии</div>' : '';

            // --- 4. ФУТЕР (ВЫГОДА) ---
            let footerRightHtml = '';
            if (car.is_auction && car.auction_benefit > 0) {
                footerRightHtml = `
                    <div class="benefit-block">
                        <div class="benefit-value">-${formatPrice(car.auction_benefit)}</div>
                        <div class="benefit-label">Ваша выгода</div>
                    </div>`;
            } else {
                footerRightHtml = `<div class="delivery-simple">до Владивостока</div>`;
            }

            // --- 5. СБОРКА ---
            const cardClass = car.is_auction ? 'car-card auction-card' : 'car-card';
            
            const html = `
            <div class="${cardClass}" onclick="window.location.href='car.html?id=${car.id}'">
                <div class="car-img-wrap" onmouseleave="${resetAction}">
                    
                    <img src="${safePhotos[0]}" id="${mainPhotoId}" class="car-img" loading="lazy" onerror="this.onerror=null; this.src='assets/img/no-photo.png';">
                    
                    <div class="hover-zones">${zonesHTML}</div>
                    <div class="slider-pagination" id="${dotsId}">${dotsHTML}</div>

                    ${countryBadge}
                    ${auctionIconHtml}
                    ${stockBadge}
                    
                    <div class="badges-bottom-row">
                        ${bottomBadges.join('')}
                    </div>
                </div>
                
                <div class="car-content">
                    <div class="car-title">${car.web_title || `${car.brand} ${car.model}`}</div>
                    
                    <div class="car-specs-text">
                        ${car.month ? formatMonth(car.month) + ', ' : ''}${car.year} • 
                        ${car.specs.volume > 0 ? (car.specs.volume / 1000).toFixed(1) + ' л' : 'Электро'} • 
                        ${car.specs.hp} л.с.<br>
                        ${car.specs.fuel} • ${car.full_time ? '4WD' : '2WD'} • ${car.specs.mileage.toLocaleString()} км
                    </div>
                    
                    <div class="car-footer">
                        <div class="price-block">
                            <div class="car-price">${formatPrice(car.price)}</div>
                            <div class="price-subtitle">под ключ</div>
                        </div>
                        
                        ${footerRightHtml}
                    </div>
                </div>
            </div>`;
            grid.innerHTML += html;
        });

        loadMoreBtn.style.display = itemsToShow >= filteredCars.length ? 'none' : 'inline-flex';
    }

    function updateCounter() {
        totalCountEl.textContent = `${filteredCars.length}`;
    }


    // --- ФИЛЬТРАЦИЯ ---

    function applyFilters() {
        const fd = new FormData(filterForm);
        
        filteredCars = allCars.filter(car => {
            // Сайдбар фильтры (Марка, Модель...)
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

            // 6. ЛОГИКА ЧИПСОВ (ВКЛ/ВЫКЛ)
            // Если activeChip === null или 'all', фильтр не применяется
            if (activeChip === 'stock' && !car.in_stock) return false;
            if (activeChip === 'korea' && car.country_code !== 'KR') return false;
            if (activeChip === 'china' && car.country_code !== 'CN') return false;
            if (activeChip === 'russia' && car.country_code !== 'RU') return false;
            if (activeChip === 'budget' && car.price > 2000000) return false;
            if (activeChip === 'power_low' && car.specs.hp > 160) return false;
            if (activeChip === 'passable') {
                const age = getAgeInMonths(car.year, car.month || 1);
                if (age < 36 || age >= 60) return false;
            }

            return true;
        });

        sortCars();
        itemsToShow = 20;
        renderGrid();
        updateCounter();
    }

    // СОРТИРОВКА
    function sortCars() {
        const sortVal = sortSelect.value;
        filteredCars.sort((a, b) => {
            if (sortVal === 'cheap') return a.price - b.price;
            if (sortVal === 'expensive') return b.price - a.price;
            if (sortVal === 'year_new') return b.year - a.year;
            return new Date(b.added_at || 0) - new Date(a.added_at || 0);
        });
    }

    // --- СОБЫТИЯ ---

    // 7. ЗАМЕНА INPUT НА CHANGE
    // Удаляем старый 'input', ставим 'change' для текстовых полей
    // Для чекбоксов и селектов 'change' срабатывает сразу, для текста - при потере фокуса/Enter
    filterForm.addEventListener('change', applyFilters);
    
    // Но! Для ползунков (если они будут) нужен input. 
    // Поскольку у нас type="number", 'change' сработает идеально (Enter/Blur).
    // Старый 'input' убираем, чтобы не дергалось при наборе.

    // ЧИПСЫ: Логика тумблера
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterType = chip.dataset.filter;
            
            // Если нажали "Все"
            if (filterType === 'all') {
                activeChip = null;
                chips.forEach(c => c.classList.remove('active'));
                chips[0].classList.add('active'); // "Все" горит
                // Полный сброс формы тоже, если это подразумевается
                // filterForm.reset(); 
                // modelSelect.disabled = true;
            } 
            // Если нажали на уже активный чипс -> Выключаем его (сброс к All)
            else if (activeChip === filterType) {
                activeChip = null;
                chips.forEach(c => c.classList.remove('active'));
                // Включаем визуально "Все"
                document.querySelector('.chip[data-filter="all"]').classList.add('active');
            } 
            // Если нажали на новый чипс
            else {
                activeChip = filterType;
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            }
            
            applyFilters();
        });
    });

    // Инициализация марок
    function initBrands() {
        const brands = [...new Set(allCars.map(c => c.brand))].sort();
        brandSelect.innerHTML = '<option value="">Все марки</option>';
        brands.forEach(b => brandSelect.innerHTML += `<option value="${b}">${b}</option>`);
    }

    brandSelect.addEventListener('change', () => {
        const selectedBrand = brandSelect.value;
        modelSelect.innerHTML = '<option value="">Все модели</option>';
        if (!selectedBrand) {
            modelSelect.disabled = true; applyFilters(); return;
        }
        const models = [...new Set(allCars.filter(c => c.brand === selectedBrand).map(c => c.model))].sort();
        models.forEach(m => modelSelect.innerHTML += `<option value="${m}">${m}</option>`);
        modelSelect.disabled = false;
        applyFilters();
    });

    sortSelect.addEventListener('change', () => { sortCars(); renderGrid(); });
    
    resetBtn.addEventListener('click', () => {
        filterForm.reset();
        activeChip = null;
        chips.forEach(c => c.classList.remove('active'));
        document.querySelector('.chip[data-filter="all"]').classList.add('active');
        modelSelect.disabled = true;
        applyFilters();
    });

    loadMoreBtn.addEventListener('click', () => { itemsToShow += 20; renderGrid(); });
});