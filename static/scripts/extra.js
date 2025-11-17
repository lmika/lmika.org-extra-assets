document.addEventListener('DOMContentLoaded', () => {
    let ms = document.querySelectorAll('figure.marginalia');
    for (let m of ms) {
        let parentEl = m.parentElement;
        parentEl.insertBefore(m, m);
        m.classList.remove("hidden");
    }
});