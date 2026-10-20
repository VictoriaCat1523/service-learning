
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
    });
});
