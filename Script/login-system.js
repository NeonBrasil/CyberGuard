// Sistema de Login Modular para SIA: Security & Information Academy
// Pode ser usado em qualquer página do projeto

// Variáveis globais do sistema de login
var currentUser = null;
var loginCallbacks = [];

// Inicializar sistema de login
function initLoginSystem() {
  console.log('Inicializando sistema de login modular');
  
  // Sistema de Autenticação Firebase
  if (window.auth) {
    console.log('Firebase Auth encontrado, configurando listeners');
    auth.onAuthStateChanged(function(user) {
      console.log('Estado do usuário mudou:', user);
      currentUser = user;
      window.currentUser = user;
      updateUserInterface();
      
      // Executar callbacks registrados
      loginCallbacks.forEach(function(callback) {
        if (typeof callback === 'function') {
          callback(user);
        }
      });
    });
  } else {
    console.error('Firebase Auth não está disponível');
  }
  
  // Configurar event listeners do modal
  setupModalEvents();
}

// Registrar callback para mudanças de estado do usuário
function onUserStateChange(callback) {
  if (typeof callback === 'function') {
    loginCallbacks.push(callback);
  }
}

// Configurar eventos do modal de login
function setupModalEvents() {
  var modal = document.getElementById('loginModal');
  if (!modal) {
    console.warn('Modal de login não encontrado na página');
    return;
  }
  
  // Configurar X de fechar
  var closeBtn = modal.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('X clicado, fechando modal');
      hideLoginModal();
    };
    console.log('Event listener do X configurado');
  } else {
    console.warn('Botão X (.close) não encontrado no modal');
  }
  
  // Fechar modal clicando fora dele
  modal.onclick = function(event) {
    if (event.target === modal) {
      console.log('Clique fora do modal, fechando');
      hideLoginModal();
    }
  };
  
  // Fechar modal com tecla ESC
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      if (modal && !modal.classList.contains('hidden')) {
        console.log('ESC pressionado, fechando modal');
        hideLoginModal();
      }
    }
  });
  
  console.log('Event listeners do modal configurados');
}

// Atualizar interface do usuário
function updateUserInterface() {
  console.log('Atualizando interface do usuário');
  var loginBtn = document.getElementById('loginBtn');
  
  if (!loginBtn) {
    console.warn('Botão de login não encontrado na página');
    return;
  }
  
  if (currentUser && currentUser.email) {
    loginBtn.textContent = '👤 ' + currentUser.email;
    loginBtn.onclick = showUserInfo;
    console.log('Usuário logado:', currentUser.email);
  } else {
    loginBtn.textContent = '🔐 Login';
    loginBtn.onclick = showLoginModal;
    console.log('Usuário não logado');
  }
}

// Mostrar modal de login
function showLoginModal() {
  console.log('=== SHOW LOGIN MODAL CHAMADO ===');
  
  var modal = document.getElementById('loginModal');
  console.log('Modal element:', modal);
  
  if (!modal) {
    console.error('❌ Modal de login não encontrado no DOM!');
    console.log('Elementos com ID disponíveis:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    return;
  }
  
  console.log('✅ Modal encontrado, removendo classe hidden...');
  modal.classList.remove('hidden');
  
  // Remover TODOS os estilos inline que podem estar conflitando
  modal.style.display = '';
  modal.style.visibility = '';
  modal.style.opacity = '';
  modal.style.pointerEvents = '';
  modal.style.zIndex = '';
  console.log('Todos os styles inline removidos');
  
  console.log('Classes do modal após show:', modal.className);
  
  var loginForm = document.getElementById('loginForm');
  var userInfo = document.getElementById('userInfo');
  
  console.log('LoginForm element:', loginForm);
  console.log('UserInfo element:', userInfo);
  
  if (loginForm) {
    loginForm.classList.remove('hidden');
    console.log('✅ LoginForm mostrado');
  } else {
    console.error('❌ LoginForm não encontrado!');
  }
  
  if (userInfo) {
    userInfo.classList.add('hidden');
    console.log('✅ UserInfo escondido');
  } else {
    console.error('❌ UserInfo não encontrado!');
  }
  
  // Limpar campos
  var emailField = document.getElementById('email');
  var passwordField = document.getElementById('password');
  console.log('Email field:', emailField);
  console.log('Password field:', passwordField);
  
  if (emailField) {
    emailField.value = '';
    console.log('✅ Campo email limpo');
  }
  if (passwordField) {
    passwordField.value = '';
    console.log('✅ Campo senha limpo');
  }
  
  console.log('✅ Modal de login exibido com sucesso!');
}

// Mostrar informações do usuário
function showUserInfo() {
  var modal = document.getElementById('loginModal');
  if (!modal) {
    console.error('Modal de login não encontrado');
    return;
  }
  
  modal.classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('userInfo').classList.remove('hidden');
  
  // Atualizar informações do usuário
  var userEmailElement = document.getElementById('userEmail');
  var userNameElement = document.getElementById('userName');
  var userAvatarElement = document.getElementById('userAvatar');
  
  if (currentUser && userEmailElement) {
    userEmailElement.textContent = currentUser.email || 'email@exemplo.com';
  }
  
  // Carregar nome do usuário se disponível
  if (window.userAccountManager && window.userAccountManager.userDoc) {
    if (userNameElement) {
      userNameElement.textContent = 'Olá, ' + window.userAccountManager.userDoc.name + '!';
    }
    if (userAvatarElement) {
      const name = window.userAccountManager.userDoc.name;
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      userAvatarElement.textContent = initials;
    }
  } else {
    if (userNameElement) {
      userNameElement.textContent = 'Bem-vindo!';
    }
    if (userAvatarElement && currentUser) {
      const email = currentUser.email || 'A';
      userAvatarElement.textContent = email.charAt(0).toUpperCase();
    }
  }
  
  console.log('Informações do usuário exibidas');
}

// Esconder modal de login
function hideLoginModal() {
  console.log('=== HIDE LOGIN MODAL CHAMADO ===');
  
  var modal = document.getElementById('loginModal');
  if (!modal) {
    console.error('Modal de login não encontrado');
    return;
  }
  
  console.log('Modal element:', modal);
  
  // SOLUÇÃO SIMPLIFICADA: usar apenas CSS
  modal.classList.add('hidden');
  
  // Limpar estilos inline conflitantes
  modal.style.display = '';
  modal.style.visibility = '';
  modal.style.opacity = '';
  modal.style.pointerEvents = '';
  modal.style.zIndex = '';
  
  console.log('Classes após esconder:', modal.className);
  
  // Executar callback específico da página se houver resultado pendente
  if (typeof window.onLoginModalClose === 'function') {
    window.onLoginModalClose();
  }
  
  console.log('Modal de login escondido');
}

// Fazer login
function login() {
  var email = document.getElementById('loginEmail').value;
  var password = document.getElementById('loginPassword').value;
  
  try {
    // VALIDAÇÃO DE SEGURANÇA
    window.InputValidator.validateEmail(email);
    window.InputValidator.validatePassword(password);
    
    // VERIFICAR RATE LIMITING
    window.LoginSecurity.canAttemptLogin(email);
    
    console.log('✅ Validações de segurança passaram, tentando login...');
    
  } catch (error) {
    alert('Erro de segurança: ' + error.message);
    return;
  }
  
  if (!window.auth) {
    alert('Sistema de autenticação não disponível!');
    return;
  }
  
  console.log('Tentando fazer login com:', email);
  
  auth.signInWithEmailAndPassword(email, password)
    .then(function(userCredential) {
      console.log('Login bem-sucedido:', userCredential.user);
      window.LoginSecurity.recordLoginAttempt(email, true);
      
      // Mostrar mensagem de sucesso
      showLoginMessage('✅ Login realizado com sucesso!', 'success');
      
      // Aguardar um pouco antes de fechar o modal
      setTimeout(function() {
        hideLoginModal();
      }, 1500);
      
      // Executar callback de sucesso se houver
      if (typeof window.onLoginSuccess === 'function') {
        window.onLoginSuccess();
      }
    })
    .catch(function(error) {
      console.error('Erro no login:', error);
      window.LoginSecurity.recordLoginAttempt(email, false);
      
      var message = 'Erro no login: ';
      switch (error.code) {
        case 'auth/user-not-found':
          message += 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          message += 'Senha incorreta';
          break;
        case 'auth/too-many-requests':
          message += 'Muitas tentativas. Tente mais tarde';
          break;
        case 'auth/invalid-email':
          message += 'Email inválido';
          break;
        default:
          message += error.message;
      }
      showLoginMessage(message, 'error');
    });
}

// Registrar nova conta
function register() {
  console.log('=== REGISTER FUNCTION INICIADA ===');
  
  var nameField = document.getElementById('registerName');
  var emailField = document.getElementById('registerEmail');
  var passwordField = document.getElementById('registerPassword');
  
  console.log('Name field:', nameField);
  console.log('Email field:', emailField);
  console.log('Password field:', passwordField);
  
  if (!nameField || !emailField || !passwordField) {
    console.error('❌ Campos de registro não encontrados no DOM!');
    alert('Erro: Campos de registro não encontrados na página.');
    return;
  }
  
  var name = nameField.value;
  var email = emailField.value;
  var password = passwordField.value;
  
  console.log('Valores capturados:', { name, email, password: '***' });
  
  try {
    // VALIDAÇÃO DE SEGURANÇA
    window.InputValidator.validateName(name);
    window.InputValidator.validateEmail(email);
    window.InputValidator.validatePassword(password);
    
    // VERIFICAR RATE LIMITING (usar mesmo limite do login)
    window.LoginSecurity.canAttemptLogin(email);
    
    console.log('✅ Validações de segurança passaram, tentando registro...');
    
  } catch (error) {
    alert('Erro de validação: ' + error.message);
    return;
  }
  
  if (!window.auth) {
    alert('Sistema de autenticação não disponível!');
    return;
  }
  
  auth.createUserWithEmailAndPassword(email, password).then(function(userCredential) {
    var user = userCredential.user;
    
    // Atualizar perfil do usuário com o nome
    return user.updateProfile({
      displayName: name
    }).then(function() {
      // Criar perfil inicial no Firestore
      if (window.userAccountManager) {
        return window.userAccountManager.createInitialProfile(user, name);
      }
      return Promise.resolve();
    }).then(function() {
      window.LoginSecurity.recordLoginAttempt(email, true);
      
      // Mostrar mensagem de sucesso
      showLoginMessage('✅ Conta criada com sucesso! Bem-vindo, ' + name + '!', 'success');
      
      // Aguardar um pouco antes de fechar o modal
      setTimeout(function() {
        hideLoginModal();
      }, 2000);
      
      // Executar callback específico da página após registro
      if (typeof window.onRegisterSuccess === 'function') {
        window.onRegisterSuccess();
      }
    });
  }).catch(function(error) {
    window.LoginSecurity.recordLoginAttempt(email, false);
    
    var message = 'Erro ao criar conta: ';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message += 'Email já está em uso';
        break;
      case 'auth/weak-password':
        message += 'Senha muito fraca (mínimo 6 caracteres)';
        break;
      case 'auth/too-many-requests':
        message += 'Muitas tentativas. Tente mais tarde';
        break;
      case 'auth/invalid-email':
        message += 'Email inválido';
        break;
      default:
        message += error.message;
    }
    showLoginMessage(message, 'error');
  });
}

// Fazer logout
function logout() {
  if (!window.auth) {
    alert('Sistema de autenticação não disponível!');
    return;
  }
  
  auth.signOut().then(function() {
    hideLoginModal();
    alert('Logout realizado com sucesso!');
    
    // Executar callback específico da página após logout
    if (typeof window.onLogoutSuccess === 'function') {
      window.onLogoutSuccess();
    }
  }).catch(function(error) {
    console.error('Erro no logout:', error);
    alert('Erro no logout: ' + error.message);
  });
}

// Alternar para aba de registro
function switchToRegister() {
  var loginTab = document.getElementById('loginTab');
  var registerTab = document.getElementById('registerTab');
  
  if (loginTab) loginTab.classList.add('hidden');
  if (registerTab) registerTab.classList.remove('hidden');
}

// Alternar para aba de login
function switchToLogin() {
  var loginTab = document.getElementById('loginTab');
  var registerTab = document.getElementById('registerTab');
  
  if (registerTab) registerTab.classList.add('hidden');
  if (loginTab) loginTab.classList.remove('hidden');
}

// Verificar se o usuário está logado
function isUserLoggedIn() {
  return currentUser !== null;
}

// Obter usuário atual
function getCurrentUser() {
  return currentUser;
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== LOGIN SYSTEM DOM LOADED ===');
  console.log('Inicializando sistema de login modular...');
  
  // Verificar se elementos necessários existem
  var loginModal = document.getElementById('loginModal');
  var loginBtn = document.getElementById('loginBtn');
  
  console.log('LoginModal found:', !!loginModal);
  console.log('LoginBtn found:', !!loginBtn);
  
  if (!loginModal) {
    console.error('❌ CRÍTICO: loginModal não encontrado no DOM!');
  }
  
  if (!loginBtn) {
    console.error('❌ CRÍTICO: loginBtn não encontrado no DOM!');
  }
  
  initLoginSystem();
  
  console.log('=== FUNÇÕES EXPORTADAS ===');
  console.log('window.showLoginModal:', typeof window.showLoginModal);
  console.log('window.hideLoginModal:', typeof window.hideLoginModal);
  console.log('window.getCurrentUser:', typeof window.getCurrentUser);
});

// Função para mostrar mensagens no modal de login
function showLoginMessage(message, type) {
  console.log('Mostrando mensagem:', message, 'tipo:', type);
  
  // Remover mensagens existentes
  var existingMessages = document.querySelectorAll('.login-message');
  existingMessages.forEach(function(msg) {
    msg.remove();
  });
  
  // Criar nova mensagem
  var messageDiv = document.createElement('div');
  messageDiv.className = 'login-message ' + type;
  messageDiv.textContent = message;
  
  // Estilos da mensagem
  messageDiv.style.cssText = `
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 15px;
    border-radius: 5px;
    font-weight: 500;
    z-index: 10001;
    max-width: 90%;
    text-align: center;
    animation: slideDown 0.3s ease;
    ${type === 'success' ? 'background: #4CAF50; color: white;' : 'background: #f44336; color: white;'}
  `;
  
  // Adicionar ao modal
  var modal = document.getElementById('loginModal');
  if (modal) {
    var modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.appendChild(messageDiv);
      
      // Remover após 4 segundos
      setTimeout(function() {
        if (messageDiv.parentNode) {
          messageDiv.style.animation = 'slideUp 0.3s ease';
          setTimeout(function() {
            messageDiv.remove();
          }, 300);
        }
      }, 4000);
    }
  }
}

// Exportar funções globalmente
window.showLoginModal = showLoginModal;
window.showUserInfo = showUserInfo;
window.hideLoginModal = hideLoginModal;
window.login = login;
window.register = register;
window.logout = logout;
window.isUserLoggedIn = isUserLoggedIn;
window.getCurrentUser = getCurrentUser;
window.onUserStateChange = onUserStateChange;
window.initLoginSystem = initLoginSystem;

// Adicionar estilos CSS para as mensagens se não existirem
if (!document.querySelector('#login-message-styles')) {
  var style = document.createElement('style');
  style.id = 'login-message-styles';
  style.textContent = `
    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(0); opacity: 1; }
      to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
    
    .login-message {
      font-family: inherit;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
  `;
  document.head.appendChild(style);
}
