# Миграция путей к данным и изображениям

## Обзор

Документ описывает изменения путей к данным и изображениям в проекте DipTrade.

## Текущая структура

Сайт находится в директории:
```
C:\Working_files\Сайт новый по авто\Архитектура сайта_мое\diptrade-tmp\site
```

Данные и изображения находятся в:
```
site/
├── data/
│   └── cars.json
└── assets/
    └── cars/
        └── [папки с изображениями]
```

## Новая структура

Данные и изображения должны находиться в отдельной директории:
```
C:\Working_files\Сайт новый по авто\Архитектура сайта_мое\diptrade-tmp-data\
```

Сайт будет обращаться к:
```
diptrade-tmp-data/
├── data/
│   └── cars.json
└── assets/
    └── cars/
        └── [папки с изображениями]
```

## Изменения в коде

### 1. main.js

**Строка 76** - загрузка данных:
```javascript
// Было:
fetch('data/cars.json?v=' + Date.now())

// Станет:
fetch('../../diptrade-tmp-data/data/cars.json?v=' + Date.now())
```

**Строка 90** - путь к изображениям (уже правильно):
```javascript
// Уже правильно:
photoSrc = `../../diptrade-tmp-data/assets/cars/${car.assets_folder}/${car.photos[0]}`
```

### 2. catalog.js

**Строка 664** - загрузка данных (уже правильно):
```javascript
// Уже правильно:
fetch('../../diptrade-tmp-data/data/cars.json?v=' + Date.now())
```

**Строка 362** - путь к изображениям (уже правильно):
```javascript
// Уже правильно:
car.photos.map(f => `../../diptrade-tmp-data/assets/cars/${car.assets_folder}/${f}`)
```

### 3. card.js

**Строка 167** - загрузка данных:
```javascript
// Было:
fetch('data/cars.json?v=' + Date.now())

// Станет:
fetch('../../diptrade-tmp-data/data/cars.json?v=' + Date.now())
```

**Строка 252** - путь к папке с изображениями:
```javascript
// Было:
assetsFolder = `assets/cars/${car.assets_folder}`;

// Станет:
assetsFolder = `../../diptrade-tmp-data/assets/cars/${car.assets_folder}`;
```

**Строка 940** - путь к изображениям в мобильной галерее:
```javascript
// Было:
car.photos.map(p => `assets/cars/${car.assets_folder}/${p}`)

// Станет:
car.photos.map(p => `../../diptrade-tmp-data/assets/cars/${car.assets_folder}/${p}`)
```

## Сводная таблица изменений

| Файл | Строка | Было | Станет | Статус |
|------|--------|-------|--------|--------|
| main.js | 76 | `fetch('data/cars.json...'` | `fetch('../../diptrade-tmp-data/data/cars.json...'` | ⏳ Нужно изменить |
| main.js | 90 | уже правильно | - | ✅ Готово |
| catalog.js | 362 | уже правильно | - | ✅ Готово |
| catalog.js | 664 | уже правильно | - | ✅ Готово |
| card.js | 167 | `fetch('data/cars.json...'` | `fetch('../../diptrade-tmp-data/data/cars.json...'` | ⏳ Нужно изменить |
| card.js | 252 | `assetsFolder = 'assets/cars/...'` | `assetsFolder = '../../diptrade-tmp-data/assets/cars/...'` | ⏳ Нужно изменить |
| card.js | 940 | `car.photos.map(p => 'assets/cars/...'` | `car.photos.map(p => '../../diptrade-tmp-data/assets/cars/...'` | ⏳ Нужно изменить |

## Требования к новой структуре

Для корректной работы сайта в директории `diptrade-tmp-data` должны быть созданы следующие папки:

```
diptrade-tmp-data/
├── data/
│   └── cars.json
└── assets/
    └── cars/
        └── [папки с изображениями автомобилей]
```

## Примечания

1. Путь `../../diptrade-tmp-data/` означает "выйти на два уровня вверх от текущей директории сайта и зайти в diptrade-tmp-data"
2. Относительный путь используется для того, чтобы сайт работал независимо от того, где он развернут
3. Параметр `?v=' + Date.now()` используется для предотвращения кеширования браузером данных

## Проверка работоспособности

После внесения изменений необходимо проверить:
1. Загрузку данных на главной странице (index.html)
2. Отображение каталога автомобилей (catalog.html)
3. Открытие карточки автомобиля (car.html)
4. Загрузку изображений во всех секциях
