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
