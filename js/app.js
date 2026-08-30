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
// РОБОТА З ДАНИМИ (ОДИНА БАЗА - installations)
// ============================================

// Отримати всі установки
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

// ============================================
// СТАРІ ФУНКЦІЇ ДЛЯ СУМІСНОСТІ (використовують ту ж базу)
// ============================================
function getCarData(vin) {
  return getInstallation(vin);
}

function saveCarData(vin, data) {
  const existing = getInstallation(vin);
  const installation = {
    id: vin,
    name: data.model || data.name || 'Невідома модель',
    model: data.model || data.carModel || 'Невідомо',
    year: data.year || 'Невідомо',
    oilChange: data.oilChange || '',
    airFilter: data.airFilter || data.filterDate || '',
    fuelFilter: data.fuelFilter || '',
    filterDate: data.filterDate || data.airFilter || '',
    serial: data.serial || '',
    location: data.location || '',
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  saveInstallation(installation);
  return installation;
}

// ============================================
// ФУНКЦІЇ СКАНУВАННЯ
// ============================================
function startScanner() {
  console.log('▶️ Запуск сканера...');

  const readerElement = document.getElementById('reader');
  const startBtn = document.getElementById('startScanBtn');
  const stopBtn = document.getElementById('stopScanBtn');

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
      if (startBtn) {
        startBtn.textContent = '⏹ Зупинити';
        startBtn.style.display = 'none';
      }
      if (stopBtn) {
        stopBtn.style.display = 'inline-flex';
      }
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
  const startBtn = document.getElementById('startScanBtn');
  const stopBtn = document.getElementById('stopScanBtn');

  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      if (startBtn) {
        startBtn.textContent = '📷 Сканувати QR-код';
        startBtn.style.display = 'inline-flex';
      }
      if (stopBtn) {
        stopBtn.style.display = 'none';
      }
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

  stopScanner();
  showResult(`✅ Відскановано: ${decodedText}`, 'success');

  // Шукаємо в БД
  const installation = getInstallation(decodedText);
  console.log('📊 Знайдено в БД:', installation);

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
  // Ігноруємо
}

// ============================================
// ФОРМА ДЛЯ ДОДАВАННЯ
// ============================================
function showAddCarForm(vin) {
  const resultDiv = document.getElementById('result');
  if (!resultDiv) return;

  resultDiv.innerHTML = `
        <div style="padding:15px;background:#fff3cd;border-radius:10px;border:1px solid #ffeeba;">
            <h3 style="color:#856404;margin-bottom:10px;">⚠️ Установка не знайдена</h3>
            <p><strong>ID:</strong> ${vin}</p>
            <p style="color:#666;margin:10px 0;">Додайте нову установку в базу:</p>

            <form id="carForm">
                <div style="margin-bottom:10px;">
                    <label style="display:block;font-weight:500;margin-bottom:5px;">Назва *</label>
                    <input type="text" id="model" placeholder="Вентиляційна установка №1" style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;" required>
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
  resultDiv.className = 'result-box';
  resultDiv.style.display = 'block';

  document.getElementById('carForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('model').value.trim();
    if (!name) {
      alert('Будь ласка, введіть назву');
      return;
    }

    const newInstallation = {
      id: vin,
      name: name,
      model: document.getElementById('carModel').value.trim() || '—',
      year: document.getElementById('year').value.trim() || '—',
      filterDate: document.getElementById('airFilter').value || '',
      createdAt: new Date().toISOString()
    };

    saveInstallation(newInstallation);
    showResult(`✅ Установку "${vin}" додано!`, 'success');

    setTimeout(() => {
      window.location.href = `car.html?id=${encodeURIComponent(vin)}`;
    }, 1500);
  });
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
// РУЧНЕ ВВЕДЕННЯ
// ============================================
function openInstallationManual() {
  const input = document.getElementById('manualIdInput');
  if (!input) {
    showResult('Помилка: поле введення не знайдено', 'error');
    return;
  }

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
// ІНІЦІАЛІЗАЦІЯ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 CarCare PWA завантажено');

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
// ЕКСПОРТ
// ============================================
window.startScanner = startScanner;
window.stopScanner = stopScanner;
window.openInstallationManual = openInstallationManual;
window.showResult = showResult;
window.clearResult = clearResult;
window.getInstallation = getInstallation;
window.getInstallations = getInstallations;
window.saveInstallation = saveInstallation;
window.getCarData = getCarData;
window.saveCarData = saveCarData;
window.showAddCarForm = showAddCarForm;
