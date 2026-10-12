
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("#authModalContainer");

    if (!container) {
        return;
    }

    try {
        const response = await fetch("auth_modal.html");

        if (!response.ok) {
            throw new Error(`Ошибка загрузки окна: ${response.status}`);
        }

        container.innerHTML = await response.text();
    } catch (error) {
        console.error("Не удалось загрузить модальное окно:", error);
        return;
    }

    const modal = document.querySelector("#authModal");

    if (!modal) {
        console.error("В auth_modal.html не найден элемент #authModal");
        return;
    }

    function openModal() {
        modal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = "";
    }

    document.addEventListener("click", (event) => {
        const registerLink = event.target.closest("[data-open-register]");

        if (registerLink) {
            sessionStorage.setItem("openRegister", "true");
        }
        const openButton = event.target.closest("[data-auth-modal-open]");

        if (openButton) {
            event.preventDefault();
            openModal();
            return;
        }

        if (event.target.closest("[data-auth-modal-close]")) {
            closeModal();
            return;
        }

        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
});
