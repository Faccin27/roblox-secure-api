# Guia de Teste no Postman

Este guia explica como testar a API Roblox Secure no Postman.

## 📋 Pré-requisitos

1. **Variável de Ambiente**: Certifique-se de que a variável `ROBLOX_SECRET` está configurada no arquivo `.env`
2. **Servidor Rodando**: Inicie o servidor NestJS com `npm run start:dev`
3. **URL Base**: Anote a URL base (geralmente `http://localhost:3000`)

## 🔧 Configuração no Postman

### Passo 1: Criar Nova Requisição

1. Abra o Postman
2. Clique em "New" → "HTTP Request"
3. Configure:
   - **Método**: `POST`
   - **URL**: `http://localhost:3000/roblox/validate-player`

### Passo 2: Configurar Body

Vá para a aba **Body**:
- Selecione **raw**
- Selecione **JSON** no dropdown
- Cole o seguinte JSON:

```json
{
  "keyName": "premium",
  "username": "TestPlayer"
}
```

### Passo 3: Configurar Headers

Vá para a aba **Headers** e adicione:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `x-timestamp` | `{{timestamp}}` |
| `x-signature` | `{{signature}}` |

**Nota**: Usaremos variáveis do Postman para calcular a assinatura automaticamente.

### Passo 4: Script Pre-request (Automático)

Na aba **Pre-request Script**, cole o seguinte código:

```javascript
// Configuração - ALTERE AQUI COM SUA CHAVE SECRETA
const SECRET = "sua-chave-secreta-aqui"; // Mesma chave do ROBLOX_SECRET no .env

// Obter o body da requisição
const body = pm.request.body.raw;
const jsonBody = JSON.parse(body);

// Gerar timestamp em milissegundos
const timestamp = Date.now().toString();

// Calcular assinatura HMAC
const crypto = require('crypto');
const payload = JSON.stringify(jsonBody);
const data = `${timestamp}.${payload}`;
const signature = crypto.createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');

// Definir variáveis para usar nos headers
pm.environment.set('timestamp', timestamp);
pm.environment.set('signature', signature);
```

**IMPORTANTE**: Altere `SECRET` para a mesma chave que está no seu arquivo `.env` como `ROBLOX_SECRET`.

### Passo 5: Atualizar Headers com Variáveis

Volte para a aba **Headers** e atualize:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `x-timestamp` | `{{timestamp}}` |
| `x-signature` | `{{signature}}` |

### Passo 6: Enviar Requisição

Clique em **Send** e você deve receber:

```json
{
  "ok": true
}
```

## 🧪 Teste Manual (Sem Pre-request Script)

Se preferir calcular a assinatura manualmente, você pode usar este script Node.js:

### Script: `calculate-hmac.js`

Crie um arquivo `calculate-hmac.js` na raiz do projeto:

```javascript
const crypto = require('crypto');

// CONFIGURAÇÃO - ALTERE AQUI
const SECRET = process.env.ROBLOX_SECRET || 'sua-chave-secreta';
const body = {
  keyName: "premium",
  username: "TestPlayer"
};

// Calcular
const timestamp = Date.now().toString();
const payload = JSON.stringify(body);
const data = `${timestamp}.${payload}`;
const signature = crypto.createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');

console.log('\n=== Dados para Postman ===\n');
console.log('URL:', 'http://localhost:3000/roblox/validate-player');
console.log('Method:', 'POST');
console.log('\nHeaders:');
console.log('  Content-Type: application/json');
console.log('  x-timestamp:', timestamp);
console.log('  x-signature:', signature);
console.log('\nBody:');
console.log(JSON.stringify(body, null, 2));
console.log('\n');
```

Execute com:
```bash
node calculate-hmac.js
```

Depois copie os valores para o Postman.

## ✅ Verificação de Sucesso

Se tudo estiver correto, você verá:

1. **Status**: `200 OK`
2. **Response Body**:
   ```json
   {
     "ok": true
   }
   ```
3. **Webhook Discord**: Uma mensagem deve aparecer no Discord com os dados da requisição

## ❌ Erros Comuns

### 401 - Missing signature headers
**Causa**: Headers `x-signature` ou `x-timestamp` não foram enviados.
**Solução**: Verifique se os headers estão configurados corretamente.

### 401 - Invalid signature
**Causa**: A assinatura calculada não corresponde à esperada.
**Soluções**:
- Verifique se a chave secreta (`ROBLOX_SECRET`) está correta no `.env`
- Certifique-se de que o body JSON está exatamente igual ao usado no cálculo
- Verifique se o timestamp está sendo usado corretamente
- O formato deve ser: `timestamp.JSON.stringify(body)`

### 429 - Rate limit exceeded
**Causa**: Muitas requisições em pouco tempo (limite: 30/min).
**Solução**: Aguarde um minuto ou reinicie o servidor.

## 🔍 Debug

Para debugar, adicione este código no **Tests** do Postman:

```javascript
// Verificar resposta
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has ok: true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.ok).to.eql(true);
});

// Log para debug
console.log("Timestamp usado:", pm.environment.get('timestamp'));
console.log("Signature calculada:", pm.environment.get('signature'));
console.log("Body enviado:", pm.request.body.raw);
```

## 📝 Exemplo Completo de Requisição

### Headers:
```
Content-Type: application/json
x-timestamp: 1701234567890
x-signature: a1b2c3d4e5f6... (64 caracteres hex)
```

### Body:
```json
{
  "keyName": "premium",
  "username": "TestPlayer"
}
```

### Response Esperada:
```json
{
  "ok": true
}
```

## 🎯 Dicas

1. **Use Environment Variables**: Crie um ambiente no Postman para facilitar a troca entre desenvolvimento e produção
2. **Salve a Requisição**: Salve como "Roblox Validate Player" para reutilizar
3. **Teste Diferentes Valores**: Teste com diferentes `keyName` e `username`
4. **Verifique o Discord**: Confirme que o webhook está funcionando verificando o Discord

