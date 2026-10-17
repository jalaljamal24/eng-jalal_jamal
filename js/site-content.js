(() => {
    const config = window.PORTFOLIO_SUPABASE_CONFIG;

    const status = document.getElementById("content-sync-status");
    const showSyncError = () => {
        if (status) {
            status.hidden = false;
        }
    };

    const isSafeUrl = (value, kind) => {
        try {
            const url = new URL(value, window.location.href);
            const protocols = kind === "image"
                ? new Set(["http:", "https:"])
                : new Set(["http:", "https:", "mailto:", "tel:"]);

            return protocols.has(url.protocol) || (kind === "link" && value.startsWith("#"));
        } catch {
            return false;
        }
    };

    const techLogoCatalog = new Map([
        ["html5", ["5", "html-logo", "html5.svg"]],
        ["css3", ["3", "css-logo", "css.svg"]],
        ["javascript", ["JS", "js-logo", "javascript.svg"]],
        ["typescript", ["TS", "ts-logo", "typescript.svg"]],
        ["react", ["⚛", "react-logo", "react.svg"]],
        ["bootstrap 5", ["B", "bootstrap-logo", "bootstrap.svg"]],
        ["javascript (node.js)", ["JS", "node-logo", "nodejs.svg"]],
        ["node.js", ["JS", "node-logo", "nodejs.svg"]],
        ["php", ["PHP", "php-logo", "php.svg"]],
        ["python", ["Py", "python-logo", "python.svg"]],
        ["c++", ["C++", "cpp-logo", "cplusplus.svg"]],
        ["sql", ["SQL", "sql-logo", null]],
        ["postgresql", ["PG", "postgres-logo", "postgresql.svg"]],
        ["supabase", ["S", "supabase-logo", "supabase.svg"]],
        ["rest apis", ["API", "api-logo", null]],
        ["مساعدة البرمجة", ["</>", "ai-code-logo", null, null]],
        ["البحث", ["⌕", "ai-research-logo", null, null]],
        ["توليد الأفكار", ["✦", "ai-ideas-logo", null, null]],
        ["أتمتة المهام", ["↻", "ai-automation-logo", null, null]],
        ["secure coding", ["</>", "security-code-logo", null, null]],
        ["input checks", ["IN", "security-input-logo", null, null]],
        ["access control", ["AC", "security-access-logo", null, null]],
        ["data protection", ["DP", "security-data-logo", null, null]],
        ["تحليل المتطلبات", ["01", "delivery-planning-logo", null, null]],
        ["تصميم متجاوب", ["UI", "delivery-design-logo", null, null]],
        ["لوحة إدارة", ["CMS", "delivery-admin-logo", null, null]],
        ["api وقاعدة بيانات", ["API", "delivery-api-logo", null, null]],
        ["اختبار ونشر", ["↗", "delivery-launch-logo", null, null]]
    ]);

    const createTechLogo = (name) => {
        const item = document.createElement("span");
        item.className = "tech-logo-item";
        item.dataset.techName = name;
        item.setAttribute("role", "img");
        item.setAttribute("aria-label", name);
        item.title = name;

        const [markText, logoClass, iconFile] = techLogoCatalog.get(name.toLocaleLowerCase("ar")) || [
            Array.from(name.trim()).filter((character) => !/\s/.test(character)).slice(0, 2).join("").toUpperCase(),
            "tech-logo-generic",
            null
        ];
        item.classList.add(logoClass);

        const mark = document.createElement("span");
        mark.className = "tech-logo-mark";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = markText;

        if (iconFile) {
            const logo = document.createElement("img");
            logo.className = "tech-logo-image";
            logo.alt = "";
            logo.setAttribute("aria-hidden", "true");
            logo.addEventListener("load", () => {
                mark.hidden = true;
            }, { once: true });
            logo.addEventListener("error", () => {
                logo.hidden = true;
            }, { once: true });
            item.append(logo);
            logo.src = `assets/tech/${iconFile}`;
        }

        const label = document.createElement("span");
        label.className = "tech-logo-name";
        label.textContent = name;
        item.append(mark, label);
        return item;
    };

    document.querySelectorAll(".tech-logo-grid > .tech-logo-item[data-tech-name]").forEach((item) => {
        item.replaceWith(createTechLogo(item.dataset.techName));
    });

    if (!config?.url || !config?.anonKey) {
        return;
    }

    const applyContent = (content) => {
        for (const element of document.querySelectorAll("[data-cms-key]")) {
            const value = content[element.dataset.cmsKey];
            if (typeof value === "string") {
                if (value !== element.dataset.cmsLegacyValue) {
                    element.textContent = value;
                }
            }
        }

        for (const element of document.querySelectorAll("[data-cms-list-key]")) {
            const value = content[element.dataset.cmsListKey];
            if (typeof value !== "string") {
                continue;
            }

            const items = value
                .split(/\r?\n/)
                .map((item) => item.trim())
                .filter(Boolean)
                .filter((item, index, list) =>
                    list.findIndex((candidate) => candidate.toLocaleLowerCase("ar") === item.toLocaleLowerCase("ar")) === index
                );
            element.replaceChildren(...items.map((item) => {
                if (element.hasAttribute("data-cms-logo-grid")) {
                    return createTechLogo(item);
                }
                const tag = document.createElement("span");
                tag.textContent = item;
                return tag;
            }));
        }

        for (const element of document.querySelectorAll("[data-cms-href-key]")) {
            const value = content[element.dataset.cmsHrefKey];
            if (typeof value === "string" && isSafeUrl(value, "link")) {
                element.setAttribute("href", value);
            } else if (typeof value === "string" && value) {
                console.error(`Ignored an invalid published link for "${element.dataset.cmsHrefKey}".`);
            }
        }

        for (const element of document.querySelectorAll("[data-cms-src-key]")) {
            const value = content[element.dataset.cmsSrcKey];
            if (typeof value !== "string") {
                continue;
            }
            if (!value) {
                element.removeAttribute("src");
                element.hidden = true;
                continue;
            }
            if (!isSafeUrl(value, "image")) {
                console.error(`Ignored an invalid published image for "${element.dataset.cmsSrcKey}".`);
                continue;
            }

            const imageUrl = new URL(value, window.location.href);
            if (imageUrl.pathname.endsWith("/profile-photo.jpeg")) {
                imageUrl.searchParams.set("v", "20261017");
            }
            element.setAttribute("src", imageUrl.href);
            element.hidden = false;
        }

        document.title = "JALAL JAMAL";
        document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
        document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", document.title);

        const description = content["hero.description"];
        if (typeof description === "string" && description) {
            document.querySelector('meta[name="description"]')?.setAttribute("content", description);
            document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
            document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
        }

        const profileImage = content["profile.image"];
        if (typeof profileImage === "string" && profileImage && isSafeUrl(profileImage, "image")) {
            const profileImageUrl = new URL(profileImage, window.location.href);
            if (profileImageUrl.pathname.endsWith("/profile-photo.jpeg")) {
                profileImageUrl.searchParams.set("v", "20261017");
            }
            const publicImageUrl = profileImageUrl.href;
            document.querySelector('link[rel="icon"]')?.setAttribute("href", publicImageUrl);
            document.querySelector('meta[property="og:image"]')?.setAttribute("content", publicImageUrl);
            document.querySelector('meta[name="twitter:image"]')?.setAttribute("content", publicImageUrl);
        }
    };

    const loadContent = () => {
        if (!window.supabase?.createClient) {
            console.error("The Supabase client library loaded without its expected API.");
            showSyncError();
            return;
        }

        let client;
        try {
            client = window.supabase.createClient(config.url, config.anonKey);
        } catch (error) {
            console.error("Could not initialize the Supabase client.", error);
            showSyncError();
            return;
        }
        client
            .from("site_content")
            .select("content")
            .eq("id", true)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    throw error;
                }
                if (data?.content && typeof data.content === "object" && !Array.isArray(data.content)) {
                    applyContent(data.content);
                    document.dispatchEvent(new CustomEvent("portfolio:content-loaded"));
                }
            })
            .catch((error) => {
                console.error("Could not load published portfolio content.", error);
                showSyncError();
            });
    };

    const library = document.createElement("script");
    library.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
    library.onload = loadContent;
    library.onerror = () => {
        console.error("Could not load the Supabase client library.");
        showSyncError();
    };
    document.head.append(library);
})();
