
document.addEventListener("DOMContentLoaded", () => {
    const avatarButtons = document.querySelectorAll(".avatar_button");

    avatarButtons.forEach((avatarButton) => {
        const headerIcons = avatarButton.closest(".header_icons");
        const profileMenu = headerIcons?.querySelector(".profile_menu");

        if (!profileMenu) {
            return;
        }

        avatarButton.addEventListener("click", (event) => {
            event.stopPropagation();

            const isOpen = !profileMenu.hidden;
            profileMenu.hidden = isOpen;
            avatarButton.setAttribute("aria-expanded", String(!isOpen));
        });

        profileMenu.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        document.addEventListener("click", () => {
            profileMenu.hidden = true;
            avatarButton.setAttribute("aria-expanded", "false");
        });
            // Получение данных пользователя для меню профиля
        async function loadProfileMenu() {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");

            if (!token) {
                return;
            }

            try {
                const response = await fetch("/api/users/me", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    localStorage.removeItem("token");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Не удалось загрузить данные пользователя");
                }

                const user = await response.json();

                const profileNames = document.querySelectorAll(".profile_name");

                profileNames.forEach((element) => {
                    element.textContent = `${user.first_name} ${user.last_name}`;
                });

            } catch (error) {
                console.error("Ошибка загрузки меню профиля:", error);
            }
        }

        loadProfileMenu();
        // Выход из аккаунта
        function logout() {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            window.location.href = "login.html";
        }

        // Выход через выпадающее меню
        document.querySelectorAll(".logout_link").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                logout();
            });
        });

        // Выход через боковую панель профиля
        document.querySelectorAll(".exit").forEach((button) => {
            button.addEventListener("click", logout);
        });
    });
});
