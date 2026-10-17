(() => {
    const storageKey = "portfolio-theme";
    const root = document.documentElement;
    let theme = "dark";

    try {
        const savedTheme = window.localStorage.getItem(storageKey);
        if (savedTheme === "light" || savedTheme === "dark") {
            theme = savedTheme;
        }
    } catch (error) {
        console.error("Could not read the saved color theme.", error);
    }

    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
        "content",
        theme === "light" ? "#f4f7fb" : "#101923"
    );

    document.addEventListener("DOMContentLoaded", () => {
        const themeToggle = document.getElementById("theme-toggle");
        const themeIcon = themeToggle?.querySelector(".theme-toggle-icon");
        if (!themeToggle || !themeIcon) {
            console.error("Could not find the color theme toggle.");
            return;
        }

        const updateThemeToggle = () => {
            const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
            const label = nextTheme === "light" ? "تفعيل وضع النهار" : "تفعيل الوضع الليلي";
            themeToggle.setAttribute("aria-label", label);
            themeToggle.title = label;
            themeIcon.textContent = nextTheme === "light" ? "☀" : "☾";
            document.querySelector('meta[name="theme-color"]')?.setAttribute(
                "content",
                root.dataset.theme === "light" ? "#f4f7fb" : "#101923"
            );
        };

        updateThemeToggle();
        themeToggle.addEventListener("click", () => {
            root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
            updateThemeToggle();

            try {
                window.localStorage.setItem(storageKey, root.dataset.theme);
            } catch (error) {
                console.error("Could not save the selected color theme.", error);
            }
        });
    });
})();
