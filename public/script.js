const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// To store the conversation history for context
let messages = [];

/**
 * Handles form submission to send a message to the chatbot API.
 * @param {Event} e - The submit event.
 */
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to UI and history
  appendMessage("user", userMessage);
  messages.push({ role: "user", content: userMessage });
  input.value = "";

  // Add a "thinking" message to the UI and get a reference to it
  const thinkingMessage = appendMessage("bot", "Gemini is thinking...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Send the entire conversation history
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `HTTP error! Status: ${response.status}`
      );
    }

    const data = await response.json();
    const aiResponse = data.result;

    if (aiResponse) {
      // Update the "thinking" message with the actual response
      thinkingMessage.innerHTML = renderMarkdown(aiResponse);
      // Add AI response to the conversation history
      messages.push({ role: "model", content: aiResponse });
    } else {
      thinkingMessage.textContent = "Sorry, no response received.";
    }
  } catch (error) {
    console.error("Error fetching chat response:", error);
    thinkingMessage.textContent =
      error.message || "Failed to get response from server.";
  }
});

/**
 * A simple and safe function to convert basic Markdown to HTML.
 * It handles bold, italics, inline code, and preserves line breaks.
 * For production use with untrusted model output, a more robust library
 * like DOMPurify should be used to prevent XSS.
 * @param {string} text The Markdown text to convert.
 * @returns {string} The converted HTML string.
 */
function renderMarkdown(text) {
  // Escape basic HTML characters to prevent XSS
  let safeText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // **bold** to <strong>
  safeText = safeText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // *italic* to <em>
  safeText = safeText.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // `inline code` to <code>
  safeText = safeText.replace(/`([^`]+?)`/g, "<code>$1</code>");

  // Newlines to <br>
  return safeText.replace(/\n/g, "<br>");
}

/**
 * Appends a message to the chat box.
 * @param {string} sender - The sender of the message ('user' or 'bot').
 * @param {string} text - The message content.
 * @returns {HTMLElement} The created message element.
 */
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  // Scroll to the bottom of the chat box
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
