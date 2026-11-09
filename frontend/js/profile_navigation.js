
document.addEventListener("DOMContentLoaded", () => {
    const navigationButtons = document.querySelectorAll(".panel .top button");
    const contentBlocks = document.querySelectorAll(".main > div[id]");

    // Функция переключения разделов
    function openTab(targetId) {
        navigationButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.target === targetId);
        });

        contentBlocks.forEach((block) => {
            block.hidden = block.id !== targetId;
        });
    }

    // Получаем название раздела из URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedTab = urlParams.get("tab");

    // Проверяем, существует ли такой раздел
    const tabExists = Array.from(navigationButtons).some(
        (button) => button.dataset.target === selectedTab
    );

    // Открываем нужный раздел или профиль по умолчанию
    openTab(tabExists ? selectedTab : "profile");

    // Переключение разделов по нажатию на кнопки
    navigationButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openTab(button.dataset.target);
        });
    });
});
