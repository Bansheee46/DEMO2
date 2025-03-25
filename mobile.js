document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');
    document.body.classList.add('loaded');
  
    const cartCount = document.querySelector('.cart-count');
    const cartWrapper = document.querySelector('.cart-wrapper');
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  
    // Обновление счетчика корзины
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
  
    // Логика для главной страницы (mobile.html)
    if (window.location.pathname.includes('mobile.html') || window.location.pathname === '/') {
      console.log('Main page logic');
  
      // Добавление в корзину
      const buttons = document.querySelectorAll('.product-card__button');
      if (buttons.length) {
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
  
      // Анимация карточек
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
  
      updateCartCount();
    }
  
    // Анимация иконок в островке
    const contactLinks = document.querySelectorAll('.floating-contact__link');
    if (contactLinks.length) {
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
    }
  });