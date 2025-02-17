import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectFabric } from './hlf.js';
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


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;
