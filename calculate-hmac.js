const crypto = require('crypto');
require('dotenv').config();

// Obter a chave secreta do ambiente ou usar padrão para teste
const SECRET = process.env.ROBLOX_SECRET || 'sua-chave-secreta-aqui';

// Body da requisição (altere conforme necessário)
const body = {
  keyName: "premium",
  username: "TestPlayer"
};

// Gerar timestamp em milissegundos
const timestamp = Date.now().toString();

// Calcular assinatura HMAC
const payload = JSON.stringify(body);
const data = `${timestamp}.${payload}`;
const signature = crypto.createHmac('sha256', SECRET)
    .update(data)
    .digest('hex');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║     Dados para Teste no Postman - Roblox Secure API     ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📍 URL:');
console.log('   http://localhost:3000/roblox/validate-player\n');

console.log('📤 Método:');
console.log('   POST\n');

console.log('📋 Headers:');
console.log('   Content-Type: application/json');
console.log('   x-timestamp:', timestamp);
console.log('   x-signature:', signature);
console.log('');

console.log('📦 Body (JSON):');
console.log(JSON.stringify(body, null, 2));
console.log('');

console.log('🔐 Dados para Assinatura:');
console.log('   Timestamp:', timestamp);
console.log('   Payload:', payload);
console.log('   Data (timestamp.payload):', data);
console.log('   Secret:', SECRET ? '***configurado***' : '⚠️  NÃO CONFIGURADO');
console.log('');

if (!process.env.ROBLOX_SECRET) {
  console.log('⚠️  AVISO: ROBLOX_SECRET não encontrado no .env');
  console.log('   Usando chave padrão. Configure no .env para produção.\n');
}

console.log('✅ Copie os valores acima para o Postman\n');

