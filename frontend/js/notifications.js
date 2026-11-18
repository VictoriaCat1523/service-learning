document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('notifications-list');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
        container.innerHTML = '<p style="color:#ef4444;">Войдите в аккаунт.</p>';
        return;
    }

    // Кнопка "Прочитать все"
    const readAllBtn = document.getElementById('read-all-btn');
    if (readAllBtn) {
        readAllBtn.addEventListener('click', async () => {
            await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadNotifications();
        });
    }

    await loadNotifications();

    async function loadNotifications() {
        container.innerHTML = 'Загрузка...';
        try {
            const res = await fetch('/api/notifications/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Ошибка');
            
            const notifications = await res.json();
            container.innerHTML = '';

            if (notifications.length === 0) {
                container.innerHTML = '<p style="color:#6b7280; text-align:center; padding:40px;">У вас нет уведомлений.</p>';
                return;
            }

            notifications.forEach(notif => {
                const date = new Date(notif.created_at).toLocaleString('ru-RU');
                const isUnread = notif.is_read === 0;
                
                const card = document.createElement('div');
                card.className = `notification-card ${isUnread ? 'unread' : ''}`;
                card.style.cursor = 'pointer';
                card.innerHTML = `
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-date">${date}</div>
                `;
                
                // Клик по уведомлению → помечаем как прочитанное и открываем заявку
                card.addEventListener('click', async () => {
                    if (isUnread) {
                        await fetch(`/api/notifications/${notif.id}/read`, {
                            method: 'PATCH',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        card.classList.remove('unread');
                    }
                    // Если есть связанная заявка — переходим на неё
                    if (notif.related_request_id) {
                        window.location.href = `request_detail.html?id=${notif.related_request_id}`;
                    }
                });
                
                container.appendChild(card);
            });

            // Обновляем бейдж непрочитанных
            updateUnreadBadge();

        } catch (error) {
            console.error(error);
            container.innerHTML = '<p style="color:#ef4444;">Ошибка загрузки.</p>';
        }
    }

    async function updateUnreadBadge() {
        try {
            const res = await fetch('/api/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const badge = document.getElementById('unread-badge');
            if (badge) {
                if (data.unread_count > 0) {
                    badge.textContent = data.unread_count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (e) { console.error(e); }
    }
});