// Sistema de Ranking Otimizado com Cache Diário (Horário Brasileiro)
window.RankingManager = {
  
  // Cache local com timestamp
  cache: {
    globalRanking: null,
    lastUpdate: null,
    updateHour: 19, // Horário de atualização diária (19h)
    timezone: 'America/Sao_Paulo' // Fuso horário brasileiro
  },
  
  // Obter data/hora atual no fuso brasileiro
  getBrazilTime() {
    return new Date().toLocaleString('pt-BR', { 
      timeZone: this.cache.timezone,
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },
  
  // Obter Date object no horário brasileiro
  getBrazilDate() {
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: this.cache.timezone }));
    return brazilTime;
  },
  
  // Verificar se cache é válido baseado no horário de atualização diário
  isCacheValid() {
    if (!this.cache.lastUpdate || !this.cache.globalRanking) {
      console.log('❌ Cache inexistente - primeira busca será feita');
      return false;
    }
    
    const nowBrazil = this.getBrazilDate();
    const lastUpdateBrazil = new Date(this.cache.lastUpdate);
    
    // Criar horário de atualização de hoje (19h Brasil)
    const todayUpdate = new Date(nowBrazil);
    todayUpdate.setHours(this.cache.updateHour, 0, 0, 0);
    
    console.log('🕐 Horário atual (Brasil):', this.getBrazilTime());
    console.log('🕕 Última atualização:', lastUpdateBrazil.toLocaleString('pt-BR', { timeZone: this.cache.timezone }));
    console.log('🕖 Horário de atualização hoje:', todayUpdate.toLocaleString('pt-BR', { timeZone: this.cache.timezone }));
    
    // CORREÇÃO CRÍTICA: Se já foi atualizado hoje após 19h, cache válido até amanhã às 19h
    if (lastUpdateBrazil >= todayUpdate && 
        lastUpdateBrazil.toDateString() === nowBrazil.toDateString()) {
      console.log('✅ Cache válido - já atualizado hoje após 19h (válido até amanhã às 19h)');
      return true;
    }
    
    // Se ainda não chegou na hora de atualizar hoje
    if (nowBrazil < todayUpdate) {
      // Cache válido se foi atualizado ontem depois das 19h
      const yesterdayUpdate = new Date(todayUpdate);
      yesterdayUpdate.setDate(yesterdayUpdate.getDate() - 1);
      
      if (lastUpdateBrazil >= yesterdayUpdate) {
        console.log('✅ Cache válido - usando dados de ontem após 19h');
        return true;
      }
    }
    
    // Se chegou aqui, precisa atualizar apenas se passou das 19h E não foi atualizado hoje
    if (nowBrazil >= todayUpdate && 
        lastUpdateBrazil.toDateString() !== nowBrazil.toDateString()) {
      console.log('❌ Cache expirado - passou das 19h e não foi atualizado hoje');
      return false;
    }
    
    // Para qualquer outro caso, manter cache válido
    console.log('✅ Cache válido - mantendo dados atuais');
    return true;
  },
  
  // Verificar próximo horário de atualização
  getNextUpdateTime() {
    const nowBrazil = this.getBrazilDate();
    const todayUpdate = new Date(nowBrazil);
    todayUpdate.setHours(this.cache.updateHour, 0, 0, 0);
    
    if (nowBrazil >= todayUpdate) {
      // Se já passou das 19h hoje, próxima atualização é amanhã às 19h
      const tomorrow = new Date(todayUpdate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    } else {
      // Se ainda não passou das 19h, próxima é hoje às 19h
      return todayUpdate;
    }
  },
  
  // Carregar ranking global com cache diário (Horário Brasileiro)
  async getGlobalRanking() {
    try {
      console.log('🏆 Verificando cache do ranking...');
      console.log('🇧🇷 Horário atual (Brasil):', this.getBrazilTime());
      
      // Se cache é válido, usar dados locais
      if (this.isCacheValid()) {
        const nextUpdate = this.getNextUpdateTime();
        console.log('✅ Usando ranking do cache (economizando reads)');
        console.log(`⏰ Próxima atualização: ${nextUpdate.toLocaleString('pt-BR', { timeZone: this.cache.timezone })}`);
        return this.cache.globalRanking;
      }
      
      console.log('🔄 Cache expirado - buscando dados atualizados do Firebase...');
      console.log('💰 CONSUMINDO 1 READ do Firebase para atualizar ranking');
      
      // Buscar dados atualizados (só quando necessário)
      const usersSnapshot = await window.db.collection('users')
        .where('stats.totalQuizzes', '>', 0)
        .limit(50) // Limitar para economizar
        .get();
      
      const ranking = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const stats = userData.stats || {};
        
        ranking.push({
          id: doc.id,
          name: userData.name || 'Usuário Anônimo',
          totalQuizzes: stats.totalQuizzes || 0,
          averageScore: Math.round(stats.averageScore || 0),
          totalScore: stats.totalScore || 0,
          timeSpent: stats.timeSpent || 0
        });
      });
      
      // Ordenar localmente (mais eficiente)
      ranking.sort((a, b) => {
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }
        return b.totalQuizzes - a.totalQuizzes;
      });
      
      // Atualizar cache com timestamp brasileiro
      this.cache.globalRanking = ranking;
      this.cache.lastUpdate = this.getBrazilDate().getTime(); // Usar horário brasileiro
      
      const nextUpdate = this.getNextUpdateTime();
      console.log(`✅ Ranking atualizado: ${ranking.length} usuários (${usersSnapshot.size} reads consumidos)`);
      console.log(`🇧🇷 Atualizado em: ${this.getBrazilTime()}`);
      console.log(`⏰ Próxima atualização: ${nextUpdate.toLocaleString('pt-BR', { timeZone: this.cache.timezone })}`);
      console.log('💾 Cache válido até a próxima atualização - SEM MAIS READS até lá!');
      return ranking;
      
    } catch (error) {
      console.error('❌ Erro ao carregar ranking:', error);
      
      // Se falhar, tentar usar cache antigo
      if (this.cache.globalRanking) {
        console.log('⚠️ Usando cache antigo como fallback');
        return this.cache.globalRanking;
      }
      
      throw error;
    }
  },
  
  // Forçar atualização do cache
  async refreshCache() {
    this.cache.lastUpdate = null;
    return await this.getGlobalRanking();
  },
  
  // Carregar ranking por dificuldade (mantido como estava)
  async getDifficultyRanking(difficulty) {
    try {
      console.log('🎯 Carregando ranking por dificuldade:', difficulty);
      
      const resultsSnapshot = await window.db.collection('quizResults')
        .where('difficulty', '==', difficulty)
        .orderBy('score', 'desc')
        .limit(20) // Reduzido de 100 para 20
        .get();
      
      const userScores = new Map();
      
      resultsSnapshot.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        const score = data.score;
        
        if (!userScores.has(userId) || userScores.get(userId).score < score) {
          userScores.set(userId, {
            userId: userId,
            userName: data.userName || 'Usuário Anônimo',
            score: score,
            totalQuestions: data.totalQuestions || 0,
            timestamp: data.timestamp,
            timeSpent: data.timeSpent || 0
          });
        }
      });
      
      const ranking = Array.from(userScores.values())
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.timestamp.seconds - b.timestamp.seconds;
        });
      
      console.log(`✅ Ranking por dificuldade: ${ranking.length} usuários (${resultsSnapshot.size} reads)`);
      return ranking;
      
    } catch (error) {
      console.error('❌ Erro ao carregar ranking por dificuldade:', error);
      throw error;
    }
  },
  
  // Verificar se usuário está no ranking
  async getUserRankPosition(userId, type = 'global', difficulty = null) {
    try {
      let ranking;
      
      if (type === 'global') {
        ranking = await this.getGlobalRanking();
      } else {
        ranking = await this.getDifficultyRanking(difficulty);
      }
      
      const position = ranking.findIndex(user => user.id === userId || user.userId === userId);
      return position >= 0 ? position + 1 : null;
      
    } catch (error) {
      console.error('Erro ao verificar posição do usuário:', error);
      return null;
    }
  },
  
  // Renderizar ranking na página
  renderRanking(data, containerId, type = 'global') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container de ranking não encontrado:', containerId);
      return;
    }
    
    if (data.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>🎯 Seja o primeiro!</h3>
          <p>Ainda não há jogadores neste ranking. Que tal ser o primeiro?</p>
          <a href="escolhas.html" class="cta-button">Jogar Agora</a>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    // Adicionar cabeçalho explicativo para ranking global
    if (type === 'global') {
      const cacheAge = this.cache.lastUpdate ? 
        Math.round((Date.now() - this.cache.lastUpdate) / (1000 * 60 * 60)) : 0; // em horas
      
      const timeLeft = this.cache.lastUpdate ? 
        Math.round((this.cache.cacheTime - (Date.now() - this.cache.lastUpdate)) / (1000 * 60 * 60)) : 24; // em horas
      
      html += `
        <div style="background: rgba(88, 166, 255, 0.1); border: 1px solid #58a6ff; border-radius: 8px; padding: 1rem; margin-bottom: 2rem; text-align: center;">
          <h3 style="color: #58a6ff; margin: 0 0 0.5rem 0;">🏆 Ranking Geral</h3>
          <p style="color: #c9d1d9; margin: 0; font-size: 0.9rem;">
            Classificação baseada na <strong>média de acertos</strong> de todos os quizzes realizados
          </p>
          <p style="color: #6e7681; margin: 0.5rem 0 0 0; font-size: 0.8rem;">
            🕐 Atualizado há ${cacheAge}h • Próxima atualização em ~${timeLeft}h • 💰 Sistema ultra-econômico
          </p>
          ${cacheAge >= 12 ? `
            <button onclick="window.RankingManager.refreshCache().then(() => window.location.reload())" 
                    style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: #238636; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
              🔄 Forçar Atualização
            </button>
          ` : ''}
        </div>
      `;
    }
    
    html += '<div class="ranking-list">';
    
    data.forEach((player, index) => {
      const position = index + 1;
      const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
      const rankClass = position <= 3 ? 'top-three' : '';
      
      if (type === 'global') {
        html += `
          <div class="ranking-item ${rankClass}">
            <div class="rank-position">
              ${medal || position}
            </div>
            <div class="player-info">
              <div class="player-name">${this.escapeHtml(player.name)}</div>
              <div class="player-stats">
                ${player.totalQuizzes} quiz${player.totalQuizzes !== 1 ? 'zes' : ''} • ${this.formatTime(player.timeSpent)}
              </div>
            </div>
            <div class="player-score">
              <div class="main-score">${player.averageScore}%</div>
              <div class="sub-score">média de acertos</div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="ranking-item ${rankClass}">
            <div class="rank-position">
              ${medal || position}
            </div>
            <div class="player-info">
              <div class="player-name">${this.escapeHtml(player.userName)}</div>
              <div class="player-stats">
                ${player.totalQuestions} perguntas • ${this.formatTime(player.timeSpent)}
              </div>
            </div>
            <div class="player-score">
              <div class="main-score">${player.score}%</div>
              <div class="sub-score">${this.formatDate(player.timestamp)}</div>
            </div>
          </div>
        `;
      }
    });
    
    html += '</div>';
    container.innerHTML = html;
  },
  
  // Utilitários
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  formatTime(seconds) {
    if (!seconds || seconds < 60) return `${seconds || 0}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  },
  
  formatDate(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    }
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    });
  }
};

// Aguardar Firebase estar pronto
document.addEventListener('DOMContentLoaded', function() {
  console.log('🏆 Sistema de Ranking Otimizado inicializado');
  
  // Verificar se Firebase está disponível
  if (!window.db) {
    console.error('❌ Firebase Firestore não está disponível para o ranking');
  } else {
    console.log('✅ Firebase Firestore disponível para ranking');
  }
});

// SISTEMA DE CACHE OTIMIZADO PARA HORÁRIO BRASILEIRO
// O ranking busca dados do Firebase APENAS UMA VEZ POR DIA às 19h (horário de Brasília)
// Depois disso, usa cache local até o próximo dia às 19h

// Função de debug para verificar horários
window.RankingManager.debugTime = function() {
  console.log('=== DEBUG HORÁRIO BRASILEIRO ===');
  console.log('🇧🇷 Horário atual (Brasil):', this.getBrazilTime());
  console.log('🌍 Horário UTC:', new Date().toISOString());
  console.log('⏰ Horário de atualização:', this.cache.updateHour + 'h');
  console.log('📅 Cache válido?', this.isCacheValid());
  
  if (this.cache.lastUpdate) {
    const lastUpdate = new Date(this.cache.lastUpdate);
    console.log('🕐 Última atualização:', lastUpdate.toLocaleString('pt-BR', { timeZone: this.cache.timezone }));
  }
  
  const nextUpdate = this.getNextUpdateTime();
  console.log('🔄 Próxima atualização:', nextUpdate.toLocaleString('pt-BR', { timeZone: this.cache.timezone }));
};
