
document.addEventListener('DOMContentLoaded', () => {
  const studyManager = {
    user: null,
    progress: {},
    topics: [],

    init() {
      this.topics = Array.from(document.querySelectorAll('.topic-item')).map(el => el.dataset.topicId);
      this.initFirebase();
      this.attachEventListeners();
    },

    initFirebase() {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          this.user = user;
          this.loadProgress();
        } else {
          this.user = null;
          this.renderLoggedOutState();
        }
      });
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

      const docRef = firebase.firestore().collection('userProgress').doc(this.user.uid);

      docRef.get().then(doc => {
        if (doc.exists) {
          this.progress = doc.data();
        } else {
          this.progress = {};
        }
        this.renderProgress();
      }).catch(error => {
        console.error("Error getting document:", error);
      });
    },

    saveProgress() {
      if (!this.user) return;

      const docRef = firebase.firestore().collection('userProgress').doc(this.user.uid);

      docRef.set(this.progress, { merge: true }).catch(error => {
        console.error("Error writing document:", error);
      });
    },

    markAsComplete(topicId) {
      if (!this.user) {
        alert('Você precisa estar logado para marcar um tópico como concluído.');
        return;
      }

      this.progress[topicId] = true;
      this.saveProgress();
      this.renderProgress();
    },

    renderProgress() {
      let completedTopics = 0;

      this.topics.forEach(topicId => {
        const topicElement = document.querySelector(`.topic-item[data-topic-id='${topicId}']`);
        const progressIndicator = topicElement.querySelector('.progress-indicator');
        const markCompleteBtn = topicElement.querySelector('.mark-complete-btn');

        if (this.progress[topicId]) {
          progressIndicator.textContent = '✅';
          markCompleteBtn.textContent = 'Concluído';
          markCompleteBtn.disabled = true;
          completedTopics++;
        } else {
          progressIndicator.textContent = '🔲';
          markCompleteBtn.textContent = 'Marcar como concluído';
          markCompleteBtn.disabled = false;
        }
      });

      const progress = (completedTopics / this.topics.length) * 100;
      const progressBar = document.getElementById('progress-bar');
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${Math.round(progress)}%`;
    },

    renderLoggedOutState() {
      this.progress = {};
      this.renderProgress();
      const userProgress = document.getElementById('user-progress');
      userProgress.innerHTML = '<p>Você não está logado. Seu progresso não será salvo.</p>';
    }
  };

  studyManager.init();
});
