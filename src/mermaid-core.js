import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
});

export const MermaidCore = {
  render: async (containerId, code) => {
    const element = document.getElementById(containerId);
    
    // Chỉ vẽ khi có từ khóa bắt đầu hợp lệ
    if (!code.match(/graph|flowchart|sequenceDiagram|classDiagram|stateDiagram/)) return;

    try {
      // Kiểm tra cú pháp trước
      if (await mermaid.parse(code)) {
        element.removeAttribute("data-processed");
        const { svg } = await mermaid.render(`svg-${Date.now()}`, code);
        element.innerHTML = svg;
      }
    } catch (e) {
      // Im lặng khi lỗi cú pháp (để trải nghiệm gõ phím mượt mà)
      console.warn("Đang chờ cú pháp hoàn thiện...");
    }
  },
};
