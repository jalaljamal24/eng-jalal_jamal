const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (navToggle && navLinks) {
    const closeNavigation = () => {
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "فتح قائمة التنقل");
        navLinks.classList.remove("is-open");
    };

    navToggle.addEventListener("click", () => {
        const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!isExpanded));
        navToggle.setAttribute("aria-label", isExpanded ? "فتح قائمة التنقل" : "إغلاق قائمة التنقل");
        navLinks.classList.toggle("is-open", !isExpanded);
    });

    document.addEventListener("click", (event) => {
        if (
            navToggle.getAttribute("aria-expanded") === "true"
            && event.target instanceof Node
            && !navToggle.contains(event.target)
            && !navLinks.contains(event.target)
        ) {
            closeNavigation();
        }
    });

    navLinks.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a[href^='#']")) {
            closeNavigation();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
            closeNavigation();
            navToggle.focus();
        }
    });
}

const siteSearchForm = document.getElementById("site-search-form");
const siteSearchInput = document.getElementById("site-search");
const siteSearchResults = document.getElementById("site-search-results");

if (siteSearchForm && siteSearchInput && siteSearchResults) {
    const searchableSections = [
        ["home", "الرئيسية"],
        ["about", "نبذة عني"],
        ["experience", "الخبرات"],
        ["projects", "المشاريع"],
        ["skills", "المهارات"],
        ["technology", "التقنيات"],
        ["contact", "التواصل"]
    ];

    const normalizeSearchText = (value) => value
        .normalize("NFKC")
        .toLocaleLowerCase("ar")
        .replace(/[\u064B-\u065F\u0670]/g, "")
        .trim();

    const closeSearchResults = () => {
        siteSearchResults.hidden = true;
        siteSearchInput.setAttribute("aria-expanded", "false");
    };

    const renderSearchResults = () => {
        const query = normalizeSearchText(siteSearchInput.value);
        siteSearchResults.replaceChildren();

        if (!query) {
            closeSearchResults();
            return [];
        }

        const matches = searchableSections
            .map(([id, label]) => {
                const section = document.getElementById(id);
                if (!section) return null;

                const content = normalizeSearchText(section.innerText || "");
                const title = section.querySelector("h1, h2, h3")?.textContent?.trim() || label;
                const titleMatches = normalizeSearchText(title).includes(query);
                return content.includes(query) || titleMatches
                    ? { id, label: title, titleMatches }
                    : null;
            })
            .filter((match) => match !== null)
            .sort((left, right) => Number(right.titleMatches) - Number(left.titleMatches))
            .slice(0, 6);

        if (matches.length === 0) {
            const emptyMessage = document.createElement("div");
            emptyMessage.className = "site-search-empty";
            emptyMessage.textContent = "لا توجد نتائج مطابقة";
            siteSearchResults.append(emptyMessage);
        } else {
            for (const match of matches) {
                const result = document.createElement("a");
                result.href = `#${match.id}`;
                result.setAttribute("role", "listitem");
                result.textContent = match.label;
                siteSearchResults.append(result);
            }
        }

        siteSearchResults.hidden = false;
        siteSearchInput.setAttribute("aria-expanded", "true");
        return matches;
    };

    siteSearchInput.addEventListener("input", renderSearchResults);

    siteSearchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        renderSearchResults();
        const firstResult = siteSearchResults.querySelector("a");
        if (firstResult) {
            window.location.hash = firstResult.hash;
            closeSearchResults();
        }
    });

    siteSearchResults.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
            closeSearchResults();
        }
    });

    document.addEventListener("click", (event) => {
        if (event.target instanceof Node && !siteSearchForm.contains(event.target)) {
            closeSearchResults();
        }
    });

    siteSearchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSearchResults();
            siteSearchInput.blur();
        }
    });
}

const profileMenuToggle = document.getElementById("profile-menu-toggle");
const profileQuickMenu = document.getElementById("profile-quick-menu");

if (profileMenuToggle && profileQuickMenu) {
    const setProfileMenuOpen = (isOpen) => {
        profileMenuToggle.setAttribute("aria-expanded", String(isOpen));
        profileMenuToggle.setAttribute("aria-label", isOpen ? "إغلاق قائمة الملف الشخصي" : "فتح قائمة الملف الشخصي");
        profileQuickMenu.hidden = !isOpen;
    };

    profileMenuToggle.addEventListener("click", () => {
        setProfileMenuOpen(profileMenuToggle.getAttribute("aria-expanded") !== "true");
    });

    profileQuickMenu.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
            setProfileMenuOpen(false);
        }
    });

    document.addEventListener("click", (event) => {
        if (
            profileMenuToggle.getAttribute("aria-expanded") === "true"
            && event.target instanceof Node
            && !profileMenuToggle.contains(event.target)
            && !profileQuickMenu.contains(event.target)
        ) {
            setProfileMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && profileMenuToggle.getAttribute("aria-expanded") === "true") {
            setProfileMenuOpen(false);
            profileMenuToggle.focus();
        }
    });
}

const updateServiceContactLinks = () => {
    const contactEmail = document.querySelector(".email-address[href^='mailto:']")
        ?.getAttribute("href")
        ?.split("?")[0];
    const whatsappHref = document.querySelector("[data-cms-href-key='contact.whatsappUrl']")
        ?.getAttribute("href");
    const whatsappUrl = whatsappHref ? new URL(whatsappHref, window.location.href) : null;
    const whatsappNumber = whatsappUrl?.hostname === "wa.me"
        ? whatsappUrl.pathname.replace(/\D/g, "")
        : "";

    document.querySelectorAll("[data-contact-topic]").forEach((link) => {
        const topic = link.dataset.contactTopic;
        if (link.classList.contains("skill-action") && whatsappNumber) {
            const message = `مرحباً جلال، أرغب في الاستفسار عن مجال: ${topic}.`;
            link.setAttribute("href", `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`);
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
            return;
        }

        if (!contactEmail) {
            return;
        }

        const subject = `استفسار حول ${topic}`;
        const body = `مرحباً جلال،\n\nأرغب في الاستفسار عن خدمة: ${topic}.\n\n`;
        link.setAttribute("href", `${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    });
};

updateServiceContactLinks();
document.addEventListener("portfolio:content-loaded", updateServiceContactLinks);

const copyEmailButton = document.getElementById("copy-email-button");

copyEmailButton?.addEventListener("click", async () => {
    const email = document.querySelector("[data-cms-key='contact.email']")?.textContent.trim();
    const status = document.getElementById("copy-email-status");

    if (!email || !status) {
        console.error("Could not find the email address to copy.");
        if (status) {
            status.textContent = "تعذر العثور على البريد الإلكتروني.";
        }
        return;
    }

    try {
        if (!navigator.clipboard?.writeText) {
            throw new Error("Clipboard access is unavailable in this browser context.");
        }
        await navigator.clipboard.writeText(email);
        status.textContent = "تم نسخ البريد الإلكتروني.";
    } catch (error) {
        console.error("Could not copy the contact email.", error);
        status.textContent = "تعذر النسخ تلقائيًا؛ يمكنك تحديد البريد ونسخه يدويًا.";
    }
});

const shareSiteButton = document.getElementById("share-site-button");

const copyTextToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch {
            // Fall back to the document copy command for browsers that block clipboard access.
        }
    }

    const copyField = document.createElement("textarea");
    copyField.value = text;
    copyField.setAttribute("readonly", "");
    copyField.style.position = "fixed";
    copyField.style.opacity = "0";
    document.body.append(copyField);
    copyField.focus();
    copyField.select();

    let copied = false;
    try {
        copied = document.execCommand("copy");
    } finally {
        copyField.remove();
    }

    if (!copied) {
        throw new Error("The browser did not allow copying the site link.");
    }
};

shareSiteButton?.addEventListener("click", async () => {
    const status = document.getElementById("share-site-status");
    if (!status) {
        console.error("Could not find the site sharing status element.");
        return;
    }

    const shareUrl = new URL(window.location.href);
    shareUrl.search = "";
    shareUrl.hash = "";
    const shareData = {
        title: document.title,
        text: "تعرّف على موقعي وأعمالي الرقمية.",
        url: shareUrl.href
    };

    if (window.location.protocol !== "file:" && navigator.share) {
        try {
            await navigator.share(shareData);
            status.textContent = "تمت مشاركة الموقع.";
            return;
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }
        }
    }

    try {
        await copyTextToClipboard(shareData.url);
        status.textContent = window.location.protocol === "file:"
            ? "تم نسخ مسار الصفحة؛ لن يتمكن الآخرون من فتحه حتى تنشر الموقع على الإنترنت."
            : "تم نسخ رابط الموقع لمشاركته.";
    } catch (error) {
        console.error("Could not share or copy the site link.", error);
        status.textContent = "تعذّر نسخ رابط الموقع. حاول مرة أخرى أو انسخ الرابط من شريط العنوان.";
    }
});

const backToTop = document.getElementById("back-to-top");
const progressBar = document.querySelector("#reading-progress span");
let scrollUpdateScheduled = false;

const updateScrollState = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    if (progressBar) {
        progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    }
    backToTop?.classList.toggle("is-visible", window.scrollY > 520);
    scrollUpdateScheduled = false;
};

window.addEventListener("scroll", () => {
    if (!scrollUpdateScheduled) {
        window.requestAnimationFrame(updateScrollState);
        scrollUpdateScheduled = true;
    }
}, { passive: true });
window.addEventListener("resize", updateScrollState, { passive: true });
updateScrollState();

backToTop?.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
});

const navigationLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];
const navigationSections = navigationLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter((section) => section instanceof HTMLElement);

if ("IntersectionObserver" in window && navigationSections.length > 0) {
    const intersectingSections = new Set();
    const sectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                intersectingSections.add(entry.target);
            } else {
                intersectingSections.delete(entry.target);
            }
        }

        const activeSection = [...intersectingSections]
            .sort((left, right) => Math.abs(left.getBoundingClientRect().top - window.innerHeight * 0.2)
                - Math.abs(right.getBoundingClientRect().top - window.innerHeight * 0.2))[0];
        if (activeSection) {
            const activeLink = navigationLinks.find((link) => link.hash === `#${activeSection.id}`);
            navigationLinks.forEach((link) => {
                if (link === activeLink) {
                    link.setAttribute("aria-current", "location");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        }
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });

    navigationSections.forEach((section) => sectionObserver.observe(section));
}

const revealTargets = document.querySelectorAll(
    ".hero-content, .hero-art, .section-heading, .about-layout, .timeline-item, .project-card, .skill-item, .technical-skill-card, .contact-card"
);

if (
    "IntersectionObserver" in window
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
    document.body.classList.add("has-reveal-support");
    const revealObserver = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-revealed");
                observer.unobserve(entry.target);
            }
        }
    }, { threshold: 0.08, rootMargin: "0px 0px -28px 0px" });

    revealTargets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 65}ms`);
        revealObserver.observe(element);
    });
}

const imageLightbox = document.getElementById("image-lightbox");
const lightboxImage = document.getElementById("image-lightbox-image");
const lightboxCaption = document.getElementById("image-lightbox-caption");
const lightboxClose = imageLightbox?.querySelector(".image-lightbox-close");
const avatarAction = document.getElementById("avatar-action");
const avatarImage = avatarAction?.querySelector(".avatar");

if (avatarAction && avatarImage) {
    let avatarAnimation;

    avatarAction.addEventListener("click", () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        avatarAnimation?.cancel();
        avatarAnimation = avatarImage.animate(
            [
                { transform: "scale(1) rotate(0)", borderRadius: "50%" },
                { offset: 0.35, transform: "scale(0.94) rotate(-7deg)", borderRadius: "42%" },
                { offset: 0.68, transform: "scale(1.04) rotate(4deg)", borderRadius: "42%" },
                { transform: "scale(1) rotate(0)", borderRadius: "50%" }
            ],
            { duration: 620, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
        );
    });
}

const openImageLightbox = (source, caption, alt = caption) => {
    if (!(imageLightbox instanceof HTMLDialogElement) || !lightboxImage || !lightboxCaption) {
        console.error("Could not find the image viewer.");
        return;
    }

    lightboxImage.src = source;
    lightboxImage.alt = alt;
    lightboxCaption.textContent = caption;
    imageLightbox.showModal();
};

const updateProjectImageTriggers = () => {
    document.querySelectorAll(".project-visual").forEach((visual) => {
        const image = visual.querySelector(".project-upload");
        const trigger = visual.querySelector(".project-image-trigger");
        if (!(image instanceof HTMLImageElement) || !(trigger instanceof HTMLButtonElement)) {
            return;
        }

        const isLoaded = !image.hidden && image.complete && image.naturalWidth > 0;
        trigger.hidden = !isLoaded;
        trigger.setAttribute("aria-hidden", String(!isLoaded));
        visual.classList.toggle("has-project-image", isLoaded);
    });
};

document.querySelectorAll(".project-upload").forEach((image) => {
    image.addEventListener("load", updateProjectImageTriggers);
    image.addEventListener("error", updateProjectImageTriggers);
});
updateProjectImageTriggers();
const projectImageObserver = new MutationObserver(updateProjectImageTriggers);
document.querySelectorAll(".project-upload").forEach((image) => {
    projectImageObserver.observe(image, { attributes: true, attributeFilter: ["src", "hidden"] });
});
document.addEventListener("portfolio:content-loaded", updateProjectImageTriggers);

document.querySelectorAll(".project-image-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
        const image = trigger.closest(".project-visual")?.querySelector(".project-upload");
        const caption = trigger.closest(".project-card")?.querySelector(".project-info h3")?.textContent.trim();
        if (!(image instanceof HTMLImageElement) || !image.currentSrc || !caption) {
            console.error("Could not load the project image for preview.");
            return;
        }
        openImageLightbox(image.currentSrc, caption, `صورة ${caption}`);
    });
});

lightboxClose?.addEventListener("click", () => imageLightbox?.close());
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && imageLightbox?.open) {
        imageLightbox.close();
    }
});
imageLightbox?.addEventListener("click", (event) => {
    if (event.target === imageLightbox) {
        imageLightbox.close();
    }
});
imageLightbox?.addEventListener("close", () => {
    if (lightboxImage) {
        lightboxImage.removeAttribute("src");
    }
});
