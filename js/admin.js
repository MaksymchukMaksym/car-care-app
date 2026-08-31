// ============================================
// АДМІН-ПАНЕЛЬ З FIREBASE
// ============================================

console.log('⚙️ Завантаження адмін-панелі...');

let currentQR = null;

// ============================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM завантажено');

  // Перевіряємо Firebase
  if (typeof db === 'undefined') {
    console.error('❌ Firebase не підключено!');
    alert('Помилка: Firebase не підключено. Перевірте файл firebase-config.js');
    return;
  }

  console.log('✅ Firebase підключено');

  // Завантажуємо список
  loadInstallations();

  // Підписуємося на зміни в реальному часі
  db.collection('installations')
    .onSnapshot((snapshot) => {
      const installations = [];
      snapshot.forEach(doc => {
        installations.push(doc.data());
      });
      console.log('🔄 Оновлення даних:', installations.length);
      renderList(installations);
      updateSelect(installations);
    }, (error) => {
      console.error('❌ Помилка слухача:', error);
    });

  // Форма додавання
  const form = document.getElementById('addForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await addInstallation();
    });
  } else {
    console.error('❌ Форма не знайдена!');
  }
});

// ============================================
// ЗАВАНТАЖЕННЯ СПИСКУ
// ============================================
async function loadInstallations() {
  try {
    const snapshot = await db.collection('installations').get();
    const installations = [];
    snapshot.forEach(doc => {
      installations.push(doc.data());
    });
    renderList(installations);
    updateSelect(installations);
    console.log('📊 Завантажено:', installations.length);
  } catch (error) {
    console.error('❌ Помилка завантаження:', error);
  }
}

// ============================================
// ДОДАВАННЯ УСТАНОВКИ
// ============================================
async function addInstallation() {
  const id = document.getElementById('instId').value.trim();
  const name = document.getElementById('instName').value.trim();

  if (!id || !name) {
    alert('Заповніть ID та назву');
    return;
  }

  try {
    // Перевіряємо чи існує
    const doc = await db.collection('installations').doc(id).get();
    if (doc.exists) {
      alert(`❌ ID "${id}" вже існує!`);
      return;
    }

    const newInstallation = {
      id: id,
      name: name,
      model: document.getElementById('instModel').value.trim() || '—',
      year: document.getElementById('instYear').value.trim() || '—',
      filterDate: document.getElementById('filterDate').value || '',
      createdAt: new Date().toISOString()
    };

    await db.collection('installations').doc(id).set(newInstallation);
    console.log('✅ Збережено:', id);

    document.getElementById('addForm').reset();
    alert(`✅ Установку "${id}" додано!`);

  } catch (error) {
    console.error('❌ Помилка:', error);
    alert('❌ Помилка: ' + error.message);
  }
}

// ============================================
// ВИДАЛЕННЯ
// ============================================
async function deleteInstallation(id) {
  if (!confirm(`Видалити ${id}?`)) return;

  try {
    await db.collection('installations').doc(id).delete();
    console.log('✅ Видалено:', id);
    document.getElementById('qrResult').classList.remove('show');
  } catch (error) {
    console.error('❌ Помилка видалення:', error);
    alert('❌ Помилка: ' + error.message);
  }
}

// ============================================
// ГЕНЕРАЦІЯ QR
// ============================================
async function generateQR() {
  const select = document.getElementById('installSelect');
  const id = select.value;

  if (!id) {
    alert('Виберіть установку');
    return;
  }

  try {
    const doc = await db.collection('installations').doc(id).get();
    if (!doc.exists) {
      alert('Установку не знайдено');
      return;
    }

    currentQR = doc.data();
    createQR(id);
  } catch (error) {
    console.error('❌ Помилка:', error);
    alert('❌ Помилка: ' + error.message);
  }
}

function generateTestQR() {
  const id = 'TEST-001';
  currentQR = { id: id, name: 'Тестова установка' };
  createQR(id);
}

function createQR(text) {
  const container = document.getElementById('qrCodeContainer');
  if (!container) {
    console.error('❌ Контейнер QR не знайдено');
    return;
  }

  container.innerHTML = '';

  new QRCode(container, {
    text: text,
    width: 250,
    height: 250,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  const label = document.getElementById('qrLabel');
  if (label) label.textContent = `ID: ${text}`;

  const result = document.getElementById('qrResult');
  if (result) result.classList.add('show');

  const downloadBtn = document.getElementById('downloadBtn');
  const printBtn = document.getElementById('printBtn');
  if (downloadBtn) downloadBtn.style.display = 'inline-flex';
  if (printBtn) printBtn.style.display = 'inline-flex';
}

function downloadQR() {
  const canvas = document.querySelector('#qrCodeContainer canvas');
  if (!canvas) {
    alert('QR не знайдено. Спочатку згенеруйте його.');
    return;
  }

  const link = document.createElement('a');
  link.download = `QR-${currentQR?.id || 'code'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function printQR() {
  const canvas = document.querySelector('#qrCodeContainer canvas');
  if (!canvas) {
    alert('QR не знайдено');
    return;
  }

  const win = window.open('', '_blank');
  win.document.write(`
        <html><head><title>Друк QR</title></head>
        <body style="text-align:center;padding:50px;font-family:Arial;">
            <img src="${canvas.toDataURL('image/png')}" style="max-width:300px;padding:20px;border:1px solid #ddd;border-radius:10px;">
            <p style="font-size:20px;font-weight:600;margin-top:20px;">${currentQR?.id || ''}</p>
            <p style="color:#666;">${currentQR?.name || ''}</p>
            <script>window.onload = function() { setTimeout(window.print, 500); } <\/script>
        </body></html>
    `);
  win.document.close();
}

// ============================================
// ВІДОБРАЖЕННЯ СПИСКУ
// ============================================
function renderList(installations) {
  const container = document.getElementById('installationsList');
  if (!container) {
    console.error('❌ Контейнер списку не знайдено');
    return;
  }

  if (!installations || !installations.length) {
    container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Немає установок</p>';
    return;
  }

  container.innerHTML = installations.map(i => `
        <div class="installation-item">
            <div class="info">
                <div class="name">${i.name}</div>
                <div class="id">ID: ${i.id} | Модель: ${i.model}</div>
                <div class="id">Фільтр: ${i.filterDate ? new Date(i.filterDate).toLocaleDateString('uk-UA') : 'Не встановлено'}</div>
            </div>
            <div class="actions">
                <button onclick="selectAndGenerate('${i.id}')" class="btn btn-primary btn-sm">📱 QR</button>
                <button onclick="deleteInstallation('${i.id}')" class="btn btn-danger btn-sm">🗑️</button>
            </div>
        </div>
    `).join('');
}

function updateSelect(installations) {
  const select = document.getElementById('installSelect');
  if (!select) {
    console.error('❌ Select не знайдено');
    return;
  }

  const val = select.value;
  select.innerHTML = '<option value="">-- Виберіть установку --</option>';

  if (installations) {
    installations.forEach(i => {
      select.innerHTML += `<option value="${i.id}">${i.id} - ${i.name}</option>`;
    });
  }

  if (val && installations?.find(i => i.id === val)) {
    select.value = val;
  }
}

async function selectAndGenerate(id) {
  const select = document.getElementById('installSelect');
  if (select) select.value = id;
  await generateQR();
}

// ============================================
// ЕКСПОРТ
// ============================================
window.generateQR = generateQR;
window.generateTestQR = generateTestQR;
window.downloadQR = downloadQR;
window.printQR = printQR;
window.deleteInstallation = deleteInstallation;
window.selectAndGenerate = selectAndGenerate;
window.loadInstallations = loadInstallations;
window.addInstallation = addInstallation;
