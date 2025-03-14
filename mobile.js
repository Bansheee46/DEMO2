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
        // Закрытие меню: убираем фокус и подчёркивание
        navLinks.forEach(link => {
          link.blur(); // Убираем фокус с ссылок
          link.classList.remove('active'); // Убираем подчёркивание
        });
        animateMenuClose();
      }
    });

    // Обработка клика по крестику для закрытия
    if (navClose) {
      navClose.addEventListener('click', () => {
        console.log('Close button clicked'); // Отладка
        navLinks.forEach(link => {
          link.blur(); // Убираем фокус
          link.classList.remove('active'); // Убираем подчёркивание
        });
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
        animateMenuClose();
      });
    }

    // Обработка клика по ссылкам для подчёркивания
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault(); // Предотвращаем переход по ссылке
        console.log(`Clicked link: ${link.textContent}`); // Отладка
        navLinks.forEach(l => l.classList.remove('active')); // Убираем подчёркивание с других ссылок
        link.classList.add('active'); // Добавляем подчёркивание на текущую ссылку
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !burgerMenu.contains(e.target) && mobileNav.getAttribute('aria-hidden') === 'false') {
        console.log('Closing menu via click outside'); // Отладка
        navLinks.forEach(link => {
          link.blur(); // Убираем фокус перед закрытием
          link.classList.remove('active'); // Убираем подчёркивание
        });
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
        animateMenuClose();
      }
    });
  }

  // Функция для открытия меню с анимацией
  function animateMenuOpen() {
    console.log('Opening menu...'); // Отладка

    // Выкатываем точку с использованием requestAnimationFrame
    requestAnimationFrame(() => {
      console.log('Animating dot...'); // Отладка
      navLogo.classList.add('active');
    });

    // 2. Появляем белый фон, затем градиент после точки (0.5s + 1.5s)
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
      }, 1600); // Задержка 1.6s (0.5s + 1.1s) после появления градиента
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

  // Баннер "Наши преимущества" (с динамической надписью, с плавной анимацией)
  const banner = document.getElementById('banner');
  const bannerToggle = document.querySelector('.banner__toggle');

  if (banner && bannerToggle) {
    let isCollapsed = true;

    // Убедимся, что стрелка видна изначально в сложенном состоянии
    bannerToggle.classList.add('active'); // Добавляем .active изначально для сложенного состояния

    bannerToggle.addEventListener('click', () => {
      if (isCollapsed) {
        banner.classList.remove('collapsed');
        bannerToggle.classList.add('active');
        isCollapsed = false;
      } else {
        banner.classList.add('collapsed');
        bannerToggle.classList.remove('active');
        isCollapsed = true;
      }
    });

    // Динамическая смена текста в заголовке баннера с плавной анимацией
    const titleDynamics = document.querySelectorAll('.banner__title-dynamic');
    let currentIndex = 0;

    // Инициализация: показываем первый текст сразу
    titleDynamics.forEach((title, index) => {
      if (index === currentIndex) {
        title.classList.add('active');
      } else {
        title.classList.add('hidden');
      }
    });

    function changeTitle() {
      const currentTitle = titleDynamics[currentIndex];
      const nextIndex = (currentIndex + 1) % titleDynamics.length;
      const nextTitle = titleDynamics[nextIndex];

      currentTitle.classList.remove('active');
      currentTitle.classList.add('hidden');

      // Ждём завершения анимации (0.8s), чтобы показать следующий текст
      setTimeout(() => {
        nextTitle.classList.remove('hidden');
        nextTitle.classList.add('active');
        currentIndex = nextIndex;
      }, 800); // Синхронизируем с длительностью transition в CSS
    }

    // Запускаем смену текста каждые 3 секунды с небольшой задержкой для старта
    setTimeout(() => {
      setInterval(changeTitle, 3000);
    }, 100); // Задержка 0.1s для стабильного старта
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

if ('WebSocket' in window) {
  (function () {
    function refreshCSS() {
      var sheets = [].slice.call(document.getElementsByTagName("link"));
      var head = document.getElementsByTagName("head")[0];
      for (var i = 0; i < sheets.length; ++i) {
        var elem = sheets[i];
        var parent = elem.parentElement || head;
        parent.removeChild(elem);
        var rel = elem.rel;
        if (elem.href && typeof rel != "string" || rel.length == 0 || rel.toLowerCase() == "stylesheet") {
          var url = elem.href.replace(/(&|\?)_cacheOverride=\d+/, '');
          elem.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + (new Date().valueOf());
        }
        parent.appendChild(elem);
      }
    }
    var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
    var address = protocol + window.location.host + window.location.pathname + '/ws';
    var socket = new WebSocket(address);
    socket.onmessage = function (msg) {
      if (msg.data == 'reload') window.location.reload();
      else if (msg.data == 'refreshcss') refreshCSS();
    };
    if (sessionStorage && !sessionStorage.getItem('IsThisFirstTime_Log_From_LiveServer')) {
      console.log('Live reload enabled.');
      sessionStorage.setItem('IsThisFirstTime_Log_From_LiveServer', true);
    }
  })();
}
else {
  console.error('Upgrade your browser. This Browser is NOT supported WebSocket for Live-Reloading.');
}
