import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectFabric } from './hlf.js';
import { ethers } from 'ethers';
const app = express();

const port = 5551;

app.use(cors());
app.use(bodyParser.json());



const pingContract = await connectFabric("PingContract");

app.get('/ping', async (req, res) => {
    try {
        const result = await pingContract.submitTransaction('ping');
        console.log(result);
        res.json({ result: Buffer.from(result).toString('utf-8') });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/pingHola/:name', async (req, res) => {
    try {
        const result = await pingContract.submitTransaction('pingHola', req.params.name);
        console.log(result);
        res.json({ result: Buffer.from(result).toString('utf-8') });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.get('/ping2/:name', async (req, res) => {
    try {
        const result = await pingContract.submitTransaction('ping2', req.params.name);
        console.log(result);
        res.json({ result: Buffer.from(result).toString('utf-8') });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/decodeTransaction", async (req, res) => {
    const data = req.body.data;
    try {
        // Parse the transaction data from the request
        const transaction = ethers.Transaction.from(data);

        // Decode and extract relevant transaction details
        const decodedTransaction = {
            to: transaction.to,
            from: transaction.from,
            value: ethers.formatEther(transaction.value),
            nonce: transaction.nonce,
            gasLimit: transaction.gasLimit.toString(),
            gasPrice: transaction.gasPrice ? ethers.formatUnits(transaction.gasPrice, 'gwei') : null,
            data: transaction.data,
            chainId: transaction.chainId,
            type: transaction.type
        };

        res.json({ 
            success: true,
            transaction: decodedTransaction 
        });
    } catch (error) {
        console.error('Error decoding transaction:', error);
        res.status(400).json({ 
            success: false,
            error: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;
