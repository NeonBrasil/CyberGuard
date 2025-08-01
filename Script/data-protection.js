/**
 * Sistema de Proteção de Dados - Conformidade LGPD
 * Garante que coleta de dados respeite consentimento do usuário
 */

class DataProtection {
  constructor() {
    this.sensitiveDataKeys = [
      'user_analytics',
      'marketing_data',
      'detailed_logs',
      'behavioral_data'
    ];
    
    this.essentialDataKeys = [
      'quiz_results',
      'user_rankings',
      'login_session',
      'privacy_consent'
    ];
  }

  // Verificar se pode coletar dados baseado no tipo
  canCollectData(dataType) {
    if (!window.privacyConsent) {
      console.warn('🚨 Sistema de privacidade não inicializado');
      return false;
    }

    switch (dataType) {
      case 'essential':
        return true; // Sempre permitido
      
      case 'functional':
        return window.privacyConsent.hasConsent('functional');
      
      case 'analytics':
        return window.privacyConsent.canUseAnalytics();
      
      case 'marketing':
        return window.privacyConsent.canSendMarketing();
      
      default:
        return false; // Por padrão, negar
    }
  }

  // Mascarar email para logs
  maskEmail(email) {
    if (!email || typeof email !== 'string') return '***@***.***';
    
    const parts = email.split('@');
    if (parts.length !== 2) return '***@***.***';
    
    const username = parts[0];
    const domain = parts[1];
    
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : '*'.repeat(username.length);
    
    const domainParts = domain.split('.');
    const maskedDomain = domainParts.map(part => 
      part.length > 2 ? part.substring(0, 2) + '*'.repeat(part.length - 2) : '*'.repeat(part.length)
    ).join('.');
    
    return `${maskedUsername}@${maskedDomain}`;
  }

  // Log seguro que respeita privacidade
  secureLog(message, category = 'general', userData = null) {
    if (!this.canCollectData('analytics')) {
      // Modo essencial - log mínimo
      console.log(`🔒 ${category}: Operação realizada (dados protegidos)`);
      return;
    }

    // Log com dados permitidos
    const logData = {
      timestamp: new Date().toISOString(),
      category: category,
      message: message
    };

    if (userData && this.canCollectData('analytics')) {
      // Mascarar dados sensíveis
      if (userData.email) {
        logData.user = this.maskEmail(userData.email);
      }
      if (userData.id) {
        logData.userId = userData.id.substring(0, 8) + '***';
      }
    }

    console.log('📊 Analytics Log:', logData);
  }

  // Limpar dados não essenciais baseado em consentimento
  cleanDataBasedOnConsent() {
    const consent = window.privacyConsent ? window.privacyConsent.getConsent() : null;
    
    if (!consent) return;

    // Se analytics foi desabilitado, limpar dados analíticos
    if (!consent.analytics) {
      this.clearAnalyticsData();
    }

    // Se marketing foi desabilitado, limpar dados de marketing
    if (!consent.marketing) {
      this.clearMarketingData();
    }
  }

  clearAnalyticsData() {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('analytics') || key.includes('tracking'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Dados analíticos removidos:', keysToRemove.length);
  }

  clearMarketingData() {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('marketing') || key.includes('campaign'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Dados de marketing removidos:', keysToRemove.length);
  }

  // Limpar todo armazenamento sensível
  clearSensitiveStorage() {
    this.sensitiveDataKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('🔒 Dados sensíveis removidos');
  }

  // Verificar conformidade LGPD
  checkLGPDCompliance() {
    const issues = [];
    
    // Verificar se há sistema de consentimento
    if (!window.privacyConsent) {
      issues.push('❌ Sistema de consentimento não encontrado');
    }

    // Verificar se há dados sendo coletados sem consentimento
    const hasUnconsentedData = this.detectUnconsentedDataCollection();
    if (hasUnconsentedData) {
      issues.push('❌ Coleta de dados sem consentimento detectada');
    }

    // Verificar se emails estão sendo mascarados em logs
    if (!this.isDataMaskingActive()) {
      issues.push('⚠️ Mascaramento de dados não está ativo');
    }

    return {
      compliant: issues.length === 0,
      issues: issues,
      recommendations: this.getLGPDRecommendations()
    };
  }

  detectUnconsentedDataCollection() {
    // Verificar localStorage por dados que podem ter sido coletados sem consentimento
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.sensitiveDataKeys.some(sensitive => key.includes(sensitive))) {
        const hasConsent = window.privacyConsent && window.privacyConsent.hasConsent('analytics');
        if (!hasConsent) {
          return true;
        }
      }
    }
    return false;
  }

  isDataMaskingActive() {
    // Teste simples para verificar se mascaramento está funcionando
    const testEmail = 'teste@exemplo.com';
    const masked = this.maskEmail(testEmail);
    return masked !== testEmail && masked.includes('*');
  }

  getLGPDRecommendations() {
    return [
      '✅ Implemente consentimento granular para diferentes tipos de dados',
      '✅ Mascare dados pessoais em logs e analytics',
      '✅ Permita revogação fácil de consentimento',
      '✅ Implemente limpeza automática de dados baseada em consentimento',
      '✅ Documente todos os dados coletados e seu propósito',
      '✅ Ofereça exportação de dados pessoais',
      '✅ Implemente prazo de retenção de dados'
    ];
  }

  // Exportar dados do usuário (direito LGPD)
  exportUserData(userId) {
    if (!this.canCollectData('essential')) {
      return null;
    }

    const userData = {
      exportDate: new Date().toISOString(),
      userId: userId,
      consentHistory: window.privacyConsent ? window.privacyConsent.getConsent() : null,
      quizData: this.getQuizDataForUser(userId),
      preferences: this.getUserPreferences(userId)
    };

    // Remover dados sensíveis se não houver consentimento
    if (!this.canCollectData('analytics')) {
      delete userData.quizData.detailedAnswers;
    }

    return userData;
  }

  getQuizDataForUser(userId) {
    // Esta função seria implementada para buscar dados do Firestore
    return {
      totalQuizzes: 0,
      averageScore: 0,
      lastActivity: null,
      // detailedAnswers seria removido se sem consentimento analytics
    };
  }

  getUserPreferences(userId) {
    return {
      theme: localStorage.getItem('user_theme') || 'dark',
      language: localStorage.getItem('user_language') || 'pt-BR',
      notifications: localStorage.getItem('user_notifications') || 'enabled'
    };
  }

  // Status do sistema de proteção
  getProtectionStatus() {
    const consent = window.privacyConsent ? window.privacyConsent.getConsent() : null;
    
    return {
      active: !!window.privacyConsent,
      consentGiven: !!consent,
      essentialOnly: consent && !consent.analytics && !consent.marketing,
      dataProtectionLevel: this.getDataProtectionLevel(consent),
      lastConsentUpdate: consent ? consent.timestamp : null
    };
  }

  getDataProtectionLevel(consent) {
    if (!consent) return 'none';
    
    if (consent.essential && !consent.analytics && !consent.marketing) {
      return 'maximum'; // Só dados essenciais
    } else if (consent.analytics && !consent.marketing) {
      return 'medium'; // Dados essenciais + analytics
    } else if (consent.analytics && consent.marketing) {
      return 'standard'; // Todos os dados permitidos
    }
    
    return 'custom';
  }
}

// Inicializar sistema de proteção
window.DataProtection = new DataProtection();

// Auto-limpeza quando consentimento muda
if (window.privacyConsent) {
  // Escutar mudanças de consentimento para limpar dados
  const originalSaveConsent = window.privacyConsent.saveConsent;
  window.privacyConsent.saveConsent = function(consentData) {
    const result = originalSaveConsent.call(this, consentData);
    if (result && window.DataProtection) {
      window.DataProtection.cleanDataBasedOnConsent();
    }
    return result;
  };
}

// Log de inicialização
console.log('🛡️ Sistema de Proteção de Dados LGPD ativo');
