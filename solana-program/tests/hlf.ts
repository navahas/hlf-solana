import * as grpc from '@grpc/grpc-js';
import fabricGateway from '@hyperledger/fabric-gateway';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const { connect, signers } = fabricGateway;
const __dirname = path.resolve();
const ROOT = path.resolve(__dirname, '../fabric-samples/test-network');
const BASE = `${ROOT}/organizations/peerOrganizations/org1.example.com`;
const MSPID = 'Org1MSP';
const CHANNEL = 'mychannel';
const CHAINCODE = 'basicts';
const peerEndpoint = 'localhost:7051';
const peerHostAlias = 'peer0.org1.example.com';

function getCertificate(): string {
    const certDir = `${BASE}/users/User1@org1.example.com/msp/signcerts`;
    const certFile = fs.readdirSync(certDir)[0];
    return fs.readFileSync(path.join(certDir, certFile)).toString();
}

function getPrivateKey(): string {
    const keyDir = `${BASE}/users/User1@org1.example.com/msp/keystore`;
    const keyFile = fs.readdirSync(keyDir)[0];
    return fs.readFileSync(path.join(keyDir, keyFile)).toString();
}

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsCertPath = `${BASE}/peers/peer0.org1.example.com/tls/ca.crt`;
    const tlsCert = fs.readFileSync(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

export async function connectFabric(contractName: string) {
    const client = await newGrpcConnection();
    const identity = {
        mspId: MSPID,
        credentials: Buffer.from(getCertificate()),
    };

    const privateKey = crypto.createPrivateKey(Buffer.from(getPrivateKey()));
    const signer = signers.newPrivateKeySigner(privateKey);
    const gateway = connect({ client, identity, signer });
    const network = gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CHAINCODE, contractName);
    return contract;
}
