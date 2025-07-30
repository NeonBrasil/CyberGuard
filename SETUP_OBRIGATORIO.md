# 🔥 Firebase Setup - Configuração Obrigatória

## ❗ ATENÇÃO: Você PRECISA fazer isso para funcionar!

### 1. 🏗️ Criar Projeto no Firebase Console

1. Vá para: https://console.firebase.google.com/
2. Clique em **"Criar projeto"**
3. Nome: `cyberguard-pro` (ou outro nome)
4. **Desabilite** Google Analytics (não precisamos)
5. Clique em **"Criar projeto"**

### 2. 🗄️ Ativar Firestore Database

1. No menu lateral: **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha: **"Iniciar no modo de teste"**
4. Localização: **"southamerica-east1"** (Brasil)

### 3. 🔐 Configurar Authentication

#### Para Usuários Anônimos (atual):
1. Menu lateral: **"Authentication"**
2. Aba: **"Sign-in method"**
3. Habilite: **"Anônimo"**

#### Para Contas de Usuário (recomendado):
1. Habilite também: **"E-mail/senha"**
2. Habilite: **"Google"** (opcional)

### 4. 🌐 Configurar Hosting

1. Menu lateral: **"Hosting"**
2. Clique em **"Começar"**
3. Siga os passos (instalar Firebase CLI, etc.)

### 5. 🔑 Obter Configuração

1. Ícone engrenagem ⚙️ > **"Configurações do projeto"**
2. Seção **"Seus aplicativos"**
3. Clique em **"Adicionar aplicativo"** > **"Web"** 🌐
4. Nome do app: **"CyberGuard"**
5. **COPIE A CONFIGURAÇÃO** que aparecer

### 6. ⚡ Colar no Seu Código

Substitua no arquivo `Script/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-project-id.firebaseapp.com", 
  projectId: "seu-project-id",
  storageBucket: "seu-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijk"
};
```

### 7. 📤 Migrar Dados

1. Abra `migrate-data.html` no navegador
2. Clique em **"Migrar Perguntas para Firestore"**
3. Aguarde a migração completar

### 8. 🚀 Deploy (Opcional)

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

## ✅ Resultado Final:
- ✅ Site funcionando com Firebase
- ✅ Perguntas salvas no banco
- ✅ Sistema de ranking
- ✅ Salvamento de progresso
