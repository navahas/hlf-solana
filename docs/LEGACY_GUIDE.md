# Proyecto: Guia para el desarrollo PFM-TRAZA-HLF-2025

## Github

https://github.com/codecrypto-academy/pfm-traza-hlf-2025

## Preparacion del entorno de desarrollo con Hyperledger Fabric

### Prerequisitos

- Tener Docker instalado
- Instalar Fabric Samples
  1. https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html
  2. https://github.com/hyperledger/fabric-samples
  3. https://hyperledger-fabric.readthedocs.io/en/latest/getting_started_run_fabric.html

### Crear la red hlf

```bash
./network.sh up
```

### Crear la red un channey y un chaincode

```bash
./network.sh down &&  \
./network.sh up createChannel -c mychannel &&  \
./network.sh deployCCAAS  -ccn basicts -ccp ../asset-transfer-basic/chaincode-typescript
```

### Crear un proyecto ts para meter un chaincode y varios contratos

varibles de entorno
```bash
export CHAINCODE_SERVER_ADDRESS=host.docker.internal:9998
export CHAINCODE_ID=CHAINCODE_ID=basicts_1.0:0c2471e01863862d67b62d19420ae1fffc029c2cf6c3e3f12933a776d781204c
```

crear un contrato

```js
import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({ title: 'PingContract', description: 'Contrato para verificar conectividad' })
export class PingContract extends Contract {
    
    @Transaction()
    @Returns('string')
    public async ping(ctx: Context): Promise<string> {
        return 'Pong';
    }
} 
```

```bash
rem  "start": "tsc && set -x && fabric-chaincode-node server --chaincode-address=$CHAINCODE_SERVER_ADDRESS --chaincode-id=$CHAINCODE_ID"

npm start
```



### Crear un api que permita interactuar con el chaincode

#### ver directorio API

#### Firmar con el metamask
Aplicacion metamask

```js
import { ethers } from "ethers";
import { useWeb3 } from '@/context/Web3Context';
import { useState } from "react";

...
    const signedTx = await signer.signMessage(payload);

    
    console.log("Signed transaction:", signedTx);

    // Verify the signature
    const verifiedAddress = ethers.verifyMessage(payload, signedTx);
    
    ...
    

```
