// Khởi tạo Mermaid.js
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    flowchart: {
        curve: 'basis',
        useMaxWidth: true
    },
    securityLevel: 'loose'
});

// Biến toàn cục
let currentMermaidCode = '';
let draftMermaidCode = '';
let isDarkTheme = true;
let aiConfig = {
    apiKey: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    endpoint: ''
};

// DOM Elements
const mermaidCodeEl = document.getElementById('mermaidCode');
const mermaidPreviewEl = document.getElementById('mermaidPreview');
const renderBtn = document.getElementById('renderBtn');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');
const examplesSelect = document.getElementById('examples');

// AI Elements
const aiTabs = document.querySelectorAll('.ai-tab');
const aiTabContents = document.querySelectorAll('.ai-tab-content');
const directInput = document.getElementById('directInput');
const directSend = document.getElementById('directSend');
const directMessages = document.getElementById('directMessages');
const draftInput = document.getElementById('draftInput');
const draftSend = document.getElementById('draftSend');
const draftMessages = document.getElementById('draftMessages');
const draftPreview = document.getElementById('draftPreview');
const applyDraft = document.getElementById('applyDraft');
const clearDraft = document.getElementById('clearDraft');

// Config Elements
const apiKeyEl = document.getElementById('apiKey');
const aiModelEl = document.getElementById('aiModel');
const temperatureEl = document.getElementById('temperature');
const tempValueEl = document.getElementById('tempValue');
const apiEndpointEl = document.getElementById('apiEndpoint');
const saveConfigBtn = document.getElementById('saveConfig');
const resetConfigBtn = document.getElementById('resetConfig');
const toggleKeyBtn = document.getElementById('toggleKey');

// Modal Elements
const shortcutsModal = document.getElementById('shortcutsModal');
const helpModal = document.getElementById('helpModal');
const toggleShortcutsBtn = document.getElementById('toggleShortcuts');
const toggleHelpBtn = document.getElementById('toggleHelp');
const modalCloseBtns = document.querySelectorAll('.modal-close');

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Khởi tạo theme
    initTheme();
    
    // Khởi tạo cài đặt AI
    loadAIConfig();
    
    // Khởi tạo sự kiện
    initEvents();
    
    // Render mẫu ban đầu
    loadExample('basic');
    
    // Khởi tạo phím tắt
    initShortcuts();
}

function initTheme() {
    const savedTheme = localStorage.getItem('flowchart-theme');
    isDarkTheme = savedTheme ? savedTheme === 'dark' : true;
    themeToggle.checked = isDarkTheme;
    updateTheme();
}

function updateTheme() {
    const theme = isDarkTheme ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    mermaid.initialize({ theme: isDarkTheme ? 'dark' : 'default' });
    localStorage.setItem('flowchart-theme', theme);
    renderMermaid();
}

function initEvents() {
    // Render sự kiện
    mermaidCodeEl.addEventListener('input', debounce(renderMermaid, 500));
    renderBtn.addEventListener('click', renderMermaid);
    themeToggle.addEventListener('change', () => {
        isDarkTheme = themeToggle.checked;
        updateTheme();
    });
    
    // Nút điều khiển
    exportBtn.addEventListener('click', exportImage);
    copyBtn.addEventListener('click', copyCode);
    clearBtn.addEventListener('click', clearEditor);
    
    // Ví dụ
    examplesSelect.addEventListener('change', (e) => {
        loadExample(e.target.value);
    });
    
    // AI Tabs
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // AI Direct
    directSend.addEventListener('click', sendDirectRequest);
    directInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendDirectRequest();
        }
    });
    
    // AI Draft
    draftSend.addEventListener('click', sendDraftRequest);
    draftInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendDraftRequest();
        }
    });
    
    applyDraft.addEventListener('click', applyDraftToEditor);
    clearDraft.addEventListener('click', clearDraftMode);
    
    // Cấu hình AI
    temperatureEl.addEventListener('input', () => {
        tempValueEl.textContent = temperatureEl.value;
        aiConfig.temperature = parseFloat(temperatureEl.value);
    });
    
    toggleKeyBtn.addEventListener('click', () => {
        const type = apiKeyEl.getAttribute('type');
        apiKeyEl.setAttribute('type', type === 'password' ? 'text' : 'password');
        toggleKeyBtn.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye-slash"></i>' : 
            '<i class="fas fa-eye"></i>';
    });
    
    saveConfigBtn.addEventListener('click', saveAIConfig);
    resetConfigBtn.addEventListener('click', resetAIConfig);
    
    // Modals
    toggleShortcutsBtn.addEventListener('click', () => {
        shortcutsModal.classList.add('active');
    });
    
    toggleHelpBtn.addEventListener('click', () => {
        helpModal.classList.add('active');
    });
    
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shortcutsModal.classList.remove('active');
            helpModal.classList.remove('active');
        });
    });
    
    // Đóng modal khi click bên ngoài
    window.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
            shortcutsModal.classList.remove('active');
        }
        if (e.target === helpModal) {
            helpModal.classList.remove('active');
        }
    });
}

function initShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter: Render
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            renderMermaid();
        }
        
        // Ctrl + S: Lưu cấu hình
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveAIConfig();
        }
        
        // Ctrl + E: Xuất ảnh
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportImage();
        }
        
        // Ctrl + D: Chuyển sang chế độ bản nháp
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            switchTab('draft');
            draftInput.focus();
        }
        
        // Ctrl + /: Xoá editor
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            clearEditor();
        }
    });
}

function switchTab(tabId) {
    // Cập nhật tabs
    aiTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Cập nhật nội dung
    aiTabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Render Mermaid
function renderMermaid() {
    const code = mermaidCodeEl.value.trim();
    currentMermaidCode = code;
    
    if (!code) {
        mermaidPreviewEl.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-project-diagram"></i>
                <p>Sơ đồ sẽ hiển thị ở đây</p>
                <p class="placeholder-sub">Nhập mã Mermaid vào editor bên trái</p>
            </div>
        `;
        return;
    }
    
    mermaidPreviewEl.innerHTML = '<div class="mermaid-rendering">Đang render sơ đồ...</div>';
    
    try {
        mermaid.mermaidAPI.render('mermaid-graph', code, (svgCode) => {
            mermaidPreviewEl.innerHTML = svgCode;
        });
    } catch (error) {
        mermaidPreviewEl.innerHTML = `
            <div class="preview-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Lỗi render Mermaid</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
        console.error('Mermaid render error:', error);
    }
}

// Render bản nháp
function renderDraft() {
    if (!draftMermaidCode) {
        draftPreview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-clipboard"></i>
                <p>Bản nháp sẽ hiển thị ở đây</p>
                <p class="placeholder-sub">Yêu cầu AI tạo bản nháp ở khung bên dưới</p>
            </div>
        `;
        applyDraft.disabled = true;
        return;
    }
    
    draftPreview.innerHTML = '<div class="mermaid-rendering">Đang render bản nháp...</div>';
    
    try {
        mermaid.mermaidAPI.render('draft-graph', draftMermaidCode, (svgCode) => {
            draftPreview.innerHTML = svgCode;
            applyDraft.disabled = false;
        });
    } catch (error) {
        draftPreview.innerHTML = `
            <div class="preview-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Lỗi render bản nháp</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
        applyDraft.disabled = true;
    }
}

// Tải ví dụ
function loadExample(example) {
    let code = '';
    
    switch (example) {
        case 'basic':
            code = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`;
            break;
            
        case 'flowchart':
            code = `flowchart TD
    A[Đăng nhập] --> B{Xác thực thành công?}
    B -->|Có| C[Truy cập trang chủ]
    B -->|Không| D[Hiển thị lỗi]
    C --> E[Kết thúc]
    D --> F[Quay lại đăng nhập]
    F --> A`;
            break;
            
        case 'sequence':
            code = `sequenceDiagram
    participant User
    participant System
    participant Database
    
    User->>System: Gửi yêu cầu đăng nhập
    System->>Database: Kiểm tra thông tin
    Database-->>System: Trả về kết quả
    System-->>User: Hiển thị thông báo`;
            break;
            
        case 'gantt':
            code = `gantt
    title Biểu đồ Dự án
    dateFormat  YYYY-MM-DD
    section Phân tích
    Nghiên cứu yêu cầu   :a1, 2023-10-01, 5d
    Thiết kế hệ thống    :a2, after a1, 7d
    section Phát triển
    Phát triển frontend  :b1, after a2, 10d
    Phát triển backend   :b2, after a2, 12d
    section Kiểm thử
    Kiểm thử hệ thống    :c1, after b1, 7d
    Triển khai           :c2, after c1, 3d`;
            break;
            
        default:
            return;
    }
    
    mermaidCodeEl.value = code;
    renderMermaid();
}

// Xuất ảnh
function exportImage() {
    const svg = mermaidPreviewEl.querySelector('svg');
    if (!svg) {
        alert('Không có sơ đồ để xuất!');
        return;
    }
    
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'flowchart.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
}

// Sao chép code
function copyCode() {
    if (!currentMermaidCode) {
        alert('Không có mã để sao chép!');
        return;
    }
    
    navigator.clipboard.writeText(currentMermaidCode)
        .then(() => {
            // Hiển thị thông báo
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Đã sao chép!';
            copyBtn.classList.add('btn-success');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('btn-success');
            }, 2000);
        })
        .catch(err => {
            console.error('Copy error:', err);
            alert('Không thể sao chép mã!');
        });
}

// Xoá editor
function clearEditor() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ mã Mermaid?')) {
        mermaidCodeEl.value = '';
        renderMermaid();
    }
}

// AI Functions
async function sendDirectRequest() {
    const prompt = directInput.value.trim();
    if (!prompt) return;
    
    // Hiển thị tin nhắn người dùng
    addMessage(directMessages, prompt, 'user');
    directInput.value = '';
    
    // Tạo tin nhắn AI đang xử lý
    const messageId = addMessage(directMessages, 'Đang xử lý yêu cầu...', 'ai');
    
    try {
        const mermaidCode = await callAI(prompt);
        
        // Cập nhật tin nhắn với kết quả
        updateMessage(messageId, `
            <p>Đã tạo mã Mermaid từ yêu cầu của bạn:</p>
            <pre><code>${mermaidCode}</code></pre>
            <p>Mã đã được chèn vào editor.</p>
        `);
        
        // Chèn mã vào editor
        mermaidCodeEl.value = mermaidCode;
        renderMermaid();
        
    } catch (error) {
        updateMessage(messageId, `
            <p>Đã xảy ra lỗi khi xử lý yêu cầu:</p>
            <p class="error-message">${error.message}</p>
            <p>Vui lòng kiểm tra cài đặt API hoặc thử lại.</p>
        `);
    }
}

async function sendDraftRequest() {
    const prompt = draftInput.value.trim();
    if (!prompt) return;
    
    // Hiển thị tin nhắn người dùng
    addMessage(draftMessages, prompt, 'user');
    draftInput.value = '';
    
    // Tạo tin nhắn AI đang xử lý
    const messageId = addMessage(draftMessages, 'Đang tạo bản nháp...', 'ai');
    
    try {
        const mermaidCode = await callAI(prompt, true);
        draftMermaidCode = mermaidCode;
        
        // Cập nhật tin nhắn với kết quả
        updateMessage(messageId, `
            <p>Đã tạo bản nháp Mermaid từ yêu cầu của bạn:</p>
            <pre><code>${mermaidCode}</code></pre>
            <p>Bản nháp đã được hiển thị ở trên. Bạn có thể chỉnh sửa hoặc áp dụng vào editor chính.</p>
        `);
        
        // Render bản nháp
        renderDraft();
        
    } catch (error) {
        updateMessage(messageId, `
            <p>Đã xảy ra lỗi khi tạo bản nháp:</p>
            <p class="error-message">${error.message}</p>
            <p>Vui lòng kiểm tra cài đặt API hoặc thử lại.</p>
        `);
    }
}

async function callAI(prompt, isDraft = false) {
    const model = aiModelEl.value;
    
    // Nếu là mock AI (dùng cho demo)
    if (model === 'mock') {
        return generateMockMermaid(prompt);
    }
    
    // Kiểm tra API key
    if (!aiConfig.apiKey && model !== 'mock') {
        throw new Error('Vui lòng nhập API Key trong phần cấu hình AI');
    }
    
    // Chuẩn bị request
    const endpoint = aiConfig.endpoint || getDefaultEndpoint(model);
    const requestBody = {
        model: model,
        messages: [
            {
                role: "system",
                content: "Bạn là trợ lý chuyên tạo mã Mermaid.js. Chỉ trả về mã Mermaid hợp lệ, không giải thích thêm. Đảm bảo mã đúng cú pháp và có thể render ngay lập tức."
            },
            {
                role: "user",
                content: `Tạo mã Mermaid cho: ${prompt}. Chỉ trả về mã Mermaid, không có text giải thích.`
            }
        ],
        temperature: aiConfig.temperature,
        max_tokens: 1000
    };
    
    // Gửi request
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    let mermaidCode = data.choices[0].message.content.trim();
    
    // Làm sạch mã (loại bỏ markdown code block nếu có)
    mermaidCode = mermaidCode.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
    
    return mermaidCode;
}

function getDefaultEndpoint(model) {
    if (model.includes('gpt')) {
        return 'https://api.openai.com/v1/chat/completions';
    } else if (model.includes('claude')) {
        return 'https://api.anthropic.com/v1/messages';
    } else if (model.includes('gemini')) {
        return 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }
    return 'https://api.openai.com/v1/chat/completions';
}

function generateMockMermaid(prompt) {
    // Mock AI cho mục đích demo
    const mockResponses = [
        `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`,
    
        `flowchart TD
    A[Login] --> B{Valid Credentials?}
    B -->|Yes| C[Access Dashboard]
    B -->|No| D[Show Error]
    C --> E[End]
    D --> F[Return to Login]`,
    
        `graph LR
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
    B --> E[Server 3]
    C --> F[Database]
    D --> F
    E --> F`
    ];
    
    // Trả về một response ngẫu nhiên từ mẫu
    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    return mockResponses[randomIndex];
}

function applyDraftToEditor() {
    if (!draftMermaidCode) {
        alert('Không có bản nháp để áp dụng!');
        return;
    }
    
    mermaidCodeEl.value = draftMermaidCode;
    renderMermaid();
    
    // Thông báo
    const originalText = applyDraft.innerHTML;
    applyDraft.innerHTML = '<i class="fas fa-check"></i> Đã áp dụng!';
    
    setTimeout(() => {
        applyDraft.innerHTML = originalText;
    }, 2000);
}

function clearDraftMode() {
    if (confirm('Bạn có chắc chắn muốn xóa bản nháp?')) {
        draftMermaidCode = '';
        draftMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Chế độ bản nháp cho phép bạn thử nghiệm mà không ảnh hưởng đến mã chính. Hãy mô tả sơ đồ bạn muốn thử.</p>
                </div>
            </div>
        `;
        draftInput.value = '';
        renderDraft();
    }
}

// Quản lý tin nhắn
function addMessage(container, content, type = 'ai') {
    const messageId = 'msg-' + Date.now();
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}-message`;
    messageEl.id = messageId;
    messageEl.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${type === 'ai' ? 'robot' : 'user'}"></i>
        </div>
        <div class="message-content">
            <p>${content}</p>
        </div>
    `;
    container.appendChild(messageEl);
    container.scrollTop = container.scrollHeight;
    return messageId;
}

function updateMessage(messageId, content) {
    const messageEl = document.getElementById(messageId);
    if (messageEl) {
        const contentEl = messageEl.querySelector('.message-content');
        contentEl.innerHTML = content;
    }
}

// Quản lý cấu hình AI
function loadAIConfig() {
    const savedConfig = localStorage.getItem('flowchart-ai-config');
    if (savedConfig) {
        aiConfig = JSON.parse(savedConfig);
        apiKeyEl.value = aiConfig.apiKey;
        aiModelEl.value = aiConfig.model;
        temperatureEl.value = aiConfig.temperature;
        tempValueEl.textContent = aiConfig.temperature;
        if (aiConfig.endpoint) {
            apiEndpointEl.value = aiConfig.endpoint;
        }
    }
}

function saveAIConfig() {
    aiConfig.apiKey = apiKeyEl.value.trim();
    aiConfig.model = aiModelEl.value;
    aiConfig.temperature = parseFloat(temperatureEl.value);
    aiConfig.endpoint = apiEndpointEl.value.trim();
    
    localStorage.setItem('flowchart-ai-config', JSON.stringify(aiConfig));
    
    // Thông báo
    const originalText = saveConfigBtn.innerHTML;
    saveConfigBtn.innerHTML = '<i class="fas fa-check"></i> Đã lưu!';
    saveConfigBtn.classList.add('btn-success');
    
    setTimeout(() => {
        saveConfigBtn.innerHTML = originalText;
        saveConfigBtn.classList.remove('btn-success');
    }, 2000);
}

function resetAIConfig() {
    if (confirm('Bạn có chắc chắn muốn đặt lại cấu hình AI?')) {
        aiConfig = {
            apiKey: '',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            endpoint: ''
        };
        
        localStorage.removeItem('flowchart-ai-config');
        
        apiKeyEl.value = '';
        aiModelEl.value = 'gpt-3.5-turbo';
        temperatureEl.value = 0.7;
        tempValueEl.textContent = '0.7';
        apiEndpointEl.value = '';
        
        alert('Cấu hình AI đã được đặt lại!');
    }
}

// Tiện ích
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}