// Variáveis globais do quiz
var currentQuiz = [];
var currentIndex = 0;
var score = 0;
var selectedOption = null;
var wrongAnswers = [];
var currentDifficulty = '';
var currentUser = null;

// Mapear nomes de dificuldade
var difficultyMap = {
  'small': 'easy',
  'medium': 'medium', 
  'large': 'hard'
};

// Aguardar o Firebase carregar
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado');
  console.log('Firebase disponível:', !!window.firebase);
  console.log('DB disponível:', !!window.db);
  console.log('Auth disponível:', !!window.auth);
  
  // Firebase Manager Simplificado
  window.FirebaseManager = {
    loadQuestions: function(difficulty) {
      return new Promise(function(resolve, reject) {
        try {
          if (!window.db) {
            console.error('Firebase não inicializado');
            resolve([]);
            return;
          }
          
          var questionsRef = db.collection('questions');
          questionsRef.get().then(function(querySnapshot) {
            var questions = [];
            querySnapshot.forEach(function(doc) {
              var data = doc.data();
              if (data.difficulty === difficulty) {
                questions.push(data);
              }
            });
            resolve(questions);
          }).catch(function(error) {
            console.error('Erro ao carregar perguntas:', error);
            resolve([]);
          });
        } catch (error) {
          console.error('Erro ao carregar perguntas:', error);
          resolve([]);
        }
      });
    },
    
    saveQuizResult: function(difficulty, score, totalQuestions, wrongAnswers) {
      return new Promise(function(resolve, reject) {
        if (!window.currentUser) {
          resolve();
          return;
        }
        
        try {
          var result = {
            userId: window.currentUser.uid,
            difficulty: difficulty,
            score: score,
            totalQuestions: totalQuestions,
            wrongAnswers: wrongAnswers,
            timestamp: new Date(),
            percentage: (score / totalQuestions) * 100
          };
          
          db.collection('quiz_results').add(result).then(function() {
            resolve();
          }).catch(function(error) {
            console.error('Erro ao salvar resultado:', error);
            resolve();
          });
        } catch (error) {
          console.error('Erro ao salvar resultado:', error);
          resolve();
        }
      });
    }
  };

  // Sistema de Autenticação
  if (window.auth) {
    console.log('Inicializando sistema de autenticação');
    auth.onAuthStateChanged(function(user) {
      console.log('Estado do usuário mudou:', user);
      currentUser = user;
      window.currentUser = user;
      updateUserInterface();
    });
  } else {
    console.error('Firebase Auth não está disponível');
  }
  
  // Fechar modal clicando fora dele
  var modal = document.getElementById('loginModal');
  if (modal) {
    modal.onclick = function(event) {
      if (event.target === modal) {
        hideLoginModal();
      }
    };
  }
  
  // Fechar modal com tecla ESC
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      var modal = document.getElementById('loginModal');
      if (modal && !modal.classList.contains('hidden')) {
        hideLoginModal();
      }
    }
  });
});

function updateUserInterface() {
  console.log('Atualizando interface do usuário');
  var loginBtn = document.getElementById('loginBtn');
  
  if (!loginBtn) {
    console.error('Botão de login não encontrado');
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
  
  // Se há resultado pendente e usuário fechou modal, reinicia quiz
  if (pendingResult) {
    pendingResult = null;
    restartQuiz();
  }
}

// Variáveis para salvar resultado pendente
var pendingResult = null;

function login() {
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;
  
  if (!email || !password) {
    alert('Preencha email e senha!');
    return;
  }
  
  auth.signInWithEmailAndPassword(email, password).then(function() {
    hideLoginModal();
    alert('Login realizado com sucesso!');
    
    // Salvar resultado pendente se existir
    if (pendingResult) {
      window.FirebaseManager.saveQuizResult(
        pendingResult.difficulty, 
        pendingResult.score, 
        pendingResult.totalQuestions, 
        pendingResult.wrongAnswers
      ).then(function() {
        alert('Seu resultado foi salvo! Agora você aparece no ranking! 🏆');
        pendingResult = null;
        restartQuiz();
      });
    }
  }).catch(function(error) {
    alert('Erro no login: ' + error.message);
  });
}

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
  
  auth.createUserWithEmailAndPassword(email, password).then(function() {
    hideLoginModal();
    alert('Conta criada com sucesso!');
    
    // Salvar resultado pendente se existir
    if (pendingResult) {
      window.FirebaseManager.saveQuizResult(
        pendingResult.difficulty, 
        pendingResult.score, 
        pendingResult.totalQuestions, 
        pendingResult.wrongAnswers
      ).then(function() {
        alert('Seu resultado foi salvo! Bem-vindo ao ranking! 🏆');
        pendingResult = null;
        restartQuiz();
      });
    }
  }).catch(function(error) {
    alert('Erro ao criar conta: ' + error.message);
  });
}

function logout() {
  auth.signOut().then(function() {
    hideLoginModal();
    alert('Logout realizado!');
  }).catch(function(error) {
    alert('Erro no logout: ' + error.message);
  });
}

// Funções principais do quiz
function startSimulation(difficulty) {
  if (!difficulty) {
    alert('Selecione uma dificuldade!');
    return;
  }
  
  currentDifficulty = difficultyMap[difficulty] || difficulty;
  
  // Carregar perguntas do Firebase
  window.FirebaseManager.loadQuestions(currentDifficulty).then(function(questions) {
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
    var difficultySection = document.querySelector('.difficulty-section');
    if (difficultySection) {
      difficultySection.style.display = 'none';
    }
  });
}

function shuffleArray(array) {
  var shuffled = array.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

function displayQuestion() {
  if (currentIndex >= currentQuiz.length) {
    showResults();
    return;
  }
  
  var question = currentQuiz[currentIndex];
  var questionElement = document.getElementById('question-title');
  var optionsContainer = document.getElementById('options-container');
  
  questionElement.textContent = question.question;
  
  optionsContainer.innerHTML = '';
  question.options.forEach(function(option, index) {
    var button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option;
    button.onclick = function() { selectOption(index); };
    optionsContainer.appendChild(button);
  });
  
  selectedOption = null;
  document.getElementById('next-btn').disabled = true;
  updateProgressBar();
}

function selectOption(index) {
  selectedOption = index;
  
  var buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(function(btn, i) {
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
  
  var question = currentQuiz[currentIndex];
  var isCorrect = selectedOption === question.correct;
  
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
  var progressFill = document.getElementById('progress-fill');
  var progressText = document.getElementById('progress-text');
  
  if (currentQuiz.length > 0) {
    var progress = (currentIndex / currentQuiz.length) * 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = currentIndex + '/' + currentQuiz.length;
  }
}

function showResults() {
  var percentage = Math.round((score / currentQuiz.length) * 100);
  var message = '🎯 Quiz Finalizado!\n\n';
  message += '📊 Pontuação: ' + score + '/' + currentQuiz.length + ' (' + percentage + '%)\n';
  message += '🎯 Dificuldade: ' + currentDifficulty + '\n\n';
  
  if (percentage >= 80) {
    message += '🏆 Excelente! Você domina este tópico!';
  } else if (percentage >= 60) {
    message += '👍 Bom trabalho! Continue estudando!';
  } else {
    message += '📚 Continue estudando para melhorar!';
  }
  
  if (wrongAnswers.length > 0) {
    message += '\n\n❌ Respostas incorretas:\n';
    wrongAnswers.forEach(function(wrong, index) {
      message += '\n' + (index + 1) + '. ' + wrong.question + '\n';
      message += '   Sua resposta: ' + wrong.selectedAnswer + '\n';
      message += '   Resposta correta: ' + wrong.correctAnswer + '\n';
    });
  }
  
  // Salvar resultado no Firebase se o usuário estiver logado
  if (window.currentUser) {
    window.FirebaseManager.saveQuizResult(currentDifficulty, score, currentQuiz.length, wrongAnswers);
    alert(message);
  } else {
    // Usuário não logado - oferecer login para salvar resultado
    alert(message + '\n\n💡 Dica: Faça login para salvar seu progresso e aparecer no ranking!');
    if (confirm('Deseja fazer login agora para salvar este resultado?')) {
      // Salvar resultado para quando o usuário fizer login
      pendingResult = {
        difficulty: currentDifficulty,
        score: score,
        totalQuestions: currentQuiz.length,
        wrongAnswers: wrongAnswers
      };
      showLoginModal();
      return; // Não reinicia o quiz ainda
    }
  }
  
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
  var difficultySection = document.querySelector('.difficulty-section');
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