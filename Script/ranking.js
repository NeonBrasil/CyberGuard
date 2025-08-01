// Sistema de Ranking compatível com Firebase v8 (compat)
window.RankingManager = {
  
  // Carregar ranking global (baseado em pontuação média)
  async getGlobalRanking() {
    try {
      console.log('🏆 Carregando ranking global baseado na média de acertos...');
      
      // Consulta mais simples para evitar problemas de índice
      const usersSnapshot = await window.db.collection('users')
        .get();
      
      const ranking = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const stats = userData.stats || {};
        
        // Só incluir usuários que fizeram pelo menos 1 quiz
        if ((stats.totalQuizzes || 0) > 0) {
          ranking.push({
            id: doc.id,
            name: userData.name || 'Usuário Anônimo',
            totalQuizzes: stats.totalQuizzes || 0,
            averageScore: Math.round(stats.averageScore || 0),
            totalScore: stats.totalScore || 0,
            timeSpent: stats.timeSpent || 0
          });
        }
      });
      
      // Ordenar no cliente por média de acertos (desc) e depois por total de quizzes (desc)
      ranking.sort((a, b) => {
        if (a.averageScore !== b.averageScore) {
          return b.averageScore - a.averageScore; // Maior média primeiro
        }
        return b.totalQuizzes - a.totalQuizzes; // Mais quizzes em caso de empate
      });
      
      // Limitar aos top 50
      const topRanking = ranking.slice(0, 50);
      
      console.log('✅ Ranking global carregado:', topRanking.length, 'usuários');
      console.log('📊 Top 3:', topRanking.slice(0, 3).map(u => ({ nome: u.name, media: u.averageScore, quizzes: u.totalQuizzes })));
      return topRanking;
      
    } catch (error) {
      console.error('❌ Erro ao carregar ranking global:', error);
      throw error;
    }
  },
  
  // Carregar ranking por dificuldade (baseado nos resultados de quiz)
  async getDifficultyRanking(difficulty) {
    try {
      console.log('🎯 Carregando ranking por dificuldade:', difficulty);
      
      const resultsSnapshot = await window.db.collection('quizResults')
        .where('difficulty', '==', difficulty)
        .orderBy('score', 'desc')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      
      const userScores = new Map();
      
      // Processar resultados para pegar a melhor pontuação de cada usuário
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
      
      // Converter para array e ordenar
      const ranking = Array.from(userScores.values())
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.timestamp.seconds - b.timestamp.seconds; // Mais antigo em caso de empate
        })
        .slice(0, 50);
      
      console.log('✅ Ranking por dificuldade carregado:', ranking.length, 'usuários');
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
      html += `
        <div style="background: rgba(88, 166, 255, 0.1); border: 1px solid #58a6ff; border-radius: 8px; padding: 1rem; margin-bottom: 2rem; text-align: center;">
          <h3 style="color: #58a6ff; margin: 0 0 0.5rem 0;">🏆 Ranking Geral</h3>
          <p style="color: #c9d1d9; margin: 0; font-size: 0.9rem;">
            Classificação baseada na <strong>média de acertos</strong> de todos os quizzes realizados
          </p>
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
  console.log('🏆 Sistema de Ranking inicializado');
  
  // Verificar se Firebase está disponível
  if (!window.db) {
    console.error('❌ Firebase Firestore não está disponível para o ranking');
  } else {
    console.log('✅ Firebase Firestore disponível para ranking');
  }
});
