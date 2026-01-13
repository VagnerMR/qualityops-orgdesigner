import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verificando configuração do projeto...\n');

// Verificar .env.local
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  console.log('✅ .env.local encontrado');
  const envContent = readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
  
  console.log(`   - VITE_SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
  console.log(`   - VITE_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅' : '❌'}`);
} else {
  console.log('❌ .env.local não encontrado');
}

// Verificar package.json
const packagePath = join(process.cwd(), 'package.json');
if (existsSync(packagePath)) {
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  console.log('\n📦 package.json:');
  console.log(`   - Name: ${packageJson.name}`);
  console.log(`   - Version: ${packageJson.version}`);
  console.log(`   - Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
}

// Verificar tailwind.config.js
const tailwindPath = join(process.cwd(), 'tailwind.config.js');
if (existsSync(tailwindPath)) {
  console.log('\n🎨 tailwind.config.js: ✅');
} else {
  console.log('\n🎨 tailwind.config.js: ❌');
}

console.log('\n✅ Verificação concluída!');