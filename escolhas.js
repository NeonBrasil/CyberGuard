const quizzes = {
  small: [
    {
      question: "Seu Wi-Fi de empresa está aberto e sem senha. O que você faz?",
      options: ["Nada, está tudo bem.", "Coloca uma senha forte e WPA2."],
      answer: 1
    },
    {
      question: "Você vê um colaborador acessando o e-mail pessoal no computador de serviço. O que você faz?",
      options: ["Aviso ele que o que está fazendo não é permitido.", "Ignoro e faço igual."],
      answer: 0
    },
    {
      question: "Você recebe um e-mail suspeito com um link estranho. O que faz?",
      options: ["Clica no link para ver o que é.", "Reporta à equipe de segurança."],
      answer: 1
    },
    {
      question: "Você encontra um pen drive na mesa de um colega. O que faz?",
      options: ["Leva para casa para ver o que tem.", "Deixar ele."],
      answer: 1
    },
    {
      question: "Você vê uma planilha de clientes sendo enviada por e-mail pessoal. E agora?",
      options: ["Ignora, não é seu problema.", "Reporta à equipe de segurança."],
      answer: 1
    }
  ],
  medium: [
    {
      question: "Recebeu um e-mail dizendo que precisa atualizar sua senha clicando em um link. O que fazer?",
      options: ["Clicar logo no link.", "Verificar remetente e contato oficial da TI."],
      answer: 1
    },
    {
      question: "Você está em uma reunião e alguém pede para compartilhar sua tela. O que faz?",
      options: ["Compartilha sem pensar.", "Confirma o que será mostrado."],
      answer: 1
    },
    {
      question: "Você recebeu um e-mail da Mincrosoft avisando que sua conta foi comprometida. O que você faz?",
      options: ["Denúncia como Pishing.", "Entro em desespero e sigo o passo a passo do e-mail."],
      answer: 0
    },
    {
      question: "Um colega de RH pede seu login para um teste. E agora?",
      options: ["Fornece na hora.", "Recusa e orienta a usar o sistema oficial."],
      answer: 1
    }
  ],
  large: [
    {
      question: "Você conecta um pendrive desconhecido encontrado na recepção. E agora?",
      options: ["Ver o que tem dentro.", "Entregar à equipe de segurança."],
      answer: 1
    },
    {
      question: "Qual das seguintes é um Framework de segurança aceito mundialmente?",
      options: ["ISO 27001.", "NOST Cybersecurity Framework"],
      answer: 0
    },
    {
      question: "O sistema pede autenticação por token, mas você quer agilizar. O que faz?",
      options: ["Pede para desativar.", "Entende a importância da autenticação."],
      answer: 1
    }
  ]
};

let currentQuiz = [];
let currentIndex = 0;
let score = 0;
let selectedOption = null;

function startSimulation(size) {
  currentQuiz = quizzes[size];
  currentIndex = 0;
  score = 0;
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('quiz').classList.remove('hidden');
  showQuestion();
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
  if (selectedOption === currentQuiz[currentIndex].answer) score++;
  currentIndex++;
  if (currentIndex < currentQuiz.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  document.getElementById('quiz').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('score').innerText = `Você acertou ${score} de ${currentQuiz.length} perguntas.`;
  let feedback = '';
  const ratio = score / currentQuiz.length;
  if (ratio < 0.5) feedback = 'Você precisa melhorar sua postura em segurança!';
  else if (ratio < 2) feedback = 'Você está no caminho certo!';
  else feedback = 'Excelente! Você é um agente da segurança!';
  document.getElementById('feedback').innerText = feedback;
}