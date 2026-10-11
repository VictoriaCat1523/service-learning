
const peopleCount = document.getElementById("peopleCount");
const decreaseButton = document.getElementById("decreasePeople");
const increaseButton = document.getElementById("increasePeople");

const MIN_PEOPLE = 1;
const MAX_PEOPLE = 100;

decreaseButton.addEventListener("click", () => {
    const currentValue = Number(peopleCount.value);

    if (currentValue > MIN_PEOPLE) {
        peopleCount.value = currentValue - 1;
    }
});

increaseButton.addEventListener("click", () => {
    const currentValue = Number(peopleCount.value);

    if (currentValue < MAX_PEOPLE) {
        peopleCount.value = currentValue + 1;
    }
});

peopleCount.addEventListener("change", () => {
    let value = Number(peopleCount.value);

    if (!Number.isFinite(value) || peopleCount.value.trim() === "") {
        value = MIN_PEOPLE;
    }

    value = Math.trunc(value);
    value = Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, value));

    peopleCount.value = value;
});
