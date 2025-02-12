document.addEventListener("DOMContentLoaded", () => {
    // Бургер-меню
    const burger = document.querySelector(".burger-menu");
    const menu = document.querySelector(".b");

    if (burger && menu) {
        burger.addEventListener("click", () => {
            menu.classList.toggle("active");
            burger.classList.toggle("active");
        });
    }

    // Карусель
    const track = document.querySelector(".carousel-track");
    const items = document.querySelectorAll(".carousel-item");
    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");

    let index = 0;

    function updateCarousel() {
        const itemWidth = items[0].clientWidth + 10; // ширина элемента + отступ
        track.style.transform = `translateX(-${index * itemWidth}px)`;
    }
    

    nextButton.addEventListener("click", () => {
        if (index < items.length - 1) {
            index++;
        } else {
            index = 0; // зацикливание
        }
        updateCarousel();
    });

    prevButton.addEventListener("click", () => {
        if (index > 0) {
            index--;
        } else {
            index = items.length - 1; // зацикливание
        }
        updateCarousel();
    });

    // Добавляем свайп для мобильных
    let startX = 0;
    track.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });

    track.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        if (startX > endX + 50) {
            nextButton.click();
        } else if (startX < endX - 50) {
            prevButton.click();
        }
    });
});
