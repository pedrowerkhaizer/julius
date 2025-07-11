#!/usr/bin/env node

/**
 * Script para testar a API do Julius
 * Uso: node test-api.js [token] [baseUrl]
 */

const https = require('https');
const http = require('http');

// Configuração
const token = process.argv[2] || 'seu_token_aqui';
const baseUrl = process.argv[3] || 'http://localhost:3001';

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 3001),
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: json
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, method, path, data = null) {
  try {
    log(`\n🔍 Testando: ${name}`, 'blue');
    log(`📡 ${method} ${path}`, 'yellow');
    
    const response = await makeRequest(method, path, data);
    
    if (response.status >= 200 && response.status < 300) {
      log(`✅ Sucesso (${response.status})`, 'green');
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      log(`❌ Erro (${response.status})`, 'red');
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    log(`💥 Erro de conexão: ${error.message}`, 'red');
  }
}

async function runTests() {
  log('🚀 Iniciando testes da API do Julius', 'green');
  log(`📍 Base URL: ${baseUrl}`, 'blue');
  log(`🔑 Token: ${token.substring(0, 20)}...`, 'blue');

  // Teste de health check
  await testEndpoint('Health Check', 'GET', '/health');

  // Teste de autenticação
  await testEndpoint('Verificar Token', 'POST', '/api/auth/verify', { token });

  // Teste de perfil
  await testEndpoint('Perfil do Usuário', 'GET', '/api/auth/profile');

  // Teste de saldo atual
  await testEndpoint('Saldo Atual', 'GET', '/api/balance/current');

  // Teste de saldo projetado
  await testEndpoint('Saldo Projetado', 'GET', '/api/balance/projected');

  // Teste de KPIs
  await testEndpoint('KPIs - Mês Atual', 'GET', '/api/kpis?period=current');
  await testEndpoint('KPIs - Próximo Mês', 'GET', '/api/kpis?period=next');

  // Teste de simulação de compra
  await testEndpoint('Simular Compra', 'POST', '/api/simulation/purchase', {
    amount: 500,
    description: 'Teste de simulação'
  });

  // Teste de transações
  await testEndpoint('Listar Transações', 'GET', '/api/transactions');

  log('\n🎉 Testes concluídos!', 'green');
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  if (!token || token === 'seu_token_aqui') {
    log('❌ Token não fornecido!', 'red');
    log('Uso: node test-api.js [token] [baseUrl]', 'yellow');
    log('Exemplo: node test-api.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... http://localhost:3001', 'yellow');
    process.exit(1);
  }

  runTests().catch(error => {
    log(`💥 Erro fatal: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { makeRequest, testEndpoint }; 