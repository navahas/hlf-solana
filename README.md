# Proyecto: Guia para el desarrollo PFM-TRAZA-HLF-2025

## Github

https://github.com/codecrypto-academy/pfm-traza-hlf-2025

## Preparacion del entorno de desarrollo con Hyperledger Fabric

### Prerequisitos

- Tener Docker instalado
- Instalar Fabric Samples
  1. https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html
  2. https://hyperledger.github.io/fabric-samples/

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

```bash

```

### Crear un api que permita interactuar con el chaincode

### Crear un front para interactuar con el api