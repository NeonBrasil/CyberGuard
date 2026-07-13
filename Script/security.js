// Sistema de Segurança SIA: Security & Information Academy
// Proteção contra spam e abuso de recursos no uso normal do site.
//
// IMPORTANTE: isso é 100% client-side. Serve para desencorajar abuso
// casual (ex. alguém clicando "login" repetidamente), mas NÃO é proteção
// real contra um atacante deliberado: qualquer um pode chamar a API do
// Firebase Auth/Firestore diretamente (sem carregar esse arquivo) e
// ignorar tudo isso. Proteção de verdade contra brute-force/DDoS exige
// controles do lado do servidor (Firebase App Check, Cloud Functions,
// ou as proteções nativas do Identity Platform).

console.log('🛡️ SIA: Security & Information Academy Security System carregado');

// Configurações de segurança
var SecurityConfig = {
  // Rate Limiting
  maxLoginAttempts: 5,
  loginCooldown: 15 * 60 * 1000, // 15 minutos
  maxQuizAttempts: 10,
  quizCooldown: 5 * 60 * 1000, // 5 minutos
  
  // Limites de uso
  maxQuestionsPerHour: 100,
  maxResultsPerDay: 20,
  
  // Detecção de comportamento suspeito
  suspiciousThreshold: 50, // ações por minuto
  blockDuration: 30 * 60 * 1000, // 30 minutos
  
  // Proteção de dados
  enableDataMasking: true,
  enableSecureLogs: true,
  maxDataRetention: 7 * 24 * 60 * 60 * 1000 // 7 dias
};

// Sistema de Rate Limiting
// Persistido em localStorage: antes ficava só em memória (var storage = {}),
// então um simples F5 na página zerava todas as tentativas contadas. Ainda é
// contornável (limpar localStorage/aba anônima), mas pelo menos não reseta
// sozinho a cada navegação.
var RateLimiter = {
  storageKey: 'sia_rate_limiter',
  storage: {},

  _load: function() {
    try {
      var raw = localStorage.getItem(this.storageKey);
      this.storage = raw ? JSON.parse(raw) : {};
    } catch (e) {
      this.storage = {};
    }
  },

  _save: function() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.storage));
    } catch (e) {
      // localStorage indisponível (modo privado/cheio) - segue só em memória
    }
  },

  // Verificar se ação é permitida
  isAllowed: function(action, identifier, limit, window) {
    var now = Date.now();
    var key = action + '_' + identifier;

    if (!this.storage[key]) {
      this.storage[key] = { count: 0, resetTime: now + window };
    }

    var record = this.storage[key];

    // Reset se janela expirou
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + window;
    }

    // Verificar limite
    if (record.count >= limit) {
      console.warn('🚨 Rate limit atingido para', action, 'por', identifier);
      this._save();
      return false;
    }

    record.count++;
    this._save();
    return true;
  },

  // Obter tempo restante para reset
  getTimeUntilReset: function(action, identifier) {
    var key = action + '_' + identifier;
    var record = this.storage[key];

    if (!record) return 0;

    var now = Date.now();
    return Math.max(0, record.resetTime - now);
  }
};

RateLimiter._load();

// Sistema de detecção de comportamento suspeito
var BehaviorMonitor = {
  actions: [],
  suspiciousIPs: new Set(),
  
  // Registrar ação do usuário
  recordAction: function(action, identifier) {
    // Verificar consentimento para coleta de dados analíticos
    if (window.privacyConsent && !window.privacyConsent.canUseAnalytics()) {
      // Só registrar ações essenciais de segurança
      if (!['login_attempt', 'suspicious_activity', 'security_violation'].includes(action)) {
        return;
      }
    }
    
    var now = Date.now();
    var ip = identifier || this.getClientIP();
    
    this.actions.push({
      action: action,
      ip: ip,
      timestamp: now
    });
    
    // Limpar ações antigas (últimos 60 segundos)
    this.actions = this.actions.filter(function(a) {
      return now - a.timestamp < 60000;
    });
    
    // Verificar comportamento suspeito
    this.checkSuspiciousBehavior(ip);
  },
  
  // Verificar se IP está fazendo muitas ações
  checkSuspiciousBehavior: function(ip) {
    var now = Date.now();
    var recentActions = this.actions.filter(function(a) {
      return a.ip === ip && now - a.timestamp < 60000;
    });
    
    if (recentActions.length > SecurityConfig.suspiciousThreshold) {
      console.warn('🚨 Comportamento suspeito detectado do IP:', ip);
      this.suspiciousIPs.add(ip);
      
      // Auto-desbloqueio após tempo configurado
      setTimeout(function() {
        this.suspiciousIPs.delete(ip);
        console.log('✅ IP desbloqueado:', ip);
      }.bind(this), SecurityConfig.blockDuration);
      
      return true;
    }
    
    return false;
  },
  
  // Verificar se IP está bloqueado
  isBlocked: function(identifier) {
    var ip = identifier || this.getClientIP();
    return this.suspiciousIPs.has(ip);
  },
  
  // Identificador do navegador (NÃO é o IP real - JS não tem acesso a isso,
  // só o servidor vê o IP de verdade). Antes gerava um valor aleatório novo
  // a cada chamada, o que fazia o "bloqueio de IP suspeito" nunca reconhecer
  // o mesmo cliente duas vezes. Agora persiste em localStorage para pelo
  // menos identificar o mesmo navegador entre chamadas/reloads.
  getClientIP: function() {
    try {
      var stored = localStorage.getItem('sia_client_id');
      if (stored) return stored;

      var id = 'client_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('sia_client_id', id);
      return id;
    } catch (e) {
      // localStorage indisponível (modo privado, etc)
      return 'client_' + Math.random().toString(36).substring(2, 9);
    }
  }
};

// Proteção para sistema de login
var LoginSecurity = {
  failedAttempts: {},
  
  // Verificar se login é permitido
  canAttemptLogin: function(email) {
    var ip = BehaviorMonitor.getClientIP();
    
    // Verificar se IP está bloqueado
    if (BehaviorMonitor.isBlocked(ip)) {
      throw new Error('Acesso temporariamente bloqueado devido a atividade suspeita');
    }
    
    // Verificar rate limit por email
    if (!RateLimiter.isAllowed('login', email, SecurityConfig.maxLoginAttempts, SecurityConfig.loginCooldown)) {
      var timeLeft = Math.ceil(RateLimiter.getTimeUntilReset('login', email) / 60000);
      throw new Error('Muitas tentativas de login. Tente novamente em ' + timeLeft + ' minutos');
    }
    
    return true;
  },
  
  // Registrar tentativa de login com logs seguros
  recordLoginAttempt: function(email, success) {
    BehaviorMonitor.recordAction('login_attempt', BehaviorMonitor.getClientIP());
    
    if (!success) {
      // Log seguro sem expor email completo
      DataProtection.secureLog('warn', 'Tentativa de login falhada', { 
        email: email,
        timestamp: new Date().toISOString()
      });
    } else {
      DataProtection.secureLog('info', 'Login bem-sucedido', { 
        email: email,
        timestamp: new Date().toISOString()
      });
      
      // Reset contador de tentativas em caso de sucesso
      delete RateLimiter.storage['login_' + email];
      RateLimiter._save();
    }
  }
};

// Proteção para sistema de quiz
var QuizSecurity = {
  // Verificar se quiz é permitido
  canStartQuiz: function(difficulty) {
    var ip = BehaviorMonitor.getClientIP();
    
    // Verificar se IP está bloqueado
    if (BehaviorMonitor.isBlocked(ip)) {
      throw new Error('Acesso temporariamente bloqueado devido a atividade suspeita');
    }
    
    // Verificar rate limit para quiz
    if (!RateLimiter.isAllowed('quiz', ip, SecurityConfig.maxQuizAttempts, SecurityConfig.quizCooldown)) {
      var timeLeft = Math.ceil(RateLimiter.getTimeUntilReset('quiz', ip) / 60000);
      throw new Error('Muitos quizzes iniciados. Aguarde ' + timeLeft + ' minutos');
    }
    
    BehaviorMonitor.recordAction('quiz_start', ip);
    return true;
  },
  
  // Verificar se pode salvar resultado
  canSaveResult: function() {
    var ip = BehaviorMonitor.getClientIP();
    
    if (BehaviorMonitor.isBlocked(ip)) {
      throw new Error('Não é possível salvar resultado: acesso bloqueado');
    }
    
    // Verificar limite diário de resultados
    if (!RateLimiter.isAllowed('save_result', ip, SecurityConfig.maxResultsPerDay, 24 * 60 * 60 * 1000)) {
      throw new Error('Limite diário de resultados salvos atingido');
    }
    
    BehaviorMonitor.recordAction('save_result', ip);
    return true;
  }
};

// Sistema de validação de entrada
var InputValidator = {
  // Validar email
  validateEmail: function(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email inválido');
    }
    
    if (email.length > 254) {
      throw new Error('Email muito longo');
    }
    
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }
    
    // Verificar domínios suspeitos
    var suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    var domain = email.split('@')[1];
    if (suspiciousDomains.includes(domain)) {
      throw new Error('Domínio de email temporário não permitido');
    }
    
    return true;
  },
  
  // Validar senha
  validatePassword: function(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Senha inválida');
    }
    
    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }
    
    if (password.length > 128) {
      throw new Error('Senha muito longa');
    }
    
    return true;
  },
  
  // Validar nome
  validateName: function(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Nome inválido');
    }
    
    var trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (trimmedName.length > 50) {
      throw new Error('Nome muito longo (máximo 50 caracteres)');
    }
    
    // Permitir apenas letras, espaços, hífens e apostrofes
    var nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(trimmedName)) {
      throw new Error('Nome contém caracteres inválidos. Use apenas letras, espaços, hífens e apostrofes');
    }
    
    // Verificar se não é muito repetitivo
    var repeatedChars = trimmedName.match(/(.)\1{4,}/);
    if (repeatedChars) {
      throw new Error('Nome contém muitos caracteres repetidos');
    }
    
    return true;
  },
  
  // Sanitizar entrada de texto
  sanitizeText: function(text) {
    if (!text) return '';
    return text.toString().trim().substring(0, 1000);
  }
};

// Monitoramento de recursos
var ResourceMonitor = {
  startTime: Date.now(),
  
  // Verificar uso de memória (aproximado)
  checkMemoryUsage: function() {
    if (performance && performance.memory) {
      var used = performance.memory.usedJSHeapSize;
      var total = performance.memory.totalJSHeapSize;
      var percentage = (used / total) * 100;
      
      if (percentage > 80) {
        console.warn('⚠️ Alto uso de memória detectado:', percentage.toFixed(2) + '%');
      }
      
      return percentage;
    }
    return 0;
  },
  
  // Verificar tempo de sessão
  checkSessionTime: function() {
    var sessionTime = Date.now() - this.startTime;
    var hours = sessionTime / (1000 * 60 * 60);
    
    if (hours > 2) {
      console.warn('⚠️ Sessão muito longa detectada:', hours.toFixed(2) + ' horas');
      return false;
    }
    
    return true;
  }
};

// Exportar sistemas de segurança
window.SecurityConfig = SecurityConfig;
window.RateLimiter = RateLimiter;
window.BehaviorMonitor = BehaviorMonitor;
window.LoginSecurity = LoginSecurity;
window.QuizSecurity = QuizSecurity;
window.InputValidator = InputValidator;
window.ResourceMonitor = ResourceMonitor;

// Inicializar proteções automáticas
if (window.DataProtection) {
  // A nova implementação usa uma instância da classe
  console.log('✅ DataProtection carregado e disponível');
  
  // Limpar dados baseado no consentimento se necessário
  if (window.DataProtection.cleanDataBasedOnConsent) {
    window.DataProtection.cleanDataBasedOnConsent();
  }
}

console.log('✅ Sistemas de segurança e proteção de dados carregados e ativos');
