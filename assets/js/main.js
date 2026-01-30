document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ЭЛЕМЕНТЫ УПРАВЛЕНИЯ ---
    const burger = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeBtn = document.getElementById('closeMenuBtn');
    const menuLogo = document.querySelector('.menu-logo');
    const links = document.querySelectorAll('.mobile-nav a');
    
    // Шторки и оверлей
    const overlay = document.getElementById('sheetOverlay');
    const infoSheet = document.getElementById('infoSheet'); // Для авто
    const orderSheet = document.getElementById('orderSheet'); // Для формы
    
    const closeSheetBtn = document.getElementById('closeSheetBtn');
    const closeOrderSheetBtn = document.getElementById('closeOrderSheetBtn');

    // --- 2. ЛОГИКА МЕНЮ ---
    const toggleMenu = () => {
        const isActive = mobileMenu.classList.contains('active');
        mobileMenu.classList.toggle('active');
        burger.classList.toggle('active');
        document.body.style.overflow = !isActive ? 'hidden' : '';
        links.forEach((link, index) => {
            link.style.transitionDelay = !isActive ? `${(index + 1) * 0.1}s` : '0s';
        });
    };

    if (burger) burger.addEventListener('click', toggleMenu);
    if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if (menuLogo) menuLogo.addEventListener('click', () => {
        if (mobileMenu && mobileMenu.classList.contains('active')) toggleMenu();
    });
    links.forEach(link => link.addEventListener('click', toggleMenu));

    // --- 3. УНИВЕРСАЛЬНАЯ ЛОГИКА ШТОРОК ---
    const closeAllSheets = () => {
        if (infoSheet) infoSheet.classList.remove('active');
        if (orderSheet) orderSheet.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const openSheet = (sheetElement) => {
        if (!sheetElement || !overlay) return;
        sheetElement.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    if (closeSheetBtn) closeSheetBtn.addEventListener('click', closeAllSheets);
    if (closeOrderSheetBtn) closeOrderSheetBtn.addEventListener('click', closeAllSheets);
    if (overlay) overlay.addEventListener('click', closeAllSheets);


    // --- 4. РЕНДЕРИНГ АВТО (НОВАЯ ЛОГИКА) ---
    const grid = document.getElementById('featured-grid');
    
    // Форматтер цены (1000000 -> 1 000 000 ₽)
    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', { 
            style: 'currency', 
            currency: 'RUB', 
            maximumFractionDigits: 0 
        }).format(price);
    };

    // Форматтер месяца (4 -> Апрель)
    const formatMonth = (monthNum) => {
        if (!monthNum) return '';
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        return months[monthNum - 1] || '';
    };

    if (grid) {
        fetch('data/cars.json')
            .then(res => res.json())
            .then(data => {
                const featured = data.filter(car => car.featured);
                // Перемешиваем
                const shuffled = featured.sort(() => 0.5 - Math.random());
                const isMobile = window.innerWidth < 768;
                // На мобилке показываем все, на ПК только 4
                const selected = isMobile ? shuffled : shuffled.slice(0, 4);

                grid.innerHTML = selected.map(car => {
                    // 1. ФОТО: Собираем путь или ставим заглушку
                    let photoSrc = 'assets/img/no-photo.png';
                    if (car.photos && car.photos.length > 0) {
                        photoSrc = `${car.assets_folder}/${car.photos[0]}`;
                    }

                    // 2. ЗАГОЛОВОК: Web title или Марка+Модель
                    const title = car.web_title || `${car.brand} ${car.model}`;

                    // 3. ФЛАГ: Выбираем картинку
                    let flagIcon = '';
                    if (car.country_code === 'KR') flagIcon = 'assets/img/flag-korea.png';
                    else if (car.country_code === 'CN') flagIcon = 'assets/img/flag-china.png';
                    else if (car.country_code === 'RU') flagIcon = 'assets/img/flag-russia.png';
                    
                    // Если флаг есть — вставляем IMG, иначе ничего
                    const flagHtml = flagIcon ? `<img src="${flagIcon}" class="car-flag-icon" alt="${car.country_code}">` : '';

                    // Форматирование данных
                    const displayPrice = formatPrice(car.price);
                    const displayMonth = car.month ? `${formatMonth(car.month)}, ` : '';
                    const hp = `${car.specs.hp} л.с.`;
                    const fuel = car.specs.fuel;
                    const volume = car.specs.volume > 0 ? `${(car.specs.volume / 1000).toFixed(1)} л` : 'Электро';

                    return `
                    <div class="car-card" onclick="handleCardClick(event, ${car.id})">
                        <div class="car-img-wrap">
                            <img src="${photoSrc}" 
                                 alt="${car.brand}" 
                                 class="car-img" 
                                 loading="lazy"
                                 onerror="this.onerror=null; this.src='assets/img/no-photo.png';">
                            
                            ${flagHtml}
                            
                            ${car.in_stock ? '<div style="position:absolute; top:10px; right:10px; background:#10B981; color:white; font-size:10px; padding:4px 8px; border-radius:6px; font-weight:700; z-index:2;">В наличии</div>' : ''}
                        </div>
                        
                        <div class="car-content">
                            <div class="car-title">${title}</div>
                            
                            <div class="car-specs-text">
                                ${displayMonth}${car.year} • ${volume} • ${hp}<br>
                                ${fuel}
                            </div>
                            
                            <div class="car-footer">
                                <div class="car-price">${displayPrice}</div>
                                <div class="car-info-container">
                                    <span class="car-subprice">до Владивостока</span>
                                    
                                    <div class="info-icon" onclick="handleInfoClick(event)">
                                        <i>i</i>
                                        <div class="tooltip">
                                            Со всеми расходами до Владивостока, включая таможенные пошлины, утилизационный сбор и услуги брокера.
                                            <strong>Больше ни за что платить не нужно.</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }).catch(err => console.error('Ошибка загрузки:', err));
    }


    // --- 5. ОБРАБОТЧИКИ КЛИКОВ (Глобальные) ---
    window.handleCardClick = (event, id) => {
        if (!event.target.closest('.info-icon')) {
            window.location.href = `car.html?id=${id}`;
        }
    };

    window.handleInfoClick = (event) => {
        event.stopPropagation();
        if (window.innerWidth < 768) {
            openSheet(infoSheet);
        }
    };

    // Клик по иконке в ФОРМЕ (используем ID)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#orderInfoBtn')) {
            openSheet(orderSheet);
        }
    });

    // --- 6. ФОРМА ---
    const form = document.querySelector('.actual-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Спасибо! Заявка отправлена.');
            form.reset();
        });
    }

    // --- 7. BACK TO TOP ---
    const backToTop = document.getElementById('backToTop');
    const heroSection = document.querySelector('.hero');
    if (backToTop && heroSection) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > heroSection.offsetHeight) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});