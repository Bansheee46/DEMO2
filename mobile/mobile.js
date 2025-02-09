document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".burger-menu");
    const menu = document.querySelector(".b");

    if (burger && menu) {
        burger.addEventListener("click", () => {
            menu.classList.toggle("active");
        });
    } else {
        console.error("Элементы бургер-меню не найдены");
    }
});
