import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectFabric } from './hlf.js';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

const app = express();
const port = 5551;

app.use(cors());
app.use(bodyParser.json());

function hlfToJson(result) {
    return Buffer.from(result).toString('utf-8');
}

app.get('/ping', async (_req, res) => {
    const pingContract = await connectFabric("PingContract");
    try {
        const result = await pingContract.submitTransaction('ping');
        console.log(result);
        res.json(hlfToJson(result));
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});



const dhContract = await connectFabric("WalletContract");
// Create user (generates DH keypair)
app.post('/createUser', async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing user id' });

    try {
        const result = await dhContract.submitTransaction('createUser', id);
        const rJson = JSON.parse(hlfToJson(result));
        res.json(rJson);
    } catch (error) {
        console.error('CreateUser error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Encrypt message from sender to recipient
app.post('/encryptMessage', async (req, res) => {
    const { senderId, recipientId, message } = req.body;
    if (!senderId || !recipientId || !message) {
        return res.status(400).json({ error: 'Missing senderId, recipientId, or message' });
    }

    try {
        const result = await dhContract.submitTransaction('encryptMessage', senderId, recipientId, message);
        const rJson = JSON.parse(hlfToJson(result));
        res.json(rJson);
    } catch (error) {
        console.error('EncryptMessage error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Decrypt message received by recipient from sender
app.post('/decryptMessage', async (req, res) => {
    const { recipientId, senderId, encryptedMessage } = req.body;
    if (!recipientId || !senderId || !encryptedMessage) {
        return res.status(400).json({ error: 'Missing recipientId, senderId, or encryptedMessage' });
    }
    try {
        const { encryptedData, iv, authTag } = encryptedMessage;
        const result = await dhContract.submitTransaction(
            'decryptMessage',
            recipientId,
            senderId,
            encryptedData,
            iv,
            authTag
        );

        const rJson = JSON.parse(hlfToJson(result));
        res.json(rJson);
    } catch (error) {
        console.error('DecryptMessage error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;
