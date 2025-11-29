
document.addEventListener('DOMContentLoaded', () => {
  const studyManager = {
    user: null,
    progress: {},
    topics: [],

    init() {
      this.topics = Array.from(document.querySelectorAll('.topic-item')).map(el => el.dataset.topicId);
      console.log('📚 Material de Estudos inicializado');
      console.log('📋 Tópicos encontrados:', this.topics);
      
      // Atualizar contagem total
      document.getElementById('total-count').textContent = this.topics.length;
      
      this.initFirebase();
      this.attachEventListeners();
    },

    initFirebase() {
      // Aguardar Firebase estar disponível
      const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
          clearInterval(checkFirebase);
          
          firebase.auth().onAuthStateChanged(user => {
            if (user) {
              this.user = user;
              console.log('✅ Usuário autenticado:', user.email);
              this.loadProgress();
            } else {
              this.user = null;
              console.log('⚠️ Usuário não autenticado');
              this.renderLoggedOutState();
            }
          });
        }
      }, 100);
      
      // Timeout após 5 segundos
      setTimeout(() => {
        clearInterval(checkFirebase);
        if (!this.user) {
          console.log('⏰ Timeout: Firebase não carregado, mostrando estado deslogado');
          this.renderLoggedOutState();
        }
      }, 5000);
    },

    attachEventListeners() {
      document.querySelectorAll('.topic-header').forEach(header => {
        header.addEventListener('click', e => {
          if (e.target.tagName !== 'BUTTON') {
            const item = header.closest('.topic-item');
            item.classList.toggle('active');
          }
        });
      });

      document.querySelectorAll('.mark-complete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const topicId = e.target.dataset.topicId;
          this.markAsComplete(topicId);
        });
      });
    },

    loadProgress() {
      if (!this.user) return;

      console.log('📥 Carregando progresso do usuário...');
      const docRef = firebase.firestore().collection('userProgress').doc(this.user.uid);

      docRef.get().then(doc => {
        if (doc.exists) {
          this.progress = doc.data();
          console.log('✅ Progresso carregado:', this.progress);
        } else {
          this.progress = {};
          console.log('ℹ️ Nenhum progresso salvo ainda');
        }
        this.renderProgress();
      }).catch(error => {
        console.error("❌ Erro ao carregar progresso:", error);
        this.progress = {};
        this.renderProgress();
      });
    },

    saveProgress() {
      if (!this.user) {
        console.log('⚠️ Usuário não logado, progresso não será salvo');
        return;
      }

      const docRef = firebase.firestore().collection('userProgress').doc(this.user.uid);

      docRef.set(this.progress, { merge: true })
        .then(() => {
          console.log('✅ Progresso salvo com sucesso');
          this.showNotification('✅ Progresso salvo!', 'success');
        })
        .catch(error => {
          console.error("❌ Erro ao salvar progresso:", error);
          this.showNotification('❌ Erro ao salvar progresso', 'error');
        });
    },

    markAsComplete(topicId) {
      if (!this.user) {
        this.showNotification('⚠️ Faça login para salvar seu progresso!', 'warning');
        // Mostrar prompt de login
        document.getElementById('login-prompt').style.display = 'block';
        return;
      }

      console.log('✓ Marcando tópico como concluído:', topicId);
      this.progress[topicId] = true;
      this.saveProgress();
      this.renderProgress();
    },

    renderProgress() {
      let completedTopics = 0;

      this.topics.forEach(topicId => {
        const topicElement = document.querySelector(`.topic-item[data-topic-id='${topicId}']`);
        if (!topicElement) return;
        
        const progressIndicator = topicElement.querySelector('.progress-indicator');
        const markCompleteBtn = topicElement.querySelector('.mark-complete-btn');

        if (this.progress[topicId]) {
          progressIndicator.textContent = '✅';
          markCompleteBtn.textContent = '✓ Concluído';
          markCompleteBtn.disabled = true;
          topicElement.classList.add('completed');
          completedTopics++;
        } else {
          progressIndicator.textContent = '🔲';
          markCompleteBtn.textContent = '✓ Marcar como concluído';
          markCompleteBtn.disabled = false;
          topicElement.classList.remove('completed');
        }
      });

      const progress = this.topics.length > 0 ? (completedTopics / this.topics.length) * 100 : 0;
      
      // Atualizar barra de progresso
      const progressBar = document.getElementById('progress-bar');
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${Math.round(progress)}%`;
      
      // Atualizar estatísticas
      document.getElementById('completed-count').textContent = completedTopics;
      document.getElementById('percentage-complete').textContent = `${Math.round(progress)}%`;
      
      console.log(`📊 Progresso atualizado: ${completedTopics}/${this.topics.length} (${Math.round(progress)}%)`);
    },

    renderLoggedOutState() {
      this.progress = {};
      this.renderProgress();
      
      // Mostrar aviso de login
      document.getElementById('login-prompt').style.display = 'block';
      
      console.log('ℹ️ Estado deslogado renderizado');
    },
    
    showNotification(message, type = 'info') {
      const colors = {
        success: '#00ff7f',
        error: '#ff4757',
        warning: '#ffc107',
        info: '#58a6ff'
      };
      
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  studyManager.init();
});

// Animações CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
