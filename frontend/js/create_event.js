// =====================================================
// 1. ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ СТРАНИЦЫ
// =====================================================
const cancelButton = document.querySelector(".cancel-btn");
const nextButton = document.getElementById("nextStep");
const formSteps = document.querySelectorAll(".create-step");
const progressSteps = document.querySelectorAll(".progress-step");

// =====================================================
// ГЕНЕРАЦИЯ ID ЗАЯВКИ
// =====================================================
function generateEventId() {
    if (!crypto.randomUUID) {
        throw new Error("Ваш браузер не поддерживает генерацию UUID.");
    }
    return `evt_${crypto.randomUUID()}`;
}
const eventId = generateEventId();
let currentStep = 1;

// =====================================================
// 2. ОБЪЕКТ ДЛЯ ХРАНЕНИЯ ДАННЫХ ЗАЯВКИ
// =====================================================
const requestData = {
    id: eventId,
    step1: { category: "", title: "", description: "", people_count: 1 },
    step2: {},
    step3: {},
    file_path: null
};

let selectedRequestFile = null;
const fileInput = document.getElementById("event-file");
if (fileInput) {
    fileInput.addEventListener("change", () => {
        selectedRequestFile = fileInput.files[0] ?? null;
        updateReview();
    });
}

// =====================================================
// 3. СОХРАНЕНИЕ ДАННЫХ ЭТАПА
// =====================================================
function saveStepData(stepNumber) {
    const step = document.getElementById(`step${stepNumber}`);
    if (!step) return;

    const fields = step.querySelectorAll("input, select, textarea");
    const data = requestData[`step${stepNumber}`];

    fields.forEach((field) => {
        const key = field.name || field.id;
        if (field.type === "file" || !key) return;

        if (field.type === "radio") {
            if (field.checked) data[key] = field.value;
            else if (!(key in data)) data[key] = "";
            return;
        }
        if (field.type === "checkbox") {
            data[key] = field.checked;
            return;
        }
        if (field.type !== "button" && field.type !== "submit") {
            data[key] = field.value;
        }
    });

    if (stepNumber === 1) {
        const category = step.querySelector(".category-value");
        const title = step.querySelector("#requestTitle");
        const description = step.querySelector("#requestDescription");
        const peopleCount = step.querySelector("#peopleCount");

        if (category) data.category = category.value;
        if (title) data.title = title.value.trim();
        if (description) data.description = description.value.trim();
        if (peopleCount) data.people_count = Number(peopleCount.value);
    }
}

// =====================================================
// 4. ВОССТАНОВЛЕНИЕ ДАННЫХ ЭТАПА
// =====================================================
function restoreStepData(stepNumber) {
    const step = document.getElementById(`step${stepNumber}`);
    if (!step) return;

    const data = requestData[`step${stepNumber}`];
    const fields = step.querySelectorAll("input, select, textarea");

    fields.forEach((field) => {
        const key = field.name || field.id;
        if (field.type === "file" || !key || !(key in data)) return;

        if (field.type === "radio") {
            field.checked = field.value === String(data[key]);
            return;
        }
        if (field.type === "checkbox") {
            field.checked = Boolean(data[key]);
            return;
        }
        if (field.type !== "button" && field.type !== "submit") {
            field.value = data[key] ?? "";
        }
    });

    if (stepNumber === 3) updateAdditionalSettings();
}

// =====================================================
// 5. ОБНОВЛЕНИЕ ПОЛЕЙ ПРИ ИХ ИЗМЕНЕНИИ
// =====================================================
formSteps.forEach((step, index) => {
    const stepNumber = index + 1;
    step.addEventListener("input", () => { saveStepData(stepNumber); updateReview(); });
    step.addEventListener("change", () => { saveStepData(stepNumber); updateReview(); });
});

// =====================================================
// 6. ПРОВЕРКА ПЕРВОГО ЭТАПА
// =====================================================
function validateFirstStep() {
    const category = document.querySelector(".category-value").value;
    const title = document.getElementById("requestTitle").value.trim();
    const description = document.getElementById("requestDescription").value.trim();
    const peopleCount = Number(document.getElementById("peopleCount").value);

    if (!category) { alert("Выберите категорию заявки."); return false; }
    if (!title) { alert("Введите название заявки."); return false; }
    if (!description) { alert("Заполните описание заявки."); return false; }
    if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 100) {
        alert("Количество человек должно быть от 1 до 100."); return false;
    }
    return true;
}

// =====================================================
// 7. ПРОВЕРКА ВТОРОГО ЭТАПА
// =====================================================
function validateSecondStep() {
    const meetingPlace = document.querySelector('#step2 input[name="meeting-place"]:checked');
    const meetingTime = document.querySelector('#step2 input[name="meeting-time"]:checked');

    if (!meetingPlace) { alert("Выберите место встречи."); return false; }
    if (!meetingTime) { alert("Выберите дату и время встречи."); return false; }
    
    // Дополнительная проверка: если выбрано "custom", дата должна быть заполнена
    if (meetingTime && meetingTime.value === "custom") {
        const eventDate = document.getElementById("event-date").value;
        if (!eventDate) {
            alert("Пожалуйста, выберите конкретную дату в появившемся поле!");
            return false;
        }
    }
    return true;
}

// =====================================================
// 8. ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ
// =====================================================
function updateAdditionalSettings() {
    const allowSuggestions = document.querySelector('#step3 input[name="allow-suggestions"]');
    const flexibleOptions = document.querySelectorAll('#step3 input[name="flexible-time"], #step3 input[name="flexible-place"]');

    if (!allowSuggestions) return;

    flexibleOptions.forEach((option) => {
        option.disabled = !allowSuggestions.checked;
        if (option.disabled) option.checked = false;
    });
    saveStepData(3);
}

function setupAdditionalSettings() {
    const budgetOptions = document.querySelectorAll('#step3 input[name="budget-type"]');
    const budgetInput = document.querySelector("#step3 .budget-input");

    if (budgetOptions.length && budgetInput) {
        budgetOptions.forEach((option) => {
            option.addEventListener("change", () => {
                budgetInput.hidden = option.value !== "specified";
                saveStepData(3);
                updateReview();
            });
        });
    }

    const allowSuggestions = document.querySelector('#step3 input[name="allow-suggestions"]');
    if (allowSuggestions) {
        allowSuggestions.addEventListener("change", updateAdditionalSettings);
    }
    updateAdditionalSettings();
}

// =====================================================
// 8.5. ПОКАЗ ПОЛЕЙ ДАТЫ/ВРЕМЕНИ ПРИ ВЫБОРЕ "custom"
// =====================================================
function setupDateTimeToggle() {
    const customBlock = document.querySelector('.custom-datetime');
    const timeRadios = document.querySelectorAll('#step2 input[name="meeting-time"]');

    if (!customBlock || !timeRadios.length) return;

    timeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            customBlock.hidden = radio.value !== 'custom' || !radio.checked;
            saveStepData(2);
            updateReview();
        });
    });

    const selected = document.querySelector('#step2 input[name="meeting-time"]:checked');
    if (selected) {
        customBlock.hidden = selected.value !== 'custom';
    }
}

// =====================================================
// 9. ОТОБРАЖЕНИЕ НУЖНОГО ЭТАПА
// =====================================================
function showStep() {
    saveStepData(currentStep);
    formSteps.forEach((step, index) => {
        step.hidden = index !== currentStep - 1;
    });
    progressSteps.forEach((step, index) => {
        const circle = step.querySelector(".step-circle");
        step.classList.toggle("active", index === currentStep - 1);
        step.classList.toggle("completed", index < currentStep - 1);
        if (circle) {
            circle.textContent = index < currentStep - 1 ? "✓" : String(index + 1);
        }
    });
    cancelButton.textContent = currentStep === 1 ? "Отмена" : "Назад";
    nextButton.textContent = "Далее";
    nextButton.hidden = currentStep === formSteps.length;
    restoreStepData(currentStep);
    updateReview();
}

// =====================================================
// 10. КНОПКА «ДАЛЕЕ» И ПУБЛИКАЦИЯ
// =====================================================
nextButton.addEventListener("click", () => {
    saveStepData(currentStep);
    if (currentStep === 1 && !validateFirstStep()) return;
    if (currentStep === 2 && !validateSecondStep()) return;

    if (currentStep < formSteps.length) {
        currentStep++;
        showStep();
    }
});

const publishButton = document.getElementById("publishRequest");
if (publishButton) {
    publishButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            alert("Пожалуйста, сначала войдите в аккаунт!");
            window.location.href = "login.html";
            return;
        }

        saveStepData(1);
        saveStepData(2);
        saveStepData(3);

        let payload;
        try {
            payload = buildRequestPayload();
        } catch (error) {
            alert(error.message || "Проверьте правильность заполнения формы");
            publishButton.disabled = false;
            publishButton.textContent = "Опубликовать заявку";
            return;
        }

        publishButton.disabled = true;
        publishButton.textContent = "Публикация...";

        try {
            const response = await fetch('/api/requests/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Заявка успешно опубликована!");
                window.location.href = "my_requests.html";
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Полный ответ ошибки от сервера:", errorData);

                let errorMessage = 'Не удалось создать заявку';
                if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => {
                        const field = err.loc?.join('.') || 'Поле';
                        const msg = err.msg || 'неизвестная ошибка';
                        return `${field}: ${msg}`;
                    }).join('\n');
                }
                alert(`Ошибка при создании заявки:\n\n${errorMessage}`);
            }
        } catch (error) {
            console.error("Ошибка сети:", error);
            alert("Ошибка сети или сервер недоступен. Проверьте, запущен ли backend.");
        } finally {
            publishButton.disabled = false;
            publishButton.textContent = "Опубликовать заявку";
        }
    });
}

// =====================================================
// 11. КНОПКА «НАЗАД» И «ОТМЕНА»
// =====================================================
cancelButton.removeAttribute("onclick");
cancelButton.addEventListener("click", () => {
    if (currentStep === 1) {
        history.back();
        return;
    }
    saveStepData(currentStep);
    currentStep--;
    showStep();
});

// =====================================================
// 12. КНОПКИ «ИЗМЕНИТЬ» НА ЭТАПЕ ПРОВЕРКИ
// =====================================================
document.querySelectorAll("[data-edit-step]").forEach((button) => {
    button.addEventListener("click", () => {
        const targetStep = Number(button.dataset.editStep);
        if (!Number.isInteger(targetStep) || targetStep < 1 || targetStep > formSteps.length) return;

        saveStepData(1);
        saveStepData(2);
        saveStepData(3);
        currentStep = targetStep;
        showStep();
    });
});

// =====================================================
// 13. ОБНОВЛЕНИЕ СВОДКИ НА ЭТАПЕ ПРОВЕРКИ
// =====================================================
function updateReview() {
    const details = requestData.step1;
    const meeting = requestData.step2;
    const additional = requestData.step3;

    function setReviewValue(id, value, fallback = "Не указано") {
        const element = document.getElementById(id);
        if (!element) return;
        element.textContent = value !== undefined && value !== null && value !== "" ? String(value) : fallback;
    }

    setReviewValue("review-title", details.title, "Не указано");
    setReviewValue("review-category", details.category, "Не выбрана");
    setReviewValue("review-description", details.description, "Не указано");
    setReviewValue("review-people", details.people_count, "Не указано");
    setReviewValue("review-place", meeting["meeting-place"], "Не указано");
    setReviewValue("review-time", meeting["meeting-time"], "Не указано");
    setReviewValue("review-place-comment", meeting["meeting-place-details"], "Не указан");
    setReviewValue("review-time-comment", meeting["meeting-time-comment"] ?? meeting["time-comment"] ?? meeting["meetingTimeComment"], "Не указан");

    const budgetType = additional["budget-type"];
    const budgetValue = additional["budget"] ?? additional["event-budget"] ?? additional["budget-amount"];
    let budgetText = "Не указан";
    if (budgetType === "specified") {
        budgetText = budgetValue !== undefined && budgetValue !== "" ? `${budgetValue} на одного участника` : "Сумма не указана";
    } else if (budgetType) {
        budgetText = budgetType;
    }
    setReviewValue("review-budget", budgetText, "Не указан");

    setReviewValue("review-suggestions", additional["allow-suggestions"] ? "Да" : "Нет");
    setReviewValue("review-flexible-time", additional["flexible-time"] ? "Да" : "Нет");
    setReviewValue("review-flexible-place", additional["flexible-place"] ? "Да" : "Нет");
    setReviewValue("review-hide-full", additional["hide-when-full"] ? "Да" : "Нет");
    setReviewValue("review-reminders", additional["meeting-reminders"] ? "Да" : "Нет");
    setReviewValue("review-file", selectedRequestFile?.name, "Не прикреплены");
}

// =====================================================
// 14. ФОРМИРОВАНИЕ ДАННЫХ ДЛЯ PYTHON-БЭКЕНДА
// =====================================================
function buildRequestPayload() {
    const step1 = requestData.step1;
    const step2 = requestData.step2 || {};
    const step3 = requestData.step3 || {};

    // 1. Собираем валидный datetime
    let dateTimeValue;
    if (step2["meeting-time"] === "custom") {
        const date = step2["event-date"];
        const time = step2["event-time"] || "18:00";
        if (!date) {
            throw new Error("Пожалуйста, выберите дату встречи!");
        }
        const timePart = time.length === 5 ? `${time}:00` : time;
        dateTimeValue = `${date}T${timePart}`;
    } else {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        dateTimeValue = now.toISOString().slice(0, 19);
    }

        // 2. Собираем место
    let locationValue = "Не указано";
    if (step2["meeting-place-details"]) {
        locationValue = step2["meeting-place-details"]; // Если ввели адрес, показываем его
    } else if (step2["meeting-place"] === "online") {
        locationValue = "Онлайн";
    } else if (step2["meeting-place"] === "anywhere") {
        locationValue = "На усмотрение участников";
    } else if (step2["meeting-place"] === "specific") {
        locationValue = "В определенном месте";
    } else if (step2["meeting-place"]) {
        locationValue = step2["meeting-place"]; // Запасной вариант
    }

    // 3. Собираем бюджет
    let budgetValue = null;
    if (step3["budget-type"] === "specified") {
        budgetValue = step3["event-budget"] || null;
    }

    return {
        title: step1.title || "Без названия",
        description: step1.description || "",
        activity_type: step1.category || "Другое",
        location: locationValue,
        date_time: dateTimeValue,
        people_count: Number(step1.people_count) || 1,
        budget: budgetValue,
        file_path: requestData.file_path || null
    };
}

// =====================================================
// 15. ЗАПУСК НАСТРОЕК И ОТОБРАЖЕНИЕ ПЕРВОГО ЭТАПА
// =====================================================
setupAdditionalSettings();
setupDateTimeToggle(); // <-- ДОБАВЛЕНО

saveStepData(1);
saveStepData(2);
saveStepData(3);
showStep();