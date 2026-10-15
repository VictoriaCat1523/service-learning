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

// Создаём уникальный идентификатор для новой заявки.
// Префикс evt помогает отличать ID заявок от других ID.

function generateEventId() {
    if (!crypto.randomUUID) {
        throw new Error(
            "Ваш браузер не поддерживает генерацию UUID."
        );
    }

    return `evt_${crypto.randomUUID()}`;
}

// ID создаётся один раз при открытии формы.
// При переходах между этапами он не меняется.

const eventId = generateEventId();





// Текущий этап формы
let currentStep = 1;


// =====================================================
// 2. ОБЪЕКТ ДЛЯ ХРАНЕНИЯ ДАННЫХ ЗАЯВКИ
// =====================================================

// Все данные заявки хранятся в одном объекте.
// step1 — детали заявки.
// step2 — место и время.
// step3 — дополнительные настройки.
//
// Значения будут обновляться при изменении полей.

const requestData = {
    // Уникальный ID заявки.
    id: eventId,

    // Название и основные сведения.
    step1: {
        category: "",
        title: "",
        description: "",
        people_count: 1
    },

    // Место, дата и время встречи.
    step2: {},

    // Дополнительные настройки и вложения.
    step3: {},

    // Относительный путь к сохранённому файлу.
    // Пока файл не отправлен на сервер, путь неизвестен.
    file_path: null
};


// =====================================================
// ХРАНЕНИЕ ВЫБРАННОГО ФАЙЛА
// =====================================================

// Сам файл храним отдельно от обычных данных заявки.
// selectedRequestFile содержит объект выбранного файла
// или null, если файл не выбран.

let selectedRequestFile = null;

// Получаем поле выбора файла из HTML.
const fileInput = document.getElementById("event-file");

// Запоминаем выбранный файл.
// Если пользователь отменил выбор, сохраняем null.
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

    // Если этап не найден, сохранять нечего.
    if (!step) {
        return;
    }

    // Получаем все поля ввода текущего этапа.
    const fields = step.querySelectorAll("input, select, textarea");
    const data = requestData[`step${stepNumber}`];

    fields.forEach((field) => {
        // У каждого поля должен быть name или id.
        const key = field.name || field.id;

        // Файл обрабатывается отдельно, не как текстовое поле.
        if (field.type === "file") {
            return;
        }

        if (!key) {
            return;
        }

        // Для radio сохраняем значение выбранного варианта.
        if (field.type === "radio") {
            if (field.checked) {
                data[key] = field.value;
            } else if (!(key in data)) {
                data[key] = "";
            }

            return;
        }

        // Для checkbox сохраняем true или false.
        if (field.type === "checkbox") {
            data[key] = field.checked;
            return;
        }

        // Для обычных полей сохраняем введённое значение.
        if (field.type !== "button" && field.type !== "submit") {
            data[key] = field.value;
        }
    });

    // На первом этапе используем понятные имена полей
    // для последующей отправки данных на бэкенд.
    if (stepNumber === 1) {
        const category = step.querySelector(".category-value");
        const title = step.querySelector("#requestTitle");
        const description = step.querySelector("#requestDescription");
        const peopleCount = step.querySelector("#peopleCount");

        if (category) {
            data.category = category.value;
        }

        if (title) {
            data.title = title.value.trim();
        }

        if (description) {
            data.description = description.value.trim();
        }

        if (peopleCount) {
            data.people_count = Number(peopleCount.value);
        }
    }
}


// =====================================================
// 4. ВОССТАНОВЛЕНИЕ ДАННЫХ ЭТАПА
// =====================================================

function restoreStepData(stepNumber) {
    const step = document.getElementById(`step${stepNumber}`);

    if (!step) {
        return;
    }

    const data = requestData[`step${stepNumber}`];
    const fields = step.querySelectorAll("input, select, textarea");

    fields.forEach((field) => {
        const key = field.name || field.id;

        // Браузер запрещает восстанавливать файл через field.value.
        // Выбранный файл сохраняется отдельно в selectedRequestFile.
        if (field.type === "file") {
            return;
        }

        if (!key || !(key in data)) {
            return;
        }

        // Восстанавливаем выбранный radio.
        if (field.type === "radio") {
            field.checked = field.value === String(data[key]);
            return;
        }

        // Восстанавливаем состояние checkbox.
        if (field.type === "checkbox") {
            field.checked = Boolean(data[key]);
            return;
        }

        // Восстанавливаем текстовые поля, select и textarea.
        if (field.type !== "button" && field.type !== "submit") {
            field.value = data[key] ?? "";
        }
    });

    // После восстановления обновляем связанные настройки.
    if (stepNumber === 3) {
        updateAdditionalSettings();
    }
}


// =====================================================
// 5. ОБНОВЛЕНИЕ ПОЛЕЙ ПРИ ИХ ИЗМЕНЕНИИ
// =====================================================

// Слушаем изменения на всех трёх этапах.
// Делегирование позволяет обрабатывать и динамические поля.

formSteps.forEach((step, index) => {
    const stepNumber = index + 1;

    step.addEventListener("input", () => {
        saveStepData(stepNumber);
        updateReview();
    });

    step.addEventListener("change", () => {
        saveStepData(stepNumber);
        updateReview();
    });
});


// =====================================================
// 6. ПРОВЕРКА ПЕРВОГО ЭТАПА
// =====================================================

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


// =====================================================
// 7. ПРОВЕРКА ВТОРОГО ЭТАПА
// =====================================================

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


// =====================================================
// 8. ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ
// =====================================================

// Включаем или отключаем выбор гибких условий.
// Эта функция используется при изменении настроек
// и при восстановлении третьего этапа.

function updateAdditionalSettings() {
    const allowSuggestions = document.querySelector(
        '#step3 input[name="allow-suggestions"]'
    );

    const flexibleOptions = document.querySelectorAll(
        '#step3 input[name="flexible-time"], ' +
        '#step3 input[name="flexible-place"]'
    );

    if (!allowSuggestions) {
        return;
    }

    flexibleOptions.forEach((option) => {
        option.disabled = !allowSuggestions.checked;

        if (option.disabled) {
            option.checked = false;
        }
    });

    // Сохраняем фактическое состояние после отключения полей.
    saveStepData(3);
}


// Настраиваем поле бюджета и зависимые настройки.

function setupAdditionalSettings() {
    const budgetOptions = document.querySelectorAll(
        '#step3 input[name="budget-type"]'
    );

    const budgetInput = document.querySelector("#step3 .budget-input");

    if (budgetOptions.length && budgetInput) {
        budgetOptions.forEach((option) => {
            option.addEventListener("change", () => {
                // Поле суммы показывается только при выборе
                // варианта с заданным бюджетом.
                budgetInput.hidden = option.value !== "specified";

                saveStepData(3);
                updateReview();
            });
        });
    }

    const allowSuggestions = document.querySelector(
        '#step3 input[name="allow-suggestions"]'
    );

    if (allowSuggestions) {
        allowSuggestions.addEventListener(
            "change",
            updateAdditionalSettings
        );
    }

    updateAdditionalSettings();
}


// =====================================================
// 9. ОТОБРАЖЕНИЕ НУЖНОГО ЭТАПА
// =====================================================

function showStep() {
    // Перед переключением сохраняем данные текущего этапа.
    saveStepData(currentStep);

    // Скрываем остальные этапы и показываем нужный.
    formSteps.forEach((step, index) => {
        step.hidden = index !== currentStep - 1;
    });

    // Обновляем индикатор прогресса.
    progressSteps.forEach((step, index) => {
        const circle = step.querySelector(".step-circle");

        step.classList.toggle("active", index === currentStep - 1);
        step.classList.toggle("completed", index < currentStep - 1);

        if (circle) {
            circle.textContent = index < currentStep - 1
                ? "✓"
                : String(index + 1);
        }
    });

    // Меняем подписи кнопок в зависимости от этапа.
    cancelButton.textContent = currentStep === 1 ? "Отмена" : "Назад";

    nextButton.textContent = currentStep === formSteps.length
        ? "Опубликовать"
        : "Далее";

    // Восстанавливаем данные открываемого этапа.
    restoreStepData(currentStep);

    // Обновляем сводку на этапе проверки.
    updateReview();
}


// =====================================================
// 10. КНОПКА «ДАЛЕЕ» И ПУБЛИКАЦИЯ
// =====================================================

nextButton.addEventListener("click", () => {
    // Сохраняем изменения перед переходом.
    saveStepData(currentStep);

    // Проверяем обязательные поля первого этапа.
    if (currentStep === 1 && !validateFirstStep()) {
        return;
    }

    // Проверяем обязательные поля второго этапа.
    if (currentStep === 2 && !validateSecondStep()) {
        return;
    }

    // Если остались этапы, переходим к следующему.
    if (currentStep < formSteps.length) {
        currentStep++;
        showStep();
        return;
    }

    // На последнем этапе собираем все актуальные данные.
    saveStepData(1);
    saveStepData(2);
    saveStepData(3);

    // Пока только выводим данные в консоль браузера.
    // Позже здесь подключим POST-запрос к Python-бэкенду.
    const payload = buildRequestPayload();

    console.log("Данные заявки для бэкенда:", payload);
    console.log("JSON заявки:", JSON.stringify(payload, null, 2));

    alert("Данные заявки собраны. Отправку на сервер подключим позже.");

});

// Кнопка публикации заявки
const publishButton = document.getElementById("publishRequest");

if (publishButton) {
    publishButton.addEventListener("click", () => {
        // Собираем актуальные данные всех этапов
        saveStepData(1);
        saveStepData(2);
        saveStepData(3);

        // Формируем объект заявки
        const payload = buildRequestPayload();

        // Преобразуем объект в JSON с отступами
        const json = JSON.stringify(payload, null, 2);

        // Создаём файл JSON в памяти браузера
        const blob = new Blob([json], {
            type: "application/json;charset=utf-8"
        });

        // Создаём временную ссылку на файл
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        // Имя файла содержит уникальный ID заявки
        link.href = url;
        link.download = `${payload.id}.json`;

        // Запускаем скачивание
        document.body.appendChild(link);
        link.click();

        // Удаляем временные элементы
        link.remove();
        URL.revokeObjectURL(url);

        console.log("Заявка сохранена в JSON:", payload);

        alert("Файл заявки JSON подготовлен к сохранению.");
    });
}

// =====================================================
// 11. КНОПКА «НАЗАД» И «ОТМЕНА»
// =====================================================

cancelButton.removeAttribute("onclick");

cancelButton.addEventListener("click", () => {
    // На первом этапе возвращаемся на предыдущую страницу.
    if (currentStep === 1) {
        history.back();
        return;
    }

    // На остальных этапах переходим назад,
    // сохраняя данные в объекте requestData.
    saveStepData(currentStep);
    currentStep--;
    showStep();
});


// =====================================================
// 12. КНОПКИ «ИЗМЕНИТЬ» НА ЭТАПЕ ПРОВЕРКИ
// =====================================================

// Для работы этих кнопок в HTML нужен атрибут data-edit-step.
// Например: data-edit-step="1" — вернуться к первому этапу.

document.querySelectorAll("[data-edit-step]").forEach((button) => {
    button.addEventListener("click", () => {
        const targetStep = Number(button.dataset.editStep);

        // Проверяем, что указан существующий этап.
        if (
            !Number.isInteger(targetStep) ||
            targetStep < 1 ||
            targetStep > formSteps.length
        ) {
            return;
        }

        // Сохраняем все этапы перед переходом.
        saveStepData(1);
        saveStepData(2);
        saveStepData(3);

        // Открываем нужный этап без сброса данных.
        currentStep = targetStep;
        showStep();
    });
});


// =====================================================
// 13. ОБНОВЛЕНИЕ СВОДКИ НА ЭТАПЕ ПРОВЕРКИ
// =====================================================

// Элементы сводки в HTML должны иметь атрибут
// data-review-field с путём к значению.
// Примеры: step1.title, step2.meeting-place.

function updateReview() {
    // Получаем данные трёх этапов.
    const details = requestData.step1;
    const meeting = requestData.step2;
    const additional = requestData.step3;

    // Универсальная функция для вывода текста в элемент.
    function setReviewValue(id, value, fallback = "Не указано") {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =
            value !== undefined && value !== null && value !== ""
                ? String(value)
                : fallback;
    }

    // Этап 1: детали заявки.
    setReviewValue("review-title", details.title, "Не указано");
    setReviewValue("review-category", details.category, "Не выбрана");
    setReviewValue("review-description", details.description, "Не указано");
    setReviewValue("review-people", details.people_count, "Не указано");

    // Этап 2: место, дата и время.
    setReviewValue(
        "review-place",
        meeting["meeting-place"],
        "Не указано"
    );

    setReviewValue(
        "review-time",
        meeting["meeting-time"],
        "Не указано"
    );

    // Комментарии к месту и времени.
    // Здесь перечислены возможные имена полей:
    // фактические названия нужно сверить с HTML.
    setReviewValue(
        "review-place-comment",
        meeting["meeting-place-details"],
        "Не указан"
    );

    setReviewValue(
        "review-time-comment",
        meeting["meeting-time-comment"] ??
        meeting["time-comment"] ??
        meeting["meetingTimeComment"],
        "Не указан"
    );

    // Этап 3: бюджет.
    const budgetType = additional["budget-type"];
    const budgetValue =
        additional["budget"] ??
        additional["event-budget"] ??
        additional["budget-amount"];

    let budgetText = "Не указан";

    if (budgetType === "specified") {
        budgetText = budgetValue !== undefined && budgetValue !== ""
            ? `${budgetValue} на одного участника`
            : "Сумма не указана";
    } else if (budgetType) {
        budgetText = budgetType;
    }

    setReviewValue("review-budget", budgetText, "Не указан");

    // Остальные настройки.
    setReviewValue(
        "review-suggestions",
        additional["allow-suggestions"] ? "Да" : "Нет"
    );

    setReviewValue(
        "review-flexible-time",
        additional["flexible-time"] ? "Да" : "Нет"
    );

    setReviewValue(
        "review-flexible-place",
        additional["flexible-place"] ? "Да" : "Нет"
    );

    setReviewValue(
        "review-hide-full",
        additional["hide-when-full"] ? "Да" : "Нет"
    );

    setReviewValue(
        "review-reminders",
        additional["meeting-reminders"] ? "Да" : "Нет"
    );
    // Показываем имя выбранного файла на этапе проверки.
    setReviewValue(
        "review-file",
        selectedRequestFile?.name,
        "Не прикреплены"
    );
}


// =====================================================
// 14. ФОРМИРОВАНИЕ ДАННЫХ ДЛЯ PYTHON-БЭКЕНДА
// =====================================================

function buildRequestPayload() {
    return {
        // Идентификатор заявки.
        id: requestData.id,

        // Данные первого этапа.
        step1: { ...requestData.step1 },

        // Данные второго этапа.
        step2: { ...requestData.step2 },

        // Данные третьего этапа.
        step3: { ...requestData.step3 },

        // Путь появится после сохранения файла на сервере.
        file_path: requestData.file_path
    };
}

// =====================================================
// 15. ЗАПУСК НАСТРОЕК И ОТОБРАЖЕНИЕ ПЕРВОГО ЭТАПА
// =====================================================

setupAdditionalSettings();

// Сохраняем начальные значения полей.
saveStepData(1);
saveStepData(2);
saveStepData(3);

// Показываем первый этап.
showStep();