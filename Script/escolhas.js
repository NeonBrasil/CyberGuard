// Variáveis globais do quiz
let currentQuiz = [];
let currentIndex = 0;
let score = 0;
let selectedOption = null;
let wrongAnswers = [];
let currentDifficulty = '';
let currentUser = null;

// Mapear nomes de dificuldade
const difficultyMap = {
  'small': 'easy',
  'medium': 'medium', 
  'large': 'hard'
};

// Aguardar o Firebase carregar
document.addEventListener('DOMContentLoaded', function() {
  // Firebase Manager Simplificado
  window.FirebaseManager = {
    async loadQuestions(difficulty) {
      try {
        if (!window.db) {
          console.error('Firebase não inicializado');
          return [];
        }
        
        const questionsRef = db.collection('questions');
        const querySnapshot = await questionsRef.get();
        
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
        return [];
      }
    },
    
    async saveQuizResult(difficulty, score, totalQuestions, wrongAnswers) {
      if (!window.currentUser) return;
      
      try {
        const result = {
          userId: window.currentUser.uid,
          difficulty: difficulty,
          score: score,
          totalQuestions: totalQuestions,
          wrongAnswers: wrongAnswers,
          timestamp: new Date(),
          percentage: (score / totalQuestions) * 100
        };
        
        await db.collection('quiz_results').add(result);
        
      } catch (error) {
        console.error('Erro ao salvar resultado:', error);
      }
    }
  };

  // Sistema de Autenticação
  if (window.auth) {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      window.currentUser = user;
      updateUserInterface();
    });
  }
});

function updateUserInterface() {
  const loginBtn = document.getElementById('loginBtn');
  if (currentUser && currentUser.email) {
    loginBtn.textContent = `👤 ${currentUser.email}`;
    loginBtn.onclick = showUserInfo;
  } else {
    loginBtn.textContent = '🔐 Login';
    loginBtn.onclick = showLoginModal;
  }
}

function showLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('userInfo').classList.add('hidden');
}

function showUserInfo() {
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('userInfo').classList.remove('hidden');
  document.getElementById('userEmail').textContent = currentUser.email || 'Usuário anônimo';
}

function hideLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('Preencha email e senha!');
    return;
  }
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
    hideLoginModal();
    alert('Login realizado com sucesso!');
  } catch (error) {
    alert('Erro no login: ' + error.message);
  }
}

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('Preencha email e senha!');
    return;
  }
  
  if (password.length < 6) {
    alert('Senha deve ter pelo menos 6 caracteres!');
    return;
  }
  
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    hideLoginModal();
    alert('Conta criada com sucesso!');
  } catch (error) {
    alert('Erro ao criar conta: ' + error.message);
  }
}

async function logout() {
  try {
    await auth.signOut();
    hideLoginModal();
    alert('Logout realizado!');
  } catch (error) {
    alert('Erro no logout: ' + error.message);
  }
}

// Funções principais do quiz
async function startSimulation(difficulty) {
  if (!difficulty) {
    alert('Selecione uma dificuldade!');
    return;
  }
  
  currentDifficulty = difficultyMap[difficulty] || difficulty;
  
  // Carregar perguntas do Firebase
  const questions = await window.FirebaseManager.loadQuestions(currentDifficulty);
  
  if (questions.length === 0) {
    alert('Nenhuma pergunta encontrada para esta dificuldade!');
    return;
  }
  
  currentQuiz = shuffleArray(questions);
  currentIndex = 0;
  score = 0;
  wrongAnswers = [];
  
  updateProgressBar();
  displayQuestion();
  document.getElementById('quiz-container').style.display = 'block';
  
  // Esconder a tela de seleção
  const difficultySection = document.querySelector('.difficulty-section');
  if (difficultySection) {
    difficultySection.style.display = 'none';
  }
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function displayQuestion() {
  if (currentIndex >= currentQuiz.length) {
    showResults();
    return;
  }
  
  const question = currentQuiz[currentIndex];
  const questionElement = document.getElementById('question-title');
  const optionsContainer = document.getElementById('options-container');
  
  questionElement.textContent = question.question;
  
  optionsContainer.innerHTML = '';
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option;
    button.onclick = () => selectOption(index);
    optionsContainer.appendChild(button);
  });
  
  selectedOption = null;
  document.getElementById('next-btn').disabled = true;
  updateProgressBar();
}

function selectOption(index) {
  selectedOption = index;
  
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn, i) => {
    btn.classList.remove('selected');
    if (i === index) {
      btn.classList.add('selected');
    }
  });
  
  document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
  if (selectedOption === null) {
    alert('Selecione uma opção!');
    return;
  }
  
  const question = currentQuiz[currentIndex];
  const isCorrect = selectedOption === question.correct;
  
  if (isCorrect) {
    score++;
  } else {
    wrongAnswers.push({
      question: question.question,
      selectedAnswer: question.options[selectedOption],
      correctAnswer: question.options[question.correct]
    });
  }
  
  currentIndex++;
  displayQuestion();
}

function updateProgressBar() {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  if (currentQuiz.length > 0) {
    const progress = (currentIndex / currentQuiz.length) * 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = `${currentIndex}/${currentQuiz.length}`;
  }
}

async function showResults() {
  const percentage = Math.round((score / currentQuiz.length) * 100);
  let message = `🎯 Quiz Finalizado!\n\n`;
  message += `📊 Pontuação: ${score}/${currentQuiz.length} (${percentage}%)\n`;
  message += `🎯 Dificuldade: ${currentDifficulty}\n\n`;
  
  if (percentage >= 80) {
    message += '🏆 Excelente! Você domina este tópico!';
  } else if (percentage >= 60) {
    message += '👍 Bom trabalho! Continue estudando!';
  } else {
    message += '📚 Continue estudando para melhorar!';
  }
  
  if (wrongAnswers.length > 0) {
    message += '\n\n❌ Respostas incorretas:\n';
    wrongAnswers.forEach((wrong, index) => {
      message += `\n${index + 1}. ${wrong.question}\n`;
      message += `   Sua resposta: ${wrong.selectedAnswer}\n`;
      message += `   Resposta correta: ${wrong.correctAnswer}\n`;
    });
  }
  
  // Salvar resultado no Firebase se o usuário estiver logado
  if (window.currentUser) {
    await window.FirebaseManager.saveQuizResult(currentDifficulty, score, currentQuiz.length, wrongAnswers);
  }
  
  alert(message);
  restartQuiz();
}

function restartQuiz() {
  currentQuiz = [];
  currentIndex = 0;
  score = 0;
  selectedOption = null;
  wrongAnswers = [];
  
  document.getElementById('quiz-container').style.display = 'none';
  
  // Mostrar a tela de seleção novamente
  const difficultySection = document.querySelector('.difficulty-section');
  if (difficultySection) {
    difficultySection.style.display = 'block';
  }
}

// Disponibilizar funções globalmente para o HTML
window.startSimulation = startSimulation;
window.nextQuestion = nextQuestion;
window.showLoginModal = showLoginModal;
window.showUserInfo = showUserInfo;
window.hideLoginModal = hideLoginModal;
window.login = login;
window.register = register;
window.logout = logout;