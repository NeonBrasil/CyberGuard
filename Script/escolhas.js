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

// Firebase Manager para o Quiz
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

// Variável para salvar resultado pendente
var pendingResult = null;

// Callbacks para o sistema de login modular
window.onLoginModalClose = function() {
  // Se há resultado pendente e usuário fechou modal, volta para tela de resultados
  if (pendingResult) {
    document.getElementById('resultsModal').classList.remove('hidden');
  }
};

window.onLoginSuccess = function() {
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
      hideResultsModal(); // Fecha tela de resultados e reinicia
    });
  }
};

window.onRegisterSuccess = function() {
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
      hideResultsModal(); // Fecha tela de resultados e reinicia
    });
  }
};

// Aguardar Firebase e sistema de login carregarem
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM carregado para o quiz');
  console.log('Firebase disponível:', !!window.firebase);
  console.log('DB disponível:', !!window.db);
  console.log('Auth disponível:', !!window.auth);
});

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
  
  // Atualizar elementos da tela de resultados
  document.getElementById('scorePercentage').textContent = percentage + '%';
  document.getElementById('scoreText').textContent = 'Pontuação: ' + score + '/' + currentQuiz.length;
  document.getElementById('difficultyText').textContent = 'Dificuldade: ' + currentDifficulty;
  
  // Definir mensagem de performance
  var performanceMsg = document.getElementById('performanceMessage');
  var saveBtn = document.getElementById('saveResultsBtn');
  
  if (percentage >= 80) {
    performanceMsg.textContent = '🏆 Excelente! Você domina este tópico!';
    performanceMsg.className = 'performance-message excellent';
  } else if (percentage >= 60) {
    performanceMsg.textContent = '👍 Bom trabalho! Continue estudando!';
    performanceMsg.className = 'performance-message good';
  } else {
    performanceMsg.textContent = '📚 Continue estudando para melhorar!';
    performanceMsg.className = 'performance-message needs-improvement';
  }
  
  // Mostrar respostas incorretas se houver
  var wrongSection = document.getElementById('wrongAnswersSection');
  var wrongList = document.getElementById('wrongAnswersList');
  
  if (wrongAnswers.length > 0) {
    wrongSection.classList.remove('hidden');
    wrongList.innerHTML = '';
    
    wrongAnswers.forEach(function(wrong, index) {
      var item = document.createElement('div');
      item.className = 'wrong-answer-item';
      item.innerHTML = '<div class="question">' + (index + 1) + '. ' + wrong.question + '</div>' +
                      '<div class="answer user-answer">Sua resposta: ' + wrong.selectedAnswer + '</div>' +
                      '<div class="answer correct-answer">Resposta correta: ' + wrong.correctAnswer + '</div>';
      wrongList.appendChild(item);
    });
  } else {
    wrongSection.classList.add('hidden');
  }
  
  // Configurar botão de salvar baseado no status do login
  if (window.getCurrentUser && window.getCurrentUser()) {
    saveBtn.textContent = '🏆 Resultado Salvo!';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';
    
    // Salvar resultado automaticamente se logado
    window.FirebaseManager.saveQuizResult(currentDifficulty, score, currentQuiz.length, wrongAnswers);
  } else {
    saveBtn.textContent = '🏆 Salvar no Ranking';
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
  }
  
  // Mostrar modal de resultados
  document.getElementById('resultsModal').classList.remove('hidden');
}

// Função para esconder modal de resultados
function hideResultsModal() {
  document.getElementById('resultsModal').classList.add('hidden');
  restartQuiz();
}

// Função para solicitar login
function promptLogin() {
  if (window.getCurrentUser && window.getCurrentUser()) {
    return; // Já está logado
  }
  
  // Salvar resultado pendente
  pendingResult = {
    difficulty: currentDifficulty,
    score: score,
    totalQuestions: currentQuiz.length,
    wrongAnswers: wrongAnswers
  };
  
  // Esconder modal de resultados e mostrar login
  document.getElementById('resultsModal').classList.add('hidden');
  
  // Garantir que o modal de login existe e é válido
  setTimeout(function() {
    if (window.showLoginModal && typeof window.showLoginModal === 'function') {
      window.showLoginModal();
    } else {
      alert('Sistema de login não disponível. Tente recarregar a página.');
    }
  }, 100);
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

// Disponibilizar funções do quiz globalmente para o HTML
window.startSimulation = startSimulation;
window.nextQuestion = nextQuestion;
window.hideResultsModal = hideResultsModal;
window.promptLogin = promptLogin;