// 卡牌效果系统

const Effects = {
  // 生成0-10的随机数
  randomHealth() {
    return Math.floor(Math.random() * 11);
  },

  // 量子力学：随机血量
  quantum(targetId, userId) {
    if (targetId === null) targetId = userId === 1 ? 2 : 1;
    
    const target = Game.getPlayer(targetId);
    const newHealth = this.randomHealth();

    Logger.log(`量子力学发动！${target.name} 血量变为 ${newHealth}`, 'effect');
    Game.setHealth(target.id, newHealth, 'quantum');

    return { success: true, result: `目标: ${target.name}, 新血量: ${newHealth}` };
  },

  // 霍尔元件：血量重新分配
  hall(targetId, userId) {
    if (targetId === null) targetId = userId === 1 ? 2 : 1;
    
    const self = Game.getPlayer(userId);
    const target = Game.getPlayer(targetId);

    const selfHealth = self.health;
    const targetHealth = target.health;
    const total = selfHealth + targetHealth;

    const isSelfGets5 = Math.random() < 0.5;

    let selfNew, targetNew;
    if (isSelfGets5) {
      selfNew = 5;
      targetNew = total - 5;
    } else {
      selfNew = total - 5;
      targetNew = 5;
    }

    Logger.log(`霍尔元件发动！和值: ${total}`, 'effect');
    Logger.log(`${self.name} 获得 ${selfNew} 血量`, isSelfGets5 ? 'heal' : 'damage');
    Logger.log(`${target.name} 获得 ${targetNew} 血量`, isSelfGets5 ? 'damage' : 'heal');

    Game.setHealth(self.id, selfNew, 'hall');
    Game.setHealth(target.id, targetNew, 'hall');

    return { success: true };
  },

  // 自由组合：随机打乱血量
  combine() {
    const originalHealths = Game.state.players.map(p => p.health);

    const shuffled = this.shuffleArray([...originalHealths]);

    Logger.log(`自由组合发动！原始血量: [${originalHealths.join(', ')}]`, 'effect');

    Game.state.players.forEach((player, index) => {
      const newHealth = shuffled[index];
      Game.setHealth(player.id, newHealth, 'combine');
    });

    const newHealths = Game.state.players.map(p => p.health);
    Logger.log(`新血量分配: [${newHealths.join(', ')}]`, 'effect');

    return { success: true };
  },

  // 洗牌算法
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  },

  // 决斗准备
  duel(targetId, userId) {
    if (targetId === null) targetId = userId === 1 ? 2 : 1;
    
    const initiator = Game.getPlayer(userId);
    const opponent = Game.getPlayer(targetId);

    if (initiator.dead || opponent.dead) {
      Logger.log('无法与已死亡玩家决斗', 'damage');
      return { success: false };
    }

    Game.state.isDueling = true;
    Game.state.duelState = {
      initiator: initiator.id,
      opponent: opponent.id,
      multiplier: Game.state.multiplier,
      firstRound: true,
      initiatorWins: 0,
      opponentWins: 0
    };

    Logger.log(`${initiator.name} 向 ${opponent.name} 发起决斗！`, 'effect');
    Logger.log(`赌注: ${Game.state.multiplier} 血量`, 'effect');

    UI.showRPSModal();
  },

  // 石头剪刀布结果处理
  processRPS(choice) {
    const duel = Game.state.duelState;
    const choices = ['rock', 'scissors', 'paper'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];

    const result = this.getRPSResult(choice, computerChoice);

    Logger.log(`你出: ${this.getChoiceName(choice)} | 对手出: ${this.getChoiceName(computerChoice)}`, 'effect');

    if (result === 'win') {
      duel.initiatorWins++;
      Logger.log('你赢了这一局！', 'heal');
    } else if (result === 'lose') {
      duel.opponentWins++;
      Logger.log('你输了这一局', 'damage');
    } else {
      Logger.log('平局！重新选择', 'effect');
      UI.showRPSModal();
      return;
    }

    if (duel.firstRound) {
      if (result === 'win') {
        this.endDuel(duel.initiator, duel.opponent, true);
        return;
      } else if (result === 'lose') {
        duel.firstRound = false;
        Logger.log('进入连续胜利模式！先赢2局者获胜', 'effect');
        UI.showRPSModal();
        return;
      }
    } else {
      if (duel.initiatorWins >= 2) {
        this.endDuel(duel.initiator, duel.opponent, true);
        return;
      } else if (duel.opponentWins >= 2) {
        this.endDuel(duel.opponent, duel.initiator, false);
        return;
      }
      UI.showRPSModal();
    }
  },

  // 获取石头剪刀布结果
  getRPSResult(player, computer) {
    if (player === computer) return 'draw';
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'scissors' && computer === 'paper') ||
      (player === 'paper' && computer === 'rock')
    ) {
      return 'win';
    }
    return 'lose';
  },

  // 石头剪刀布名称
  getChoiceName(choice) {
    const names = { rock: '石头', scissors: '剪刀', paper: '布' };
    return names[choice];
  },

  // 结束决斗
  endDuel(winnerId, loserId, initiatorWon) {
    const duel = Game.state.duelState;
    const loser = Game.getPlayer(loserId);
    const damage = duel.multiplier;

    Logger.log(`${Game.getPlayer(winnerId).name} 赢得决斗！`, 'effect');
    Logger.log(`${loser.name} 扣除 ${damage} 血量`, 'damage');

    Game.setHealth(loserId, loser.health - damage, 'duel');

    Game.setMultiplier(1);

    Game.state.isDueling = false;
    Game.state.duelState = null;

    UI.hideRPSModal();
    
    setTimeout(() => {
      Game.endTurn();
    }, 500);
  },

  // 发怒：倍率翻倍
  rage() {
    const newMultiplier = Game.state.multiplier * 2;
    Game.setMultiplier(newMultiplier);
    Logger.log(`发怒！倍率提升至 ${newMultiplier}！`, 'effect');
    return { success: true };
  },

  // 杀：指定玩家扣1点血，目标可以出闪避
  kill(targetId, userId) {
    const attacker = Game.getPlayer(userId);
    const target = Game.getPlayer(targetId);

    if (target.dead) {
      Logger.log('无法对已死亡玩家出杀', 'damage');
      return { success: false };
    }

    Logger.log(`${attacker.name} 对 ${target.name} 出【杀】！`, 'effect');

    // 检查目标是否有闪，有则询问是否使用
    const targetPlayer = Game.getPlayer(targetId);
    const dodgeIndex = targetPlayer.hand.indexOf('dodge');
    if (dodgeIndex !== -1) {
      UI.showDodgeModal(targetId, dodgeIndex);
      return { success: false }; // 等待用户选择
    }

    Game.setHealth(targetId, target.health - 1, 'kill');
    Logger.log(`${target.name} 无【闪】，扣除1点血量`, 'damage');
    return { success: true };
  },

  // 闪避成功后的处理
  killAfterDodge(attackerId, targetId) {
    Logger.log(`${Game.getPlayer(targetId).name} 使用【闪】，躲开了杀！`, 'heal');
    return { success: true };
  },

  // 闪：作为普通卡牌打出（无效果，仅用于消耗）
  dodge(userId) {
    const player = Game.getPlayer(userId);
    Logger.log(`${player.name} 打出【闪】`, 'effect');
    return { success: true };
  },

  // 桃园结义：全场血量+1
  peachGarden() {
    Logger.log('桃园结义发动！全场玩家血量+1', 'heal');
    Game.state.players.forEach(player => {
      if (!player.dead && player.health < player.maxHealth) {
        Game.setHealth(player.id, player.health + 1, 'peach_garden');
      }
    });
    return { success: true };
  },

  // 南蛮入侵：全场血量-1
  barbarian() {
    Logger.log('南蛮入侵发动！全场玩家血量-1', 'damage');
    Game.state.players.forEach(player => {
      if (!player.dead) {
        Game.setHealth(player.id, player.health - 1, 'barbarian');
      }
    });
    return { success: true };
  },

  // 桃：自己血量+1
  peach(userId) {
    const player = Game.getPlayer(userId);
    if (player.health >= player.maxHealth) {
      Logger.log(`${player.name} 已满血，无法使用桃`, 'effect');
      return { success: false };
    }
    Logger.log(`${player.name} 使用【桃】，回复1点血量`, 'heal');
    Game.setHealth(player.id, player.health + 1, 'peach');
    return { success: true };
  },

  // 无中生有：抽2张牌
  drawTwo(userId) {
    const player = Game.getPlayer(userId);
    Logger.log(`${player.name} 使用【无中生有】，抽2张牌`, 'effect');
    Game.drawCard(player.id, 2);
    return { success: true };
  },

  // 过河拆桥：目标对手随机弃1张牌
  discardOther(targetId, userId) {
    const target = Game.getPlayer(targetId);
    const player = Game.getPlayer(userId);

    if (target.dead) {
      Logger.log('无法对死亡玩家使用过河拆桥', 'damage');
      return { success: false };
    }

    if (target.hand.length === 0) {
      Logger.log(`${target.name} 没有手牌可弃`, 'effect');
      return { success: false };
    }

    const randomIndex = Math.floor(Math.random() * target.hand.length);
    const discarded = target.hand.splice(randomIndex, 1)[0];
    Game.state.discardPile.push(discarded);
    Logger.log(`${player.name} 对 ${target.name} 使用【过河拆桥】`, 'effect');
    Logger.log(`${target.name} 随机弃置 ${Game.getCardName(discarded)}`, 'damage');
    return { success: true };
  },

  // 顺手牵羊：获得目标对手1张手牌
  steal(targetId, userId) {
    const target = Game.getPlayer(targetId);
    const player = Game.getPlayer(userId);

    if (target.dead) {
      Logger.log('无法对死亡玩家使用顺手牵羊', 'damage');
      return { success: false };
    }

    if (target.hand.length === 0) {
      Logger.log(`${target.name} 没有手牌可偷`, 'effect');
      return { success: false };
    }

    const randomIndex = Math.floor(Math.random() * target.hand.length);
    const stolen = target.hand.splice(randomIndex, 1)[0];
    player.hand.push(stolen);
    Logger.log(`${player.name} 对 ${target.name} 使用【顺手牵羊】`, 'effect');
    Logger.log(`${player.name} 获得 ${Game.getCardName(stolen)}`, 'heal');
    return { success: true };
  }
};

// 卡牌处理器
const CardHandler = {
  // 使用卡牌（仅无目标卡牌）
  useCard(cardName, targetId, userId) {
    switch (cardName) {
      case 'combine':
        Effects.combine();
        break;
      case 'rage':
        Effects.rage();
        break;
      case 'peach_garden':
        Effects.peachGarden();
        break;
      case 'barbarian':
        Effects.barbarian();
        break;
      case 'peach':
        Effects.peach(userId);
        break;
      case 'draw_two':
        Effects.drawTwo(userId);
        break;
      case 'dodge':
        Effects.dodge(userId);
        break;
    }
    this.afterCardUse();
  },
  
  // 使用目标卡牌后调用
  useCardWithTarget(cardName, targetId, userId) {
    let interrupted = false;
    switch (cardName) {
      case 'quantum':
        Effects.quantum(targetId, userId);
        break;
      case 'hall':
        Effects.hall(targetId, userId);
        break;
      case 'duel':
        Effects.duel(targetId, userId);
        interrupted = Game.state.isDueling;
        break;
      case 'kill':
        const result = Effects.kill(targetId, userId);
        interrupted = !result.success;
        break;
      case 'discard_other':
        Effects.discardOther(targetId, userId);
        break;
      case 'steal':
        Effects.steal(targetId, userId);
        break;
    }
    if (!interrupted) {
      this.afterCardUse();
    }
  },
  
  // 使用卡牌后
  afterCardUse() {
    Game.state.canActThisTurn = false;
    UI.updateTurnInfo();
    Logger.log('回合结束！', 'effect');
    setTimeout(() => {
      Game.endTurn();
    }, 500);
  }
};

// 卡牌编辑器数据
const CardEditor = {
  // 卡牌配置数据
  cardDefinitions: {
    quantum: {
      name: '量子力学',
      type: 'spell',
      target: '指定玩家',
      desc: '50%概率目标血量变为0-10随机值，50%概率自己血量变为0-10随机值',
      params: [
        { key: 'health-min', label: '最小血量', value: 0, min: 0, max: 10 },
        { key: 'health-max', label: '最大血量', value: 10, min: 0, max: 10 }
      ]
    },
    hall: {
      name: '霍尔元件',
      type: 'spell',
      target: '指定玩家',
      desc: '计算双方血量和X，50%概率自己得5/对手得X-5，50%概率反之',
      params: [
        { key: 'fixed-value', label: '固定分配值', value: 5, min: 0, max: 10 }
      ]
    },
    combine: {
      name: '自由组合',
      type: 'spell',
      target: '全场',
      desc: '记录全场血量，随机打乱重新分配',
      params: []
    },
    duel: {
      name: '决斗',
      type: 'spell',
      target: '指定玩家',
      desc: '发起石头剪刀布对决，首局胜则胜，首局负则改为三局两胜',
      params: []
    },
    rage: {
      name: '发怒',
      type: 'spell',
      target: '无',
      desc: '游戏倍率×2，可无限累加',
      params: [
        { key: 'multiplier', label: '倍率倍数', value: 2, min: 1, max: 10 }
      ]
    },
    kill: {
      name: '杀',
      type: 'spell',
      target: '指定玩家',
      desc: '扣除指定玩家1点血量，目标可使用【闪】闪避',
      params: [
        { key: 'damage', label: '伤害值', value: 1, min: 1, max: 5 }
      ]
    },
    peach_garden: {
      name: '桃园结义',
      type: 'spell',
      target: '全场',
      desc: '在场所有玩家的血量加1',
      params: []
    },
    barbarian: {
      name: '南蛮入侵',
      type: 'spell',
      target: '全场',
      desc: '在场所有玩家血量减1',
      params: []
    },
    peach: {
      name: '桃',
      type: 'spell',
      target: '自己',
      desc: '使自己的血量加1',
      params: [
        { key: 'heal', label: '回复值', value: 1, min: 1, max: 5 }
      ]
    },
    dodge: {
      name: '闪',
      type: 'response',
      target: '无',
      desc: '用于闪避【杀】的效果',
      params: []
    },
    draw_two: {
      name: '无中生有',
      type: 'spell',
      target: '无',
      desc: '抽2张牌',
      params: []
    },
    discard_other: {
      name: '过河拆桥',
      type: 'spell',
      target: '指定玩家',
      desc: '目标对手随机弃1张手牌',
      params: []
    },
    steal: {
      name: '顺手牵羊',
      type: 'spell',
      target: '指定玩家',
      desc: '获得目标对手1张手牌',
      params: []
    },
    fang_juan: {
      name: '方卷',
      type: 'character',
      target: '任意玩家',
      desc: '装备后血量上限变为7，濒死时直接死亡',
      params: [
        { key: 'max-health', label: '血量上限', value: 7, min: 3, max: 10 }
      ]
    }
  },

  // 获取卡牌数据
  getCardData(cardId) {
    return this.cardDefinitions[cardId] || null;
  },

  // 应用配置
  applyConfig(cardId, params) {
    switch (cardId) {
      case 'quantum':
        this.applyQuantumConfig(params);
        break;
      case 'hall':
        this.applyHallConfig(params);
        break;
      case 'rage':
        this.applyRageConfig(params);
        break;
    }
  },

  // 应用量子力学配置
  applyQuantumConfig(params) {
    const min = params['health-min'] || 0;
    const max = params['health-max'] || 10;
    
    Effects.randomHealth = function() {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    UI.logEditor(`量子力学: 血量范围 [${min}-${max}]`);
  },

  // 应用霍尔元件配置
  applyHallConfig(params) {
    const fixedValue = params['fixed-value'] || 5;
    
    const originalHall = Effects.hall;
    Effects.hall = function(targetId, userId) {
      if (targetId === null) targetId = userId === 1 ? 2 : 1;
      
      const self = Game.getPlayer(userId);
      const target = Game.getPlayer(targetId);
      const total = self.health + target.health;
      const isSelfGetsFixed = Math.random() < 0.5;
      
      const selfNew = isSelfGetsFixed ? fixedValue : total - fixedValue;
      const targetNew = isSelfGetsFixed ? total - fixedValue : fixedValue;
      
      Logger.log(`霍尔元件发动！和值: ${total}, 分配值: ${fixedValue}`, 'effect');
      Logger.log(`${self.name} 获得 ${selfNew} 血量`, isSelfGetsFixed ? 'heal' : 'damage');
      Logger.log(`${target.name} 获得 ${targetNew} 血量`, isSelfGetsFixed ? 'damage' : 'heal');
      
      Game.setHealth(self.id, selfNew, 'hall');
      Game.setHealth(target.id, targetNew, 'hall');
      
      return { success: true };
    };
    
    UI.logEditor(`霍尔元件: 固定分配值 ${fixedValue}`);
  },

  // 应用发怒配置
  applyRageConfig(params) {
    const multiplier = params['multiplier'] || 2;
    
    Effects.rage = function() {
      const newMultiplier = Game.state.multiplier * multiplier;
      Game.setMultiplier(newMultiplier);
      Logger.log(`发怒！倍率提升至 ${newMultiplier}！`, 'effect');
      return { success: true };
    };
    
    UI.logEditor(`发怒: 倍率倍数 ${multiplier}`);
  }
};