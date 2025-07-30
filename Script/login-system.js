// Sistema de Login Modular para CyberGuard
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
  document.getElementById('userEmail').textContent = currentUser.email || 'Usuário anônimo';
  
  console.log('Informações do usuário exibidas');
}

// Esconder modal de login
function hideLoginModal() {
  var modal = document.getElementById('loginModal');
  if (!modal) {
    console.error('Modal de login não encontrado');
    return;
  }
  
  modal.classList.add('hidden');
  
  // Executar callback específico da página se houver resultado pendente
  if (typeof window.onLoginModalClose === 'function') {
    window.onLoginModalClose();
  }
  
  console.log('Modal de login escondido');
}

// Fazer login
function login() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('Preencha email e senha!');
    return;
  }
  
  if (!window.auth) {
    alert('Sistema de autenticação não disponível!');
    return;
  }
  
  auth.signInWithEmailAndPassword(email, password).then(function() {
    hideLoginModal();
    alert('Login realizado com sucesso!');
    
    // Executar callback específico da página após login
    if (typeof window.onLoginSuccess === 'function') {
      window.onLoginSuccess();
    }
  }).catch(function(error) {
    alert('Erro no login: ' + error.message);
  });
}

// Registrar nova conta
function register() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('Preencha email e senha!');
    return;
  }
  
  if (password.length < 6) {
    alert('Senha deve ter pelo menos 6 caracteres!');
    return;
  }
  
  if (!window.auth) {
    alert('Sistema de autenticação não disponível!');
    return;
  }
  
  auth.createUserWithEmailAndPassword(email, password).then(function() {
    hideLoginModal();
    alert('Conta criada com sucesso!');
    
    // Executar callback específico da página após registro
    if (typeof window.onRegisterSuccess === 'function') {
      window.onRegisterSuccess();
    }
  }).catch(function(error) {
    alert('Erro ao criar conta: ' + error.message);
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
    alert('Logout realizado!');
  }).catch(function(error) {
    alert('Erro no logout: ' + error.message);
  });
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
