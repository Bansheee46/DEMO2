document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');
    document.body.classList.add('loaded');
  
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartCount = document.querySelector('.cart-count');
    const cartWrapper = document.querySelector('.cart-wrapper');
    const cartIconWrapper = document.querySelector('#cart-icon-wrapper');
    const cartIconLink = document.querySelector('#cart-icon-link');
    const cartIcon = document.querySelector('#cart-icon');
  
    // Проверка наличия элементов для иконок
    console.log('cartIconWrapper:', cartIconWrapper);
    console.log('cartIconLink:', cartIconLink);
    console.log('cartIcon:', cartIcon);
  
    function updateCartCount() {
      if (cartCount && cartWrapper) {
        cartCount.textContent = cartItems.length;
        if (cartItems.length > 0) {
          cartWrapper.classList.add('has-items');
          cartWrapper.classList.add('active');
          setTimeout(() => cartWrapper.classList.remove('active'), 500);
        } else {
          cartWrapper.classList.remove('has-items');
        }
      }
    }
  
    if (window.location.pathname.includes('cart.html')) {
      console.log('Switching to home icon');
      if (cartIconWrapper && cartIconLink && cartIcon) {
        cartIconWrapper.setAttribute('data-tooltip', 'На главную');
        cartIconLink.setAttribute('href', 'mobile.html');
        cartIconLink.setAttribute('aria-label', 'На главную');
        cartIcon.className = 'fas fa-home';
      } else {
        console.error('Cart icon elements not found');
      }
    } else {
      console.log('Switching to cart icon');
      if (cartIconWrapper && cartIconLink && cartIcon) {
        cartIconWrapper.setAttribute('data-tooltip', 'Корзина');
        cartIconLink.setAttribute('href', 'cart.html');
        cartIconLink.setAttribute('aria-label', 'Корзина');
        cartIcon.className = 'fas fa-shopping-cart';
      } else {
        console.error('Cart icon elements not found');
      }
    }
  
    if (window.location.pathname.includes('mobile.html') || window.location.pathname === '/') {
      console.log('Main page logic');
      const buttons = document.querySelectorAll('.product-card__button');
      buttons.forEach(button => {
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
          localStorage.setItem('cartItems', JSON.stringify(cartItems));
          updateCartCount();
        });
      });
  
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
        let startX;
        track.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX));
        track.addEventListener('touchend', (e) => {
          const endX = e.changedTouches[0].clientX;
          if (startX - endX > 30) {
            currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          } else if (endX - startX > 30) {
            currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          }
          updateCarousel();
        });
        window.addEventListener('load', updateCarousel);
        window.addEventListener('resize', updateCarousel);
      }
  
      const cards = document.querySelectorAll('.product-card');
      if (cards.length) {
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
      }
    }
  
    if (window.location.pathname.includes('cart.html')) {
      console.log('Cart page logic');
      const cartItemsList = document.querySelector('.cart-page__items');
      const totalElement = document.querySelector('.cart-page__total span');
      const checkoutButton = document.querySelector('.cart-page__checkout');
      const checkoutForm = document.querySelector('.cart-page__checkout-form');
      const cartFooter = document.querySelector('.cart-page__footer');
      const backButton = document.querySelector('.cart-page__back');
      const submitButton = document.querySelector('.cart-page__submit');
      const modal = document.querySelector('#customModal');
      const modalMessage = modal.querySelector('.custom-modal__message');
      const modalClose = modal.querySelector('.custom-modal__close');
      const phoneInput = document.querySelector('#checkout-phone');
  
      function formatPhoneNumber(value) {
        const digits = value.replace(/\D/g, '');
        let phoneNumber = digits;
        if (phoneNumber.startsWith('8')) {
          phoneNumber = '7' + phoneNumber.slice(1);
        } else if (!phoneNumber.startsWith('7') && phoneNumber.length > 0) {
          phoneNumber = '7' + phoneNumber;
        }
        const match = phoneNumber.match(/^(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
        if (match) {
          const parts = [];
          if (match[1]) parts.push('+7');
          if (match[2]) parts.push(` (${match[2]}`);
          if (match[3]) parts.push(`) ${match[3]}`);
          if (match[4]) parts.push(`-${match[4]}`);
          if (match[5]) parts.push(`-${match[5]}`);
          return parts.join('');
        }
        return value;
      }
  
      if (phoneInput) {
        phoneInput.addEventListener('blur', (e) => {
          e.target.value = formatPhoneNumber(e.target.value);
        });
      }
  
      function renderCartItems() {
        cartItemsList.innerHTML = '';
        let total = 0;
        cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        if (cartItems.length === 0) {
          cartItemsList.innerHTML = '<li>Корзина пуста</li>';
        } else {
          cartItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
              <img src="${item.image}" alt="${item.title}">
              <span>${item.title} - ${item.price} ₽</span>
              <button>Удалить</button>
            `;
            li.querySelector('button').addEventListener('click', () => {
              cartItems.splice(index, 1);
              localStorage.setItem('cartItems', JSON.stringify(cartItems));
              renderCartItems();
              updateCartCount();
            });
            cartItemsList.appendChild(li);
            total += item.price;
          });
        }
        totalElement.textContent = `${total} ₽`;
      }
  
      checkoutButton.addEventListener('click', () => {
        cartItemsList.style.display = 'none';
        cartFooter.style.display = 'none';
        checkoutForm.classList.add('active');
      });
  
      backButton.addEventListener('click', () => {
        cartItemsList.style.display = 'block';
        cartFooter.style.display = 'block';
        checkoutForm.classList.remove('active');
      });
  
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.querySelector('#checkout-name').value;
        const phone = document.querySelector('#checkout-phone').value;
        const address = document.querySelector('#checkout-address').value;
  
        if (name && phone && address) {
          modalMessage.textContent = `Заказ оформлен!\nИмя: ${name}\nТелефон: ${phone}\nАдрес: ${address}`;
          modal.setAttribute('aria-hidden', 'false');
          cartItems = [];
          localStorage.setItem('cartItems', JSON.stringify(cartItems));
          renderCartItems();
          updateCartCount();
          checkoutForm.reset();
          cartItemsList.style.display = 'block';
          cartFooter.style.display = 'block';
          checkoutForm.classList.remove('active');
        }
      });
  
      modalClose.addEventListener('click', () => {
        modal.setAttribute('aria-hidden', 'true');
      });
  
      renderCartItems();
    }
  
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
  
    updateCartCount();
  });