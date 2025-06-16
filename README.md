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



# PFM WEB  3.Tokenización y Trazabilidad
https://github.com/codecrypto-academy/pfm-traza-hlf-2025

## Resumen Ejecutivo
El proyecto consiste en una plataforma descentralizada basada en Hyperledger Fabric que permite la trazabilidad completa de productos desde su origen hasta el consumidor final, utilizando registros digitales para representar materias primas y productos terminados.

## Objetivo
Crear un sistema transparente, seguro y descentralizado que permita rastrear el movimiento de materias primas y productos a través de toda la cadena de suministro, garantizando la autenticidad y procedencia de los mismos.

## Actores del Sistema

### 1. Productor (Producer)
- Responsable del ingreso de materias primas al sistema
- Registra las materias primas originales
- Solo puede transferir a Fábricas
- Registra información detallada sobre el origen y características de las materias primas

### 2. Fábrica (Factory)
- Recibe materias primas de los Productores
- Transforma materias primas en productos terminados
- Registra los productos terminados
- Solo puede transferir a Minoristas
- Registra información sobre el proceso de transformación

### 3. Minorista (Retailer)
- Recibe productos terminados de las Fábricas
- Distribuye productos a los consumidores finales
- Solo puede transferir a Consumidores

### 4. Consumidor (Consumer)
- Punto final de la cadena de suministro
- Recibe productos de los Minoristas
- Puede verificar toda la trazabilidad del producto

## Funcionalidades Clave

### 1. Gestión de Identidad
- Cada participante se identifica mediante certificados X.509
- El MSP (Membership Service Provider) gestiona las identidades
- Control de acceso basado en roles mediante políticas de endorsement
- Autenticación mediante Fabric CA

### 2. Registro de Activos
- Materias Primas:
  * Registros únicos para cada lote de materia prima
  * Metadata asociada (origen, características, certificaciones)
  * Trazabilidad desde el origen

- Productos:
  * Registros únicos para productos terminados
  * Vinculación con registros de materias primas utilizadas
  * Información del proceso de transformación

### 3. Sistema de Transferencias
- Transferencias direccionales según rol
- Sistema de aceptación/rechazo de transferencias
- Validación mediante políticas de endorsement

### 4. Trazabilidad
- Registro completo del ciclo de vida
- Visualización de la cadena de custodia
- Verificación de autenticidad
- Historia completa de transferencias

## Arquitectura Técnica

### 1. Frontend
- Framework: Next.js
- Características:
  * Paneles específicos por rol
  * Integración con Fabric SDK

### 2. Chaincode
- Funcionalidades:
  * Gestión de roles
  * Registro de activos
  * Sistema de transferencias
  * Registro de eventos
  * Validaciones de seguridad

### 3. Red Blockchain
- Red: Hyperledger Fabric
- Organizaciones: Usar Fabric Samples
- SDK: Fabric Gateway

## Despliegue

### 1. Red Fabric
- Despliegue mediante Fabric Samples
- Configuración de organizaciones y canales
- Gestión de certificados
- Monitoreo mediante Hyperledger Explorer

### 2. Frontend
- Plataforma: Vercel
- Configuración de dominios
- SSL/TLS
- Monitoreo y logs



