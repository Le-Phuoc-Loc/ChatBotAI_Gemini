// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCfSSErtZ1L6xyUPCLSfKQo0ZVdsXadYD0",
    authDomain: "geminichatbotai.firebaseapp.com",
    projectId: "geminichatbotai",
    storageBucket: "geminichatbotai.appspot.com",
    messagingSenderId: "1022162852981",
    appId: "1:1022162852981:web:4d275f900d67f892266c3c"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async function () {
    let chatBox = document.getElementById("chat-box");
    let sendButton = document.getElementById("send-button");
    let resetButton = document.getElementById("reset-button");
    let micButton = document.getElementById("mic-button");
    let inputField = document.getElementById("user-input");
    let saveHistoryBtn = document.getElementById("save-history");
    

    let loginBtn = document.getElementById("login-button");
    let registerBtn = document.getElementById("register-button");
    let logoutBtn = document.getElementById("logout-button");
    let statusText = document.getElementById("status-text");

    let currentUser = null;

    // Kết nối WebSocket
    const socket = io("http://127.0.0.1:5000");

    socket.on("connect", () => {
        console.log("✅ WebSocket kết nối thành công!");
    });

    socket.on("connect_error", (err) => {
        console.error("❌ Lỗi kết nối WebSocket:", err);
    });

    sendButton.addEventListener("click", sendMessage);
    micButton.addEventListener("click", startSpeechRecognition);
    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendMessage();
    });

    resetButton.addEventListener("click", resetChat);
    saveHistoryBtn.addEventListener("click", saveChatHistory);

    loginBtn.addEventListener("click", login);
    registerBtn.addEventListener("click", register);
    logoutBtn.addEventListener("click", logout);

    // Kiểm tra trạng thái đăng nhập
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
    
            // 🔎 Lấy tên đăng nhập từ Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let username = user.email;
            if (userDoc.exists()) {
                username = userDoc.data().username || user.email;
            }
    
            statusText.textContent = `🔵 Đã đăng nhập: ${username}`;
    
            loginBtn.style.display = "none";
            registerBtn.style.display = "none";
            logoutBtn.style.display = "inline-block";
            // Ẩn ô nhập email và mật khẩu
            document.getElementById("email-input").style.display = "none";
            document.getElementById("password-input").style.display = "none";
            await loadChatHistory();
        } else {
            currentUser = null;
            statusText.textContent = "🔴 Chưa đăng nhập";
            loginBtn.style.display = "inline-block";
            registerBtn.style.display = "inline-block";
            logoutBtn.style.display = "none";
            // Hiện lại ô nhập email và mật khẩu
            document.getElementById("email-input").style.display = "block";
            document.getElementById("password-input").style.display = "block";
            chatBox.innerHTML = "";
            addBotMessage("Xin chào! Tôi là chatbot AI, tôi có thể giúp gì cho bạn?");
        }
    });

    function sendMessage() {
        let message = inputField.value.trim();
        if (message === "" || !currentUser) return;

        addUserMessage(message);
        inputField.value = "";
        socket.emit("message", { message });

        setTimeout(() => {
        addBotMessage("🤖 Đang trả lời...", "waiting-response");
        }, 500);

    }

    socket.on("response", function (data) {
        updateBotMessage("waiting-response", data.message);
    });

    function resetChat() {
        chatBox.innerHTML = "";
        addBotMessage("Xin chào! Tôi có thể giúp gì?");
    }

    function addUserMessage(message) {
        let userMessage = document.createElement("div");
        userMessage.classList.add("message", "user-message");
        userMessage.innerHTML = `
            <div class="user-text">
                <span class="message-text">${message}</span>
                <span class="time">${getCurrentTime()}</span>
            </div>
            <div class="user-avatar">👨‍💻</div>
        `;

        chatBox.appendChild(userMessage);
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
    }

    function addBotMessage(message, id = "") {
        let botMessage = document.createElement("div");
        botMessage.classList.add("message", "bot-message");

        if (id) botMessage.dataset.id = id;

        botMessage.innerHTML = `
            <div class="bot-avatar">🤖</div>
            <div class="bot-text">
                <span class="message-text">${message}</span>
                <span class="time">${getCurrentTime()}</span>
            </div>
        `;

        chatBox.appendChild(botMessage);
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
    }

    function updateBotMessage(id, newMessage) {
        let pendingMessage = document.querySelector(`.bot-message[data-id="${id}"]`);
        if (pendingMessage) {
            pendingMessage.querySelector(".message-text").textContent = newMessage;
        } else {
            addBotMessage(newMessage);
        }
    }

    function getCurrentTime() {
        let now = new Date();
        return now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
    }

    async function saveChatHistory() {
        if (!currentUser) {
            alert("❌ Bạn cần đăng nhập để lưu lịch sử!");
            return;
        }
        try {
            let messages = [];
            document.querySelectorAll(".message").forEach(msg => {
                messages.push({
                    sender: msg.classList.contains("user-message") ? "user" : "bot",
                    message: msg.querySelector(".message-text").textContent,
                    time: new Date().toISOString()
                });
            });

            await setDoc(doc(db, "chats", currentUser.uid), { history: messages });
            console.log("💾 Lịch sử đã lưu lên Firebase!");
        } catch (error) {
            console.error("❌ Lỗi khi lưu lịch sử chat:", error);
        }
    }

    async function loadChatHistory() {
        if (!currentUser) return;
        try {
            const docRef = doc(db, "chats", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                let history = docSnap.data().history;
                history.forEach(data => {
                    if (data.sender === "user") addUserMessage(data.message);
                    else addBotMessage(data.message);
                });
                console.log("📜 Đã tải lịch sử chat!");
            }
        } catch (error) {
            console.error("❌ Lỗi khi tải lịch sử chat:", error);
        }
    }

    // Khởi động nhận diện giọng nói
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "vi-VN";

    function startSpeechRecognition() {
        recognition.start();
    }

    recognition.onresult = function (event) {
        let transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        sendMessage();
    };

    recognition.onerror = function () {
        alert("❌ Lỗi nhận diện giọng nói, vui lòng thử lại!");
    };

    async function register() {
        let username = document.getElementById("username-input").value.trim();
        let email = document.getElementById("email-input").value.trim();
        let password = document.getElementById("password-input").value.trim();

        if (!username || !email || !password) {
            alert("❌ Vui lòng nhập đầy đủ thông tin!");
        return;
        }

         try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

        // Lưu username vào Firestore
             await setDoc(doc(db, "users", user.uid), { username: username });

            alert("✅ Đăng ký thành công!");
        }catch (error) {
            alert("❌ Lỗi: " + error.message);
    }
    }

    async function login() {
        let email = document.getElementById("email-input").value.trim();
        let password = document.getElementById("password-input").value.trim();

        if (!email || !password) {
            alert("❌ Vui lòng nhập đầy đủ email và mật khẩu!");
            return;
        }
    
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("✅ Đăng nhập thành công!");
        } catch (error) {
            alert("❌ Lỗi: " + error.message);
        }
    }

    async function logout() {
        await signOut(auth);
        alert("✅ Đã đăng xuất!");
    }
});
