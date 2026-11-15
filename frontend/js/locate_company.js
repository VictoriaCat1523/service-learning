// =====================================================
// 1. РАБОТА ФИЛЬТРОВ
// =====================================================

const showCategories = document.querySelector(".show_categories");
const extraCategories = document.querySelector(".extra_categories");

const change = () => {
    if (!extraCategories || !showCategories) return;
    extraCategories.hidden = !extraCategories.hidden;
    if (extraCategories.hidden) {
        showCategories.textContent = "Показать всё";
    } else {
        showCategories.textContent = "Свернуть";   
    }
};

if (showCategories) {
    showCategories.addEventListener("click", change);
}

// ВОЗРАСТНОЙ ФИЛЬТР
const minAge = document.querySelector("#minAge");
const maxAge = document.querySelector("#maxAge");
const minAgeValue = document.querySelector("#minAgeValue");
const maxAgeValue = document.querySelector("#maxAgeValue");
const ageRange = document.querySelector(".age_range");
const ageSliders = document.querySelector(".age_sliders");

const updateAgeSlider = (event) => {
    if (!minAge || !maxAge) return;
    let min = Number(minAge.value);
    let max = Number(maxAge.value);

    if (min > max) {
        if (event.target === minAge) {
            minAge.value = max;
            min = max;
        } else {
            maxAge.value = min;
            max = min;
        }
    }

    if (minAgeValue) minAgeValue.textContent = min;
    if (maxAgeValue) maxAgeValue.textContent = max;

    const minPercent = ((min - Number(minAge.min)) / (Number(minAge.max) - Number(minAge.min))) * 100;
    const maxPercent = ((max - Number(maxAge.min)) / (Number(maxAge.max) - Number(maxAge.min))) * 100;

    if (ageRange) {
        ageRange.style.left = `${minPercent}%`;
        ageRange.style.right = `${100 - maxPercent}%`;
    }
};

if (minAge) minAge.addEventListener("input", updateAgeSlider);
if (maxAge) maxAge.addEventListener("input", updateAgeSlider);

if (ageSliders) {
    ageSliders.addEventListener("click", (event) => {
        if (event.target === minAge || event.target === maxAge) return;

        const rect = ageSliders.getBoundingClientRect();
        const clickPosition = (event.clientX - rect.left) / rect.width;

        const min = Number(minAge.value);
        const max = Number(maxAge.value);
        const minValue = Number(minAge.min);
        const maxValue = Number(minAge.max);

        const clickedAge = Math.round(minValue + clickPosition * (maxValue - minValue));
        const distanceToMin = Math.abs(clickedAge - min);
        const distanceToMax = Math.abs(clickedAge - max);

        if (distanceToMin <= distanceToMax) {
            minAge.value = Math.min(clickedAge, max);
        } else {
            maxAge.value = Math.max(clickedAge, min);
        }

        updateAgeSlider({ target: ageSliders });
    });
}

if (minAge) updateAgeSlider({ target: minAge });


// =====================================================
// 2. ЗАГРУЗКА И ОТОБРАЖЕНИЕ ЗАЯВОК
// =====================================================

async function loadRequests() {
    const container = document.getElementById('requests-container');
    if (!container) return;

    // Показываем индикатор загрузки
    container.innerHTML = '<p style="text-align:center; padding: 20px; color: #666;">Загрузка заявок...</p>';

    try {
        const response = await fetch('/api/requests/');
        
        if (!response.ok) throw new Error('Ошибка загрузки заявок');
        
        const requests = await response.json();
        container.innerHTML = ''; // Очищаем индикатор загрузки

        if (requests.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 20px; color: #666;">Пока нет активных заявок. Будь первым!</p>';
            return;
        }

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        // Рендерим каждую заявку
        requests.forEach(req => {
            const dateStr = req.date_time ? new Date(req.date_time).toLocaleString('ru-RU', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            }) : 'Дата не указана';

            const cardHTML = `
                <div class="request-card" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; color: #111827; font-size: 1.25rem;">${req.title}</h3>
                        <span style="background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">${req.activity_type}</span>
                    </div>
                    <p style="color: #4b5563; margin: 10px 0; line-height: 1.5;">${req.description}</p>
                    <div style="font-size: 0.9rem; color: #6b7280; margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px;">
                        <span>📍 ${req.location}</span>
                        <span>📅 ${dateStr}</span>
                        <span>👥 Ищут еще: ${req.people_count - 1} чел. (всего ${req.people_count})</span>
                    </div>
                    <button class="join-btn" data-id="${req.id}" style="background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600; transition: background 0.2s;">
                        Откликнуться
                    </button>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

        // Навешиваем обработчики на кнопки "Откликнуться"
        document.querySelectorAll('.join-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!token) {
                    alert('Пожалуйста, войдите в аккаунт, чтобы откликнуться!');
                    window.location.href = 'login.html';
                    return;
                }

                const requestId = e.target.dataset.id;
                e.target.disabled = true;
                e.target.textContent = 'Отправка...';

                try {
                    const res = await fetch(`/api/requests/${requestId}/join`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (res.ok) {
                        e.target.textContent = 'Вы откликнулись ✓';
                        e.target.style.background = '#10b981'; // Зеленый цвет
                    } else {
                        const err = await res.json();
                        alert(err.detail || 'Не удалось откликнуться');
                        e.target.disabled = false;
                        e.target.textContent = 'Откликнуться';
                    }
                } catch (error) {
                    console.error(error);
                    alert('Ошибка сети');
                    e.target.disabled = false;
                    e.target.textContent = 'Откликнуться';
                }
            });
        });

    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = '<p style="text-align:center; color: #ef4444; padding: 20px;">Не удалось загрузить заявки. Проверьте, запущен ли backend.</p>';
    }
}

// Запускаем загрузку при открытии страницы
document.addEventListener('DOMContentLoaded', loadRequests);