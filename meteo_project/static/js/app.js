$(document).ready(function () {
    let map;
    let marker;

    function initMap(lat = 55.75, lon = 37.61) {
        if (!map) {
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
        }
        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker([lat, lon]).addTo(map);
        map.setView([lat, lon], 10);
    }

    $("#city-input").on("input", function () {
        const query = $(this).val();
        if (query.length < 2) return;

        $.get("/api/autocomplete/", { q: query }, function (data) {
            let list = $("#autocomplete-list");
            list.empty();
            data.forEach(function (item) {
                $("<div>")
                    .addClass("list-group-item list-group-item-action")
                    .text(item.label)
                    .data("lat", item.lat)
                    .data("lon", item.lon)
                    .appendTo(list);
            });
        });
    });

    $("#autocomplete-list").on("click", ".list-group-item", function () {
        const label = $(this).text();
        const lat = $(this).data("lat");
        const lon = $(this).data("lon");

        $("#city-input").val(label);
        $("#autocomplete-list").empty();
        fetchWeather(label);
    });

    function fetchWeather(city) {
        $.get("/api/weather/", { city }, function (data) {
            const w = data.weather;
            const html = `
                <h4>${data.city}</h4>
                <p><strong>Температура:</strong> ${w.current_weather.temperature}°C</p>
                <p><strong>Ветер:</strong> ${w.current_weather.windspeed} км/ч</p>
                <p><strong>Код погоды:</strong> ${w.current_weather.weathercode}</p>
            `;
            $("#weather-output").html(html);
            initMap(data.coordinates.lat, data.coordinates.lon);
        });
    }

    // Загрузить погоду по последнему введенному городу (если есть в сессии)
    const lastCity = localStorage.getItem("last_city");
    if (lastCity) fetchWeather(lastCity);

    $("#city-input").on("change", function () {
        localStorage.setItem("last_city", $(this).val());
    });
});
