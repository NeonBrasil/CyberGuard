// Importar FirebaseManager
import { FirebaseManager } from './firebase-config.js';

// Fallback local para quando Firebase não estiver disponível
const localQuizzes = {
  small: [
    {
      question: "Seu Wi-Fi de empresa está aberto e sem senha. O que você faz?",
      options: ["Nada, está tudo bem.", "Coloca uma senha forte e WPA2."],
      correctAnswer: 1
    },
    {
      question: "Você vê um colaborador acessando o e-mail pessoal no computador de serviço. O que você faz?",
      options: ["Aviso ele que o que está fazendo não é permitido.", "Ignoro e faço igual."],
      correctAnswer: 0
    },
    {
      question: "Você recebe um e-mail suspeito com um link estranho. O que faz?",
      options: ["Clica no link para ver o que é.", "Reporta à equipe de segurança."],
      correctAnswer: 1
    },
    {
      question: "Você encontra um pen drive na mesa de um colega. O que faz?",
      options: ["Leva para casa para ver o que tem.", "Deixar ele."],
      correctAnswer: 1
    },
    {
      question: "Você vê uma planilha de clientes sendo enviada por e-mail pessoal. E agora?",
      options: ["Ignora, não é seu problema.", "Reporta à equipe de segurança."],
      correctAnswer: 1
    },
    {
      question: "Você está em uma reunião e alguém pede para compartilhar sua tela. O que faz?",
      options: ["Compartilha sem pensar.", "Confirma o que será mostrado."],
      correctAnswer: 1
    },
    {
      question: "Você recebeu um e-mail da Mincrosoft avisando que sua conta foi comprometida. O que você faz?",
      options: ["Denúncia como Pishing.", "Entro em desespero e sigo o passo a passo do e-mail."],
      correctAnswer: 0
    },
    {
      question: "Um colega de RH pede seu login para um teste. E agora?",
      options: ["Fornece na hora.", "Recusa e orienta a usar o sistema oficial."],
      correctAnswer: 1
    },
    {
      question: "Você conecta um pendrive desconhecido encontrado na recepção. E agora?",
      options: ["Ver o que tem dentro.", "Entregar à equipe de segurança."],
      correctAnswer: 1
    },
    {
      question: "Qual das seguintes é um Framework de segurança aceito mundialmente?",
      options: ["ISO 27001.", "NOST Cybersecurity Framework"],
      correctAnswer: 0
    },
    {
      question: "O sistema pede autenticação por token, mas você quer agilizar. O que faz?",
      options: ["Pede para desativar.", "Entende a importância da autenticação."],
      correctAnswer: 1
    }
  ],
  medium: [
    {
      question: "Recebeu um e-mail dizendo que precisa atualizar sua senha clicando em um link. O que fazer?",
      options: ["Clicar logo no link.", "Verificar remetente e contato oficial da TI."],
      correctAnswer: 1
    },
    {
      question: "Qual dessas práticas representa melhor a gestão de senhas em um ambiente corporativo?",
      options: ["Alterar a senha a cada 90 dias e anotar em um caderno seguro.", "Utilizar a mesma senha para todos os sistemas, mas com autenticação em dois fatores.", "Criar senhas únicas, usar um gerenciador de senhas e ativar autenticação em dois fatores sempre que possível.", "Usar a mesma senha, mas com caracteres especiais."],
      correctAnswer: 2
    },
    {
      question: "Em uma situação de vazamento de dados, qual é a primeira ação recomendada?",
      options: ["Notificar imediatamente o canal oficial de segurança da informação da empresa.", "Avisar um colega imediatamente para decidir juntos o que fazer.", "Corrigir o erro rapidamente e seguir o trabalho para não causar impacto.", " Esperar para ver se o problema se resolve sozinho."],
      correctAnswer: 0
    },
    {
      question: "Você precisa usar um software gratuiro para converter arquivos. O que deve fazer?",
      options: ["Usar sites conhecidos.", "Baixar um programa conhecido em um fórum conhecido.", "Solicitar à equipe de TI para validar o software.", " Usar um software que você conhece e depois desinstalar após o uso."],
      correctAnswer: 2
    },
    {
      question: "Sobre redes WI-FI corporativas, qual prática representa risco elevado de segurança?",
      options: ["Exigir autenticação com certificado digital.", "Permitir que visitantes usem a mesma rede dos colaboradores.", "Ter uma rede separada para dispositivos pessoais.", " Usar redes segmentadas com controle de acesso."],
      correctAnswer: 1
    },
    {
      question: "Qual princípio de segurança da informação está sendo violado quando um funcionário com baixa autorização consegue acessar dados sensíveis?",
      options: ["Confidencialidade.", "Integridade.", "Disponibilidade.", "Autenticidade."],
      correctAnswer: 0
    },
    {
      question: "Um grande ataque de phishing avançado que utiliza uma URL visualmente identica ao site original e SSL válido é conhecido como:",
      options: ["Phishing de URL.", "Phishing de SSL.", "Phishing de Homógrafos.", "Phishing de Spoofing."],
      correctAnswer: 2
    },
    {
      question: "Sobre ataque de phishing avançado, qual a melhor técnica de defesa?",
      options: ["Bloqueio de sites suspeitos via firewall.", "Antívirus atualizado com lista de sites maliciosos.", "Conscientização dos usuários.", "Autenticação com senha complexa."],
      correctAnswer: 2
    },
    {
      question: "Qual é a diferença entre phishing e spear phishing?",
      options: ["Phishing é um ataque genérico, enquanto spear phishing é direcionado a indivíduos específicos.", "Phishing usa e-mails, enquanto spear phishing usa redes sociais.", "Phishing é mais perigoso que spear phishing.", "Spear phishing é um tipo de malware."],
      correctAnswer: 0
    },
    {
      question: "Qual das alternativas caracteriza um falso positivo em um sistema de segurança?",
      options: ["Um alerta de segurança que identifica uma ameaça real.", "Um alerta de segurança que não representa uma ameaça real.", "Um ataque bem-sucedido que não é detectado pelo sistema.", "Uma falha de segurança que é corrigida rapidamente."],
      correctAnswer: 1
    }
  ],
  large: [
    {
      question: "Você conecta um pendrive desconhecido encontrado na recepção. E agora?",
      options: ["Ver o que tem dentro.", "Entregar à equipe de segurança."],
      correctAnswer: 1
    },
    {
      question: "O que é LGPD?",
      options: ["Lei de Garantia de Privacidade Digital", "Lei Geral de Proteção de Dados.", "Lei de Gestão de Dados Pessoais", "Lei Global de Privacidade de Dados"],
      correctAnswer: 1
    },
    {
      question: "Ao realizar uma análise de risco, qual fórmula representa a abordagem clássica de risco?",
      options: ["Risco = Vulnerabilidade / Ameaça", "Risco = Ativo + Probabilidade", "Risco = Impacto * Probabilidade", "Risco = Ameaça * Vulnerabilidade", "Risco = Ameaça + Vulnerabilidade + Impacto"],
      correctAnswer: 2
    },
    {
      question: "Segundo a ISO/IEC 27002, qual controle visa garantir a segurança física de equipamentos críticos?",
      options: ["Gestão de Acessos", "Áreas Seguras", "Proteção de Redes", "Conformidade Legal", "Gestão de Incidentes", "Gestão de Continuidade"],
      correctAnswer: 1
    },
    {
      question: "Segundo a ISO/IEC 27002, qual controle é essencial para proteger informações em trânsito?",
      options: ["Criptografia", "Gestão de Acessos", "Proteção de Redes", "Conformidade Legal", "Gestão de Incidentes"],
      correctAnswer: 0
    },
    {
      question: "De acordo com a LGPD, quando uma empresa é considerada 'controladora' de dados?",
      options: ["Quando armazena dados sensíveis por obrigação legal.", "Quando coleta, trata e decide sobre o uso de dados pessoais.", "Quando processa dados sob ordem judicial.", "Quando apenas fornece infraestrutura técnica a terceiros.", "Quando atua como intermediária entre usuários e serviços."],
      correctAnswer: 1
    },
    {
      question: "Segundo o NIST SP 800-53, qual é o objetivo principal do controle AC-2?",
      options: ["Gerenciar o acesso a sistemas e informações.", "Proteger a integridade dos dados.", "Garantir a disponibilidade de serviços críticos.", "Monitorar atividades suspeitas.", "Implementar criptografia forte."],
      correctAnswer: 0
    },
    {
      question: "Segundo o NIST SP 800-53, o controle de 'Separation of Duties' busca principalmente:",
      options: ["Reduzir número de funcionários com acesso á rede.", "Garantir backup redundante de operações sensíveis.", "Fornecer isolamento entre VLANs.", "Impedir que um único indivíduo tenha controle total sobre um processo crítico."],
      correctAnswer: 3
    }
  ]
};

let currentQuiz = [];
let currentIndex = 0;
let score = 0;
let selectedOption = null;
let wrongAnswers = []; // Armazena os índices das perguntas erradas
let currentDifficulty = '';

// Mapear nomes de dificuldade
const difficultyMap = {
  'small': 'easy',
  'medium': 'medium', 
  'large': 'hard'
};

async function startSimulation(size) {
  currentDifficulty = difficultyMap[size] || size;
  currentIndex = 0;
  score = 0;
  wrongAnswers = [];
  
  // Mostrar loading
  document.getElementById('menu').classList.add('hidden');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading';
  loadingDiv.innerHTML = '<p>Carregando perguntas...</p>';
  loadingDiv.style.textAlign = 'center';
  loadingDiv.style.padding = '2rem';
  document.querySelector('main').appendChild(loadingDiv);
  
  try {
    // Tentar carregar do Firebase primeiro
    const firebaseQuestions = await FirebaseManager.loadQuestions(currentDifficulty);
    
    if (firebaseQuestions && firebaseQuestions.length > 0) {
      currentQuiz = firebaseQuestions;
    } else {
      // Usar fallback local
      currentQuiz = localQuizzes[size] || [];
    }
    
    // Remover loading e mostrar quiz
    loadingDiv.remove();
    document.getElementById('quiz').classList.remove('hidden');
    showQuestion();
    
  } catch (error) {
    console.error('Erro ao carregar perguntas:', error);
    // Usar fallback local em caso de erro
    currentQuiz = localQuizzes[size] || [];
    loadingDiv.remove();
    document.getElementById('quiz').classList.remove('hidden');
    showQuestion();
  }
}

function showQuestion() {
  selectedOption = null;
  const q = currentQuiz[currentIndex];
  document.getElementById('question-container').innerText = q.question;
  const options = document.getElementById('options-container');
  options.innerHTML = '';
  q.options.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'custom-radio';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'quiz-option';
    input.value = i;
    input.onclick = () => {
      selectedOption = i;
      document.querySelectorAll('.custom-radio').forEach(lab => lab.classList.remove('selected'));
      label.classList.add('selected');
    };
    const span = document.createElement('span');
    span.className = 'checkmark';
    label.appendChild(input);
    label.appendChild(span);
    label.appendChild(document.createTextNode(opt));
    options.appendChild(label);
  });
}

function nextQuestion() {
  if (selectedOption === null) return; // Não deixa avançar sem selecionar
  
  // Verificar resposta (compatível com ambos os formatos)
  const correctAnswer = currentQuiz[currentIndex].correctAnswer || currentQuiz[currentIndex].answer;
  
  if (selectedOption === correctAnswer) {
    score++;
  } else {
    wrongAnswers.push({
      index: currentIndex,
      question: currentQuiz[currentIndex].question,
      selected: selectedOption,
      correct: correctAnswer,
      options: currentQuiz[currentIndex].options
    });
  }
  currentIndex++;
  if (currentIndex < currentQuiz.length) {
    showQuestion();
  } else {
    showResult();
  }
}

async function showResult() {
  document.getElementById('quiz').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('score').innerText = `Você acertou ${score} de ${currentQuiz.length} perguntas.`;
  
  let feedback = '';
  const ratio = score / currentQuiz.length;
  if (ratio < 0.5) feedback = 'Você precisa melhorar sua postura em segurança!';
  else if (ratio < 0.8) feedback = 'Você está no caminho certo!';
  else feedback = 'Excelente! Você é um agente da segurança!';
  document.getElementById('feedback').innerText = feedback;

  // Salvar resultado no Firebase
  try {
    await FirebaseManager.saveQuizResult(currentDifficulty, score, currentQuiz.length, wrongAnswers);
  } catch (error) {
    console.log('Não foi possível salvar no Firebase:', error);
  }

  // Mostrar perguntas erradas
  const wrongDivId = 'wrong-answers';
  let wrongDiv = document.getElementById(wrongDivId);
  if (!wrongDiv) {
    wrongDiv = document.createElement('div');
    wrongDiv.id = wrongDivId;
    document.getElementById('result').appendChild(wrongDiv);
  }
  wrongDiv.innerHTML = '';
  if (wrongAnswers.length > 0) {
    const title = document.createElement('h3');
    title.style.marginTop = '2rem';
    title.style.color = '#58a6ff';
    title.innerText = 'Perguntas que você errou:';
    wrongDiv.appendChild(title);

    wrongAnswers.forEach(item => {
      const qDiv = document.createElement('div');
      qDiv.style.margin = '1.2rem 0';
      qDiv.style.padding = '1rem';
      qDiv.style.background = 'rgba(22,27,34,0.7)';
      qDiv.style.borderRadius = '8px';
      qDiv.style.border = '1px solid #30363d';

      const qTitle = document.createElement('div');
      qTitle.style.fontWeight = 'bold';
      qTitle.style.marginBottom = '0.5rem';
      qTitle.innerText = item.question;
      qDiv.appendChild(qTitle);

      const userAnswer = document.createElement('div');
      userAnswer.innerHTML = `<span style="color:#ff5a5f;">Sua resposta: ${item.options[item.selected]}</span>`;
      qDiv.appendChild(userAnswer);

      const correctAnswer = document.createElement('div');
      correctAnswer.innerHTML = `<span style="color:#238636;">Resposta correta: ${item.options[item.correct]}</span>`;
      qDiv.appendChild(correctAnswer);

      wrongDiv.appendChild(qDiv);
    });
  }
}