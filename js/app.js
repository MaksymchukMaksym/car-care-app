// ============================================
// ГОЛОВНИЙ ДОДАТОК З FIREBASE
// ============================================

let scanner = null;
let scanning = false;
let unsubscribe = null;

// ============================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 CarCare PWA завантажено');

  // Підписуємося на зміни в базі
  unsubscribe = listenInstallations((installations) => {
    console.log('📊 Дані оновлено:', installations.length);
  });

  // Кнопки
  document.getElementById('startScanBtn').addEventListener('click', startScanner);
  document.getElementById('stopScanBtn').addEventListener('click', stopScanner);

  // Ручне введення
  document.getElementById('manualIdInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') openManual();
  });

  // Перевірка URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || params.get('vin');
  if (id) {
    getInstallation(id).then(inst => {
      if (inst) {
        window.location.href = `car.html?id=${encodeURIComponent(id)}`;
      }
    });
  }
});

// ============================================
// СКАНЕР
// ============================================
function startScanner() {
  if (!navigator.mediaDevices) {
    showResult('Браузер не підтримує камеру', 'error');
    return;
  }

  if (scanner && scanning) {
    stopScanner();
    return;
  }

  try {
    scanner = new Html5Qrcode("reader");
    scanner.start(
      { facingMode: "environment" },
      { fps: 15, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      onScanError
    ).then(() => {
      scanning = true;
      document.getElementById('startScanBtn').style.display = 'none';
      document.getElementById('stopScanBtn').style.display = 'inline-flex';
      showResult('📷 Сканування запущено...', 'success');
    });
  } catch(e) {
    showResult('Помилка: ' + e.message, 'error');
  }
}

function stopScanner() {
  if (scanner && scanning) {
    scanner.stop().then(() => {
      scanning = false;
      document.getElementById('startScanBtn').style.display = 'inline-flex';
      document.getElementById('stopScanBtn').style.display = 'none';
      showResult('⏹ Сканування зупинено', 'success');
    });
  }
}

// ============================================
// ОБРОБКА РЕЗУЛЬТАТІВ
// ============================================
async function onScanSuccess(text) {
  console.log('✅ Відскановано:', text);
  stopScanner();

  const clean = text.trim();
  showResult(`✅ Відскановано: ${clean}`, 'success');

  // Шукаємо в Firebase
  const inst = await getInstallation(clean);

  if (inst) {
    setTimeout(() => {
      window.location.href = `car.html?id=${encodeURIComponent(clean)}`;
    }, 1200);
  } else {
    setTimeout(() => {
      showNotFound(clean);
    }, 1200);
  }
}

function onScanError(err) {
  // Ігноруємо
}

// ============================================
// ВІДОБРАЖЕННЯ
// ============================================
function showResult(msg, type) {
  const el = document.getElementById('result');
  el.textContent = msg;
  el.className = 'result-box ' + type;
}

function showNotFound(id) {
  const el = document.getElementById('result');
  el.innerHTML = `
        <strong>⚠️ Установка "${id}" не знайдена</strong><br>
        <a href="admin.html" style="color:#667eea;">Додати в адмін-панелі</a>
    `;
  el.className = 'result-box warning';
}

async function openManual() {
  const id = document.getElementById('manualIdInput').value.trim();
  if (!id) { showResult('Введіть ID', 'error'); return; }

  const inst = await getInstallation(id);
  if (inst) {
    window.location.href = `car.html?id=${encodeURIComponent(id)}`;
  } else {
    showNotFound(id);
  }
}
