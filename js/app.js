// ============================================
// HAUPTSKript MIT FIREBASE
// ============================================

var scanner = null;
var scanning = false;
var unsubscribe = null;

// ============================================
// INITIALISIERUNG
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('CarCare PWA geladen');

  unsubscribe = listenInstallations(function(installations) {
    console.log('Daten aktualisiert:', installations.length);
  });

  document.getElementById('startScanBtn').addEventListener('click', startScanner);
  document.getElementById('stopScanBtn').addEventListener('click', stopScanner);

  var params = new URLSearchParams(window.location.search);
  var id = params.get('id') || params.get('vin');
  if (id) {
    getInstallation(id).then(function(inst) {
      if (inst) {
        window.location.href = 'car.html?id=' + encodeURIComponent(id);
      }
    });
  }
});

// ============================================
// SCANNER
// ============================================
function startScanner() {
  if (!navigator.mediaDevices) {
    showResult('Kamera wird nicht unterstützt', 'error');
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
      {
        fps: 30,
        qrbox: { width: 200, height: 200 }
      },
      onScanSuccess,
      onScanError
    ).then(function() {
      scanning = true;
      document.getElementById('startScanBtn').style.display = 'none';
      document.getElementById('stopScanBtn').style.display = 'inline-flex';
      showResult('Scan läuft …', 'success');
    });
  } catch(e) {
    showResult('Fehler: ' + e.message, 'error');
  }
}

function stopScanner() {
  if (scanner && scanning) {
    scanner.stop().then(function() {
      scanning = false;
      document.getElementById('startScanBtn').style.display = 'inline-flex';
      document.getElementById('stopScanBtn').style.display = 'none';
      showResult('Scan gestoppt', 'success');
    });
  }
}

// ============================================
// ERGEBNISSE VERARBEITEN
// ============================================
async function onScanSuccess(text) {
  console.log('Gescannt:', text);

  if (scanner && scanning) {
    try {
      await scanner.stop();
      scanning = false;
      document.getElementById('startScanBtn').style.display = 'inline-flex';
      document.getElementById('stopScanBtn').style.display = 'none';
    } catch(e) {
      console.error('Stop Fehler:', e);
    }
  }

  var clean = text.trim();
  showResult('Gescannt: ' + clean, 'success');

  var inst = await getInstallation(clean);

  if (inst) {
    setTimeout(function() {
      window.location.href = 'car.html?id=' + encodeURIComponent(clean);
    }, 800);
  } else {
    setTimeout(function() {
      showNotFound(clean);
    }, 800);
  }
}

function onScanError(err) {
  // Ignorieren
}

// ============================================
// ANZEIGE
// ============================================
function showResult(msg, type) {
  var el = document.getElementById('result');
  el.textContent = msg;
  el.className = 'result-box ' + type;
}

function showNotFound(id) {
  var el = document.getElementById('result');
  el.innerHTML =
    '<strong>Anlage "' + id + '" nicht gefunden</strong><br>' +
    '<a href="admin.html" style="color:#5a6a7a;text-decoration:underline;">In Admin-Panel hinzufügen</a>';
  el.className = 'result-box warning';
}
