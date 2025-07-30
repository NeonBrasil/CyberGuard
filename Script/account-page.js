// Gerenciador da página de conta
class AccountPageManager {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.stats = null;
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Aguarda o Firebase estar pronto
      await this.waitForFirebase();
      
      // Configura listeners de autenticação
      firebase.auth().onAuthStateChanged((user) => {
        this.currentUser = user;
        this.updatePageState();
      });
      
      // Inicializa componentes da página
      this.initializeEventListeners();
      this.isInitialized = true;
      
      console.log('AccountPageManager inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar AccountPageManager:', error);
    }
  }

  async waitForFirebase() {
    return new Promise((resolve) => {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        resolve();
      } else {
        const checkFirebase = setInterval(() => {
          if (typeof firebase !== 'undefined' && firebase.auth) {
            clearInterval(checkFirebase);
            resolve();
          }
        }, 100);
      }
    });
  }

  initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Toggle entre login e registro
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const resetPasswordBtn = document.getElementById('resetPassword');
    
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthForm('register');
      });
    }
    
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAuthForm('login');
      });
    }

    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handlePasswordReset();
      });
    }

    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => this.openEditProfile());
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Action buttons
    this.initializeActionButtons();
  }

  initializeActionButtons() {
    const actionButtons = [
      { id: 'editAccountBtn', action: () => this.openEditProfile() },
      { id: 'changePasswordBtn', action: () => this.openChangePassword() },
      { id: 'privacySettingsBtn', action: () => this.openPrivacySettings() },
      { id: 'exportDataBtn', action: () => this.exportUserData() },
      { id: 'auditDataBtn', action: () => this.auditUserData() },
      { id: 'deleteAccountBtn', action: () => this.initiateAccountDeletion() }
    ];

    actionButtons.forEach(({ id, action }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', action);
      }
    });
  }

  toggleAuthForm(form) {
    const loginForm = document.querySelector('.login-form');
    const registerForm = document.querySelector('.register-form');
    
    if (form === 'register') {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    } else {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validação básica
    if (!email || !password) {
      this.showMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }

    try {
      this.showMessage('Fazendo login...', 'info');
      
      // Usa o sistema de login existente
      if (typeof window.loginSystem !== 'undefined') {
        await window.loginSystem.loginUser(email, password);
      } else {
        await firebase.auth().signInWithEmailAndPassword(email, password);
      }
      
      this.showMessage('Login realizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro no login:', error);
      this.showMessage(this.getErrorMessage(error), 'error');
    }
  }

  async handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validações
    if (!name || !email || !password || !confirmPassword) {
      this.showMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showMessage('As senhas não coincidem.', 'error');
      return;
    }
    
    if (password.length < 6) {
      this.showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    try {
      this.showMessage('Criando conta...', 'info');
      
      // Usa o sistema de registro existente
      if (typeof window.loginSystem !== 'undefined') {
        await window.loginSystem.registerUser(email, password, name);
      } else {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        
        // Cria perfil no Firestore
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          stats: {
            totalQuizzes: 0,
            totalScore: 0,
            averageScore: 0,
            timeSpent: 0,
            lastQuizDate: null
          }
        });
      }
      
      this.showMessage('Conta criada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro no registro:', error);
      this.showMessage(this.getErrorMessage(error), 'error');
    }
  }

  async handleLogout() {
    try {
      await firebase.auth().signOut();
      this.showMessage('Logout realizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro no logout:', error);
      this.showMessage('Erro ao fazer logout.', 'error');
    }
  }

  async handlePasswordReset() {
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
      this.showMessage('Digite seu email no campo acima primeiro.', 'warning');
      return;
    }

    try {
      await firebase.auth().sendPasswordResetEmail(email);
      this.showMessage('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      this.showMessage(this.getErrorMessage(error), 'error');
    }
  }

  async updatePageState() {
    const loginSection = document.getElementById('loginSection');
    const profileSection = document.getElementById('profileSection');
    
    if (this.currentUser) {
      // Usuário logado - mostra perfil
      if (loginSection) loginSection.style.display = 'none';
      if (profileSection) profileSection.style.display = 'block';
      
      await this.loadUserProfile();
      await this.loadUserStats();
      await this.loadRecentActivity();
    } else {
      // Usuário não logado - mostra login
      if (loginSection) loginSection.style.display = 'block';
      if (profileSection) profileSection.style.display = 'none';
    }
  }

  async loadUserProfile() {
    if (!this.currentUser) return;
    
    try {
      // Carrega dados do usuário
      const userDoc = await firebase.firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .get();
      
      const userData = userDoc.exists ? userDoc.data() : {};
      
      // Atualiza elementos do perfil
      const avatar = document.querySelector('.profile-avatar-large');
      const userName = document.getElementById('userName');
      const userEmail = document.getElementById('userEmail');
      const memberSince = document.getElementById('memberSince');
      
      if (avatar) {
        const name = userData.name || this.currentUser.displayName || 'U';
        avatar.textContent = name.charAt(0).toUpperCase();
      }
      
      if (userName) {
        userName.textContent = userData.name || this.currentUser.displayName || 'Usuário';
      }
      
      if (userEmail) {
        userEmail.textContent = this.currentUser.email;
      }
      
      if (memberSince && userData.createdAt) {
        const date = userData.createdAt.toDate();
        memberSince.textContent = `Membro desde ${date.toLocaleDateString('pt-BR')}`;
      }
      
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

  async loadUserStats() {
    if (!this.currentUser) return;
    
    try {
      const userDoc = await firebase.firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .get();
      
      const userData = userDoc.exists ? userDoc.data() : {};
      const stats = userData.stats || {};
      
      this.stats = stats;
      
      // Atualiza elementos de estatísticas
      this.updateStatElement('totalQuizzes', stats.totalQuizzes || 0);
      this.updateStatElement('averageScore', Math.round(stats.averageScore || 0));
      this.updateStatElement('totalScore', stats.totalScore || 0);
      this.updateStatElement('timeSpent', this.formatTime(stats.timeSpent || 0));
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }

  async loadRecentActivity() {
    if (!this.currentUser) return;
    
    try {
      const quizResults = await firebase.firestore()
        .collection('quizResults')
        .where('userId', '==', this.currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();
      
      const activityList = document.querySelector('.activity-list');
      if (!activityList) return;
      
      if (quizResults.empty) {
        activityList.innerHTML = '<p style="text-align: center; color: var(--secondary-color);">Nenhuma atividade recente encontrada.</p>';
        return;
      }
      
      let html = '';
      quizResults.forEach(doc => {
        const data = doc.data();
        const date = data.timestamp.toDate();
        html += `
          <div class="activity-item">
            <div class="activity-info">
              <h4>Quiz Completado</h4>
              <p>${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="activity-score">${data.score}%</div>
          </div>
        `;
      });
      
      activityList.innerHTML = html;
      
    } catch (error) {
      console.error('Erro ao carregar atividade recente:', error);
    }
  }

  updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }

  formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  // Métodos para ações da conta
  openEditProfile() {
    if (typeof window.userAccountManager !== 'undefined') {
      window.userAccountManager.editProfile();
    } else {
      this.showMessage('Sistema de edição não disponível.', 'error');
    }
  }

  openChangePassword() {
    if (typeof window.userAccountManager !== 'undefined') {
      window.userAccountManager.changePassword();
    } else {
      this.showMessage('Sistema de alteração de senha não disponível.', 'error');
    }
  }

  openPrivacySettings() {
    if (typeof window.privacyConsent !== 'undefined') {
      window.privacyConsent.showConsentModal();
    } else {
      this.showMessage('Configurações de privacidade não disponíveis.', 'error');
    }
  }

  exportUserData() {
    if (typeof window.userAccountManager !== 'undefined') {
      window.userAccountManager.exportData();
    } else {
      this.showMessage('Sistema de exportação não disponível.', 'error');
    }
  }

  auditUserData() {
    if (typeof window.dataAuditor !== 'undefined') {
      window.dataAuditor.auditUserData();
    } else {
      this.showMessage('Sistema de auditoria não disponível.', 'error');
    }
  }

  initiateAccountDeletion() {
    if (typeof window.userAccountManager !== 'undefined') {
      window.userAccountManager.deleteAccount();
    } else {
      this.showMessage('Sistema de exclusão não disponível.', 'error');
    }
  }

  getErrorMessage(error) {
    const errorMessages = {
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/email-already-in-use': 'Este email já está em uso.',
      'auth/weak-password': 'A senha é muito fraca.',
      'auth/invalid-email': 'Email inválido.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
    };
    
    return errorMessages[error.code] || 'Erro inesperado. Tente novamente.';
  }

  showMessage(message, type = 'info') {
    // Remove mensagens existentes
    const existingMessages = document.querySelectorAll('.page-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Cria nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `page-message ${type}`;
    messageDiv.textContent = message;
    
    // Estilos da mensagem
    Object.assign(messageDiv.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '1rem 2rem',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '500',
      zIndex: '10000',
      maxWidth: '400px',
      animation: 'slideInRight 0.3s ease'
    });
    
    // Cores por tipo
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      info: '#2196F3',
      warning: '#ff9800'
    };
    
    messageDiv.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(messageDiv);
    
    // Remove após 5 segundos
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
      }
    }, 5000);
  }
}

// Inicializa quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  window.accountPageManager = new AccountPageManager();
});

// Adiciona animações CSS se não existirem
if (!document.querySelector('#account-animations')) {
  const style = document.createElement('style');
  style.id = 'account-animations';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
