let html5QrCode;
let isScanning = false;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('Service Worker успішно зареєстровано!');
    })
    .catch(error => {
      console.error('Помилка реєстрації Service Worker:', error);
    });
}

document.getElementById('startScanBtn').addEventListener('click', function() {
  if (isScanning) {
    stopScanner();
    return;
  }
  startScanner();
});

function startScanner() {
  const readerElement = document.getElementById('reader');

  html5QrCode = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    onScanSuccess,
    onScanError
  ).then(() => {
    isScanning = true;
    document.getElementById('startScanBtn').textContent = '⏹ Зупинити сканування';
    console.log('Сканування запущено');
  }).catch(err => {
    console.error('Помилка запуску камери:', err);
    alert('Не вдалося отримати доступ до камери. Перевірте дозволи.');
  });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      document.getElementById('startScanBtn').textContent = '📷 Сканувати QR-код';
      console.log('Сканування зупинено');
    }).catch(err => {
      console.error('Помилка зупинки сканера:', err);
    });
  }
}

function onScanSuccess(decodedText, decodedResult) {
  // decodedText — це VIN-код або інші дані з QR-коду
  console.log('QR-код знайдено:', decodedText);

  // Зупиняємо сканування після успішного зчитування
  stopScanner();

  // Шукаємо машину за VIN-кодом
  findCarByVin(decodedText);
}

function onScanError(errorMessage) {
  // Ігноруємо помилки сканування (вони постійні)
  // console.log('Помилка сканування:', errorMessage);
}

function findCarByVin(vin) {
  // Тут ви будете шукати машину в базі даних
  console.log('Шукаємо машину з VIN:', vin);

  // Поки що просто показуємо результат
  document.getElementById('result').innerHTML = `
        <h3>Знайдено VIN: ${vin}</h3>
        <p>Завантаження даних про машину...</p>
    `;

  // Пізніше тут буде запит до бази даних
  loadCarData(vin);
  // Збереження даних про машину
  function saveCarData(vin, data) {
    const cars = JSON.parse(localStorage.getItem('cars') || '{}');
    cars[vin] = {
      ...cars[vin],
      ...data,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('cars', JSON.stringify(cars));
  }

// Отримання даних про машину
  function getCarData(vin) {
    const cars = JSON.parse(localStorage.getItem('cars') || '{}');
    return cars[vin] || null;
  }

// Завантаження даних після сканування
  function loadCarData(vin) {
    const car = getCarData(vin);

    if (car) {
      displayCarInfo(vin, car);
    } else {
      // Якщо машина не знайдена, пропонуємо додати
      showAddCarForm(vin);
    }
  }

// Відображення інформації про машину
  function displayCarInfo(vin, car) {
    document.getElementById('result').innerHTML = `
        <h3>🚗 ${car.model || 'Невідома модель'}</h3>
        <p><strong>VIN:</strong> ${vin}</p>
        <p><strong>Рік:</strong> ${car.year || 'Невідомо'}</p>
        <p><strong>Остання заміна масла:</strong> ${car.oilChange || 'Не вказано'}</p>
        <p><strong>Остання заміна повітряного фільтра:</strong> ${car.airFilter || 'Не вказано'}</p>
        <button onclick="editCarData('${vin}')">✏️ Редагувати</button>
        <button onclick="generateQRCode('${vin}')">📱 Згенерувати QR-код</button>
    `;
  }

  // Показати форму для додавання/редагування даних
  function showAddCarForm(vin) {
    document.getElementById('result').innerHTML = `
        <h3>Нова машина</h3>
        <p><strong>VIN:</strong> ${vin}</p>
        <form id="carForm">
            <label>Модель:</label>
            <input type="text" id="model" placeholder="Наприклад: Toyota Camry"><br>

            <label>Рік випуску:</label>
            <input type="number" id="year" placeholder="2020"><br>

            <label>Дата заміни масла:</label>
            <input type="date" id="oilChange"><br>

            <label>Дата заміни повітряного фільтра:</label>
            <input type="date" id="airFilter"><br>

            <label>Дата заміни паливного фільтра:</label>
            <input type="date" id="fuelFilter"><br>

            <button type="submit">💾 Зберегти</button>
            <button type="button" onclick="clearResult()">❌ Скасувати</button>
        </form>
    `;

    document.getElementById('carForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const data = {
        model: document.getElementById('model').value,
        year: document.getElementById('year').value,
        oilChange: document.getElementById('oilChange').value,
        airFilter: document.getElementById('airFilter').value,
        fuelFilter: document.getElementById('fuelFilter').value
      };

      saveCarData(vin, data);
      loadCarData(vin);
    });
  }

  function editCarData(vin) {
    const car = getCarData(vin);
    if (car) {
      showAddCarForm(vin);
      // Заповнюємо форму існуючими даними
      setTimeout(() => {
        document.getElementById('model').value = car.model || '';
        document.getElementById('year').value = car.year || '';
        document.getElementById('oilChange').value = car.oilChange || '';
        document.getElementById('airFilter').value = car.airFilter || '';
        document.getElementById('fuelFilter').value = car.fuelFilter || '';
      }, 100);
    }
  }

  function clearResult() {
    document.getElementById('result').innerHTML = '';
  }
}
