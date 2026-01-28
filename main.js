import { MermaidCore } from "./src/mermaid-core.js";
import { askOpenRouter } from "./src/ai-engine.js";

const editor = document.getElementById("editor");
const diagramViewId = "diagram-view";
const btnSimulate = document.getElementById("btn-simulate");
const apiKeyInput = document.getElementById("api-key");
const modelInput = document.getElementById("model-name");
const aiPromptInput = document.getElementById("ai-prompt");

// 1. Vẽ sơ đồ ban đầu
MermaidCore.render(diagramViewId, editor.value);

// 2. Xử lý Real-time khi gõ tay (Debounce)
let timeout;
editor.addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    MermaidCore.render(diagramViewId, editor.value);
  }, 300);
});

// 3. Xử lý nút bấm AI
btnSimulate.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value.trim();
  const prompt = aiPromptInput.value.trim();
  
  if (!apiKey) {
    alert("Vui lòng nhập OpenRouter API Key!");
    return;
  }
  if (!prompt) return;

  // Khóa nút bấm
  btnSimulate.textContent = "⏳ Đang tính toán...";
  btnSimulate.disabled = true;

  // Xóa nội dung cũ trong editor để AI viết lại hoàn toàn (hoặc bạn có thể chọn append)
  // Ở đây tôi chọn cách để AI viết lại toàn bộ code mới dựa trên code cũ cho logic
  
  // Tuy nhiên, để trải nghiệm "Realtime Stream" thú vị, ta sẽ xóa trắng editor và để AI điền vào
  // Hoặc hay hơn: Để AI tự quyết định trả về toàn bộ code đã sửa.
  
  let newCodeBuffer = ""; // Biến tạm để chứa code mới

  await askOpenRouter({
    apiKey: apiKey,
    model: modelInput.value.trim(),
    currentCode: editor.value,
    prompt: prompt,
    onChunk: (chunk) => {
      // Vì AI trả về toàn bộ code đã sửa đổi, ta sẽ thay thế dần editor
      // Logic này cần khéo léo:
      // Cách đơn giản nhất: AI trả về full code, ta xóa editor cũ và điền dần code mới vào
      
      if (newCodeBuffer === "") {
        editor.value = ""; // Xóa sạch khi bắt đầu nhận chữ đầu tiên
      }
      
      newCodeBuffer += chunk;
      editor.value += chunk; // Hiệu ứng máy đánh chữ
      
      // Cuộn xuống cuối
      editor.scrollTop = editor.scrollHeight;
      
      // Gọi vẽ hình ngay lập tức (Trigger event input)
      editor.dispatchEvent(new Event("input"));
    }
  });

  // Mở lại nút
  btnSimulate.textContent = "✨ Chạy Mô Phỏng";
  btnSimulate.disabled = false;
});
