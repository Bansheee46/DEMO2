document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".burger-menu");
    const menu = document.querySelector(".b");
    const carouselInner = document.querySelector(".carousel-inner");
    let isDragging = false;
    let startX, startScrollLeft;

    if (burger && menu) {
        burger.addEventListener("click", () => {
            if (menu.classList.contains("active")) {
                menu.classList.add("closing");
                setTimeout(() => {
                    menu.classList.remove("active", "closing");
                }, 500); // Длительность анимации
            } else {
                menu.classList.remove("closing");
                menu.classList.add("active");
            }
            burger.classList.toggle("active");
            const isExpanded = burger.getAttribute("aria-expanded") === "true";
            burger.setAttribute("aria-expanded", !isExpanded);
        });
    } else {
        console.error("Элементы бургер-меню не найдены");
    }

    if (carouselInner) {
        const dragStart = (e) => {
            isDragging = true;
            carouselInner.classList.add("dragging");
            startX = e.pageX || e.touches[0].pageX;
            startScrollLeft = carouselInner.scrollLeft;
        };

        const dragging = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX || e.touches[0].pageX;
            const distance = (x - startX);
            carouselInner.scrollLeft = startScrollLeft - distance;
        };

        const dragStop = () => {
            isDragging = false;
            carouselInner.classList.remove("dragging");
        };

        carouselInner.addEventListener("mousedown", dragStart);
        carouselInner.addEventListener("touchstart", dragStart);

        carouselInner.addEventListener("mousemove", dragging);
        carouselInner.addEventListener("touchmove", dragging);

        carouselInner.addEventListener("mouseup", dragStop);
        carouselInner.addEventListener("mouseleave", dragStop);
        carouselInner.addEventListener("touchend", dragStop);
    } else {
        console.error("Элементы карусели не найдены");
    }
});
