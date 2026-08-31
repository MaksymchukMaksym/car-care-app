// ============================================
// АДМІН-ПАНЕЛЬ З FIREBASE
// ============================================

let currentQR = null;
let unsubscribe = null;

// ============================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('⚙️ Адмін-панель завантажено');

  // Підписуємося на зміни в реальному часі
  unsubscribe = listenInstallations((installations) => {
    renderList(installations);
    updateSelect(installations);
  });

  // Форма додавання
  document.getElementById('addForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    await addInstallation();
  });
});

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

  // Перевіряємо чи існує
  const existing = await getInstallation(id);
  if (existing) {
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

  await saveInstallation(newInstallation);
  document.getElementById('addForm').reset();
  alert(`✅ Додано: ${id}`);
}

// ============================================
// ВИДАЛЕННЯ
// ============================================
async function deleteInstallation(id) {
  if (!confirm(`Видалити ${id}?`)) return;
  await deleteInstallation(id);
  document.getElementById('qrResult').classList.remove('show');
}

// ============================================
// ГЕНЕРАЦІЯ QR
// ============================================
async function generateQR() {
  const id = document.getElementById('installSelect').value;
  if (!id) { alert('Виберіть установку'); return; }

  const inst = await getInstallation(id);
  if (!inst) { alert('Установку не знайдено'); return; }

  currentQR = inst;
  createQR(id);
}

function generateTestQR() {
  const id = 'TEST-001';
  currentQR = { id: id, name: 'Тестова установка' };
  createQR(id);
}

function createQR(text) {
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';

  new QRCode(container, {
    text: text,
    width: 250,
    height: 250,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('qrLabel').textContent = `ID: ${text}`;
  document.getElementById('qrResult').classList.add('show');
  document.getElementById('downloadBtn').style.display = 'inline-flex';
  document.getElementById('printBtn').style.display = 'inline-flex';
}

function downloadQR() {
  const canvas = document.querySelector('#qrCodeContainer canvas');
  if (!canvas) { alert('QR не знайдено'); return; }

  const link = document.createElement('a');
  link.download = `QR-${currentQR?.id || 'code'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function printQR() {
  const canvas = document.querySelector('#qrCodeContainer canvas');
  if (!canvas) { alert('QR не знайдено'); return; }

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

  if (!installations || !installations.length) {
    container.innerHTML = '<p style="text-align:center;color:#666;">Немає установок</p>';
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
  const val = select.value;
  select.innerHTML = '<option value="">-- Виберіть --</option>';

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
  document.getElementById('installSelect').value = id;
  await generateQR();
}
