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
                renderGallery(car); // Скоро включим
                // renderSpecs(car);   // Скоро включим
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