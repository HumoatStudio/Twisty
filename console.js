// Отключение правого клика мыши
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Отключение комбинаций клавиш для открытия консоли и других инструментов разработчика
document.addEventListener('keydown', function(e) {
  // Отключение F12
  if (e.key === 'F12' || 
      // Отключение Ctrl + Shift + I (инструменты разработчика)
      (e.ctrlKey && e.shiftKey && e.key === 'I') || 
      // Отключение Ctrl + Shift + C (инспектор)
      (e.ctrlKey && e.shiftKey && e.key === 'C') || 
      // Отключение Ctrl + U (просмотр исходного кода)
      (e.ctrlKey && e.key === 'U') ||
      // Отключение Ctrl + Shift + O (открытие панели Sources)
      (e.ctrlKey && e.shiftKey && e.key === 'O') ||
      // Отключение Ctrl + Shift + J (открытие консоли)
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      // Отключение F11 (включение полноэкранного режима)
      e.key === 'F11') {
    e.preventDefault();
    alert("Открытие консоли или инструментов разработчика заблокировано!");
  }
});

// Функция для обнаружения изменения размеров окна (когда открыта консоль)
const detectConsole = () => {
  const width = window.outerWidth - window.innerWidth > 100;
  const height = window.outerHeight - window.innerHeight > 100;
  if (width || height) {
    alert("Консоль была открыта!");
    // Прерывание дальнейших действий
    throw 'Консоль открыта!';
  }
};

// Проверка консоли каждую секунду
setInterval(detectConsole, 1000);

// Проверка использования консоли через console.log()
(function() {
  const detectConsoleOpen = () => {
    const start = Date.now();
    // Используем только console.debug вместо console.log
    console.debug('%c', 'font-size:1px;');
    if (Date.now() - start > 100) {
      alert('Вы пытались открыть консоль!');
      throw 'Консоль открыта!';
    }
  };
  detectConsoleOpen();
  setInterval(detectConsoleOpen, 500);
})();

// Блокировка на случай, если пользователь использует методы через Debugger
window.onkeydown = function(e) {
  if (e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl + Shift + I
      (e.ctrlKey && e.keyCode === 85) || // Ctrl + U
      (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl + Shift + C
      (e.ctrlKey && e.shiftKey && e.keyCode === 79) || // Ctrl + Shift + O
      (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl + Shift + J
      e.keyCode === 122) { // F11 (для полноэкранного режима)
    e.preventDefault();
  }
};

// Просто игнорируем попытки использования консоли
window.console = {
  log: function() {},
  info: function() {},
  warn: function() {},
  error: function() {},
  debug: function() {},
  trace: function() {}
};
