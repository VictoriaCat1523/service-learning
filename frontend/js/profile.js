document.addEventListener('DOMContentLoaded', async () => {

    // Получаем токен авторизации
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // Если пользователь не авторизован
    if (!token) {
        alert('Необходимо войти в аккаунт');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Запрашиваем данные текущего пользователя
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const user = await response.json();

        // Проверяем авторизацию
        if (!response.ok) {
            throw new Error(user.detail || 'Не удалось загрузить профиль');
        }

        // Заполняем данные профиля
        document.getElementById('profileFullName').textContent =
            `${user.first_name} ${user.last_name}`;

        document.getElementById('profileUsername').textContent =
            `@${user.username}`;

        document.getElementById('profileFirstName').textContent =
            user.first_name;

        document.getElementById('profileLastName').textContent =
            user.last_name;

        document.getElementById('profileEmail').textContent =
            user.email;

        document.getElementById('profileCity').textContent =
            user.city;

        document.getElementById('profileBirthDate').textContent =
            new Date(user.birth_date).toLocaleDateString('ru-RU');

        const genders = {
            male: 'Мужской',
            female: 'Женский',
            not_specified: 'Не указан'
        };

        document.getElementById('profileGender').textContent =
            genders[user.gender] || user.gender;

        // Получаем элементы редактирования профиля
        const editButton = document.querySelector('.edit-profile');
        const profileSection = document.querySelector('#profile .profile-section');
        const editForm = document.getElementById('editProfileForm');
        const cancelButton = document.getElementById('cancelEditProfile');

        // Открытие формы редактирования
        editButton.addEventListener('click', () => {
            // Заполняем форму текущими данными
            document.getElementById('editFirstName').value = user.first_name;
            document.getElementById('editLastName').value = user.last_name;
            document.getElementById('editUsername').value = user.username;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editBirthDate').value = user.birth_date;
            document.getElementById('editCity').value = user.city;
            document.getElementById('editGender').value = user.gender;

            // Показываем форму и скрываем обычное отображение
            profileSection.hidden = true;
            editForm.hidden = false;
        });

        // Отмена редактирования
        cancelButton.addEventListener('click', () => {
            editForm.hidden = true;
            profileSection.hidden = false;
        });
        // Сохранение изменений профиля
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const saveButton = editForm.querySelector('button[type="submit"]');
            const originalButtonText = saveButton.textContent;

            saveButton.disabled = true;
            saveButton.textContent = 'Сохранение...';
            // Собираем новые данные из формы
            const updatedData = {
                first_name: document.getElementById('editFirstName').value.trim(),
                last_name: document.getElementById('editLastName').value.trim(),
                username: document.getElementById('editUsername').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                birth_date: document.getElementById('editBirthDate').value,
                city: document.getElementById('editCity').value.trim(),
                gender: document.getElementById('editGender').value
            };

            try {
                const response = await fetch('/api/users/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedData)
                });

                const result = await response.json();

                if (!response.ok) {
                    const detail = result.detail;

                    const errorMessage = typeof detail === 'string'
                        ? detail
                        : detail?.message || 'Не удалось сохранить изменения';

                    throw new Error(errorMessage);
                }
                Object.assign(user, result);
                // Обновляем отображение профиля
                document.getElementById('profileFullName').textContent =
                    `${result.first_name} ${result.last_name}`;

                // Обновляем имя в выпадающем меню профиля
                document.querySelectorAll('.profile_name').forEach((element) => {
                    element.textContent = `${result.first_name} ${result.last_name}`;
                });

                document.getElementById('profileUsername').textContent =
                    `@${result.username}`;

                document.getElementById('profileFirstName').textContent =
                    result.first_name;

                document.getElementById('profileLastName').textContent =
                    result.last_name;

                document.getElementById('profileEmail').textContent =
                    result.email;

                document.getElementById('profileCity').textContent =
                    result.city;

                document.getElementById('profileBirthDate').textContent =
                    new Date(`${result.birth_date}T00:00:00`).toLocaleDateString('ru-RU');

                document.getElementById('profileGender').textContent =
                    genders[result.gender] || result.gender;

                // Закрываем форму
                editForm.hidden = true;
                profileSection.hidden = false;

                alert('Профиль успешно обновлён!');

    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert(error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalButtonText;
    }
});
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        alert(error.message);
    }

});