document.querySelectorAll(".category-dropdown").forEach((dropdown) => {
    const trigger = dropdown.querySelector(".category-select");
    const menu = dropdown.querySelector(".category-menu");
    const hiddenInput = dropdown.querySelector(".category-value");
    const selectedEmoji = dropdown.querySelector(".category-emoji");
    const selectedText = dropdown.querySelector(".category-text");
    const options = dropdown.querySelectorAll(".category-option");

    function closeMenu() {
        dropdown.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", () => {
        const isOpen = dropdown.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(isOpen));
    });

    options.forEach((option) => {
        option.addEventListener("click", () => {
            const value = option.dataset.value;
            const emoji = option.querySelector(".option-emoji").textContent;
            const text = option.querySelector("span:nth-child(2)").textContent;

            hiddenInput.value = value;
            selectedEmoji.textContent = emoji;
            selectedText.textContent = text;

            trigger.classList.add("has-selection");

            options.forEach((item) => {
                item.classList.remove("selected");
            });

            option.classList.add("selected");
            closeMenu();
        });
    });

    document.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
            trigger.focus();
        }
    });
});