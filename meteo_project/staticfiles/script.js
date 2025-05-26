// script.js

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('city-input');
    const suggestionsList = document.getElementById('suggestions');
    const historyList = document.getElementById('history-list');
    const weatherResult = document.getElementById('weather-result');
    const themeToggle = document.getElementById('theme-toggle');
    let map = null;

    // Переключатель темы
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });

    // Подсказки при вводе
    input.addEventListener('input', async () => {
        const query = input.value.trim();
        if (query.length < 2) {
            suggestionsList.style.display = 'none';
            return;
        }

        try {
            const res = await fetch(`/api/cities/?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            suggestionsList.innerHTML = '';
            data.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.name}, ${item.country || 'Неизвестная страна'}`;
                li.addEventListener('click', () => {
                    input.value = item.name;
                    suggestionsList.style.display = 'none';
                    getWeather(item.name);
                });
                suggestionsList.appendChild(li);
            });

            suggestionsList.style.display = data.length > 0 ? 'block' : 'none';
        } catch (err) {
            console.error("Ошибка подсказок:", err);
        }
    });

    // История посещений
    async function loadHistory() {
        try {
            const res = await fetch('/api/history/');
            const data = await res.json();

            historyList.innerHTML = '';
            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.textContent = item.city;
                div.addEventListener('click', () => getWeather(item.city));
                historyList.appendChild(div);
            });
        } catch (err) {
            console.error("Ошибка загрузки истории:", err);
        }
    }

    // Получение погоды
    async function getWeather(city) {
        try {
            const res = await fetch(`/api/weather/?city=${encodeURIComponent(city)}`);
            const data = await res.json();

            if (data.error) {
                weatherResult.innerHTML = `<p class="error">${data.error}</p>`;
                return;
            }

            const cityName = city;
            const lat = data.latitude;
            const lon = data.longitude;

            // Очистка предыдущей карты
            if (map) {
                map.remove();
                map = null;
            }

            // Создание контейнера для карты
            const mapDiv = document.createElement('div');
            mapDiv.id = 'map';
            mapDiv.style.height = '300px';
            mapDiv.style.marginTop = '20px';

            weatherResult.innerHTML = `
                <h2>${cityName}</h2>
                <div class="temperature">${data.current.temperature_2m}°C</div>
                <ul>
                    <li><span class="icon">💧</span> Влажность: ${data.hourly.relative_humidity_2m[0]}%</li>
                    <li><span class="icon"><img src="/static/icons/wind.svg" alt="wind" width="20"></span> Ветер: ${data.current.wind_speed_10m} км/ч</li>
                    <li><span class="icon">📊</span> Атмосферное давление: ${data.current.apparent_temperature || '?'} кПа</li>
                    <li><span class="icon">🌅</span> УФ-индекс: Средний</li>
                </ul>

                <h3>Прогноз на ближайшие часы</h3>
                <div class="forecast-carousel"></div>

                <h3>Карта</h3>
            `;
            weatherResult.appendChild(mapDiv);

            // Карта
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            L.marker([lat, lon]).addTo(map);

            // Прогноз по часам
            const forecastContainer = document.querySelector('.forecast-carousel');
            forecastContainer.innerHTML = '';

            for (let i = 0; i < 6 && i < data.hourly.time.length; i++) {
                const time = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: '2-digit' });
                const temp = data.hourly.temperature_2m[i];

                const card = document.createElement('div');
                card.className = 'forecast-day';
                card.innerHTML = `
                    <div class="time">${time}</div>
                    <div class="temp">${temp}°C</div>
                `;
                forecastContainer.appendChild(card);
            }

        } catch (err) {
            console.error("Ошибка получения погоды:", err);
            weatherResult.innerHTML = '<p class="error">Ошибка получения данных о погоде</p>';
        }
    }

    loadHistory();
});