// Добавляем в начало файла
function updateAuthPanel(user) {
  const logoPanel = document.getElementById('logoPanel');
  if (!logoPanel) return;

  if (user) {
    logoPanel.innerHTML = `
      <ul>
        <li><button class="logout-btn" id="logoutBtn">Выйти</button></li>
        <li><a href="promocodes.html">Промокоды</a></li>
        <li><a href="#">Кейсы</a></li>
        <li><a href="#">Тех. Поддержка</a></li>
      </ul>
    `;

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
    logoPanel.innerHTML = `
      <ul>
        <li><a href="login.html">Вход</a></li>
        <li><a href="registration.html">Регистрация</a></li>
        <li><a href="promocodes.html">Промокоды</a></li>
        <li><a href="#">Кейсы</a></li>
        <li><a href="#">Тех. Поддержка</a></li>
      </ul>
    `;
  }
}

// Затем в обработчике onAuthStateChanged:
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log("Пользователь вошел:", user.email);
    updateAuthPanel(user);
    
    // Остальной код...
  } else {
    console.log("Пользователь вышел");
    updateAuthPanel(null);
    updateBalanceDisplay(0);
    
    // Остальной код...
  }
});

// Импорт необходимых модулей Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Функция для обновления отображения баланса
function updateBalanceDisplay(balance) {
  const balanceElement = document.querySelector('.dark-money-amount');
  if (balanceElement) {
    balanceElement.textContent = balance;
  }
}

// Функция создания профиля пользователя в Firestore
async function createUserProfile(user) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      balance: 0,
      email: user.email,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    console.log("Профиль пользователя создан:", user.uid);
    return true;
  } catch (error) {
    console.error("Ошибка создания профиля:", error);
    return false;
  }
}

// Отслеживание состояния аутентификации
auth.onAuthStateChanged(async (user) => {
  if (user) {
    console.log("Пользователь вошел:", user.email);
    
    // Создаем или обновляем профиль
    await createUserProfile(user);
    
    // Подписываемся на изменения баланса
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        updateBalanceDisplay(data.balance || 0);
      }
    });
    
    // Сохраняем функцию отписки
    window.balanceUnsubscribe = unsubscribe;
  } else {
    console.log("Пользователь вышел");
    updateBalanceDisplay(0);
    
    // Отписываемся от обновлений
    if (window.balanceUnsubscribe) {
      window.balanceUnsubscribe();
    }
  }
});

// Обработчик формы регистрации
document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("registerForm");
  
  if (form) {
    form.addEventListener("submit", async function(event) {
      event.preventDefault();
      
      const email = document.getElementById("e-mail").value;
      const password = document.getElementById("password").value;
      
      if (password.length < 6) {
        alert("Пароль должен быть не менее 6 символов");
        return;
      }
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Создаем профиль с начальным балансом 0
        await createUserProfile(user);
        
        alert("Регистрация успешна!");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Ошибка регистрации:", error.code, error.message);
        alert(`Ошибка регистрации: ${error.message}`);
      }
    });
  }
  
  // Обработчик входа через Google
  const googleSignInBtn = document.getElementById("googleSignIn");
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", async function(e) {
      e.preventDefault();
      
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Создаем профиль, если пользователь новый
        await createUserProfile(user);
        
        alert("Вход через Google успешен!");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Ошибка входа через Google:", error.code, error.message);
        alert(error.code === 'auth/account-exists-with-different-credential' 
          ? "Этот email уже зарегистрирован другим методом" 
          : `Ошибка: ${error.message}`);
      }
    });
  }
  
  // Обработчик входа через Facebook
  const facebookSignInBtn = document.getElementById("facebookSignIn");
  if (facebookSignInBtn) {
    facebookSignInBtn.addEventListener("click", async function(e) {
      e.preventDefault();
      
      try {
        const provider = new FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Создаем профиль, если пользователь новый
        await createUserProfile(user);
        
        alert("Вход через Facebook успешен!");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Ошибка входа через Facebook:", error.code, error.message);
        alert(`Ошибка: ${error.message}`);
      }
    });
  }
});

// Функция для изменения баланса (пример использования)
async function updateUserBalance(amount) {
  const user = auth.currentUser;
  if (!user) {
    console.log("Пользователь не авторизован");
    return false;
  }
  
  try {
    await setDoc(doc(db, "users", user.uid), {
      balance: amount
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Ошибка обновления баланса:", error);
    return false;
  }
}