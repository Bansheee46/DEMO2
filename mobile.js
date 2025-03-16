document.addEventListener('DOMContentLoaded', () => {
  console.log('Script loaded');

  // Бургер-меню
  const burgerMenu = document.querySelector('.burger-menu');
  const mobileNav = document.getElementById('mobileMenu');
  const navGlass = document.querySelector('.nav__glass');
  const navLogo = document.querySelector('.nav__logo');
  const navLines = document.querySelector('.nav__lines');
  const navList = document.querySelector('.nav__list');
  const lines = document.querySelectorAll('.nav__line');
  const navLinks = document.querySelectorAll('.nav__link');
  const navClose = document.querySelector('.nav__close');

  if (burgerMenu && mobileNav) {
    burgerMenu.addEventListener('click', () => {
      const isExpanded = burgerMenu.getAttribute('aria-expanded') === 'true';
      console.log('Burger clicked, isExpanded:', isExpanded);
      burgerMenu.setAttribute('aria-expanded', !isExpanded);
      mobileNav.setAttribute('aria-hidden', isExpanded);

      if (!isExpanded) {
        animateMenuOpen();
      } else {
        navLinks.forEach(link => {
          link.blur();
          link.classList.remove('active');
        });
        animateMenuClose();
        burgerMenu.focus();
      }
    });

    if (navClose) {
      navClose.addEventListener('click', () => {
        console.log('Close button clicked');
        navLinks.forEach(link => {
          link.blur();
          link.classList.remove('active');
        });
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
        animateMenuClose();
        burgerMenu.focus();
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Clicked link: ${link.textContent}`);
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !burgerMenu.contains(e.target) && mobileNav.getAttribute('aria-hidden') === 'false') {
        console.log('Closing menu via click outside');
        navLinks.forEach(link => {
          link.blur();
          link.classList.remove('active');
        });
        mobileNav.setAttribute('aria-hidden', 'true');
        burgerMenu.setAttribute('aria-expanded', 'false');
        animateMenuClose();
        burgerMenu.focus();
      }
    });
  }

  function animateMenuOpen() {
    console.log('Opening menu...');
    requestAnimationFrame(() => {
      console.log('Animating dot...');
      navLogo.classList.add('active');
    });

    setTimeout(() => {
      console.log('Animating glass and close...');
      requestAnimationFrame(() => {
        navGlass.classList.add('active');
        navClose.classList.add('active');
      });

      setTimeout(() => {
        console.log('Animating lines...');
        requestAnimationFrame(() => navLines.classList.add('active'));

        lines.forEach((line, index) => {
          setTimeout(() => {
            console.log(`Animating line ${index + 1}...`);
            requestAnimationFrame(() => line.classList.add('active'));
          }, 150 * (index + 1));
        });

        setTimeout(() => {
          console.log('Animating text...');
          requestAnimationFrame(() => navList.classList.add('active'));
        }, 200);
      }, 1600);
    }, 500);
  }

  function animateMenuClose() {
    console.log('Closing menu...');
    requestAnimationFrame(() => {
      navList.classList.remove('active');
      lines.forEach(line => line.classList.remove('active'));
      navClose.classList.remove('active');
      navLines.classList.remove('active');
      
      // Убираем .active с задержкой для анимации выхода
      setTimeout(() => {
        navGlass.classList.remove('active');
        navLogo.classList.remove('active');
      }, 100); // Минимальная задержка для начала анимации
    });
  }

  // Баннер
  const banner = document.getElementById('banner');
  if (banner) {
    let isCollapsed = true;

    banner.addEventListener('click', () => {
      if (isCollapsed) {
        banner.classList.remove('collapsed');
        isCollapsed = false;
      } else {
        banner.classList.add('collapsed');
        isCollapsed = true;
      }
    });

    const titleDynamics = document.querySelectorAll('.banner__title-dynamic');
    let currentIndex = 0;

    titleDynamics.forEach((title, index) => {
      if (index === currentIndex) title.classList.add('active');
      else title.classList.add('hidden');
    });

    function changeTitle() {
      const currentTitle = titleDynamics[currentIndex];
      const nextIndex = (currentIndex + 1) % titleDynamics.length;
      const nextTitle = titleDynamics[nextIndex];

      currentTitle.classList.remove('active');
      currentTitle.classList.add('hidden');

      setTimeout(() => {
        nextTitle.classList.remove('hidden');
        nextTitle.classList.add('active');
        currentIndex = nextIndex;
      }, 800);
    }

    setTimeout(() => setInterval(changeTitle, 3000), 100);
  }

  // Карусель
  const track = document.querySelector('.carousel__track');
  const items = document.querySelectorAll('.carousel__item');

  if (track && items.length) {
    let currentIndex = 0;

    const updateCarousel = () => {
      const itemWidth = items[0].offsetWidth + 10;
      const containerWidth = track.parentElement.offsetWidth;
      const offset = (containerWidth - itemWidth) / 2;
      track.style.transform = `translateX(${-currentIndex * itemWidth + offset}px)`;
      items.forEach((item, i) => item.toggleAttribute('data-active', i === currentIndex));
    };

    // Убираем кнопки, оставляем только свайпы
    let startX;
    track.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX));
    track.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 30) {
        currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        updateCarousel();
      }
      if (endX - startX > 30) {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        updateCarousel();
      }
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

  // Анимация иконок в островке
  const contactLinks = document.querySelectorAll('.floating-contact__link');
  contactLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      contactLinks.forEach(otherLink => {
        if (otherLink !== link) otherLink.classList.remove('active');
      });
      link.classList.add('active');
      setTimeout(() => {
        link.classList.remove('active');
        window.location.href = href;
      }, 600);
    });
  });

  // Корзина
  const cartToggle = document.getElementById('cartToggle');
  const cartPopup = document.getElementById('cartPopup');
  const cartClose = document.querySelector('.cart-popup__close');
  const cartItemsList = document.querySelector('.cart-popup__items');
  const cartTotal = document.querySelector('.cart-popup__total span');
  const cartCount = document.querySelector('.cart-count');
  const checkoutButton = document.querySelector('.cart-popup__checkout');
  const checkoutForm = document.querySelector('.cart-popup__checkout-form');
  const cartBody = document.querySelector('.cart-popup__body');
  const backButton = document.querySelector('.cart-popup__back');
  const cartWrapper = document.querySelector('.cart-wrapper');
  const cartItemsWrapper = document.querySelector('.cart-popup__items-wrapper');
  let cartItems = [];

  console.log('Cart elements:', { cartToggle, cartPopup, checkoutButton, checkoutForm, cartBody, cartItemsWrapper });

  if (cartToggle) {
    cartToggle.addEventListener('click', () => {
      console.log('Cart toggle clicked');
      cartPopup.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      updateCart();
    });
  }

  if (cartClose) {
    cartClose.addEventListener('click', () => {
      console.log('Cart close clicked');
      cartPopup.setAttribute('aria-hidden', 'true');
      checkoutForm.classList.remove('active');
      cartItemsWrapper.classList.remove('hidden');
      document.body.classList.remove('no-scroll');
      cartToggle.focus();
    });
  }

  document.querySelector('.cart-popup__overlay')?.addEventListener('click', () => {
    console.log('Overlay clicked');
    cartPopup.setAttribute('aria-hidden', 'true');
    checkoutForm.classList.remove('active');
    cartItemsWrapper.classList.remove('hidden');
    document.body.classList.remove('no-scroll');
    cartToggle.focus();
  });

  document.querySelectorAll('.product-card__button').forEach(button => {
    button.addEventListener('click', () => {
      console.log('Add to cart clicked');
      const card = button.closest('.product-card');
      const item = {
        id: Date.now(),
        title: card.querySelector('.product-card__title').textContent,
        price: parseInt(card.querySelector('.product-card__price').textContent.replace(/[^\d]/g, '')),
        image: card.querySelector('img').src
      };
      cartItems.push(item);
      updateCartCount();
    });
  });

  function updateCart() {
    cartItemsList.innerHTML = cartItems.map(item => `
      <li data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}">
        <span>${item.title} - ${item.price} ₽</span>
        <button class="cart-popup__remove">Удалить</button>
      </li>
    `).join('');

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `${total} ₽`;

    document.querySelectorAll('.cart-popup__remove').forEach(button => {
      button.addEventListener('click', () => {
        const id = parseInt(button.parentElement.dataset.id);
        const itemElement = button.parentElement;
        itemElement.classList.add('remove');
        setTimeout(() => {
          cartItems = cartItems.filter(item => item.id !== id);
          updateCart();
          updateCartCount();
        }, 300);
      });
    });
  }

  function updateCartCount() {
    cartCount.textContent = cartItems.length;
    if (cartItems.length > 0) {
      cartWrapper.classList.add('has-items');
      cartWrapper.classList.add('active');
      setTimeout(() => cartWrapper.classList.remove('active'), 500); // Анимация длится 0.5с
    } else {
      cartWrapper.classList.remove('has-items');
    }
  }

  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      console.log('Checkout button clicked');
      if (cartItems.length === 0) {
        showCustomModal('Корзина пуста!');
      } else {
        console.log('Switching to checkout form');
        cartItemsWrapper.classList.add('hidden');
        checkoutForm.classList.add('active');
      }
    });
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      console.log('Back button clicked');
      checkoutForm.classList.remove('active');
      cartItemsWrapper.classList.remove('hidden');
    });
  }

  if (checkoutForm) {
    const submitButton = checkoutForm.querySelector('.cart-popup__submit');
    checkoutForm.addEventListener('input', () => {
      const isValid = checkoutForm.checkValidity();
      submitButton.disabled = !isValid;
    });

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('checkout-name').value,
        phone: document.getElementById('checkout-phone').value,
        address: document.getElementById('checkout-address').value,
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.price, 0)
      };
      console.log('Заказ отправлен:', formData);
      showCustomModal('Заказ успешно оформлен!');
      cartItems = [];
      updateCart();
      updateCartCount();
      checkoutForm.classList.remove('active');
      cartItemsWrapper.classList.remove('hidden');
      checkoutForm.reset();
      cartToggle.focus();
    });
  }

  function showCustomModal(message) {
    const modal = document.getElementById('customModal');
    const messageElement = modal.querySelector('.custom-modal__message');
    const closeButton = modal.querySelector('.custom-modal__close');

    messageElement.textContent = message;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');

    closeButton.onclick = () => {
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      cartToggle.focus();
    };
  }

// WebSocket для live-reload
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
} else {
  console.error('Upgrade your browser. This Browser is NOT supported WebSocket for Live-Reloading.');
}
})