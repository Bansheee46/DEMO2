document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".burger-menu");
    const menu = document.querySelector(".b");

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
});
