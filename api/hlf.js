import * as grpc  from "@grpc/grpc-js"
import { signers, connect } from "@hyperledger/fabric-gateway"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import { dirname } from 'node:path';

const __dirname = dirname(".");

const ROOT = path.resolve(__dirname, "../fabric-samples/test-network")
const BASE = `${ROOT}/organizations/peerOrganizations/org1.example.com`
const CERT_USER = fs.readFileSync(`${BASE}/users/User1@org1.example.com/msp/signcerts/cert.pem`).toString()
const keyDir = `${BASE}/users/User1@org1.example.com/msp/keystore`;
const keyFiles = fs.readdirSync(keyDir);
const keyFilePath = path.join(keyDir, keyFiles[0]);
const KEY_USER = fs.readFileSync(keyFilePath).toString()
const CHANNEL = "mychannel"
const CHAINCODE = "basicts"
const MSPID = "Org1MSP"
const peerEndpoint = 'localhost:7051'
const peerHostAlias =  'peer0.org1.example.com';
const tlsCertPath = fs.readFileSync(`${BASE}/peers/peer0.org1.example.com/tls/ca.crt`).toString()

async function newGrpcConnection(){
    const tlsCredentials = grpc.credentials.createSsl(Buffer.from(tlsCertPath));
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    }); 
}

export async function connectFabric(contractName) {
    let client = null
    // connection to the peer
    try {
        client = await newGrpcConnection()
    } catch (error) {
        console.log("error", error)
        throw error
    }

    // creation of identity
    const identity = {
        mspId: MSPID,
        credentials: Buffer.from(CERT_USER)
    }

    // const signer
    const privateKey = crypto.createPrivateKey(Buffer.from(KEY_USER))
    const signer = signers.newPrivateKeySigner(privateKey)

    // // connection to the gateway 
    try {
        const gateway =  connect({ client, identity, signer })
        const network = gateway.getNetwork(CHANNEL)

        const contract = network.getContract(CHAINCODE, contractName)
        return contract
    } catch (error) {
        console.log("error", error)
        throw error
    }
}
