// Firebase SDK
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  GithubAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvkN1g99it3Pi3ctjFG9z829Zwb_RPlqQ",
  authDomain: "twisty-e7978.firebaseapp.com",
  databaseURL: "https://twisty-e7978-default-rtdb.firebaseio.com",
  projectId: "twisty-e7978",
  storageBucket: "twisty-e7978.firebasestorage.app",
  messagingSenderId: "749033034047",
  appId: "1:749033034047:web:e3b5f16048b15d1fec438a",
  measurementId: "G-P9TLFCS90D"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Функция для обновления баланса в интерфейсе
function updateBalanceDisplay(balance) {
  const balanceElement = document.querySelector('.dark-money-amount');
  if (balanceElement) {
    balanceElement.textContent = balance;
  }
}

// Функция создания/обновления пользователя в Firestore
async function createUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      balance: 0,
      createdAt: new Date(),
      lastLogin: new Date()
    });
  } else {
    await setDoc(userRef, {
      lastLogin: new Date()
    }, { merge: true });
  }
}

// Общий слушатель состояния аутентификации
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Текущий пользователь:", user);
    
    try {
      // Создаем/обновляем профиль пользователя
      await createUserProfile(user);
      
      // Подписываемся на изменения баланса
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          updateBalanceDisplay(userData.balance || 0);
        }
      });
      
      // Сохраняем функцию отписки
      window.userBalanceUnsubscribe = unsubscribe;
    } catch (error) {
      console.error("Ошибка при обработке пользователя:", error);
    }
  } else {
    // Пользователь вышел - сбрасываем баланс
    updateBalanceDisplay(0);
    
    // Отписываемся от обновлений
    if (window.userBalanceUnsubscribe) {
      window.userBalanceUnsubscribe();
    }
  }
});

// Авторизация по email/password
const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Успешный вход:", user);
      alert("Вы успешно вошли!");
      window.location.href = "index.html";
    } catch (error) {
      console.log("Ошибка входа:", error.code, error.message);
      alert("Ошибка: " + error.message);
    }
  });
}

// Авторизация через Google
const googleSignInBtn = document.getElementById("googleSignIn");

if (googleSignInBtn) {
  googleSignInBtn.addEventListener("click", async function() {
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Успешный вход через Google:", user);
      alert("Вы успешно вошли через Google!");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Ошибка входа через Google:", error.code, error.message);
      alert("Ошибка при входе через Google: " + error.message);
    }
  });
}

// Авторизация через GitHub
const githubSignInBtn = document.getElementById("GitHubSignIn");

if (githubSignInBtn) {
  githubSignInBtn.addEventListener("click", async function () {
    const provider = new GithubAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Успешный вход через GitHub:", user);
      alert("Вы успешно вошли через GitHub!");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Ошибка входа через GitHub:", error.code, error.message);
      if (error.code === 'auth/account-exists-with-different-credential') {
        alert('Аккаунт уже существует с другими учетными данными.');
      } else {
        alert("Ошибка при входе через GitHub: " + error.message);
      }
    }
  });
}

// Функция для изменения баланса
async function updateBalance(amount) {
  const user = auth.currentUser;
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        balance: amount
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Ошибка обновления баланса:", error);
      return false;
    }
  }
  return false;
}

// Добавим эту функцию в login.js
function updateAuthPanel(user) {
  const logoPanel = document.getElementById('logoPanel');
  if (!logoPanel) return;

  if (user) {
    // Пользователь авторизован - показываем кнопку выхода
    logoPanel.innerHTML = `
      <ul>
        <li><button class="logout-btn" id="logoutBtn">Выйти</button></li>
        <li><a href="Support.html">Тех. Поддержка</a></li>
      </ul>
    `;

    // Добавляем обработчик для кнопки выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await auth.signOut();
          window.location.reload();
        } catch (error) {
          console.error('Ошибка при выходе:', error);
          alert('Не удалось выйти: ' + error.message);
        }
      });
    }
  } else {
    // Пользователь не авторизован - показываем стандартные кнопки
    logoPanel.innerHTML = `
      <ul>
        <li><a href="login.html">Вход</a></li>
        <li><a href="#">Тех. Поддержка</a></li>
      </ul>
    `;
  }
}

// Затем в обработчике onAuthStateChanged добавим вызов этой функции:
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Текущий пользователь:", user);
    updateAuthPanel(user); // Обновляем панель
    
    try {
      // Создаем/обновляем профиль пользователя
      await createUserProfile(user);
      
      // Подписываемся на изменения баланса
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          updateBalanceDisplay(userData.balance || 0);
        }
      });
      
      // Сохраняем функцию отписки
      window.userBalanceUnsubscribe = unsubscribe;
    } catch (error) {
      console.error("Ошибка при обработке пользователя:", error);
    }
  } else {
    // Пользователь вышел - сбрасываем баланс
    updateBalanceDisplay(0);
    updateAuthPanel(null); // Обновляем панель
    
    // Отписываемся от обновлений
    if (window.userBalanceUnsubscribe) {
      window.userBalanceUnsubscribe();
    }
  }
});