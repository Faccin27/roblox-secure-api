# ServerScript Seguro (Roblox)

Este guia mostra como um ServerScript no Roblox pode fazer uma requisição segura para a API, assinando o payload com HMAC-SHA256 e recebendo um script Lua de resposta.

## Pré-requisitos

- `API_URL`: URL da sua API (ex.: `https://seu-servidor.com` ou `http://localhost:3000` para testes)
- `ROBLOX_SECRET`: chave secreta compartilhada com a API (mantida no servidor Roblox)
- Implementação de `HMAC-SHA256` disponível em Lua (módulo externo ou utilitário próprio)

## Exemplo de ServerScript

```lua
local HttpService = game:GetService("HttpService")

local API_URL = "http://localhost:3000" -- ajuste conforme seu ambiente
local ROBLOX_SECRET = "sua-chave-secreta" -- mantenha apenas no servidor

-- Substitua por sua implementação de HMAC-SHA256 que retorna HEX
local function calculateHMAC(secret, data)
    -- Ex.: usar módulo HMAC_SHA256_HEX(secret, data)
    error("Implemente calculateHMAC com HMAC-SHA256 HEX")
end

local function validatePlayer(player, keyName)
    local body = {
        keyName = keyName,
        username = player.Name,
    }

    local jsonBody = HttpService:JSONEncode(body)
    local ts = tostring(math.floor(tick() * 1000))
    local dataToSign = ts .. "." .. jsonBody
    local signature = calculateHMAC(ROBLOX_SECRET, dataToSign)

    local headers = {
        ["Content-Type"] = "application/json",
        ["x-timestamp"] = ts,
        ["x-signature"] = signature,
    }

    local ok, result = pcall(function()
        return HttpService:PostAsync(
            API_URL .. "/roblox/validate-player",
            jsonBody,
            Enum.HttpContentType.ApplicationJson,
            false,
            headers
        )
    end)

    if ok then
        local response = HttpService:JSONDecode(result)
        if response.ok and response.script then
            print("Validado com sucesso. Script recebido:")
            print(response.script)
            -- Salve o conteúdo em um ServerScript dedicado, se desejar
        else
            warn("Falha na validação:", result)
        end
    else
        warn("Erro na requisição:", result)
    end
end

game.Players.PlayerAdded:Connect(function(player)
    validatePlayer(player, "premium")
end)
```

## Observações de Segurança

- Nunca exponha `ROBLOX_SECRET` no cliente; mantenha apenas em ServerScript ou ModuleScript do servidor.
- Sempre use HTTPS em produção.
- Considere armazenar o script retornado e auditá-lo antes de uso.
