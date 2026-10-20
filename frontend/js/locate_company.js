/* */
const showCategories = document.querySelector(".show_categories");
const extraCategories = document.querySelector(".extra_categories")

const change = () => {
    extraCategories.hidden = !extraCategories.hidden;
    if (extraCategories.hidden){
        showCategories.textContent = "Показать всё";
    } else{
        showCategories.textContent = "Свернуть";   
    }
};
showCategories.addEventListener("click", change);


// ВОЗРАСТНОЙ ФИЛЬТР
const minAge = document.querySelector("#minAge");
const maxAge = document.querySelector("#maxAge");

const minAgeValue = document.querySelector("#minAgeValue");
const maxAgeValue = document.querySelector("#maxAgeValue");

const ageRange = document.querySelector(".age_range");

const ageSliders = document.querySelector(".age_sliders");

// ОБНОВЛЕНИЕ ВОЗРАСТНОГО ФИЛЬТРА
const updateAgeSlider = (event) => {
    let min = Number(minAge.value);
    let max = Number(maxAge.value);

    if (min > max) {
        if (event.target === minAge) {
            minAge.value = max;
            min = max;
        } else {
            maxAge.value = min;
            max = min;
        }
    }

    minAgeValue.textContent = min;
    maxAgeValue.textContent = max;

    const minPercent = ((min - Number(minAge.min)) / (Number(minAge.max) - Number(minAge.min))) * 100;
    const maxPercent = ((max - Number(maxAge.min)) / (Number(maxAge.max) - Number(maxAge.min))) * 100;

    ageRange.style.left = `${minPercent}%`;
    ageRange.style.right = `${100 - maxPercent}%`;
};

// ПОДКЛЮЧЕНИЕ СОБЫТИЙ
minAge.addEventListener("input", updateAgeSlider);
maxAge.addEventListener("input", updateAgeSlider);

// ПЕРЕМЕЩЕНИЕ БЕГУНКА ПО КЛИКУ НА ДОРОЖКУ
ageSliders.addEventListener("click", (event) => {
    // Не мешаем обычному перетаскиванию бегунков
    if (event.target === minAge || event.target === maxAge) {
        return;
    }

    const rect = ageSliders.getBoundingClientRect();
    const clickPosition = (event.clientX - rect.left) / rect.width;

    const min = Number(minAge.value);
    const max = Number(maxAge.value);

    const minValue = Number(minAge.min);
    const maxValue = Number(minAge.max);

    const clickedAge = Math.round(
        minValue + clickPosition * (maxValue - minValue)
    );

    const distanceToMin = Math.abs(clickedAge - min);
    const distanceToMax = Math.abs(clickedAge - max);

    if (distanceToMin <= distanceToMax) {
        minAge.value = Math.min(clickedAge, max);
    } else {
        maxAge.value = Math.max(clickedAge, min);
    }

    updateAgeSlider({ target: ageSliders });
});


// НАЧАЛЬНОЕ ПОЛОЖЕНИЕ ДОРОЖКИ
updateAgeSlider({ target: minAge });