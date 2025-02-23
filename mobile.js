document.addEventListener('DOMContentLoaded', () => {
  // Бургер-меню
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileNav = document.getElementById('mobileMenu');

  if (burgerMenu && mobileNav) {
    burgerMenu.addEventListener('click', () => {
      const isExpanded = burgerMenu.getAttribute('aria-expanded') === 'true';
      burgerMenu.setAttribute('aria-expanded', !isExpanded);
      mobileNav.setAttribute('aria-hidden', isExpanded);
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !burgerMenu.contains(e.target) && mobileNav.getAttribute('aria-hidden') === 'false') {
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Карусель
  const track = document.querySelector('.carousel__track');
  const items = document.querySelectorAll('.carousel__item');
  const prevButton = document.querySelector('.carousel__control--prev');
  const nextButton = document.querySelector('.carousel__control--next');

  if (track && items.length && prevButton && nextButton) {
    let currentIndex = 0;

    const updateCarousel = () => {
      const itemWidth = items[0].offsetWidth + 15; // Ширина + gap
      const containerWidth = track.parentElement.offsetWidth;
      const totalWidth = itemWidth * items.length;
      const maxOffset = Math.max(0, (totalWidth - containerWidth) / 2);
      const offset = Math.min(maxOffset, (containerWidth - itemWidth) / 2);
      track.style.transform = `translateX(${-currentIndex * itemWidth + offset}px)`;
      items.forEach((item, i) => item.toggleAttribute('data-active', i === currentIndex));
    };

    prevButton.addEventListener('click', () => {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      updateCarousel();
    });

    nextButton.addEventListener('click', () => {
      currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      updateCarousel();
    });

    // Свайп
    let startX;
    track.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX));
    track.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) nextButton.click();
      if (endX - startX > 50) prevButton.click();
    });

    window.addEventListener('load', updateCarousel);
    window.addEventListener('resize', updateCarousel);
  }

  // Анимация карточек
  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 100);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  cards.forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    observer.observe(card);
  });

  // Кнопка каталога
  const catalogToggle = document.querySelector('.catalog-toggle-mobile');
  if (catalogToggle && mobileNav) {
    catalogToggle.addEventListener('click', () => {
      const isHidden = mobileNav.getAttribute('aria-hidden') === 'true';
      mobileNav.setAttribute('aria-hidden', !isHidden);
      burgerMenu.setAttribute('aria-expanded', isHidden);
    });
  }
});