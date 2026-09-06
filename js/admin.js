// ============================================
// ADMIN-PANEL MIT FIREBASE
// ============================================

console.log('Admin-Panel wird geladen...');

let currentQR = null;

// ============================================
// INITIALISIERUNG
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM geladen');

  if (typeof db === 'undefined') {
    console.error('Firebase nicht verbunden!');
    alert('Fehler: Firebase nicht verbunden. Bitte prüfen Sie firebase-config.js');
    return;
  }

  console.log('Firebase verbunden');
  loadInstallations();

  db.collection('installations')
    .onSnapshot((snapshot) => {
      const installations = [];
      snapshot.forEach(doc => {
        installations.push({ id: doc.id, ...doc.data() });
      });
      console.log('Daten aktualisiert:', installations.length);
      renderList(installations);
      updateSelect(installations);
    }, (error) => {
      console.error('Listener-Fehler:', error);
    });

  const form = document.getElementById('addForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await addInstallation();
    });
  } else {
    console.error('Formular nicht gefunden!');
  }
});

// ============================================
// ANLAGEN LADEN
// ============================================
async function loadInstallations() {
  try {
    const snapshot = await db.collection('installations').get();
    const installations = [];
    snapshot.forEach(doc => {
      installations.push({ id: doc.id, ...doc.data() });
    });
    renderList(installations);
    updateSelect(installations);
    console.log('Geladen:', installations.length);
  } catch (error) {
    console.error('Fehler beim Laden:', error);
  }
}

// ============================================
// ANLAGE HINZUFÜGEN
// ============================================
async function addInstallation() {
  const id = document.getElementById('instId').value.trim();
  const name = document.getElementById('instName').value.trim();

  if (!id || !name) {
    alert('Bitte ID und Name ausfüllen');
    return;
  }

  try {
    const doc = await db.collection('installations').doc(id).get();
    if (doc.exists) {
      alert('ID "' + id + '" existiert bereits!');
      return;
    }

    const newInstallation = {
      id: id,
      name: name,
      project: document.getElementById('project').value.trim() || '-',
      articleNumber: document.getElementById('articleNumber').value.trim() || '-',
      brand: document.getElementById('brand').value.trim() || '-',
      manufactureDate: document.getElementById('manufactureDate').value || '',
      totalWeight: document.getElementById('totalWeight').value.trim() || '-',
      lvPos: document.getElementById('lvPos').value.trim() || '-',
      capacity: document.getElementById('capacity').value.trim() || '-',
      model: document.getElementById('instModel').value.trim() || '-',
      year: document.getElementById('instYear').value.trim() || '-',
      filterDate: document.getElementById('filterDate').value || '',
      responsible: document.getElementById('responsible').value.trim() || '-',
      notes: document.getElementById('notes').value.trim() || '-',
      createdAt: new Date().toISOString()
    };

    await db.collection('installations').doc(id).set(newInstallation);
    console.log('Gespeichert:', id);

    document.getElementById('addForm').reset();
    alert('Anlage "' + id + '" wurde hinzugefügt!');

  } catch (error) {
    console.error('Fehler:', error);
    alert('Fehler: ' + error.message);
  }
}

// ============================================
// LÖSCHEN
// ============================================
async function deleteInstallation(id) {
  if (!confirm(id + ' löschen?')) return;

  try {
    await db.collection('installations').doc(id).delete();
    console.log('Gelöscht:', id);
    document.getElementById('qrResult').classList.remove('show');
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    alert('Fehler: ' + error.message);
  }
}

// ============================================
// QR-GENERIERUNG
// ============================================
async function generateQR() {
  const select = document.getElementById('installSelect');
  const id = select.value;

  if (!id) {
    alert('Bitte Anlage auswählen');
    return;
  }

  try {
    const doc = await db.collection('installations').doc(id).get();
    if (!doc.exists) {
      alert('Anlage nicht gefunden');
      return;
    }

    currentQR = { id: doc.id, ...doc.data() };
    createQR(id);
  } catch (error) {
    console.error('Fehler:', error);
    alert('Fehler: ' + error.message);
  }
}

function createQR(text) {
  const container = document.getElementById('qrCodeContainer');
  if (!container) {
    console.error('QR-Container nicht gefunden');
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
  if (label) label.textContent = 'ID: ' + text;

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
    alert('QR nicht gefunden. Bitte zuerst generieren.');
    return;
  }

  const link = document.createElement('a');
  link.download = 'QR-' + (currentQR?.id || 'code') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function printQR() {
  const canvas = document.querySelector('#qrCodeContainer canvas');
  if (!canvas) {
    alert('QR nicht gefunden');
    return;
  }

  const win = window.open('', '_blank');
  win.document.write(
    '<html><head><title>QR drucken</title></head>' +
    '<body style="text-align:center;padding:50px;font-family:Arial;">' +
    '<img src="' + canvas.toDataURL('image/png') + '" style="max-width:300px;padding:20px;border:1px solid #ddd;border-radius:10px;">' +
    '<p style="font-size:20px;font-weight:600;margin-top:20px;">' + (currentQR?.id || '') + '</p>' +
    '<p style="color:#666;">' + (currentQR?.name || '') + '</p>' +
    '<p style="color:#999;font-size:14px;">' + (currentQR?.project || '') + '</p>' +
    '<script>window.onload = function() { setTimeout(window.print, 500); }<\/script>' +
    '</body></html>'
  );
  win.document.close();
}

// ============================================
// LISTE ANZEIGEN
// ============================================
function renderList(installations) {
  var container = document.getElementById('installationsList');
  if (!container) {
    console.error('Listen-Container nicht gefunden');
    return;
  }

  if (!installations || !installations.length) {
    container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Keine Anlagen vorhanden</p>';
    return;
  }

  var html = '';
  for (var i = 0; i < installations.length; i++) {
    var item = installations[i];
    var filterText = 'Nicht festgelegt';
    if (item.filterDate) {
      var date = new Date(item.filterDate);
      filterText = date.toLocaleDateString('de-DE');
    }
    html +=
      '<div class="installation-item">' +
      '<div class="info">' +
      '<div class="name">' + item.name + '</div>' +
      '<div class="id">ID: ' + item.id + ' | Modell: ' + (item.model || '-') + '</div>' +
      '<div class="id">Filter: ' + filterText + ' | Verantwortlich: ' + (item.responsible || '-') + '</div>' +
      '</div>' +
      '<div class="actions">' +
      '<button onclick="selectAndGenerate(\'' + item.id + '\')" class="btn btn-primary btn-sm">QR</button>' +
      '<button onclick="deleteInstallation(\'' + item.id + '\')" class="btn btn-danger btn-sm">Löschen</button>' +
      '</div>' +
      '</div>';
  }
  container.innerHTML = html;
}

function updateSelect(installations) {
  var select = document.getElementById('installSelect');
  if (!select) {
    console.error('Select nicht gefunden');
    return;
  }

  var val = select.value;
  select.innerHTML = '<option value="">-- Bitte wählen --</option>';

  if (installations) {
    for (var i = 0; i < installations.length; i++) {
      var item = installations[i];
      select.innerHTML += '<option value="' + item.id + '">' + item.id + ' - ' + item.name + '</option>';
    }
  }

  if (val && installations) {
    for (var j = 0; j < installations.length; j++) {
      if (installations[j].id === val) {
        select.value = val;
        break;
      }
    }
  }
}

async function selectAndGenerate(id) {
  var select = document.getElementById('installSelect');
  if (select) select.value = id;
  await generateQR();
}

// ============================================
// EXPORT
// ============================================
window.generateQR = generateQR;
window.downloadQR = downloadQR;
window.printQR = printQR;
window.deleteInstallation = deleteInstallation;
window.selectAndGenerate = selectAndGenerate;
window.loadInstallations = loadInstallations;
window.addInstallation = addInstallation;
