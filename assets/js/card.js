/* ==========================================================================
   CONFIG & CONSTANTS
   ========================================================================== */
const cardIsLocal =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

const CARD_API_BASE = cardIsLocal
    ? 'http://localhost:3001'
    : 'https://api.diptrade.ru';
const CARD_CARS_API_BASE = `${CARD_API_BASE}/site/cars`;
const UI_TEXT = {
    backToCatalog: "Назад в каталог",
    currencyKor: "₩",
    currencyChn: "¥",
    currencyRus: "₽",
    calcTitle: "Примерный расчет",
    calcKorea: "Расходы по Корее",
    calcChina: "Расходы по Китаю",
    calcRussia: "Расходы в России",
    calcCustoms: "Таможенные расходы",
    calcServices: "Услуги во Владивостоке",
    calcTotal: "Итого расходы РФ",
    calcFullPrice: "Полная стоимость",
    
    // Тултипы (можно дополнять)
    tooltipKoreaOps: "Доставка до порта, снятие с учета, экспортная декларация, стоянка.",
    tooltipRussiaCustoms: "Пошлина, утильсбор и оформление рассчитываются по курсу евро.",
    tooltipRussiaServices: "СБКТС, ЭПТС, лаборатория, перегон, стоянка, услуги порта и брокера.",

    // --- НОВЫЕ ТУЛТИПЫ ДЛЯ ЦЕНЫ (ДОБАВИТЬ ЭТО) ---
    tooltipPriceSimple: `Со всеми расходами до Владивостока, включая таможенные пошлины, утилизационный сбор и услуги брокера.<br><br><strong>Больше ни за что платить не нужно.</strong>`,
    
    tooltipPriceAuction: `Цена указана "под ключ" во Владивостоке. Рассчитана из статистики за 3 месяца.<br><br><span style="color:#16A34A; font-weight:700;">Выгода</span> рассчитана относительно средней рыночной цены аналогичного авто в наличии в РФ.`
};

/* =========================================
   МОБИЛЬНОЕ МЕНЮ (ШАПКА)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const burgerBtn = document.getElementById('burgerBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    // Функция открытия/закрытия
    function toggleMenu(show) {
        if (!mobileMenu) return;
        
        if (show) {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden'; // Блокируем прокрутку сайта
        } else {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = ''; // Разблокируем
        }
    }

    if (burgerBtn) {
        burgerBtn.addEventListener('click', () => toggleMenu(true));
    }

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', () => toggleMenu(false));
    }
});


/* ==========================================================================
   MOBILE UTILS (Шторки и Перенос блоков)
   ========================================================================== */

// 1. Функция открытия Шторки (Bottom Sheet)
function openBottomSheet(htmlContent) {
    let sheet = document.getElementById('mobileBottomSheet');
    let overlay = document.getElementById('mobileSheetOverlay');
    
    // Если шторки нет в HTML, создаем её на лету
    if (!sheet) {
        const body = document.body;
        
        overlay = document.createElement('div');
        overlay.id = 'mobileSheetOverlay';
        overlay.className = 'bottom-sheet-overlay';
        overlay.onclick = closeBottomSheet; // Клик по фону закрывает
        
        sheet = document.createElement('div');
        sheet.id = 'mobileBottomSheet';
        sheet.className = 'bottom-sheet';
        
        body.appendChild(overlay);
        body.appendChild(sheet);
    }
    
    // Вставляем: Заголовок + Текст + Кнопку "Понятно"
    sheet.innerHTML = `
        <div class="sheet-handle"></div>
        <div class="sheet-content">
            <h3>Информация о цене</h3>
            
            <div class="sheet-text-body">
                ${htmlContent}
            </div>

            <button class="btn btn-primary btn-full" onclick="closeBottomSheet()" style="margin-top: 25px; width: 100%;">
                Понятно
            </button>
        </div>
    `;
    
    // Показываем (анимация)
    overlay.style.display = 'block';
    sheet.style.display = 'block';
    
    setTimeout(() => {
        overlay.classList.add('active');
        sheet.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }, 10);
}

// 2. Функция закрытия Шторки
function closeBottomSheet() {
    const sheet = document.getElementById('mobileBottomSheet');
    const overlay = document.getElementById('mobileSheetOverlay');
    
    if (sheet && overlay) {
        sheet.classList.remove('active');
        overlay.classList.remove('active');
        
        document.body.style.overflow = ''; // Разблокируем скролл
        
        // Ждем окончания анимации (0.3s) перед скрытием
        setTimeout(() => {
            sheet.style.display = 'none';
            overlay.style.display = 'none';
        }, 300);
    }
}


/* === МОБИЛЬНЫЕ КРОШКИ (Хлебные крошки -> Кнопка Назад) === */
function initMobileBreadcrumbs() {
    // Проверяем, что это мобилка (ширина <= 768px)
    if (window.innerWidth <= 768) {
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) {
            // Заменяем весь HTML внутри на одну ссылку
            breadcrumbs.innerHTML = `
                <a href="catalog.html" class="mobile-back-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5"></path>
                        <path d="M12 19l-7-7 7-7"></path>
                    </svg>
                    <span>Назад в каталог</span>
                </a>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Получаем ID из URL
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');
    

    if (!carId) {
        console.error('ID не найден');
        showCarNotFound();
        return;
    }

    // 2. Загружаем карточку по ID
    fetch(`${CARD_CARS_API_BASE}/${encodeURIComponent(carId)}?v=${Date.now()}`)
        .then(response => {
            if (response.status === 404) {
                showCarNotFound();
                return null;
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            const car = data?.car || null;
            if (!car) {
                showCarNotFound();
                return;
            }

            initMobileBreadcrumbs();
            renderHeaderInfo(car);
            renderGallery(car); 
            renderDescription(car);
            renderSpecs(car);   
            renderAccidents(car);
            renderSidebar(car);
            adaptLayoutForMobile();
            initMobileSwipeGallery(car);
            initScrollTopButton();
        })
        .catch(error => {
            console.error('Ошибка:', error);
            const titleEl = document.getElementById('pageTitle');
            if (titleEl) titleEl.textContent = 'Ошибка загрузки';
            document.title = 'Ошибка загрузки - DipTrade';
        });
});

function showCarNotFound() {
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = 'Автомобиль не найден';
    document.title = 'Автомобиль не найден - DipTrade';
}

function formatVinPreview(vin) {
    const normalized = String(vin || '').trim().toUpperCase();
    if (!normalized) return 'Не указан';
    if (normalized.length <= 8) {
        return `...${normalized.slice(-4)}`;
    }
    return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}

/**
 * Нормализация текста (убирает _ и лишние пробелы)
 */
function normalizeTitle(str) {
    if (!str) return '';
    return str
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Вывод шапки, ID, даты и хлебных крошек
 */
function renderHeaderInfo(car) {
    const titleSource =
        car.web_title ||
        `${car.brand || ''} ${car.model || ''}`.trim() ||
        `Автомобиль #${car.id}`;
    const cleanTitle = normalizeTitle(titleSource);

    // 1. Meta Title (вкладка браузера)
    document.title = `${cleanTitle} — DipTrade`;

    // 2. Заголовок H1
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = cleanTitle;

    // 3. Хлебные крошки (Последний пункт)
    const breadcrumbEl = document.getElementById('breadcrumbTitle');
    if (breadcrumbEl) breadcrumbEl.textContent = cleanTitle;

    // 4. ID
    const idEl = document.getElementById('carId');
    if (idEl) idEl.textContent = `ID: ${car.id}`;

    // 5. Дата (формат ДД.ММ.ГГГГ)
    const dateEl = document.getElementById('carDate');
    if (dateEl && car.added_at) {
        const dateObj = new Date(car.added_at);
        const formattedDate = dateObj.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        dateEl.textContent = `Обновлено: ${formattedDate}`;
    }
}

/**
 * ЭТАП 2. ГАЛЕРЕЯ (С навигацией)
 * Отрисовка фото, миниатюр и логика стрелок
 */
let currentPhotoIndex = 0; // Глобальная переменная для текущего индекса фото
let carPhotos = [];        // Массив фото текущего авто
let assetsFolder = '';     // Папка с фото

function renderGallery(car) {
    const mainImg = document.getElementById('mainImage');
    const thumbsContainer = document.getElementById('galleryThumbs');
    const prevBtn = document.getElementById('prevImgBtn');
    const nextBtn = document.getElementById('nextImgBtn');

    if (!car.photos || car.photos.length === 0) return;

    // Инициализируем данные
    carPhotos = car.photos;
    assetsFolder = `${CARD_API_BASE}/assets/cars/${car.assets_folder}`;
    currentPhotoIndex = 0;

    // 1. Генерируем миниатюры
    thumbsContainer.innerHTML = '';
    carPhotos.forEach((photo, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'thumb';
        // Добавляем data-index, чтобы знать, на что нажали
        thumb.dataset.index = index; 
        
        const img = document.createElement('img');
        img.src = `${assetsFolder}/${photo}`;
        img.alt = `Фото ${index + 1}`;
        thumb.appendChild(img);

        // Клик по миниатюре вызывает общую функцию обновления
        thumb.addEventListener('click', () => {
            updateGalleryState(index);
        });

        thumbsContainer.appendChild(thumb);
    });

    // 2. Навешиваем обработчики на стрелки
    prevBtn.addEventListener('click', () => {
        let newIndex = currentPhotoIndex - 1;
        // Зацикливаем: если меньше нуля, идем в конец
        if (newIndex < 0) newIndex = carPhotos.length - 1;
        updateGalleryState(newIndex);
    });

    nextBtn.addEventListener('click', () => {
        let newIndex = currentPhotoIndex + 1;
        // Зацикливаем: если больше последнего, идем в начало
        if (newIndex >= carPhotos.length) newIndex = 0;
        updateGalleryState(newIndex);
    });

    // 3. Запускаем начальное состояние (первое фото)
    updateGalleryState(0);
}

function renderDescription(car) {
    const container = document.getElementById('descriptionContainer');
    if (!container) return;

    const description = String(car?.description || '').trim();
    if (!description) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = '';

    const box = document.createElement('div');
    box.className = 'content-box description-box';

    const title = document.createElement('h2');
    title.className = 'box-title';
    title.textContent = 'Описание автомобиля';

    const text = document.createElement('div');
    text.className = 'description-text';
    text.textContent = description;

    box.appendChild(title);
    box.appendChild(text);

    container.innerHTML = '';
    container.appendChild(box);
}

/**
 * Главная функция обновления галереи
 * Меняет большое фото и активную миниатюру по индексу
 */
function updateGalleryState(index) {
    currentPhotoIndex = index;
    const mainImg = document.getElementById('mainImage');
    const thumbs = document.querySelectorAll('.thumb');
    const counter = document.getElementById('photoCounter'); // <-- Находим счетчик

    // 1. Меняем фото
    if (mainImg) mainImg.src = `${assetsFolder}/${carPhotos[index]}`;

    // 2. Обновляем счетчик (например: "2 / 15")
    if (counter) {
        counter.textContent = `${index + 1} / ${carPhotos.length}`;
    }

    // 3. Активная миниатюра
    thumbs.forEach(t => t.classList.remove('active'));
    if (thumbs[index]) {
        thumbs[index].classList.add('active');
        thumbs[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

/**
 * ЭТАП 3. ХАРАКТЕРИСТИКИ
 */
function renderSpecs(car) {
    const container = document.getElementById('specsContainer');
    if (!container) return;
    const specs = car.specs || {};
    const vinPreview = formatVinPreview(car.vin);
    const isFullTime = Boolean(car.full_time || specs.is_4wd);
    const mileageKm = getSpecsMileageKm(specs);
    const fuelLabel = getSpecsFuelLabel(specs);
    const engineVolumeCc = getSpecsEngineVolumeCc(specs);
    const powerHp = getSpecsPowerHp(specs);

    const specsMap = [
        { label: 'Марка', value: car.brand },
        { label: 'Модель', value: car.model },
        { 
            label: 'Год выпуска', 
            value: car.year + (car.month ? ` / ${car.month}` : '') 
        },
        {
            label: 'Пробег',
            value: mileageKm ? `${formatNumber(mileageKm)} км` : 'Не указан'
        },
        { label: 'Тип топлива', value: fuelLabel || 'Не указан' },
        { 
            label: 'Коробка передач', 
            value: specs.transmission || 'Автомат' // В JSON часто null, ставим дефолт или берем из базы
        },
        { label: 'Тип кузова', value: car.body_type || 'Не указан' }, // Если поля нет в JSON
        { label: 'Цвет', value: car.color || 'Не указан' },             // Если поля нет в JSON
        {
            label: 'Объем двигателя',
            value: engineVolumeCc ? `${(engineVolumeCc / 1000).toFixed(1)} л` : '-'
        },
        {
            label: 'Мощность двигателя',
            value: powerHp ? `${powerHp} л.с.` : '-'
        },
        { label: 'Полный привод', value: isFullTime ? 'Да' : 'Нет' },
        { label: 'VIN', value: vinPreview, alwaysShow: true }
    ];

    let html = '';

    specsMap.forEach(item => {
        // Если значение есть (не null, не undefined и не пустая строка), выводим
        if (item.alwaysShow || (item.value && item.value !== 'Не указан' && item.value !== '-')) {
            html += `
            <div class="spec-row-line">
                <span class="s-label">${item.label}</span>
                <span class="s-val">${item.value}</span>
            </div>
            `;
        }
    });

    container.innerHTML = html;
}

// Вспомогательная функция для пробелов в цифрах (10000 -> 10 000)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function getSpecsPowerHp(specs = {}) {
    const value = Number(specs.power_hp);
    return Number.isFinite(value) ? value : 0;
}

function getSpecsEngineVolumeCc(specs = {}) {
    const value = Number(specs.engine_volume_cc);
    return Number.isFinite(value) ? value : 0;
}

function getSpecsMileageKm(specs = {}) {
    const value = Number(specs.mileage_km);
    return Number.isFinite(value) ? value : 0;
}

function getSpecsFuelLabel(specs = {}) {
    const engineType = String(specs.engine_type || '').toLowerCase();
    if (engineType === 'gasoline') return 'Бензин';
    if (engineType === 'diesel') return 'Дизель';
    if (engineType === 'hybrid' || engineType === 'par_hybrid') return 'Гибрид';
    if (engineType === 'electric') return 'Электро';
    if (engineType === 'lpg') return 'LPG';
    return '';
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatRubAmount(value, fallback = '-- ₽') {
    if (value === null || value === undefined || value === '') return fallback;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return `${formatNumber(Math.round(numeric))} ₽`;
}

function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getPublicPricing(car) {
    return car && typeof car.public_pricing === 'object' ? car.public_pricing : null;
}

function formatRateRub(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '';
    return `${numeric.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} ₽`;
}

function formatPublicLocalAmount(value, publicPricing, fallback = '--') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    const symbol = String(publicPricing?.currency?.symbol || '').trim();
    const amount = numeric.toLocaleString('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return symbol ? `${amount} ${symbol}` : amount;
}

function getUsedRateLabel(entry) {
    const code = String(entry?.code || '').trim().toUpperCase();
    if (code === 'KRW') return '1000 ₩';
    if (code === 'CNY') return '1 ¥';
    if (code === 'EUR') return '1 €';
    return code || 'Курс';
}

function renderUsedRatesInline(publicPricing) {
    const rawRates = Array.isArray(publicPricing?.rates) ? publicPricing.rates : [];
    const entries = rawRates
        .filter((entry) => entry && Number.isFinite(Number(entry.value)))
        .map((entry) => {
            const left = getUsedRateLabel(entry);
            return `${left} - ${formatRateRub(entry.value)}`;
        });

    if (!entries.length) return '';

    return `
        <div class="calc-used-rates">
            <div class="calc-used-rates__title">Использованные курсы</div>
            <div class="calc-used-rates__grid">
                ${entries.map((value) => `<div class="calc-used-rates__item">${escapeHtml(value)}</div>`).join('')}
            </div>
        </div>
    `;
}

function buildCalculatorSections(car) {
    const publicPricing = getPublicPricing(car);
    const breakdown = publicPricing && typeof publicPricing.breakdown === 'object' ? publicPricing.breakdown : null;
    const purchase = publicPricing && typeof publicPricing.purchase === 'object' ? publicPricing.purchase : null;
    const servicesLocal = publicPricing && typeof publicPricing.services_local === 'object' ? publicPricing.services_local : null;
    const hasBreakdown = Boolean(breakdown && typeof breakdown.grand_total === 'number');
    const priceTotal = formatRubAmount((breakdown && breakdown.grand_total) ?? car.price, formatPrice(car.price));
    const usedRatesHtml = renderUsedRatesInline(publicPricing);

    if (car.country_code === 'RU') {
        return {
            rowsHTML: `
                ${usedRatesHtml}
                <div class="calc-block-wrapper">
                    <div class="calc-section-title">Автомобиль в России</div>

                    <div class="calc-row">
                        <span class="c-label">Стоимость авто</span>
                        <span class="c-dots"></span>
                        <span class="c-val">${formatPrice(car.price)}</span>
                    </div>

                    <div class="calc-note-box">
                        Автомобиль находится в России. Детальный импортный расчет для этой карточки не применяется.
                    </div>
                </div>
            `,
            footerPrice: priceTotal
        };
    }

    if (!hasBreakdown) {
        return {
            rowsHTML: `
                ${usedRatesHtml}
                <div class="calc-block-wrapper">
                    <div class="calc-section-title">Расчет стоимости</div>
                    <div class="calc-note-box">
                        Детальный расчет для этой карточки сейчас недоступен. Уточните breakdown у менеджера.
                    </div>
                </div>
            `,
            footerPrice: formatPrice(car.price)
        };
    }

    const warnings = Array.isArray(breakdown.warnings) ? breakdown.warnings.filter(Boolean) : [];
    const warningsHtml = warnings.length
        ? `
            <div class="calc-warning-list">
                ${warnings.map((warning) => `<div class="calc-warning-item">${escapeHtml(warning)}</div>`).join('')}
            </div>
        `
        : '';

    const servicesLocalValue = Number(servicesLocal && servicesLocal.amount_local);
    const hasServicesLocal = Number.isFinite(servicesLocalValue) && servicesLocalValue > 0;

    const servicesLocalRowHtml = hasServicesLocal
        ? `
            <div class="calc-row">
                <span class="c-label">Внутренние расходы</span>
                <span class="c-dots"></span>
                <span class="c-val">${escapeHtml(formatPublicLocalAmount(servicesLocalValue, publicPricing))}</span>
            </div>
            <div class="calc-desc-text">Доставка до порта, снятие с учета, экспортная декларация, стоянка.</div>
        `
        : '';

    const extraRows = [];
    if (Number.isFinite(Number(breakdown.services_russia_rub)) && Number(breakdown.services_russia_rub) > 0) {
        extraRows.push(`
            <div class="calc-row">
                <span class="c-label">Услуги во Владивостоке</span>
                <span class="c-dots"></span>
                <span class="c-val">${formatRubAmount(breakdown.services_russia_rub)}</span>
            </div>
            <div class="calc-desc-text">СБКТС, ЭПТС, лаборатория, перегон, стоянка, услуги порта и брокера.</div>
        `);
    }
    if (Number.isFinite(Number(breakdown.commission_rub)) && Number(breakdown.commission_rub) > 0) {
        extraRows.push(`
            <div class="calc-row">
                <span class="c-label">Комиссия Diptrade</span>
                <span class="c-dots"></span>
                <span class="c-val">${formatRubAmount(breakdown.commission_rub)}</span>
            </div>
        `);
    }

    const countryName = car.country_code === 'CN' ? 'в Китае' : 'в Корее';

    return {
        rowsHTML: `
            ${usedRatesHtml}
            ${warningsHtml}

            <div class="calc-block-wrapper">
                <div class="calc-section-title">Покупка и расходы ${countryName}</div>

                <div class="calc-row">
                    <span class="c-label">Стоимость авто</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${escapeHtml(formatPublicLocalAmount(purchase && purchase.amount_local, publicPricing))}</span>
                </div>

                ${servicesLocalRowHtml}

                <div class="calc-row calc-subtotal">
                    <span class="c-label">Итого до РФ</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${formatRubAmount(breakdown.purchase_total_rub)}</span>
                </div>
            </div>

            <div class="calc-block-wrapper">
                <div class="calc-section-title">Таможня и оформление</div>

                <div class="calc-row calc-sub-row">
                    <span class="c-label">Таможенная пошлина</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${formatRubAmount(breakdown.duty_rub)}</span>
                </div>
                <div class="calc-row calc-sub-row">
                    <span class="c-label">Таможенный сбор</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${formatRubAmount(breakdown.customs_fee)}</span>
                </div>
                <div class="calc-row calc-sub-row">
                    <span class="c-label">Утильсбор</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${formatRubAmount(breakdown.util_fee)}</span>
                </div>

                <div class="calc-row calc-subtotal">
                    <span class="c-label">Итого таможня</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${formatRubAmount(breakdown.customs_total)}</span>
                </div>
            </div>

            ${extraRows.length ? `
                <div class="calc-block-wrapper">
                    <div class="calc-section-title">Дополнительно в России</div>
                    ${extraRows.join('')}
                </div>
            ` : ''}
        `,
        footerPrice: priceTotal
    };
}

/**
 * ЭТАП 4. ДАННЫЕ О ДТП
 * Управляет и верхним бейджиком, и нижним блоком отчета
 */
function renderAccidents(car) {
    const reportContainer = document.getElementById('accidentReportContainer');
    const headerBadges = document.getElementById('headerBadges');

    // 1. НАСТРОЙКА: Список стран, для которых мы ВООБЩЕ показываем этот блок
    // Если добавится Япония, просто допишем сюда 'JP'
    const supportedCountries = ['KR'];

    // 2. ПРОВЕРКИ
    // Если страна не поддерживается ИЛИ данных об авариях в JSON нет вообще (null/undefined)
    if (!supportedCountries.includes(car.country_code) || !car.accidents) {
        // Чистим контейнеры и выходим (Блока не будет)
        if (reportContainer) reportContainer.innerHTML = '';
        if (headerBadges) headerBadges.innerHTML = '';
        return;
    }

    // Если мы здесь — значит это Корея (или другая разрешенная страна) и данные есть
    const acc = car.accidents;
    const hasAccidents = acc.count > 0;

    // 1. ВЕРХНИЙ БЕЙДЖИК (Рядом с ID)
    if (headerBadges) {
        if (hasAccidents) {
            headerBadges.innerHTML = `
                <span class="status-badge status-alert">
                    <i>!</i> Были ДТП
                </span>
            `;
        } else {
            headerBadges.innerHTML = `
                <span class="status-badge status-clean">
                    <i>✔</i> Без ДТП
                </span>
            `;
        }
    }

    // 2. ОСНОВНОЙ БЛОК ОТЧЕТА (Внизу)
    if (reportContainer) {
        if (hasAccidents) {
            // ВАРИАНТ: ЕСТЬ ДТП (КРАСНЫЙ)
            reportContainer.innerHTML = `
                <div class="report-orange">
                    <h4>Информация о ДТП</h4>
                    <div class="report-row-line">
                        <span>Страховые случаи:</span>
                        <strong>${acc.count}</strong>
                    </div>
                    <div class="report-row-line">
                        <span>Общая сумма страховых выплат (воны):</span>
                        <strong>${formatNumber(acc.damages_cost_won)} ₩</strong>
                    </div>
                    <div class="report-row-line">
                        <span>Всего (рубли): </span>
                        <strong> ~ ${formatNumber(acc.damages_in_rub)} ₽</strong>
                    </div>
                    
                </div>
            `;
        } else {
            // ВАРИАНТ: ЧИСТО (ЗЕЛЕНЫЙ)
            reportContainer.innerHTML = `
                <div class="car-report report-clean">
                    <div class="report-icon">✔</div>
                    <div class="report-content">
                        <h4>ДТП не найдено</h4>
                        <p>По базе страховых выплат Южной Кореи инцидентов не зафиксировано.</p>
                    </div>
                </div>
            `;
        }
    }
}


/**
 * ЭТАП 5. ПРАВАЯ КОЛОНКА (Сайдбар) - FINAL CLEAN VERSION
 */
function renderSidebar(car) {
    const mainBlock = document.querySelector('.price-main-block');
    
    // Данные
    const isAuction = car.is_auction === true; 
    const benefitAmount = car.auction_benefit || 0; 

    // === 1. ОФОРМЛЕНИЕ ГЛАВНОГО БЛОКА (Рамка, Бейдж) ===
    if (mainBlock) {
        // Сброс классов и удаление старых элементов
        mainBlock.classList.remove('is-auction');
        const oldBadge = mainBlock.querySelector('.auction-label-badge');
        if (oldBadge) oldBadge.remove();

        if (isAuction) {
            mainBlock.classList.add('is-auction');

            // Бейдж "Аукцион"
            const badge = document.createElement('div');
            badge.className = 'auction-label-badge';
            badge.innerHTML = `
                <img src="assets/img/hammer.png" class="badge-hammer-icon" alt="">
                Аукцион
            `;
            mainBlock.prepend(badge);
        }
    }

    // === 2. ГЕНЕРАЦИЯ ЛЕВОЙ КОЛОНКИ (Цена + Логика) ===
    const sbLeft = document.querySelector('.sb-left');
    
    if (sbLeft) {
        sbLeft.innerHTML = ''; // Чистим контент

        if (isAuction) {
            // --- СЦЕНАРИЙ: АУКЦИОН ---
            const wrapper = document.createElement('div');
            wrapper.className = 'price-content-wrapper';

            // Цена
            const priceDiv = document.createElement('div');
            priceDiv.className = 'main-price';
            priceDiv.textContent = formatPrice(car.price);
            wrapper.appendChild(priceDiv);

            // Выгода (капсула)
            if (benefitAmount > 0) {
                const benefitDiv = document.createElement('div');
                benefitDiv.className = 'benefit-row';
                // Используем текст из UI_TEXT для десктопного тултипа
                benefitDiv.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 18l-9.5-9.5-5 5L1 6"></path>
                        <path d="M17 18h6v-6"></path>
                    </svg>
                    <span>Выгода: ${formatNumber(benefitAmount)} ₽</span>
                    
                    <img src="assets/img/icons/info-circle.png" class="benefit-info-icon" alt="i">

                    <div class="tooltip-box">${UI_TEXT.tooltipPriceAuction}</div>
                `;
                
                // === КЛИК ДЛЯ МОБИЛОК (АУКЦИОН) ===
                const icon = benefitDiv.querySelector('.benefit-info-icon');
                if (icon) {
                    icon.addEventListener('click', (e) => {
                        e.stopPropagation(); // Чтобы не сработал клик по карточке, если он есть
                        if (window.innerWidth <= 768) {
                            // Открываем шторку с тем же текстом
                            openBottomSheet(UI_TEXT.tooltipPriceAuction);
                        }
                    });
                }

                wrapper.appendChild(benefitDiv);
            }
            sbLeft.appendChild(wrapper);

        } else {
            // --- СЦЕНАРИЙ: ОБЫЧНОЕ АВТО ---
            const priceDiv = document.createElement('div');
            priceDiv.className = 'main-price';
            priceDiv.textContent = formatPrice(car.price);
            sbLeft.appendChild(priceDiv);

            // Строка "* до Владивостока" + Тултип
            const noteRow = document.createElement('div');
            noteRow.className = 'price-note-row';
            // Используем текст из UI_TEXT
            noteRow.innerHTML = `
                <span>* до Владивостока</span>
                
                <img src="assets/img/icons/info-circle.png" alt="Info" class="info-icon-img">
                
                <div class="tooltip-box">${UI_TEXT.tooltipPriceSimple}</div>
            `;

            // === КЛИК ДЛЯ МОБИЛОК (ОБЫЧНОЕ) ===
            const icon = noteRow.querySelector('.info-icon-img');
            if (icon) {
                icon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.innerWidth <= 768) {
                        openBottomSheet(UI_TEXT.tooltipPriceSimple);
                    }
                });
            }

            sbLeft.appendChild(noteRow);
        }
    }

    // === 3. СТРАНА (Правая часть) ===
    const countryBlock = document.getElementById('countryBlock');
    let countryName = 'Импорт';
    let flagIcon = 'assets/img/flags/default.png';
    if (car.country_code === 'KR') {
        countryName = 'Корея';
        flagIcon = 'assets/img/flags/kr.png';
    } else if (car.country_code === 'CN') {
        countryName = 'Китай';
        flagIcon = 'assets/img/flags/cn.png';
    } else if (car.country_code === 'RU') {
        countryName = 'Россия';
        flagIcon = 'assets/img/flags/ru.png';
    }

    if (countryBlock) {
        countryBlock.innerHTML = `
            <img src="${flagIcon}" alt="${countryName}">
            <span>${countryName}</span>
        `;
    }

    // === 4. ПЛАШКИ (Chips) ===
    const chipsContainer = document.getElementById('statusChips');
    if (chipsContainer) {
        const currentYear = new Date().getFullYear();
        // Используем car.year. Если нужна точность до месяца, нужно поле production_month
        const carYear = car.year; 
        const age = currentYear - carYear;
        
        // Получаем л.с. (пробуем разные поля, так как я не вижу твой JSON прямо сейчас)
        const hp = car.horse_power || getSpecsPowerHp(car.specs || {});
        const hasCustomsBadges = car.country_code !== 'RU';

        let chipsHTML = '';
        
        // Для авто из России таможенные плашки не нужны: машина уже растаможена.
        if (hasCustomsBadges) {
            // 1. ЛОГИКА ВОЗРАСТА (Проходной / Непроходной)
            if (age >= 3 && age <= 5) {
                // Проходной (3-5 лет) -> Зеленый
                chipsHTML += `<span class="chip-status chip-green">Проходной (3-5 лет)</span>`;
            } else if (age < 3) {
                // Новый (< 3 лет) -> Красный
                chipsHTML += `<span class="chip-status chip-red">Высокая ставка (< 3 лет)</span>`;
            } else {
                // Старый (> 5 лет) -> Красный
                chipsHTML += `<span class="chip-status chip-red">Высокая ставка (> 5 лет)</span>`;
            }

            // 2. ЛОГИКА ЛЬГОТЫ (< 160 л.с.)
            if (hp > 0 && hp <= 160) {
                chipsHTML += `<span class="chip-status chip-yellow">Льготный (< 160 л.с.)</span>`;
            }
        }

        // 3. В НАЛИЧИИ
        if (car.in_stock) {
            chipsHTML += `<span class="chip-status chip-stock">В наличии</span>`;
        }
        
        chipsContainer.innerHTML = chipsHTML;
    }

    // === 5. ССЫЛКИ ===
    const tgBtn = document.getElementById('tgLink');
    if (tgBtn) {
        // 1. Формируем текст сообщения (название + ID)
        // car.web_title - это поле из JSON с названием машины
        const msgText = `Здравствуйте! Интересует авто: ${car.web_title} (ID: ${car.id}). Подскажите детали.`;

        // 2. Кодируем текст для URL (превращаем пробелы в %20 и т.д.)
        const encodedText = encodeURIComponent(msgText);

        // 3. Ставим ссылку
        // Ссылка вида https://t.me/username?text=Сообщение
        tgBtn.href = `https://t.me/diptrade_ru?text=${encodedText}`;
    }

    // === 6. КАЛЬКУЛЯТОР ===
    renderCalculator(car);
}

/**
 * ЭТАП 6. КАЛЬКУЛЯТОР (С ШТОРКАМИ ДЛЯ МОБИЛОК)
 */
function renderCalculator(car) {
    const calcContainer = document.getElementById('calcBlock');
    if (!calcContainer) return;
    const calculator = buildCalculatorSections(car);
    const rowsHTML = calculator.rowsHTML;

    // 4. ВСТАВКА В DOM
    calcContainer.innerHTML = `
        <div class="calc-mobile-toggle" onclick="toggleCalc(this)">
            <span class="toggle-title">Детальный расчет</span>
            <svg class="toggle-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        </div>

        <div class="calc-details-wrapper">
            <h3 class="block-title-small desktop-only-title">Расчет стоимости</h3>
            <div class="calc-line desktop-only-line"></div> 
            
            ${rowsHTML}
        </div>
        
        <div class="calc-total-footer">
            <span>Полная стоимость:</span>
            <strong class="total-price-small">${calculator.footerPrice}</strong>
        </div>
    `;

    // 5. ИНИЦИАЛИЗАЦИЯ ТУЛТИПОВ (Мобилка)
    const icons = calcContainer.querySelectorAll('.calc-info-icon[data-tooltip-key]');
    icons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.stopPropagation();
                const key = icon.getAttribute('data-tooltip-key');
                const text = UI_TEXT[key];
                if (text) openBottomSheet(text);
            }
        });
    });
}

// === ФУНКЦИЯ КЛИКА ПО АККОРДЕОНУ ===
window.toggleCalc = function(header) {
    // Ищем родителя (весь блок #calcBlock или .calc-block-wrapper)
    const container = document.getElementById('calcBlock');
    
    // Переключаем класс active (для смены фона и стрелки)
    header.classList.toggle('active');
    
    // Переключаем класс open у контейнера (чтобы показать контент)
    container.classList.toggle('open');
};

// Вспомогательная: Формат цены (1000000 -> 1 000 000 ₽)
function formatPrice(price) {
    if (!price) return 'По запросу';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ' ₽';
}

/* =========================================
   MOBILE LAYOUT MANAGER (Перенос блоков)
   ========================================= */
function adaptLayoutForMobile() {
    const isMobile = window.innerWidth <= 768;

    // Блоки, которые будем двигать
    const priceBlock = document.querySelector('.price-main-block');
    const calcBlock = document.querySelector('#calcBlock'); // Или .calc-block-wrapper
    
    // Якоря (Куда вставлять / Откуда брать)
    const metaRow = document.querySelector('.car-meta-row'); // Вставляем ПОСЛЕ этого блока в Main
    const sidebar = document.querySelector('.car-sidebar');  // Возвращаем СЮДА (в Sidebar)

    if (isMobile) {
        // --- МОБИЛЬНЫЙ РЕЖИМ ---
        // Если блоки существуют и еще не перенесены, вставляем их в .car-main после meta-row
        if (metaRow && priceBlock && metaRow.nextElementSibling !== priceBlock) {
            metaRow.after(priceBlock);
            // Если есть калькулятор, вставляем его после цены
            if (calcBlock) priceBlock.after(calcBlock);
            
            // Визуальная коррекция: убираем тени и границы, чтобы выглядело нативно
            // priceBlock.style.border = 'none';
            // priceBlock.style.boxShadow = 'none';
            // priceBlock.style.padding = '0 4px 20px'; // Чуть меньше отступов
            priceBlock.style.marginBottom = '20px';

            if (calcBlock) {
                //calcBlock.style.border = 'none';
                //calcBlock.style.boxShadow = 'none';
                //calcBlock.style.padding = '0 4px 20px';
                calcBlock.style.marginBottom = '20px';
            }
        }
    } else {
        // --- ПК РЕЖИМ ---
        if (sidebar) {
            if (priceBlock && sidebar.firstElementChild !== priceBlock) {
                sidebar.prepend(priceBlock);
                priceBlock.style.marginBottom = ''; // Сброс
            }
            if (calcBlock && sidebar.contains(priceBlock)) {
                sidebar.appendChild(calcBlock);
                calcBlock.style.marginBottom = ''; // Сброс
            }
        }
    }
}

/* =========================================
   MOBILE GALLERY (Свайп-лента)
   ========================================= */
function initMobileSwipeGallery(car) {
    // 1. Проверяем, мобилка ли это
    if (window.innerWidth > 768) return;

    const galleryContainer = document.querySelector('.car-gallery');
    if (!galleryContainer) return;

    // 2. Если лента уже есть - не создаем дубликатов
    if (document.querySelector('.mobile-gallery-wrapper')) return;

    // 3. Собираем пути к фото
    // Если car.photos нет, ставим заглушку
    const photos = (car.photos && car.photos.length) 
        ? car.photos.map(p => `${CARD_API_BASE}/assets/cars/${car.assets_folder}/${p}`)
        : ['assets/img/placeholder.png'];

    // 4. Создаем HTML структуру ленты
    const wrapper = document.createElement('div');
    wrapper.className = 'mobile-gallery-wrapper';

    // Трак (лента) с картинками
    let slidesHtml = '';
    photos.forEach((src, index) => {
        // loading="lazy" для всех, кроме первой
        const loading = index === 0 ? 'eager' : 'lazy';
        slidesHtml += `<img src="${src}" class="mobile-slide" loading="${loading}" alt="Photo ${index+1}">`;
    });

    wrapper.innerHTML = `
        <div class="mobile-track" id="mobileTrack">
            ${slidesHtml}
        </div>
        <div class="mobile-counter" id="mobileCounter">1 / ${photos.length}</div>
    `;

    // 5. Вставляем в начало блока .car-gallery
    galleryContainer.prepend(wrapper);

    // 6. Слушаем скролл, чтобы обновлять цифры (1/12)
    const track = wrapper.querySelector('#mobileTrack');
    const counter = wrapper.querySelector('#mobileCounter');
    
    track.addEventListener('scroll', () => {
        const width = track.offsetWidth;
        // Вычисляем текущий слайд (округление позиции скролла)
        const current = Math.round(track.scrollLeft / width) + 1;
        counter.textContent = `${current} / ${photos.length}`;
    });
}

/* =========================================
   SCROLL TO TOP BUTTON
   ========================================= */
function initScrollTopButton() {
    const existing = document.querySelector('.scroll-top-btn');
    if (existing) return existing;

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

window.addEventListener('resize', adaptLayoutForMobile);


