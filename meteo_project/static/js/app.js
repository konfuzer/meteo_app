document.addEventListener('DOMContentLoaded', function () {
    let map, marker;

    function initMap(lat = 55.75, lon = 37.61) {
        if (!map) {
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        } else {
            map.setView([lat, lon], 10);
        }

        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker([lat, lon]).addTo(map);
    }

    function getEmoji(code) {
        const codes = {
            0: "☀️", 1: "🌤️", 2: "🌥️", 3: "☁️", 45: "🌫️", 48: "🌫️",
            51: "🌦️", 53: "🌧️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
            71: "❄️", 73: "❄️", 75: "❄️", 95: "🌩️", 99: "🌩️"
        };
        return codes[code] || "❓";
    }

    function formatDateTimeLocal(isoStr) {
        const date = new Date(isoStr);
        return date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    function renderWeather(data) {
        const current = data.current;
        const location = data.location;
        const localTime = data.hourly.time[data.index_now]; // ⏰ реальное местное время города

        const weatherHTML = `
            <div class="weather-card">
                <h4>${location.name}, ${location.country}</h4>
                <p><strong>📅</strong> ${formatDateTimeLocal(localTime)}</p>
                <p><strong>🌡️ Температура:</strong> ${current.temperature}°C</p>
                <p><strong>🌧️ Осадки:</strong> ${current.precipitation} мм</p>
                <p><strong>💧 Влажность:</strong> ${current.humidity}%</p>
                <p><strong>🌬️ Ветер:</strong> ${current.wind} км/ч</p>
                <p><strong>☀️ UV:</strong> ${current.uv_index}</p>
                <span style="font-size: 2rem;">${getEmoji(current.weathercode)}</span>
            </div>
        `;
        document.getElementById("weather-output").innerHTML = weatherHTML;

        // Прогноз на 7 дней
        const daily = data.daily;
        const dailyHTML = daily.time.map((date, index) => `
            <div class="card p-2 text-center">
                <div>${formatDate(date)}</div>
                <span style="font-size: 1.5rem;">${getEmoji(daily.weathercode[index])}</span>
                <div>🌡️ ${daily.temperature_2m_max[index]}° / ${daily.temperature_2m_min[index]}°</div>
                <div>🌧️ ${daily.precipitation_sum[index]} мм</div>
            </div>
        `).join('');
        document.getElementById("daily-forecast").innerHTML = dailyHTML;

        // Почасовой прогноз
        const hourly = data.hourly;
        const hourlyHTML = hourly.time.map((time, index) => `
            <tr>
                <td>${formatTime(time)}</td>
                <td>${hourly.temperature[index]}°</td>
                <td>${hourly.precipitation[index]} мм</td>
                <td><span>${getEmoji(hourly.weathercode[index])}</span></td>
            </tr>
        `).join('');
        document.getElementById("hourly-table").innerHTML = hourlyHTML;

        initMap(location.latitude, location.longitude);
    }

    function fetchWeather(city) {
        fetch(`/api/weather/?city=${encodeURIComponent(city)}`)
            .then(res => res.json())
            .then(data => {
                localStorage.setItem("last_city", city);
                renderWeather(data);
            })
            .catch(() => {
                document.getElementById("weather-output").innerHTML = "<p>Ошибка загрузки данных.</p>";
            });
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    function formatTime(datetimeStr) {
        return new Date(datetimeStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    const input = document.getElementById('city-input');
    const list = document.getElementById('autocomplete-list');

    let debounceTimer;
    input.addEventListener('input', function () {
        const query = this.value;
        clearTimeout(debounceTimer);
        if (query.length < 2) {
            list.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(() => {
            fetch(`/api/autocomplete/?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    list.innerHTML = '';
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'list-group-item list-group-item-action';
                        div.textContent = item.label;
                        div.addEventListener('click', () => {
                            input.value = item.label;
                            list.innerHTML = '';
                            localStorage.setItem("last_city", item.label);
                            fetchWeather(item.label.split(',')[0]);
                        });
                        list.appendChild(div);
                    });
                });
        }, 300);
    });

    const lastCity = localStorage.getItem("last_city");
    if (lastCity) {
        input.value = lastCity;
        fetchWeather(lastCity);
    }
});
