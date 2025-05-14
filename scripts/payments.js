// payment.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  arrayUnion
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Функции уведомлений
function showSuccessPopup(message) {
  const popup = document.createElement('div');
  popup.className = 'popup success';
  popup.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="white" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}

function showErrorPopup(message) {
  const popup = document.createElement('div');
  popup.className = 'popup error';
  popup.innerHTML = `
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="white" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}

// Модальное окно для пополнения
function createPaymentModal() {
  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Пополнение баланса</h2>
      <div class="payment-options">
        <button class="payment-option" data-amount="50">50₽</button>
        <button class="payment-option" data-amount="100">100₽</button>
        <button class="payment-option" data-amount="200">200₽</button>
        <button class="payment-option" data-amount="500">500₽</button>
        <button class="payment-option" data-amount="1000">1000₽</button>
      </div>
      <div class="custom-amount">
        <input type="number" id="customAmount" placeholder="Другая сумма" min="10" max="10000">
        <button id="customPayBtn">Пополнить</button>
      </div>
      <div class="payment-methods">
        <p>Выберите способ оплаты:</p>
        <div class="payment-method selected" data-method="card">
          <img src="img/Cards.png" alt="Банковская карта">
          <span>Карта</span>
        </div>
        <div class="payment-method" data-method="qiwi">
          <img src="img/QIWI.png" alt="QIWI">
          <span>QIWI</span>
        </div>
        <div class="payment-method" data-method="yoomoney">
          <img src="img/Юmoney.png" alt="ЮMoney">
          <span>ЮMoney</span>
        </div>
        <div class="payment-method" data-method="crypto">
          <img src="img/Crypto.png" alt="Криптовалюта">
          <span>Crypto</span>
        </div>
        <h2><br>ВНИМАНИЕ!!!</h2>
        <h3>*Деньги поступают на баланс в течении 1-3 часов!!!</h3>
        <h3>*В сообщении ведите свою почту, на которую у вас зарегестрирован аккаунт в LootLabs!!!</h3>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

// Инициализация системы платежей
function initPaymentSystem() {
  const topUpBtn = document.getElementById('topUpBalance');
  if (!topUpBtn) return;

  let paymentModal = document.getElementById('paymentModal') || createPaymentModal();
  let selectedAmount = 0;
  let selectedMethod = 'card';

  // Открытие модального окна
  topUpBtn.addEventListener('click', () => {
    paymentModal.style.display = 'block';
  });

  // Закрытие модального окна
  paymentModal.querySelector('.close').addEventListener('click', () => {
    paymentModal.style.display = 'none';
  });

  // Выбор суммы
  const amountButtons = paymentModal.querySelectorAll('.payment-option');
  amountButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      amountButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
    });
  });

  // Пользовательская сумма
  const customPayBtn = paymentModal.querySelector('#customPayBtn');
  customPayBtn.addEventListener('click', () => {
    const customAmount = parseInt(paymentModal.querySelector('#customAmount').value);
    if (customAmount >= 10 && customAmount <= 10000) {
      selectedAmount = customAmount;
      amountButtons.forEach(b => b.classList.remove('active'));
      showPaymentConfirmation();
    } else {
      showErrorPopup('Введите сумму от 10 до 10000₽');
    }
  });

  // Выбор метода оплаты
  const methodButtons = paymentModal.querySelectorAll('.payment-method');
  methodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      methodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMethod = btn.dataset.method;
    });
  });

  // Подтверждение платежа
  function showPaymentConfirmation() {
    if (selectedAmount <= 0) {
      showErrorPopup('Выберите сумму для пополнения');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showErrorPopup('Для пополнения баланса необходимо войти в систему');
      window.location.href = 'login.html';
      return;
    }

    // Здесь должна быть интеграция с платежной системой
    // Для демонстрации мы просто добавляем баланс
    processPayment(user.uid, selectedAmount, selectedMethod);
  }

  /* Обработка платежа (демо-версия)
  async function processPayment(userId, amount, method) {
    try {
      // В реальном проекте здесь должен быть запрос к платежному шлюзу
      // Мы имитируем успешный платеж и добавляем баланс
      
      const userRef = doc(db, "users", userId);
      const transactionRef = doc(db, "transactions", `${Date.now()}_${userId}`);
      
      await updateDoc(userRef, {
        balance: increment(amount),
        lastUpdate: serverTimestamp()
      });
      
      await setDoc(transactionRef, {
        userId: userId,
        amount: amount,
        type: 'deposit',
        method: method,
        date: serverTimestamp(),
        status: 'completed'
      });
      
      paymentModal.style.display = 'none';
      showSuccessPopup(`Баланс успешно пополнен на ${amount}₽`);
      
    } catch (error) {
      console.error('Ошибка при пополнении баланса:', error);
      showErrorPopup('Ошибка при пополнении баланса');
    }
  } */

  // Обработка реально

  async function processPayment(userId, amount, method) {
    try {
      // Ссылка на DonationAlerts
      const donationUrl = `https://www.donationalerts.com/r/Humoat_StudioTM?amount=${amount}&message=${userId}`;
      window.location.href = donationUrl;
    } catch (error) {
      console.error('Ошибка при создании платежа:', error);
      showErrorPopup('Ошибка при создании платежа');
    }
  }  

  // Обработка кликов по кнопкам сумм
  amountButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      amountButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
      showPaymentConfirmation();
    });
  });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  initPaymentSystem();
});

// Отслеживание состояния пользователя
onAuthStateChanged(auth, (user) => {
  const topUpBtn = document.getElementById('topUpBalance');
  if (topUpBtn) {
    topUpBtn.style.display = user ? 'block' : 'none';
  }
});