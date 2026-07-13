# 🛡️ CyberGuard - Relatório de Segurança e Proteção de Dados

> Este documento foi revisado para refletir o que o sistema **realmente** faz hoje,
> separando proteção real (aplicada no servidor via Firestore Rules) de
> conveniências client-side (JS no navegador, que qualquer atacante pode ignorar
> chamando a API do Firebase diretamente). A versão anterior descrevia como
> "Anti-DDoS", "CSRF Protection" e "SQL Injection Prevention" coisas que não
> existiam de fato - corrigido abaixo.

## ✅ Proteções aplicadas no servidor (Firestore Rules)

Isso é o que realmente não pode ser contornado pelo navegador do atacante,
porque é avaliado pelo próprio Firebase antes de aceitar a escrita:

- **Ranking íntegro**: `stats.totalQuizzes` só pode subir de 1 em 1 por escrita
  e `averageScore`/`bestScore` ficam travados entre 0-100. Fecha o ataque
  trivial de escrever `totalScore: 999999` direto no console do navegador.
- **Dono dos dados**: cada usuário só escreve o próprio documento
  (`request.auth.uid == userId`), validado nas rules, não no cliente.
- **Resultados de quiz imutáveis**: depois de salvo, um resultado não pode
  ser editado (só criado ou apagado pelo dono, para permitir exclusão de conta).
- **Histórico detalhado privado**: as respostas erradas de cada tentativa
  ficam em `users/{uid}/quizAttempts`, legível só pelo dono. O documento
  público usado no ranking (`quizResults`) não leva esse conteúdo.
- **Perguntas do quiz**: só uma conta com custom claim `admin` pode escrever.

## ⚠️ Proteções client-side (JS no navegador) - o que são e o que não são

- **Rate Limiting** (`Script/security.js`): limita tentativas de login/quiz e
  persiste em `localStorage` entre reloads. Impede cliques repetidos
  acidentais e abuso casual via a própria UI do site.
- **Detecção de comportamento suspeito**: identifica o navegador (não o IP -
  JS não tem acesso a isso) e reduz ações muito rápidas na mesma aba.
- **O que isso NÃO faz**: nada aqui impede um atacante que chama a API do
  Firebase Auth/Firestore diretamente (curl, script, devtools), porque nesse
  caso o `security.js` nunca chega a rodar. Proteção real contra
  brute-force/spam automatizado exigiria **Firebase App Check** e/ou
  **Cloud Functions**, que este projeto (hosting estático, sem backend) hoje
  não usa.
- **CSRF**: não se aplica da forma como esse termo é usado normalmente -
  não há cookies de sessão nem formulários que dependam disso; a autenticação
  é feita via SDK do Firebase com token.
- **SQL Injection**: não existe banco SQL no projeto (é Firestore, um banco
  de documentos), então a categoria não se aplica.

## 🛡️ **Proteção de Dados Pessoais (LGPD/GDPR)**
- **Email Mascarado**: Logs no console no formato `jo***@****.com`
- **Senhas**: gerenciadas pelo Firebase Auth (hash, nunca armazenadas em texto puro)
- **Dados Sensíveis**: mascaramento automático nos `console.log`
- **Limpeza Automática**: remoção de dados não essenciais do `localStorage` quando o consentimento é revogado

## 🎯 **Sistema de Consentimento (LGPD Compliance)**
- **Banner de Consentimento**: aparece na primeira visita
- **Configurações Granulares**: usuário escolhe quais dados compartilhar
- **Dados Essenciais**: login e quiz (obrigatórios para o site funcionar)
- **Dados Analíticos/Comunicações**: opcionais
- **Revogação**: usuário pode revogar consentimento a qualquer momento

## 🔍 **Auditoria e Transparência**
- **Log de Coleta**: registro do que é coletado, exibido na interface de auditoria
- **Exportação**: JSON com perfil, resultados de ranking e histórico detalhado de tentativas
- **Exclusão de conta**: remove perfil, resultados públicos de ranking, histórico privado e posição no leaderboard

## 🚨 **Validação de Entrada**
- **Input Validation**: formato de email, domínios temporários bloqueados, força mínima de senha, nome sem caracteres de marcação
- **XSS Prevention**: dados vindos do Firestore (nome, email) são escapados antes de ir para o DOM
- **Domain Blacklist**: bloqueio de domínios de email temporário conhecidos

## 📋 **Direitos do Usuário (LGPD)**
- **Acesso**: ver todos os dados coletados (auditoria)
- **Correção**: atualizar nome do perfil
- **Exclusão**: deletar conta e todos os dados associados
- **Portabilidade**: exportar dados em JSON
- **Revogação**: cancelar consentimento de dados não essenciais

## 🔐 **Criptografia e Transporte**
- **HTTPS**: obrigatório no Firebase Hosting
- **Firebase Auth**: senhas hasheadas, nunca em texto puro
- **Firestore**: dados criptografados em repouso (garantia da infraestrutura do Firebase)

## 🎯 Próximos passos recomendados (não implementados ainda)

- **Firebase App Check**: para reduzir tráfego automatizado direto à API
- **Cloud Functions**: para calcular/validar o score do quiz no servidor em
  vez de confiar no valor enviado pelo cliente (hoje as rules limitam o
  dano, mas não eliminam 100% a possibilidade de fraude gradual)
- **Restringir a API key do Firebase por domínio** no Google Cloud Console
