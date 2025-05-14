// Функция для открытия модала
function openModal(title, description) {
  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalDescription').innerText = description;
  document.getElementById('myModal').style.display = 'block';
}

// Функция для закрытия модала
function closeModal() {
  document.getElementById('myModal').style.display = 'none';
}

// Функция для переключения панели
window.togglePanel = function() {
  const panel = document.getElementById("logoPanel");
  panel.classList.toggle("show");
}

// Скрытие панели при клике вне
document.addEventListener("click", function (event) {
  const panel = document.getElementById("logoPanel");
  const logo = document.querySelector(".logo-container");

  if (!panel || !logo) return;

  if (!panel.contains(event.target) && !logo.contains(event.target)) {
    panel.classList.remove("show");
  }
});