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
        if (users.some(u => u.email === email)) {
          alert('Этот email уже зарегистрирован');
        } else {
          users.push({ name, email, password });
          localStorage.setItem('users', JSON.stringify(users));
          currentUser = { name, email };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          showForm(profileSection, registerForm);
          accountName.textContent = currentUser.name;
          accountEmail.textContent = currentUser.email;
          renderOrderHistory();
        }
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
  
      if (searchIcon && searchPopup && searchInput && searchResults) {
        searchIcon.addEventListener('click', (e) => {
          e.preventDefault();
          searchPopup.setAttribute('aria-hidden', 'false');
          searchInput.focus();
        });
  
        searchPopup.addEventListener('click', (e) => {
          if (e.target === searchPopup.querySelector('.search-popup__overlay')) {
            searchPopup.setAttribute('aria-hidden', 'true');
            searchInput.value = '';
            searchResults.innerHTML = '';
          }
        });
  
        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.trim().toLowerCase();
          if (query.length > 0) {
            const filteredProducts = Object.values(products).filter(product =>
              product.title.toLowerCase().includes(query)
            );
            renderSearchResults(filteredProducts);
          } else {
            searchResults.innerHTML = '';
          }
        });
  
        searchInput.addEventListener('blur', () => {
          if (!searchInput.value) {
            setTimeout(() => {
              searchPopup.setAttribute('aria-hidden', 'true');
              searchResults.innerHTML = '';
            }, 100);
          }
        });
  
        searchResults.addEventListener('click', (e) => {
          const li = e.target.closest('li');
          if (li) {
            const productId = li.getAttribute('data-id');
            const product = products[productId];
            updatePopup(product, productId);
            productPopup.setAttribute('aria-hidden', 'false');
            searchPopup.setAttribute('aria-hidden', 'true');
            searchInput.value = '';
            searchResults.innerHTML = '';
          }
        });
      }
    }
  
    function renderSearchResults(products) {
      const searchResults = document.querySelector('#searchResults');
      searchResults.innerHTML = '';
      if (products.length === 0) {
        searchResults.innerHTML = '<ul><li>Ничего не найдено</li></ul>';
      } else {
        const ul = document.createElement('ul');
        products.forEach(product => {
          const li = document.createElement('li');
          li.setAttribute('data-id', Object.keys(products).find(id => products[id] === product));
          li.textContent = `${product.title} - ${product.price} ₽`;
          ul.appendChild(li);
        });
        searchResults.appendChild(ul);
      }
    }
  
    updateCartCount();
  });

  //parse
parse.initialize("h2c35HqCvBZJldXwlkivSY0C8InNFrtobkJfd3ar","VdJsJTjxZ7MpI0tBVVzvBwpreHQmwHrZhXLt6Nd8");
parse.serverURL = "https://parseapi.back4app.com/";