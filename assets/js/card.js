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
                renderHeaderInfo(car);
                renderGallery(car); 
                renderSpecs(car);   
                renderAccidents(car);
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
    assetsFolder = car.assets_folder;
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