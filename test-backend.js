const API_BASE_URL = 'http://localhost:3001';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`✅ ${method} ${endpoint}:`, response.status);
    if (data.error) {
      console.log(`❌ Erro: ${data.error}`);
    }
    return data;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testando endpoints do backend...\n');

  // Teste de health check
  console.log('1. Health Check');
  await testEndpoint('/health');

  // Teste de autenticação (sem token)
  console.log('\n2. Teste de autenticação (sem token)');
  await testEndpoint('/api/kpis');
  await testEndpoint('/api/bank-accounts');
  await testEndpoint('/api/credit-cards');
  await testEndpoint('/api/timeline');

  // Teste de endpoints com dados de exemplo
  console.log('\n3. Teste de endpoints com dados');
  
  // KPIs
  await testEndpoint('/api/kpis?period=current');
  
  // Contas bancárias
  await testEndpoint('/api/bank-accounts', 'POST', {
    name: 'Conta Teste',
    bank: 'itau',
    account_type: 'checking',
    balance: 1000
  });

  // Cartões de crédito
  await testEndpoint('/api/credit-cards', 'POST', {
    name: 'Cartão Teste',
    bank: 'itau',
    due_day: 15
  });

  // Timeline
  await testEndpoint('/api/timeline?period=current');

  console.log('\n✅ Testes concluídos!');
  console.log('\n📝 Notas:');
  console.log('- Endpoints protegidos retornarão erro 401 sem token');
  console.log('- Para testar com autenticação, adicione um token válido');
  console.log('- Backend deve estar rodando em http://localhost:3001');
}

// Executar testes se o arquivo for executado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests }; 