const cancelButton = document.querySelector(".cancel-btn");
const nextButton = document.getElementById("nextStep");

nextButton.addEventListener("click", () => {
    const category = document.querySelector(".category-value").value;
    const title = document.getElementById("requestTitle").value.trim();
    const description = document.getElementById("requestDescription").value.trim();
    const peopleCount = Number(document.getElementById("peopleCount").value);

    if (!category) {
        alert("Выберите категорию заявки.");
        return;
    }

    if (!title) {
        alert("Введите название заявки.");
        return;
    }

    if (!description) {
        alert("Заполните описание заявки.");
        return;
    }

    if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 100) {
        alert("Количество человек должно быть от 1 до 100.");
        return;
    }

    document.querySelector(".create-plan").hidden = true;
    document.querySelector(".advice").hidden = true;
    document.getElementById("step2").hidden = false;

    cancelButton.textContent = "Назад";
    cancelButton.removeAttribute("onclick");
    const steps = document.querySelectorAll(".progress-step");
    steps[0].classList.remove("active");
    steps[1].classList.add("active");
});

cancelButton.addEventListener("click", () => {
    const step2 = document.getElementById("step2");

    if (!step2.hidden) {
        step2.hidden = true;
        document.querySelector(".create-plan").hidden = false;
        document.querySelector(".advice").hidden = false;

        const steps = document.querySelectorAll(".progress-step");
        steps[1].classList.remove("active");
        steps[0].classList.add("active");

        cancelButton.textContent = "Отмена";
    } else {
        history.back();
    }
});
