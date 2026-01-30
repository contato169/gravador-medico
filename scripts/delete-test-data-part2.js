/**
 * Script para remover dados relacionados de teste do banco de dados
 * Parte 2: Remove dependências e depois os usuários
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lista de emails para remover
const emailsToDelete = [
  'gravadormedico@gmail.com',
  'teste-edge-1769477885@example.com',
  'helcinteste@gmail.com',
  'contato@helciomattos.com.br',
  'gabriel_acardoso@hotmail.com',
  'gabriel_acardoso@me.com',
  'arcfysaude@gmail.com',
  'helciomtt@gmail.com',
  'helciomattos.consultor@gmail.com',
  'unknown@mercadopago.com',
  'teste-verificacao@teste.com',
  'lifsplan@gmail.com',
  'helciodmtt@gmail.com',
  'gacardosorj@gmail.com'
];

async function cleanupRemainingData() {
  console.log('🧹 Limpando dados restantes...\n');

  // 1. Buscar os IDs dos usuários primeiro
  console.log('🔍 Buscando usuários com esses emails...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .in('email', emailsToDelete);

  if (usersError) {
    console.error('Erro ao buscar usuários:', usersError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('ℹ️  Nenhum usuário encontrado para esses emails');
    return;
  }

  console.log(`📋 Encontrados ${users.length} usuários:`);
  users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id})`));
  
  const userIds = users.map(u => u.id);

  // 2. Remover admin_chat_conversations
  console.log('\n🔍 Removendo admin_chat_conversations...');
  const { data: deletedConvos, error: convosError } = await supabase
    .from('admin_chat_conversations')
    .delete()
    .in('created_by', userIds)
    .select();

  if (convosError && !convosError.message.includes('does not exist')) {
    console.error('Erro:', convosError.message);
  } else {
    console.log(`✅ Removidas ${deletedConvos?.length || 0} conversas de chat`);
  }

  // 3. Remover sessions
  console.log('\n🔍 Removendo sessions...');
  const { data: deletedSessions, error: sessionsError } = await supabase
    .from('sessions')
    .delete()
    .in('user_id', userIds)
    .select();

  if (sessionsError && !sessionsError.message.includes('does not exist')) {
    console.error('Erro:', sessionsError.message);
  } else {
    console.log(`✅ Removidas ${deletedSessions?.length || 0} sessões`);
  }

  // 4. Agora remover os usuários
  console.log('\n🔍 Removendo usuários...');
  const { data: deletedUsers, error: deleteUsersError } = await supabase
    .from('users')
    .delete()
    .in('email', emailsToDelete)
    .select();

  if (deleteUsersError) {
    console.error('Erro ao deletar usuários:', deleteUsersError.message);
    
    // Se ainda falhar, vamos tentar descobrir outras dependências
    console.log('\n🔍 Verificando outras tabelas com referência a users...');
    
    // Tentar remover user_transcription_plans
    const { error: plansError } = await supabase
      .from('user_transcription_plans')
      .delete()
      .in('user_id', userIds);
    
    if (!plansError) {
      console.log('✅ Removidos registros de user_transcription_plans');
    }

    // Tentar remover transcriptions
    const { error: transcError } = await supabase
      .from('transcriptions')
      .delete()
      .in('user_id', userIds);
    
    if (!transcError) {
      console.log('✅ Removidos registros de transcriptions');
    }

    // Tentar novamente
    const { data: retryUsers, error: retryError } = await supabase
      .from('users')
      .delete()
      .in('email', emailsToDelete)
      .select();

    if (retryError) {
      console.error('❌ Ainda não foi possível remover usuários:', retryError.message);
    } else {
      console.log(`✅ Removidos ${retryUsers?.length || 0} usuários`);
    }
  } else {
    console.log(`✅ Removidos ${deletedUsers?.length || 0} usuários`);
  }

  console.log('\n✅ Limpeza concluída!');
}

cleanupRemainingData().catch(console.error);
