# Documentação de Requisições - Roblox Secure API

Esta documentação explica como fazer requisições seguras do Roblox (Lua ServerScript) para a API Roblox Secure.

## 📋 Informações Gerais

- **Endpoint**: `POST /roblox/validate-player`
- **URL Base**: Configure a variável de ambiente `API_URL` no seu servidor Roblox
- **Autenticação**: HMAC SHA256 com chave secreta compartilhada
- **Content-Type**: `application/json`

## 🔐 Autenticação HMAC

A API utiliza autenticação HMAC para garantir a segurança das requisições. Você precisa:

1. **Chave Secreta**: Configure a mesma chave secreta (`ROBLOX_SECRET`) tanto no servidor quanto no Roblox
2. **Timestamp**: Gere um timestamp em milissegundos (Unix timestamp)
3. **Assinatura**: Calcule a assinatura HMAC SHA256 do payload

### Como Calcular a Assinatura

A assinatura é calculada da seguinte forma:

```
1. Serialize o body em JSON: payload = JSON.stringify(body)
2. Concatene timestamp e payload: data = timestamp + "." + payload
3. Calcule HMAC-SHA256: signature = HMAC-SHA256(secret, data)
4. Converta para hexadecimal: signature = signature.digest('hex')
```

**Exemplo:**
- Timestamp: `1701234567890`
- Body: `{"keyName":"premium","username":"Player123"}`
- Data para assinar: `1701234567890.{"keyName":"premium","username":"Player123"}`
- Assinatura: `HMAC-SHA256(secret, data)` em hexadecimal

## 📦 Estrutura do Body

O body da requisição deve ser um JSON com os seguintes campos:

```json
{
  "keyName": "string",    // Nome da chave/licença usada (ex: "premium", "vip", etc.)
  "username": "string"    // Nome de usuário do Roblox
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `keyName` | string | Identificador da chave/licença | `"premium"` |
| `username` | string | Nome de usuário do Roblox | `"Player123"` |

## 📡 Headers Necessários

Você deve incluir os seguintes headers na requisição:

| Header | Valor | Descrição |
|--------|-------|-----------|
| `Content-Type` | `application/json` | Tipo de conteúdo |
| `x-signature` | string (hex) | Assinatura HMAC SHA256 calculada |
| `x-timestamp` | string | Timestamp em milissegundos (Unix) |

## 💻 Exemplo de Código Lua (Roblox)

Aqui está um exemplo completo de como fazer a requisição no Roblox usando um ServerScript:

```lua
local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Configurações (configure estas variáveis)
local API_URL = "https://seu-servidor.com"  -- URL base da sua API
local ROBLOX_SECRET = "sua-chave-secreta-aqui"  -- Mesma chave do servidor

-- Função para calcular HMAC SHA256
local function calculateHMAC(secret, data)
    -- Nota: Roblox não tem suporte nativo para HMAC
    -- Você precisará usar uma biblioteca externa ou fazer via RemoteFunction
    -- Exemplo usando uma biblioteca HTTP que suporta HMAC:
    
    -- Para este exemplo, vamos usar uma abordagem com HttpService
    -- Em produção, considere usar um módulo externo ou fazer o cálculo no servidor
    
    -- ALTERNATIVA: Use um RemoteFunction para calcular HMAC de forma segura
    -- ou use uma biblioteca Lua que implementa HMAC-SHA256
end

-- Função para validar jogador
local function validatePlayer(player, keyName)
    local username = player.Name
    
    -- Preparar body
    local body = {
        keyName = keyName,
        username = username
    }
    
    -- Serializar body para JSON
    local jsonBody = HttpService:JSONEncode(body)
    
    -- Gerar timestamp (em milissegundos)
    local timestamp = tostring(os.time() * 1000)  -- Aproximação, use tick() para mais precisão
    
    -- Calcular assinatura
    -- IMPORTANTE: Você precisa implementar HMAC-SHA256
    -- Opção 1: Use uma biblioteca Lua externa
    -- Opção 2: Faça o cálculo em um servidor intermediário
    -- Opção 3: Use um RemoteFunction que calcula no servidor Roblox
    local dataToSign = timestamp .. "." .. jsonBody
    local signature = calculateHMAC(ROBLOX_SECRET, dataToSign)
    
    -- Preparar headers
    local headers = {
        ["Content-Type"] = "application/json",
        ["x-signature"] = signature,
        ["x-timestamp"] = timestamp
    }
    
    -- Fazer requisição
    local success, result = pcall(function()
        return HttpService:PostAsync(
            API_URL .. "/roblox/validate-player",
            jsonBody,
            Enum.HttpContentType.ApplicationJson,
            false,
            headers
        )
    end)
    
    if success then
        local response = HttpService:JSONDecode(result)
        if response.ok then
            print("Jogador validado com sucesso!")
            return true
        else
            warn("Falha na validação:", result)
            return false
        end
    else
        warn("Erro na requisição:", result)
        return false
    end
end

-- Exemplo de uso
game.Players.PlayerAdded:Connect(function(player)
    -- Validar quando o jogador entra
    validatePlayer(player, "premium")
end)
```

## 🔧 Implementação HMAC no Roblox

**IMPORTANTE**: Roblox não possui suporte nativo para HMAC-SHA256. Você tem algumas opções:

### Opção 1: Biblioteca Lua Externa
Use uma biblioteca Lua que implementa HMAC-SHA256 e carregue no Roblox:
- [lua-resty-hmac](https://github.com/jkeys089/lua-resty-hmac)
- [Crypto++ para Lua](https://github.com/somesocks/lua-lockbox)

### Opção 2: Servidor Intermediário
Crie um servidor intermediário que recebe os dados e calcula a assinatura antes de enviar para a API.

### Opção 3: RemoteFunction (Menos Seguro)
Use um RemoteFunction no Roblox que calcula a assinatura no servidor, mas isso é menos seguro pois a chave secreta ficaria no código Roblox.

### Opção 4: Exemplo Simplificado com HttpService

Se você tiver acesso a um servidor que calcula HMAC, pode fazer assim:

```lua
local HttpService = game:GetService("HttpService")

local function validatePlayer(player, keyName)
    local username = player.Name
    local body = {
        keyName = keyName,
        username = username
    }
    
    local jsonBody = HttpService:JSONEncode(body)
    local timestamp = tostring(tick() * 1000)
    
    -- Enviar para seu servidor intermediário que calcula HMAC
    local success, result = pcall(function()
        return HttpService:PostAsync(
            "https://seu-servidor-intermediario.com/sign-and-forward",
            HttpService:JSONEncode({
                body = body,
                timestamp = timestamp,
                endpoint = "/roblox/validate-player"
            }),
            Enum.HttpContentType.ApplicationJson
        )
    end)
    
    -- Seu servidor intermediário calcula HMAC e faz a requisição final
end
```

## 📝 Exemplo de Requisição HTTP (cURL)

Para testar a API diretamente, você pode usar cURL:

```bash
# Calcular timestamp
TIMESTAMP=$(date +%s%3N)

# Body da requisição
BODY='{"keyName":"premium","username":"Player123"}'

# Calcular assinatura (Node.js)
SIGNATURE=$(node -e "
const crypto = require('crypto');
const secret = 'sua-chave-secreta';
const data = '${TIMESTAMP}.${BODY}';
const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
console.log(hmac);
")

# Fazer requisição
curl -X POST https://seu-servidor.com/roblox/validate-player \
  -H "Content-Type: application/json" \
  -H "x-signature: ${SIGNATURE}" \
  -H "x-timestamp: ${TIMESTAMP}" \
  -d "${BODY}"
```

## ✅ Resposta da API

### Sucesso (200 OK)
```json
{
  "ok": true
}
```

### Erros Possíveis

#### 401 Unauthorized - Headers Faltando
```json
{
  "statusCode": 401,
  "message": "Missing signature headers"
}
```

#### 401 Unauthorized - Assinatura Inválida
```json
{
  "statusCode": 401,
  "message": "Invalid signature"
}
```

#### 429 Too Many Requests - Rate Limit
```json
{
  "ok": false,
  "message": "rate limit exceeded"
}
```

**Nota**: A API tem um limite de 30 requisições por minuto por IP.

## 🔒 Segurança

1. **Nunca exponha a chave secreta** no código do cliente Roblox
2. Use HTTPS sempre para proteger a comunicação
3. Considere usar um servidor intermediário para calcular HMAC
4. Valide sempre os dados antes de enviar
5. Implemente rate limiting no lado do cliente também

## 📚 Recursos Adicionais

- [Documentação HMAC](https://en.wikipedia.org/wiki/HMAC)
- [Roblox HttpService](https://create.roblox.com/docs/reference/engine/classes/HttpService)
- [NestJS Documentation](https://docs.nestjs.com/)

