window.addEventListener("DOMContentLoaded", () => {
    const sideNav = document.body.querySelector("#sideNav");
    if (sideNav && window.bootstrap) {
        new bootstrap.ScrollSpy(document.body, {
            target: "#sideNav",
            rootMargin: "0px 0px -40%"
        });
    }

    const navbarToggler = document.body.querySelector(".navbar-toggler");
    const responsiveNavItems = document.querySelectorAll("#navbarResponsive .nav-link");
    responsiveNavItems.forEach((navItem) => {
        navItem.addEventListener("click", () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== "none") {
                navbarToggler.click();
            }
        });
    });

    const languageButtons = document.querySelectorAll("[data-lang]");
    const translatedText = document.querySelectorAll("[data-da][data-en]");
    const translatedImages = document.querySelectorAll("[data-alt-da][data-alt-en]");
    const languageToggle = document.querySelector(".language-toggle");
    const metaDescription = document.querySelector('meta[name="description"]');
    const openGraphDescription = document.querySelector('meta[property="og:description"]');

    const pageCopy = {
        da: {
            description: "Søren Frost Staal — salg, 3D, kreativ teknologi og Goldfish til FreeCAD.",
            languageLabel: "Vælg sprog",
            navigationLabel: "Vis navigation"
        },
        en: {
            description: "Søren Frost Staal — sales, 3D, creative technology and Goldfish for FreeCAD.",
            languageLabel: "Choose language",
            navigationLabel: "Show navigation"
        }
    };

    const setLanguage = (language, savePreference = true) => {
        const selectedLanguage = language === "en" ? "en" : "da";
        const copy = pageCopy[selectedLanguage];

        document.documentElement.lang = selectedLanguage;
        metaDescription?.setAttribute("content", copy.description);
        openGraphDescription?.setAttribute("content", copy.description);
        languageToggle?.setAttribute("aria-label", copy.languageLabel);
        navbarToggler?.setAttribute("aria-label", copy.navigationLabel);

        translatedText.forEach((element) => {
            element.textContent = element.dataset[selectedLanguage];
        });

        translatedImages.forEach((image) => {
            image.alt = image.dataset[selectedLanguage === "da" ? "altDa" : "altEn"];
        });

        languageButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.lang === selectedLanguage));
        });

        if (savePreference) {
            try {
                localStorage.setItem("extruda-language", selectedLanguage);
            } catch (_) {
                // The language switch works even if local storage is unavailable.
            }
        }
    };

    languageButtons.forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    let initialLanguage = navigator.language?.toLowerCase().startsWith("da") ? "da" : "en";
    try {
        const savedLanguage = localStorage.getItem("extruda-language");
        if (savedLanguage === "da" || savedLanguage === "en") initialLanguage = savedLanguage;
    } catch (_) {
        // Browser language is a sufficient fallback.
    }

    setLanguage(initialLanguage, false);

    const year = document.querySelector("#year");
    if (year) year.textContent = new Date().getFullYear();
});
