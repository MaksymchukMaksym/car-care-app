// ============================================
// FIREBASE KONFIGURATION
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDqA568FmcYPvZWkM0wZx-avyilIIJcWtU",
  authDomain: "carcare-app-83076.firebaseapp.com",
  projectId: "carcare-app-83076",
  storageBucket: "carcare-app-83076.firebasestorage.app",
  messagingSenderId: "19462424604",
  appId: "1:19462424604:web:50cb7450a5b9ec815d77d9"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

db.enablePersistence({ synchronizeTabs: true })
  .then(() => console.log('Offline-Modus aktiviert'))
  .catch((err) => console.warn('Offline-Modus nicht verfügbar:', err));

async function getInstallations() {
  try {
    const snapshot = await db.collection('installations').get();
    const installations = [];
    snapshot.forEach(doc => installations.push(doc.data()));
    return installations;
  } catch (error) {
    console.error('Fehler beim Laden:', error);
    return [];
  }
}

async function getInstallation(id) {
  try {
    const doc = await db.collection('installations').doc(id).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Fehler:', error);
    return null;
  }
}

async function saveInstallation(installation) {
  try {
    await db.collection('installations').doc(installation.id).set(installation);
    return installation;
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    return null;
  }
}

async function deleteInstallation(id) {
  try {
    await db.collection('installations').doc(id).delete();
    return true;
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    return false;
  }
}

function listenInstallations(callback) {
  return db.collection('installations')
    .onSnapshot((snapshot) => {
      const installations = [];
      snapshot.forEach(doc => installations.push(doc.data()));
      callback(installations);
    }, (error) => console.error('Listener-Fehler:', error));
}

window.db = db;
window.getInstallations = getInstallations;
window.getInstallation = getInstallation;
window.saveInstallation = saveInstallation;
window.deleteInstallation = deleteInstallation;
window.listenInstallations = listenInstallations;

console.log('Firebase initialisiert');
