from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO
import google.generativeai as genai
from config import GEMINI_API_KEY
import os

app = Flask(__name__, static_folder="static")
socketio = SocketIO(app, cors_allowed_origins="*")

# Cấu hình Gemini API
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro")

@app.route("/")
def index():
    return render_template("index.html")

# Route để phục vụ file tĩnh từ thư mục static
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@socketio.on("message")
def handle_message(data):
    user_message = data["message"]
    print("Người dùng:", user_message)

    try:
        # Gửi tin nhắn đến Gemini API
        response = model.generate_content(user_message)
        bot_reply = response.text if response.text else "Xin lỗi, tôi không hiểu."
    except Exception as e:
        print("Lỗi khi gọi Gemini API:", str(e))
        bot_reply = "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu."

    # Trả lời người dùng
    socketio.emit("response", {"message": bot_reply})

@app.route('/favicon.ico')
def favicon():
    return '', 204  # Trả về mã 204 (No Content)

if __name__ == "__main__":
    socketio.run(app, host="127.0.0.1", port=5000, debug=True)
