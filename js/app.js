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
// РОБОТА З ДАНИМИ
// ============================================
function getInstallations() {
  try {
    const data = localStorage.getItem('installations');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function getInstallation(id) {
  const installations = getInstallations();
  return installations.find(inst => inst.id === id) || null;
}

// ============================================
// ФУНКЦІЇ СКАНУВАННЯ
// ============================================
function startScanner() {
  console.log('▶️ Запуск сканера...');

  // Отримуємо елементи з перевіркою
  const readerElement = document.getElementById('reader');
  const startBtn = document.getElementById('startScanBtn');
  const stopBtn = document.getElementById('stopScanBtn');

  // ПЕРЕВІРКА: чи існує reader
  if (!readerElement) {
    showResult('Помилка: елемент сканера не знайдено', 'error');
    console.error('❌ Елемент #reader не знайдено!');
    return;
  }

  // ПЕРЕВІРКА: чи підтримує браузер камеру
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showResult('Ваш браузер не підтримує камеру', 'error');
    console.error('❌ Браузер не підтримує камеру');
    return;
  }

  // Якщо вже скануємо - зупиняємо
  if (html5QrCode && isScanning) {
    stopScanner();
    return;
  }

  try {
    // Створюємо сканер
    html5QrCode = new Html5Qrcode("reader");

    const config = {
      fps: 15,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    // Запускаємо сканування
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      onScanError
    ).then(() => {
      isScanning = true;

      // Оновлюємо кнопки (з перевіркою)
      if (startBtn) {
        startBtn.textContent = '⏹ Зупинити';
        startBtn.style.display = 'none';
      }
      if (stopBtn) {
        stopBtn.style.display = 'inline-flex';
      }

      showResult('📷 Сканування запущено... Наведіть камеру на QR-код', 'success');
      console.log('✅ Сканування запущено!');
    }).catch(err => {
      console.error('❌ Помилка запуску камери:', err);
      showResult('Помилка камери: ' + err.message, 'error');

      // Повертаємо кнопки (з перевіркою)
      if (startBtn) {
        startBtn.textContent = '📷 Сканувати QR-код';
        startBtn.style.display = 'inline-flex';
      }
      if (stopBtn) {
        stopBtn.style.display = 'none';
      }
    });
  } catch (error) {
    console.error('❌ Помилка створення сканера:', error);
    showResult('Помилка: ' + error.message, 'error');
  }
}

function stopScanner() {
  console.log('⏹ Зупинка сканера...');

  const startBtn = document.getElementById('startScanBtn');
  const stopBtn = document.getElementById('stopScanBtn');

  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;

      // Оновлюємо кнопки (з перевіркою)
      if (startBtn) {
        startBtn.textContent = '📷 Сканувати QR-код';
        startBtn.style.display = 'inline-flex';
      }
      if (stopBtn) {
        stopBtn.style.display = 'none';
      }

      showResult('⏹ Сканування зупинено', 'success');
      console.log('✅ Сканування зупинено');
    }).catch(err => {
      console.error('❌ Помилка зупинки сканера:', err);
    });
  } else {
    // Якщо сканер не активний - просто оновлюємо кнопки
    if (startBtn) {
      startBtn.textContent = '📷 Сканувати QR-код';
      startBtn.style.display = 'inline-flex';
    }
    if (stopBtn) {
      stopBtn.style.display = 'none';
    }
  }
}

// ============================================
// ОБРОБКА РЕЗУЛЬТАТІВ СКАНУВАННЯ
// ============================================
function onScanSuccess(decodedText, decodedResult) {
  console.log('✅ QR-код знайдено:', decodedText);

  // Зупиняємо сканування
  stopScanner();

  // Показуємо результат
  showResult(`✅ Відскановано: ${decodedText}`, 'success');

  // Перевіряємо чи є установка в базі
  const installation = getInstallation(decodedText);

  if (installation) {
    // Якщо є - переходимо на сторінку
    setTimeout(() => {
      window.location.href = `car.html?id=${encodeURIComponent(decodedText)}`;
    }, 1500);
  } else {
    // Якщо немає - показуємо форму додавання
    setTimeout(() => {
      showAddCarForm(decodedText);
    }, 1500);
  }
}

function onScanError(errorMessage) {
  // Ігноруємо помилки сканування (вони постійні)
  // console.log('Помилка сканування:', errorMessage);
}

// ============================================
// ВІДОБРАЖЕННЯ ПОВІДОМЛЕНЬ
// ============================================
function showResult(message, type = 'success') {
  const resultDiv = document.getElementById('result');
  if (!resultDiv) {
    console.warn('⚠️ Елемент #result не знайдено');
    return;
  }

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
// ФОРМА ДЛЯ ДОДАВАННЯ НОВОЇ УСТАНОВКИ
// ============================================
function showAddCarForm(vin) {
  const resultDiv = document.getElementById('result');
  if (!resultDiv) {
    console.error('❌ Елемент #result не знайдено');
    return;
  }

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

  const form = document.getElementById('carForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('model').value.trim();
      if (!name) {
        alert('Будь ласка, введіть назву');
        return;
      }

      const installations = getInstallations();
      const newInstallation = {
        id: vin,
        name: name,
        model: document.getElementById('carModel').value.trim() || '—',
        year: document.getElementById('year').value.trim() || '—',
        filterDate: document.getElementById('airFilter').value || '',
        createdAt: new Date().toISOString()
      };

      installations.push(newInstallation);
      localStorage.setItem('installations', JSON.stringify(installations));

      showResult(`✅ Установку "${vin}" додано!`, 'success');

      setTimeout(() => {
        window.location.href = `car.html?id=${encodeURIComponent(vin)}`;
      }, 1500);
    });
  }
}

// ============================================
// РУЧНЕ ВВЕДЕННЯ
// ============================================
function openInstallationManual() {
  const input = document.getElementById('manualIdInput');
  if (!input) {
    showResult('Помилка: поле введення не знайдено', 'error');
    console.error('❌ Елемент #manualIdInput не знайдено');
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
// ІНІЦІАЛІЗАЦІЯ ПРИ ЗАВАНТАЖЕННІ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 CarCare PWA завантажено');

  // Перевіряємо наявність всіх елементів
  const elements = {
    startBtn: document.getElementById('startScanBtn'),
    stopBtn: document.getElementById('stopScanBtn'),
    manualInput: document.getElementById('manualIdInput'),
    reader: document.getElementById('reader'),
    result: document.getElementById('result')
  };

  console.log('🔍 Перевірка елементів:', {
    startBtn: !!elements.startBtn,
    stopBtn: !!elements.stopBtn,
    manualInput: !!elements.manualInput,
    reader: !!elements.reader,
    result: !!elements.result
  });

  // Якщо якогось елемента немає - показуємо попередження
  if (!elements.startBtn) {
    console.error('❌ Кнопка startScanBtn не знайдена! Додайте <button id="startScanBtn">');
  }
  if (!elements.stopBtn) {
    console.error('❌ Кнопка stopScanBtn не знайдена! Додайте <button id="stopScanBtn">');
  }
  if (!elements.reader) {
    console.error('❌ Елемент reader не знайдено! Додайте <div id="reader">');
  }

  // Додаємо обробники подій (тільки якщо елементи існують)
  if (elements.startBtn) {
    elements.startBtn.addEventListener('click', startScanner);
  }

  if (elements.stopBtn) {
    elements.stopBtn.addEventListener('click', stopScanner);
  }

  if (elements.manualInput) {
    elements.manualInput.addEventListener('keypress', function(e) {
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
window.showResult = showResult;
window.clearResult = clearResult;
window.getInstallation = getInstallation;
window.getInstallations = getInstallations;
window.showAddCarForm = showAddCarForm;
