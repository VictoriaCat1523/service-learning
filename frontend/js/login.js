// Оборачиваем весь код, чтобы он ждал полной загрузки HTML-элементов страницы
document.addEventListener('DOMContentLoaded', () => {

    // 1. Поиск всех необходимых элементов на странице
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const slider = document.querySelector('.toggle-slider');

    // Находим саму форму внутри контейнера регистрации для отправки данных
    const authForm = registerForm?.querySelector('.auth-form');

    // 2. Функция переключения на вкладку "Войти"
    function showLogin() {
        if (slider) slider.style.transform = 'translateX(0)';
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    }

    // 3. Функция переключения на вкладку "Регистрация"
    function showRegister() {
        if (slider) slider.style.transform = 'translateX(100%)'; // Сдвигаем слайдер вправо
        if (registerTab) registerTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerForm) registerForm.style.display = 'block';
        if (loginForm) loginForm.style.display = 'none';
    }

    // 4. Проверка sessionStorage (открытие нужной вкладки при старте)
    if (sessionStorage.getItem('openRegister') === 'true') {
        sessionStorage.removeItem('openRegister');
        showRegister();
        document.documentElement.classList.remove('open-register');
    } else {
        showLogin();
    }

    // 5. Навешивание событий клика на переключатели вкладок
    if (loginTab) {
        loginTab.addEventListener('click', function () {
            showLogin();
        });
    }

    if (registerTab) {
        registerTab.addEventListener('click', function () {
            showRegister();
        });
    }

    // 6. Логика показа/скрытия пароля (глазок)
    function togglePassword(button) {
        const passwordInput = button.parentElement.querySelector('input');
        if (passwordInput) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
            } else {
                passwordInput.type = 'password';
            }
        }
    }

    const showPasswordButtons = document.querySelectorAll('.show-password');
    showPasswordButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            togglePassword(button);
        });
    });

    // ==========================================
    // 7. СКРИПТ ОТПРАВКИ ДАННЫХ РЕГИСТРАЦИИ НА БЭКЕНД
    // ==========================================
    if (authForm) {
        authForm.addEventListener('submit', async function (event) {
            // Блокируем стандартную перезагрузку страницы браузером
            event.preventDefault();

            // Ищем инпуты внутри формы по классам и ID из вашей верстки
            const firstNameInput = authForm.querySelector('input.name:not([placeholder*="Фамилия"])');
            const emailInput = authForm.querySelector('input.email');
            const passwordInput = document.getElementById('registerPassword');
            const confirmPasswordInput = authForm.querySelector('input[placeholder="Повторите пароль"]');

            // Извлекаем значения и убираем лишние пробелы по краям
            const username = firstNameInput?.value.trim();
            const email = emailInput?.value.trim();
            const password = passwordInput?.value;
            const confirmPassword = confirmPasswordInput?.value;

            // Проверка на заполнение полей на стороне фронтенда
            if (!username || !email || !password || !confirmPassword) {
                alert('Пожалуйста, заполните все обязательные поля!');
                return;
            }

            // Формируем JSON-объект строго под схему FastAPI (schemas.UserRegister)
            const registerData = {
                username: username,
                email: email,
                password: password,
                password_confirm: confirmPassword
            };

            try {
                // Отправляем POST-запрос на ваш локальный FastAPI сервер
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registerData)
                });

                const result = await response.json();

                // Обработка успешного ответа сервера (Статус 200)
                if (response.ok) {
                    alert('Регистрация прошла успешно!');
                    authForm.reset(); // Очищаем поля формы
                    showLogin();      // Переключаем пользователя на форму входа
                } else {
                    // Если FastAPI вернул ошибку (например, "Пароли не совпадают")
                    const errorMessage = result.detail || 'Произошла ошибка при регистрации';
                    alert(`Ошибка: ${typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage}`);
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                alert('Не удалось связаться с сервером бэкенда. Убедитесь, что ваш Python/FastAPI проект запущен.');
            }
        });
    }

    // ==========================================
    // 8. СКРИПТ ОТПРАВКИ ДАННЫХ АВТОРИЗАЦИИ (ВХОД)
    // ==========================================
    const loginFormContainer = document.getElementById('loginForm');
    const loginAuthForm = loginFormContainer?.querySelector('.auth-form');

    if (loginAuthForm) {
        loginAuthForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Блокируем перезагрузку страницы

            // Находим инпуты внутри формы входа
            const EmailInput = loginAuthForm.querySelector('input[type="email"]');
            const passwordInput = loginAuthForm.querySelector('input[type="password"]');

            const emailValue = EmailInput?.value.trim();
            const passwordValue = passwordInput?.value;

            // Исправлено: проверяем корректную переменную passwordValue
            if (!emailValue || !passwordValue) {
                alert('Пожалуйста, заполните все поля для входа!');
                return;
            }

            // Исправлено: формируем JSON строго под измененный schemas.UserLogin (ключ email вместо username)
            const loginData = {
                email: emailValue,
                password: passwordValue
            };

            try {
                // Отправляем запрос на авторизацию через прокси Nginx
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (response.ok) {
                    
                    try {
                    }
                    catch (e) {}                                                                 //ничего не делать     потому что есть алерт в логин.хтмл
                    
                    // Сохраняем полученный JWT-токен в localStorage браузера. 
                    localStorage.setItem('token', result.access_token);
                    
                    loginAuthForm.reset(); // Очищаем форму входа
                } else {
                    // Обрабатываем ошибку от FastAPI (например, "Неверный адрес электронной почты или пароль")
                    alert(`Ошибка: ${result.detail || 'Неверные данные для входа'}`);
                }
            } catch (error) {
                console.error('Ошибка сети при входе:', error);
                alert('Не удалось связаться с сервером для авторизации.');
            }
        });
    }

}); // Закрывающий тег для DOMContentLoaded
