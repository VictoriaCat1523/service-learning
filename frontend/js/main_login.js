avascript
// Находим форму регистрации по её родительскому id
const registerFormContainer = document.getElementById('registerForm');
const authForm = registerFormContainer?.querySelector('.auth-form');

if (authForm) {
    authForm.addEventListener('submit', async function (event) {
        // 1. Блокируем перезагрузку страницы при отправке формы
        event.preventDefault();

        // 2. Находим инпуты внутри формы по их классам и ID
        const firstNameInput = authForm.querySelector('input.name:not([placeholder*="Фамилия"])');
        const lastNameInput = authForm.querySelector('input[placeholder="Фамилия"]');
        const emailInput = authForm.querySelector('input.email');
        const passwordInput = authForm.getElementById('registerPassword'); // у него есть id
        const confirmPasswordInput = authForm.querySelector('input[placeholder="Повторите пароль"]');
        const birthDateInput = authForm.querySelector('input.date');

        // Получаем значения
        const firstName = firstNameInput?.value.trim();
        const lastName = lastNameInput?.value.trim();
        const email = emailInput?.value.trim();
        const password = passwordInput?.value;
        const confirmPassword = confirmPasswordInput?.value;
        const birthDate = birthDateInput?.value;

        // 3. Валидация совпадения паролей
        if (password !== confirmPassword) {
            alert('Пароли не совпадают!');
            return;
        }

        // Собираем объект для бэкенда
        const formData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            birthDate: birthDate
        };

        try {
            // 4. Отправка POST-запроса на бэкенд
            // Замените URL на эндпоинт вашего сервера (например, http://localhost:5000/api/register)
            const response = await fetch('YOUR_BACKEND_URL_HERE', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            // 5. Обработка ответа
            if (response.ok) {
                alert('Регистрация прошла успешно!');
                authForm.reset(); // Очистить форму после успеха
            } else {
                alert(`Ошибка: ${result.message || 'Не удалось зарегистрироваться'}`);
            }

        } catch (error) {
            console.error('Ошибка сети при регистрации:', error);
            alert('Нет соединения с сервером бэкенда.');
        }
    });
}