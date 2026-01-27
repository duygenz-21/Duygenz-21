// Hàm gọi OpenRouter và hứng dữ liệu Stream
export const askOpenRouter = async ({ apiKey, model, currentCode, prompt, onChunk }) => {
  const systemPrompt = `
    Bạn là trợ lý phân tích kinh doanh. Nhiệm vụ:
    1. Đọc sơ đồ Mermaid hiện tại và kịch bản người dùng đưa ra.
    2. Chỉnh sửa hoặc thêm nhánh vào code Mermaid để phản ánh kịch bản đó.
    3. QUAN TRỌNG: Chỉ trả về nội dung code Mermaid thuần túy. KHÔNG dùng Markdown (\`\`\`). KHÔNG giải thích.
    4. Giữ nguyên các node cũ nếu không cần thiết phải xóa.
    
    Code hiện tại:
    ${currentCode}
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.0-flash-exp:free", // Model mặc định
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Kịch bản giả lập: ${prompt}` }
        ],
        stream: true, // Bật chế độ stream
      }),
    });

    if (!response.ok) throw new Error("Lỗi kết nối API OpenRouter");

    // Xử lý luồng dữ liệu (Stream Reader)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // OpenRouter trả về dạng data: {...}
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const json = JSON.parse(line.substring(6));
            const content = json.choices[0]?.delta?.content || "";
            if (content) onChunk(content); // Đẩy chữ về main.js
          } catch (e) {
            console.warn("Lỗi parse JSON stream", e);
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
    alert("Lỗi: " + error.message);
  }
};