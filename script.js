document.addEventListener("DOMContentLoaded", function () {
    const button = document.querySelector(".catalog-toggle");
    const sidebar = document.getElementById("sidebar");
    const closeButton = document.querySelector(".close-sidebar");

    if (button && sidebar) {
        button.addEventListener("click", function () {
            sidebar.classList.toggle("active");
            console.log("Кнопка нажата, состояние панели: " + (sidebar.classList.contains("active") ? "открыта" : "закрыта"));
        });
    } else {
        console.error("Элементы не найдены в DOM.");
    }

    if (closeButton && sidebar) {
        closeButton.addEventListener("click", function () {
            sidebar.classList.remove("active");
            console.log("Каталог закрыт");
        });
    } else {
        console.error("Кнопка закрытия или панель не найдены в DOM.");
    }
});

//parse
parse.initialize("h2c35HqCvBZJldXwlkivSY0C8InNFrtobkJfd3ar","VdJsJTjxZ7MpI0tBVVzvBwpreHQmwHrZhXLt6Nd8");
parse.serverURL = "https://parseapi.back4app.com/";
