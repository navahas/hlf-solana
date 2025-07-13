
curl -X POST http://localhost:5551/createUser \
      -H "Content-Type: application/json" \
      -d '{"id": "alice"}'


curl -X POST http://localhost:5551/createUser \
      -H "Content-Type: application/json" \
      -d '{"id": "bob"}'


curl -X POST http://localhost:5551/encryptMessage \
      -H "Content-Type: application/json" \
      -d '{
        "senderId": "alice",
        "recipientId": "bob",
        "message": "Hello Bob, this is secret!"
      }'


curl -X POST http://localhost:5551/decryptMessage \
      -H "Content-Type: application/json" \
      -d '{
        "recipientId": "bob",
        "senderId": "alice",
        "encryptedMessage": {
            "encryptedData": "247cb1ce4fd9621f614b88a69b3e5301dd77f8c01ae4b29a2c75",
            "iv": "35c585d2ece903d3fc4048b02e65e29b",
            "authTag": "190ad397f7ddd10a039314281a8f2cfa"
        }
      }'
