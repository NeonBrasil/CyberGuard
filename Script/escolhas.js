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
        console.log('❌ Usuário não logado, não salvando resultado');
        resolve();
        return;
      }
      
      try {
        console.log('💾 Salvando resultado do quiz...');
        
        var startTime = window.quizStartTime || Date.now();
        var timeSpent = Math.floor((Date.now() - startTime) / 1000); // em segundos
        var percentage = Math.round((score / totalQuestions) * 100);
        
        // Obter nome do usuário
        var userName = window.currentUser.displayName || 'Usuário Anônimo';
        
        // Se tiver userAccountManager com dados carregados, usar o nome de lá
        if (window.userAccountManager && window.userAccountManager.userDoc) {
          userName = window.userAccountManager.userDoc.name || userName;
        }
        
        var result = {
          userId: window.currentUser.uid,
          userName: userName,
          difficulty: difficulty,
          score: percentage,
          totalQuestions: totalQuestions,
          wrongAnswers: wrongAnswers,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          timeSpent: timeSpent
        };
        
        console.log('Dados do resultado:', result);
        
        // Salvar na coleção quizResults (não quiz_results)
        db.collection('quizResults').add(result).then(function(docRef) {
          console.log('✅ Resultado salvo com ID:', docRef.id);
          
          // Atualizar estatísticas do usuário
          if (window.userAccountManager) {
            window.userAccountManager.updateStats({
              score: percentage,
              timeSpent: timeSpent
            });
          }
          
          console.log('✅ Resultado salvo e estatísticas atualizadas');
          resolve();
        }).catch(function(error) {
          console.error('❌ Erro ao salvar resultado:', error);
          resolve();
        });
      } catch (error) {
        console.error('❌ Erro ao salvar resultado:', error);
        resolve();
      }
    });
  }
};

// Variável para salvar resultado pendente
var pendingResult = null;

// Callbacks para o sistema de login modular
window.onLoginModalClose = function() {
  console.log('=== LOGIN MODAL FECHADO ===');
  console.log('Resultado pendente:', pendingResult);
  console.log('Current quiz length:', currentQuiz.length);
  console.log('Score atual:', score);
  
  // VALIDAÇÃO: só mostra resultados se realmente há um quiz finalizado
  if (pendingResult && 
      currentQuiz.length > 0 && 
      score >= 0 && 
      (score + wrongAnswers.length) === currentQuiz.length) {
    console.log('✅ Quiz válido encontrado, mostrando resultados...');
    document.getElementById('resultsModal').classList.remove('hidden');
  } else {
    console.log('❌ Nenhum quiz válido encontrado, não mostrando resultados');
    // Limpar qualquer estado inválido
    pendingResult = null;
    currentQuiz = [];
    score = 0;
    wrongAnswers = [];
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
  
  // LIMPEZA: garantir que não há estados fantasma ao carregar a página
  currentQuiz = [];
  currentIndex = 0;
  score = 0;
  selectedOption = null;
  wrongAnswers = [];
  pendingResult = null;
  
  // Garantir que modais estão escondidos
  var resultsModal = document.getElementById('resultsModal');
  var loginModal = document.getElementById('loginModal');
  
  if (resultsModal) {
    resultsModal.classList.add('hidden');
  }
  
  if (loginModal) {
    loginModal.classList.add('hidden');
  }
  
  console.log('✅ Estado do quiz limpo na inicialização');
});

// Funções principais do quiz
function startSimulation(difficulty) {
  if (!difficulty) {
    alert('Selecione uma dificuldade!');
    return;
  }
  
  try {
    // VERIFICAÇÃO DE SEGURANÇA
    window.QuizSecurity.canStartQuiz(difficulty);
    console.log('✅ Verificações de segurança passaram para quiz');
    
  } catch (error) {
    alert('Erro: ' + error.message);
    return;
  }
  
  // Registrar tempo de início
  window.quizStartTime = Date.now();
  
  currentDifficulty = difficultyMap[difficulty] || difficulty;
  
  // Carregar perguntas do Firebase
  window.FirebaseManager.loadQuestions(currentDifficulty).then(function(questions) {
    if (questions.length === 0) {
      alert('Nenhuma pergunta encontrada para esta dificuldade!');
      return;
    }
    
    console.log('=== PERGUNTAS CARREGADAS ===');
    console.log('Total inicial:', questions.length);
    console.log('Dificuldade:', currentDifficulty);
    
    // REMOVER DUPLICATAS baseado na pergunta
    var uniqueQuestions = [];
    var seenQuestions = new Set();
    
    questions.forEach(function(q) {
      if (!seenQuestions.has(q.question)) {
        seenQuestions.add(q.question);
        uniqueQuestions.push(q);
      } else {
        console.log('⚠️ Pergunta duplicada removida:', q.question.substring(0, 50) + '...');
      }
    });
    
    console.log('Total após remoção de duplicatas:', uniqueQuestions.length);
    
    // LOG DETALHADO: Verificar estrutura das primeiras perguntas
    console.log('=== ESTRUTURA DAS PERGUNTAS ===');
    uniqueQuestions.slice(0, 3).forEach(function(q, index) {
      console.log('Pergunta', index + 1, ':', {
        question: q.question,
        options: q.options,
        correct: q.correct,
        difficulty: q.difficulty,
        optionsType: typeof q.options,
        optionsLength: q.options ? q.options.length : 'undefined',
        correctType: typeof q.correct,
        correctValue: q.correct
      });
    });
    
    // VALIDAÇÃO E CORREÇÃO: Garantir que todas as perguntas têm estrutura válida
    var validQuestions = [];
    uniqueQuestions.forEach(function(q, index) {
      // Verificar se a pergunta tem estrutura válida
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length === 0) {
        console.error('❌ Pergunta inválida (sem texto ou opções):', q);
        return;
      }
      
      // CORREÇÃO AUTOMÁTICA: Se correct é undefined, tentar encontrar a resposta correta
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) {
        console.log('⚠️ Tentando corrigir pergunta com correct inválido:', q.question.substring(0, 50) + '...');
        
        // Verificar se há um campo alternativo ou tentar deduzir
        var correctIndex = -1;
        
        // Estratégia 1: Procurar por um campo 'answer' ou 'correctAnswer'
        if (q.answer && typeof q.answer === 'string') {
          correctIndex = q.options.indexOf(q.answer);
          console.log('Tentativa 1 - campo answer:', q.answer, 'índice:', correctIndex);
        }
        
        // Estratégia 2: Procurar por um campo 'correctAnswer'
        if (correctIndex === -1 && q.correctAnswer && typeof q.correctAnswer === 'string') {
          correctIndex = q.options.indexOf(q.correctAnswer);
          console.log('Tentativa 2 - campo correctAnswer:', q.correctAnswer, 'índice:', correctIndex);
        }
        
        // Estratégia 3: Se ainda não encontrou, usar a primeira opção como padrão temporário
        if (correctIndex === -1) {
          correctIndex = 0;
          console.log('⚠️ USANDO PRIMEIRA OPÇÃO COMO PADRÃO para:', q.question.substring(0, 50));
        }
        
        q.correct = correctIndex;
        console.log('✅ Pergunta corrigida - novo índice correct:', correctIndex);
      }
      
      // Verificar novamente se a resposta correta existe
      if (!q.options[q.correct]) {
        console.error('❌ Resposta correta ainda não encontrada no índice', q.correct, ':', q.options);
        return;
      }
      
      console.log('✅ Pergunta válida:', q.question.substring(0, 50) + '...');
      validQuestions.push(q);
    });
    
    console.log('Perguntas válidas:', validQuestions.length, 'de', uniqueQuestions.length);
    
    if (validQuestions.length === 0) {
      alert('Erro: Nenhuma pergunta válida encontrada! Verifique os dados no Firebase.');
      return;
    }
    
    // Verificar se houve correções automáticas
    var correctedQuestions = uniqueQuestions.length - validQuestions.length;
    if (correctedQuestions > 0) {
      console.log('⚠️ AVISO: Algumas perguntas foram corrigidas automaticamente devido a problemas na base de dados');
      // Remover alert para não incomodar o usuário, apenas log
    }
    
    currentQuiz = shuffleArray(validQuestions);
    currentIndex = 0;
    score = 0;
    wrongAnswers = [];
    
    console.log('Quiz preparado com', currentQuiz.length, 'perguntas únicas');
    
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
  console.log('=== DISPLAY QUESTION ===');
  console.log('Current index:', currentIndex);
  console.log('Total questions:', currentQuiz.length);
  
  if (currentIndex >= currentQuiz.length) {
    console.log('🎯 QUIZ FINALIZADO! Chamando showResults...');
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
  
  console.log('=== VALIDAÇÃO DE RESPOSTA ===');
  console.log('Pergunta:', question.question);
  console.log('Opção selecionada (índice):', selectedOption);
  console.log('Resposta selecionada:', question.options[selectedOption]);
  console.log('Índice correto:', question.correct);
  console.log('Resposta correta:', question.options[question.correct]);
  console.log('É correto?', isCorrect);
  console.log('Estrutura completa da pergunta:', question);
  
  if (isCorrect) {
    score++;
    console.log('✅ Resposta CORRETA!');
  } else {
    console.log('❌ Resposta INCORRETA!');
    wrongAnswers.push({
      question: question.question,
      selectedAnswer: question.options[selectedOption] || 'Opção não encontrada',
      correctAnswer: question.options[question.correct] || 'Resposta correta não encontrada'
    });
    console.log('Erro adicionado à lista:', wrongAnswers[wrongAnswers.length - 1]);
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
  console.log('=== SHOW RESULTS INICIADO ===');
  
  var percentage = Math.round((score / currentQuiz.length) * 100);
  console.log('Percentage:', percentage);
  console.log('Score:', score + '/' + currentQuiz.length);
  console.log('Difficulty:', currentDifficulty);
  
  // Verificar se elementos existem
  var resultsModal = document.getElementById('resultsModal');
  console.log('ResultsModal found:', !!resultsModal);
  
  if (!resultsModal) {
    console.error('❌ CRÍTICO: resultsModal não encontrado no DOM!');
    return;
  }
  
  // Atualizar elementos da tela de resultados
  var scorePercentageEl = document.getElementById('scorePercentage');
  var scoreTextEl = document.getElementById('scoreText');
  var difficultyTextEl = document.getElementById('difficultyText');
  
  console.log('ScorePercentage element:', !!scorePercentageEl);
  console.log('ScoreText element:', !!scoreTextEl);
  console.log('DifficultyText element:', !!difficultyTextEl);
  
  if (scorePercentageEl) scorePercentageEl.textContent = percentage + '%';
  if (scoreTextEl) scoreTextEl.textContent = 'Pontuação: ' + score + '/' + currentQuiz.length;
  if (difficultyTextEl) difficultyTextEl.textContent = 'Dificuldade: ' + currentDifficulty;
  
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
  console.log('=== CONFIGURANDO BOTÃO DE SALVAR ===');
  console.log('getCurrentUser function exists:', typeof window.getCurrentUser);
  console.log('User logged in:', !!(window.getCurrentUser && window.getCurrentUser()));
  
  if (window.getCurrentUser && window.getCurrentUser()) {
    console.log('✅ Usuário logado - salvando automaticamente');
    saveBtn.textContent = '🏆 Resultado Salvo!';
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.7';
    
    // Salvar resultado automaticamente se logado
    window.FirebaseManager.saveQuizResult(currentDifficulty, score, currentQuiz.length, wrongAnswers);
  } else {
    console.log('❌ Usuário não logado - botão para login');
    saveBtn.textContent = '🏆 Salvar no Ranking';
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
  }
  
  // Mostrar modal de resultados
  console.log('=== MOSTRANDO MODAL DE RESULTADOS ===');
  document.getElementById('resultsModal').classList.remove('hidden');
  console.log('✅ Modal de resultados exibido!');
}

// Função para salvar resultados (só é chamada quando há quiz válido)
function saveResults() {
  console.log('=== SAVE RESULTS CHAMADO ===');
  console.log('Current quiz length:', currentQuiz.length);
  console.log('Score:', score);
  console.log('Current difficulty:', currentDifficulty);
  
  // VALIDAÇÃO: só permite salvar se há um quiz realmente finalizado
  if (currentQuiz.length === 0 || score < 0 || !currentDifficulty) {
    console.log('❌ Nenhum quiz válido para salvar');
    alert('Erro: Nenhum quiz válido encontrado!');
    return;
  }
  
  try {
    // VERIFICAÇÃO DE SEGURANÇA
    window.QuizSecurity.canSaveResult();
    console.log('✅ Verificações de segurança passaram para salvar resultado');
    
  } catch (error) {
    alert('Erro: ' + error.message);
    return;
  }
  
  console.log('✅ Quiz válido encontrado, verificando login...');
  
  // Verificar se usuário está logado
  if (window.getCurrentUser && window.getCurrentUser()) {
    console.log('✅ Usuário já logado, salvando automaticamente...');
    
    window.FirebaseManager.saveQuizResult(currentDifficulty, score, currentQuiz.length, wrongAnswers)
      .then(function() {
        alert('Seu resultado foi salvo no ranking! 🏆');
        hideResultsModal();
      });
  } else {
    console.log('❌ Usuário não logado, solicitando login...');
    promptLogin();
  }
}

// Função para esconder modal de resultados
function hideResultsModal() {
  document.getElementById('resultsModal').classList.add('hidden');
  restartQuiz();
}

// Função para solicitar login (agora só é chamada quando necessário)
function promptLogin() {
  console.log('=== PROMPT LOGIN INICIADO ===');
  console.log('getCurrentUser:', typeof window.getCurrentUser);
  console.log('getCurrentUser():', window.getCurrentUser ? window.getCurrentUser() : 'função não existe');
  
  if (window.getCurrentUser && window.getCurrentUser()) {
    console.log('❌ Usuário já está logado, cancelando prompt');
    return; // Já está logado
  }
  
  console.log('✅ Usuário não logado, continuando...');
  
  // Salvar resultado pendente APENAS se há quiz válido
  if (currentQuiz.length > 0 && score >= 0 && currentDifficulty) {
    pendingResult = {
      difficulty: currentDifficulty,
      score: score,
      totalQuestions: currentQuiz.length,
      wrongAnswers: wrongAnswers
    };
    
    console.log('📝 Resultado pendente salvo:', pendingResult);
  } else {
    console.log('❌ Não há quiz válido para salvar como pendente');
    return;
  }
  
  // Esconder modal de resultados e mostrar login
  console.log('🔄 Escondendo modal de resultados...');
  document.getElementById('resultsModal').classList.add('hidden');
  
  // Garantir que o modal de login existe e é válido
  setTimeout(function() {
    console.log('⏰ Timeout executado, verificando showLoginModal...');
    console.log('showLoginModal exists:', typeof window.showLoginModal);
    
    if (window.showLoginModal && typeof window.showLoginModal === 'function') {
      console.log('✅ Chamando showLoginModal()...');
      try {
        window.showLoginModal();
        console.log('✅ showLoginModal() executado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao executar showLoginModal():', error);
        alert('Erro ao abrir modal de login: ' + error.message);
      }
    } else {
      console.error('❌ showLoginModal não está disponível');
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
window.saveResults = saveResults;
window.hideResultsModal = hideResultsModal;
window.promptLogin = promptLogin;