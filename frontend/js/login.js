// Оборачиваем весь код, чтобы он ждал полной загрузки HTML-элементов страницы
    document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const slider = document.querySelector('.toggle-slider');


    // Находим саму форму внутри контейнера регистрации для отправки данных
    const authForm = registerForm?.querySelector('.auth-form');

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
        // Переключение на вход по ссылке под формой регистрации
    const loginLink = document.querySelector('.Login a');

    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            event.preventDefault();
            showLogin();
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
    // Открытие и закрытие подсказки требований к паролю
    const passwordHelp = document.getElementById('passwordHelp');
    const passwordHint = document.getElementById('passwordHint');

    if (passwordHelp && passwordHint) {
        passwordHelp.addEventListener('click', () => {
            passwordHint.hidden = !passwordHint.hidden;
        });
    }
    // ==========================================
    // ВАЛИДАЦИЯ ПОЛЕЙ РЕГИСТРАЦИИ
    // ==========================================

    // Получаем поля регистрации
    const firstNameInput = document.getElementById('registerFirstName');
    const lastNameInput = document.getElementById('registerLastName');
    const usernameInput = document.getElementById('registerUsername');
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('registerPasswordConfirm');

    // Показываем ошибку под полем
    function showFieldError(input, errorId, message) {
        const errorElement = document.getElementById(errorId);

        if (errorElement) {
            errorElement.textContent = message;
        }

        if (input) {
            input.classList.toggle('invalid', Boolean(message));
        }
    }

    // Проверка имени и фамилии
    function validateName(value) {
        return /^[а-яёА-ЯЁa-zA-Z]+(?:[- ][а-яёА-ЯЁa-zA-Z]+)*$/.test(value.trim());
    }

    // Проверка username
    function validateUsername(value) {
        return /^[a-zA-Z0-9][a-zA-Z0-9_.]{1,18}[a-zA-Z0-9]$/.test(value.trim());
    }

    // Проверка email
    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    // Проверка пароля
    function getPasswordError(value) {
        if (value.length < 8) {
            return 'Минимум 8 символов';
        }

        if (new TextEncoder().encode(value).length > 72) {
            return 'Пароль слишком длинный';
        }

        if (!/[A-ZА-ЯЁ]/.test(value)) {
            return 'Добавьте заглавную букву';
        }

        if (!/[a-zа-яё]/.test(value)) {
            return 'Добавьте строчную букву';
        }

        if (!/\d/.test(value)) {
            return 'Добавьте хотя бы одну цифру';
        }

        if (!/[^a-zA-Zа-яёА-ЯЁ0-9\s]/.test(value)) {
            return 'Добавьте специальный символ';
        }

        return '';
    }

    // Проверка имени при вводе
    firstNameInput.addEventListener('input', () => {
        const value = firstNameInput.value.trim();

        showFieldError(
            firstNameInput,
            'firstNameError',
            value && !validateName(value)
                ? 'Используйте только буквы, пробел и дефис'
                : ''
        );
    });

    // Проверка фамилии при вводе
    lastNameInput.addEventListener('input', () => {
        const value = lastNameInput.value.trim();

        showFieldError(
            lastNameInput,
            'lastNameError',
            value && !validateName(value)
                ? 'Используйте только буквы, пробел и дефис'
                : ''
        );
    });

    // Проверка username при вводе
    usernameInput.addEventListener('input', () => {
        const value = usernameInput.value.trim();

        showFieldError(
            usernameInput,
            'usernameError',
            value && !validateUsername(value)
                ? 'От 3 до 20 символов: латинские буквы, цифры, точка и _'
                : ''
        );
    });

    // Проверка email при вводе
    emailInput.addEventListener('input', () => {
        const value = emailInput.value.trim();

        showFieldError(
            emailInput,
            'emailError',
            value && !validateEmail(value)
                ? 'Введите корректный адрес электронной почты'
                : ''
        );
    });

    // Проверка пароля при вводе
    passwordInput.addEventListener('input', () => {
        showFieldError(
            passwordInput,
            'passwordError',
            passwordInput.value ? getPasswordError(passwordInput.value) : ''
        );

        // Одновременно проверяем совпадение паролей
        validatePasswordConfirm();
    });

    // Проверка повторного пароля
    function validatePasswordConfirm() {
        const confirmValue = confirmPasswordInput.value;

        showFieldError(
            confirmPasswordInput,
            'confirmPasswordError',
            confirmValue && confirmValue !== passwordInput.value
                ? 'Пароли не совпадают'
                : ''
        );
    }

    confirmPasswordInput.addEventListener('input', validatePasswordConfirm);
    // ==========================================
    // 7. СКРИПТ ОТПРАВКИ ДАННЫХ РЕГИСТРАЦИИ НА БЭКЕНД
    // ==========================================
   if (authForm) {
    authForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Получаем данные из полей регистрации
        const firstName = document.getElementById('registerFirstName')?.value.trim();
        const lastName = document.getElementById('registerLastName')?.value.trim();
        const username = document.getElementById('registerUsername')?.value.trim();
        const email = document.getElementById('registerEmail')?.value.trim();
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('registerPasswordConfirm')?.value;
        const birthDate = document.getElementById('registerBirthDate')?.value;
        const city = document.getElementById('registerCity')?.value.trim();
        const gender = document.getElementById('registerGender')?.value;

        // Проверяем заполнение обязательных полей
        if (
            !firstName || !lastName || !username || !email ||
            !password || !confirmPassword || !birthDate || !city || !gender
        ) {
            alert('Пожалуйста, заполните все обязательные поля!');
            return;
        }

        // Проверяем имя
        if (!validateName(firstName)) {
            showFieldError(firstNameInput, 'firstNameError',
                'Некорректное имя');
            return;
        }

        // Проверяем фамилию
        if (!validateName(lastName)) {
            showFieldError(lastNameInput, 'lastNameError',
                'Некорректная фамилия');
            return;
        }

        // Проверяем username
        if (!validateUsername(username)) {
            showFieldError(usernameInput, 'usernameError',
                'Username должен содержать 3–20 допустимых символов');
            return;
        }

        // Проверяем email
        if (!validateEmail(email)) {
            showFieldError(emailInput, 'emailError',
                'Введите корректный адрес электронной почты');
            return;
        }

        // Проверяем пароль
        const passwordError = getPasswordError(password);

        if (passwordError) {
            showFieldError(passwordInput, 'passwordError', passwordError);
            return;
        }

        // Проверяем совпадение паролей
        if (password !== confirmPassword) {
            showFieldError(confirmPasswordInput, 'confirmPasswordError',
                'Пароли не совпадают');
            return;
        }

        // Формируем данные для отправки на backend
        const registerData = {
            first_name: firstName,
            last_name: lastName,
            username: username,
            email: email.toLowerCase(),
            password: password,
            password_confirm: confirmPassword,
            birth_date: birthDate,
            city: city,
            gender: gender
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Регистрация прошла успешно!');
                authForm.reset();

                document.querySelectorAll('.field-error').forEach((element) => {
                    element.textContent = '';
                });

                authForm.querySelectorAll('.invalid').forEach((element) => {
                    element.classList.remove('invalid');
                });

                showLogin();
            } else {
                const detail = result.detail;

                if (Array.isArray(detail)) {
                    detail.forEach((error) => {
                        const field = error.loc?.[error.loc.length - 1];
                        const message = error.msg;

                        const errorFields = {
                            first_name: [firstNameInput, 'firstNameError'],
                            last_name: [lastNameInput, 'lastNameError'],
                            username: [usernameInput, 'usernameError'],
                            email: [emailInput, 'emailError'],
                            password: [passwordInput, 'passwordError']
                        };

                        if (errorFields[field]) {
                            showFieldError(
                                errorFields[field][0],
                                errorFields[field][1],
                                message
                            );
                        } else {
                            alert(message);
                        }
                    });
                } else if (detail && detail.field) {
                    const errorFields = {
                        username: [usernameInput, 'usernameError'],
                        email: [emailInput, 'emailError']
                    };

                    const field = errorFields[detail.field];

                    if (field) {
                        showFieldError(field[0], field[1], detail.message);
                    } else {
                        alert(detail.message);
                    }
                } else {
                    alert(detail || 'Произошла ошибка при регистрации');
                }
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Не удалось связаться с сервером. Проверьте, запущен ли backend.');
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
                password: passwordValue,
                remember_me: document.getElementById('rememberMe').checked
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
                    
                    // Определяем, выбрал ли пользователь «Запомнить меня»
                    const rememberMe = document.getElementById('rememberMe').checked;

                    // Удаляем предыдущие токены, чтобы не осталось старой сессии
                    localStorage.removeItem('token');
                    sessionStorage.removeItem('token');

                    // Сохраняем токен в зависимости от выбора пользователя
                    if (rememberMe) {
                        localStorage.setItem('token', result.access_token);
                    } else {
                        sessionStorage.setItem('token', result.access_token);
                    }

                    loginAuthForm.reset();
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