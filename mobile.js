// mobile.js
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('nav');
    
    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');  // Добавляем/убираем класс для открытия/закрытия меню
    });
});
