document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded'); // Проверка загрузки скрипта

  // Бургер-меню
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileNav = document.getElementById('mobileMenu');
  const navGlass = document.querySelector('.nav__glass');
  const navLogo = document.querySelector('.nav__logo');
  const navLines = document.querySelector('.nav__lines');
  const navList = document.querySelector('.nav__list');
  const lines = document.querySelectorAll('.nav__line');
  const navLinks = document.querySelectorAll('.nav__link'); // Ссылки для управления фокусом
  const navClose = document.querySelector('.nav__close'); // Кнопка закрытия

  if (burgerMenu && mobileNav) {
    burgerMenu.addEventListener('click', () => {
      const isExpanded = burgerMenu.getAttribute('aria-expanded') === 'true';
      console.log('Burger clicked, isExpanded:', isExpanded); // Отладка
      burgerMenu.setAttribute('aria-expanded', !isExpanded);
      mobileNav.setAttribute('aria-hidden', isExpanded);

      if (!isExpanded) {
        // Открытие меню
        animateMenuOpen();
      } else {
        // Закрытие меню: убираем фокус с ссылок
        navLinks.forEach(link => link.blur()); // Убираем фокус с ссылок
        animateMenuClose();
      }
    });

    // Обработка клика по крестику для закрытия
    if (navClose) {
      navClose.addEventListener('click', () => {
        console.log('Close button clicked'); // Отладка
        navLinks.forEach(link => link.blur()); // Убираем фокус
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
        animateMenuClose();
      });
    }

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !burgerMenu.contains(e.target) && mobileNav.getAttribute('aria-hidden') === 'false') {
        console.log('Closing menu via click outside'); // Отладка
        navLinks.forEach(link => link.blur()); // Убираем фокус перед закрытием
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
        animateMenuClose();
      }
    });
  }

  // Функция для открытия меню с анимацией
  function animateMenuOpen() {
    console.log('Opening menu...'); // Отладка

    // 1. Выкатываем точку с использованием requestAnimationFrame
    requestAnimationFrame(() => {
      console.log('Animating dot...'); // Отладка
      navLogo.classList.add('active');
    });

    // 2. Появляем градиент, фон и крестик после точки (0.5s)
    setTimeout(() => {
      console.log('Animating glass and close...'); // Отладка
      requestAnimationFrame(() => {
        navGlass.classList.add('active');
        navClose.classList.add('active'); // Появляем крестик
      });
      
      // 3. Появляем линии с задержкой (0.1s после градиента)
      setTimeout(() => {
        console.log('Animating lines...'); // Отладка
        requestAnimationFrame(() => navLines.classList.add('active'));
        
        // Добавляем .active для каждой линии с интервалом 150ms
        lines.forEach((line, index) => {
          setTimeout(() => {
            console.log(`Animating line ${index + 1}...`); // Отладка
            requestAnimationFrame(() => line.classList.add('active'));
          }, 150 * (index + 1));
        });

        // 4. Появляем текст (0.2s после линий)
        setTimeout(() => {
          console.log('Animating text...'); // Отладка
          requestAnimationFrame(() => navList.classList.add('active'));
        }, 200);
      }, 100);
    }, 500); // Задержка после выкатывания точки
  }

  // Функция для закрытия меню с анимацией (с улучшенной плавностью)
  function animateMenuClose() {
    console.log('Closing menu...'); // Отладка

    // Убираем все .active классы с задержкой для плавности
    requestAnimationFrame(() => {
      // Сначала убираем текст и линии с задержкой
      setTimeout(() => {
        navList.classList.remove('active');
        lines.forEach(line => line.classList.remove('active'));
      }, 100); // Задержка для плавного исчезновения текста и линий

      // Затем убираем градиент, точку и крестик
      setTimeout(() => {
        navGlass.classList.remove('active');
        navLogo.classList.remove('active');
        navLines.classList.remove('active');
        navClose.classList.remove('active');
      }, 300); // Задержка для плавного закрытия фона и крестика
    });
  }

  // Баннер
  const banner = document.getElementById('banner');
  const bannerToggle = document.querySelector('.banner__toggle');

  if (banner && bannerToggle) {
    let isCollapsed = true;
    bannerToggle.addEventListener('click', () => {
      if (isCollapsed) {
        banner.classList.remove('collapsed');
        bannerToggle.classList.remove('active');
        isCollapsed = false;
      } else {
        banner.classList.add('collapsed');
        bannerToggle.classList.add('active');
        isCollapsed = true;
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
      const itemWidth = items[0].offsetWidth + 10;
      const containerWidth = track.parentElement.offsetWidth;
      const offset = (containerWidth - itemWidth) / 2;
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

    let startX;
    track.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX));
    track.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 30) nextButton.click();
      if (endX - startX > 30) prevButton.click();
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
    { threshold: 0.2 }
  );

  cards.forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    card.style.transition = 'opacity 0.4s, transform 0.4s';
    observer.observe(card);
  });

  // Анимация иконок в островке по клику
  const contactLinks = document.querySelectorAll('.floating-contact__link');

  contactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');

      contactLinks.forEach(otherLink => {
        if (otherLink !== link) {
          otherLink.classList.remove('active');
        }
      });

      link.classList.add('active');

      setTimeout(() => {
        link.classList.remove('active');
        window.location.href = href;
      }, 600);
    });
  });
});