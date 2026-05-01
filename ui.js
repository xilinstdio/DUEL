// UI控制器
const UI = {
  // 初始化UI
  init() {
    // 骰子按钮点击
    document.getElementById('roll-dice-btn').addEventListener('click', () => this.handleRollDice());

    // 闪避按钮
    document.getElementById('dodge-yes').addEventListener('click', () => this.handleDodge(true));
    document.getElementById('dodge-no').addEventListener('click', () => this.handleDodge(false));

    // 石头剪刀布按钮
    document.querySelectorAll('.rps-buttons button').forEach(btn => {
      btn.addEventListener('click', () => this.handleRPS(btn.dataset.choice));
    });

    // 重新开始按钮
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.hideGameOverModal();
      Game.init();
    });

    // 卡牌编辑器
    this.initCardEditor();

    // 初始化游戏
    Game.init();
  },

  // 初始化卡牌编辑器
  initCardEditor() {
    const select = document.getElementById('editor-card-select');
    const applyBtn = document.getElementById('editor-apply-btn');

    select.addEventListener('change', () => this.updateEditorInfo(select.value));
    applyBtn.addEventListener('click', () => this.applyEditorConfig());

    this.updateEditorInfo('quantum');
  },

  // 更新编辑器信息
  updateEditorInfo(cardId) {
    const cardData = CardEditor.getCardData(cardId);
    if (!cardData) return;

    document.getElementById('editor-type').textContent = cardData.type;
    document.getElementById('editor-target').textContent = cardData.target;
    document.getElementById('editor-desc').textContent = cardData.desc;

    const paramsContainer = document.getElementById('editor-params');
    paramsContainer.innerHTML = '<h4>参数配置</h4>';

    if (cardData.params) {
      cardData.params.forEach(param => {
        const row = document.createElement('div');
        row.className = 'param-row';
        row.innerHTML = `
          <label>${param.label}:</label>
          <input type="number" id="param-${param.key}" value="${param.value}" min="${param.min}" max="${param.max}">
        `;
        paramsContainer.appendChild(row);
      });
    }

    this.logEditor('已加载卡牌: ' + cardData.name);
  },

  // 应用编辑器配置
  applyEditorConfig() {
    const cardId = document.getElementById('editor-card-select').value;
    const cardData = CardEditor.getCardData(cardId);
    if (!cardData) return;

    const params = {};
    if (cardData.params) {
      cardData.params.forEach(param => {
        const input = document.getElementById('param-' + param.key);
        if (input) params[param.key] = parseInt(input.value);
      });
    }

    CardEditor.applyConfig(cardId, params);
    this.logEditor('配置已应用: ' + cardData.name);
  },

  // 编辑器日志
  logEditor(message) {
    const logContent = document.getElementById('editor-log-content');
    if (!logContent) return;

    const entry = document.createElement('div');
    entry.textContent = '> ' + message;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
  },

  // 显示游戏结束弹窗
  showGameOverModal(winnerName) {
    document.getElementById('winner-text').textContent = winnerName + ' 获胜！';
    document.getElementById('game-over-modal').classList.add('active');
  },

  // 隐藏游戏结束弹窗
  hideGameOverModal() {
    document.getElementById('game-over-modal').classList.remove('active');
  },

  // 显示骰子弹窗
  showDiceModal() {
    document.getElementById('dice-modal').classList.add('active');
    document.getElementById('dice-result').textContent = '';
    document.querySelectorAll('.dice').forEach(d => d.textContent = '?');
  },

  // 隐藏骰子弹窗
  hideDiceModal() {
    document.getElementById('dice-modal').classList.remove('active');
  },

  // 处理掷骰子
  handleRollDice() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    
    this.animateDice(dice1, dice2);
  },

  // 骰子动画
  animateDice(final1, final2) {
    const diceEls = document.querySelectorAll('.dice');
    let rollCount = 0;
    const maxRolls = 15;
    
    const rollInterval = setInterval(() => {
      diceEls[0].textContent = Math.floor(Math.random() * 6) + 1;
      diceEls[1].textContent = Math.floor(Math.random() * 6) + 1;
      rollCount++;
      
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        diceEls[0].textContent = final1;
        diceEls[1].textContent = final2;
        
        document.getElementById('dice-result').textContent = '玩家1: ' + final1 + ' 点 | 玩家2: ' + final2 + ' 点';
        
        setTimeout(() => {
          Game.rollDice([final1, final2]);
          this.hideDiceModal();
        }, 1000);
      }
    }, 80);
  },

  // 显示石头剪刀布弹窗
  showRPSModal() {
    document.getElementById('rps-modal').classList.add('active');
  },

  // 隐藏石头剪刀布弹窗
  hideRPSModal() {
    document.getElementById('rps-modal').classList.remove('active');
  },

  // 显示闪避弹窗
  showDodgeModal(targetId, dodgeIndex) {
    this.dodgeState = { targetId, dodgeIndex };
    document.getElementById('dodge-target-name').textContent = Game.getPlayer(targetId).name + ' 手中握有【闪】';
    document.getElementById('dodge-modal').classList.add('active');
  },

  // 隐藏闪避弹窗
  hideDodgeModal() {
    document.getElementById('dodge-modal').classList.remove('active');
    this.dodgeState = null;
  },

  // 处理闪避选择
  handleDodge(useDodge) {
    const { targetId, dodgeIndex } = this.dodgeState;
    this.hideDodgeModal();

    if (useDodge) {
      Game.getPlayer(targetId).hand.splice(dodgeIndex, 1);
      UI.updateHands();
      Effects.killAfterDodge(null, targetId);
    } else {
      Game.setHealth(targetId, Game.getPlayer(targetId).health - 1, 'kill');
      Logger.log(Game.getPlayer(targetId).name + ' 未使用【闪】，扣除1点血量', 'damage');
    }

    Game.state.canActThisTurn = false;
    UI.updateTurnInfo();
    setTimeout(() => {
      Game.endTurn();
    }, 500);
  },

  // 处理石头剪刀布选择
  handleRPS(choice) {
    this.hideRPSModal();
    Effects.processRPS(choice);
  },

  // 更新所有UI（4人大乱斗模式）
  updateAll() {
    [1, 2, 3, 4].forEach(id => {
      this.updateHealth(id);
      this.updateCharacter(id);
    });
    this.updateMultiplier();
    this.updateTurn();
    this.updateTurnInfo();
    this.updateHands();
    this.updateDeckCount();
  },

  // 更新牌库数量
  updateDeckCount() {
    const deckEl = document.getElementById('deck-count');
    const discardEl = document.getElementById('discard-count');
    if (deckEl) deckEl.textContent = Game.state.deck.length;
    if (discardEl) discardEl.textContent = Game.state.discardPile.length;
  },

  // 抽牌动画
  animateDrawCard(playerId, card, callback) {
    const handContainer = document.getElementById('p' + playerId + '-hand');
    const cardEl = document.createElement('div');
    cardEl.className = 'hand-card draw-anim';
    cardEl.dataset.card = card;
    cardEl.innerHTML = '<span class="card-name">' + Game.getCardName(card) + '</span>';
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'translateY(-50px) scale(0.5)';
    
    handContainer.appendChild(cardEl);
    
    requestAnimationFrame(() => {
      cardEl.style.transition = 'all 0.3s ease';
      cardEl.style.opacity = '1';
      cardEl.style.transform = 'translateY(0) scale(1)';
      
      setTimeout(() => {
        cardEl.classList.remove('draw-anim');
        if (callback) callback();
      }, 300);
    });
  },

  // 濒死动画
  animateDying(playerId) {
    const playerEl = document.getElementById('player' + playerId);
    playerEl.classList.add('dying-flash');
    setTimeout(() => playerEl.classList.remove('dying-flash'), 1500);
  },

  // 更新血量显示
  updateHealth(playerId) {
    const player = Game.getPlayer(playerId);
    const healthFill = document.getElementById('p' + playerId + '-health-fill');
    const healthText = document.getElementById('p' + playerId + '-health');

    const percent = (player.health / player.maxHealth) * 100;
    healthFill.style.width = percent + '%';
    healthText.textContent = player.health;

    healthFill.classList.remove('danger', 'warning');
    if (player.health <= player.maxHealth * 0.2) {
      healthFill.classList.add('danger');
    } else if (player.health <= player.maxHealth * 0.4) {
      healthFill.classList.add('warning');
    }

    this.updateStatus(playerId);
  },

  // 伤害/治疗飘字动画
  animateHealthChange(playerId, oldHealth, newHealth) {
    const diff = newHealth - oldHealth;
    if (diff === 0) return;

    const floatEl = document.getElementById('p' + playerId + '-damage-float');
    const isHeal = diff > 0;
    const text = isHeal ? '+' + diff : '' + diff;

    floatEl.textContent = text;
    floatEl.className = 'damage-float ' + (isHeal ? 'heal' : 'damage') + ' show';

    const healthText = document.getElementById('p' + playerId + '-health');
    healthText.classList.add('health-pop');
    setTimeout(() => healthText.classList.remove('health-pop'), 400);

    setTimeout(() => {
      floatEl.classList.remove('show');
    }, 1200);
  },

  // 更新状态显示
  updateStatus(playerId) {
    const player = Game.getPlayer(playerId);
    const statusEl = document.getElementById('p' + playerId + '-status');

    if (player.dead) {
      statusEl.textContent = '已死亡';
      statusEl.style.color = '#ff0000';
    } else if (player.dying) {
      statusEl.textContent = '濒死 (' + player.dyingTurns + '/2回合)';
      statusEl.style.color = '#ff6b6b';
    } else {
      statusEl.textContent = '';
    }
  },

  // 更新角色牌显示
  updateCharacter(playerId) {
    const player = Game.getPlayer(playerId);
    const charEl = document.getElementById('p' + playerId + '-character');
    
    if (!player.character) {
      charEl.innerHTML = '';
      return;
    }
    
    const charDef = CharacterDefinitions[player.character];
    if (!charDef) return;
    
    charEl.innerHTML = `
      <div class="character-card">
        <span class="char-icon">${charDef.icon}</span>
        <div>
          <div class="char-name">${charDef.name}</div>
          <div class="char-desc">${charDef.desc}</div>
        </div>
      </div>
    `;
  },

  // 更新倍率显示
  updateMultiplier() {
    document.getElementById('multiplier').textContent = Game.state.multiplier;
  },

  // 更新回合显示
  updateTurn() {
    document.getElementById('turn').textContent = Game.state.turn;
  },

  // 更新回合信息
  updateTurnInfo() {
    this.updateTurn();
    this.updateActivePlayer();
    const phaseInfo = document.getElementById('phase-info');
    const turnWinner = Game.state.turnWinner;
    const canAct = Game.state.canActThisTurn;
    const currentPlayer = Game.getCurrentPlayer();
    
    let phaseText = '';
    let winnerText = turnWinner ? '当前回合: ' + currentPlayer.name : '';
    let actionText = canAct ? '可使用手牌' : '等待回合';
    
    if (Game.state.phase === 'roll') phaseText = '掷骰阶段';
    else if (Game.state.phase === 'draw') phaseText = '抽牌阶段';
    else if (Game.state.phase === 'action') phaseText = '行动阶段';
    
    phaseInfo.innerHTML = phaseText + '<br>' + winnerText + '<br>' + actionText;
  },

  // 更新活动玩家高亮（4人大乱斗模式）
  updateActivePlayer() {
    [1, 2, 3, 4].forEach(pid => {
      const playerEl = document.getElementById('player' + pid);
      if (!playerEl) return;
      playerEl.classList.remove('active');
      if (Game.state.turnWinner === pid && Game.state.canActThisTurn) {
        playerEl.classList.add('active');
      }
    });
  },

  // 更新手牌显示（4人大乱斗模式）
  updateHands() {
    [1, 2, 3, 4].forEach(pid => {
      const player = Game.getPlayer(pid);
      const handContainer = document.getElementById('p' + pid + '-hand');
      if (!handContainer) return;

      handContainer.innerHTML = '';

      player.hand.forEach((card, index) => {
        const cardBtn = document.createElement('button');
        cardBtn.className = 'hand-card';
        cardBtn.dataset.card = card;
        cardBtn.innerHTML = '<span class="card-name">' + Game.getCardName(card) + '</span>';
        cardBtn.dataset.player = pid;
        cardBtn.dataset.index = index;

        if (Game.state.canActThisTurn && Game.state.turnWinner === pid) {
          const needsTarget = ['quantum', 'hall', 'duel', 'kill', 'discard_other', 'steal'];
          const selfOnly = ['peach'];
          const noTarget = ['combine', 'rage', 'peach_garden', 'barbarian', 'draw_two', 'dodge'];
          const isCharacter = CHARACTER_DECK.includes(card);

          if (isCharacter) {
            cardBtn.addEventListener('mousedown', (e) => {
              e.preventDefault();
              this.startDragCharacter(cardBtn, card, index, pid);
            });
          } else if (needsTarget.includes(card)) {
            cardBtn.addEventListener('mousedown', (e) => {
              e.preventDefault();
              this.startDragTarget(cardBtn, card, index, pid);
            });
          } else if (selfOnly.includes(card)) {
            cardBtn.addEventListener('click', () => {
              this.useSelfCard(card, index, pid);
            });
          } else if (noTarget.includes(card)) {
            cardBtn.addEventListener('click', () => {
              this.useNoTargetCard(card, index, pid);
            });
          }
        } else {
          cardBtn.disabled = true;
        }

        handContainer.appendChild(cardBtn);
      });
    });
  },

  // 使用无目标卡牌
  useNoTargetCard(cardName, index, pid) {
    const player = Game.getPlayer(pid);
    Logger.log(player.name + ' 使用 ' + Game.getCardName(cardName), 'effect');
    player.hand.splice(index, 1);
    Game.state.discardPile.push(cardName);
    UI.updateHands();
    UI.updateDeckCount();
    CardHandler.useCard(cardName, null, pid);
  },

  // 使用仅对自己卡牌
  useSelfCard(cardName, index, pid) {
    const player = Game.getPlayer(pid);
    Logger.log(player.name + ' 使用 ' + Game.getCardName(cardName), 'effect');
    player.hand.splice(index, 1);
    Game.state.discardPile.push(cardName);
    UI.updateHands();
    UI.updateDeckCount();
    CardHandler.useCard(cardName, null, pid);
  },

  // 拖拽选择目标
  startDragTarget(cardEl, cardName, cardIndex, playerId) {
    const startX = cardEl.getBoundingClientRect().left + cardEl.offsetWidth / 2;
    const startY = cardEl.getBoundingClientRect().top + cardEl.offsetHeight / 2;

    this.dragState = {
      cardEl,
      cardName,
      cardIndex,
      playerId,
      active: true,
      currentTarget: null,
      startX,
      startY
    };

    cardEl.classList.add('dragging');

    const svgLayer = document.getElementById('drag-arrow-layer');
    svgLayer.innerHTML = `
      <defs>
        <marker id="arrow-marker" markerWidth="15" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L15,6 L0,12 Z" fill="#44ff44" filter="url(#glow-green)"/>
        </marker>
        <marker id="arrow-marker-hit" markerWidth="15" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L15,6 L0,12 Z" fill="#ff3333" filter="url(#glow-red)"/>
        </marker>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    `;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('arrow-line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', startX);
    line.setAttribute('y2', startY);
    line.setAttribute('stroke', '#44ff44');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('marker-end', 'url(#arrow-marker)');
    svgLayer.appendChild(line);

    this.dragState.line = line;

    this.boundMove = (e) => this.updateDragArrow(e);
    this.boundUp = (e) => this.endDragArrow(e);

    document.addEventListener('mousemove', this.boundMove);
    document.addEventListener('mouseup', this.boundUp);
  },

  updateDragArrow(e) {
    if (!this.dragState || !this.dragState.active) return;

    const { line, startX, startY } = this.dragState;
    const endX = e.clientX;
    const endY = e.clientY;

    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) return;

    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);

    const target = document.elementFromPoint(e.clientX, e.clientY);
    const playerEl = target?.closest('.player');

    document.querySelectorAll('.player').forEach(p => p.classList.remove('drag-target'));

    if (playerEl) {
      const targetId = parseInt(playerEl.id.replace('player', ''));
      const targetPlayer = Game.getPlayer(targetId);

      // 4人大乱斗：可以指向任何存活的对手（hall除外，可以指向自己）
      if (!targetPlayer.dead && (targetId !== this.dragState.playerId || this.dragState.cardName === 'hall')) {
        playerEl.classList.add('drag-target');
        line.setAttribute('stroke', '#ff3333');
        line.setAttribute('marker-end', 'url(#arrow-marker-hit)');
        this.dragState.currentTarget = targetId;
        return;
      }
    }

    line.setAttribute('stroke', '#44ff44');
    line.setAttribute('marker-end', 'url(#arrow-marker)');
    this.dragState.currentTarget = null;
  },

  endDragArrow(e) {
    if (!this.dragState || !this.dragState.active) return;

    document.removeEventListener('mousemove', this.boundMove);
    document.removeEventListener('mouseup', this.boundUp);

    const svgLayer = document.getElementById('drag-arrow-layer');
    svgLayer.innerHTML = '';

    document.querySelectorAll('.player').forEach(p => p.classList.remove('drag-target'));

    if (this.dragState.cardEl) {
      this.dragState.cardEl.classList.remove('dragging');
    }

    const targetId = this.dragState.currentTarget;
    if (targetId) {
      const cardName = this.dragState.cardName;
      const cardIndex = this.dragState.cardIndex;
      const userId = this.dragState.playerId;

      const player = Game.getPlayer(userId);
      const usedCard = player.hand.splice(cardIndex, 1)[0];
      Game.state.discardPile.push(usedCard);

      UI.updateHands();
      UI.updateDeckCount();

      CardHandler.useCardWithTarget(cardName, targetId, userId);
    }

    this.dragState.active = false;
    this.dragState = null;
  },

  // 拖拽装备角色牌
  startDragCharacter(cardEl, cardName, cardIndex, playerId) {
    const startX = cardEl.getBoundingClientRect().left + cardEl.offsetWidth / 2;
    const startY = cardEl.getBoundingClientRect().top + cardEl.offsetHeight / 2;

    this.dragState = {
      cardEl,
      cardName,
      cardIndex,
      playerId,
      active: true,
      currentTarget: null,
      startX,
      startY,
      isCharacter: true
    };

    cardEl.classList.add('dragging');

    const svgLayer = document.getElementById('drag-arrow-layer');
    svgLayer.innerHTML = `
      <defs>
        <marker id="arrow-marker" markerWidth="15" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L15,6 L0,12 Z" fill="#ff9800" filter="url(#glow-orange)"/>
        </marker>
        <marker id="arrow-marker-hit" markerWidth="15" markerHeight="12" refX="12" refY="6" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L15,6 L0,12 Z" fill="#4caf50" filter="url(#glow-green)"/>
        </marker>
        <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    `;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.classList.add('arrow-line');
    line.style.stroke = '#ff9800';
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', startX);
    line.setAttribute('y2', startY);
    line.setAttribute('marker-end', 'url(#arrow-marker)');
    svgLayer.appendChild(line);

    this.dragState.line = line;

    this.boundMove = (e) => this.updateDragCharacter(e);
    this.boundUp = (e) => this.endDragCharacter(e);

    document.addEventListener('mousemove', this.boundMove);
    document.addEventListener('mouseup', this.boundUp);
  },

  updateDragCharacter(e) {
    if (!this.dragState || !this.dragState.active) return;

    const { line, startX, startY } = this.dragState;
    const endX = e.clientX;
    const endY = e.clientY;

    const dx = endX - startX;
    const dy = endY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) return;

    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);

    const target = document.elementFromPoint(e.clientX, e.clientY);
    const playerEl = target?.closest('.player');

    document.querySelectorAll('.player').forEach(p => p.classList.remove('drag-target'));

    if (playerEl) {
      const targetId = parseInt(playerEl.id.replace('player', ''));
      playerEl.classList.add('drag-target');
      line.classList.add('hit');
      line.setAttribute('marker-end', 'url(#arrow-marker-hit)');
      line.style.stroke = '#4caf50';
      this.dragState.currentTarget = targetId;
      return;
    }

    line.classList.remove('hit');
    line.setAttribute('marker-end', 'url(#arrow-marker)');
    line.style.stroke = '#ff9800';
    this.dragState.currentTarget = null;
  },

  endDragCharacter(e) {
    if (!this.dragState || !this.dragState.active) return;

    document.removeEventListener('mousemove', this.boundMove);
    document.removeEventListener('mouseup', this.boundUp);

    const svgLayer = document.getElementById('drag-arrow-layer');
    svgLayer.innerHTML = '';

    document.querySelectorAll('.player').forEach(p => p.classList.remove('drag-target'));

    if (this.dragState.cardEl) {
      this.dragState.cardEl.classList.remove('dragging');
    }

    const targetId = this.dragState.currentTarget;
    if (targetId) {
      const cardName = this.dragState.cardName;
      const cardIndex = this.dragState.cardIndex;

      const player = Game.getPlayer(this.dragState.playerId);
      player.hand.splice(cardIndex, 1);

      Game.equipCharacter(targetId, cardName);

      UI.updateHands();
      UI.updateDeckCount();

      Game.state.canActThisTurn = false;
      UI.updateTurnInfo();
      setTimeout(() => {
        Game.endTurn();
      }, 500);
    }

    this.dragState.active = false;
    this.dragState = null;
  },
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
