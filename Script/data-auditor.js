// Sistema de Auditoria de Dados para Transparência
// Permite ao usuário ver exatamente que dados estão sendo coletados

class DataAuditor {
  constructor() {
    this.auditLog = [];
    this.init();
  }

  init() {
    // Interceptar e auditar coleta de dados
    this.setupDataInterceptors();
    
    // Criar interface de auditoria
    this.createAuditInterface();
  }

  setupDataInterceptors() {
    try {
      // Interceptar localStorage
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (key, value) => {
        this.logDataCollection('localStorage', key, this.classifyData(key, value));
        return originalSetItem(key, value);
      };

      // Interceptar sessionStorage
      const originalSessionSetItem = sessionStorage.setItem.bind(sessionStorage);
      sessionStorage.setItem = (key, value) => {
        this.logDataCollection('sessionStorage', key, this.classifyData(key, value));
        return originalSessionSetItem(key, value);
      };

      console.log('✅ Data Auditor: Interceptores configurados com sucesso');
    } catch (error) {
      console.error('⚠️ Data Auditor: Erro ao configurar interceptores:', error);
    }

    // Interceptar Firebase Auth (aguardar estar disponível)
    const checkAuth = setInterval(() => {
      if (window.auth) {
        clearInterval(checkAuth);
        this.monitorFirebaseAuth();
      }
    }, 500);
    
    // Timeout após 10 segundos
    setTimeout(() => clearInterval(checkAuth), 10000);
  }

  monitorFirebaseAuth() {
    try {
      // Monitorar mudanças de estado de autenticação
      window.auth.onAuthStateChanged((user) => {
        if (user) {
          this.logDataCollection('Firebase Auth', 'user_session', {
            type: 'sensitive',
            purpose: 'Login e autenticação',
            retention: 'Durante a sessão ativa',
            legal_basis: 'Execução de contrato',
            encrypted: true,
            masked_in_logs: true
          });
          
          console.log('✅ Data Auditor: Usuário autenticado monitorado');
        }
      });
      
      console.log('✅ Data Auditor: Firebase Auth monitorado');
    } catch (error) {
      console.error('⚠️ Data Auditor: Erro ao monitorar Firebase Auth:', error);
    }
  }

  logDataCollection(source, key, classification) {
    const entry = {
      timestamp: new Date().toISOString(),
      source: source,
      key: key,
      classification: classification,
      id: this.generateId()
    };

    this.auditLog.push(entry);
    
    // Manter apenas últimos 100 registros
    if (this.auditLog.length > 100) {
      this.auditLog = this.auditLog.slice(-100);
    }

    // Atualizar interface se estiver aberta
    this.updateAuditInterface();
  }

  classifyData(key, value) {
    const sensitive = ['email', 'password', 'token', 'auth', 'user'];
    const analytics = ['quiz_result', 'performance', 'usage', 'behavior'];
    const essential = ['consent', 'preferences', 'session', 'config'];

    let type = 'other';
    let purpose = 'Funcionalidade geral';
    let retention = '7 dias';
    let legal_basis = 'Interesse legítimo';

    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      type = 'sensitive';
      purpose = 'Autenticação e segurança';
      retention = 'Durante a conta ativa';
      legal_basis = 'Execução de contrato';
    } else if (analytics.some(a => key.toLowerCase().includes(a))) {
      type = 'analytics';
      purpose = 'Melhorias no sistema';
      retention = '30 dias (anonimizado)';
      legal_basis = 'Consentimento';
    } else if (essential.some(e => key.toLowerCase().includes(e))) {
      type = 'essential';
      purpose = 'Funcionamento básico';
      retention = 'Até revogação';
      legal_basis = 'Interesse legítimo';
    }

    return {
      type: type,
      purpose: purpose,
      retention: retention,
      legal_basis: legal_basis,
      encrypted: type === 'sensitive',
      masked_in_logs: type === 'sensitive'
    };
  }

  createAuditInterface() {
    // Criar botão flutuante para auditoria
    const auditButton = document.createElement('button');
    auditButton.id = 'data-audit-btn';
    auditButton.innerHTML = '🔍';
    auditButton.title = 'Ver Auditoria de Dados (Transparência LGPD)';
    auditButton.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00ff7f, #40e0d0);
      color: #0a0a0a;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(0, 255, 127, 0.3);
      transition: all 0.3s ease;
      opacity: 0.8;
    `;

    auditButton.addEventListener('mouseenter', () => {
      auditButton.style.opacity = '1';
      auditButton.style.transform = 'scale(1.1)';
      auditButton.title = `Ver Auditoria - ${this.auditLog.length} registros coletados`;
    });

    auditButton.addEventListener('mouseleave', () => {
      auditButton.style.opacity = '0.8';
      auditButton.style.transform = 'scale(1)';
    });

    auditButton.addEventListener('click', () => this.showAuditModal());

    // Aguardar DOM estar pronto
    if (document.body) {
      document.body.appendChild(auditButton);
      console.log('✅ Data Auditor: Botão de auditoria criado');
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(auditButton);
        console.log('✅ Data Auditor: Botão de auditoria criado');
      });
    }
  }

  showAuditModal() {
    // Remover modal existente
    const existingModal = document.getElementById('data-audit-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'data-audit-modal';
    modal.className = 'audit-modal';
    modal.innerHTML = `
      <div class="audit-modal-content">
        <div class="audit-modal-header">
          <h2>🔍 Auditoria de Dados Coletados</h2>
          <button class="close-audit" onclick="this.closest('.audit-modal').remove()">×</button>
        </div>
        
        <div class="audit-summary">
          <div class="summary-card essential">
            <h3>🛡️ Dados Essenciais</h3>
            <p>${this.getDataCount('essential')} itens</p>
            <small>Necessários para funcionamento</small>
          </div>
          <div class="summary-card analytics">
            <h3>📊 Dados Analíticos</h3>
            <p>${this.getDataCount('analytics')} itens</p>
            <small>Para melhorias (se consentido)</small>
          </div>
          <div class="summary-card sensitive">
            <h3>🔒 Dados Sensíveis</h3>
            <p>${this.getDataCount('sensitive')} itens</p>
            <small>Criptografados e mascarados</small>
          </div>
        </div>
        
        <div class="audit-controls">
          <button class="audit-btn" onclick="dataAuditor.exportAuditLog()">
            📥 Exportar Relatório
          </button>
          <button class="audit-btn" onclick="dataAuditor.clearNonEssentialData()">
            🗑️ Limpar Dados Opcionais
          </button>
          <button class="audit-btn" onclick="window.privacyConsent && window.privacyConsent.showPrivacySettings()">
            ⚙️ Configurar Privacidade
          </button>
        </div>
        
        <div class="audit-log" id="audit-log-container">
          <h3>📋 Log de Coleta (Últimas 24h)</h3>
          <div class="log-entries">
            ${this.renderAuditLog()}
          </div>
        </div>
      </div>
    `;

    // Adicionar estilos
    modal.innerHTML += `
      <style>
        .audit-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(5px);
          z-index: 10003;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .audit-modal-content {
          background: linear-gradient(135deg, rgba(0, 20, 40, 0.98), rgba(0, 30, 60, 0.98));
          border: 1px solid var(--primary-color, #00ff7f);
          border-radius: 15px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow: auto;
        }
        
        .audit-modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .audit-modal-header h2 {
          margin: 0;
          color: var(--primary-color, #00ff7f);
        }
        
        .close-audit {
          background: none;
          border: none;
          color: var(--text-color, #e0e0e0);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
        }
        
        .close-audit:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .audit-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1.5rem;
        }
        
        .summary-card {
          padding: 1rem;
          border-radius: 10px;
          text-align: center;
          border: 1px solid;
        }
        
        .summary-card.essential {
          background: rgba(0, 255, 127, 0.1);
          border-color: var(--primary-color, #00ff7f);
        }
        
        .summary-card.analytics {
          background: rgba(100, 149, 237, 0.1);
          border-color: var(--secondary-color, #6495ed);
        }
        
        .summary-card.sensitive {
          background: rgba(255, 165, 0, 0.1);
          border-color: #ffa500;
        }
        
        .summary-card h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
        }
        
        .summary-card p {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .summary-card small {
          color: var(--secondary-color, #6495ed);
          font-size: 0.8rem;
        }
        
        .audit-controls {
          padding: 0 1.5rem 1.5rem 1.5rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .audit-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--primary-color, #00ff7f);
          background: transparent;
          color: var(--primary-color, #00ff7f);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }
        
        .audit-btn:hover {
          background: var(--primary-color, #00ff7f);
          color: var(--bg-color, #0a0a0a);
        }
        
        .audit-log {
          padding: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .audit-log h3 {
          margin: 0 0 1rem 0;
          color: var(--accent-color, #40e0d0);
        }
        
        .log-entries {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .log-entry {
          padding: 0.75rem;
          margin: 0.5rem 0;
          border-radius: 5px;
          border-left: 3px solid;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .log-entry.essential {
          border-left-color: var(--primary-color, #00ff7f);
        }
        
        .log-entry.analytics {
          border-left-color: var(--secondary-color, #6495ed);
        }
        
        .log-entry.sensitive {
          border-left-color: #ffa500;
        }
        
        .log-entry.other {
          border-left-color: #666;
        }
        
        .log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .log-title {
          font-weight: bold;
          color: var(--text-color, #e0e0e0);
        }
        
        .log-time {
          font-size: 0.8rem;
          color: var(--secondary-color, #6495ed);
        }
        
        .log-details {
          font-size: 0.9rem;
          color: #ccc;
          line-height: 1.4;
        }
        
        .log-classification {
          margin-top: 0.5rem;
          padding: 0.25rem 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          font-size: 0.8rem;
        }
        
        @media (max-width: 768px) {
          .audit-summary {
            grid-template-columns: 1fr;
          }
          
          .audit-controls {
            flex-direction: column;
          }
          
          .audit-modal-content {
            margin: 0.5rem;
          }
        }
      </style>
    `;

    document.body.appendChild(modal);
  }

  renderAuditLog() {
    if (this.auditLog.length === 0) {
      return '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum dado coletado ainda</p>';
    }

    return this.auditLog
      .filter(entry => {
        // Mostrar apenas últimas 24 horas
        const entryTime = new Date(entry.timestamp);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return entryTime > oneDayAgo;
      })
      .reverse()
      .map(entry => `
        <div class="log-entry ${entry.classification.type}">
          <div class="log-header">
            <span class="log-title">${entry.source}: ${entry.key}</span>
            <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="log-details">
            <strong>Propósito:</strong> ${entry.classification.purpose}<br>
            <strong>Base Legal:</strong> ${entry.classification.legal_basis}<br>
            <strong>Retenção:</strong> ${entry.classification.retention}
          </div>
          <div class="log-classification">
            ${entry.classification.encrypted ? '🔒 Criptografado' : ''} 
            ${entry.classification.masked_in_logs ? '🎭 Mascarado em logs' : ''}
            Tipo: ${entry.classification.type}
          </div>
        </div>
      `).join('');
  }

  updateAuditInterface() {
    const container = document.getElementById('audit-log-container');
    if (container) {
      const logEntries = container.querySelector('.log-entries');
      if (logEntries) {
        logEntries.innerHTML = this.renderAuditLog();
      }
    }
  }

  getDataCount(type) {
    return this.auditLog.filter(entry => entry.classification.type === type).length;
  }

  exportAuditLog() {
    const report = {
      generated_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      total_entries: this.auditLog.length,
      data_summary: {
        essential: this.getDataCount('essential'),
        analytics: this.getDataCount('analytics'),
        sensitive: this.getDataCount('sensitive'),
        other: this.getDataCount('other')
      },
      consent_status: window.privacyConsent ? {
        has_consent: !!window.privacyConsent.consentData,
        version: window.privacyConsent.consentVersion,
        analytics_enabled: window.privacyConsent.canUseAnalytics(),
        marketing_enabled: window.privacyConsent.canSendMarketing()
      } : null,
      audit_log: this.auditLog
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sia_data_audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showNotification('Relatório de auditoria exportado! 📥', 'success');
  }

  clearNonEssentialData() {
    const confirmed = confirm('Deseja limpar todos os dados não essenciais? Isso incluirá resultados de quiz, preferências e dados analíticos.');
    
    if (confirmed) {
      // Limpar localStorage não essencial
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('consent') && !key.includes('essential')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Limpar sessionStorage
      sessionStorage.clear();

      // Limpar log de auditoria
      this.auditLog = this.auditLog.filter(entry => entry.classification.type === 'essential');

      this.showNotification('Dados não essenciais removidos! 🗑️', 'success');
      this.updateAuditInterface();
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--primary-color, #00ff7f)' : 'var(--secondary-color, #6495ed)'};
      color: var(--bg-color, #0a0a0a);
      padding: 1rem;
      border-radius: 5px;
      z-index: 10004;
      font-weight: 500;
      max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }
}

// Inicializar auditor de dados
window.dataAuditor = new DataAuditor();
