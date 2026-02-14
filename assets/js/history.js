document.addEventListener('DOMContentLoaded', () => {
    const historyGrid = document.getElementById('historyGrid');

    // Функция для красивого вывода даты
    const formatSoldDate = (dateStr) => {
        if (!dateStr) return 'Недавно';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Недавно';
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    fetch('data/cars.json?v=' + Date.now())
        .then(res => res.json())
        .then(data => {
            // Фильтруем только проданные авто
            const soldCars = data.filter(car => car.is_sold === true);

            if (soldCars.length === 0) {
                historyGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">История продаж пока пуста.</p>';
                return;
            }

            // Сортировка: сначала новые продажи
            soldCars.sort((a, b) => new Date(b.sold_on || 0) - new Date(a.sold_on || 0));

            historyGrid.innerHTML = soldCars.map(car => {
                // Все расчеты переменных должны быть ВНУТРИ map
                const photoSrc = car.photos && car.photos.length > 0 
                    ? `assets/cars/${car.assets_folder}/${car.photos[0]}` 
                    : 'assets/img/no-photo.png';

                const title = car.web_title || `${car.brand} ${car.model}`;
                const soldDate = formatSoldDate(car.sold_on);

                // Безопасное получение характеристик (фикс ошибки toLocaleString)
                const mileage = car.specs && car.specs.mileage 
                    ? car.specs.mileage.toLocaleString('ru-RU') 
                    : '—';
                const volume = car.specs && car.specs.volume 
                    ? (car.specs.volume / 1000).toFixed(1) 
                    : '—';
                const fuel = car.specs && car.specs.fuel ? car.specs.fuel : '—';
                const hp = car.specs && car.specs.hp ? car.specs.hp : '—';

                // Безопасное форматирование цен
                const priceFormatted = car.price 
                    ? new Intl.NumberFormat('ru-RU').format(car.price) 
                    : '—';
                const benefitFormatted = car.auction_benefit 
                    ? new Intl.NumberFormat('ru-RU').format(car.auction_benefit) 
                    : '0';

                return `
                <div class="case-card">
                    <div class="case-img-side">
                        <img src="${photoSrc}" alt="${title}" loading="lazy">
                        <div class="case-badge">
                            <span class="badge-status">ВЫПОЛНЕН</span>
                            <span class="badge-type">Реальный заказ</span>
                        </div>
                    </div>
                    
                    <div class="case-info-side">
                        <div class="case-header">
                            <div class="case-title-group">
                                <h2 class="case-title">${title}, ${car.year || ''}</h2>
                                <div class="case-specs-text">
                                    ${fuel} · ${volume} л · ${hp} л.с. · ${mileage} км
                                </div>
                            </div>
                            <div class="case-date-group">
                                <span class="date-label">Заказ закрыт:</span>
                                <span class="date-value">${soldDate}</span>
                            </div>
                        </div>

                        <div class="case-footer">
                            <div class="case-finance-group">
                                <div class="price-main">
                                    <span class="price-amount">${priceFormatted} ₽</span>
                                    <span class="price-location">Цена с ПТС во Владивостоке</span>
                                </div>
                                
                                ${car.auction_benefit > 0 ? `
                                <div class="price-saving-row">
                                    <span class="saving-text">Экономия (от рынка РФ):</span>
                                    <span class="saving-value">~ ${benefitFormatted} ₽</span>
                                </div>
                                ` : ''}
                            </div>

                            <div class="case-cta">
                                <a href="/index.html?car=${encodeURIComponent(title)}#order" class="btn-case">Хочу такой же авто</a>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        })
        .catch(err => {
            console.error('Ошибка загрузки данных:', err);
            historyGrid.innerHTML = '<p style="text-align: center;">Не удалось загрузить историю продаж.</p>';
        });
});