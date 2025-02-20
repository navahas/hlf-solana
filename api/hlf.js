import * as grpc  from "@grpc/grpc-js"
import { signers, connect } from "@hyperledger/fabric-gateway"
import path from "node:path"
import fs from "node:fs"
import crypto from "node:crypto"
import { dirname } from 'node:path';

const __dirname = dirname(".");

//const ROOT = path.resolve(__dirname, "../fabric-samples/test-network")
const ROOT = "/Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network"
const BASE = `${ROOT}/organizations/peerOrganizations/org1.example.com`

// const BASE = "/Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com"
const CERT_USER = fs.readFileSync(`${BASE}/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem`).toString()
const KEY_USER = fs.readFileSync(`${BASE}/users/User1@org1.example.com/msp/keystore/priv_sk`).toString()
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
        const gateway =  await connect({ client, identity, signer })
        const network = gateway.getNetwork(CHANNEL)

        const contract = network.getContract(CHAINCODE, contractName)
        return contract
    } catch (error) {
        console.log("error", error)
        throw error
    }

   
}




/*
cryptoPath /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com
/Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore
certDirectoryPath /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts
tlsCertPath /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
peerEndpoint localhost:7051
peerHostAlias peer0.org1.example.com
channelName:       mychannel
chaincodeName:     basic
mspId:             Org1MSP
cryptoPath:        /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com
keyDirectoryPath:  /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore
certDirectoryPath: /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts
tlsCertPath:       /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
peerEndpoint:      localhost:7051
peerHostAlias:     peer0.org1.example.com
newIdentity
certPath /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem
keyPath /Users/joseviejo/go/src/github.com/Jviejo/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/priv_sk
**/