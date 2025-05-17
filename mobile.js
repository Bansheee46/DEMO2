document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');
    document.body.classList.add('loaded');
  
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let favoriteItems = JSON.parse(localStorage.getItem('favoriteItems')) || [];
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
  
    const cartCount = document.querySelector('.cart-count');
    const cartWrapper = document.querySelector('.cart-wrapper');
    const productPopup = document.querySelector('#productPopup');
  
    const products = {
      1: { title: 'Наушники Wireless', price: 4990, description: 'Беспроводные наушники с отличным звуком и шумоподавлением.', images: ['https://avatars.mds.yandex.net/i?id=16c02de528eae0501192dc54a8435a018ff02154-9674922-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'electronics' },
      2: { title: 'Смарт-часы X', price: 9990, description: 'Умные часы с функцией отслеживания активности и уведомлений.', images: ['https://avatars.mds.yandex.net/get-mpic/5234463/img_id2819387384900565932.jpeg/orig', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'electronics' },
      3: { title: 'Беспроводная колонка', price: 6490, description: 'Портативная колонка с мощным басом и долгим временем работы.', images: ['https://avatars.mds.yandex.net/i?id=16ef61d4342030c97b8f9425389cfa01584686c6-8497871-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'electronics' },
      4: { title: 'Геймпад Pro', price: 3990, description: 'Эргономичный геймпад для игр на ПК и консолях.', images: ['https://avatars.mds.yandex.net/get-mpic/5277894/img_id5035057075377151185.jpeg/orig', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'electronics' },
      5: { title: 'Конструктор LEGO', price: 2490, description: 'Набор для творчества и развития воображения.', images: ['https://avatars.mds.yandex.net/i?id=1a0a8e8e8f7e7e8f8e8f8e8f8e8f8e8f-8497871-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'toys' },
      6: { title: 'Мягкая игрушка', price: 1290, description: 'Милая плюшевая игрушка для детей и взрослых.', images: ['https://avatars.mds.yandex.net/i?id=2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b-9674922-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'toys' },
      7: { title: 'Чехол для телефона', price: 990, description: 'Стильный и прочный чехол для защиты телефона.', images: ['https://avatars.mds.yandex.net/i?id=3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c-8497871-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'accessories' },
      8: { title: 'Ремешок для часов', price: 1490, description: 'Сменный ремешок для смарт-часов.', images: ['https://avatars.mds.yandex.net/i?id=4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d-9674922-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'accessories' },
      9: { title: 'Футболка', price: 1990, description: 'Удобная хлопковая футболка с принтом.', images: ['https://avatars.mds.yandex.net/i?id=5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e-8497871-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'clothes' },
      10: { title: 'Джинсы', price: 3490, description: 'Классические джинсы прямого кроя.', images: ['https://avatars.mds.yandex.net/i?id=6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f-9674922-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'clothes' },
      11: { title: 'Электрочайник', price: 2990, description: 'Компактный чайник с быстрым нагревом.', images: ['https://avatars.mds.yandex.net/i?id=7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g7g-8497871-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'appliances' },
      12: { title: 'Микроволновка', price: 5990, description: 'Микроволновая печь с функцией гриля.', images: ['https://avatars.mds.yandex.net/i?id=8h8h8h8h8h8h8h8h8h8h8h8h8h8h8h8h-9674922-images-thumbs&n=13', 'https://via.placeholder.com/300/ccc', 'https://via.placeholder.com/300/999'], category: 'appliances' }
    };
  
    function updateCartCount() {
      if (cartCount && cartWrapper) {
        cartCount.textContent = cartItems.length;
        cartWrapper.classList.toggle('has-items', cartItems.length > 0);
        if (cartItems.length > 0) {
          cartWrapper.classList.add('active');
          setTimeout(() => cartWrapper.classList.remove('active'), 500);
        }
      }
    }
  
    if (window.location.pathname.includes('mobile.html') || window.location.pathname === '/') {
      console.log('Main page logic');
      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.product-card__button')) return;
          const productId = card.getAttribute('data-id');
          const product = products[productId];
          updatePopup(product, productId);
          productPopup.setAttribute('aria-hidden', 'false');
        });
      });
  
      document.querySelector('.product-popup__close')?.addEventListener('click', () => productPopup.setAttribute('aria-hidden', 'true'));
      document.querySelector('#popupAddToCart')?.addEventListener('click', () => {
        const item = createCartItem();
        cartItems.push(item);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        productPopup.setAttribute('aria-hidden', 'true');
      });
      document.querySelector('#popupFavorite')?.addEventListener('click', () => {
        const popupTitle = document.querySelector('#popupTitle').textContent;
        const productId = Object.keys(products).find(id => products[id].title === popupTitle);
        if (!productId) return;
        toggleFavorite(productId);
      });
  
      document.querySelectorAll('.product-card__button').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
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
  
      setupCarousel();
      setupCardAnimation();
      setupSearch();
    }
  
    if (window.location.pathname.includes('cart.html')) {
      console.log('Cart page logic');
      const cartItemsList = document.querySelector('.cart-page__items');
      const totalElement = document.querySelector('.cart-page__total span');
      const checkoutButton = document.querySelector('.cart-page__checkout');
      const checkoutForm = document.querySelector('.cart-page__checkout-form');
      const cartFooter = document.querySelector('.cart-page__footer');
      const backButton = document.querySelector('.cart-page__back');
      const modal = document.querySelector('#customModal');
      const modalMessage = modal.querySelector('.custom-modal__message');
      const modalClose = document.querySelector('.custom-modal__close');
      const phoneInput = document.querySelector('#checkout-phone');
  
      if (phoneInput) {
        phoneInput.addEventListener('blur', (e) => e.target.value = formatPhoneNumber(e.target.value));
      }
  
      renderCartItems();
  
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
          const order = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            items: [...cartItems],
            total: cartItems.reduce((sum, item) => sum + item.price, 0),
            name,
            phone,
            address,
            userEmail: currentUser ? currentUser.email : 'Гость'
          };
          orderHistory.push(order);
          localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
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
  
      modalClose.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  
      setupSearch();
  
      function renderCartItems() {
        cartItemsList.innerHTML = '';
        let total = 0;
        cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        if (cartItems.length === 0) {
          cartItemsList.innerHTML = '';
        } else {
          cartItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<img src="${item.image}" alt="${item.title}"><span>${item.title} - ${item.price} ₽</span><button>Удалить</button>`;
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
    }
  
    if (window.location.pathname.includes('favorites.html')) {
      console.log('Favorites page logic');
      const favoritesList = document.querySelector('.favorites-page__items');
      const totalElement = document.querySelector('.favorites-page__total span');
      const toCartButton = document.querySelector('.favorites-page__to-cart');
  
      renderFavoriteItems();
  
      toCartButton.addEventListener('click', () => {
        favoriteItems.forEach(item => {
          cartItems.push({ id: Date.now() + Math.random(), title: item.title, price: item.price, image: item.image });
        });
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        favoriteItems = [];
        localStorage.setItem('favoriteItems', JSON.stringify(favoriteItems));
        updateCartCount();
        window.location.href = 'cart.html';
      });
  
      setupSearch();
  
      function renderFavoriteItems() {
        favoritesList.innerHTML = '';
        favoriteItems = JSON.parse(localStorage.getItem('favoriteItems')) || [];
        toCartButton.disabled = favoriteItems.length === 0;
        if (favoriteItems.length === 0) {
          favoritesList.innerHTML = '<li>Избранное пусто</li>';
        } else {
          favoriteItems.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<img src="${item.image}" alt="${item.title}"><span>${item.title} - ${item.price} ₽</span><button>Удалить</button>`;
            li.querySelector('button').addEventListener('click', () => {
              favoriteItems.splice(index, 1);
              localStorage.setItem('favoriteItems', JSON.stringify(favoriteItems));
              renderFavoriteItems();
            });
            favoritesList.appendChild(li);
          });
        }
        totalElement.textContent = favoriteItems.length;
      }
    }
  
    if (window.location.pathname.includes('about.html')) {
        console.log('About page logic');
        const sections = document.querySelectorAll('.about-section');
      
        sections.forEach(section => {
          section.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') return;
      
            if (section.classList.contains('active')) {
              sections.forEach(s => {
                s.classList.remove('active');
                s.classList.remove('hidden');
              });
            } else {
              sections.forEach(otherSection => {
                if (otherSection !== section) {
                  otherSection.classList.add('hidden');
                  otherSection.classList.remove('active');
                }
              });
              // Добавляем active с небольшой задержкой для плавности
              setTimeout(() => {
                section.classList.remove('hidden');
                section.classList.add('active');
              }, 50); // 50ms задержка
            }
          });
        });
      
        setupSearch();
      }
  
    if (window.location.pathname.includes('account.html')) {
      console.log('Account page logic');
      const loginForm = document.querySelector('#loginForm');
      const registerForm = document.querySelector('#registerForm');
      const profileSection = document.querySelector('#profileSection');
      const loginSubmit = document.querySelector('#loginSubmit');
      const registerSubmit = document.querySelector('#registerSubmit');
      const showRegister = document.querySelector('#showRegister');
      const showLogin = document.querySelector('#showLogin');
      const accountName = document.querySelector('#accountName');
      const accountEmail = document.querySelector('#accountEmail');
      const editProfileButton = document.querySelector('#editProfile');
      const logoutButton = document.querySelector('#logout');
      const editForm = document.querySelector('#editForm');
      const editName = document.querySelector('#editName');
      const editEmail = document.querySelector('#editEmail');
      const cancelEdit = document.querySelector('#cancelEdit');
      const ordersList = document.querySelector('#ordersList');
      
      // Запрет вставки пароля в поле подтверждения
      const confirmPasswordField = document.querySelector('#registerPasswordConfirm');
      if (confirmPasswordField) {
        confirmPasswordField.addEventListener('paste', function(e) {
          e.preventDefault();
          
          // Создаем уведомление об ошибке
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-notification';
          errorMessage.textContent = 'Да, вот такие вот мы дотошные';
          document.body.appendChild(errorMessage);
          
          // Удаляем уведомление после задержки
          setTimeout(() => {
            errorMessage.classList.add('hide');
            setTimeout(() => errorMessage.remove(), 300);
          }, 3000);
        });
      }
  
      // Функция для переключения форм с удалением фокуса
      function showForm(formToShow, formToHide) {
        if (document.activeElement) document.activeElement.blur(); // Убираем фокус
        formToHide.setAttribute('aria-hidden', 'true');
        formToShow.setAttribute('aria-hidden', 'false');
      }
  
      // Проверяем, авторизован ли пользователь
      if (currentUser) {
        loginForm.setAttribute('aria-hidden', 'true');
        registerForm.setAttribute('aria-hidden', 'true');
        profileSection.setAttribute('aria-hidden', 'false');
        accountName.textContent = currentUser.name;
        accountEmail.textContent = currentUser.email;
        renderOrderHistory();
      } else {
        loginForm.setAttribute('aria-hidden', 'false');
        registerForm.setAttribute('aria-hidden', 'true');
        profileSection.setAttribute('aria-hidden', 'true');
      }
  
      showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(registerForm, loginForm);
      });
  
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showForm(loginForm, registerForm);
      });
  
      loginSubmit.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#loginEmail').value;
        const password = document.querySelector('#loginPassword').value;
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          currentUser = { name: user.name, email: user.email };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          showForm(profileSection, loginForm);
          accountName.textContent = currentUser.name;
          accountEmail.textContent = currentUser.email;
          renderOrderHistory();
        } else {
          alert('Неверный email или пароль');
        }
      });
  
      registerSubmit.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.querySelector('#registerName').value;
        const email = document.querySelector('#registerEmail').value;
        const password = document.querySelector('#registerPassword').value;
        const passwordConfirm = document.querySelector('#registerPasswordConfirm').value;
        
        // Проверяем совпадение паролей
        if (password !== passwordConfirm) {
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-notification';
          errorMessage.textContent = 'Пароли не совпадают';
          document.body.appendChild(errorMessage);
          
          setTimeout(() => {
            errorMessage.classList.add('hide');
            setTimeout(() => errorMessage.remove(), 300);
          }, 3000);
          
          return;
        }
        
        // Проверяем, существует ли уже пользователь с таким email
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          // Улучшенное сообщение об ошибке
          const errorMessage = document.createElement('div');
          errorMessage.className = 'error-notification';
          errorMessage.textContent = 'Пользователь с таким email уже зарегистрирован. Пожалуйста, войдите в систему.';
          document.body.appendChild(errorMessage);
          
          // Показываем форму входа
          showForm(loginForm, registerForm);
          
          // Заполняем email в форме входа
          document.querySelector('#loginEmail').value = email;
          
          // Удаляем уведомление после задержки
          setTimeout(() => {
            errorMessage.classList.add('hide');
            setTimeout(() => errorMessage.remove(), 300);
          }, 3000);
          
          return;
        }
        
        // Если email не существует, регистрируем пользователя
        users.push({ 
          name, 
          email, 
          password,
          registrationDate: new Date().toISOString() 
        });
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = { name, email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showForm(profileSection, registerForm);
        accountName.textContent = currentUser.name;
        accountEmail.textContent = currentUser.email;
        renderOrderHistory();
      });
  
      editProfileButton.addEventListener('click', () => {
        editName.value = currentUser.name;
        editEmail.value = currentUser.email;
        editForm.setAttribute('aria-hidden', 'false');
      });
  
      cancelEdit.addEventListener('click', () => {
        if (document.activeElement) document.activeElement.blur();
        editForm.setAttribute('aria-hidden', 'true');
      });
  
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = editName.value;
        const newEmail = editEmail.value;
        if (users.some(u => u.email === newEmail && u.email !== currentUser.email)) {
          alert('Этот email уже используется другим пользователем');
          return;
        }
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        users[userIndex].name = newName;
        users[userIndex].email = newEmail;
        currentUser.name = newName;
        currentUser.email = newEmail;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        accountName.textContent = currentUser.name;
        accountEmail.textContent = currentUser.email;
        editForm.setAttribute('aria-hidden', 'true');
      });
  
      logoutButton.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showForm(loginForm, profileSection);
        alert('Вы вышли из аккаунта');
      });
  
      setupSearch();
  
      function renderOrderHistory() {
        ordersList.innerHTML = '';
        const userOrders = orderHistory.filter(order => order.userEmail === (currentUser ? currentUser.email : 'Гость'));
        if (userOrders.length === 0) {
          ordersList.innerHTML = '';
        } else {
          userOrders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
              <strong>Заказ #${order.id}</strong> от ${order.date}<br>
              Товаров: ${order.items.length}, Сумма: ${order.total} ₽<br>
              Доставка: ${order.address}
            `;
            ordersList.appendChild(li);
          });
        }
      }
    }
  
    function updatePopup(product, productId) {
      document.querySelector('#popupTitle').textContent = product.title;
      document.querySelector('#popupPrice').textContent = `${product.price} ₽`;
      document.querySelector('#popupDescription').textContent = product.description;
      document.querySelector('#popupImage1').src = product.images[0];
      document.querySelector('#popupImage2').src = product.images[1];
      document.querySelector('#popupImage3').src = product.images[2];
      const isFavorite = favoriteItems.some(item => item.id === productId);
      const popupFavorite = document.querySelector('#popupFavorite');
      popupFavorite.classList.toggle('active', isFavorite);
      const icon = popupFavorite.querySelector('i');
      icon.classList.toggle('far', !isFavorite);
      icon.classList.toggle('fas', isFavorite);
    }
  
    function createCartItem() {
      return {
        id: Date.now(),
        title: document.querySelector('#popupTitle').textContent,
        price: parseInt(document.querySelector('#popupPrice').textContent.replace(/[^\d]/g, '')),
        image: document.querySelector('#popupImage1').src
      };
    }
  
    function toggleFavorite(productId) {
      const product = products[productId];
      const isFavorite = favoriteItems.some(item => item.id === productId);
      if (!isFavorite) {
        favoriteItems.push({ id: productId, title: product.title, price: product.price, image: product.images[0] });
      } else {
        favoriteItems = favoriteItems.filter(item => item.id !== productId);
      }
      localStorage.setItem('favoriteItems', JSON.stringify(favoriteItems));
      const popupFavorite = document.querySelector('#popupFavorite');
      popupFavorite.classList.toggle('active', !isFavorite);
      const icon = popupFavorite.querySelector('i');
      icon.classList.toggle('far', isFavorite);
      icon.classList.toggle('fas', !isFavorite);
    }
  
    function formatPhoneNumber(value) {
      const digits = value.replace(/\D/g, '');
      let phoneNumber = digits.startsWith('8') ? '7' + digits.slice(1) : digits.length > 0 ? '7' + digits : digits;
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
  
    function setupCarousel() {
      const track = document.querySelector('.carousel__track');
      const items = document.querySelectorAll('.carousel__item');
      const productsHeading = document.querySelector('.products__heading');
      if (!track || items.length === 0) return;
  
      let currentIndex = 0;
  
      function updateCarousel() {
        const itemWidth = items[0].offsetWidth + 10;
        const containerWidth = track.parentElement.offsetWidth;
        const offset = (containerWidth - itemWidth) / 2;
        track.style.transform = `translateX(${-currentIndex * itemWidth + offset}px)`;
        items.forEach((item, i) => item.toggleAttribute('data-active', i === currentIndex));
        const category = items[currentIndex].getAttribute('data-category');
        document.querySelectorAll('.product-card').forEach(card => {
          card.style.display = card.getAttribute('data-category') === category ? 'flex' : 'none';
        });
        productsHeading.textContent = `Товары - ${items[currentIndex].querySelector('.carousel__text').textContent}`;
      }
  
      let startX;
      track.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
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
  
    function setupCardAnimation() {
      const cards = document.querySelectorAll('.product-card');
      if (cards.length === 0) return;
  
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }, i * 100);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
  
      cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        card.style.transition = 'opacity 0.4s, transform 0.4s';
        observer.observe(card);
      });
    }
  
    function setupSearch() {
      const searchIcon = document.querySelector('.search-icon');
      const searchPopup = document.querySelector('#searchPopup');
      const searchInput = document.querySelector('#searchInput');
      const searchResults = document.querySelector('#searchResults');
      const clearSearchBtn = document.querySelector('#clearSearch');
      const closeSearchBtn = document.querySelector('#closeSearch');
      const searchSuggestions = document.querySelector('#searchSuggestions');
      const searchTags = document.querySelectorAll('.search-popup__tag');
      
      // Объект для хранения истории поиска
      const searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      
      // Функция для сохранения истории поиска
      function saveSearchHistory(query) {
        if (query && query.length > 2 && !searchHistory.includes(query)) {
          searchHistory.unshift(query);
          if (searchHistory.length > 5) {
            searchHistory.pop();
          }
          localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        }
      }
  
      if (searchIcon && searchPopup && searchInput && searchResults) {
        searchIcon.addEventListener('click', (e) => {
          e.preventDefault();
          searchPopup.setAttribute('aria-hidden', 'false');
          searchInput.focus();
          searchIcon.classList.add('active');
          
          // Показываем историю поиска, если она есть
          if (searchHistory.length > 0 && !searchInput.value) {
            showSearchHistory();
          }
        });
        
        // Функция для отображения истории поиска
        function showSearchHistory() {
          if (searchSuggestions) {
            const historyHTML = `
              <p class="search-popup__suggestions-title">История поиска:</p>
              <div class="search-popup__tags">
                ${searchHistory.map(query => `<span class="search-popup__tag" data-query="${query}">${query}</span>`).join('')}
                ${searchHistory.length > 0 ? '<span class="search-popup__tag" data-action="clear-history">Очистить историю</span>' : ''}
              </div>
            `;
            searchSuggestions.innerHTML = historyHTML;
            
            // Добавляем обработчики для тегов истории
            searchSuggestions.querySelectorAll('.search-popup__tag').forEach(tag => {
              tag.addEventListener('click', handleTagClick);
            });
          }
        }
        
        // Обработчик клика по тегу
        function handleTagClick(e) {
          const tag = e.currentTarget;
          if (tag.dataset.action === 'clear-history') {
            localStorage.removeItem('searchHistory');
            searchSuggestions.innerHTML = `
              <p class="search-popup__suggestions-title">Популярные запросы:</p>
              <div class="search-popup__tags">
                <span class="search-popup__tag" data-query="наушники">Наушники</span>
                <span class="search-popup__tag" data-query="часы">Часы</span>
                <span class="search-popup__tag" data-query="футболка">Футболка</span>
                <span class="search-popup__tag" data-query="чехол">Чехол</span>
                <span class="search-popup__tag" data-query="колонка">Колонка</span>
              </div>
            `;
            searchSuggestions.querySelectorAll('.search-popup__tag').forEach(tag => {
              tag.addEventListener('click', handleTagClick);
            });
            return;
          }
          
          const query = tag.dataset.query;
          if (query) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
          }
        }
        
        // Добавляем обработчики для тегов популярных запросов
        if (searchTags) {
          searchTags.forEach(tag => {
            tag.addEventListener('click', handleTagClick);
          });
        }
  
        // Закрытие по клику на оверлей
        searchPopup.addEventListener('click', (e) => {
          if (e.target === searchPopup.querySelector('.search-popup__overlay')) {
            closeSearchPopup();
          }
        });
        
        // Функция закрытия поиска
        function closeSearchPopup() {
          searchPopup.setAttribute('aria-hidden', 'true');
          setTimeout(() => {
            searchIcon.classList.remove('active');
          }, 300);
        }
        
        // Кнопка закрытия
        if (closeSearchBtn) {
          closeSearchBtn.addEventListener('click', () => {
            closeSearchPopup();
          });
        }
        
        // Кнопка очистки поля
        if (clearSearchBtn) {
          clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            searchResults.innerHTML = '';
            if (searchHistory.length > 0) {
              showSearchHistory();
            } else {
              searchSuggestions.style.display = 'block';
            }
          });
        }
  
        // Обработка ввода в поле поиска
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.trim().toLowerCase();
          
          // Показываем/скрываем кнопку очистки
          if (clearSearchBtn) {
            clearSearchBtn.style.opacity = query.length > 0 ? '1' : '0';
          }
          
          if (query.length > 0) {
            searchSuggestions.style.display = 'none';
            const filteredProducts = Object.values(products).filter(product =>
              product.title.toLowerCase().includes(query) || 
              (product.description && product.description.toLowerCase().includes(query)) ||
              (product.category && product.category.toLowerCase().includes(query))
            );
            renderSearchResults(filteredProducts, query);
          } else {
            searchResults.innerHTML = '';
            searchSuggestions.style.display = 'block';
            if (searchHistory.length > 0) {
              showSearchHistory();
            }
          }
        });
  
        // Обработка нажатия Enter в поле поиска
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && searchInput.value.trim()) {
            const query = searchInput.value.trim().toLowerCase();
            saveSearchHistory(query);
            
            const firstResult = searchResults.querySelector('li');
            if (firstResult) {
              firstResult.click();
            }
          }
          
          // Закрытие по Escape
          if (e.key === 'Escape') {
            closeSearchPopup();
          }
        });
        
        // Обработка клика по результату поиска
        searchResults.addEventListener('click', (e) => {
          const li = e.target.closest('li');
          if (li) {
            const productId = li.getAttribute('data-id');
            if (productId && products[productId]) {
              const product = products[productId];
              saveSearchHistory(searchInput.value.trim().toLowerCase());
              updatePopup(product, productId);
              productPopup.setAttribute('aria-hidden', 'false');
              closeSearchPopup();
            }
          }
        });
        
        // Добавляем автофокус при открытии
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'aria-hidden' && 
                searchPopup.getAttribute('aria-hidden') === 'false') {
              setTimeout(() => searchInput.focus(), 100);
            }
          });
        });
        
        observer.observe(searchPopup, { attributes: true });
      }
    }
  
    function renderSearchResults(filteredProducts, query) {
      const searchResults = document.querySelector('#searchResults');
      searchResults.innerHTML = '';
      
      if (filteredProducts.length === 0) {
        searchResults.innerHTML = `
          <div class="search-popup__no-results">
            <i class="fas fa-search" style="font-size: 24px; opacity: 0.5; margin-bottom: 10px;"></i>
            <p>По запросу «${query}» ничего не найдено</p>
            <p style="font-size: 12px; margin-top: 5px;">Попробуйте изменить запрос или выбрать из популярных</p>
          </div>
        `;
      } else {
        const ul = document.createElement('ul');
        
        filteredProducts.forEach(product => {
          const productId = Object.keys(products).find(id => products[id] === product);
          const li = document.createElement('li');
          li.setAttribute('data-id', productId);
          
          // Получаем изображение продукта
          let productImage = '';
          if (product.images && product.images.length > 0) {
            productImage = product.images[0];
          } else {
            // Пытаемся найти изображение в HTML
            const productCard = document.querySelector(`.product-card[data-id="${productId}"]`);
            if (productCard) {
              const img = productCard.querySelector('img');
              if (img) {
                productImage = img.src;
              }
            }
          }
          
          // Получаем категорию продукта
          const categoryName = getCategoryName(product.category);
          
          li.innerHTML = `
            <img src="${productImage}" alt="${product.title}" class="search-popup__product-image" onerror="this.src='https://via.placeholder.com/40x40?text=Фото'">
            <div class="search-popup__product-info">
              <div class="search-popup__product-title">${highlightQuery(product.title, query)}</div>
              <div class="search-popup__product-price">${product.price} ₽</div>
              ${categoryName ? `<div class="search-popup__category-tag">${categoryName}</div>` : ''}
            </div>
          `;
          
          ul.appendChild(li);
        });
        
        searchResults.appendChild(ul);
      }
    }
    
    // Функция для подсветки искомого текста
    function highlightQuery(text, query) {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark style="background-color: rgba(201, 137, 123, 0.2); padding: 0 2px; border-radius: 2px;">$1</mark>');
    }
    
    // Функция для получения названия категории
    function getCategoryName(categoryCode) {
      const categories = {
        'electronics': 'Электроника',
        'toys': 'Игрушки',
        'accessories': 'Аксессуары',
        'clothes': 'Одежда',
        'appliances': 'Бытовая техника'
      };
      
      return categories[categoryCode] || '';
    }
  
    updateCartCount();
  
    // Защита от копирования текста
    // Запрет контекстного меню
    document.addEventListener('contextmenu', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
      }
    });
  
    // Запрет копирования
    document.addEventListener('copy', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
        return false;
      }
    });
  
    // Запрет вырезания
    document.addEventListener('cut', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
        return false;
      }
    });
  
    // Запрет перетаскивания
    document.addEventListener('dragstart', function(e) {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
        return false;
      }
    });
  
    // Обработчик клавиши ё для перехода на страницу пользователей
    document.addEventListener('keydown', function(e) {
      // Клавиша ё (код 192)
      if (e.keyCode === 192) {
        // Проверяем, авторизован ли пользователь
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.loggedIn) {
          window.location.href = 'users.html';
        } else {
          showNotification('Доступ запрещен. Авторизуйтесь для просмотра списка пользователей.', 'error');
        }
      }
    });
  
    // Добавляем глобальную функцию showProfileModal
    function showProfileModal() {
      // Переиспользуем функцию из desktop.js, если она доступна
      if (typeof window.showProfileModal === 'function') {
        window.showProfileModal();
        return;
      }
      
      // Получаем данные пользователя
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!userData.name || !userData.email) {
        alert('Ошибка загрузки данных профиля');
        return;
      }
      
      // Перенаправляем на страницу аккаунта, если она есть
      if (window.location.pathname.includes('account.html')) {
        // Уже на странице аккаунта
        return;
      }
      
      // Если у нас есть страница аккаунта, перенаправляем на нее
      window.location.href = 'account.html';
    }
  });
