
const titleInput = document.getElementById("requestTitle");
const descriptionInput = document.getElementById("requestDescription");

const titleCounter = document.getElementById("titleCounter");
const descriptionCounter = document.getElementById("descriptionCounter");

function updateCounter(input, counter, maxLength) {
    counter.textContent = `${input.value.length}/${maxLength}`;
}

titleInput.addEventListener("input", () => {
    updateCounter(titleInput, titleCounter, 80);
});

descriptionInput.addEventListener("input", () => {
    updateCounter(descriptionInput, descriptionCounter, 500);
});
