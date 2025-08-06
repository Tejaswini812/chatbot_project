// Real Telephony Integration for Private Calls
// This file handles real phone call functionality using Twilio API

// Global variables for call management
let currentCall = null;
let callTimer = null;
let callStartTime = null;

// Initialize Private Call
function initiatePrivateCall(memberName, memberID, phoneNumber) {
    console.log('Initiating private call to:', memberName, memberID, phoneNumber);
    let phone = phoneNumber;
    // Fallback to userData if phoneNumber not provided
    if (!phone && typeof userData !== 'undefined') {
        const member = userData.find(user => user[0] === memberID);
        if (member) {
            phone = member[8] || '+1234567890';
        }
    }
    if (!phone) {
        showNotification('Phone number not found', 'error');
        return;
    }
    showCallUI(memberName, memberID, phone);
    makeRealCall(memberName, memberID, phone);
}

// Show Call UI
function showCallUI(memberName, memberID, phoneNumber) {
    const chatbox = document.getElementById('chatbox');
    
    // Create call interface
    const callDiv = document.createElement('div');
    callDiv.className = 'message bot call-container';
    callDiv.id = `call-${memberID}`;
    callDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 1.5rem; border-radius: 15px; margin: 1rem 0; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-phone" style="font-size: 1.5rem;"></i>
                </div>
                <div>
                    <div style="font-size: 1.2rem; font-weight: bold;">${memberName}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Member ID: ${memberID}</div>
                </div>
            </div>
            
            <div id="callStatus-${memberID}" style="margin: 1rem 0; font-size: 1rem;">
                <i class="fas fa-spinner fa-spin"></i> Connecting...
            </div>
            
            <div id="callTimer-${memberID}" style="font-size: 1.5rem; font-weight: bold; margin: 1rem 0; display: none;">
                00:00
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1rem;">
                <button onclick="endCall('${memberID}')" style="background: #e74c3c; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 25px; cursor: pointer; font-weight: bold;">
                    <i class="fas fa-phone-slash"></i> End Call
                </button>
                <button onclick="muteCall('${memberID}')" id="muteBtn-${memberID}" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 25px; cursor: pointer;">
                    <i class="fas fa-microphone"></i> Mute
                </button>
            </div>
        </div>
    `;
    
    chatbox.appendChild(callDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Make Real Call via Backend
async function makeRealCall(memberName, memberID, phoneNumber) {
    try {
        // Check if backend server is running
        const response = await fetch('http://localhost:3000/api/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: phoneNumber,
                memberName: memberName,
                memberID: memberID
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            handleCallConnected(memberID, data.callSid);
            showNotification(`Calling ${memberName}...`, 'success');
        } else {
            throw new Error('Backend server not responding');
        }
        
    } catch (error) {
        console.log('Backend not available, using demo mode:', error);
        // Fallback to demo mode if backend is not running
        handleDemoCall(memberID, memberName);
    }
}

// Handle Real Call Connected
function handleCallConnected(memberID, callSid) {
    const statusElement = document.getElementById(`callStatus-${memberID}`);
    const timerElement = document.getElementById(`callTimer-${memberID}`);
    
    if (statusElement) {
        statusElement.innerHTML = '<i class="fas fa-phone"></i> Connected';
        statusElement.style.color = '#2ecc71';
    }
    
    if (timerElement) {
        timerElement.style.display = 'block';
        startCallTimer(memberID);
    }
    
    currentCall = {
        memberID: memberID,
        callSid: callSid,
        startTime: Date.now()
    };
}

// Handle Demo Call (when backend is not available)
function handleDemoCall(memberID, memberName) {
    const statusElement = document.getElementById(`callStatus-${memberID}`);
    
    // Simulate connection delay
    setTimeout(() => {
        if (statusElement) {
            statusElement.innerHTML = '<i class="fas fa-phone"></i> Connected (Demo Mode)';
            statusElement.style.color = '#f39c12';
        }
        
        const timerElement = document.getElementById(`callTimer-${memberID}`);
        if (timerElement) {
            timerElement.style.display = 'block';
            startCallTimer(memberID);
        }
        
        currentCall = {
            memberID: memberID,
            callSid: 'demo-call',
            startTime: Date.now()
        };
        
        showNotification(`Demo call connected to ${memberName}`, 'success');
    }, 2000);
}

// Start Call Timer
function startCallTimer(memberID) {
    callStartTime = Date.now();
    callTimer = setInterval(() => {
        const elapsed = Date.now() - callStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        const timerElement = document.getElementById(`callTimer-${memberID}`);
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// End Call Function
async function endCall(memberID) {
    if (!currentCall || currentCall.memberID !== memberID) {
        console.log('No active call to end');
        return;
    }
    
    // Clear timer
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
    
    // Try to end real call via backend
    try {
        if (currentCall.callSid !== 'demo-call') {
            await fetch('http://localhost:3000/api/end-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    callSid: currentCall.callSid
                })
            });
        }
    } catch (error) {
        console.log('Could not end call via backend:', error);
    }
    
    // Update UI
    const statusElement = document.getElementById(`callStatus-${memberID}`);
    if (statusElement) {
        statusElement.innerHTML = '<i class="fas fa-phone-slash"></i> Call Ended';
        statusElement.style.color = '#e74c3c';
    }
    
    // Remove call UI after delay
    setTimeout(() => {
        const callElement = document.getElementById(`call-${memberID}`);
        if (callElement) {
            callElement.remove();
        }
    }, 3000);
    
    currentCall = null;
    showNotification('Call ended', 'info');
}

// Mute/Unmute Call
function muteCall(memberID) {
    const muteBtn = document.getElementById(`muteBtn-${memberID}`);
    if (!muteBtn) return;
    
    const isMuted = muteBtn.innerHTML.includes('microphone-slash');
    
    if (isMuted) {
        muteBtn.innerHTML = '<i class="fas fa-microphone"></i> Mute';
        muteBtn.style.background = 'rgba(255,255,255,0.2)';
        showNotification('Microphone unmuted', 'info');
    } else {
        muteBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Unmute';
        muteBtn.style.background = '#e74c3c';
        showNotification('Microphone muted', 'info');
    }
}

// Check Call Status (for real calls)
async function checkCallStatus(callSid) {
    try {
        const response = await fetch(`http://localhost:3000/api/call-status/${callSid}`);
        if (response.ok) {
            const data = await response.json();
            return data.status;
        }
    } catch (error) {
        console.log('Could not check call status:', error);
    }
    return null;
}

// Initialize telephony when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Telephony system initialized');
    
    // Check if backend is available
    fetch('http://localhost:3000/api/health')
        .then(response => {
            if (response.ok) {
                console.log('Telephony backend is available');
                // Removed popup notification for real calling enabled
            } else {
                throw new Error('Backend not healthy');
            }
        })
        .catch(error => {
            console.log('Telephony backend not available, using demo mode');
            // Removed popup notification for demo calling mode
        });
});
