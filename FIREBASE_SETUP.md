# 🚀 Guia de Configuração do Firebase para CyberGuard

Este guia te ajudará a configurar o Firebase para seu projeto CyberGuard.

## 📋 Pré-requisitos

- Conta no Google
- Node.js instalado (para Firebase CLI)

## 🔧 Passo a Passo

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar projeto"
3. Nome do projeto: `cyberguard-[seu-nome]`
4. Desabilite Google Analytics (não é necessário)
5. Clique em "Criar projeto"

### 2. Configurar Firestore

1. No painel lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de teste"
4. Escolha a localização (recomendo: `southamerica-east1`)

### 3. Configurar Authentication

1. No painel lateral, clique em "Authentication"
2. Vá na aba "Sign-in method"
3. Habilite "Anônimo" (para usuários sem cadastro)

### 4. Configurar Hosting

1. No painel lateral, clique em "Hosting"
2. Clique em "Começar"
3. Instale Firebase CLI: `npm install -g firebase-tools`
4. No terminal, execute: `firebase login`
5. Na pasta do projeto: `firebase init`
   - Selecione: Firestore, Hosting
   - Use o projeto existente
   - Aceite os padrões

### 5. Obter Configuração

1. No Firebase Console, clique no ícone de engrenagem > "Configurações do projeto"
2. Vá em "Seus aplicativos" > "Adicionar aplicativo" > "Web"
3. Nome do app: "CyberGuard Web"
4. Copie a configuração que aparecerá

### 6. Configurar o Projeto

1. Abra o arquivo `Script/firebase-config.js`
2. Substitua a configuração:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-project-id.firebaseapp.com",
  projectId: "seu-project-id",
  storageBucket: "seu-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijk"
};
```

### 7. Deploy

No terminal, execute:
```bash
firebase deploy
```

## 📊 Estimativa de Uso (Plano Gratuito)

### Firestore Database:
- **Suas perguntas**: ~0.5 MB
- **1000 usuários**: ~2 MB  
- **10000 tentativas**: ~5 MB
- **Total**: ~8 MB (bem abaixo do limite de 1 GB)

### Operações:
- **Leituras**: ~50/quiz × 1000 usuários/mês = 50.000 (limite: 50.000/dia)
- **Escritas**: ~10/quiz × 1000 usuários/mês = 10.000 (limite: 20.000/dia)

### Hosting:
- **Projeto**: ~5 MB (limite: 10 GB)
- **Tráfego**: Depende dos acessos (limite: 10 GB/mês)

## ✅ Funcionalidades Implementadas

- ✅ **Sistema de perguntas dinâmico**
- ✅ **Autenticação anônima**
- ✅ **Salvamento de resultados**
- ✅ **Sistema de ranking**
- ✅ **Fallback para funcionamento offline**

## 🎯 Próximos Passos (Opcionais)

1. **Adicionar mais perguntas** via Firestore
2. **Implementar sistema de usuários** com email
3. **Criar painel administrativo**
4. **Adicionar analytics**

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique se todas as regras do Firestore estão corretas
2. Confirme se a configuração do Firebase está correta
3. Verifique o console do navegador para erros

**Lembre-se**: O plano gratuito é mais do que suficiente para começar!

## 📈 Monitoramento

Você pode acompanhar o uso em:
- Firebase Console > Usage
- Firestore > Usage
- Hosting > Usage

**Parabéns! 🎉 Seu CyberGuard agora tem backend gratuito no Firebase!**
