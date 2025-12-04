# Documentação do Backend

Visão geral do fluxo, validações e diferenças de ambiente implementadas.

## Endpoint

- `POST /roblox/validate-player` (`src/modules/roblox/roblox.controller.ts:21`)
- Recebe body com `keyName` e `username` e headers `x-timestamp` e `x-signature`.
- Em DEV, valida payload e assinatura. Em PROD, valida existência e, opcionalmente, presença do jogador.

## DTO e Validação

- DTO: `src/modules/roblox/dto/validate-player.dto.ts:3`
  - `keyName`: string, tamanho 1–50
  - `username`: string, tamanho 3–20
- `ValidationPipe` global: `src/main.ts:8` com `whitelist`, `forbidNonWhitelisted`, `transform`.

## Autenticação HMAC

- Guard: `src/common/guards/hmac.guard.ts:1`
- Utilitário: `src/common/utils/hmac.ts:1`
- Assinatura calculada sobre `timestamp + "." + JSON.stringify(body)` usando `HMAC-SHA256(secret)` (hex).

## Diferenciação DEV/PROD

- Em `NODE_ENV=production`:
  - Resolve `userId` pelo `username` via Roblox Users API: `src/modules/roblox/roblox.controller.ts:48`
  - Se `ROBLOX_COOKIE` existir, verifica presença pela Presence API: `src/modules/roblox/roblox.controller.ts:56`
- Em desenvolvimento, chamadas externas ao Roblox são puladas.

## Webhook

- Serviço: `src/modules/webhook/webhook.service.ts:1`
- Envia embed ao Discord para auditoria com `keyName`, `ip`, `timestamp`, `username`.

## Rate Limit

- Middleware simples por IP: `src/common/middlewares/rate-limit.middleware.ts:1`
- 30 requisições/minuto por IP; responde 429 em excesso.

## Resposta com Script Lua

- Template: `scripts/validated.lua:1`
- Controller monta o script substituindo placeholders e retorna em `script`: `src/modules/roblox/roblox.controller.ts:45`

## Variáveis de Ambiente

- `ROBLOX_SECRET`: chave HMAC (obrigatória)
- `DISCORD_WEBHOOK`: webhook do Discord (obrigatória)
- `NODE_ENV`: `development` ou `production`
- `ROBLOX_COOKIE`: cookie `.ROBLOSECURITY` (opcional, habilita checagem de presença em PROD)
- `PORT`: porta do servidor (opcional)
- `ROBLOX_VERIFY_PRESENCE`: `true`/`false` para controlar se a presença deve ser verificada em PROD (opcional)
- `HMAC_WINDOW_MS`: janela máxima (ms) para aceitar timestamps do HMAC (opcional; padrão 60000)

### ROBLOX_SECRET

- Finalidade: segredo compartilhado usado para assinar o payload com HMAC-SHA256.
- Onde configurar: arquivo `.env` do backend.
- Exemplo de `.env`:

```env
ROBLOX_SECRET=uma-chave-bem-secreta
```

- Como a assinatura é calculada: `data = timestamp + "." + JSON.stringify(body)`, `signature = HMAC_SHA256(secret, data)` em hexadecimal.
- Exemplo (Node):

```js
const crypto = require('crypto');
const ts = Date.now().toString();
const body = JSON.stringify({ keyName: 'premium', username: 'Player123' });
const data = `${ts}.${body}`;
const signature = crypto.createHmac('sha256', process.env.ROBLOX_SECRET).update(data).digest('hex');
```

- Onde é usado no código:
  - `src/common/guards/hmac.guard.ts:21` lê `process.env.ROBLOX_SECRET` para validar `x-signature`.
  - `src/common/utils/hmac.ts:3` implementa `validateSignature` com HMAC-SHA256.

### ROBLOX_COOKIE (.ROBLOSECURITY)

- Finalidade: autenticar chamadas à Presence API do Roblox em produção para confirmar se o jogador está online.
- Comportamento: somente aplicado quando `NODE_ENV=production`. Se definido, além de validar que o `username` existe, o backend checa presença online.
- Onde configurar: arquivo `.env` do backend com o valor integral do cookie `.ROBLOSECURITY`.
- Exemplo de `.env`:

```env
ROBLOX_COOKIE=_|WARNING:-DO-NOT-SHARE-THIS--COOKIE... (valor completo do .ROBLOSECURITY)
```

- Fluxo no código:
  - Define header `Cookie: .ROBLOSECURITY=<valor>` e realiza uma chamada inicial para obter `x-csrf-token`: `src/modules/roblox/roblox.controller.ts:63-67`.
  - Refaz a requisição com `Cookie` + `x-csrf-token` para a Presence API: `src/modules/roblox/roblox.controller.ts:69-72`.
  - Interpreta `userPresenceType` do usuário e falha com `401 player_not_online` se estiver offline: `src/modules/roblox/roblox.controller.ts:31-34`.
- Controle de verificação via `ROBLOX_VERIFY_PRESENCE` com fallback: `src/modules/roblox/roblox.controller.ts:32-41`.

- Boas práticas:
  - Use uma conta Roblox dedicada (bot), sem privilégios além do necessário.
  - Trate o cookie como segredo; nunca faça commit, não exponha em logs.
  - Rotacione periodicamente e proteja a conta com 2FA.

### Diferença: ROBLOX_SECRET vs ROBLOX_COOKIE

- Não são a mesma coisa.
- `ROBLOX_SECRET`:
  - Segredo da sua API para assinar payloads (HMAC-SHA256).
  - Serve para autenticar requisições que chegam ao backend via `x-signature`.
  - Fica no `.env` do backend e no servidor Roblox (ServerScript/ModuleScript), nunca no cliente.
- `ROBLOX_COOKIE`:
  - Valor do cookie `.ROBLOSECURITY` de uma conta Roblox (bot) usado pelo backend para autenticar em APIs do Roblox.
  - Serve para consultar Presence API e confirmar que o jogador está online (apenas em `NODE_ENV=production`).
  - Fica somente no `.env` do backend e nunca é enviado ao Roblox nem ao cliente.

### Checklist rápido para `ROBLOX_COOKIE`

- [ ] Definir `NODE_ENV=production` no ambiente de produção.
- [ ] Adicionar `ROBLOX_COOKIE=<valor integral do .ROBLOSECURITY>` no `.env` do backend.
- [ ] Opcional: definir `ROBLOX_VERIFY_PRESENCE=true` para obrigar verificação de presença.
- [ ] Verificar logs de presença e tratar `401 player_not_online` conforme sua regra de negócio.
- [ ] Nunca logar ou expor o valor do cookie.

### Proteções adicionais sem `ROBLOX_COOKIE`

- Janela de tempo do HMAC (`HMAC_WINDOW_MS`): rejeita requisições fora da janela e previne replay em memória: `src/common/guards/hmac.guard.ts:18-34`.
- Verificação de User-Agent em produção: bloqueia clientes não-roblox quando `NODE_ENV=production`: `src/common/guards/hmac.guard.ts:35-41`.

### .env mínimo

- `NODE_ENV=development` ou `production`
- `ROBLOX_SECRET=<sua-chave>`
- `DISCORD_WEBHOOK=<url>`
