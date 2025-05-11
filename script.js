document.querySelectorAll('h1, .description, .cta-button').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // Button click effect
    const ctaButton = document.querySelector('.cta-button');
    ctaButton.addEventListener('click', () => {
      ctaButton.style.transform = 'translateY(2px)';
      setTimeout(() => {
        ctaButton.style.transform = 'translateY(-5px) translateZ(10px)';
      }, 100);
      
      // Here you can add your action for button click
      alert('Спасибо за интерес к нашему CRMP mobile проекту! Мы свяжемся с вами в ближайшее время.');
    });

    // Mobile touch support
    document.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, { passive: false });