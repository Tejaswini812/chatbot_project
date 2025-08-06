const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const path = require('path');
require('dotenv').config();
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// CSV path for backend (keep outside public for security)
const csvPath = path.join(__dirname, 'UserData.csv');

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
let client = null;

// Initialize Twilio only if credentials are set
if (TWILIO_ACCOUNT_SID.startsWith('AC') && TWILIO_AUTH_TOKEN) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Store active calls
const activeCalls = new Map();

// ================== ROUTES ==================

// Root route -> Serve main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Smart_Connect.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// ================== TELEPHONY ROUTES ==================

app.post('/api/make-call', async (req, res) => {
    try {
        if (!client) {
            return res.status(500).json({ success: false, error: 'Twilio not configured.' });
        }

        const { to, memberID, callType = 'private' } = req.body;

        if (!to || !memberID) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: to, memberID'
            });
        }

        console.log(`Initiating ${callType} call to ${to} for member ${memberID}`);

        const twimlUrl = `${req.protocol}://${req.get('host')}/api/twiml/connect-call`;

        const call = await client.calls.create({
            to: to,
            from: TWILIO_PHONE_NUMBER,
            url: twimlUrl,
            method: 'POST',
            statusCallback: `${req.protocol}://${req.get('host')}/api/call-status-webhook`,
            statusCallbackMethod: 'POST',
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
        });

        activeCalls.set(call.sid, {
            callSid: call.sid,
            to: to,
            memberID: memberID,
            callType: callType,
            status: 'initiated',
            startTime: new Date(),
            endTime: null
        });

        res.json({
            success: true,
            callSid: call.sid,
            status: call.status,
            to: to,
            memberID: memberID
        });

    } catch (error) {
        console.error('Error making call:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initiate call'
        });
    }
});

app.get('/api/call-status/:callSid', async (req, res) => {
    try {
        if (!client) {
            return res.status(500).json({ success: false, error: 'Twilio not configured.' });
        }

        const { callSid } = req.params;

        const localCall = activeCalls.get(callSid);
        if (localCall) {
            const call = await client.calls(callSid).fetch();

            localCall.status = call.status;
            if (call.status === 'completed' && !localCall.endTime) {
                localCall.endTime = new Date();
            }

            res.json({
                success: true,
                callSid: callSid,
                status: call.status,
                duration: call.duration,
                memberID: localCall.memberID
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Call not found'
            });
        }

    } catch (error) {
        console.error('Error fetching call status:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch call status'
        });
    }
});

app.post('/api/end-call/:callSid', async (req, res) => {
    try {
        if (!client) {
            return res.status(500).json({ success: false, error: 'Twilio not configured.' });
        }

        const { callSid } = req.params;

        const call = await client.calls(callSid).update({ status: 'completed' });

        const localCall = activeCalls.get(callSid);
        if (localCall) {
            localCall.status = 'completed';
            localCall.endTime = new Date();
        }

        res.json({
            success: true,
            callSid: callSid,
            status: call.status
        });

    } catch (error) {
        console.error('Error ending call:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to end call'
        });
    }
});

app.post('/api/twiml/connect-call', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say({
        voice: 'alice',
        language: 'en-IN'
    }, 'Hello! You have received a private call through Cloud Shoppe Connect. Please hold while we connect you.');

    res.type('text/xml');
    res.send(twiml.toString());
});

app.post('/api/call-status-webhook', (req, res) => {
    const { CallSid, CallStatus } = req.body;

    const localCall = activeCalls.get(CallSid);
    if (localCall) {
        localCall.status = CallStatus;
        if (CallStatus === 'completed' && !localCall.endTime) {
            localCall.endTime = new Date();
        }
    }

    res.status(200).send('OK');
});

app.get('/api/calls', (req, res) => {
    const calls = Array.from(activeCalls.values());
    res.json({
        success: true,
        activeCalls: calls.length,
        calls: calls
    });
});

// ================== USER ROUTES ==================

app.get('/api/user/:userId', (req, res) => {
    const userId = (req.params.userId || '').trim();
    const results = [];
    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
            const normalized = {};
            for (const key in data) {
                normalized[key.trim()] = (data[key] || '').trim();
            }
            if (normalized.UserID && normalized.Name) results.push(normalized);
        })
        .on('end', () => {
            const user = results.find(u => (u.UserID || '').trim() === userId);
            if (user) {
                res.json({
                    success: true,
                    name: user.Name,
                    carNumber: user['Car Number'] || '',
                    whatsapp: user['WhatsApp Link'] || '',
                    privateCall: user['Private Call'] || '',
                    chatLink: user['Chat Link'] || ''
                });
            } else {
                res.json({ success: false, message: 'User not found' });
            }
        })
        .on('error', (err) => {
            res.status(500).json({ success: false, message: 'Could not access user data file.' });
        });
});

app.post('/api/signup', async (req, res) => {
    try {
        const { name, dob, email, phone, whatsapp, privateCall, chatLink, carNumber } = req.body;

        if (!name || !dob || !email || !phone || !carNumber) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        const correctHeader = 'UserID,Name,DOB,Email,Phone,WhatsApp Link,Private Call,Chat Link,Car Number\n';
        if (!fs.existsSync(csvPath)) {
            fs.writeFileSync(csvPath, correctHeader);
        } else {
            let current = fs.readFileSync(csvPath, 'utf8').split('\n')[0];
            if (current.trim() !== correctHeader.trim()) {
                fs.writeFileSync(csvPath, correctHeader);
            }
        }

        let data = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);
        let maxId = 100;
        for (let i = 1; i < data.length; i++) {
            let row = data[i].split(',');
            let id = parseInt(row[0]);
            if (!isNaN(id) && id > maxId) maxId = id;
        }

        const newId = maxId + 1;

        const newRow = [
            newId,
            name,
            dob,
            email,
            phone,
            whatsapp || '',
            privateCall || '',
            chatLink || '',
            carNumber
        ].map(x => (typeof x === 'string' && x.includes(',')) ? `"${x}"` : x).join(',');

        fs.appendFileSync(csvPath, '\n' + newRow);

        res.json({ success: true, message: 'Signup successful!', userId: newId });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// ================== ERROR HANDLERS ==================

app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 fallback (important for Render/Netlify refresh issues)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Smart_Connect.html'));
});

// ================== START SERVER ==================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📞 Telephony API ready`);
    console.log(`🔧 Make sure to configure your Twilio credentials in .env file`);
});
