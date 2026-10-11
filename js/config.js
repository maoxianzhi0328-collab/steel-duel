/**
 * 游戏配置模块
 * 包含所有游戏配置数据
 */

// ==================== 机甲数据配置 ====================
const MECHA_DATA = {
    ironwall: {
        name: '铁壁',
        maxHealth: 120,
        attack: 10,
        speed: 2.5,
        dashSpeed: 5,
        defenseReduction: 0.7,
        attackRange: 60,
        color: '#4488ff',
        accentColor: '#2266cc',
        skillName: '铁山靠',
        skillDamage: 20,
        skillCooldown: 8,
        skillRange: 80,
        passiveName: '钢铁意志',
        passiveDesc: '防御时减伤70%，持续3秒',
        description: '高血量、高防御的重装型机甲'
    },
    shadow: {
        name: '影刺',
        maxHealth: 80,
        attack: 6,
        speed: 4,
        dashSpeed: 7,
        defenseReduction: 0.3,
        attackRange: 120,
        color: '#ff4488',
        accentColor: '#cc2266',
        skillName: '影刃风暴',
        skillDamage: 14,
        skillCooldown: 6,
        skillRange: 350,
        passiveName: '疾风步',
        passiveDesc: '移动速度+冲刺优化',
        description: '高速度、高机动的刺客型机甲'
    },
    mage: {
        name: '法师',
        maxHealth: 100,
        attack: 8,
        speed: 3.0,
        dashSpeed: 6,
        defenseReduction: 0.5,
        attackRange: 90,
        color: '#aa44ff',
        accentColor: '#8822cc',
        skillName: '魔法轰炸',
        skillDamage: 15,
        skillCooldown: 7,
        skillRange: 120,
        skillAOERadius: 70,
        passiveName: '魔力护盾',
        passiveDesc: '防御时减伤50%，持续3秒',
        description: '平衡型机甲，拥有AOE魔法技能'
    },
    archer: {
        name: '射手',
        maxHealth: 95,
        attack: 4,
        speed: 3.5,
        dashSpeed: 6.5,
        defenseReduction: 0.4,
        attackRange: 120,
        color: '#44cc44',
        accentColor: '#228822',
        skillName: '穿心箭',
        skillDamage: 10,
        skillCooldown: 5,
        skillRange: 250,
        skillStunDuration: 1.0,
        passiveName: '闪避本能',
        passiveDesc: '防御时减伤40%，持续3秒',
        description: '远程型机甲，技能可眩晕敌人'
    },
    
    // ==================== AI系列角色 ====================
    programmer: {
        name: '程序员',
        maxHealth: 90,
        attack: 5,
        speed: 3.0,
        dashSpeed: 6,
        defenseReduction: 0.45,
        attackRange: 150,
        attackInterval: 0.5,  // 攻击频率最快
        color: '#00ff88',
        accentColor: '#00cc66',
        skillName: 'Bug注入',
        skillDamage: 12,
        skillCooldown: 6,
        skillCost: 30,  // 技能能量消耗（技能文案）
        skillRange: 200,
        skillEffect: 'slowAttack',  // 降低攻速30%
        skillEffectDuration: 2,
        skillEffectValue: 0.3,
        passiveName: '算法优化',
        passiveDesc: '能量恢复+3/秒，技能冷却-15%',
        passiveEnergyRegen: 3,
        passiveCooldownReduction: 0.15,
        description: '代码型AI机甲，攻击频率最快'
    },
    ui_designer: {
        name: 'UI设计师',
        maxHealth: 105,
        attack: 7,
        speed: 3.5,
        dashSpeed: 6.5,
        defenseReduction: 0.5,
        attackRange: 100,
        color: '#ff88ff',
        accentColor: '#cc66cc',
        skillName: '色彩混淆',
        skillDamage: 15,
        skillCooldown: 7,
        skillCost: 30,  // 技能能量消耗（技能文案）
        skillRange: 180,
        skillEffect: 'visionReduce',  // 视野缩小50%
        skillEffectDuration: 3,
        skillEffectValue: 0.5,
        passiveName: '视觉暴击',
        passiveDesc: '25%暴击率，150%暴击伤害',
        passiveCritRate: 0.25,
        passiveCritDamage: 1.5,
        description: '视觉型AI机甲，唯一暴击机制'
    },
    product_manager: {
        name: '产品经理',
        maxHealth: 110,
        attack: 6,
        speed: 3.0,
        dashSpeed: 6,
        defenseReduction: 0.55,
        attackRange: 110,
        color: '#4488ff',
        accentColor: '#2266cc',
        skillName: '需求变更',
        skillDamage: 10,
        skillCooldown: 10,
        skillCost: 40,  // 技能能量消耗（技能文案）
        skillRange: 800,  // 全地图
        skillEffect: 'resetCooldown',  // 重置敌方技能冷却
        passiveName: '迭代优化',
        passiveDesc: '每次攻击伤害+1HP，最多+10HP',
        passiveDamageStack: 1,
        passiveMaxStack: 10,
        description: '数据型AI机甲，唯一重置冷却技能'
    },
    boss: {
        name: '老板',
        maxHealth: 115,
        attack: 8,
        speed: 3.0,
        dashSpeed: 6,
        defenseReduction: 0.6,
        attackRange: 100,
        color: '#ffcc00',
        accentColor: '#cc9900',
        skillName: '资源调配',
        skillDamage: 18,
        skillCooldown: 9,
        skillCost: 35,  // 技能能量消耗（技能文案）
        skillRange: 150,
        skillEffect: 'stealEnergy',  // 偷取能量
        skillStealAmount: 10,
        passiveName: '投资回报',
        passiveDesc: '30%双倍伤害，30%眩晕1秒',
        passiveInvestment: 10,
        passiveDoubleDamage: 0.3,
        passiveStunChance: 0.3,
        description: '资本型AI机甲，唯一偷取能量'
    }
};

// ==================== 按键映射配置 ====================
const KEY_MAPPING = {
    player1: {
        up: 'KeyW',
        down: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        attack: 'KeyJ',
        defense: 'KeyK',
        skill: 'KeyL',
        petSkill: 'KeyI',
        dash: ['ShiftLeft', 'ShiftRight']
    },
    player2: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        attack: 'Comma',        // < 键
        defense: 'Period',      // > 键
        skill: 'Slash',         // ? 键
        petSkill: 'Quote',      // ' 键
        dash: 'Enter',
        // 备用按键（兼容小键盘）
        attackAlt: 'Numpad1',
        defenseAlt: 'Numpad2',
        skillAlt: 'Numpad3'
    }
};

// ==================== 游戏设置 ====================
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    game: {
        duration: 90,  // 游戏时长（秒）
        energyRegenRate: 3,  // 能量恢复速度
        maxEnergy: 100,
        defenseCost: 5,  // 防御每秒消耗能量
        dashCost: 10,  // 冲刺消耗能量
        skillCost: 30  // 技能消耗能量
    },
    physics: {
        invincibleTime: 3,  // 受伤后无敌时间
        dashDuration: 0.2,  // 冲刺持续时间
        dashCooldown: 1,  // 冲刺冷却
        defenseMaxTime: 3  // 最大防御时间
    }
};

// ==================== 音效频率配置 ====================
const AUDIO_CONFIG = {
    attack: { freq: 400, duration: 0.1 },
    hit: { freq: 200, duration: 0.15, type: 'sawtooth' },
    skill: { freq: 500, duration: 0.1 },
    dash: { freq: 800, duration: 0.05, type: 'sine' },
    defense: { freq: 300, duration: 0.1, type: 'sine' }
};

// ==================== 粒子配置 ====================
const PARTICLE_CONFIG = {
    hit: {
        count: 12,
        speed: 250,
        life: 0.5,
        color: '#ffcc00'
    },
    magic: {
        outerRing: 32,
        innerRing: 24,
        center: 16,
        vertical: 10,
        colors: ['#aa44ff', '#8822cc', '#ff44aa', '#44aaff', '#ffaa44', '#44ffaa']
    }
};

// ==================== 宠物数据配置 ====================
const PET_DATA = {
    steel_guardian: {
        name: '钢铁卫士',
        owner: 'ironwall',
        health: 30,
        skillName: '重力力场',
        skillCooldown: 10,
        skillRange: 100,      // 力场半径（像素），敌方进入后被禁锢
        skillDuration: 3,     // 力场持续时间（秒）
        passiveName: '铁壁守护',
        passiveEffect: { damageReduction: 0.1 },
        passiveRange: 80,
        color: '#4488ff',
        description: '铁壁专属宠物，展开重力力场限制敌方走位'
    },
    shadow_spirit: {
        name: '暗影精灵',
        owner: 'shadow',
        health: 25,
        skillName: '影刃穿梭',
        skillCooldown: 10,
        untargetableDuration: 1.5, // 无法选中持续时间（秒）
        damagePercent: 0.1,        // 对普通角色造成当前生命值10%伤害
        ironwallDamagePercent: 0.07, // 对铁壁造成当前生命值7%伤害
        markDuration: 5,           // 穿梭后残影标记持续时间（仅视觉/扩展用）
        markDamage: 4,
        passiveName: '影之共鸣',
        passiveEffect: { dashSpeedBonus: 0.15 },
        color: '#ff4488',
        description: '影刺专属宠物，瞬移突袭且无法被选中'
    },
    magic_fairy: {
        name: '魔法小精灵',
        owner: 'mage',
        health: 25,
        skillName: '魔法护罩',
        skillCooldown: 10,
        skillRange: 40,        // 护罩半径（像素）
        skillDuration: 2,      // 护罩持续时间（秒）
        shieldReduction: 0.8,  // 主人免伤80%
        passiveName: '魔力源泉',
        passiveEffect: { energyRegenBonus: 0.2 },
        passiveRange: 100,
        color: '#aa44ff',
        description: '法师专属宠物，魔法护罩提供短时绝对防御'
    },
    hunter_falcon: {
        name: '猎鹰',
        owner: 'archer',
        health: 25,
        skillName: '猎鹰庇护',
        skillCooldown: 10,
        invincibleDuration: 1.5, // 主人无敌持续时间（秒）
        passiveName: '鹰眼视野',
        passiveEffect: { attackRangeBonus: 0.15 },
        color: '#44cc44',
        description: '射手专属宠物，无敌庇护保命并提供输出窗口'
    },
    
    // ==================== AI系列宠物 ====================
    codebot: {
        name: 'CodeBot',
        owner: 'programmer',
        health: 25,
        skillName: '自动补全',
        skillCooldown: 8,
        skillEffect: 'autoAttack',  // 30%概率追加攻击
        skillChance: 0.3,
        passiveName: '代码优化',
        passiveEffect: { energyRegenBonus: 0.1 },
        color: '#00ff88',
        description: '程序员专属AI宠物，自动辅助攻击'
    },
    pixelpixa: {
        name: 'PixelPixa',
        owner: 'ui_designer',
        health: 30,
        skillName: '像素护盾',
        skillCooldown: 12,
        skillEffect: 'shield',  // 创造护盾抵挡1次攻击
        skillShieldHP: 15,
        skillDuration: 5,
        passiveName: '视觉增强',
        passiveEffect: { critRateBonus: 0.05 },
        color: '#ff88ff',
        description: 'UI设计师专属宠物，提供额外防护'
    },
    datagrowth: {
        name: 'DataGrowth',
        owner: 'product_manager',
        health: 25,
        skillName: '数据采集',
        skillCooldown: 15,
        skillEffect: 'buff',  // 主人属性临时+10%
        skillBuffDuration: 5,
        skillBuffValue: 0.1,
        passiveName: '数据积累',
        passiveEffect: { damageStack: 0.5 },
        color: '#4488ff',
        description: '产品经理专属宠物，提供临时属性增益'
    },
    butlerai: {
        name: 'ButlerAI',
        owner: 'boss',
        health: 35,
        skillName: '应急预案',
        skillCooldown: 60,  // 每局1次
        skillEffect: 'heal',  // 血量<30%时自动恢复20HP
        skillHealTrigger: 0.3,
        skillHealAmount: 20,
        passiveName: '资本守护',
        passiveEffect: { energyRegenBonus: 0.15 },
        color: '#ffcc00',
        description: '老板专属管家AI，紧急恢复防止死亡'
    }
};

// 为兼容旧代码，创建别名
const MECHA_CONFIG = MECHA_DATA;

// 导出配置（如果使用模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MECHA_DATA,
        MECHA_CONFIG,
        KEY_MAPPING,
        GAME_CONFIG,
        AUDIO_CONFIG,
        PARTICLE_CONFIG,
        PET_DATA
    };
}