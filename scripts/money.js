// Импорты Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { 
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
  onSnapshot,
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

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Глобальные переменные
let unsubscribeUserListener;

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

function openNewPurchaseModal(title, price, image, downloadLink, telegramLink) {
  const modal = document.getElementById('new-purchase-modal');
  if (!modal) {
    console.error('Modal not found');
    return;
  }

  const itemTitle = document.getElementById('new-modal-item-title');
  const itemPrice = document.getElementById('new-modal-price');
  const itemImage = document.getElementById('new-modal-item-image');

  itemTitle.innerHTML = `Вы купили: ${title}`;
  itemPrice.textContent = price;
  itemImage.src = image;

  // Если есть ссылка для скачивания, отображаем её
  if (downloadLink) {
    const downloadContainer = document.createElement('div');
    downloadContainer.className = 'download-container';
    downloadContainer.innerHTML = `
      <p>Ссылка для скачивания:</p>
      <a href="${downloadLink}" target="_blank" class="download-link">Скачать товар</a>
    `;
    let existingContainer = modal.querySelector('.download-container');
    if (existingContainer) {
      existingContainer.innerHTML = downloadContainer.innerHTML;
    } else {
      modal.querySelector('.new-modal-content').insertBefore(
        downloadContainer,
        modal.querySelector('#new-modal-close-btn')
      );
    }
  }

  // Если есть ссылка на Telegram, отображаем кнопку для связи с продавцом
  if (telegramLink) {
    const telegramContainer = document.createElement('div');
    telegramContainer.className = 'telegram-container';
    telegramContainer.innerHTML = `
      <p>Связаться с продавцом:</p>
      <a href="${telegramLink}" target="_blank" class="telegram-link">Написать в Telegram</a>
    `;
    
    let existingTelegramContainer = modal.querySelector('.telegram-container');
    if (existingTelegramContainer) {
      existingTelegramContainer.innerHTML = telegramContainer.innerHTML;
    } else {
      modal.querySelector('.new-modal-content').insertBefore(
        telegramContainer,
        modal.querySelector('#new-modal-close-btn')
      );
    }
  }

  modal.style.display = "block";

  const closeBtn = modal.querySelector('.new-close-btn');
  const closeModalBtn = modal.querySelector('#new-modal-close-btn');

  closeBtn.onclick = () => {
    modal.style.display = "none";
  };
  closeModalBtn.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

// Функция настройки кнопок покупки
async function setupBuyButtons() {
  const buyButtons = document.querySelectorAll('.buy-btn');
  
  buyButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const user = auth.currentUser;
      if (!user) {
        showErrorPopup('Сначала войдите в систему!');
        window.location.href = 'login.html';
        return;
      }

      let price = parseInt(button.getAttribute('data-price'));
      const originalPrice = price; // Сохраняем оригинальную цену
      const title = button.getAttribute('data-title') || 'Неизвестный товар';
      const image = button.getAttribute('data-image') || '';
      const downloadLink = button.getAttribute('data-download-link') || '';

      // Проверяем активные скидочные промокоды
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        let discount = 0;

        if (userSnap.exists()) {
          // Проверяем все возможные промокоды
          for (const [code, promo] of Object.entries(promoList)) {
            if (promo.type === "discount" && userSnap.data()[`promoUsed_${code}`]) {
              if (promo.amount > discount) {
                discount = promo.amount; // Используем максимальную доступную скидку
              }
            }
          }
        }

        // Применяем скидку
        if (discount > 0) {
          price = Math.round(price * (100 - discount) / 100);
          showSuccessPopup(`Применена скидка ${discount}%! Новая цена: ${price}₽`);
        }

        // Остальная логика покупки...
        if (isNaN(price) || price <= 0) {
          showErrorPopup('Ошибка: Неверная цена товара');
          return;
        }

        const currentBalance = userSnap.data().balance || 0;
        if (currentBalance < price) {
          showErrorPopup('Недостаточно средств.');
          return;
        }

        // Сохраняем транзакцию с информацией о скидке
        await updateDoc(userRef, {
          balance: increment(-price),
          lastUpdate: serverTimestamp()
        });

        const transactionRef = doc(db, "transactions", `${Date.now()}_${user.uid}`);
        await setDoc(transactionRef, {
          userId: user.uid,
          amount: -price,
          originalAmount: -originalPrice,
          discount: discount,
          type: 'purchase',
          date: serverTimestamp(),
          item: title
        });

        openNewPurchaseModal(title, price, image, downloadLink, button.getAttribute('data-telegram'));
        showSuccessPopup(`Вы купили "${title}" за ${price}₽`);

      } catch (error) {
        console.error('Ошибка при покупке:', error);
        showErrorPopup('Не удалось завершить покупку: ' + error.message);
      }
    });
  });
}

// Отслеживание состояния пользователя
onAuthStateChanged(auth, (user) => {
  if (unsubscribeUserListener) {
    unsubscribeUserListener();
  }

  if (user) {
    // Вызываем функцию из login.js, если она доступна
    if (window.updateAuthPanel) {
      window.updateAuthPanel(user);
    }
    
    const userRef = doc(db, "users", user.uid);
    unsubscribeUserListener = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const balance = doc.data().balance || 0;
        const balanceElement = document.querySelector('.dark-money-amount');
        if (balanceElement) {
          balanceElement.textContent = balance;
        }
      }
    });
  } else {
    if (window.updateAuthPanel) {
      window.updateAuthPanel(null);
    }
    const balanceElement = document.querySelector('.dark-money-amount');
    if (balanceElement) {
      balanceElement.textContent = '0';
    }
  }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  setupBuyButtons();
});

// Очистка при закрытии
window.addEventListener('beforeunload', () => {
  if (unsubscribeUserListener) {
    unsubscribeUserListener();
  }
});