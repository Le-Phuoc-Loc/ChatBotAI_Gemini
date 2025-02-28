from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
import google.generativeai as genai
from backend.config import GEMINI_API_KEY
print(GEMINI_API_KEY)



app = Flask(__name__)  # Khởi tạo ứng dụng Flask
socketio = SocketIO(app, cors_allowed_origins="*")

# Cấu hình Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-pro")

@app.route("/")
def index():
    return "Server is running!"

@socketio.on("message")
def handle_message(data):
    user_input = data["message"]
    response = model.generate_content(user_input)
    socketio.emit("response", {"message": response.text})

if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)