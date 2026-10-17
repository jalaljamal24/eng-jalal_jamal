(() => {
    const loginPanel = document.getElementById("login-panel");
    const editorPanel = document.getElementById("editor-panel");
    const contentForm = document.getElementById("content-form");
    const loginStatus = document.getElementById("login-status");
    const saveStatus = document.getElementById("save-status");
    const googleLoginButton = document.getElementById("google-login-button");
    const saveButton = document.getElementById("save-button");
    const logoutButton = document.getElementById("logout-button");
    const connectionWarning = document.getElementById("connection-warning");
    const serviceStatus = document.getElementById("service-status");
    const authorizationHelp = document.getElementById("authorization-help");
    const authorizationSql = document.getElementById("authorization-sql");
    const fieldSearch = document.getElementById("field-search");
    const searchResults = document.getElementById("search-results");
    const emptySearch = document.getElementById("empty-search");
    const fieldsContainer = document.getElementById("editor-fields");
    const selectedFiles = new Map();
    const clearedImages = new Set();
    let client;
    let fields = [];
    let content = {};

    document.getElementById("current-year").textContent = new Date().getFullYear();

    const setStatus = (element, message, isSuccess = false) => {
        element.textContent = message;
        element.classList.toggle("is-success", isSuccess);
    };

    const setServiceStatus = (state, message) => {
        serviceStatus.classList.remove("is-checking", "is-offline");
        if (state !== "online") {
            serviceStatus.classList.add(state === "checking" ? "is-checking" : "is-offline");
        }
        document.getElementById("service-status-text").textContent = message;
    };

    const checkServices = async () => {
        const [databaseResult, storageResult] = await Promise.all([
            client.from("site_content").select("id").limit(1),
            client.storage.from("site-images").list("", { limit: 1 })
        ]);

        if (databaseResult.error) {
            console.error("Supabase database health check failed.", databaseResult.error);
            setServiceStatus("offline", "تعذر الاتصال بقاعدة البيانات");
            return;
        }
        if (storageResult.error) {
            console.error("Supabase image storage health check failed.", storageResult.error);
            setServiceStatus("offline", "قاعدة البيانات متصلة · تعذر فحص الصور");
            return;
        }
        setServiceStatus("online", "قاعدة البيانات وخدمة الصور متصلتان");
    };

    const showLogin = () => {
        loginPanel.hidden = false;
        editorPanel.hidden = true;
        logoutButton.hidden = true;
    };

    const showEditor = () => {
        loginPanel.hidden = true;
        editorPanel.hidden = false;
        logoutButton.hidden = false;
    };

    const getFieldDescriptors = (documentNode) => {
        const descriptorMap = new Map();
        const selector = "[data-cms-key], [data-cms-list-key], [data-cms-href-key], [data-cms-src-key]";

        for (const element of documentNode.querySelectorAll(selector)) {
            const attributes = [
                ["data-cms-key", "text"],
                ["data-cms-list-key", "list"],
                ["data-cms-href-key", "link"],
                ["data-cms-src-key", "image"]
            ];

            for (const [attribute, type] of attributes) {
                const key = element.getAttribute(attribute);
                if (!key || descriptorMap.has(key)) {
                    continue;
                }

                let value;
                if (type === "list") {
                    value = [...element.children]
                        .map((child) => child.dataset.techName || child.textContent.trim())
                        .filter(Boolean)
                        .join("\n");
                } else if (type === "link") {
                    value = element.getAttribute("href") || "";
                } else if (type === "image") {
                    value = element.getAttribute("src") || "";
                } else {
                    value = element.textContent.trim();
                }

                descriptorMap.set(key, {
                    key,
                    type,
                    group: element.dataset.cmsGroup || "المحتوى",
                    label: element.dataset.cmsLabel || key,
                    multiline: type === "list" || element.tagName === "P",
                    legacyValue: element.dataset.cmsLegacyValue,
                    value
                });
            }
        }

        return [...descriptorMap.values()];
    };

    const buildEditor = async () => {
        const response = await fetch("index.html", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`تعذر قراءة ملفات الموقع (${response.status}).`);
        }

        const html = await response.text();
        const documentNode = new DOMParser().parseFromString(html, "text/html");
        fields = getFieldDescriptors(documentNode);
        if (fields.length === 0) {
            throw new Error("لم يتم العثور على حقول قابلة للتحرير في الصفحة الرئيسية.");
        }

        document.getElementById("fields-count").textContent = fields.length.toLocaleString("ar");
        document.getElementById("groups-count").textContent = new Set(fields.map((field) => field.group)).size.toLocaleString("ar");
        document.getElementById("images-count").textContent = fields.filter((field) => field.type === "image").length.toLocaleString("ar");
        searchResults.textContent = `عرض ${fields.length.toLocaleString("ar")} حقل`;
        fieldsContainer.replaceChildren();
        const groups = new Map();

        for (const field of fields) {
            if (!groups.has(field.group)) {
                groups.set(field.group, []);
            }
            groups.get(field.group).push(field);
        }

        for (const [groupName, groupFields] of groups) {
            const details = document.createElement("details");
            details.className = "editor-group";
            details.open = fieldsContainer.childElementCount === 0;

            const summary = document.createElement("summary");
            summary.textContent = `${groupName} (${groupFields.length})`;
            details.append(summary);

            const groupContainer = document.createElement("div");
            groupContainer.className = "editor-group-fields";

            for (const field of groupFields) {
                const wrapper = document.createElement("div");
                wrapper.className = "editor-field";
                wrapper.dataset.searchText = `${field.label} ${field.key} ${field.group}`.toLocaleLowerCase("ar");

                const label = document.createElement("label");
                label.className = "form-label";
                label.textContent = field.label;
                label.htmlFor = `field-${field.key}`;
                wrapper.append(label);

                const currentValue = Object.hasOwn(content, field.key)
                    && typeof content[field.key] === "string"
                    && content[field.key] !== field.legacyValue
                    ? content[field.key]
                    : field.value;

                if (field.type === "image") {
                    const preview = document.createElement("img");
                    preview.className = "image-current";
                    preview.alt = `معاينة ${field.label}`;
                    preview.hidden = !currentValue;
                    if (currentValue) {
                        preview.src = currentValue;
                    }
                    wrapper.append(preview);

                    const input = document.createElement("input");
                    input.className = "form-control";
                    input.type = "file";
                    input.id = `field-${field.key}`;
                    input.accept = "image/jpeg,image/png,image/webp,image/avif";
                    input.dataset.contentKey = field.key;
                    input.addEventListener("change", () => {
                        const file = input.files?.[0];
                        if (!file) {
                            return;
                        }
                        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
                            input.value = "";
                            setStatus(saveStatus, "نوع الصورة غير مدعوم. اختر JPEG أو PNG أو WebP أو AVIF.");
                            return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                            input.value = "";
                            setStatus(saveStatus, "حجم الصورة يتجاوز الحد المسموح (5 ميغابايت).");
                            return;
                        }

                        selectedFiles.set(field.key, file);
                        clearedImages.delete(field.key);
                        preview.src = URL.createObjectURL(file);
                        preview.hidden = false;
                        setStatus(saveStatus, "الصورة جاهزة للرفع. اضغط «حفظ التعديلات» لنشرها.");
                    });
                    wrapper.append(input);
                    const clearButton = document.createElement("button");
                    clearButton.className = "btn btn-sm btn-outline-light mt-2";
                    clearButton.type = "button";
                    clearButton.textContent = "إزالة الصورة";
                    clearButton.addEventListener("click", () => {
                        selectedFiles.delete(field.key);
                        clearedImages.add(field.key);
                        input.value = "";
                        preview.removeAttribute("src");
                        preview.hidden = true;
                        setStatus(saveStatus, "ستُزال الصورة عند حفظ التعديلات.");
                    });
                    wrapper.append(clearButton);
                    const hint = document.createElement("div");
                    hint.className = "form-text text-secondary";
                    hint.textContent = "JPEG أو PNG أو WebP أو AVIF، بحد أقصى 5 ميغابايت.";
                    wrapper.append(hint);
                } else {
                    const input = document.createElement(field.multiline ? "textarea" : "input");
                    input.className = "form-control";
                    input.id = `field-${field.key}`;
                    input.dataset.contentKey = field.key;
                    if (field.multiline) {
                        input.rows = field.type === "list" ? Math.max(3, currentValue.split(/\r?\n/).length) : 4;
                        input.placeholder = field.type === "list" ? "اكتب عنصرًا واحدًا في كل سطر" : "";
                        wrapper.classList.add("is-wide");
                    } else {
                        input.type = "text";
                        input.dir = field.type === "link" ? "ltr" : "auto";
                    }
                    input.value = currentValue;
                    wrapper.append(input);
                    if (field.type === "link") {
                        const hint = document.createElement("div");
                        hint.className = "form-text text-secondary";
                        hint.textContent = "استخدم رابط https:// أو mailto: أو tel: حسب نوع الرابط.";
                        wrapper.append(hint);
                    }
                }

                groupContainer.append(wrapper);
            }

            details.append(groupContainer);
            fieldsContainer.append(details);
        }
    };

    fieldSearch.addEventListener("input", () => {
        const query = fieldSearch.value.trim().toLocaleLowerCase("ar");
        let visibleCount = 0;

        for (const group of fieldsContainer.children) {
            const visibleFields = [...group.querySelectorAll(".editor-field")].filter((field) => {
                const matches = !query || field.dataset.searchText.includes(query);
                field.hidden = !matches;
                if (matches) {
                    visibleCount += 1;
                }
                return matches;
            });
            group.hidden = visibleFields.length === 0;
            if (query && visibleFields.length > 0) {
                group.open = true;
            }
        }

        searchResults.textContent = `عرض ${visibleCount.toLocaleString("ar")} من ${fields.length.toLocaleString("ar")} حقل`;
        emptySearch.hidden = visibleCount > 0;
    });

    const isAllowedLink = (value) => {
        if (value.startsWith("#")) {
            return true;
        }
        try {
            const url = new URL(value, window.location.href);
            return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol);
        } catch {
            return false;
        }
    };

    const uploadImage = async (file) => {
        const extensionByType = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/avif": "avif"
        };
        const path = `site/${Date.now()}-${crypto.randomUUID()}.${extensionByType[file.type]}`;
        const { error } = await client.storage
            .from("site-images")
            .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

        if (error) {
            throw error;
        }

        const { data } = client.storage.from("site-images").getPublicUrl(path);
        if (!data?.publicUrl) {
            throw new Error("تعذر إنشاء رابط عام للصورة المرفوعة.");
        }
        return data.publicUrl;
    };

    const initializeSession = async (session) => {
        if (!session) {
            showLogin();
            return;
        }

        const { data: adminRecord, error } = await client
            .from("site_admins")
            .select("user_id")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (error) {
            console.error("Could not verify the administrator account.", error);
            setStatus(loginStatus, "تعذر التحقق من صلاحيات الحساب. راجع إعدادات Supabase وحاول مجددًا.");
            showLogin();
            return;
        }
        if (!adminRecord) {
            const userId = session.user.id;
            const { error: signOutError } = await client.auth.signOut();
            if (signOutError) {
                throw signOutError;
            }
            authorizationSql.textContent = `insert into public.site_admins (user_id) values ('${userId}') on conflict (user_id) do nothing;`;
            authorizationHelp.hidden = false;
            setStatus(loginStatus, `تم تسجيل الدخول بحساب Google، لكن الحساب غير مضاف كمدير. معرّف الحساب: ${userId}`);
            showLogin();
            return;
        }

        try {
            const { data, error: contentError } = await client
                .from("site_content")
                .select("content")
                .eq("id", true)
                .maybeSingle();
            if (contentError) {
                throw contentError;
            }
            content = data?.content && typeof data.content === "object" && !Array.isArray(data.content)
                ? data.content
                : {};
            await buildEditor();
            showEditor();
            setStatus(saveStatus, "تم تحميل المحتوى. احفظ التعديلات لنشرها على الموقع.", true);
        } catch (loadError) {
            console.error("Could not load the portfolio editor.", loadError);
            setStatus(loginStatus, "تم التحقق من الحساب، لكن تعذر تحميل المحرر. تأكد من تشغيل إعداد قاعدة البيانات.");
            showLogin();
        }
    };

    const config = window.PORTFOLIO_SUPABASE_CONFIG;
    if (!config?.url || !config?.anonKey) {
        setServiceStatus("offline", "إعداد Supabase غير مكتمل");
        connectionWarning.hidden = false;
        googleLoginButton.disabled = true;
        setStatus(loginStatus, "أكمل إعداد اتصال Supabase أولًا.");
        return;
    }
    if (!window.supabase?.createClient) {
        setServiceStatus("offline", "تعذر تحميل مكتبة Supabase");
        document.getElementById("library-warning").hidden = false;
        googleLoginButton.disabled = true;
        setStatus(loginStatus, "تحقق من اتصال الإنترنت ثم أعد تحميل الصفحة.");
        return;
    }

    try {
        client = window.supabase.createClient(config.url, config.anonKey);
    } catch (error) {
        console.error("Could not initialize the Supabase client.", error);
        setServiceStatus("offline", "تعذر الاتصال بـ Supabase");
        connectionWarning.hidden = false;
        googleLoginButton.disabled = true;
        setStatus(loginStatus, "راجع عنوان Supabase والمفتاح في ملف الإعداد.");
        return;
    }

    setServiceStatus("checking", "جارٍ فحص قاعدة البيانات والصور");
    checkServices().catch((error) => {
        console.error("Could not check Supabase services.", error);
        setServiceStatus("offline", "تعذر فحص خدمات Supabase");
    });

    client.auth.getSession()
        .then(({ data, error }) => {
            if (error) {
                throw error;
            }
            return initializeSession(data.session);
        })
        .catch((error) => {
            console.error("Could not restore the administrator session.", error);
            setStatus(loginStatus, "تعذر استعادة جلسة الدخول. حاول تسجيل الدخول مجددًا.");
            showLogin();
        });

    googleLoginButton.addEventListener("click", async () => {
        googleLoginButton.disabled = true;
        authorizationHelp.hidden = true;
        setStatus(loginStatus, "جارٍ التحويل إلى Google...");
        try {
            const redirectTo = new URL(window.location.pathname, window.location.origin).href;
            const { error } = await client.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo }
            });
            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Google administrator sign-in failed.", error);
            const message = error instanceof Error ? error.message : "";
            setStatus(loginStatus, /unsupported provider|provider is not enabled/i.test(message)
                ? "خدمة Google غير مفعّلة في Supabase. فعّل Google Provider وأضف بيانات OAuth قبل تسجيل الدخول."
                : "تعذر بدء تسجيل الدخول عبر Google. تحقق من إعداد Google Provider وRedirect URLs في Supabase.");
        } finally {
            googleLoginButton.disabled = false;
        }
    });

    document.getElementById("copy-authorization").addEventListener("click", async (event) => {
        const copyButton = event.currentTarget;
        try {
            await navigator.clipboard.writeText(authorizationSql.textContent);
            copyButton.textContent = "تم نسخ الأمر";
        } catch (error) {
            console.error("Could not copy the administrator authorization query.", error);
            setStatus(loginStatus, "تعذر النسخ تلقائيًا؛ حدّد أمر SQL وانسخه يدويًا.");
        }
    });

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        try {
            const { error } = await client.auth.signOut();
            if (error) {
                throw error;
            }
            selectedFiles.clear();
            content = {};
            showLogin();
            setStatus(loginStatus, "تم تسجيل الخروج.", true);
        } catch (error) {
            console.error("Administrator sign-out failed.", error);
            setStatus(saveStatus, "تعذر تسجيل الخروج. حاول مجددًا.");
        } finally {
            logoutButton.disabled = false;
        }
    });

    contentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        saveButton.disabled = true;
        setStatus(saveStatus, "جارٍ حفظ التعديلات...");

        try {
            const updatedContent = { ...content };
            for (const field of fields) {
                if (field.type === "image") {
                    if (clearedImages.has(field.key)) {
                        updatedContent[field.key] = "";
                    }
                    continue;
                }
                const input = [...contentForm.querySelectorAll("[data-content-key]")]
                    .find((candidate) => candidate.dataset.contentKey === field.key);
                const value = input.value.trim();
                if (field.type === "link" && value && !isAllowedLink(value)) {
                    input.focus();
                    throw new Error(`الرابط في حقل «${field.label}» غير صالح أو يستخدم نوعًا غير مسموح.`);
                }
                updatedContent[field.key] = value;
            }

            for (const [key, file] of selectedFiles) {
                updatedContent[key] = await uploadImage(file);
            }

            const { error } = await client
                .from("site_content")
                .upsert({
                    id: true,
                    content: updatedContent,
                    updated_at: new Date().toISOString()
                }, { onConflict: "id" });

            if (error) {
                throw error;
            }

            content = updatedContent;
            selectedFiles.clear();
            clearedImages.clear();
            setStatus(saveStatus, "تم حفظ التعديلات بنجاح. حدّث الموقع لمعاينة النسخة المنشورة.", true);
        } catch (error) {
            console.error("Could not save portfolio changes.", error);
            setStatus(saveStatus, error instanceof Error && error.message.startsWith("الرابط في حقل")
                ? error.message
                : "تعذر حفظ التعديلات. تحقق من الاتصال وسياسات قاعدة البيانات ثم حاول مجددًا.");
        } finally {
            saveButton.disabled = false;
        }
    });
})();
