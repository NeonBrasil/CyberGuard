// Sistema de Autenticação e Usuários para SIA: Security & Information Academy
import { FirebaseManager } from './firebase-config.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase-config.js';

class UserManager {
  constructor() {
    this.currentUser = null;
    this.setupAuthListener();
  }

  // Listener para mudanças de autenticação
  setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserProfile();
        this.updateUI();
      } else {
        this.showLoginForm();
      }
    });
  }

  // Criar conta
  async createAccount(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Atualizar perfil
      await updateProfile(user, { displayName: displayName });
      
      // Criar documento do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        displayName: displayName,
        createdAt: new Date(),
        totalQuizzes: 0,
        totalScore: 0,
        bestScores: {
          easy: 0,
          medium: 0,
          hard: 0
        },
        achievements: [],
        isPublic: true, // Para aparecer no leaderboard
        lastActivity: new Date()
      });

      return { success: true, user: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Fazer login
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Carregar perfil do usuário
  async loadUserProfile() {
    if (!this.currentUser) return null;
    
    try {
      const docRef = doc(db, 'users', this.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  }

  // Atualizar estatísticas após quiz
  async updateUserStats(difficulty, score, totalQuestions) {
    if (!this.currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const percentage = (score / totalQuestions) * 100;
        
        const updates = {
          totalQuizzes: userData.totalQuizzes + 1,
          totalScore: userData.totalScore + score,
          lastActivity: new Date(),
          [`bestScores.${difficulty}`]: Math.max(userData.bestScores[difficulty] || 0, percentage)
        };
        
        // Adicionar conquistas
        const achievements = userData.achievements || [];
        if (percentage === 100 && !achievements.includes(`perfect_${difficulty}`)) {
          achievements.push(`perfect_${difficulty}`);
          updates.achievements = achievements;
        }
        
        await updateDoc(userDocRef, updates);
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }

  // Atualizar interface
  updateUI() {
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    const userInfo = document.getElementById('user-info');
    
    if (this.currentUser) {
      if (loginSection) loginSection.style.display = 'none';
      if (userSection) userSection.style.display = 'block';
      if (userInfo) {
        userInfo.innerHTML = `
          <div class="user-profile">
            <span class="user-name">👋 ${this.currentUser.displayName || this.currentUser.email}</span>
            <button onclick="userManager.logout()" class="logout-btn">Sair</button>
          </div>
        `;
      }
    } else {
      if (loginSection) loginSection.style.display = 'block';
      if (userSection) userSection.style.display = 'none';
    }
  }

  // Mostrar formulário de login
  showLoginForm() {
    // Implementar modal de login/registro
  }
}

// Sistema de Leaderboard
class LeaderboardManager {
  
  // Carregar ranking geral
  static async getGlobalLeaderboard(limit = 20) {
    try {
      const rankingsRef = collection(db, 'leaderboard');
      const q = query(
        rankingsRef,
        orderBy('totalScore', 'desc'),
        orderBy('totalQuizzes', 'desc'),
        limitToFirst(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const leaderboard = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isPublic) { // Só mostrar usuários que permitem
          leaderboard.push({
            rank: leaderboard.length + 1,
            displayName: data.displayName,
            totalScore: data.totalScore,
            totalQuizzes: data.totalQuizzes,
            avgScore: (data.totalScore / data.totalQuizzes).toFixed(1),
            bestScores: data.bestScores
          });
        }
      });
      
      return leaderboard;
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
      return [];
    }
  }

  // Carregar ranking por dificuldade
  static async getDifficultyLeaderboard(difficulty, limit = 10) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        orderBy(`bestScores.${difficulty}`, 'desc'),
        limitToFirst(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const leaderboard = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isPublic && data.bestScores[difficulty] > 0) {
          leaderboard.push({
            rank: leaderboard.length + 1,
            displayName: data.displayName,
            score: data.bestScores[difficulty],
            totalQuizzes: data.totalQuizzes
          });
        }
      });
      
      return leaderboard;
    } catch (error) {
      console.error('Erro ao carregar ranking por dificuldade:', error);
      return [];
    }
  }

  // Atualizar posição no leaderboard
  static async updateLeaderboard(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Atualizar documento no leaderboard
        await setDoc(doc(db, 'leaderboard', userId), {
          uid: userId,
          displayName: userData.displayName,
          totalScore: userData.totalScore,
          totalQuizzes: userData.totalQuizzes,
          bestScores: userData.bestScores,
          isPublic: userData.isPublic,
          lastUpdate: new Date()
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar leaderboard:', error);
    }
  }
}

// Instância global
const userManager = new UserManager();

// Exportar para uso global
window.userManager = userManager;
window.LeaderboardManager = LeaderboardManager;

export { UserManager, LeaderboardManager };
