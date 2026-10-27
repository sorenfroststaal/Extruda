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

    document.querySelector("#navbarResponsive")?.addEventListener("keydown", event => {
        if (event.key === "Escape" && window.getComputedStyle(navbarToggler).display !== "none" && window.bootstrap) {
            bootstrap.Collapse.getOrCreateInstance(document.querySelector("#navbarResponsive"), { toggle: false }).hide();
            navbarToggler.focus();
        }
    });

    const languageButtons = document.querySelectorAll("[data-lang]");
    const translatedText = document.querySelectorAll("[data-da][data-en]");
    const translatedImages = document.querySelectorAll("[data-alt-da][data-alt-en]");
    const projectMoreToggles = document.querySelectorAll(".project-more-toggle");
    const languageToggle = document.querySelector(".language-toggle");
    const metaDescription = document.querySelector('meta[name="description"]');
    const openGraphDescription = document.querySelector('meta[property="og:description"]');

    const pageCopy = {
        da: {
            description: "Søren Frost Staal — produktudvikling, 3D, kreativ teknologi og Goldfish til FreeCAD.",
            languageLabel: "Vælg sprog",
            navigationLabel: "Vis navigation"
        },
        en: {
            description: "Søren Frost Staal — product development, 3D, creative technology and Goldfish for FreeCAD.",
            languageLabel: "Choose language",
            navigationLabel: "Show navigation"
        }
    };

    let currentLanguage = "da";

    const updateProjectMoreLabels = () => {
        projectMoreToggles.forEach((button) => {
            const label = button.querySelector("[data-more-da]");
            if (!label) return;
            const isOpen = button.getAttribute("aria-expanded") === "true";
            const key = `${isOpen ? "less" : "more"}${currentLanguage === "da" ? "Da" : "En"}`;
            label.textContent = label.dataset[key];
            const projectName = button.closest("article")?.querySelector(".project-title strong")?.textContent || "";
            button.setAttribute("aria-label", `${label.dataset[key]}: ${projectName}`);
        });
    };

    const setLanguage = (language) => {
        const selectedLanguage = language === "en" ? "en" : "da";
        const copy = pageCopy[selectedLanguage];
        currentLanguage = selectedLanguage;

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

        updateProjectMoreLabels();

    };

    languageButtons.forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });

    projectMoreToggles.forEach((button) => {
        const target = document.querySelector(button.dataset.bsTarget);
        target?.addEventListener("shown.bs.collapse", updateProjectMoreLabels);
        target?.addEventListener("hidden.bs.collapse", updateProjectMoreLabels);
    });

    // Every new page load starts in Danish. Visitors can switch to English
    // for the current visit without changing the default for their next load.
    window.ExtrudaPage = { setLanguage };
    if (window.ExtrudaUI) window.ExtrudaUI.setPreferences({}, false);
    else setLanguage("da");

    const year = document.querySelector("#year");
    if (year) year.textContent = new Date().getFullYear();
});
