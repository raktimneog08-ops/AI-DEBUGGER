console.log("App initializing...");
const apiKeyInput = document.getElementById('api-key');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-chat-btn');

    const SYSTEM_PROMPT = `You are an expert Code Debugger chat bot.
Your audience is web developers, app makers, and tech students. 
Objective: fix bugs, resolve errors, explain complex code.
Tone: accurate, detailed, and highly technical yet accessible.
Format your responses using Markdown. Always explain WHY the bug occurs and provide the CORRECTED code. Keep responses perfectly suited for UI parsing.`;

    let conversationHistory = [
        { role: "system", content: SYSTEM_PROMPT }
    ];

    // Load saved API key
    const savedKey = localStorage.getItem('geminikey');
    if (savedKey) apiKeyInput.value = savedKey;

    apiKeyInput.addEventListener('change', (e) => {
        localStorage.setItem('geminikey', e.target.value.trim());
    });

    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') this.style.height = 'auto';
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);
    clearBtn.addEventListener('click', clearChat);

    function clearChat() {
        conversationHistory = [{ role: "system", content: SYSTEM_PROMPT }];
        const introMessage = chatBox.querySelector('.intro-message');
        chatBox.innerHTML = '';
        if (introMessage) chatBox.appendChild(introMessage);
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            userInput.value = '';
            addMessageToUI('bot', '**Error:** Please enter your Google Gemini API Key in the left settings panel first.', true);
            return;
        }

        // Add User Message to UI and History
        addMessageToUI('user', text);
        conversationHistory.push({ role: "user", content: text });
        
        userInput.value = '';
        userInput.style.height = 'auto';

        const loadingId = 'loading-' + Date.now();
        addLoadingIndicator(loadingId);

        const systemMessage = conversationHistory.find(m => m.role === 'system')?.content || '';
        const geminiContents = conversationHistory
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
                    contents: geminiContents,
                    generationConfig: {
                        temperature: 0.3
                    }
                })
            });

            removeLoadingIndicator(loadingId);

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to fetch response');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            
            // Create the bot message container directly
            const { wrap, contentDiv } = createMessageContainer('bot');
            chatBox.appendChild(wrap);
            chatBox.scrollTop = chatBox.scrollHeight;

            let fullContent = '';
            let buffer = '';
            let lastUpdateTime = 0;

            // Listen to the SSE Stream properly by buffering chunks
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                let strings = buffer.split('\n');
                
                // Keep the last partial line in the buffer
                buffer = strings.pop() || '';
                
                for (const line of strings) {
                    const trimmed = line.trim();
                    if (trimmed.includes('[DONE]')) break;
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmed.substring(6));
                            const delta = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (delta) {
                                fullContent += delta;
                                
                                const now = Date.now();
                                if (now - lastUpdateTime > 50) {
                                    // Add a pulsing block cursor to the end safely
                                    const markdownHtml = DOMPurify.sanitize(marked.parse(fullContent));
                                    contentDiv.innerHTML = markdownHtml + '<span class="streaming-cursor"></span>';
                                    chatBox.scrollTop = chatBox.scrollHeight;
                                    lastUpdateTime = now;
                                }
                            }
                        } catch(e) {
                            // Incomplete chunk JSON parse errors ignore
                        }
                    }
                }
            }

            if (buffer.trim()) {
                // If anything left
                try {
                    const trimmed = buffer.trim();
                    if (trimmed.startsWith('data: ') && !trimmed.includes('[DONE]')) {
                        const data = JSON.parse(trimmed.substring(6));
                        const delta = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (delta) fullContent += delta;
                    }
                } catch(e) {}
            }

            // Cleanup & apply Syntax Highlighting
            const finalHtml = DOMPurify.sanitize(marked.parse(fullContent || 'Sorry, no response.'));
            contentDiv.innerHTML = finalHtml;
            processCodeBlocks(contentDiv);
            
            conversationHistory.push({ role: "assistant", content: fullContent });
            chatBox.scrollTop = chatBox.scrollHeight;

        } catch (error) {
            removeLoadingIndicator(loadingId);
            addMessageToUI('bot', `**Error:** ${error.message}\n\nPlease check your API key and try again.`, true);
        }
    }

    function createMessageContainer(type) {
        const wrap = document.createElement('div');
        wrap.className = `message ${type}`;

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = type === 'bot' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-code"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        wrap.appendChild(avatar);
        wrap.appendChild(contentDiv);
        return { wrap, contentDiv };
    }

    function addMessageToUI(type, content, parseMarkdown = false) {
        const { wrap, contentDiv } = createMessageContainer(type);

        if (parseMarkdown && type === 'bot') {
            contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(content));
            processCodeBlocks(contentDiv);
        } else {
            const paragraphs = content.split('\n');
            paragraphs.forEach(p => {
                if (p.trim() === '') return;
                const pTag = document.createElement('p');
                pTag.textContent = p;
                contentDiv.appendChild(pTag);
            });
        }

        chatBox.appendChild(wrap);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function processCodeBlocks(container) {
        container.querySelectorAll('pre code').forEach((block) => {
            // Highlight the code block
            hljs.highlightElement(block);

            // Wrap the pre tag to add custom header
            const pre = block.parentNode;
            if (pre.parentNode.classList.contains('code-block-wrapper')) return;

            const language = block.classList.contains('hljs') ? Array.from(block.classList).find(c => c.startsWith('language-'))?.replace('language-', '') : 'code';
            
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';

            const header = document.createElement('div');
            header.className = 'code-header';
            
            const langLabel = document.createElement('span');
            langLabel.textContent = (language || 'text').toUpperCase();
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
            
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(block.textContent).then(() => {
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy', 2000);
                });
            });

            header.appendChild(langLabel);
            header.appendChild(copyBtn);
            
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });
    }

    function addLoadingIndicator(id) {
        const { wrap, contentDiv } = createMessageContainer('bot');
        wrap.id = id;

        contentDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;

        chatBox.appendChild(wrap);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function removeLoadingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
