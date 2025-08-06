
function sendMessage() {
    const userInput = document.getElementById('userInput').value.trim();
    if (!userInput) return;
    const chatbox = document.getElementById('chatbox');
    // Show user message
    chatbox.innerHTML += `<div class="message user">${userInput}</div>`;
    // Fetch user info from backend
    fetch(`/api/user/${userInput}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // --- 3 BUTTONS CODE (old style) ---
                const name = data.name;
                const carNumber = data.carNumber;
                const whatsappLink = data.whatsapp;
                const privateCallLink = data.privateCall;
                const chatLink = data.chatLink;
                let buttons = '';
                if (whatsappLink) {
                    buttons += `<button onclick="window.open('${whatsappLink}', '_blank')" class="action-btn whatsapp-btn" style="flex: 1; padding: 0.8rem;"><i class='fab fa-whatsapp'></i> WhatsApp</button>`;
                }
                if (privateCallLink) {
                    buttons += `<button onclick="initiatePrivateCall('${name}', '${userInput}', '${data.phone}')" class="action-btn call-btn" style="flex: 1; padding: 0.8rem;"><i class='fas fa-phone'></i> Private Call</button>`;
                }
                if (chatLink) {
                    buttons += `<button onclick="openPrivateChat('${name}', '${userInput}')" class="action-btn chat-btn" style="flex: 1; padding: 0.8rem;"><i class='fas fa-comments'></i> Private Chat</button>`;
                }
                chatbox.innerHTML += `
                    <div class="message bot">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <strong style="color: #667eea; font-size: 1.2rem;">${name}</strong>
                                <div style="margin-top: 0.5rem;">
                                    <strong><i class="fas fa-car"></i> Car Number:</strong> 
                                    <span style="background: #f0f0f0; padding: 0.3rem 0.6rem; border-radius: 6px; font-family: monospace; font-weight: bold; color: #333;">${carNumber}</span>
                                </div>
                            </div>
                        </div>
                        <div class="action-buttons" style="margin-top: 1.5rem; display: flex; gap: 0.8rem;">
                            ${buttons}
                        </div>
                    </div>
                `;
            } else {
                chatbox.innerHTML += `<div class="message bot">User not found.</div>`;
            }
        })
        .catch(() => {
            chatbox.innerHTML += `<div class="message bot">Error fetching user info.</div>`;
        });
}

function openPrivateChat(memberName, memberID) {
    const chatbox = document.getElementById('chatbox');
    

    const privateChatDiv = document.createElement('div');
    privateChatDiv.className = 'message bot private-chat-container';
    privateChatDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; padding: 1rem; border-radius: 15px; margin: 1rem 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <i class="fas fa-lock"></i>
                <strong>Private Chat with Member #${memberID}</strong>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 0.8rem; border-radius: 10px; margin-bottom: 1rem;">
                <small><i class="fas fa-shield-alt"></i> Secure messaging - No personal details shared</small>
            </div>
            <div id="privateChatMessages-${memberID}" style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem; background: rgba(255,255,255,0.1); padding: 0.8rem; border-radius: 8px;">
                <div style="color: #ddd; font-style: italic;">Private chat session started. You can now message securely.</div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="privateMessage-${memberID}" placeholder="Type your private message..." style="flex: 1; padding: 0.5rem; border: none; border-radius: 8px; background: rgba(255,255,255,0.9); color: #333;">
                <button onclick="sendPrivateMessage('${memberID}')" style="padding: 0.5rem 1rem; background: #fff; color: #9b59b6; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    chatbox.appendChild(privateChatDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
    
    setTimeout(() => {
        document.getElementById(`privateMessage-${memberID}`).focus();
    }, 100);
}

function sendPrivateMessage(memberID) {
    const messageInput = document.getElementById(`privateMessage-${memberID}`);
    const messagesContainer = document.getElementById(`privateChatMessages-${memberID}`);
    
    if (!messageInput || !messagesContainer) return;
    
    const message = messageInput.value.trim();
    if (!message) return;

    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.2); border-radius: 8px; text-align: right;';
    userMsg.innerHTML = `<strong>You:</strong> ${message}`;
    messagesContainer.appendChild(userMsg);
    
    
   
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.style.cssText = 'margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 8px;';
        botMsg.innerHTML = `<strong>Member #${memberID}:</strong> Message received securely. This is a demo response.`;
        messagesContainer.appendChild(botMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
    
    messageInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


function showTypingIndicator() {
    const chatbox = document.getElementById('chatbox');
  
    const existingTyping = chatbox.querySelectorAll('.typing-indicator');
    existingTyping.forEach(indicator => indicator.remove());
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator';
    typingDiv.innerHTML = '<i class="fas fa-circle"></i><i class="fas fa-circle"></i><i class="fas fa-circle"></i>';
    chatbox.appendChild(typingDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function() {

    const userInput = document.getElementById("userInput");
    if (userInput) {
        userInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                sendMessage();
            }
        });
    }
  
    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && event.target.id.startsWith('privateMessage-')) {
            const memberID = event.target.id.replace('privateMessage-', '');
            sendPrivateMessage(memberID);
        }
    });
});
