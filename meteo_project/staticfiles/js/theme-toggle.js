document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-theme');
        toggleButton.textContent = '☀️';
    }

    toggleButton.addEventListener('click', function () {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            toggleButton.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            toggleButton.textContent = '🌙';
        }
    });
});