# Teste em Development

Passo a passo para testar a API localmente com HMAC válido, sem depender do Roblox.

## Variáveis de Ambiente

Configure no terminal antes de iniciar:

- `NODE_ENV=development`
- `ROBLOX_SECRET=<sua-chave>`
- `DISCORD_WEBHOOK=<url-que-aceita POST>` (para testes, `https://httpbin.org/post`)
- Opcional: `PORT=3000`

## Iniciar o Servidor

```powershell
npm run start:dev
```

## Gerar Assinatura e Enviar Requisição (PowerShell)

```powershell
$env:ROBLOX_SECRET='testsecret'
$env:TS=[string][int64]([DateTimeOffset]::Now.ToUnixTimeMilliseconds())
$env:BODY='{"keyName":"premium","username":"Player123"}'
$sig = node -e "const crypto=require('crypto'); const ts=process.env.TS; const body=process.env.BODY; const secret=process.env.ROBLOX_SECRET; const data=ts+'.'+body; console.log(crypto.createHmac('sha256', secret).update(data).digest('hex'));"
Invoke-RestMethod -Method Post -Uri http://localhost:3000/roblox/validate-player -Headers @{ 'Content-Type'='application/json'; 'x-timestamp'=$env:TS; 'x-signature'=$sig } -Body $env:BODY | ConvertTo-Json -Depth 5
```

## Usando Postman

- Método: `POST`
- URL: `http://localhost:3000/roblox/validate-player`
- Body (raw, JSON):

```json
{
  "keyName": "premium",
  "username": "TestPlayer"
}
```

- Headers:
  - `Content-Type: application/json`
  - `x-timestamp: {{timestamp}}`
  - `x-signature: {{signature}}`

### Pre-request Script (gera assinatura)

```javascript
const SECRET = "7DU129Y8NHBD8UNHB2187UHNBD2SW"; // Mesma chave do ROBLOX_SECRET no .env

const body = pm.request.body.raw;
const jsonBody = JSON.parse(body);

const timestamp = Date.now().toString();

const payload = JSON.stringify(jsonBody);
const dataToSign = `${timestamp}.${payload}`;

const signature = CryptoJS.HmacSHA256(dataToSign, SECRET).toString(CryptoJS.enc.Hex);

pm.environment.set("timestamp", timestamp);
pm.environment.set("signature", signature);

```

## Resposta Esperada (DEV)

```json
{
  "ok": true,
  "script": "...lua..."
}
```
