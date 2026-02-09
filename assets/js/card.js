/* ==========================================================================
   CONFIG & CONSTANTS
   ========================================================================== */
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
        document.title = 'Автомобиль не найден';
        return;
    }

    // 2. Загружаем базу
    fetch('data/cars.json')
        .then(response => response.json())
        .then(cars => {
            const car = cars.find(item => item.id == carId);

            if (car) {
                initMobileBreadcrumbs();
                renderHeaderInfo(car);
                renderGallery(car); 
                renderSpecs(car);   
                renderAccidents(car);
                renderSidebar(car);
                adaptLayoutForMobile();
                initMobileSwipeGallery(car);
                initScrollTopButton();
            } else {
                document.getElementById('pageTitle').textContent = 'Автомобиль не найден';
            }
        })
        .catch(error => console.error('Ошибка:', error));
});

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
    const cleanTitle = normalizeTitle(car.web_title);

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
    assetsFolder = `assets/cars/${car.assets_folder}`;
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

    // Данные могут лежать в корне (car.year) или в car.specs (car.specs.hp)
    // Собираем всё в удобный конфиг. 
    // label: Название строки
    // value: Значение (может быть функцией для сложного форматирования)
    
    const specsMap = [
        { label: 'Марка', value: car.brand },
        { label: 'Модель', value: car.model },
        { 
            label: 'Год выпуска', 
            value: car.year + (car.month ? ` / ${car.month}` : '') 
        },
        { 
            label: 'Пробег', 
            value: car.specs.mileage ? `${formatNumber(car.specs.mileage)} км` : 'Не указан' 
        },
        { label: 'Тип топлива', value: car.specs.fuel },
        { 
            label: 'Коробка передач', 
            value: car.specs.transmission || 'Автомат' // В JSON часто null, ставим дефолт или берем из базы
        },
        { label: 'Тип кузова', value: car.body_type || 'Не указан' }, // Если поля нет в JSON
        { label: 'Цвет', value: car.color || 'Не указан' },             // Если поля нет в JSON
        { 
            label: 'Объем двигателя', 
            value: car.specs.volume ? `${(car.specs.volume / 1000).toFixed(1)} л` : '-' 
        },
        { 
            label: 'Мощность двигателя', 
            value: car.specs.hp ? `${car.specs.hp} л.с.` : '-' 
        }
    ];

    let html = '';

    specsMap.forEach(item => {
        // Если значение есть (не null, не undefined и не пустая строка), выводим
        if (item.value && item.value !== 'Не указан' && item.value !== '-') {
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
    let currency = '';

    if (car.country_code === 'KR') {
        countryName = 'Корея';
        flagIcon = 'assets/img/flags/kr.png';
        currency = '₩';
    } else if (car.country_code === 'CN') {
        countryName = 'Китай';
        flagIcon = 'assets/img/flags/cn.png';
        currency = '¥';
    } else if (car.country_code === 'RU') {
        countryName = 'Россия';
        flagIcon = 'assets/img/flags/ru.png';
        currency = '₽';
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
        const hp = car.horse_power || (car.specs ? car.specs.hp : 0) || 0;

        let chipsHTML = '';
        
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
    renderCalculator(car, currency);
}

/**
 * ЭТАП 6. КАЛЬКУЛЯТОР (С ШТОРКАМИ ДЛЯ МОБИЛОК)
 */
function renderCalculator(car, currency) {
    const calcContainer = document.getElementById('calcBlock');
    if (!calcContainer) return;

    // 1. ИНИЦИАЛИЗАЦИЯ (ПО УМОЛЧАНИЮ — ПРОЧЕРКИ)
    // Если данных не будет, эти значения так и останутся
    let priceLocalStr = '--';
    let internalExpStr = '--';
    
    let dutyVal = '-- ₽';
    let utilVal = '-- ₽';
    let clearanceVal = '-- ₽';
    let servicesVal = '-- ₽';
    
    let customsSumStr = '-- ₽'; // Сумма таможни
    let totalRuStr = '-- ₽';    // Итого РФ

    // 2. ПРОВЕРКА ДАННЫХ
    // Есть ли блок costs в JSON?
    const hasCosts = !!(car.costs && car.costs.russia && car.costs.buyout);

    if (hasCosts) {
        const buyout = car.costs.buyout;
        const ru = car.costs.russia;

        // --- Считаем "ТАМ" (Китай/Корея) ---
        if (buyout.car_price_local) {
            priceLocalStr = formatNumber(buyout.car_price_local) + ` ${currency}`;
        }
        if (buyout.internal_costs_local) {
            internalExpStr = formatNumber(buyout.internal_costs_local) + ` ${currency}`;
        }

        // --- Считаем "ТУТ" (РФ) ---
        const d = ru.duty_rub || 0;              // Пошлина
        const u = ru.recycling_fee_rub || 0;     // Утиль
        const c = ru.customs_clearance_rub || 0; // Оформление
        const s = ru.vladivostok_services_rub || 0; // Услуги Влад.

        // Форматируем отдельные строки
        dutyVal = formatPrice(d);
        utilVal = formatPrice(u);
        clearanceVal = formatPrice(c);
        servicesVal = formatPrice(s);

        // Считаем суммы
        // 1. Таможенные расходы = Пошлина + Утиль + Оформление
        const customsSum = d + u + c;
        customsSumStr = formatPrice(customsSum);

        // 2. Итого расходы РФ = Таможенные расходы + Услуги Владивостока
        const totalRu = customsSum + s;
        totalRuStr = formatPrice(totalRu);
    }
    // Если hasCosts === false, то везде останутся прочерки, как ты и просил.


    // 3. ГЕНЕРАЦИЯ HTML
    let rowsHTML = '';

    // СЦЕНАРИЙ: АВТО ИЗ РОССИИ
    if (car.country_code === 'RU') {
        rowsHTML = `
            <div class="calc-row">
                <span class="c-label">Стоимость авто</span>
                <span class="c-dots"></span>
                <span class="c-val">${formatPrice(car.price)}</span>
            </div>
            <div class="calc-row">
                <span class="c-label">Оформление</span>
                <span class="c-dots"></span>
                <span class="c-val">Включено</span>
            </div>
        `;
    } 
    // СЦЕНАРИЙ: ИМПОРТ (Корея / Китай)
    else {
        const countryName = car.country_code === 'CN' ? 'Китаю' : 'Корее';
        
        rowsHTML = `
            <div class="calc-block-wrapper">
                <div class="calc-section-title">Расходы по ${countryName}</div>
                
                <div class="calc-row">
                    <span class="c-label">Выкуп авто</span>
                    <span class="c-dots"></span>
                    <span class="c-val" style="color:#64748B">${priceLocalStr}</span>
                </div>

                <div class="calc-row">
                    <span class="c-label">
                        Внутренние расходы
                        <div class="calc-tooltip-wrapper">
                            <img src="assets/img/icons/info-circle.png" class="calc-info-icon" alt="i" data-tooltip-key="tooltipKoreaOps">
                            <div class="tooltip-box">${UI_TEXT.tooltipKoreaOps}</div>
                        </div>
                    </span>
                    <span class="c-dots"></span>
                    <span class="c-val">${internalExpStr}</span>
                </div>
            </div>

            <div class="calc-line"></div> 

            <div class="calc-block-wrapper">
                <div class="calc-section-title">Расходы в России</div>

                <div class="calc-subheader-row">
                    <span style="display:flex; align-items:center;">
                        Таможенные расходы
                        <div class="calc-tooltip-wrapper">
                             <div class="tooltip-box">${UI_TEXT.tooltipRussiaCustoms}</div>
                        </div>
                    </span>
                    <span>${customsSumStr}</span>
                </div>

                <div class="calc-row calc-sub-row">
                    <span class="c-label">Таможенная пошлина</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${dutyVal}</span>
                </div>
                <div class="calc-row calc-sub-row">
                    <span class="c-label">Таможенное оформление</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${clearanceVal}</span>
                </div>
                <div class="calc-row calc-sub-row">
                    <span class="c-label">Утильсбор</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${utilVal}</span>
                </div>

                <div class="calc-subheader-row" style="margin-top: 10px;">
                    <span style="display:flex; align-items:center;">
                        Услуги во Владивостоке
                        <div class="calc-tooltip-wrapper">
                            <div class="tooltip-box">${UI_TEXT.tooltipRussiaServices}</div>
                        </div>
                    </span>
                    <span>${servicesVal}</span>
                </div>
                <div class="calc-desc-text">
                    (СБКТС, ЭПТС, лаборатория, перегон, стоянка, услуги порта и брокера)
                </div>

                <div class="calc-row calc-subtotal">
                    <span class="c-label">Итого расходы РФ</span>
                    <span class="c-dots"></span>
                    <span class="c-val">${totalRuStr}</span>
                </div>
            </div>
        `;
    }

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
            <strong class="total-price-small">${formatPrice(car.price)}</strong>
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
        ? car.photos.map(p => `assets/cars/${car.assets_folder}/${p}`)
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