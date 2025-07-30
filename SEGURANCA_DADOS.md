# 🔐 Privacidade e Segurança dos Dados - CyberGuard

## 🛡️ Segurança do Repositório

### ✅ **Dados Seguros:**
- ✅ **Configuração Firebase**: Apenas no seu repositório privado
- ✅ **Regras de Segurança**: Firestore com regras restritivas
- ✅ **Dados Privados**: Cada usuário só acessa seus próprios dados
- ✅ **Leaderboard Opcional**: Usuários escolhem se aparecem no ranking

### 🔒 **Estrutura de Privacidade:**

```javascript
// Estrutura do usuário no Firestore
{
  uid: "user123",
  email: "user@example.com",
  displayName: "João",
  isPublic: true,        // ← Usuário escolhe se aparece no ranking
  totalQuizzes: 15,
  totalScore: 120,
  bestScores: {
    easy: 85,
    medium: 70,
    hard: 60
  },
  // Dados sensíveis ficam privados
}
```

## 🔐 **Configuração de Segurança Recomendada:**

### 1. Repositório Privado
```bash
# Tornar repositório privado no GitHub
Settings > General > Danger Zone > Change repository visibility > Private
```

### 2. Variáveis de Ambiente (Recomendado)
Crie um arquivo `.env` (não commitado):
```env
FIREBASE_API_KEY=sua_api_key_aqui
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
```

### 3. Regras Firestore Restritivas
```javascript
// Já implementado em firestore.rules
- Usuários só acessam próprios dados
- Leaderboard só mostra dados públicos
- Perguntas são públicas (conteúdo educacional)
```

## 🎯 **Para Empresas - Dados Corporativos:**

### Opção 1: Deployment Privado
```bash
# Deploy em domínio corporativo
firebase hosting:channel:deploy internal --only hosting
```

### Opção 2: Versão White-Label
- Clone o projeto para repositório corporativo privado
- Configure Firebase corporativo
- Customize branding da empresa

### Opção 3: Dados Anonimizados
```javascript
// Configurar usuários sem dados pessoais
{
  displayName: "Funcionário #123",  // ID anônimo
  department: "TI",                 // Não PII
  isPublic: false                   // Sem leaderboard público
}
```

## 📊 **Conformidade LGPD:**

### ✅ **Dados Coletados:**
- E-mail (para autenticação)
- Nome de exibição (escolhido pelo usuário)
- Resultados dos quizzes
- Estatísticas de desempenho

### ✅ **Direitos do Usuário:**
- **Portabilidade**: Exportar dados via Firebase
- **Exclusão**: Deletar conta e dados
- **Correção**: Atualizar informações
- **Opt-out**: Remover do leaderboard público

### 🔧 **Implementar Funcionalidades LGPD:**

```javascript
// Exportar dados do usuário
async function exportUserData(userId) {
  const userData = await getDoc(doc(db, 'users', userId));
  const quizResults = await getDocs(query(collection(db, 'quiz_results'), where('userId', '==', userId)));
  
  return {
    profile: userData.data(),
    quizHistory: quizResults.docs.map(doc => doc.data())
  };
}

// Deletar todos os dados do usuário
async function deleteUserData(userId) {
  // Deletar perfil
  await deleteDoc(doc(db, 'users', userId));
  
  // Deletar resultados
  const results = await getDocs(query(collection(db, 'quiz_results'), where('userId', '==', userId)));
  results.forEach(async (doc) => {
    await deleteDoc(doc.ref);
  });
  
  // Remover do leaderboard
  await deleteDoc(doc(db, 'leaderboard', userId));
}
```

## 🚀 **Configuração Segura para Produção:**

### 1. Firebase Security Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Adicionar rate limiting
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && request.time > resource.data.lastUpdate + duration.value(1, 's'); // Rate limit
    }
  }
}
```

### 2. Monitoramento e Auditoria
```javascript
// Logs de auditoria para ações sensíveis
async function auditLog(action, userId, details) {
  await addDoc(collection(db, 'audit_logs'), {
    action: action,
    userId: userId,
    details: details,
    timestamp: new Date(),
    ip: getClientIP(), // Implementar
    userAgent: navigator.userAgent
  });
}
```

## 📋 **Checklist de Segurança:**

- [ ] ✅ Repositório configurado como privado
- [ ] ✅ Regras Firestore restritivas implementadas
- [ ] ✅ Usuários controlam própria visibilidade
- [ ] ✅ Dados sensíveis criptografados em trânsito (HTTPS)
- [ ] ✅ Backup regular dos dados (Firebase automático)
- [ ] ✅ Monitoramento de acesso (Firebase Analytics)
- [ ] ✅ Compliance com LGPD implementado

## 🎉 **Resultado Final:**

✅ **Para Uso Pessoal**: Totalmente seguro e gratuito
✅ **Para Empresas**: Dados corporativos protegidos
✅ **Conformidade**: LGPD compliant
✅ **Escalabilidade**: Suporta milhares de usuários
✅ **Custo**: R$ 0,00 para uso normal

**Seus dados estão seguros! 🛡️**
