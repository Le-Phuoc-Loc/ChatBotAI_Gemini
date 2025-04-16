const socket = io("http://127.0.0.1:5000");

function sendMessage() {
    let inputField = document.getElementById("user-input");
    let chatBox = document.getElementById("chat-box");
    let message = inputField.value.trim();

    if (message === "") return;

    // Hiển thị tin nhắn người dùng
    let userMessage = document.createElement("div");
    userMessage.classList.add("message", "user-message");
    userMessage.textContent = message;
    chatBox.appendChild(userMessage);

    // Xóa input sau khi gửi
    inputField.value = "";

    // Giả lập phản hồi của chatbot
    setTimeout(() => {
        let botMessage = document.createElement("div");
        botMessage.classList.add("message", "bot-message");
        botMessage.textContent = ".........";
        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 500);
}
