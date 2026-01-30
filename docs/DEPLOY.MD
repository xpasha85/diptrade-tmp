Diptrade — работа с сайтом, данными и фото

ОБЩАЯ СХЕМА

- Код сайта (HTML / CSS / JS)
  - обновляется через Git
  - деплой на сервер командой diptrade-deploy

- Данные и файлы
  - cars.json и фото живут отдельно от кода
  - деплоем не затираются

Сервер: 45.128.204.169
Домен: https://diptrade.xpasha85.ru


ГДЕ ЧТО ЛЕЖИТ НА СЕРВЕРЕ

Код сайта:
  /var/www/diptrade/site

Живые данные:
  /var/www/diptrade/runtime/data/cars.json

Фотографии авто:
  /var/www/diptrade/runtime/assets/cars/

Внутри сайта используются символические ссылки:
  site/data        -> runtime/data
  site/assets/cars -> runtime/assets/cars


ОБНОВЛЕНИЕ САЙТА (КОД)

После изменений в коде:

  git push
  ssh root@45.128.204.169 diptrade-deploy

Обновляется только код.
Данные и фото не трогаются.


ЗАЛИВКА CARS.JSON

Команду запускать в папке проекта на компьютере:

  scp data/cars.json root@45.128.204.169:/var/www/diptrade/runtime/data/cars.json

После этого сайт сразу начинает использовать новый JSON.

Проверка:
  curl https://diptrade.xpasha85.ru/data/cars.json


ЗАЛИВКА ФОТОГРАФИЙ

Локально структура:
  assets/cars/
    bmw.jpg
    audi.jpg
    ...

Заливка:
  scp -r assets/cars/* root@45.128.204.169:/var/www/diptrade/runtime/assets/cars/

Файлы с одинаковыми именами будут перезаписаны.


ВХОД НА СЕРВЕР

  ssh root@45.128.204.169

Пароль не требуется (SSH-ключи).


ПРОСМОТР ФОТО НА СЕРВЕРЕ

  cd /var/www/diptrade/runtime/assets/cars
  ls -la


УДАЛИТЬ ВСЕ ФОТО (ОСТОРОЖНО)

  cd /var/www/diptrade/runtime/assets/cars
  rm -rf *

Удаляется всё содержимое папки cars.
Код сайта и cars.json не затрагиваются.


УДАЛИТЬ ОДНУ МАШИНУ (ЕСЛИ ФОТО В ПАПКАХ)

Пример структуры:
  assets/cars/
    123/
    124/

Удаление:
  rm -rf 123


КРАТКАЯ ПАМЯТКА

- git push                — изменения кода
- diptrade-deploy         — выкатка сайта
- scp cars.json ...       — обновить данные
- scp фото ...            — обновить фото
- данные и фото деплоем не затираются