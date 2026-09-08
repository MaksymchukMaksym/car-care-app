console.log('Admin-Panel wird geladen...');

var currentQR = null;

document.addEventListener('DOMContentLoaded', function() {
  if (typeof db === 'undefined') {
    alert('Fehler: Firebase nicht verbunden.');
    return;
  }
  loadInstallations();
  db.collection('installations').onSnapshot(function(snapshot) {
    var installations = [];
    snapshot.forEach(function(doc) {
      installations.push({ id: doc.id, data: doc.data() });
    });
    renderList(installations);
    updateSelect(installations);
  });

  document.getElementById('addForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addInstallation();
  });
});

async function loadInstallations() {
  try {
    var snapshot = await db.collection('installations').get();
    var installations = [];
    snapshot.forEach(function(doc) {
      installations.push({ id: doc.id, data: doc.data() });
    });
    renderList(installations);
    updateSelect(installations);
  } catch (error) {
    console.error('Fehler beim Laden:', error);
  }
}


async function addInstallation() {
  var id = document.getElementById('instId').value.trim();
  var name = document.getElementById('instName').value.trim();

  if (!id || !name) {
    alert('Bitte ID und Name ausfüllen');
    return;
  }

  try {
    var doc = await db.collection('installations').doc(id).get();
    if (doc.exists) {
      alert('ID "' + id + '" existiert bereits!');
      return;
    }

    var newInstallation = {
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
    document.getElementById('addForm').reset();
    alert('Anlage "' + id + '" wurde hinzugefügt!');
  } catch (error) {
    console.error('Fehler:', error);
    alert('Fehler: ' + error.message);
  }
}

async function deleteInstallation(id) {
  if (!confirm(id + ' löschen?')) return;
  try {
    await db.collection('installations').doc(id).delete();
    document.getElementById('qrResult').classList.remove('show');
  } catch (error) {
    alert('Fehler: ' + error.message);
  }
}

async function generateQR() {
  var id = document.getElementById('installSelect').value;
  if (!id) { alert('Bitte Anlage auswählen'); return; }
  try {
    var doc = await db.collection('installations').doc(id).get();
    if (!doc.exists) { alert('Anlage nicht gefunden'); return; }
    currentQR = { id: doc.id, data: doc.data() };
    createQR(id);
  } catch (error) {
    alert('Fehler: ' + error.message);
  }
}

function createQR(text) {
  var container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';
  new QRCode(container, {
    text: text,
    width: 200,
    height: 200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
  document.getElementById('qrLabel').textContent = 'ID: ' + text;
  document.getElementById('qrResult').classList.add('show');
  document.getElementById('downloadBtn').style.display = 'inline-flex';
  document.getElementById('printBtn').style.display = 'inline-flex';
}

function downloadQR() {
  var canvas = document.querySelector('#qrCodeContainer canvas');
  var img = document.querySelector('#qrCodeContainer img');
  var link = document.createElement('a');
  if (canvas) {
    link.download = 'QR-' + (currentQR?.id || 'code') + '.png';
    link.href = canvas.toDataURL('image/png');
  } else if (img) {
    link.download = 'QR-' + (currentQR?.id || 'code') + '.png';
    link.href = img.src;
  } else {
    alert('QR nicht gefunden.');
    return;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printQR() {
  var canvas = document.querySelector('#qrCodeContainer canvas');
  if (!canvas) { alert('QR nicht gefunden'); return; }
  var win = window.open('', '_blank');
  win.document.write(
    '<html><head><title>QR drucken</title></head>' +
    '<body style="text-align:center;padding:50px;font-family:Arial;">' +
    '<img src="' + canvas.toDataURL('image/png') + '" style="max-width:300px;">' +
    '<p style="font-size:20px;font-weight:600;margin-top:20px;">' + (currentQR?.id || '') + '</p>' +
    '<p>' + (currentQR?.data?.name || '') + '</p>' +
    '<script>window.onload = function() { setTimeout(window.print, 500); }<\/script>' +
    '</body></html>'
  );
  win.document.close();
}

function renderList(installations) {
  var container = document.getElementById('installationsList');
  if (!installations || !installations.length) {
    container.innerHTML = '<p style="text-align:center;color:#6b6257;padding:20px;">Keine Anlagen vorhanden</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < installations.length; i++) {
    var item = installations[i].data;
    var id = installations[i].id;
    var filterText = item.filterDate ? new Date(item.filterDate).toLocaleDateString('de-DE') : 'Nicht festgelegt';
    html += '<div class="installation-item">' +
      '<div class="info">' +
      '<div class="name">' + (item.name || '-') + '</div>' +
      '<div class="id">ID: ' + id + ' | Modell: ' + (item.model || '-') + '</div>' +
      '<div class="id">Filter: ' + filterText + ' | Verantwortlich: ' + (item.responsible || '-') + '</div>' +
      '</div>' +
      '<div class="actions">' +
      '<button onclick="selectAndGenerate(\'' + id + '\')" class="btn btn-sm" style="border:1px solid #bfb8ad;border-radius:2px;padding:4px 12px;background:transparent;cursor:pointer;">QR</button>' +
      '<button onclick="deleteInstallation(\'' + id + '\')" class="btn btn-sm" style="border:1px solid #d6c8c3;border-radius:2px;padding:4px 12px;background:transparent;cursor:pointer;color:#6b3d3a;">Löschen</button>' +
      '</div></div>';
  }
  container.innerHTML = html;
}

function updateSelect(installations) {
  var select = document.getElementById('installSelect');
  var val = select.value;
  select.innerHTML = '<option value="">-- Bitte wählen --</option>';
  if (installations) {
    for (var i = 0; i < installations.length; i++) {
      select.innerHTML += '<option value="' + installations[i].id + '">' + installations[i].id + ' - ' + (installations[i].data?.name || '') + '</option>';
    }
  }
  if (val) select.value = val;
}

async function selectAndGenerate(id) {
  document.getElementById('installSelect').value = id;
  await generateQR();
}

window.generateQR = generateQR;
window.downloadQR = downloadQR;
window.printQR = printQR;
window.deleteInstallation = deleteInstallation;
window.selectAndGenerate = selectAndGenerate;
window.addInstallation = addInstallation;
