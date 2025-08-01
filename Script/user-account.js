// Sistema de Gerenciamento de Conta do Usuário
// Inclui perfil, edição e exclusão de conta

class UserAccountManager {
  constructor() {
    this.userDoc = null;
    this.init();
  }

  init() {
    // Aguardar Firebase estar pronto
    if (window.auth && window.db) {
      this.setupAuthListener();
    } else {
      console.warn('Firebase não disponível, tentando novamente...');
      setTimeout(() => this.init(), 1000);
    }
  }

  setupAuthListener() {
    window.auth.onAuthStateChanged((user) => {
      if (user) {
        this.loadUserProfile(user);
      } else {
        this.userDoc = null;
      }
    });
  }

  // Carregar perfil do usuário do Firestore
  async loadUserProfile(user) {
    try {
      const userRef = window.db.collection('users').doc(user.uid);
      const doc = await userRef.get();
      
      if (doc.exists) {
        this.userDoc = { id: user.uid, ...doc.data() };
      } else {
        // Criar perfil inicial se não existir
        await this.createInitialProfile(user);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }

    // Criar perfil inicial do usuário
  async createInitialProfile(user, name) {
    try {
      console.log('Criando perfil inicial para:', user.uid, 'nome:', name);
      
      const initialProfile = {
        name: name || user.displayName || 'Usuário',
        email: user.email,
        createdAt: new Date().toISOString(),
        stats: {
          totalQuizzes: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          totalTimePlayed: 0,
          lastQuizDate: null
        },
        preferences: {
          theme: 'dark',
          notifications: true,
          privacy: {
            showInRanking: true,
            shareStats: false
          }
        }
      };

      await window.db.collection('users').doc(user.uid).set(initialProfile);
      this.userDoc = { id: user.uid, ...initialProfile };
      
      console.log('✅ Perfil inicial criado com sucesso:', this.userDoc);
      return this.userDoc;
    } catch (error) {
      console.error('❌ Erro ao criar perfil inicial:', error);
      throw error;
    }
  }

  // Mostrar modal de perfil do usuário
  showUserProfile() {
    if (!this.userDoc) {
      alert('Perfil não encontrado. Faça login novamente.');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'user-profile-modal';
    modal.className = 'user-modal';
    modal.innerHTML = `
      <div class="user-modal-content">
        <div class="user-modal-header">
          <h2>👤 Meu Perfil</h2>
          <button class="close-user-modal" onclick="this.closest('.user-modal').remove()">×</button>
        </div>
        
        <div class="user-profile-section">
          <div class="profile-avatar">
            ${this.generateAvatar(this.userDoc.name)}
          </div>
          
          <div class="profile-info">
            <h3>${this.userDoc.name}</h3>
            <p class="profile-email">${this.maskEmail(this.userDoc.email)}</p>
            <p class="profile-since">Membro desde ${this.formatDate(this.userDoc.createdAt)}</p>
          </div>
        </div>

        <div class="profile-stats">
          <h3>📊 Estatísticas</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">${this.userDoc.stats.totalQuizzes}</span>
              <span class="stat-label">Quizzes Feitos</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.userDoc.stats.bestScore}%</span>
              <span class="stat-label">Melhor Pontuação</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.userDoc.stats.averageScore}%</span>
              <span class="stat-label">Média</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">${this.formatPlayTime(this.userDoc.stats.totalTimePlayed)}</span>
              <span class="stat-label">Tempo Jogado</span>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button class="profile-btn edit" onclick="userAccountManager.showEditProfile()">
            ✏️ Editar Perfil
          </button>
          <button class="profile-btn preferences" onclick="alert('🔜 Em breve! Esta funcionalidade estará disponível em uma próxima atualização.')" style="position: relative;">
            ⚙️ Preferências
            <span style="font-size: 0.7rem; color: #6e7681; margin-left: 0.5rem;">(Em breve)</span>
          </button>
          <button class="profile-btn export" onclick="userAccountManager.exportData()">
            📥 Exportar Dados
          </button>
          <button class="profile-btn delete" onclick="userAccountManager.showDeleteAccount()">
            🗑️ Excluir Conta
          </button>
        </div>
      </div>
    `;

    this.addUserModalStyles(modal);
    document.body.appendChild(modal);
  }

  // Editar perfil do usuário
  showEditProfile() {
    const modal = document.createElement('div');
    modal.id = 'edit-profile-modal';
    modal.className = 'user-modal';
    modal.innerHTML = `
      <div class="user-modal-content">
        <div class="user-modal-header">
          <h2>✏️ Editar Perfil</h2>
          <button class="close-user-modal" onclick="this.closest('.user-modal').remove()">×</button>
        </div>
        
        <form class="edit-profile-form" onsubmit="userAccountManager.saveProfileChanges(event)">
          <div class="form-group">
            <label for="edit-name">Nome:</label>
            <input type="text" id="edit-name" value="${this.userDoc.name}" required 
                   placeholder="Seu nome completo" maxlength="50">
            <small>Como você quer ser chamado no sistema</small>
          </div>

          <div class="form-group">
            <label for="edit-email">Email:</label>
            <input type="email" id="edit-email" value="${this.userDoc.email}" readonly 
                   title="Para alterar o email, entre em contato conosco">
            <small>⚠️ Para alterar email, entre em contato via suporte</small>
          </div>

          <div class="form-group">
            <label>Alterar Senha:</label>
            <button type="button" class="change-password-btn" onclick="userAccountManager.changePassword()">
              🔑 Enviar Link de Redefinição
            </button>
            <small>Um link será enviado para seu email</small>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" onclick="this.closest('.user-modal').remove()">
              Cancelar
            </button>
            <button type="submit" class="save-btn">
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    `;

    this.addUserModalStyles(modal);
    document.body.appendChild(modal);
  }

  // Salvar alterações do perfil
  async saveProfileChanges(event) {
    event.preventDefault();
    
    const name = document.getElementById('edit-name').value.trim();
    
    if (!name || name.length < 2) {
      alert('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    try {
      // Validar entrada
      if (!window.InputValidator.validateName(name)) {
        throw new Error('Nome contém caracteres inválidos');
      }

      // Atualizar no Firestore
      await window.db.collection('users').doc(this.userDoc.id).update({
        name: name,
        updatedAt: new Date().toISOString()
      });

      // Atualizar localmente
      this.userDoc.name = name;
      this.userDoc.updatedAt = new Date().toISOString();

      // Fechar modal e mostrar confirmação
      document.getElementById('edit-profile-modal').remove();
      this.showNotification('Perfil atualizado com sucesso! ✅', 'success');

      // Atualizar interface se perfil estiver aberto
      const profileModal = document.getElementById('user-profile-modal');
      if (profileModal) {
        profileModal.remove();
        this.showUserProfile();
      }

    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar alterações: ' + error.message);
    }
  }

  // Alterar senha
  async changePassword() {
    const confirmed = confirm(
      'Deseja enviar um link de redefinição de senha para seu email?\n\n' +
      'Você receberá um email com instruções para criar uma nova senha.'
    );

    if (!confirmed) return;

    try {
      await window.auth.sendPasswordResetEmail(this.userDoc.email);
      this.showNotification('Link de redefinição enviado para seu email! 📧', 'success');
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      alert('Erro ao enviar email de redefinição: ' + error.message);
    }
  }

  // Mostrar modal de exclusão de conta
  showDeleteAccount() {
    const modal = document.createElement('div');
    modal.id = 'delete-account-modal';
    modal.className = 'user-modal danger';
    modal.innerHTML = `
      <div class="user-modal-content">
        <div class="user-modal-header danger">
          <h2>⚠️ Excluir Conta</h2>
          <button class="close-user-modal" onclick="this.closest('.user-modal').remove()">×</button>
        </div>
        
        <div class="delete-warning">
          <div class="warning-icon">🚨</div>
          <h3>Esta ação não pode ser desfeita!</h3>
          <p>Ao excluir sua conta, os seguintes dados serão <strong>permanentemente removidos</strong>:</p>
          
          <ul class="delete-list">
            <li>✗ Perfil e informações pessoais</li>
            <li>✗ Histórico de quizzes e pontuações</li>
            <li>✗ Estatísticas e conquistas</li>
            <li>✗ Preferências e configurações</li>
            <li>✗ Dados de autenticação</li>
          </ul>

          <div class="data-export-reminder">
            <p><strong>💡 Dica:</strong> Use "Exportar Dados" antes de excluir para manter uma cópia.</p>
          </div>
        </div>

        <div class="delete-confirmation">
          <label>
            <input type="checkbox" id="confirm-delete-data">
            Entendo que todos os meus dados serão excluídos permanentemente
          </label>
          
          <label>
            <input type="checkbox" id="confirm-no-recovery">
            Entendo que não será possível recuperar minha conta após a exclusão
          </label>

          <div class="password-confirmation">
            <label for="delete-password">Digite sua senha atual para confirmar:</label>
            <input type="password" id="delete-password" placeholder="Senha atual" required>
          </div>
        </div>

        <div class="delete-actions">
          <button type="button" class="cancel-btn" onclick="this.closest('.user-modal').remove()">
            Cancelar
          </button>
          <button type="button" class="export-first-btn" onclick="userAccountManager.exportData()">
            📥 Exportar Dados Primeiro
          </button>
          <button type="button" class="delete-confirm-btn" onclick="userAccountManager.confirmDeleteAccount()">
            🗑️ Excluir Definitivamente
          </button>
        </div>
      </div>
    `;

    this.addUserModalStyles(modal);
    document.body.appendChild(modal);
  }

  // Confirmar e executar exclusão de conta
  async confirmDeleteAccount() {
    // Verificar checkboxes
    const confirmData = document.getElementById('confirm-delete-data').checked;
    const confirmRecovery = document.getElementById('confirm-no-recovery').checked;
    const password = document.getElementById('delete-password').value;

    if (!confirmData || !confirmRecovery) {
      alert('Você deve confirmar ambas as opções para prosseguir.');
      return;
    }

    if (!password) {
      alert('Digite sua senha atual para confirmar.');
      return;
    }

    try {
      // Reautenticar usuário
      const user = window.auth.currentUser;
      const credential = window.firebase.auth.EmailAuthProvider.credential(
        user.email, 
        password
      );
      
      await user.reauthenticateWithCredential(credential);

      // Confirmar uma última vez
      const finalConfirm = confirm(
        '🚨 ÚLTIMA CONFIRMAÇÃO 🚨\n\n' +
        'Sua conta será excluída AGORA e não poderá ser recuperada.\n\n' +
        'Tem certeza absoluta?'
      );

      if (!finalConfirm) return;

      // Log da exclusão
      if (window.DataProtection) {
        window.DataProtection.secureLog('info', 'Conta sendo excluída', {
          email: user.email,
          timestamp: new Date().toISOString()
        });
      }

      // 1. Excluir dados do Firestore
      await this.deleteUserData(user.uid);

      // 2. Excluir conta do Firebase Auth
      await user.delete();

      // 3. Limpar localStorage
      this.clearLocalData();

      // 4. Mostrar confirmação e redirecionar
      alert('Conta excluída com sucesso. Você será redirecionado para a página inicial.');
      window.location.href = 'index.html';

    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      
      let message = 'Erro ao excluir conta: ';
      switch (error.code) {
        case 'auth/wrong-password':
          message += 'Senha incorreta';
          break;
        case 'auth/too-many-requests':
          message += 'Muitas tentativas. Tente novamente mais tarde';
          break;
        default:
          message += error.message;
      }
      
      alert(message);
    }
  }

  // Excluir todos os dados do usuário no Firestore
  async deleteUserData(userId) {
    const batch = window.db.batch();

    try {
      // Excluir perfil do usuário
      const userRef = window.db.collection('users').doc(userId);
      batch.delete(userRef);

      // Excluir resultados de quiz
      const quizResults = await window.db.collection('quiz_results')
        .where('userId', '==', userId)
        .get();
      
      quizResults.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Executar todas as exclusões
      await batch.commit();
      
      console.log('Dados do usuário excluídos do Firestore');
    } catch (error) {
      console.error('Erro ao excluir dados do Firestore:', error);
      throw error;
    }
  }

  // Limpar dados locais
  clearLocalData() {
    try {
      // Limpar localStorage
      localStorage.clear();
      
      // Limpar sessionStorage
      sessionStorage.clear();
      
      // Limpar cookies se houver
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });

      console.log('Dados locais limpos');
    } catch (error) {
      console.error('Erro ao limpar dados locais:', error);
    }
  }

  // Exportar dados do usuário
  async exportData() {
    try {
      // Coletar todos os dados do usuário
      const userData = {
        profile: this.userDoc,
        exportedAt: new Date().toISOString(),
        quizResults: []
      };

      // Buscar resultados de quiz
      const quizResults = await window.db.collection('quiz_results')
        .where('userId', '==', this.userDoc.id)
        .orderBy('timestamp', 'desc')
        .get();

      quizResults.forEach(doc => {
        userData.quizResults.push(doc.data());
      });

      // Criar arquivo para download
      const blob = new Blob([JSON.stringify(userData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyberguard_data_${this.userDoc.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);

      this.showNotification('Dados exportados com sucesso! 📥', 'success');

    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados: ' + error.message);
    }
  }

  // Atualizar estatísticas do usuário
  async updateStats(quizResult) {
    if (!this.userDoc) return;

    try {
      const newStats = {
        totalQuizzes: this.userDoc.stats.totalQuizzes + 1,
        bestScore: Math.max(this.userDoc.stats.bestScore, quizResult.score),
        totalTimePlayed: this.userDoc.stats.totalTimePlayed + (quizResult.timeSpent || 0)
      };

      // Calcular nova média
      newStats.averageScore = Math.round(
        ((this.userDoc.stats.averageScore * this.userDoc.stats.totalQuizzes) + quizResult.score) 
        / newStats.totalQuizzes
      );

      await window.db.collection('users').doc(this.userDoc.id).update({
        stats: newStats,
        updatedAt: new Date().toISOString()
      });

      this.userDoc.stats = newStats;
      console.log('Estatísticas atualizadas:', newStats);

    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }

  // Métodos auxiliares
  generateAvatar(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[name.length % colors.length];
    
    return `
      <div class="avatar" style="background: ${color}; color: white; width: 60px; height: 60px; 
           border-radius: 50%; display: flex; align-items: center; justify-content: center; 
           font-size: 1.5rem; font-weight: bold;">
        ${initials}
      </div>
    `;
  }

  maskEmail(email) {
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 2) + '*'.repeat(local.length - 2);
    return maskedLocal + '@' + domain;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  formatPlayTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--primary-color, #00ff7f)' : 'var(--secondary-color, #6495ed)'};
      color: var(--bg-color, #0a0a0a);
      padding: 1rem;
      border-radius: 5px;
      z-index: 10005;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  addUserModalStyles(modal) {
    modal.innerHTML += `
      <style>
        .user-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(5px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .user-modal-content {
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.98), rgba(0, 30, 60, 0.98));
          border: 1px solid var(--primary-color, #00ff7f);
          border-radius: 15px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
        }
        
        .user-modal.danger .user-modal-content {
          border-color: #ff4444;
        }
        
        .user-modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .user-modal-header.danger {
          background: rgba(255, 68, 68, 0.1);
        }
        
        .user-modal-header h2 {
          margin: 0;
          color: var(--primary-color, #00ff7f);
        }
        
        .user-modal-header.danger h2 {
          color: #ff4444;
        }
        
        .close-user-modal {
          background: none;
          border: none;
          color: var(--text-color, #e0e0e0);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
        }
        
        .close-user-modal:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .user-profile-section {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .profile-info h3 {
          margin: 0 0 0.5rem 0;
          color: var(--primary-color, #00ff7f);
          font-size: 1.3rem;
        }
        
        .profile-email {
          color: var(--secondary-color, #6495ed);
          margin: 0.25rem 0;
        }
        
        .profile-since {
          color: #999;
          font-size: 0.9rem;
          margin: 0;
        }
        
        .profile-stats {
          padding: 0 1.5rem 1.5rem 1.5rem;
        }
        
        .profile-stats h3 {
          margin: 0 0 1rem 0;
          color: var(--accent-color, #40e0d0);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        
        .stat-item {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary-color, #00ff7f);
          margin-bottom: 0.25rem;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: var(--text-color, #e0e0e0);
        }
        
        .profile-actions {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
        
        .profile-btn {
          padding: 0.75rem 1rem;
          border: 1px solid;
          background: transparent;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          text-align: center;
        }
        
        .profile-btn.edit {
          border-color: var(--primary-color, #00ff7f);
          color: var(--primary-color, #00ff7f);
        }
        
        .profile-btn.edit:hover {
          background: var(--primary-color, #00ff7f);
          color: var(--bg-color, #0a0a0a);
        }
        
        .profile-btn.preferences {
          border-color: #6e7681;
          color: #6e7681;
          opacity: 0.7;
          cursor: help;
        }
        
        .profile-btn.preferences:hover {
          background: #6e7681;
          color: var(--bg-color, #0a0a0a);
          opacity: 0.8;
        }
        
        .profile-btn.export {
          border-color: var(--accent-color, #40e0d0);
          color: var(--accent-color, #40e0d0);
        }
        
        .profile-btn.export:hover {
          background: var(--accent-color, #40e0d0);
          color: var(--bg-color, #0a0a0a);
        }
        
        .profile-btn.delete {
          border-color: #ff4444;
          color: #ff4444;
        }
        
        .profile-btn.delete:hover {
          background: #ff4444;
          color: white;
        }
        
        .edit-profile-form {
          padding: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--accent-color, #40e0d0);
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          color: var(--text-color, #e0e0e0);
          font-size: 1rem;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: var(--primary-color, #00ff7f);
          box-shadow: 0 0 0 2px rgba(0, 255, 127, 0.2);
        }
        
        .form-group input:readonly {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #999;
          font-size: 0.8rem;
        }
        
        .change-password-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--secondary-color, #6495ed);
          background: transparent;
          color: var(--secondary-color, #6495ed);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .change-password-btn:hover {
          background: var(--secondary-color, #6495ed);
          color: var(--bg-color, #0a0a0a);
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }
        
        .cancel-btn, .save-btn {
          padding: 0.75rem 1.5rem;
          border: 1px solid;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .cancel-btn {
          border-color: #666;
          background: transparent;
          color: #999;
        }
        
        .cancel-btn:hover {
          background: #666;
          color: white;
        }
        
        .save-btn {
          border-color: var(--primary-color, #00ff7f);
          background: var(--primary-color, #00ff7f);
          color: var(--bg-color, #0a0a0a);
        }
        
        .save-btn:hover {
          background: var(--accent-color, #40e0d0);
          border-color: var(--accent-color, #40e0d0);
        }
        
        .delete-warning {
          padding: 1.5rem;
          text-align: center;
        }
        
        .warning-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .delete-warning h3 {
          color: #ff4444;
          margin: 0 0 1rem 0;
        }
        
        .delete-list {
          text-align: left;
          max-width: 300px;
          margin: 1rem auto;
          padding: 0;
          list-style: none;
        }
        
        .delete-list li {
          padding: 0.5rem 0;
          color: #ff6666;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .data-export-reminder {
          background: rgba(100, 149, 237, 0.1);
          padding: 1rem;
          border-radius: 5px;
          border: 1px solid var(--secondary-color, #6495ed);
          margin: 1rem 0;
        }
        
        .delete-confirmation {
          padding: 1.5rem;
        }
        
        .delete-confirmation label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 1rem 0;
          color: var(--text-color, #e0e0e0);
          cursor: pointer;
        }
        
        .delete-confirmation input[type="checkbox"] {
          width: auto;
        }
        
        .password-confirmation {
          margin-top: 1.5rem;
        }
        
        .password-confirmation label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--accent-color, #40e0d0);
        }
        
        .password-confirmation input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          color: var(--text-color, #e0e0e0);
        }
        
        .delete-actions {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .export-first-btn {
          padding: 0.75rem 1rem;
          border: 1px solid var(--accent-color, #40e0d0);
          background: transparent;
          color: var(--accent-color, #40e0d0);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }
        
        .export-first-btn:hover {
          background: var(--accent-color, #40e0d0);
          color: var(--bg-color, #0a0a0a);
        }
        
        .delete-confirm-btn {
          padding: 0.75rem 1rem;
          border: 1px solid #ff4444;
          background: #ff4444;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 0.9rem;
        }
        
        .delete-confirm-btn:hover {
          background: #cc0000;
          border-color: #cc0000;
        }
        
        @media (max-width: 768px) {
          .user-modal-content {
            margin: 0.5rem;
            max-width: calc(100vw - 1rem);
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .profile-actions {
            grid-template-columns: 1fr;
          }
          
          .user-profile-section {
            flex-direction: column;
            text-align: center;
          }
          
          .delete-actions {
            flex-direction: column;
          }
        }
      </style>
    `;
  }
}

// Inicializar gerenciador de conta
window.userAccountManager = new UserAccountManager();
