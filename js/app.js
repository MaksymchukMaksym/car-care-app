// ============================================
// Глобальні змінні
// ============================================
let html5QrCode = null;
let isScanning = false;

// ============================================
// Service Worker
// ============================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('✅ Service Worker зареєстровано'))
    .catch(err => console.error('❌ Помилка SW:', err));
}

// ============================================
// РОБОТА З ДАНИМИ (ОДИНА ОСНОВНА СИСТЕМА)
// ============================================

// Отримати всі установки (машини)
function getInstallations() {
  try {
    const data = localStorage.getItem('installations');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Зберегти всі установки
function saveInstallations(installations) {
  localStorage.setItem('installations', JSON.stringify(installations));
}

// Отримати одну установку за ID
function getInstallation(id) {
  const installations = getInstallations();
  return installations.find(inst => inst.id === id) || null;
}

// Додати або оновити установку
function saveInstallation(installation) {
  const installations = getInstallations();
  const index = installations.findIndex(inst => inst.id === installation.id);

  if (index !== -1) {
    installations[index] = installation;
  } else {
    installations.push(installation);
  }

  saveInstallations(installations);
  return installation;
}

// Видалити установку
function deleteInstallation(id) {
  let installations = getInstallations();
  installations = installations.filter(inst => inst.id !== id);
  saveInstallations(installations);
}

// ============================================
// СТАРІ ФУНКЦІЇ ДЛЯ СУМІСНОСТІ (cars)
// ============================================

// Отримати дані про машину (використовуємо ту ж базу)
function getCarData(vin) {
  return getInstallation(vin);
}

// Зберегти дані про машину
function saveCarData(vin, data) {
  const existing = getInstallation(vin);
  const installation = {
    id: vin,
    name: data.model || 'Невідома модель',
    model: data.model || 'Невідомо',
    year: data.year || 'Невідомо',
    oilChange: data.oilChange || '',
    airFilter: data.airFilter || '',
    fuelFilter: data.fuelFilter || '',
    filterDate: data.airFilter || data.filterDate || '',
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  saveInstallation(installation);
  return installation;
}

// ============================================
// ФУНКЦІЇ СКАНУВАННЯ
// ============================================

function startScanner() {
  const readerElement = document.getElementById('reader');

  if (!readerElement) {
    showResult('Помилка: елемент сканера не знайдено', 'error');
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showResult('Ваш браузер не підтримує камеру', 'error');
    return;
  }

  if (html5QrCode && isScanning) {
    stopScanner();
    return;
  }

  try {
    html5QrCode = new Html5Qrcode("reader");

    const config = {
      fps: 15,
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
      document.getElementById('startScanBtn').textContent = '⏹ Зупинити';
      document.getElementById('startScanBtn').style.display = 'none';
      document.getElementById('stopScanBtn').style.display = 'inline-flex';
      showResult('📷 Сканування запущено...', 'success');
    }).catch(err => {
      console.error('Помилка запуску:', err);
      showResult('Помилка камери: ' + err.message, 'error');
    });
  } catch (error) {
    console.error('Помилка створення сканера:', error);
    showResult('Помилка: ' + error.message, 'error');
  }
}

function stopScanner() {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      document.getElementById('startScanBtn').textContent = '📷 Сканувати QR-код';
      document.getElementById('startScanBtn').style.display = 'inline-flex';
      document.getElementById('stopScanBtn').style.display = 'none';
      showResult('⏹ Сканування зупинено', 'success');
    }).catch(err => {
      console.error('Помилка зупинки:', err);
    });
  }
}

// ============================================
// ОБРОБКА РЕЗУЛЬТАТІВ СКАНУВАННЯ
// ============================================

function onScanSuccess(decodedText, decodedResult) {
  console.log('✅ QR-код знайдено:', decodedText);

  // Зупиняємо сканування
  stopScanner();

  // Показуємо що знайшли
  showResult(`✅ Відскановано: ${decodedText}`, 'success');

  // Шукаємо в базі
  const installation = getInstallation(decodedText);

  if (installation) {
    // Якщо є - переходимо на сторінку
    setTimeout(() => {
      window.location.href = `car.html?id=${encodeURIComponent(decodedText)}`;
    }, 1500);
  } else {
    // Якщо немає - пропонуємо додати
    setTimeout(() => {
      showAddCarForm(decodedText);
    }, 1500);
  }
}

function onScanError(errorMessage) {
  // Ігноруємо - це нормально
}

// ============================================
// ВІДОБРАЖЕННЯ ФОРМИ ДЛЯ ДОДАВАННЯ
// ============================================

function showAddCarForm(vin) {
  const resultDiv = document.getElementById('result');
  if (!resultDiv) return;

  resultDiv.innerHTML = `
        <div style="padding:15px;">
            <h3 style="color:#856404;">⚠️ Установка не знайдена</h3>
            <p>ID: <strong>${vin}</strong></p>
            <p style="color:#666;margin:10px 0;">Додайте нову установку:</p>

            <form id="carForm">
                <div style="margin-bottom:10px;">
                    <label style="display:block;font-weight:500;margin-bottom:5px;">Назва *</label>
                    <input type="text" id="model" placeholder="Вентиляційна установка №1" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="display:block;font-weight:500;margin-bottom:5px;">Модель</label>
                    <input type="text" id="carModel" placeholder="Ventilator Pro 2000" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="display:block;font-weight:500;margin-bottom:5px;">Рік випуску</label>
                    <input type="number" id="year" placeholder="2024" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="display:block;font-weight:500;margin-bottom:5px;">Дата заміни фільтра</label>
                    <input type="date" id="airFilter" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;">
                    <button type="submit" style="flex:1;padding:12px;background:#667eea;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">💾 Зберегти</button>
                    <button type="button" onclick="clearResult()" style="flex:1;padding:12px;background:#e2e8f0;color:#333;border:none;border-radius:8px;font-weight:600;cursor:pointer;">❌ Скасувати</button>
                </div>
            </form>
        </div>
    `;
  resultDiv.className = 'result-box warning';
  resultDiv.style.display = 'block';

  document.getElementById('carForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('model').value.trim();
    if (!name) {
      alert('Будь ласка, введіть назву');
      return;
    }

    const data = {
      model: name,
      carModel: document.getElementById('carModel').value.trim(),
      year: document.getElementById('year').value.trim(),
      airFilter: document.getElementById('airFilter').value,
      filterDate: document.getElementById('airFilter').value
    };

    saveCarData(vin, data);
    showResult(`✅ Установку "${vin}" додано!`, 'success');

    setTimeout(() => {
      window.location.href = `car.html?id=${encodeURIComponent(vin)}`;
    }, 1500);
  });
}

// ============================================
// РУЧНЕ ВВЕДЕННЯ
// ============================================

function openInstallationManual() {
  const input = document.getElementById('manualIdInput');
  if (!input) return;

  const id = input.value.trim();
  if (!id) {
    showResult('Будь ласка, введіть ID установки', 'error');
    return;
  }

  const installation = getInstallation(id);
  if (installation) {
    window.location.href = `car.html?id=${encodeURIComponent(id)}`;
  } else {
    showAddCarForm(id);
  }
}

// ============================================
// ВІДОБРАЖЕННЯ ПОВІДОМЛЕНЬ
// ============================================

function showResult(message, type = 'success') {
  const resultDiv = document.getElementById('result');
  if (!resultDiv) return;

  resultDiv.textContent = message;
  resultDiv.className = 'result-box ' + type;
  resultDiv.style.display = 'block';
}

function clearResult() {
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
  }
}

// ============================================
// НАВІГАЦІЯ
// ============================================

function openInstallationPage(id) {
  if (id) {
    window.location.href = `car.html?id=${encodeURIComponent(id)}`;
  }
}

// ============================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 CarCare PWA завантажено');

  // Кнопки
  const startBtn = document.getElementById('startScanBtn');
  const stopBtn = document.getElementById('stopScanBtn');
  const manualInput = document.getElementById('manualIdInput');

  if (startBtn) {
    startBtn.addEventListener('click', startScanner);
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', stopScanner);
  }

  if (manualInput) {
    manualInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        openInstallationManual();
      }
    });
  }

  // Перевіряємо URL
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id') || urlParams.get('vin');
  if (id) {
    const installation = getInstallation(id);
    if (installation) {
      window.location.href = `car.html?id=${encodeURIComponent(id)}`;
    }
  }
});

// ============================================
// ЕКСПОРТ В ГЛОБАЛЬНИЙ ОБ'ЄКТ
// ============================================

window.startScanner = startScanner;
window.stopScanner = stopScanner;
window.openInstallationManual = openInstallationManual;
window.openInstallationPage = openInstallationPage;
window.showResult = showResult;
window.clearResult = clearResult;
window.getInstallation = getInstallation;
window.getInstallations = getInstallations;
window.saveInstallation = saveInstallation;
window.deleteInstallation = deleteInstallation;
window.getCarData = getCarData;
window.saveCarData = saveCarData;
window.showAddCarForm = showAddCarForm;
window.generateQRCode = function(vin) {
  alert(`📱 Генерація QR-коду для ${vin}\nПерейдіть в адмін-панель: /admin.html`);
};
window.editCarData = function(vin) {
  const car = getCarData(vin);
  if (car) {
    showAddCarForm(vin);
    setTimeout(() => {
      document.getElementById('model').value = car.name || '';
      document.getElementById('carModel').value = car.model || '';
      document.getElementById('year').value = car.year || '';
      document.getElementById('airFilter').value = car.filterDate || '';
    }, 100);
  }
};
