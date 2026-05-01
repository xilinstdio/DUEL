// 卡牌堆定义
const CARD_DECK = ['quantum', 'hall', 'combine', 'duel', 'rage', 'kill', 'dodge', 'peach_garden', 'barbarian', 'peach', 'draw_two', 'discard_other', 'steal'];

const CHARACTER_DECK = ['fang_juan'];

const CharacterDefinitions = {
  fang_juan: {
    id: 'fang_juan',
    name: '方卷',
    icon: '🎭',
    desc: '血量上限变为7，濒死时直接死亡',
    effects: {
      onEquip(player) {
        player.maxHealth = 7;
        player.hasDyingInstantDeath = true;
      },
      onUnequip(player) {
        player.maxHealth = 10;
        player.hasDyingInstantDeath = false;
      },
      modifyDying(player) {
        return 'instant_death';
      }
    }
  }
};

// 游戏核心逻辑
const Game = {
  // 游戏状态
  state: {
    players: [
      { id: 1, name: '玩家1', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null },
      { id: 2, name: '玩家2', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null },
      { id: 3, name: '玩家3', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null },
      { id: 4, name: '玩家4', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null }
    ],
    deck: [],
    discardPile: [],
    multiplier: 1,
    turn: 1,
    currentPlayer: 0,
    turnWinner: null,
    phase: 'roll',
    canActThisTurn: false,
    diceValues: [0, 0, 0, 0],
    isDueling: false,
    duelState: null,
    alivePlayers: [1, 2, 3, 4]
  },

  // 初始化牌堆
  initDeck() {
    this.state.deck = [];
    this.state.discardPile = [];
    for (let i = 0; i < 50; i++) {
      const card = CARD_DECK[Math.floor(Math.random() * CARD_DECK.length)];
      this.state.deck.push(card);
    }
    for (let i = 0; i < 4; i++) {
      const char = CHARACTER_DECK[Math.floor(Math.random() * CHARACTER_DECK.length)];
      this.state.deck.push(char);
    }
  },

  // 初始化游戏
  init() {
    this.initDeck();
    this.state = {
      players: [
        { id: 1, name: '玩家1', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null },
        { id: 2, name: '玩家2', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null },
        { id: 3, name: '玩家3', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null },
        { id: 4, name: '玩家4', health: 10, maxHealth: 10, dyingTurns: 0, dying: false, hand: [], dead: false, character: null }
      ],
      deck: this.state.deck,
      discardPile: [],
      multiplier: 1,
      turn: 1,
      currentPlayer: 0,
      turnWinner: null,
      phase: 'roll',
      canActThisTurn: false,
      diceValues: [0, 0, 0, 0],
      isDueling: false,
      duelState: null,
      alivePlayers: [1, 2, 3, 4]
    };
    UI.updateAll();
    Logger.log('游戏开始！4人大乱斗模式');
    this.startTurnRoll();
  },

  // 抽牌
  drawCard(playerId, count = 1, callback = null) {
    const player = this.getPlayer(playerId);
    const drawn = [];
    
    let drawIndex = 0;
    
    const drawOne = () => {
      if (drawIndex >= count) {
        if (callback) callback(drawn);
        return;
      }
      
      if (this.state.deck.length === 0) {
        if (this.state.discardPile.length > 0) {
          this.state.deck = this.shuffleArray([...this.state.discardPile]);
          this.state.discardPile = [];
          Logger.log('弃牌堆洗入牌库', 'effect');
        } else {
          this.initDeck();
        }
      }
      
      if (this.state.deck.length > 0) {
        const card = this.state.deck.pop();
        player.hand.push(card);
        drawn.push(card);
        drawIndex++;
        
        UI.animateDrawCard(playerId, card, () => {
          setTimeout(drawOne, 150);
        });
      } else {
        drawIndex++;
        drawOne();
      }
    };
    
    drawOne();
    
    return drawn;
  },

  // 洗牌算法(Game级别)
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  // 弃牌
  discardCard(playerId, cardIndex) {
    const player = this.getPlayer(playerId);
    if (cardIndex >= 0 && cardIndex < player.hand.length) {
      const discarded = player.hand.splice(cardIndex, 1)[0];
      this.state.discardPile.push(discarded);
      Logger.log(player.name + ' 弃置 ' + this.getCardName(discarded), 'effect');
      return discarded;
    }
    return null;
  },

  // 保持手牌上限3张
  maintainHandLimit(playerId) {
    const player = this.getPlayer(playerId);
    while (player.hand.length > 3) {
      this.discardCard(playerId, player.hand.length - 1);
    }
  },

  // 获取卡牌名称
  getCardName(card) {
    const names = {
      quantum: '量子力学',
      hall: '霍尔元件',
      combine: '自由组合',
      duel: '决斗',
      rage: '发怒',
      kill: '杀',
      dodge: '闪',
      peach_garden: '桃园结义',
      barbarian: '南蛮入侵',
      peach: '桃',
      draw_two: '无中生有',
      discard_other: '过河拆桥',
      steal: '顺手牵羊',
      fang_juan: '方卷'
    };
    return names[card] || card;
  },

  // 获取当前玩家
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayer];
  },

  // 获取对手（4人大乱斗模式，返回所有其他存活玩家）
  getOpponents() {
    return this.state.alivePlayers
      .filter(id => id !== this.state.turnWinner)
      .map(id => this.getPlayer(id));
  },

  // 获取指定玩家的对手（用于卡牌效果）
  getOpponent(playerId) {
    return this.state.players.find(p => p.id !== playerId && !p.dead);
  },

  // 获取玩家
  getPlayer(id) {
    return this.state.players[id - 1];
  },

  // 设置血量（处理炸血和濒死）
  setHealth(playerId, newHealth, source) {
    const player = this.getPlayer(playerId);

    if (newHealth >= 11) {
      Logger.log(player.name + ' 炸血！血量归0', 'damage');
      newHealth = 0;
    }

    newHealth = Math.max(0, Math.min(player.maxHealth, newHealth));

    const oldHealth = player.health;
    player.health = newHealth;

    UI.animateHealthChange(playerId, oldHealth, newHealth);

    if (newHealth > oldHealth) {
      Logger.log(player.name + ' 回复 ' + (newHealth - oldHealth) + ' 血量', 'heal');
    } else if (newHealth < oldHealth) {
      Logger.log(player.name + ' 受到 ' + (oldHealth - newHealth) + ' 伤害', 'damage');
    }

    if (player.health === 0 && oldHealth > 0) {
      if (player.character === 'fang_juan') {
        Logger.log(player.name + ' 装备了【方卷】，濒死时直接死亡！', 'damage');
        player.dead = true;
        UI.animateDying(playerId);
      } else if (!player.dying || player.dyingTurns === 0) {
        player.dying = true;
        player.dyingTurns = 0;
        Logger.log(player.name + ' 进入濒死状态！', 'damage');
        UI.animateDying(playerId);
      }
    }

    if (player.health > 0 && oldHealth === 0) {
      player.dying = false;
      player.dyingTurns = 0;
      Logger.log(player.name + ' 脱离濒死状态');
    }

    this.checkDeath();

    UI.updateHealth(playerId);
  },

  // 回合结束时检查濒死状态（4人大乱斗模式）
  checkDyingAtTurnEnd() {
    this.state.players.forEach(player => {
      if (player.health === 0 && !player.dead && player.dying) {
        player.dyingTurns++;
        if (player.dyingTurns >= 2) {
          Logger.log(player.name + ' 死亡！连续2回合濒死', 'damage');
          player.dead = true;
          // 从存活列表中移除
          const index = this.state.alivePlayers.indexOf(player.id);
          if (index > -1) {
            this.state.alivePlayers.splice(index, 1);
          }
        } else {
          Logger.log(player.name + ' 第' + player.dyingTurns + '回合濒死...', 'damage');
        }
        UI.updateStatus(player.id);
      }
    });
  },

  // 处理濒死
  handleDying(playerId) {
    UI.updateStatus(playerId);
  },

  // 检查死亡（4人大乱斗模式）
  checkDeath() {
    // 更新存活玩家列表
    this.state.alivePlayers = this.state.players
      .filter(p => !p.dead)
      .map(p => p.id);

    const aliveCount = this.state.alivePlayers.length;

    if (aliveCount <= 1) {
      const winner = this.state.players.find(p => !p.dead);
      if (winner) {
        Logger.log('游戏结束！' + winner.name + ' 获胜！', 'effect');
        this.disableAllCards();
        UI.showGameOverModal(winner.name);
      }
    }
  },

  // 修改倍率
  setMultiplier(value) {
    this.state.multiplier = value;
    Logger.log('游戏倍率变为 ' + value, 'effect');
    UI.updateMultiplier();
  },

  // 开始回合骰子（4人大乱斗模式：第一个回合随机选择）
  startTurnRoll() {
    this.state.phase = 'roll';
    this.state.canActThisTurn = false;
    UI.updateTurn();
    
    // 4人大乱斗模式：第一个回合随机选择一个玩家开始
    if (this.state.turn === 1) {
      const randomIndex = Math.floor(Math.random() * this.state.alivePlayers.length);
      const firstPlayerId = this.state.alivePlayers[randomIndex];
      Logger.log('随机决定第一个回合：' + this.getPlayer(firstPlayerId).name, 'effect');
      this.startTurnForPlayer(firstPlayerId);
    }
  },

  // 开始指定玩家的回合（4人大乱斗模式）
  startTurnForPlayer(playerId) {
    this.state.currentPlayer = playerId - 1;
    this.state.turnWinner = playerId;
    this.state.phase = 'draw';
    this.state.canActThisTurn = false;
    UI.updateTurn();
    Logger.log('回合 ' + this.state.turn + ' - ' + this.getPlayer(playerId).name + ' 的回合', 'effect');
    this.startDrawPhase();
  },

  // 开始下一个存活玩家的回合
  startNextTurn() {
    const alivePlayers = this.state.alivePlayers;
    if (alivePlayers.length <= 1) return;

    const currentId = this.state.turnWinner;
    const currentIndex = alivePlayers.indexOf(currentId);
    const nextIndex = (currentIndex + 1) % alivePlayers.length;
    const nextPlayerId = alivePlayers[nextIndex];

    this.state.turn++;
    this.startTurnForPlayer(nextPlayerId);
  },

  // 抽牌阶段
  startDrawPhase() {
    this.state.phase = 'draw';
    const player = this.getCurrentPlayer();
    
    Logger.log(player.name + ' 开始抽牌...', 'effect');
    
    this.drawCard(player.id, 3, (drawn) => {
      this.maintainHandLimit(player.id);
      
      const handNames = player.hand.map(c => this.getCardName(c)).join(', ');
      Logger.log(player.name + ' 手牌: [' + handNames + ']', 'effect');
      
      this.state.phase = 'action';
      this.state.canActThisTurn = true;
      
      UI.updateHands();
      UI.updateTurnInfo();
      UI.updateDeckCount();
      Logger.log(player.name + ' 的回合 - 请使用一张手牌！', 'effect');
    });
  },

  // 使用手牌
  useHandCard(cardIndex) {
    if (!this.state.canActThisTurn) {
      Logger.log('现在不能使用卡牌', 'damage');
      return { success: false };
    }
    
    const player = this.getCurrentPlayer();
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      Logger.log('无效的手牌', 'damage');
      return { success: false };
    }
    
    const cardName = player.hand[cardIndex];
    Logger.log(player.name + ' 使用 ' + this.getCardName(cardName), 'effect');
    
    const usedCard = player.hand.splice(cardIndex, 1)[0];
    this.state.discardPile.push(usedCard);
    
    UI.updateHands();
    UI.updateDeckCount();
    
    return CardHandler.useCard(cardName, null, player.id);
  },

  // 结束回合（4人大乱斗模式）
  endTurn() {
    this.checkDyingAtTurnEnd();
    if (this.checkGameOver()) return;

    this.state.canActThisTurn = false;
    Logger.log('回合结束！', 'effect');

    // 进入下一个存活玩家的回合
    this.startNextTurn();
  },

  // 检查游戏是否结束
  checkGameOver() {
    const alivePlayers = this.state.alivePlayers;
    if (alivePlayers.length <= 1) {
      const winner = this.state.players.find(p => !p.dead);
      if (winner) {
        Logger.log('游戏结束！' + winner.name + ' 获胜！', 'effect');
        this.disableAllCards();
        UI.showGameOverModal(winner.name);
        return true;
      }
    }
    return false;
  },

  // 禁用所有卡牌
  disableAllCards() {
    document.querySelectorAll('.card').forEach(btn => btn.disabled = true);
    this.state.canActThisTurn = false;
  },

  // 装备角色牌
  equipCharacter(playerId, characterId) {
    const player = this.getPlayer(playerId);
    
    if (player.character) {
      const oldChar = CharacterDefinitions[player.character];
      if (oldChar && oldChar.effects.onUnequip) {
        oldChar.effects.onUnequip(player);
      }
    }
    
    const newChar = CharacterDefinitions[characterId];
    if (!newChar) return;
    
    player.character = characterId;
    
    if (newChar.effects.onEquip) {
      newChar.effects.onEquip(player);
    }
    
    Logger.log(player.name + ' 装备角色牌【' + newChar.name + '】', 'effect');
    UI.updateCharacter(playerId);
    UI.updateHealth(playerId);
    
    if (newChar.id === 'fang_juan' && player.health > 7) {
      player.health = 7;
      Logger.log(player.name + ' 血量上限变为7，当前血量调整为7', 'effect');
      UI.updateHealth(playerId);
    }
  },

  // 获取角色名称
  getCharacterName(characterId) {
    if (!characterId) return '';
    return CharacterDefinitions[characterId]?.name || '';
  },

  // 获取角色图标
  getCharacterIcon(characterId) {
    if (!characterId) return '';
    return CharacterDefinitions[characterId]?.icon || '';
  }
};

// 日志系统
const Logger = {
  log(message, type = 'normal') {
    console.log('[' + type + '] ' + message);
    const logContent = document.getElementById('log-content');
    if (!logContent) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const time = new Date().toLocaleTimeString();

    let msgClass = '';
    if (type === 'damage') msgClass = 'damage';
    else if (type === 'heal') msgClass = 'heal';
    else if (type === 'effect') msgClass = 'effect';

    entry.innerHTML = '<span class="time">[' + time + ']</span><span class="' + msgClass + '">' + message + '</span>';

    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
  }
};
