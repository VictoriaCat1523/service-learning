document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (направление слайдера исправлено)
    // ==========================================
    const responsesTab = document.getElementById('responsesTab');
    const publicationsTab = document.getElementById('publicationsTab');
    const slider = document.querySelector('.requests-toggle .toggle-slider');
    const responsesContent = document.getElementById('responsesContent');
    const publicationsContent = document.getElementById('publicationsContent');

    // responsesTab — ЛЕВАЯ кнопка → слайдер слева (translateX(0))
    function showResponses() {
        if (slider) slider.style.transform = 'translateX(0)';
        if (responsesTab) responsesTab.classList.add('active');
        if (publicationsTab) publicationsTab.classList.remove('active');
        if (responsesContent) responsesContent.style.display = 'block';
        if (publicationsContent) publicationsContent.style.display = 'none';
        loadMyResponses();
    }

    // publicationsTab — ПРАВАЯ кнопка → слайдер справа (translateX(100%))
    function showPublications() {
        if (slider) slider.style.transform = 'translateX(100%)';
        if (publicationsTab) publicationsTab.classList.add('active');
        if (responsesTab) responsesTab.classList.remove('active');
        if (publicationsContent) publicationsContent.style.display = 'block';
        if (responsesContent) responsesContent.style.display = 'none';
        loadMyPublications();
    }

    if (responsesTab) responsesTab.addEventListener('click', showResponses);
    if (publicationsTab) publicationsTab.addEventListener('click', showPublications);

    // По умолчанию открыта вкладка "Мои отклики" (как в исходном HTML)
    showResponses();

    // ==========================================
    // 2. КНОПКИ СТАТИСТИКИ (фильтры)
    // ==========================================
    document.querySelectorAll('.requests-stats').forEach((statsGroup) => {
        const buttons = statsGroup.querySelectorAll('.stat-btn');
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                buttons.forEach((b) => b.classList.remove('active'));
                button.classList.add('active');

                const filter = button.dataset.filter;
                const container = statsGroup.closest('#responsesContent')
                    ? document.getElementById('responses-list')
                    : document.getElementById('publications-list');
                if (!container) return;

                container.querySelectorAll('[data-status]').forEach((card) => {
                    if (filter === 'all') {
                        card.style.display = '';
                    } else {
                        card.style.display = card.dataset.status === filter ? '' : 'none';
                    }
                });
            });
        });
    });

    // ==========================================
    // 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ==========================================
    function getToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    // Человеческий текст для места встречи
    function formatLocation(loc) {
        if (!loc) return 'Не указано';
        const map = { online: 'Онлайн', anywhere: 'На усмотрение участников', specific: 'В определенном месте' };
        return map[loc] || loc;
    }

    function formatDate(dt) {
        if (!dt) return 'Дата не указана';
        return new Date(dt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    }

    function updateCounters(containerId, items, statusField) {
        const wrap = document.getElementById(containerId)?.closest('.requests-content, #responsesContent, #publicationsContent')
            || document.getElementById(containerId)?.parentElement;
        if (!wrap) return;
        const buttons = wrap.querySelectorAll('.stat-btn');
        
        const all = items.length;
        // Группируем синонимичные статусы для универсальности
        const active = items.filter(i => (i[statusField] || '') === 'active' || (i[statusField] || '') === 'pending' || (i[statusField] || '') === 'full').length;
        const completed = items.filter(i => (i[statusField] || '') === 'completed' || (i[statusField] || '') === 'accepted').length;
        const cancelled = items.filter(i => (i[statusField] || '') === 'cancelled' || (i[statusField] || '') === 'declined').length;
        
        const values = { 
            all, 
            active, 
            completed, 
            cancelled,
            pending: active,      // "На рассмотрении" берет значение из active
            accepted: completed,  // "Завершенные" берет значение из completed
            declined: cancelled   // "Отклоненные" берет значение из cancelled
        };
        
        buttons.forEach(b => {
            const num = b.querySelector('.stat-number');
            if (num) {
                num.textContent = values[b.dataset.filter] ?? 0;
            }
        });
    }

    // ==========================================
    // 4. МОИ ПУБЛИКАЦИИ (ОБНОВЛЕНО: добавлены кнопки действий)
    // ==========================================
    async function loadMyPublications() {
        const container = document.getElementById('publications-list');
        if (!container) return;
        container.innerHTML = '<p style="padding:20px;text-align:center;color:#666;">Загрузка...</p>';

        const token = getToken();
        if (!token) {
            container.innerHTML = '<p style="padding:20px;text-align:center;color:#ef4444;">Войдите в аккаунт.</p>';
            return;
        }

        try {
            const res = await fetch('/api/requests/my', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Ошибка загрузки');
            const requests = await res.json();
            container.innerHTML = '';

            if (!requests.length) {
                container.innerHTML = '<p style="padding:20px;text-align:center;color:#666;">Нет заявок. <a href="create_event.html" style="color:#4f46e5;">Создать</a></p>';
                updateCounters('publications-list', [], 'status');
                return;
            }

            requests.forEach(req => {
                const card = document.createElement('div');
                card.className = 'request-card';
                card.dataset.status = req.status || 'active';
                card.style.cssText = 'border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:15px;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.05);';

                // Определяем текст и цвет бейджа статуса
                let statusText = 'Активна';
                let statusBg = '#dbeafe'; // blue-100
                let statusColor = '#1e40af'; // blue-800

                if (req.status === 'completed') {
                    statusText = 'Завершена';
                    statusBg = '#d1fae5'; // green-100
                    statusColor = '#065f46'; // green-800
                } else if (req.status === 'cancelled') {
                    statusText = 'Отменена';
                    statusBg = '#fee2e2'; // red-100
                    statusColor = '#991b1b'; // red-800
                } else if (req.status === 'full') {
                    statusText = 'Места закончились';
                    statusBg = '#fef3c7'; // yellow-100
                    statusColor = '#92400e'; // yellow-800
                }

                // Формируем кнопки действий в зависимости от статуса
                let actionButtons = '';
                if (req.status === 'active' || req.status === 'full') {
                    actionButtons = `
                        <div style="display:flex;gap:10px;margin-top:15px;flex-wrap:wrap;">
                            <button class="btn-complete" data-id="${req.id}" style="background:#10b981;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:500;font-size:14px;transition:opacity 0.2s;">
                                ✅ Завершить
                            </button>
                            <button class="btn-cancel" data-id="${req.id}" style="background:#ef4444;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:500;font-size:14px;transition:opacity 0.2s;">
                                ❌ Отменить
                            </button>
                        </div>`;
                } else if (req.status === 'cancelled') {
                    actionButtons = `
                        <div style="display:flex;gap:10px;margin-top:15px;">
                            <button class="btn-reactivate" data-id="${req.id}" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:500;font-size:14px;transition:opacity 0.2s;">
                                🔄 Вернуть к активной
                            </button>
                        </div>
                        <p style="margin-top:10px;color:#6b7280;font-size:.85rem;">Заявка была отменена</p>`;
                } else if (req.status === 'completed') {
                    actionButtons = `<p style="margin-top:15px;color:#6b7280;font-size:.9rem;">✅ Заявка успешно завершена</p>`;
                }

                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <h3 style="margin:0 0 10px 0;color:#111827;">${req.title}</h3>
                        <span style="background:${statusBg};color:${statusColor};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;">
                            ${statusText}
                        </span>
                    </div>
                    <p style="color:#4b5563;margin:0 0 15px 0;">${req.description}</p>
                    <div style="font-size:.9rem;color:#6b7280;display:flex;flex-direction:column;gap:6px;">
                        <span>📍 ${formatLocation(req.location)}</span>
                        <span>📅 ${formatDate(req.date_time)}</span>
                        <span>👥 Всего участников: ${req.people_count}</span>
                    </div>
                    ${actionButtons}`;
                
                container.appendChild(card);
            });

            // Навешиваем обработчики на новые кнопки
            container.querySelectorAll('.btn-complete').forEach(btn => {
                btn.addEventListener('click', () => changeRequestStatus(btn.dataset.id, 'completed'));
            });
            container.querySelectorAll('.btn-cancel').forEach(btn => {
                btn.addEventListener('click', () => changeRequestStatus(btn.dataset.id, 'cancelled'));
            });
            container.querySelectorAll('.btn-reactivate').forEach(btn => {
                btn.addEventListener('click', () => changeRequestStatus(btn.dataset.id, 'active'));
            });

            updateCounters('publications-list', requests, 'status');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p style="padding:20px;text-align:center;color:#ef4444;">Не удалось загрузить заявки.</p>';
        }
    }

    // ==========================================
    // 5. МОИ ОТКЛИКИ (без изменений)
    // ==========================================
    async function loadMyResponses() {
        const container = document.getElementById('responses-list');
        if (!container) return;
        container.innerHTML = '<p style="padding:20px;text-align:center;color:#666;">Загрузка...</p>';

        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch('/api/responses/my', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Ошибка загрузки');
            const responses = await res.json();
            container.innerHTML = '';

            if (!responses.length) {
                container.innerHTML = '<p style="padding:20px;text-align:center;color:#666;">Нет откликов. <a href="locate_company.html" style="color:#4f46e5;">Найти компанию</a></p>';
                updateCounters('responses-list', [], 'status');
                return;
            }

            responses.forEach(resp => {
                const map = { pending: ['⏳ На рассмотрении', '#f59e0b'], accepted: ['✅ Принят', '#10b981'], declined: ['❌ Отклонен', '#ef4444'] };
                const [text, color] = map[resp.status] || ['Неизвестно', '#6b7280'];
                const card = document.createElement('div');
                card.className = 'response-card';
                card.dataset.status = resp.status;
                card.style.cssText = 'border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:15px;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.05);';
                card.innerHTML = `
                    <h3 style="margin:0 0 10px 0;color:#111827;">Отклик на заявку #${resp.request_id}</h3>
                    <p style="margin:0 0 10px 0;">Статус: <strong style="color:${color};">${text}</strong></p>
                    <p style="margin:0;font-size:.85rem;color:#9ca3af;">Дата: ${formatDate(resp.created_at)}</p>`;
                container.appendChild(card);
            });
            updateCounters('responses-list', responses, 'status');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p style="padding:20px;text-align:center;color:#ef4444;">Не удалось загрузить отклики.</p>';
        }
    }

    // ==========================================
    // 6. 🆕 НОВАЯ ФУНКЦИЯ: ИЗМЕНЕНИЕ СТАТУСА ЗАЯВКИ
    // ==========================================
    async function changeRequestStatus(requestId, newStatus) {
        const token = getToken();
        if (!token) return;

        const actionText = newStatus === 'completed' ? 'завершить' : (newStatus === 'cancelled' ? 'отменить' : 'вернуть к активной');
        if (!confirm(`Вы уверены, что хотите ${actionText} эту заявку?`)) return;

        // Находим кнопку и добавляем ей состояние загрузки
        const btn = document.querySelector(`[data-id="${requestId}"].btn-complete, [data-id="${requestId}"].btn-cancel, [data-id="${requestId}"].btn-reactivate`);
        if (btn) {
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
            btn.disabled = true;
        }

        try {
            const res = await fetch(`/api/requests/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Ошибка изменения статуса');
            }

            const data = await res.json();
            
            // Показываем сообщение об успехе (можно заменить на красивый toast, если есть)
            if (newStatus === 'cancelled' && data.notified_count > 0) {
                alert(`Заявка отменена. Уведомления отправлены ${data.notified_count} откликнувшимся.`);
            } else if (newStatus === 'active' && data.restored_responses > 0) {
                alert(`Заявка снова активна! ${data.restored_responses} откликов восстановлено.`);
            } else {
                alert(newStatus === 'completed' ? 'Заявка успешно завершена!' : 'Статус заявки обновлен.');
            }

            // Перезагружаем список и счетчики
            loadMyPublications();
            
        } catch (e) {
            console.error(e);
            alert(e.message);
            // Возвращаем кнопку в исходное состояние при ошибке
            if (btn) {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
            }
        }
    }
});