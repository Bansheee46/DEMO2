document.addEventListener("DOMContentLoaded", () => {
    // Бургер-меню
    const burgerMenu = document.querySelector(".burger-menu");
    const mobileNav = document.getElementById("mobileMenu");
  
    if (burgerMenu && mobileNav) {
      burgerMenu.addEventListener("click", () => {
        const isExpanded = burgerMenu.getAttribute("aria-expanded") === "true";
        burgerMenu.setAttribute("aria-expanded", !isExpanded);
        mobileNav.classList.toggle("active");
        burgerMenu.classList.toggle("active");
  
        if (!isExpanded) {
          document.addEventListener("click", closeMenuOnClickOutside);
        } else {
          document.removeEventListener("click", closeMenuOnClickOutside);
        }
      });
  
      function closeMenuOnClickOutside(event) {
        if (!mobileNav.contains(event.target) && !burgerMenu.contains(event.target)) {
          mobileNav.classList.remove("active");
          burgerMenu.classList.remove("active");
          burgerMenu.setAttribute("aria-expanded", "false");
          document.removeEventListener("click", closeMenuOnClickOutside);
        }
      }
    }
  
    // Карусель
    const carousel = document.querySelector(".carousel");
    const track = document.querySelector(".carousel__track");
    const items = document.querySelectorAll(".carousel__item");
    const prevButton = document.querySelector(".carousel__control--prev");
    const nextButton = document.querySelector(".carousel__control--next");
  
    if (carousel && track && items.length > 0 && prevButton && nextButton) {
      let index = 0;
  
      function updateCarousel() {
        const itemWidth = items[0].clientWidth + 10; // Ширина элемента + gap
        const offset = (carousel.clientWidth - itemWidth) / 2; // Центрирование активного элемента
  
        // Проверяем, что ширина элементов больше 0
        if (itemWidth > 0) {
          track.style.transform = `translateX(${-index * itemWidth + offset}px)`;
        }
  
        items.forEach((item, i) => {
          item.classList.toggle("active", i === index);
        });
      }
  
      prevButton.addEventListener("click", () => {
        if (index > 0) {
          index--;
        } else {
          index = items.length - 1; // Зацикливание
        }
        updateCarousel();
      });
  
      nextButton.addEventListener("click", () => {
        if (index < items.length - 1) {
          index++;
        } else {
          index = 0; // Зацикливание
        }
        updateCarousel();
      });
  
      // Свайп для мобильных устройств
      let startX = 0;
  
      track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
      });
  
      track.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
  
        if (diff > 20) {
          nextButton.click(); // Смахивание вправо
        } else if (diff < -20) {
          prevButton.click(); // Смахивание влево
        }
      });
  
      // Инициализация карусели при загрузке
      function initializeCarousel() {
        // Ждём, пока все изображения загрузятся
        const images = track.querySelectorAll("img");
        let loadedImages = 0;
  
        images.forEach((img) => {
          if (img.complete) {
            loadedImages++;
          } else {
            img.addEventListener("load", () => {
              loadedImages++;
              if (loadedImages === images.length) {
                updateCarousel();
              }
            });
          }
        });
  
        // Если изображений нет или они уже загружены
        if (images.length === 0 || loadedImages === images.length) {
          updateCarousel();
        }
      }
  
      // Инициализация при загрузке страницы
      window.addEventListener("load", initializeCarousel);
  
      // Обновление карусели при изменении размера окна
      window.addEventListener("resize", () => {
        updateCarousel();
      });
    } else {
      console.error("Ошибка: Не все элементы карусели найдены в DOM.");
    }
  
    // Анимации карточек товаров
    const cards = document.querySelectorAll(".product-card");
  
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 200); // Задержка для каждой карточки
    });
  });