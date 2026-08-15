document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       ANAS AI — PREMIUM CHAT CONTROLLER
       FULL REPLACEMENT VERSION
       ========================================================= */

    "use strict";


    /* =========================================================
       DOM ELEMENTS
       ========================================================= */

    const input =
        document.getElementById("messageInput");

    const sendButton =
        document.getElementById("sendBtn");

    const voiceButton =
        document.getElementById("voiceBtn");

    const messages =
        document.getElementById("messages");


    const imageInput =
        document.getElementById("imageInput");

    const attachButton =
        document.getElementById("attachBtn");

    const imagePreview =
        document.getElementById("imagePreview");

    const previewImage =
        document.getElementById("previewImage");

    const removeImageBtn =
        document.getElementById("removeImageBtn");


    const newChatBtn =
        document.getElementById("newChatBtn");

    const headerNewChat =
        document.getElementById("headerNewChat");


    const searchChats =
        document.getElementById("searchChats");

    const chatHistory =
        document.getElementById("chatHistory");


    const themeBtn =
        document.getElementById("themeBtn");

    const settingsBtn =
        document.getElementById("settingsBtn");


    const mobileMenu =
        document.getElementById("mobileMenu");

    const sidebar =
        document.getElementById("sidebar");


    const voicePanel =
        document.getElementById("voicePanel");

    const voiceMainBtn =
        document.getElementById("voiceMainBtn");

    const voiceMuteBtn =
        document.getElementById("voiceMuteBtn");

    const voiceCloseBtn =
        document.getElementById("voiceCloseBtn");


    const voiceState =
        document.getElementById("voiceState");

    const voiceSubtitle =
        document.getElementById("voiceSubtitle");

    const voiceOrb =
        document.getElementById("voiceOrb");


    const connectionStatus =
        document.getElementById("connectionStatus");


    /* =========================================================
       REQUIRED ELEMENT CHECK
       ========================================================= */

    if (!input || !sendButton || !messages) {

        console.error(
            "Anas AI: Required chat elements are missing."
        );

        return;
    }


    /* =========================================================
       USER
       ========================================================= */

    const anasUser =
        window.anasAIUser || {};


    const currentUsername =
        anasUser.username || "User";


    const currentPlan =
        anasUser.plan || "Free";


    /* =========================================================
       CONSTANTS
       ========================================================= */

    const STORAGE_KEY =
        "anasAI_chats";

    const THEME_KEY =
        "anasAI_theme";

    const MAX_IMAGE_SIZE =
        10 * 1024 * 1024;


    /* =========================================================
       STATE
       ========================================================= */

    let selectedImage = null;

    let recognition = null;

    let isListening = false;

    let isSpeaking = false;

    let voiceMode = false;

    let microphoneMuted = false;

    let recognitionStarting = false;

    let currentChatId = null;

    let chats = [];


    /* =========================================================
       LOCAL STORAGE
       ========================================================= */

    function loadChats() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!saved) {

                return [];
            }


            const parsed =
                JSON.parse(saved);


            if (!Array.isArray(parsed)) {

                return [];
            }


            return parsed;

        }
        catch (error) {

            console.error(
                "Anas AI: Chat history load failed:",
                error
            );

            return [];
        }
    }


    function saveChats() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(chats)
            );

        }
        catch (error) {

            console.error(
                "Anas AI: Chat history save failed:",
                error
            );
        }
    }


    /*
       IMPORTANT:
       STORAGE_KEY is declared BEFORE this call.
    */

    chats = loadChats();


    /* =========================================================
       UTILITY
       ========================================================= */

    function escapeHTML(text) {

        return String(text ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function createChatId() {

        return (
            "chat_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }


    function createTitle(text) {

        const clean =
            String(text || "")
                .replace(/\s+/g, " ")
                .trim();


        if (!clean) {

            return "New conversation";
        }


        return clean.length > 45
            ? clean.substring(0, 45) + "..."
            : clean;
    }


    function formatTime(date) {

        try {

            return new Date(date)
                .toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        }
        catch {

            return "";
        }
    }


    /* =========================================================
       CHAT CREATION
       ========================================================= */

    function createChat(
        title = "New conversation"
    ) {

        const now =
            new Date().toISOString();


        const chat = {

            id: createChatId(),

            title:
                title || "New conversation",

            createdAt: now,

            updatedAt: now,

            messages: []
        };


        chats.unshift(chat);

        saveChats();

        return chat;
    }


    function getCurrentChat() {

        if (!currentChatId) {

            return null;
        }


        return chats.find(
            chat =>
                chat.id === currentChatId
        ) || null;
    }


    function ensureCurrentChat(title) {

        let chat =
            getCurrentChat();


        if (!chat) {

            chat =
                createChat(
                    title ||
                    "New conversation"
                );


            currentChatId =
                chat.id;
        }


        return chat;
    }


    /* =========================================================
       HISTORY RENDER
       ========================================================= */

    function renderChatHistory() {

        if (!chatHistory) {

            return;
        }


        chatHistory
            .querySelectorAll(
                ".history-item"
            )
            .forEach(
                item => item.remove()
            );


        chatHistory
            .querySelectorAll(
                ".history-empty"
            )
            .forEach(
                item => item.remove()
            );


        const sortedChats =
            [...chats].sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.updatedAt ||
                            a.createdAt
                        );

                    const dateB =
                        new Date(
                            b.updatedAt ||
                            b.createdAt
                        );

                    return dateB - dateA;
                }
            );


        if (!sortedChats.length) {

            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "history-empty";


            empty.innerHTML = `
                <div style="
                    padding:24px 15px;
                    text-align:center;
                    color:#7d8798;
                ">
                    <div style="
                        font-size:26px;
                        margin-bottom:8px;
                    ">💬</div>

                    <div style="
                        font-size:12px;
                    ">
                        No conversations yet
                    </div>
                </div>
            `;


            chatHistory.appendChild(
                empty
            );


            return;
        }


        sortedChats.forEach(
            chat => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "history-item";


                button.dataset.chatId =
                    chat.id;


                if (
                    chat.id ===
                    currentChatId
                ) {

                    button.classList.add(
                        "active"
                    );
                }


                button.innerHTML = `

                    <span class="history-icon">
                        💬
                    </span>

                    <span class="history-content">

                        <span class="history-title">
                            ${escapeHTML(
                                chat.title ||
                                "New conversation"
                            )}
                        </span>

                        <span style="
                            display:block;
                            margin-top:3px;
                            font-size:10px;
                            opacity:.55;
                        ">
                            ${formatTime(
                                chat.updatedAt ||
                                chat.createdAt
                            )}
                        </span>

                    </span>

                `;


                button.addEventListener(
                    "click",
                    () => {

                        loadChat(
                            chat.id
                        );

                        closeMobileSidebar();
                    }
                );


                chatHistory.appendChild(
                    button
                );

            }
        );
    }


    /* =========================================================
       LOAD CHAT
       ========================================================= */

    function loadChat(chatId) {

        const chat =
            chats.find(
                item =>
                    item.id === chatId
            );


        if (!chat) {

            return;
        }


        stopVoiceCompletely();

        clearSelectedImage();


        currentChatId =
            chat.id;


        messages.innerHTML =
            "";


        if (
            !Array.isArray(
                chat.messages
            ) ||
            !chat.messages.length
        ) {

            messages.appendChild(
                createWelcomeScreen()
            );

        }
        else {

            chat.messages.forEach(
                message => {

                    renderStoredMessage(
                        message
                    );
                }
            );
        }


        renderChatHistory();

        scrollToBottom();
    }


    function renderStoredMessage(
        message
    ) {

        const text =
            message.text || "";


        if (
            message.imageData
        ) {

            renderImageMessage(
                message
            );

            return;
        }


        addMessage(
            text,
            message.type || "ai",
            false
        );
    }


    /* =========================================================
       WELCOME SCREEN
       ========================================================= */

    function createWelcomeScreen() {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "welcome-screen";


        wrapper.id =
            "welcomeScreen";


        wrapper.innerHTML = `

            <div class="welcome-logo">
                A
            </div>

            <div style="
                display:inline-flex;
                align-items:center;
                gap:7px;
                padding:6px 12px;
                border-radius:999px;
                background:rgba(16,163,127,.10);
                border:1px solid rgba(16,163,127,.20);
                color:#10a37f;
                font-size:11px;
                font-weight:700;
                margin-bottom:14px;
            ">
                ✨ ANAS AI
            </div>

            <h1>
                How can I help you today?
            </h1>

            <p>
                Ask Anas AI anything —
                coding, questions, writing,
                learning, image analysis and more.
            </p>


            <div class="suggestions">

                <button
                    class="suggestion"
                    type="button">

                    <span>💡</span>

                    <div>
                        <strong>
                            Explain something
                        </strong>

                        <small>
                            Learn a difficult topic simply
                        </small>
                    </div>

                </button>


                <button
                    class="suggestion"
                    type="button">

                    <span>💻</span>

                    <div>
                        <strong>
                            Help me code
                        </strong>

                        <small>
                            Build or debug my project
                        </small>
                    </div>

                </button>


                <button
                    class="suggestion"
                    type="button">

                    <span>📝</span>

                    <div>
                        <strong>
                            Write something
                        </strong>

                        <small>
                            Create text and ideas
                        </small>
                    </div>

                </button>


                <button
                    class="suggestion"
                    type="button">

                    <span>🌐</span>

                    <div>
                        <strong>
                            Translate
                        </strong>

                        <small>
                            Translate text between languages
                        </small>
                    </div>

                </button>


                <button
                    class="suggestion"
                    type="button">

                    <span>📷</span>

                    <div>
                        <strong>
                            Analyze an image
                        </strong>

                        <small>
                            Upload an image and ask questions
                        </small>
                    </div>

                </button>


                <button
                    class="suggestion"
                    type="button">

                    <span>🎨</span>

                    <div>
                        <strong>
                            Generate an image
                        </strong>

                        <small>
                            Create an image from a prompt
                        </small>
                    </div>

                </button>

            </div>

        `;


        attachSuggestionHandlers(
            wrapper
        );


        return wrapper;
    }


    function attachSuggestionHandlers(
        root
    ) {

        root.querySelectorAll(
            ".suggestion"
        ).forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const title =
                            button
                                .querySelector(
                                    "strong"
                                )
                                ?.textContent
                                .trim();


                        const prompts = {

                            "Explain something":
                                "Explain a difficult topic to me simply.",

                            "Help me code":
                                "Help me code and debug my project.",

                            "Write something":
                                "Help me write something.",

                            "Translate":
                                "Translate the following text.",

                            "Analyze an image":
                                "Analyze this image.",

                            "Generate an image":
                                "Generate image: "
                        };


                        input.value =
                            prompts[title] ||
                            title ||
                            "";


                        input.focus();

                        resizeInput();

                    }
                );
            }
        );
    }


    /* =========================================================
       MESSAGE FORMAT
       ========================================================= */

    function formatAIMessage(
        text
    ) {

        let html =
            escapeHTML(text);


        html =
            html.replace(
                /```([\s\S]*?)```/g,
                (match, code) => {

                    return `
                        <pre class="ai-code"><code>${code.trim()}</code></pre>
                    `;
                }
            );


        html =
            html.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );


        html =
            html.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );


        html =
            html.replace(
                /\*(.*?)\*/g,
                "<em>$1</em>"
            );


        html =
            html.replace(
                /\n/g,
                "<br>"
            );


        return html;
    }


    /* =========================================================
       ADD MESSAGE
       ========================================================= */

    function addMessage(
        text,
        type,
        save = true
    ) {

        const message =
            document.createElement(
                "div"
            );


        message.className =
            `message ${type}`;


        if (type === "ai") {

            message.innerHTML =
                formatAIMessage(
                    text
                );

        }
        else {

            message.textContent =
                text;
        }


        messages.appendChild(
            message
        );


        scrollToBottom();


        if (save) {

            const chat =
                ensureCurrentChat(
                    type === "user"
                        ? createTitle(text)
                        : "New conversation"
                );


            if (
                type === "user" &&
                chat.messages.length === 0
            ) {

                chat.title =
                    createTitle(text);
            }


            chat.messages.push({

                type,

                text:
                    String(text || ""),

                time:
                    new Date()
                        .toISOString()
            });


            chat.updatedAt =
                new Date()
                    .toISOString();


            saveChats();

            renderChatHistory();
        }


        return message;
    }


    /* =========================================================
       IMAGE MESSAGE
       ========================================================= */

    function renderImageMessage(
        message
    ) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            "message user image-message";


        wrapper.innerHTML = `

            <div>

                ${
                    message.text
                        ? `
                            <div style="
                                margin-bottom:10px;
                            ">
                                ${escapeHTML(
                                    message.text
                                )}
                            </div>
                        `
                        : ""
                }

                ${
                    message.imageData
                        ? `
                            <img
                                src="${message.imageData}"
                                alt="Uploaded image"
                                style="
                                    display:block;
                                    max-width:min(100%,520px);
                                    width:auto;
                                    max-height:500px;
                                    object-fit:contain;
                                    border-radius:16px;
                                    border:1px solid rgba(255,255,255,.12);
                                "
                            >
                        `
                        : ""
                }

            </div>
        `;


        messages.appendChild(
            wrapper
        );


        scrollToBottom();
    }


    /* =========================================================
       SCROLL
       ========================================================= */

    function scrollToBottom() {

        requestAnimationFrame(
            () => {

                messages.scrollTop =
                    messages.scrollHeight;
            }
        );
    }


    function hideWelcomeScreen() {

        const welcome =
            document.getElementById(
                "welcomeScreen"
            );


        if (welcome) {

            welcome.remove();
        }
    }


    /* =========================================================
       NEW CHAT
       ========================================================= */

    function startNewChat() {

        stopVoiceCompletely();

        clearSelectedImage();


        input.value =
            "";

        input.style.height =
            "auto";


        currentChatId =
            null;


        messages.innerHTML =
            "";


        messages.appendChild(
            createWelcomeScreen()
        );


        renderChatHistory();

        closeMobileSidebar();

        input.focus();
    }


    if (newChatBtn) {

        newChatBtn.addEventListener(
            "click",
            startNewChat
        );
    }


    if (headerNewChat) {

        headerNewChat.addEventListener(
            "click",
            startNewChat
        );
    }


    /* =========================================================
       SEND MESSAGE
       ========================================================= */

    async function sendMessage(
        text = null,
        speakResponse = false
    ) {

        const messageText =
            text !== null
                ? String(text).trim()
                : input.value.trim();


        if (
            !messageText &&
            !selectedImage
        ) {

            return;
        }


        /*
           IMAGE UPLOAD
        */

        if (selectedImage) {

            await sendImageMessage(
                messageText
            );

            return;
        }


        /*
           IMAGE GENERATION COMMAND
        */

        if (
            detectImageCommand(
                messageText
            )
        ) {

            input.value = "";

            input.style.height =
                "auto";

            return;
        }


        hideWelcomeScreen();


        addMessage(
            messageText,
            "user"
        );


        input.value =
            "";

        input.style.height =
            "auto";


        const loading =
            document.createElement(
                "div"
            );


        loading.className =
            "message ai";


        loading.innerHTML = `
            <span class="anas-thinking">
                <span>●</span>
                <span>●</span>
                <span>●</span>
                Anas AI is thinking...
            </span>
        `;


        messages.appendChild(
            loading
        );


        scrollToBottom();


        if (voiceMode) {

            setVoiceState(
                "Thinking",
                "Anas AI is processing your request..."
            );
        }


        try {

            const response =
                await fetch(
                    "/api/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                message:
                                    messageText
                            })
                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            let data;


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            }
            else {

                const textResponse =
                    await response.text();


                throw new Error(
                    textResponse ||
                    "Invalid server response."
                );
            }


            loading.remove();


            if (!response.ok) {

                addMessage(
                    data.error ||
                    data.message ||
                    "Something went wrong.",
                    "ai"
                );

                return;
            }


            const answer =
                data.response ||
                data.message ||
                "I couldn't generate a response.";


            addMessage(
                answer,
                "ai"
            );


            if (
                speakResponse ||
                voiceMode
            ) {

                await speakText(
                    answer
                );
            }


            if (voiceMode) {

                scheduleVoiceRestart();
            }

        }
        catch (error) {

            console.error(
                "Anas AI connection error:",
                error
            );


            loading.remove();


            addMessage(
                "Sorry, I couldn't connect to Anas AI. Please check your server or API connection.",
                "ai"
            );


            if (voiceMode) {

                setVoiceState(
                    "Connection error",
                    "Please try again."
                );
            }
        }
    }


    /* =========================================================
       SEND BUTTON
       ========================================================= */

    sendButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            sendMessage();
        }
    );


    /* =========================================================
       ENTER
       ========================================================= */

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );


    /* =========================================================
       INPUT RESIZE
       ========================================================= */

    function resizeInput() {

        input.style.height =
            "auto";


        input.style.height =
            Math.min(
                input.scrollHeight,
                180
            ) + "px";
    }


    input.addEventListener(
        "input",
        resizeInput
    );


    /* =========================================================
       IMAGE PICKER
       ========================================================= */

    if (
        attachButton &&
        imageInput
    ) {

        attachButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                imageInput.click();
            }
        );


        imageInput.addEventListener(
            "change",
            () => {

                const file =
                    imageInput.files?.[0];


                if (!file) {

                    return;
                }


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    alert(
                        "Please select a valid image."
                    );


                    clearSelectedImage();

                    return;
                }


                if (
                    file.size >
                    MAX_IMAGE_SIZE
                ) {

                    alert(
                        "Image is too large. Maximum size is 10 MB."
                    );


                    clearSelectedImage();

                    return;
                }


                selectedImage =
                    file;


                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        if (previewImage) {

                            previewImage.src =
                                event.target.result;
                        }


                        if (imagePreview) {

                            imagePreview.style.display =
                                "block";
                        }
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    function clearSelectedImage() {

        selectedImage =
            null;


        if (imageInput) {

            imageInput.value =
                "";
        }


        if (previewImage) {

            previewImage.src =
                "";
        }


        if (imagePreview) {

            imagePreview.style.display =
                "none";
        }
    }


    if (removeImageBtn) {

        removeImageBtn.addEventListener(
            "click",
            clearSelectedImage
        );
    }


    /* =========================================================
       IMAGE ANALYSIS
       ========================================================= */

    async function sendImageMessage(
        question
    ) {

        if (!selectedImage) {

            return;
        }


        const imageFile =
            selectedImage;


        const userText =
            question ||
            "Analyze this image carefully and answer my question.";


        hideWelcomeScreen();


        /*
           Convert image to Data URL
           so it can be restored locally.
        */

        let localImageData =
            null;


        try {

            localImageData =
                await fileToBase64(
                    imageFile
                );

        }
        catch (error) {

            console.error(
                "Image read error:",
                error
            );

            addMessage(
                "Could not read the selected image.",
                "ai"
            );

            clearSelectedImage();

            return;
        }


        /*
           Render user image
        */

        const userImageMessage =
            {
                type: "user",

                text: userText,

                imageData:
                    localImageData,

                mimeType:
                    imageFile.type,

                time:
                    new Date()
                        .toISOString()
            };


        const chat =
            ensureCurrentChat(
                createTitle(
                    userText
                )
            );


        if (
            chat.messages.length === 0
        ) {

            chat.title =
                createTitle(
                    userText
                );
        }


        chat.messages.push(
            userImageMessage
        );


        chat.updatedAt =
            new Date()
                .toISOString();


        saveChats();

        renderChatHistory();


        renderImageMessage(
            userImageMessage
        );


        clearSelectedImage();


        input.value =
            "";

        input.style.height =
            "auto";


        const loading =
            document.createElement(
                "div"
            );


        loading.className =
            "message ai";


        loading.innerHTML = `
            <span class="anas-thinking">
                📷 Anas AI is analyzing your image...
            </span>
        `;


        messages.appendChild(
            loading
        );


        scrollToBottom();


        try {

            /*
               Remove Data URL prefix.
            */

            const imageBase64 =
                localImageData
                    .split(",")[1];


            console.log(
                "Anas AI Image:",
                {
                    size:
                        imageBase64?.length ||
                        0,

                    mimeType:
                        imageFile.type
                }
            );


            const response =
                await fetch(
                    "/api/chat/image",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                message:
                                    userText,

                                imageBase64:
                                    imageBase64,

                                mimeType:
                                    imageFile.type

                            })
                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            let data;


            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                data =
                    await response.json();

            }
            else {

                const serverText =
                    await response.text();


                throw new Error(
                    serverText ||
                    "Invalid image API response."
                );
            }


            loading.remove();


            if (!response.ok) {

                addMessage(
                    data.error ||
                    data.message ||
                    "Image analysis failed.",
                    "ai"
                );

                return;
            }


            const answer =
                data.response ||
                data.message ||
                "I couldn't analyze this image.";


            addMessage(
                answer,
                "ai"
            );


            if (voiceMode) {

                await speakText(
                    answer
                );
            }

        }
        catch (error) {

            console.error(
                "Image analysis error:",
                error
            );


            loading.remove();


            addMessage(
                "Sorry, I couldn't analyze this image. Please check your image API endpoint.",
                "ai"
            );
        }
    }


    function fileToBase64(
        file
    ) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        resolve(
                            reader.result
                        );
                    };


                reader.onerror =
                    () => {

                        reject(
                            new Error(
                                "Could not read image."
                            )
                        );
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    /* =========================================================
       IMAGE GENERATION
       ========================================================= */

    async function generateImage(
        prompt
    ) {

        const cleanPrompt =
            String(prompt || "")
                .trim();


        if (!cleanPrompt) {

            return;
        }


        hideWelcomeScreen();


        addMessage(
            "🎨 Generate image: " +
            cleanPrompt,
            "user"
        );


        const loading =
            document.createElement(
                "div"
            );


        loading.className =
            "message ai";


        loading.innerHTML = `
            <span class="anas-thinking">
                🎨 Anas AI is generating your image...
            </span>
        `;


        messages.appendChild(
            loading
        );


        scrollToBottom();


        try {

            const response =
                await fetch(
                    "/api/chat/generate-image",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                prompt:
                                    cleanPrompt
                            })
                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                !contentType.includes(
                    "application/json"
                )
            ) {

                throw new Error(
                    await response.text()
                );
            }


            const data =
                await response.json();


            loading.remove();


            if (!response.ok) {

                addMessage(
                    data.error ||
                    "Image generation failed.",
                    "ai"
                );

                return;
            }


            if (!data.imageBase64) {

                addMessage(
                    "Image server did not return an image.",
                    "ai"
                );

                console.error(
                    "Image response:",
                    data
                );

                return;
            }


            const mimeType =
                data.mimeType ||
                "image/png";


            const imageDataUrl =
                `data:${mimeType};base64,${data.imageBase64}`;


            const wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "message ai image-result";


            wrapper.innerHTML = `

                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:14px;
                    width:min(100%,720px);
                ">

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:9px;
                        font-weight:800;
                    ">

                        <span style="
                            width:30px;
                            height:30px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            border-radius:9px;
                            background:rgba(16,163,127,.12);
                        ">
                            🎨
                        </span>

                        Generated Image

                    </div>


                    <img
                        src="${imageDataUrl}"
                        alt="Generated image"
                        style="
                            width:100%;
                            max-width:720px;
                            border-radius:18px;
                            display:block;
                            border:1px solid rgba(255,255,255,.10);
                            box-shadow:0 20px 60px rgba(0,0,0,.25);
                        "
                    >


                    <a
                        href="${imageDataUrl}"
                        download="anas-ai-generated.png"
                        style="
                            display:inline-flex;
                            align-items:center;
                            justify-content:center;
                            width:max-content;
                            padding:10px 15px;
                            border-radius:11px;
                            background:#10a37f;
                            color:white;
                            text-decoration:none;
                            font-size:13px;
                            font-weight:800;
                            transition:.2s;
                        "
                    >
                        ⬇ Save Image
                    </a>

                </div>
            `;


            messages.appendChild(
                wrapper
            );


            scrollToBottom();


            console.log(
                "Anas AI: Image generated successfully."
            );

        }
        catch (error) {

            console.error(
                "Image generation error:",
                error
            );


            loading.remove();


            addMessage(
                "❌ Image generation failed. Please try again.",
                "ai"
            );
        }
    }


    /* =========================================================
       IMAGE COMMAND DETECTION
       ========================================================= */

    function detectImageCommand(
        text
    ) {

        const value =
            String(text || "")
                .trim();


        if (!value) {

            return false;
        }


        const lower =
            value.toLowerCase();


        const prefixes = [
            "generate image:",
            "create image:",
            "make image:",
            "/image "
        ];


        for (
            const prefix of prefixes
        ) {

            if (
                lower.startsWith(
                    prefix
                )
            ) {

                const prompt =
                    value
                        .substring(
                            prefix.length
                        )
                        .trim();


                if (prompt) {

                    generateImage(
                        prompt
                    );


                    return true;
                }
            }
        }


        return false;
    }


    /* =========================================================
       TEXT TO SPEECH
       ========================================================= */

    function speakText(
        text
    ) {

        if (
            !("speechSynthesis" in window)
        ) {

            return Promise.resolve();
        }


        return new Promise(
            resolve => {

                window.speechSynthesis
                    .cancel();


                const utterance =
                    new SpeechSynthesisUtterance(
                        String(text || "")
                    );


                utterance.lang =
                    "en-US";


                utterance.rate =
                    1;


                utterance.pitch =
                    1;


                utterance.volume =
                    1;


                isSpeaking =
                    true;


                setVoiceState(
                    "Speaking",
                    "Anas AI is speaking..."
                );


                utterance.onend =
                    () => {

                        isSpeaking =
                            false;


                        if (voiceMode) {

                            setVoiceState(
                                "Ready",
                                "Listening for your next message..."
                            );
                        }


                        resolve();
                    };


                utterance.onerror =
                    () => {

                        isSpeaking =
                            false;

                        resolve();
                    };


                window.speechSynthesis
                    .speak(
                        utterance
                    );
            }
        );
    }


    /* =========================================================
       SPEECH RECOGNITION
       ========================================================= */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (SpeechRecognition) {

        recognition =
            new SpeechRecognition();


        recognition.continuous =
            false;


        recognition.interimResults =
            true;


        recognition.lang =
            "en-US";


        recognition.onstart =
            () => {

                recognitionStarting =
                    false;


                isListening =
                    true;


                if (voiceButton) {

                    voiceButton.textContent =
                        "🔴";


                    voiceButton.classList
                        .add("active");
                }


                setVoiceState(
                    "Listening",
                    "Speak now..."
                );
            };


        recognition.onresult =
            async event => {

                let transcript =
                    "";


                for (
                    let i =
                        event.resultIndex;

                    i <
                    event.results.length;

                    i++
                ) {

                    transcript +=
                        event.results[i][0]
                            .transcript;
                }


                input.value =
                    transcript;


                resizeInput();


                const lastResult =
                    event.results[
                        event.results.length - 1
                    ];


                if (
                    lastResult &&
                    lastResult.isFinal
                ) {

                    const finalText =
                        transcript.trim();


                    if (!finalText) {

                        return;
                    }


                    await sendMessage(
                        finalText,
                        true
                    );
                }
            };


        recognition.onerror =
            event => {

                recognitionStarting =
                    false;


                isListening =
                    false;


                console.error(
                    "Voice error:",
                    event.error
                );


                if (
                    event.error ===
                    "not-allowed"
                ) {

                    setVoiceState(
                        "Microphone blocked",
                        "Allow microphone permission in your browser."
                    );

                    return;
                }


                if (
                    event.error ===
                    "no-speech"
                ) {

                    setVoiceState(
                        "Ready",
                        "No speech detected. Try again."
                    );

                    return;
                }


                setVoiceState(
                    "Voice error",
                    "Please try again."
                );
            };


        recognition.onend =
            () => {

                recognitionStarting =
                    false;


                isListening =
                    false;


                if (voiceButton) {

                    voiceButton.classList
                        .remove("active");


                    voiceButton.textContent =
                        voiceMode
                            ? "🔴"
                            : "🎙️";
                }


                if (
                    voiceMode &&
                    !isSpeaking &&
                    !microphoneMuted
                ) {

                    setVoiceState(
                        "Ready",
                        "Listening for your next message..."
                    );
                }
            };

    }
    else {

        console.warn(
            "Anas AI: Speech Recognition unsupported."
        );
    }


    /* =========================================================
       VOICE
       ========================================================= */

    function startListening() {

        if (!recognition) {

            setVoiceState(
                "Unsupported",
                "Your browser does not support voice recognition."
            );

            return;
        }


        if (
            isListening ||
            isSpeaking ||
            microphoneMuted ||
            recognitionStarting
        ) {

            return;
        }


        try {

            recognitionStarting =
                true;


            recognition.start();

        }
        catch (error) {

            recognitionStarting =
                false;


            console.warn(
                "Recognition could not start:",
                error
            );
        }
    }


    function stopListening() {

        if (!recognition) {

            return;
        }


        try {

            recognition.stop();

        }
        catch (_) {}


        isListening =
            false;


        recognitionStarting =
            false;
    }


    function scheduleVoiceRestart() {

        if (
            !voiceMode ||
            microphoneMuted ||
            isListening ||
            isSpeaking
        ) {

            return;
        }


        setTimeout(
            () => {

                if (
                    voiceMode &&
                    !microphoneMuted &&
                    !isListening &&
                    !isSpeaking
                ) {

                    startListening();
                }

            },
            700
        );
    }


    function stopVoiceCompletely() {

        voiceMode =
            false;


        stopListening();


        if (
            "speechSynthesis" in window
        ) {

            window.speechSynthesis
                .cancel();
        }


        isSpeaking =
            false;


        recognitionStarting =
            false;


        if (voiceButton) {

            voiceButton.textContent =
                "🎙️";


            voiceButton.classList
                .remove("active");


            voiceButton.title =
                "Open Live Voice Mode";
        }


        setVoiceState(
            "Ready",
            "Tap the microphone to talk to Anas AI"
        );


        closeVoicePanel();
    }


    /* =========================================================
       VOICE BUTTON
       ========================================================= */

    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            () => {

                if (voiceMode) {

                    stopVoiceCompletely();

                    return;
                }


                voiceMode =
                    true;


                microphoneMuted =
                    false;


                openVoicePanel();


                voiceButton.textContent =
                    "🔴";


                voiceButton.title =
                    "Stop Voice Assistant";


                voiceButton.classList
                    .add("active");


                setVoiceState(
                    "Starting",
                    "Starting Anas AI voice assistant..."
                );


                startListening();
            }
        );
    }


    /* =========================================================
       VOICE PANEL
       ========================================================= */

    function openVoicePanel() {

        if (!voicePanel) {

            return;
        }


        voicePanel.setAttribute(
            "aria-hidden",
            "false"
        );


        voicePanel.classList.add(
            "active"
        );
    }


    function closeVoicePanel() {

        if (!voicePanel) {

            return;
        }


        voicePanel.setAttribute(
            "aria-hidden",
            "true"
        );


        voicePanel.classList.remove(
            "active"
        );
    }


    function setVoiceState(
        state,
        subtitle
    ) {

        if (voiceState) {

            voiceState.textContent =
                state;
        }


        if (voiceSubtitle) {

            voiceSubtitle.textContent =
                subtitle;
        }


        if (voiceOrb) {

            voiceOrb.classList.toggle(
                "active",
                state === "Listening" ||
                state === "Speaking"
            );
        }
    }


    if (voiceMainBtn) {

        voiceMainBtn.addEventListener(
            "click",
            () => {

                if (!voiceMode) {

                    voiceMode =
                        true;


                    microphoneMuted =
                        false;


                    openVoicePanel();

                    startListening();

                    return;
                }


                if (isListening) {

                    stopListening();


                    setVoiceState(
                        "Paused",
                        "Microphone paused."
                    );

                }
                else {

                    startListening();
                }
            }
        );
    }


    if (voiceMuteBtn) {

        voiceMuteBtn.addEventListener(
            "click",
            () => {

                microphoneMuted =
                    !microphoneMuted;


                if (
                    microphoneMuted
                ) {

                    stopListening();


                    voiceMuteBtn.textContent =
                        "🔇";


                    setVoiceState(
                        "Muted",
                        "Microphone is muted."
                    );

                }
                else {

                    voiceMuteBtn.textContent =
                        "🎤";


                    setVoiceState(
                        "Ready",
                        "Microphone is active."
                    );


                    if (voiceMode) {

                        startListening();
                    }
                }
            }
        );
    }


    if (voiceCloseBtn) {

        voiceCloseBtn.addEventListener(
            "click",
            stopVoiceCompletely
        );
    }


    /* =========================================================
       MOBILE SIDEBAR
       ========================================================= */

    function openMobileSidebar() {

        if (!sidebar) {

            return;
        }


        sidebar.classList.add(
            "open"
        );


        document.body.classList.add(
            "sidebar-open"
        );
    }


    function closeMobileSidebar() {

        if (!sidebar) {

            return;
        }


        sidebar.classList.remove(
            "open"
        );


        document.body.classList.remove(
            "sidebar-open"
        );
    }


    if (mobileMenu) {

        mobileMenu.addEventListener(
            "click",
            () => {

                sidebar.classList.contains(
                    "open"
                )
                    ? closeMobileSidebar()
                    : openMobileSidebar();
            }
        );
    }


    /* =========================================================
       SEARCH CHATS
       ========================================================= */

    if (searchChats) {

        searchChats.addEventListener(
            "input",
            () => {

                const query =
                    searchChats.value
                        .trim()
                        .toLowerCase();


                chatHistory
                    ?.querySelectorAll(
                        ".history-item"
                    )
                    .forEach(
                        item => {

                            const title =
                                item
                                    .querySelector(
                                        ".history-title"
                                    )
                                    ?.textContent
                                    .toLowerCase()
                                    || "";


                            item.style.display =
                                !query ||
                                title.includes(
                                    query
                                )
                                    ? ""
                                    : "none";
                        }
                    );
            }
        );
    }


    /* =========================================================
       THEME
       ========================================================= */

    function applyTheme(
        theme
    ) {

        if (
            theme !== "light" &&
            theme !== "dark"
        ) {

            theme =
                "dark";
        }


        document.documentElement
            .setAttribute(
                "data-theme",
                theme
            );


        localStorage.setItem(
            THEME_KEY,
            theme
        );


        updateThemeButton(
            theme
        );
    }


    function updateThemeButton(
        theme
    ) {

        if (!themeBtn) {

            return;
        }


        const label =
            themeBtn.querySelector(
                "span:last-child"
            );


        const icon =
            themeBtn.querySelector(
                "span:first-child"
            );


        if (label) {

            label.textContent =
                theme === "dark"
                    ? "Dark mode"
                    : "Light mode";
        }


        if (icon) {

            icon.textContent =
                theme === "dark"
                    ? "◐"
                    : "☀";
        }
    }


    if (themeBtn) {

        themeBtn.addEventListener(
            "click",
            () => {

                const current =
                    document.documentElement
                        .getAttribute(
                            "data-theme"
                        ) ||
                    "dark";


                applyTheme(
                    current === "dark"
                        ? "light"
                        : "dark"
                );
            }
        );
    }


    applyTheme(
        localStorage.getItem(
            THEME_KEY
        ) || "dark"
    );


    /* =========================================================
       PREMIUM MODAL CSS
       ========================================================= */

    function addPremiumStyles() {

        if (
            document.getElementById(
                "anasAIPremiumStyles"
            )
        ) {

            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "anasAIPremiumStyles";


        style.textContent = `

            .anas-modal-overlay {
                position:fixed;
                inset:0;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
                background:rgba(0,0,0,.72);
                backdrop-filter:blur(18px);
                -webkit-backdrop-filter:blur(18px);
                z-index:999999;
                animation:anasModalIn .22s ease;
            }

            @keyframes anasModalIn {
                from {
                    opacity:0;
                }

                to {
                    opacity:1;
                }
            }


            .anas-modal {
                width:min(560px,100%);
                max-height:90vh;
                overflow:auto;
                border-radius:24px;
                background:
                    linear-gradient(
                        145deg,
                        #121824,
                        #0b1018
                    );
                color:#fff;
                border:1px solid rgba(255,255,255,.10);
                box-shadow:
                    0 35px 120px rgba(0,0,0,.55),
                    inset 0 1px rgba(255,255,255,.04);
                animation:anasModalUp .25s ease;
            }

            @keyframes anasModalUp {
                from {
                    opacity:0;
                    transform:translateY(18px) scale(.97);
                }

                to {
                    opacity:1;
                    transform:translateY(0) scale(1);
                }
            }


            .anas-modal-header {
                display:flex;
                align-items:center;
                justify-content:space-between;
                padding:20px 22px;
                border-bottom:1px solid rgba(255,255,255,.07);
            }


            .anas-modal-header strong {
                font-size:17px;
                letter-spacing:.1px;
            }


            .anas-modal-close {
                width:36px;
                height:36px;
                border:0;
                border-radius:11px;
                background:rgba(255,255,255,.07);
                color:#fff;
                cursor:pointer;
                transition:.2s;
            }


            .anas-modal-close:hover {
                background:rgba(255,255,255,.13);
                transform:rotate(3deg);
            }


            .anas-modal-body {
                padding:22px;
            }


            .anas-setting-row {
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                padding:17px 0;
                border-bottom:1px solid rgba(255,255,255,.07);
            }


            .anas-setting-info strong {
                display:block;
                font-size:14px;
                margin-bottom:5px;
            }


            .anas-setting-info span {
                display:block;
                color:#8b95a7;
                font-size:12px;
                line-height:1.5;
            }


            .anas-modal-button {
                padding:11px 15px;
                border:0;
                border-radius:11px;
                background:#10a37f;
                color:#fff;
                cursor:pointer;
                font-weight:800;
                transition:.2s;
            }


            .anas-modal-button:hover {
                filter:brightness(1.1);
                transform:translateY(-1px);
            }


            .anas-premium-card {
                position:relative;
                overflow:hidden;
                padding:22px;
                border-radius:19px;
                background:
                    linear-gradient(
                        135deg,
                        rgba(16,163,127,.20),
                        rgba(8,127,99,.06)
                    );
                border:1px solid rgba(16,163,127,.25);
                margin-bottom:18px;
            }


            .anas-premium-card::after {
                content:"";
                position:absolute;
                width:130px;
                height:130px;
                right:-45px;
                top:-45px;
                border-radius:50%;
                background:rgba(16,163,127,.12);
                filter:blur(2px);
            }


            .anas-premium-card h2 {
                margin:0 0 7px;
                font-size:21px;
            }


            .anas-premium-card p {
                margin:0;
                color:#aab4c3;
                font-size:13px;
                line-height:1.6;
            }


            .anas-stat-grid {
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:12px;
            }


            .anas-stat {
                padding:16px;
                border-radius:14px;
                background:rgba(255,255,255,.045);
                border:1px solid rgba(255,255,255,.06);
            }


            .anas-stat span {
                display:block;
                color:#7f899a;
                font-size:10px;
                font-weight:700;
                letter-spacing:.6px;
                margin-bottom:6px;
            }


            .anas-stat strong {
                font-size:18px;
            }


            .anas-profile-head {
                display:flex;
                align-items:center;
                gap:14px;
                margin-bottom:20px;
            }


            .anas-profile-avatar {
                width:58px;
                height:58px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:17px;
                background:
                    linear-gradient(
                        135deg,
                        #10a37f,
                        #087f63
                    );
                font-weight:900;
                font-size:22px;
                box-shadow:
                    0 12px 30px rgba(16,163,127,.20);
            }


            .ai-code {
                display:block;
                overflow:auto;
                padding:16px;
                margin:12px 0;
                border-radius:13px;
                background:#070a10;
                border:1px solid rgba(255,255,255,.08);
                font-family:
                    Consolas,
                    "Courier New",
                    monospace;
                font-size:13px;
                line-height:1.65;
                white-space:pre-wrap;
            }


            .message.ai code {
                padding:2px 6px;
                border-radius:5px;
                background:rgba(16,163,127,.12);
                font-family:
                    Consolas,
                    monospace;
            }


            .anas-thinking {
                display:inline-flex;
                align-items:center;
                gap:4px;
                opacity:.78;
            }


            .anas-thinking span {
                animation:
                    anasDot 1.2s infinite ease-in-out;
            }


            .anas-thinking span:nth-child(2) {
                animation-delay:.15s;
            }


            .anas-thinking span:nth-child(3) {
                animation-delay:.3s;
            }


            @keyframes anasDot {

                0%,100% {
                    opacity:.25;
                    transform:translateY(0);
                }

                50% {
                    opacity:1;
                    transform:translateY(-2px);
                }
            }


            .image-result img {
                transition:
                    transform .25s ease,
                    box-shadow .25s ease;
            }


            .image-result img:hover {
                transform:translateY(-2px);
                box-shadow:
                    0 25px 70px rgba(0,0,0,.35);
            }


            @media(max-width:700px) {

                .anas-modal-overlay {
                    align-items:flex-end;
                    padding:10px;
                }

                .anas-modal {
                    max-height:88vh;
                    border-radius:22px;
                }

                .anas-stat-grid {
                    grid-template-columns:1fr;
                }
            }
        `;


        document.head.appendChild(
            style
        );
    }


    addPremiumStyles();


    /* =========================================================
       MODAL SYSTEM
       ========================================================= */

    function createModal(
        className,
        title,
        content
    ) {

        document
            .querySelector(
                `.${className}`
            )
            ?.remove();


        const overlay =
            document.createElement(
                "div"
            );


        overlay.className =
            `anas-modal-overlay ${className}`;


        overlay.innerHTML = `

            <div class="anas-modal">

                <div class="anas-modal-header">

                    <strong>
                        ${title}
                    </strong>

                    <button
                        class="anas-modal-close"
                        type="button">
                        ✕
                    </button>

                </div>

                <div class="anas-modal-body">

                    ${content}

                </div>

            </div>
        `;


        document.body.appendChild(
            overlay
        );


        const close =
            () => overlay.remove();


        overlay
            .querySelector(
                ".anas-modal-close"
            )
            ?.addEventListener(
                "click",
                close
            );


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    close();
                }
            }
        );


        return overlay;
    }


    /* =========================================================
       SETTINGS
       ========================================================= */

    function openSettings() {

        createModal(
            "settings-panel",
            "⚙ Settings",
            `

                <div class="anas-setting-row">

                    <div class="anas-setting-info">

                        <strong>
                            Appearance
                        </strong>

                        <span>
                            Switch between dark and light mode.
                        </span>

                    </div>

                    <button
                        class="anas-modal-button"
                        id="settingsThemeButton">
                        Theme
                    </button>

                </div>


                <div class="anas-setting-row">

                    <div class="anas-setting-info">

                        <strong>
                            Chat History
                        </strong>

                        <span>
                            Conversations are stored locally in this browser.
                        </span>

                    </div>

                    <button
                        class="anas-modal-button"
                        id="clearHistoryButton">
                        Clear
                    </button>

                </div>


                <div class="anas-setting-row">

                    <div class="anas-setting-info">

                        <strong>
                            Voice Assistant
                        </strong>

                        <span>
                            Browser speech recognition and text-to-speech.
                        </span>

                    </div>

                    <span style="
                        color:#10a37f;
                        font-size:12px;
                        font-weight:700;
                    ">
                        ${
                            recognition
                                ? "Available"
                                : "Unsupported"
                        }
                    </span>

                </div>


                <button
                    class="anas-modal-button"
                    id="settingsDoneButton"
                    style="
                        width:100%;
                        margin-top:18px;
                    ">
                    Done
                </button>
            `
        );


        const modal =
            document.querySelector(
                ".settings-panel"
            );


        document
            .getElementById(
                "settingsThemeButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    const current =
                        document.documentElement
                            .getAttribute(
                                "data-theme"
                            ) ||
                        "dark";


                    applyTheme(
                        current === "dark"
                            ? "light"
                            : "dark"
                    );
                }
            );


        document
            .getElementById(
                "clearHistoryButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (
                        !confirm(
                            "Delete all local chat history?"
                        )
                    ) {

                        return;
                    }


                    chats =
                        [];


                    currentChatId =
                        null;


                    saveChats();

                    renderChatHistory();

                    startNewChat();

                    modal?.remove();
                }
            );


        document
            .getElementById(
                "settingsDoneButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    modal?.remove();
                }
            );
    }


    if (settingsBtn) {

        settingsBtn.addEventListener(
            "click",
            openSettings
        );
    }


    /* =========================================================
       PROFILE
       ========================================================= */

    function openProfile() {

        const initial =
            currentUsername
                .charAt(0)
                .toUpperCase();


        createModal(
            "profile-panel",
            "👤 Profile",
            `

                <div class="anas-profile-head">

                    <div class="anas-profile-avatar">

                        ${escapeHTML(
                            initial
                        )}

                    </div>

                    <div>

                        <strong style="
                            font-size:18px;
                        ">

                            ${escapeHTML(
                                currentUsername
                            )}

                        </strong>

                        <div style="
                            color:#8b95a7;
                            font-size:12px;
                            margin-top:4px;
                        ">

                            Anas AI Account

                        </div>

                    </div>

                </div>


                <div class="anas-stat-grid">

                    <div class="anas-stat">

                        <span>
                            PLAN
                        </span>

                        <strong>
                            ${escapeHTML(
                                currentPlan
                            )}
                        </strong>

                    </div>


                    <div class="anas-stat">

                        <span>
                            CHATS
                        </span>

                        <strong>
                            ${chats.length}
                        </strong>

                    </div>


                    <div class="anas-stat">

                        <span>
                            AI
                        </span>

                        <strong>
                            Active
                        </strong>

                    </div>


                    <div class="anas-stat">

                        <span>
                            STATUS
                        </span>

                        <strong>
                            Online
                        </strong>

                    </div>

                </div>


                <button
                    class="anas-modal-button"
                    id="profileLogoutButton"
                    style="
                        width:100%;
                        margin-top:18px;
                    ">
                    🚪 Logout
                </button>
            `
        );


        document
            .getElementById(
                "profileLogoutButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (
                        !confirm(
                            "Are you sure you want to logout?"
                        )
                    ) {

                        return;
                    }


                    window.location.href =
                        "/Account/Logout";
                }
            );
    }


    const profile =
        document.querySelector(
            ".user-profile"
        );


    if (profile) {

        profile.addEventListener(
            "click",
            openProfile
        );
    }


    /* =========================================================
       PREMIUM DASHBOARD
       ========================================================= */

    function openPremiumDashboard() {

        createModal(
            "premium-panel",
            "💎 Premium Dashboard",
            `

                <div class="anas-premium-card">

                    <h2>
                        Anas AI Premium
                    </h2>

                    <p>
                        Powerful AI features,
                        image intelligence,
                        voice assistant and
                        premium capabilities.
                    </p>

                </div>


                <div class="anas-stat-grid">

                    <div class="anas-stat">

                        <span>
                            CURRENT PLAN
                        </span>

                        <strong>
                            ${escapeHTML(
                                currentPlan
                            )}
                        </strong>

                    </div>


                    <div class="anas-stat">

                        <span>
                            CHATS
                        </span>

                        <strong>
                            ${chats.length}
                        </strong>

                    </div>


                    <div class="anas-stat">

                        <span>
                            IMAGE AI
                        </span>

                        <strong>
                            Available
                        </strong>

                    </div>


                    <div class="anas-stat">

                        <span>
                            VOICE AI
                        </span>

                        <strong>
                            Available
                        </strong>

                    </div>

                </div>


                <button
                    class="anas-modal-button"
                    id="premiumUpgradeButton"
                    style="
                        width:100%;
                        margin-top:18px;
                    ">
                    💎 Premium Coming Soon
                </button>
            `
        );


        document
            .getElementById(
                "premiumUpgradeButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    alert(
                        "Premium system is ready to connect with your license/payment system."
                    );
                }
            );
    }


    /* =========================================================
       PREMIUM SHORTCUT
       CTRL + SHIFT + P
       ========================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() ===
                    "p"
            ) {

                event.preventDefault();

                openPremiumDashboard();
            }
        }
    );


    /* =========================================================
       CONNECTION STATUS
       ========================================================= */

    function updateConnectionStatus(
        status
    ) {

        if (!connectionStatus) {

            return;
        }


        connectionStatus.textContent =
            status;


        connectionStatus.dataset.status =
            status.toLowerCase();
    }


    updateConnectionStatus(
        navigator.onLine
            ? "Online"
            : "Offline"
    );


    window.addEventListener(
        "online",
        () =>
            updateConnectionStatus(
                "Online"
            )
    );


    window.addEventListener(
        "offline",
        () =>
            updateConnectionStatus(
                "Offline"
            )
    );


    /* =========================================================
       ESCAPE KEY
       ========================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {

                return;
            }


            document
                .querySelectorAll(
                    ".anas-modal-overlay"
                )
                .forEach(
                    modal =>
                        modal.remove()
                );


            closeMobileSidebar();


            if (voiceMode) {

                stopVoiceCompletely();
            }
        }
    );


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    currentChatId =
        null;


    messages.innerHTML =
        "";


    messages.appendChild(
        createWelcomeScreen()
    );


    renderChatHistory();

    resizeInput();


    console.log(
        "%c ANAS AI ",
        "background:#10a37f;color:white;font-weight:900;padding:5px 10px;border-radius:6px;"
    );


    console.log(
        "Premium Chat Controller loaded successfully."
    );


    console.log(
        "Chat history:",
        chats.length
    );


    console.log(
        "Image AI:",
        imageInput
            ? "Ready"
            : "Image input missing"
    );


    console.log(
        "Voice AI:",
        recognition
            ? "Ready"
            : "Unsupported"
    );

});