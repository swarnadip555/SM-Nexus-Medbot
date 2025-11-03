// Configuration
const API_URL = 'http://localhost:3000';

// Generate unique session ID
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// DOM Elements
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const typingIndicator = document.getElementById('typingIndicator');

// Initialize
let isFirstMessage = true;

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Enable/disable send button
    sendBtn.disabled = this.value.trim() === '';
});

// Send message on Enter (Shift+Enter for new line)
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send button click
sendBtn.addEventListener('click', sendMessage);

// Clear chat button
clearBtn.addEventListener('click', clearChat);

// Suggestion buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('suggestion-btn')) {
        const message = e.target.getAttribute('data-message');
        messageInput.value = message;
        sendBtn.disabled = false;
        sendMessage();
    }
});

// Send message function
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Remove welcome message on first message
    if (isFirstMessage) {
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        isFirstMessage = false;
    }

    // Add user message
    addMessage(message, 'user');

    // Show typing indicator
    typingIndicator.style.display = 'flex';

    // Scroll to bottom
    scrollToBottom();

    try {
        // Send to backend
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                sessionId: sessionId
            })
        });

        // Hide typing indicator
        typingIndicator.style.display = 'none';

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get response');
        }

        const data = await response.json();

        // Add bot message
        addMessage(data.reply, 'bot');

    } catch (error) {
        console.error('Error:', error);
        typingIndicator.style.display = 'none';
        
        // Show error message
        showError(error.message || 'Failed to connect to server. Please make sure the backend is running.');
    }

    // Scroll to bottom
    scrollToBottom();
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = getCurrentTime();

    contentDiv.appendChild(timestamp);
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);

    scrollToBottom();
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    chatContainer.appendChild(errorDiv);
    scrollToBottom();
}

// Clear chat
async function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        try {
            await fetch(`${API_URL}/api/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: sessionId })
            });

            // Clear chat container
            chatContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🏥</div>
                    <h2>Welcome to Medical AI Assistant</h2>
                    <p>I'm here to help answer your health questions and provide general medical information.</p>
                    <div class="suggestions">
                        <button class="suggestion-btn" data-message="What are the symptoms of common cold?">Common Cold Symptoms</button>
                        <button class="suggestion-btn" data-message="How can I improve my sleep quality?">Sleep Tips</button>
                        <button class="suggestion-btn" data-message="What are healthy eating habits?">Healthy Eating</button>
                        <button class="suggestion-btn" data-message="How to manage stress effectively?">Stress Management</button>
                    </div>
                </div>
            `;
            
            isFirstMessage = true;
        } catch (error) {
            console.error('Error clearing chat:', error);
            alert('Failed to clear chat history');
        }
    }
}

// Scroll to bottom
function scrollToBottom() {
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

// Get current time
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

// Check server health on load
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            console.log('✅ Connected to server successfully');
        }
    } catch (error) {
        console.error('❌ Cannot connect to server:', error);
        showError('Cannot connect to server. Please make sure the backend is running on port 3000.');
    }
}

// Initialize
checkServerHealth();