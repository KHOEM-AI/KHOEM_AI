const sessionId = "session_" + Math.random().toString(36).substring(2, 10);
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = (role === "user" ? "អ្នក: " : "KHOEM_AI: ") + text;
  if (chatBox) {
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

async function sendMessage(text) {
  const message = (text || input.value).trim();
  if (!message) return;

  addMessage("user", message);
  if (input) input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message: message })
    });
    const data = await res.json();

    if (data.success && data.reply) {
      addMessage("assistant", data.reply);
      if (window.KhoemVoice) KhoemVoice.speak(data.reply);
    } else {
      addMessage("assistant", "Error: " + (data.message || "Unknown error"));
    }
  } catch (e) {
    addMessage("assistant", "Connection error");
  }
}
