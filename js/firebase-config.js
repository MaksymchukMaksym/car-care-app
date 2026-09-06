// ============================================
// КОНФІГУРАЦІЯ FIREBASE
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDqA568FmcYPvZWkM0wZx-avyilIIJcWtU",
  authDomain: "carcare-app-83076.firebaseapp.com",
  projectId: "carcare-app-83076",
  storageBucket: "carcare-app-83076.firebasestorage.app",
  messagingSenderId: "19462424604",
  appId: "1:19462424604:web:50cb7450a5b9ec815d77d9"
};

// ============================================
// ІНІЦІАЛІЗАЦІЯ FIREBASE
// ============================================

// Ініціалізація
firebase.initializeApp(firebaseConfig);

// Підключення до Firestore
const db = firebase.firestore();

// 🔄 ВКЛЮЧАЄМО ОФЛАЙН-РЕЖИМ (автоматична синхронізація)
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log('✅ Офлайн-режим увімкнено. Дані синхронізуються автоматично.');
    updateSyncStatus(true);
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Офлайн-режим недоступний (відкрито кілька вкладок)');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Браузер не підтримує офлайн-режим');
    } else {
      console.error('❌ Помилка офлайн-режиму:', err);
    }
    updateSyncStatus(false);
  });

// ============================================
// СТАТУС СИНХРОНІЗАЦІЇ
// ============================================
function updateSyncStatus(isOnline) {
  const statusEl = document.getElementById('syncStatus');
  if (statusEl) {
    statusEl.textContent = isOnline ? '✅ Онлайн • Синхронізовано' : '⚠️ Офлайн • Дані локально';
    statusEl.className = 'sync-status ' + (isOnline ? 'online' : 'offline');
  }
}

// Слухач статусу мережі
window.addEventListener('online', () => {
  console.log('📶 Мережа з\'явилася. Синхронізація...');
  updateSyncStatus(true);
});

window.addEventListener('offline', () => {
  console.log('📶 Мережа зникла. Робота в офлайн-режимі.');
  updateSyncStatus(false);
});

// ============================================
// ФУНКЦІЇ РОБОТИ З FIREBASE
// ============================================

// Отримати всі установки
async function getInstallations() {
  try {
    const snapshot = await db.collection('installations').get();
    const installations = [];
    snapshot.forEach(doc => {
      installations.push(doc.data());
    });
    console.log('📊 Отримано установок:', installations.length);
    return installations;
  } catch (error) {
    console.error('❌ Помилка читання:', error);
    return [];
  }
}

// Отримати одну установку
async function getInstallation(id) {
  try {
    const doc = await db.collection('installations').doc(id).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('❌ Помилка:', error);
    return null;
  }
}

// Додати/оновити установку
async function saveInstallation(installation) {
  try {
    await db.collection('installations').doc(installation.id).set(installation);
    console.log('✅ Збережено:', installation.id);
    return installation;
  } catch (error) {
    console.error('❌ Помилка збереження:', error);
    return null;
  }
}

// Видалити установку
async function deleteInstallation(id) {
  try {
    await db.collection('installations').doc(id).delete();
    console.log('✅ Видалено:', id);
    return true;
  } catch (error) {
    console.error('❌ Помилка видалення:', error);
    return false;
  }
}

// ПІДПИСКА НА ЗМІНИ В РЕАЛЬНОМУ ЧАСІ
function listenInstallations(callback) {
  return db.collection('installations')
    .onSnapshot((snapshot) => {
      const installations = [];
      snapshot.forEach(doc => {
        installations.push(doc.data());
      });
      console.log('🔄 Оновлення даних:', installations.length);
      callback(installations);
      updateSyncStatus(true);
    }, (error) => {
      console.error('❌ Помилка слухача:', error);
      updateSyncStatus(false);
    });
}
// Додайте в КІНЕЦЬ файлу firebase-config.js

console.log('🔥 Firebase ініціалізовано');
console.log('📁 Проєкт:', firebaseConfig.projectId);

// Експортуємо для використання в інших файлах
window.db = db;
window.firebaseConfig = firebaseConfig;

// Тестова функція для перевірки
window.testFirebase = async function() {
  try {
    const testRef = db.collection('test').doc('test');
    await testRef.set({ test: true, timestamp: new Date().toISOString() });
    console.log('✅ Тест успішний!');
    await testRef.delete();
    return true;
  } catch (e) {
    console.error('❌ Помилка тесту:', e);
    return false;
  }
};

// Автоматичний тест
setTimeout(async () => {
  const result = await window.testFirebase();
  console.log('📊 Статус Firebase:', result ? '✅ Підключено' : '❌ Помилка');
}, 1000);
