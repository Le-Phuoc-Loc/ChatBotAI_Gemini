const socket = io("http://127.0.0.1:5000");

function sendMessage() {
    let inputField = document.getElementById("user-input");
    let message = inputField.value;
    if (message.trim() === "") return;

    let chatBox = document.getElementById("chat-box");
    chatBox.innerHTML += `<div><strong>Bạn:</strong> ${message}</div>`;

    socket.emit("message", { message: message });

    inputField.value = "";
}

socket.on("response", function(data) {
    let chatBox = document.getElementById("chat-box");
    chatBox.innerHTML += `<div><strong>Bot:</strong> ${data.message}</div>`;
});
