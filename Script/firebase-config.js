// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAY7gBP_ygNQ5P2if_j7ad-P5udblblnzA",
  authDomain: "cyberguard-pro-27c29.firebaseapp.com",
  projectId: "cyberguard-pro-27c29",
  storageBucket: "cyberguard-pro-27c29.firebasestorage.app",
  messagingSenderId: "891637083155",
  appId: "1:891637083155:web:b1f3fb09f84d25bcee63e6"
};

// Inicializar Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Autenticação anônima para usuários
signInAnonymously(auth).catch((error) => {
  console.error('Erro na autenticação:', error);
});

// Sistema de usuário atual
let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Classe para gerenciar dados do Firebase
class FirebaseManager {
  
  // Carregar perguntas do Firestore
  static async loadQuestions(difficulty) {
    try {
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef);
      const querySnapshot = await getDocs(q);
      
      const questions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.difficulty === difficulty) {
          questions.push(data);
        }
      });
      
      return questions;
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
      return []; // Retorna array vazio em caso de erro
    }
  }
  
  // Salvar resultado do quiz
  static async saveQuizResult(difficulty, score, totalQuestions, wrongAnswers) {
    if (!currentUser) return;
    
    try {
      const result = {
        userId: currentUser.uid,
        difficulty: difficulty,
        score: score,
        totalQuestions: totalQuestions,
        wrongAnswers: wrongAnswers,
        timestamp: new Date(),
        percentage: (score / totalQuestions) * 100
      };
      
      await addDoc(collection(db, 'quiz_results'), result);
      
      // Atualizar ranking
      await this.updateRanking(currentUser.uid, difficulty, score, totalQuestions);
      
    } catch (error) {
      console.error('Erro ao salvar resultado:', error);
    }
  }
  
  // Atualizar ranking
  static async updateRanking(userId, difficulty, score, totalQuestions) {
    try {
      const percentage = (score / totalQuestions) * 100;
      
      const rankingData = {
        userId: userId,
        difficulty: difficulty,
        bestScore: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        lastUpdate: new Date()
      };
      
      await addDoc(collection(db, 'rankings'), rankingData);
      
    } catch (error) {
      console.error('Erro ao atualizar ranking:', error);
    }
  }
  
  // Carregar ranking
  static async loadRanking(difficulty, limitResults = 10) {
    try {
      const rankingsRef = collection(db, 'rankings');
      const q = query(
        rankingsRef,
        orderBy('percentage', 'desc'),
        limit(limitResults)
      );
      
      const querySnapshot = await getDocs(q);
      const rankings = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.difficulty === difficulty) {
          rankings.push(data);
        }
      });
      
      return rankings;
      
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      return [];
    }
  }
  
  // Migrar perguntas locais para Firestore (executar apenas uma vez)
  static async migrateLocalQuestions() {
    if (!currentUser) return;
    
    const localQuizzes = {
      easy: [
        {
          question: "Seu Wi-Fi de empresa está aberto e sem senha. O que você faz?",
          options: ["Nada, está tudo bem.", "Coloca uma senha forte e WPA2."],
          correctAnswer: 1,
          difficulty: "easy"
        }
        // ... adicione todas as outras perguntas
      ],
      medium: [
        // ... perguntas médias
      ],
      hard: [
        // ... perguntas difíceis
      ]
    };
    
    try {
      for (const [difficulty, questions] of Object.entries(localQuizzes)) {
        for (const question of questions) {
          await addDoc(collection(db, 'questions'), {
            ...question,
            difficulty: difficulty,
            createdAt: new Date()
          });
        }
      }
      console.log('Perguntas migradas com sucesso!');
    } catch (error) {
      console.error('Erro na migração:', error);
    }
  }
}

export { FirebaseManager, auth, db };
