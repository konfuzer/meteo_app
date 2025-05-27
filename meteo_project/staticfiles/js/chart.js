document.addEventListener('DOMContentLoaded', function () {
    const map = L.map('map').setView([55.751244, 37.618423], 4); // Москва по умолчанию

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const searchInput = document.getElementById('city-search');
    const resultsContainer = document.getElementById('search-results');
    const forecastContainer = document.getElementById('forecast');

    let markers = [];

    function showForecastOnMap(data, lat, lon) {
        const popupContent = `
            <strong>${data.city}</strong><br>
            🌤️ Погода: ${data.weather}<br>
            🌡️ Температура: ${data.temperature}°C<br>
            🌧️ Осадки: ${data.precipitation || '0'} мм<br>
            🌬️ Ветер: ${data.windspeed || '0'} м/с<br>
            📅 Дата: ${data.date}<br>
            ⌚ Почасовой прогноз:<br>
            ${data.hourly.map((hour, index) => {
                return `${hour.time.slice(11, 16)}: ${hour.temp}°C, 💨 ${hour.wind} м/с, ☔ ${hour.precip} мм<br>`;
            }).join('')}
        `;

        const marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(popupContent)
            .openPopup();

        markers.push(marker);
    }

    function clearMarkers() {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
    }

    async function fetchWeatherForCity(city) {
        try {
            const response = await fetch(`/api/weather?city=${city}`);
            if (!response.ok) throw new Error('Ошибка запроса');

            const data = await response.json();

            const { latitude, longitude, weather_data, forecast_hourly } = data;

            clearMarkers();

            showForecastOnMap({
                city: city,
                weather: weather_data.weather,
                temperature: weather_data.temperature,
                precipitation: weather_data.precipitation,
                windspeed: weather_data.windspeed,
                date: weather_data.date,
                hourly: forecast_hourly.map((hour, i) => ({
                    time: hour.time,
                    temp: hour.temperature,
                    wind: hour.windspeed,
                    precip: hour.precipitation
                }))
            }, latitude, longitude);

            map.setView([latitude, longitude], 8);
        } catch (error) {
            console.error(error);
            alert('Не удалось загрузить погоду');
        }
    }

    searchInput.addEventListener('input', async function () {
        const query = this.value;
        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/autocomplete?query=${query}`);
            const data = await response.json();

            resultsContainer.innerHTML = '';
            data.forEach(city => {
                const li = document.createElement('li');
                li.textContent = `${city.name}, ${city.country}`;
                li.addEventListener('click', () => {
                    fetchWeatherForCity(city.name);
                    resultsContainer.innerHTML = '';
                    searchInput.value = `${city.name}, ${city.country}`;
                });
                resultsContainer.appendChild(li);
            });
        } catch (error) {
            console.error('Ошибка автодополнения', error);
        }
    });
});
