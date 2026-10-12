
const cancelButton = document.querySelector(".cancel-btn");
const nextButton = document.getElementById("nextStep");
const formSteps = document.querySelectorAll(".create-step");
const progressSteps = document.querySelectorAll(".progress-step");

let currentStep = 1;

function validateFirstStep() {
    const category = document.querySelector(".category-value").value;
    const title = document.getElementById("requestTitle").value.trim();
    const description = document.getElementById("requestDescription").value.trim();
    const peopleCount = Number(document.getElementById("peopleCount").value);

    if (!category) {
        alert("Выберите категорию заявки.");
        return false;
    }

    if (!title) {
        alert("Введите название заявки.");
        return false;
    }

    if (!description) {
        alert("Заполните описание заявки.");
        return false;
    }

    if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 100) {
        alert("Количество человек должно быть от 1 до 100.");
        return false;
    }

    return true;
}



function validateSecondStep() {
    const meetingPlace = document.querySelector(
        '#step2 input[name="meeting-place"]:checked'
    );

    const meetingTime = document.querySelector(
        '#step2 input[name="meeting-time"]:checked'
    );

    if (!meetingPlace) {
        alert("Выберите место встречи.");
        return false;
    }

    if (!meetingTime) {
        alert("Выберите дату и время встречи.");
        return false;
    }

    return true;
}



function showStep() {
    formSteps.forEach((step, index) => {
        step.hidden = index !== currentStep - 1;
    });

    progressSteps.forEach((step, index) => {
        const circle = step.querySelector(".step-circle");

        step.classList.toggle("active", index === currentStep - 1);
        step.classList.toggle("completed", index < currentStep - 1);

        circle.textContent = index < currentStep - 1
            ? "✓"
            : String(index + 1);
    });

    cancelButton.textContent = currentStep === 1 ? "Отмена" : "Назад";
    nextButton.textContent = currentStep === formSteps.length
        ? "Опубликовать"
        : "Далее";
}

nextButton.addEventListener("click", () => {
    if (currentStep === 1 && !validateFirstStep()) {
        return;
    }

    if (currentStep === 2 && !validateSecondStep()) {
        return;
    }

    if (currentStep < formSteps.length) {
        currentStep++;
        showStep();
    } else {
        alert("Все этапы пройдены! Публикацию подключим позже.");
    }
});

cancelButton.removeAttribute("onclick");

cancelButton.addEventListener("click", () => {
    if (currentStep > 1) {
        currentStep--;
        showStep();
    } else {
        history.back();
    }
});

showStep();
