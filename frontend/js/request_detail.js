document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
        alert('Войдите в аккаунт');
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    if (!requestId) {
        alert('ID заявки не указан');
        window.location.href = 'my_requests.html';
        return;
    }

    const requestInfo = document.getElementById('request-info');
    const responsesSection = document.getElementById('responses-section');
    const responsesList = document.getElementById('responses-list');

    // Загружаем заявку
    try {
        const res = await fetch(`/api/requests/${requestId}`);
        if (!res.ok) throw new Error('Заявка не найдена');
        const request = await res.json();

        const dateStr = new Date(request.date_time).toLocaleString('ru-RU');
        const statusMap = { active: 'Активна', full: 'Завершена', closed: 'Закрыта' };
        
        requestInfo.innerHTML = `
            <h1 style="margin:0 0 12px 0;">${request.title}</h1>
            <span class="status-badge" style="background:#dbeafe; color:#1e40af;">${statusMap[request.status] || request.status}</span>
            <p style="margin:16px 0; color:#4b5563;">${request.description}</p>
            <div style="color:#6b7280; font-size:0.95rem;">
                <p>📍 ${request.location}</p>
                <p>📅 ${dateStr}</p>
                <p>👥 Нужно участников: ${request.people_count}</p>
            </div>
        `;

        // Проверяем, автор ли это
        const userRes = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await userRes.json();

        if (user.id === request.user_id) {
            responsesSection.hidden = false;
            await loadResponses(requestId, token);
        } else {
            responsesSection.innerHTML = '<p style="color:#6b7280;">Вы не являетесь автором этой заявки.</p>';
        }

    } catch (error) {
        console.error(error);
        requestInfo.innerHTML = '<p style="color:#ef4444;">Не удалось загрузить заявку.</p>';
    }

    async function loadResponses(reqId, tkn) {
        responsesList.innerHTML = 'Загрузка...';
        try {
            const res = await fetch(`/api/requests/${reqId}/responses`, {
                headers: { 'Authorization': `Bearer ${tkn}` }
            });
            if (!res.ok) throw new Error('Ошибка загрузки откликов');
            
            const responses = await res.json();
            responsesList.innerHTML = '';

            if (responses.length === 0) {
                responsesList.innerHTML = '<p style="color:#6b7280;">Пока нет откликов.</p>';
                return;
            }

            responses.forEach(resp => {
                const statusText = { pending: 'На рассмотрении', accepted: 'Принят', declined: 'Отклонен' };
                const item = document.createElement('div');
                item.className = 'response-item';
                item.innerHTML = `
                    <div class="response-user">
                        <strong>${resp.user.first_name} ${resp.user.last_name}</strong>
                        <p>@${resp.user.username} • ${resp.user.email}</p>
                        <span class="status-badge status-${resp.status}">${statusText[resp.status]}</span>
                    </div>
                    <div class="response-actions">
                        ${resp.status === 'pending' ? `
                            <button class="btn-accept" data-id="${resp.id}">Принять</button>
                            <button class="btn-decline" data-id="${resp.id}">Отклонить</button>
                        ` : ''}
                    </div>
                `;
                responsesList.appendChild(item);
            });

            // Обработчики кнопок
            document.querySelectorAll('.btn-accept').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const responseId = e.target.dataset.id;
                    await handleResponse(responseId, 'accept', tkn);
                });
            });

            document.querySelectorAll('.btn-decline').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const responseId = e.target.dataset.id;
                    await handleResponse(responseId, 'decline', tkn);
                });
            });

        } catch (error) {
            console.error(error);
            responsesList.innerHTML = '<p style="color:#ef4444;">Ошибка загрузки откликов.</p>';
        }
    }

    async function handleResponse(responseId, action, tkn) {
        try {
            const res = await fetch(`/api/responses/${responseId}/${action}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${tkn}` }
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || 'Ошибка');
                return;
            }
            alert(action === 'accept' ? 'Отклик принят!' : 'Отклик отклонен.');
            // Перезагружаем список
            const urlParams = new URLSearchParams(window.location.search);
            await loadResponses(urlParams.get('id'), tkn);
        } catch (error) {
            console.error(error);
            alert('Ошибка сети');
        }
    }
});