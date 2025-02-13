document.addEventListener("DOMContentLoaded", () => {
    // Инициализация бургер-меню
    const burgerMenu = document.querySelector(".burger-menu");
    const mobileNav = document.getElementById("mobileMenu");
  
    burgerMenu.addEventListener("click", () => {
      const isExpanded = burgerMenu.getAttribute("aria-expanded") === "true";
      burgerMenu.setAttribute("aria-expanded", !isExpanded);
      mobileNav.classList.toggle("active");
      burgerMenu.classList.toggle("active");
    });
  
    // Инициализация карусели
    const carousel = document.querySelector(".carousel");
    const track = document.querySelector(".carousel__track");
    const items = document.querySelectorAll(".carousel__item");
    const prevButton = document.querySelector(".carousel__control--prev");
    const nextButton = document.querySelector(".carousel__control--next");
  
    let index = 0;
    let startX = 0;
  
    function updateCarousel() {
      const containerWidth = carousel.clientWidth;
      const itemWidth = items[0].clientWidth;
      const gap = 10; // Фиксированный gap между элементами
      const offset = containerWidth / 2 - itemWidth / 2;
  
      // Бесконечная карусель: клонируем первый и последний элементы
      if (index >= items.length) {
        index = 0; // Переход к первому элементу
        track.style.transition = "none"; // Отключаем анимацию
        setTimeout(() => {
          track.style.transform = `translateX(0)`;
          track.style.transition = "transform 0.5s ease-in-out";
        }, 0);
      } else if (index < 0) {
        index = items.length - 1; // Переход к последнему элементу
        track.style.transition = "none";
        setTimeout(() => {
          track.style.transform = `translateX(${-((items.length - 1) * (itemWidth + gap))}px)`;
          track.style.transition = "transform 0.5s ease-in-out";
        }, 0);
      } else {
        const translateX = index * (itemWidth + gap) - offset;
        track.style.transform = `translateX(${-translateX}px)`;
      }
  
      // Обновляем активный элемент
      items.forEach((item, i) => {
        item.classList.toggle("active", i === index);
      });
    }
  
    // Обработчики для стрелок
    prevButton.addEventListener("click", () => {
      index--;
      updateCarousel();
    });
  
    nextButton.addEventListener("click", () => {
      index++;
      updateCarousel();
    });
  
    // Автоматическая прокрутка
    let autoSlide = setInterval(() => nextButton.click(), 3000);
  
    // Остановка автопрокрутки при наведении
    carousel.addEventListener("mouseenter", () => clearInterval(autoSlide));
    carousel.addEventListener("mouseleave", () => {
      autoSlide = setInterval(() => nextButton.click(), 3000);
    });
  
    // Свайп для мобильных устройств
    let isDragging = false;
    let startDragX = 0;
    let currentTranslate = 0;
  
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
  
    // Drag-and-drop для десктопа
    track.addEventListener("mousedown", (e) => {
      isDragging = true;
      startDragX = e.clientX;
      currentTranslate = getComputedStyle(track).transform.match(/matrix.*\((.+)\)/)[1].split(", ")[4];
    });
  
    track.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startDragX;
      track.style.transform = `translateX(${currentTranslate + deltaX}px)`;
    });
  
    track.addEventListener("mouseup", () => {
      isDragging = false;
      const deltaX = e.clientX - startDragX;
  
      if (deltaX > 50) {
        prevButton.click();
      } else if (deltaX < -50) {
        nextButton.click();
      }
    });
  
    track.addEventListener("mouseleave", () => {
      isDragging = false;
    });
  
    // Центрируем первый элемент при загрузке
    updateCarousel();
  });