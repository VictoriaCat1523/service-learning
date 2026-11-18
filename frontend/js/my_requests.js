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
    // 2. КНОПКИ СТАТИСТИКИ (фильтры) — возвращаю обработчик
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
        const wrap = document.getElementById(containerId)?.closest('#responsesContent, #publicationsContent');
        if (!wrap) return;
        const buttons = wrap.querySelectorAll('.stat-btn');
        
        const all = items.length;
        const isResponses = wrap.id === 'responsesContent';
        
        // Разные маппинги для откликов и публикаций
        const mapping = isResponses ? {
            'all': all,
            'pending': items.filter(i => i[statusField] === 'pending').length,
            'accepted': items.filter(i => i[statusField] === 'accepted').length,
            'declined': items.filter(i => i[statusField] === 'declined').length
        } : {
            'all': all,
            'pending': items.filter(i => i[statusField] === 'active').length,      // active = на рассмотрении (для публикаций)
            'accepted': items.filter(i => i[statusField] === 'full' || i[statusField] === 'closed').length, // full/closed = завершены
            'declined': items.filter(i => i[statusField] === 'cancelled').length
        };
        
        buttons.forEach(b => {
            const num = b.querySelector('.stat-number');
            if (num) num.textContent = mapping[b.dataset.filter] ?? 0;
        });
    }

    // ==========================================
    // 4. МОИ ПУБЛИКАЦИИ
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
                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <h3 style="margin:0 0 10px 0;color:#111827;">${req.title}</h3>
                        <span style="background:#dbeafe;color:#1e40af;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${req.status === 'active' ? 'Активна' : req.status}</span>
                    </div>
                    <p style="color:#4b5563;margin:0 0 15px 0;">${req.description}</p>
                    <div style="font-size:.9rem;color:#6b7280;display:flex;flex-direction:column;gap:6px;">
                        <span>📍 ${formatLocation(req.location)}</span>
                        <span>📅 ${formatDate(req.date_time)}</span>
                        <span>👥 Всего участников: ${req.people_count}</span>
                    </div>`;
                container.appendChild(card);
            });
            updateCounters('publications-list', requests, 'status');
        } catch (e) {
            console.error(e);
            container.innerHTML = '<p style="padding:20px;text-align:center;color:#ef4444;">Не удалось загрузить заявки.</p>';
        }
    }

    // ==========================================
    // 5. МОИ ОТКЛИКИ
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
});