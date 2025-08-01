// Sistema de Consentimento e Notificações de Privacidade
// Compatível com LGPD e GDPR

class PrivacyConsent {
  constructor() {
    this.consentVersion = '1.0';
    this.consentKey = 'sia_privacy_consent';
    this.consentData = this.loadConsent();
    
    // Inicializar após carregamento da página
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Carregar consentimento existente primeiro
    this.consentData = this.loadConsent();
    
    // Verificar se precisa mostrar banner
    this.checkConsentRequired();
    this.setupPrivacyNotifications();
    
    // DEBUG: Adicionar função global para testar banner
    window.showPrivacyBanner = () => {
      localStorage.removeItem(this.consentKey);
      this.consentData = null;
      this.showConsentBanner();
    };
    
    console.log('🔒 Sistema de privacidade inicializado');
  }

  loadConsent() {
    try {
      const stored = localStorage.getItem(this.consentKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Erro ao carregar consentimento:', error);
      return null;
    }
  }

  saveConsent(consentData) {
    try {
      const consentRecord = {
        version: this.consentVersion,
        timestamp: new Date().toISOString(),
        accepted: true,
        preferences: consentData || {
          essential: true,
          analytics: false,
          marketing: false
        }
      };
      
      localStorage.setItem(this.consentKey, JSON.stringify(consentRecord));
      this.consentData = consentRecord;
      
      // Log seguro do consentimento
      if (window.DataProtection) {
        window.DataProtection.secureLog('Consentimento registrado', 'privacy');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar consentimento:', error);
      return false;
    }
  }

  // Adicionar método getConsent que estava faltando
  getConsent() {
    return this.consentData;
  }

  checkConsentRequired() {
    // Verificar se precisa mostrar banner de consentimento
    if (!this.consentData || this.consentData.version !== this.consentVersion) {
      this.showConsentBanner();
    }
  }

  showConsentBanner() {
    // Remover banner existente se houver
    const existingBanner = document.getElementById('privacy-consent-banner');
    if (existingBanner) {
      existingBanner.remove();
    }

    const banner = document.createElement('div');
    banner.id = 'privacy-consent-banner';
    banner.className = 'privacy-consent-banner';
    banner.innerHTML = `
      <div class="consent-content">
        <div class="consent-icon">🔒</div>
        <div class="consent-text">
          <h3>🇧🇷 Proteção de Dados (LGPD)</h3>
          <p><strong>Dados Essenciais:</strong> Coletamos apenas o mínimo necessário (email para login, resultados para progresso).</p>
          <p><strong>Sua Escolha:</strong> Funcionalidades extras requerem consentimento específico. Você pode alterar isso a qualquer momento.</p>
        </div>
                  <div class="consent-actions">
            <button class="consent-btn secondary" id="essential-only-btn">Só Essenciais</button>
            <button class="consent-btn secondary" id="customize-btn">Personalizar</button>
            <button class="consent-btn primary" id="accept-all-btn">Aceitar Tudo</button>
          </div>
      </div>
    `;

    // Adicionar estilos
    banner.innerHTML += `
      <style>
        .privacy-consent-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.98), rgba(0, 30, 60, 0.98));
          border-top: 2px solid var(--primary-color, #00ff7f);
          backdrop-filter: blur(10px);
          z-index: 10000;
          padding: 1rem;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .consent-content {
          display: flex;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .consent-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        
        .consent-text {
          flex: 1;
          min-width: 300px;
        }
        
        .consent-text h3 {
          margin: 0 0 0.5rem 0;
          color: var(--primary-color, #00ff7f);
          font-size: 1.1rem;
        }
        
        .consent-text p {
          margin: 0;
          color: var(--text-color, #e0e0e0);
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .consent-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .consent-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }
        
        .consent-btn.primary {
          background: var(--primary-color, #00ff7f);
          color: var(--bg-color, #0a0a0a);
        }
        
        .consent-btn.primary:hover {
          background: var(--accent-color, #40e0d0);
          transform: translateY(-2px);
        }
        
        .consent-btn.secondary {
          background: transparent;
          color: var(--secondary-color, #6495ed);
          border: 1px solid var(--secondary-color, #6495ed);
        }
        
        .consent-btn.secondary:hover {
          background: var(--secondary-color, #6495ed);
          color: var(--bg-color, #0a0a0a);
        }
        
        .consent-link {
          color: var(--accent-color, #40e0d0);
          text-decoration: none;
          font-size: 0.9rem;
          padding: 0.5rem;
        }
        
        .consent-link:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .consent-content {
            flex-direction: column;
            text-align: center;
          }
          
          .consent-actions {
            justify-content: center;
            width: 100%;
          }
        }
      </style>
    `;

    document.body.appendChild(banner);

    // Adicionar event listeners para o banner
    setTimeout(() => {
      const essentialBtn = document.getElementById('essential-only-btn');
      const customizeBtn = document.getElementById('customize-btn');
      const acceptAllBtn = document.getElementById('accept-all-btn');
      
      if (essentialBtn) {
        essentialBtn.addEventListener('click', () => {
          this.acceptEssentialOnly();
        });
      }
      
      if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
          this.showPrivacySettings();
        });
      }
      
      if (acceptAllBtn) {
        acceptAllBtn.addEventListener('click', () => {
          this.acceptAll();
        });
      }
    }, 100);
  }

  // Novas funções LGPD
  acceptEssentialOnly() {
    const essentialConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    const success = this.saveConsent(essentialConsent);
    
    if (success) {
      this.hideConsentBanner();
      this.showNotification('✅ Modo essencial ativado! Funcionalidades básicas disponíveis.', 'info');
      this.applyConsentSettings(essentialConsent);
    }
  }

  acceptAll() {
    const fullConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    const success = this.saveConsent(fullConsent);
    
    if (success) {
      this.hideConsentBanner();
      this.showNotification('✅ Todas as funcionalidades ativadas! Obrigado pela confiança.', 'success');
      this.applyConsentSettings(fullConsent);
    }
  }

  applyConsentSettings(consent) {
    // Aplicar configurações baseadas no consentimento
    if (consent.functional) {
      this.enablePersonalization();
    } else {
      this.disablePersonalization();
    }
    
    if (consent.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }
    
    if (consent.marketing) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }
  }

  enablePersonalization() {
    // Funcionalidades que requerem dados funcionais
    if (window.userAccountManager) {
      console.log('✅ Personalização habilitada');
    }
  }

  disablePersonalization() {
    console.log('🔒 Personalização desabilitada - modo essencial');
  }

  enableAnalytics() {
    console.log('📊 Analytics habilitado');
  }

  disableAnalytics() {
    console.log('🔒 Analytics desabilitado');
  }

  enableMarketing() {
    console.log('📧 Marketing habilitado');
  }

  disableMarketing() {
    console.log('🔒 Marketing desabilitado');
  }

  acceptConsent() {
    const success = this.saveConsent({
      essential: true,
      analytics: false,
      marketing: false
    });

    if (success) {
      this.hideConsentBanner();
      this.showNotification('Configurações de privacidade salvas! ✅', 'success');
    } else {
      this.showNotification('Erro ao salvar configurações. Tente novamente.', 'error');
    }
  }

  showPrivacySettings() {
    // Modal de configurações detalhadas
    const modal = document.createElement('div');
    modal.id = 'privacy-settings-modal';
    modal.className = 'privacy-modal';
    modal.innerHTML = `
      <div class="privacy-modal-content">
        <div class="privacy-modal-header">
          <h2>🔒 Configurações de Privacidade</h2>
          <button class="close-modal" id="close-privacy-modal">×</button>
        </div>
        
        <div class="privacy-modal-body">
          <div class="privacy-option">
            <div class="option-header">
              <h3>🛡️ Dados Essenciais</h3>
              <label class="toggle-switch">
                <input type="checkbox" id="essential-toggle" checked disabled>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p>Necessários para login, quiz e funcionalidades básicas. Não podem ser desabilitados.</p>
            <small>Inclui: email (mascarado), pontuações, timestamps de sessão</small>
          </div>
          
          <div class="privacy-option">
            <div class="option-header">
              <h3>📊 Dados Analíticos</h3>
              <label class="toggle-switch">
                <input type="checkbox" id="analytics-toggle">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p>Dados anônimos para melhorar o sistema (desabilitado por padrão).</p>
            <small>Inclui: estatísticas de uso, performance, erros (sem dados pessoais)</small>
          </div>
          
          <div class="privacy-option">
            <div class="option-header">
              <h3>🎯 Comunicações</h3>
              <label class="toggle-switch">
                <input type="checkbox" id="marketing-toggle">
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p>Notificações sobre novos recursos e atualizações (desabilitado por padrão).</p>
            <small>Inclui: emails informativos, notificações de sistema</small>
          </div>
          
          <div class="privacy-summary">
            <h3>📋 Resumo de Proteção</h3>
            <ul>
              <li>✅ Emails mascarados em logs (ex: jo***@****.com)</li>
              <li>✅ Senhas criptografadas (Firebase Auth)</li>
              <li>✅ HTTPS obrigatório</li>
              <li>✅ Rate limiting ativo</li>
              <li>✅ Dados não compartilhados com terceiros</li>
              <li>✅ Conformidade LGPD/GDPR</li>
            </ul>
          </div>
        </div>
        
        <div class="privacy-modal-footer">
          <button class="consent-btn secondary" id="cancel-privacy-settings">
            Cancelar
          </button>
          <button class="consent-btn primary" id="save-privacy-settings">
            💾 Salvar Configurações
          </button>
        </div>
      </div>
    `;

    // Adicionar estilos do modal
    modal.innerHTML += `
      <style>
        .privacy-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .privacy-modal-content {
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.98), rgba(0, 30, 60, 0.98));
          border: 1px solid var(--primary-color, #00ff7f);
          border-radius: 15px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
        }
        
        .privacy-modal-header {
          padding: 1.5rem 1.5rem 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .privacy-modal-header h2 {
          margin: 0;
          color: var(--primary-color, #00ff7f);
        }
        
        .close-modal {
          background: none;
          border: none;
          color: var(--text-color, #e0e0e0);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background 0.3s ease;
        }
        
        .close-modal:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .privacy-modal-body {
          padding: 1.5rem;
        }
        
        .privacy-option {
          margin-bottom: 2rem;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .option-header h3 {
          margin: 0;
          color: var(--accent-color, #40e0d0);
        }
        
        .privacy-option p {
          margin: 0.5rem 0;
          color: var(--text-color, #e0e0e0);
        }
        
        .privacy-option small {
          color: var(--secondary-color, #6495ed);
          font-style: italic;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #333;
          transition: 0.3s;
          border-radius: 24px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: var(--primary-color, #00ff7f);
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }
        
        input:disabled + .toggle-slider {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .privacy-summary {
          background: linear-gradient(135deg, rgba(0, 255, 127, 0.1), rgba(64, 224, 208, 0.1));
          padding: 1rem;
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 127, 0.3);
        }
        
        .privacy-summary h3 {
          margin-top: 0;
          color: var(--primary-color, #00ff7f);
        }
        
        .privacy-summary ul {
          margin: 0;
          padding-left: 1rem;
        }
        
        .privacy-summary li {
          margin: 0.5rem 0;
          color: var(--text-color, #e0e0e0);
        }
        
        .privacy-modal-footer {
          padding: 1rem 1.5rem 1.5rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        @media (max-width: 768px) {
          .privacy-modal-content {
            margin: 0.5rem;
          }
          
          .option-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .privacy-modal-footer {
            flex-direction: column;
          }
        }
      </style>
    `;

    document.body.appendChild(modal);
    
    // Adicionar event listeners
    const closeBtn = document.getElementById('close-privacy-modal');
    const cancelBtn = document.getElementById('cancel-privacy-settings');
    const saveBtn = document.getElementById('save-privacy-settings');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePrivacySettings());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closePrivacySettings());
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.savePrivacySettings());
    }
    
    // Fechar clicando fora do modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closePrivacySettings();
      }
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePrivacySettings();
      }
    });
    
    // Carregar configurações atuais
    this.loadCurrentSettingsInModal();
  }

  loadCurrentSettingsInModal() {
    const currentConsent = this.getConsent();
    
    if (currentConsent) {
      // Definir os toggles baseados nas preferências atuais
      const analyticsToggle = document.getElementById('analytics-toggle');
      const marketingToggle = document.getElementById('marketing-toggle');
      
      if (analyticsToggle) analyticsToggle.checked = currentConsent.analytics || false;
      if (marketingToggle) marketingToggle.checked = currentConsent.marketing || false;
    }
  }

  savePrivacySettings() {
    const analyticsToggle = document.getElementById('analytics-toggle');
    const marketingToggle = document.getElementById('marketing-toggle');
    
    const preferences = {
      essential: true, // Sempre true
      functional: true, // Necessário para conta de usuário
      analytics: analyticsToggle ? analyticsToggle.checked : false,
      marketing: marketingToggle ? marketingToggle.checked : false
    };

    const success = this.saveConsent(preferences);

    if (success) {
      this.closePrivacySettings();
      this.hideConsentBanner();
      this.applyConsentSettings(preferences);
      this.showNotification('✅ Configurações de privacidade atualizadas com sucesso!', 'success');
    } else {
      this.showNotification('❌ Erro ao salvar configurações. Tente novamente.', 'error');
    }
  }

  closePrivacySettings() {
    const modal = document.getElementById('privacy-settings-modal');
    if (modal) {
      modal.remove();
    }
  }

  hideConsentBanner() {
    const banner = document.getElementById('privacy-consent-banner');
    if (banner) {
      banner.style.transform = 'translateY(100%)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `privacy-notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--primary-color, #00ff7f)' : 
                   type === 'error' ? '#ff4444' : 'var(--secondary-color, #6495ed)'};
      color: var(--bg-color, #0a0a0a);
      padding: 1rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      z-index: 10002;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remover após 5 segundos
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  setupPrivacyNotifications() {
    // Notificar sobre atualizações de privacidade se necessário
    if (this.consentData && this.consentData.version !== this.consentVersion) {
      this.showNotification('Política de privacidade atualizada. Revise suas configurações.', 'info');
    }
  }

  // Métodos públicos para verificação de consentimento
  hasConsent(type = 'essential') {
    if (!this.consentData) return false;
    return this.consentData.preferences && this.consentData.preferences[type];
  }

  canUseAnalytics() {
    return this.hasConsent('analytics');
  }

  canSendMarketing() {
    return this.hasConsent('marketing');
  }

  // Método para revogar consentimento
  revokeConsent() {
    localStorage.removeItem(this.consentKey);
    this.consentData = null;
    
    // Limpar dados desnecessários
    if (window.DataProtection) {
      window.DataProtection.clearSensitiveStorage();
    }
    
    this.showNotification('Consentimento revogado. Dados limpos.', 'info');
    this.showConsentBanner();
  }
}

// Inicializar sistema de consentimento
window.privacyConsent = new PrivacyConsent();
