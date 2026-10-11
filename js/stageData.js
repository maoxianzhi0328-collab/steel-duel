// ==================== 关卡系统数据配置 ====================

// AI难度等级定义
const AI_LEVELS = {
    1: {
        name: '新手级',
        reactionDelay: 1500,      // 反应延迟(ms)
        attackInterval: 5000,      // 攻击间隔(ms)
        skillStrategy: 'random',   // 技能使用策略
        movementMode: 'passive',   // 移动模式
        usePetSkill: false,        // 是否使用宠物技能
        description: '反应慢，不主动攻击'
    },
    2: {
        name: '简单级',
        reactionDelay: 1000,
        attackInterval: 3000,
        skillStrategy: 'occasional',
        movementMode: 'chase',
        usePetSkill: false,
        description: '反应较慢，会追击玩家'
    },
    3: {
        name: '中等级',
        reactionDelay: 500,
        attackInterval: 2000,
        skillStrategy: 'tactical',
        movementMode: 'aggressive',
        usePetSkill: true,
        description: '反应快，主动攻击和躲避'
    },
    4: {
        name: '困难级',
        reactionDelay: 300,
        attackInterval: 1500,
        skillStrategy: 'optimal',
        movementMode: 'predictive',
        usePetSkill: true,
        description: '反应很快，预判玩家行为'
    },
    5: {
        name: '大师级',
        reactionDelay: 100,
        attackInterval: 1000,
        skillStrategy: 'perfect',
        movementMode: 'perfect',
        usePetSkill: true,
        description: '接近完美操作，预判走位'
    }
};

// 关卡数据定义
const STAGE_DATA = {
    // ==================== 第一章：新手试炼 ====================
    1: {
        chapter: 1,
        name: '铁壁入门',
        enemy: 'ironwall',
        pet: null,
        aiLevel: 1,
        difficulty: '简单',
        objective: '学会基本攻击和移动',
        rewards: {
            gold: 100,
            petFragment: null
        },
        isBoss: false
    },
    2: {
        chapter: 1,
        name: '影刺入门',
        enemy: 'shadow',
        pet: null,
        aiLevel: 1,
        difficulty: '简单',
        objective: '学会躲避和反击',
        rewards: {
            gold: 150,
            petFragment: null
        },
        isBoss: false
    },
    3: {
        chapter: 1,
        name: '法师入门',
        enemy: 'mage',
        pet: null,
        aiLevel: 1,
        difficulty: '简单',
        objective: '学会防御和技能使用',
        rewards: {
            gold: 150,
            petFragment: null
        },
        isBoss: false
    },
    4: {
        chapter: 1,
        name: '射手入门',
        enemy: 'archer',
        pet: null,
        aiLevel: 1,
        difficulty: '简单',
        objective: '学会走位和风筝',
        rewards: {
            gold: 200,
            petFragment: null
        },
        isBoss: false
    },
    5: {
        chapter: 1,
        name: 'BOSS：混合试炼',
        enemy: 'random',  // 随机选择
        pet: null,
        aiLevel: 2,
        difficulty: '简单',
        objective: '综合应用所学技巧',
        rewards: {
            gold: 500,
            petFragment: 'random'
        },
        isBoss: true
    },

    // ==================== 第二章：钢铁试炼 ====================
    6: {
        chapter: 2,
        name: '铁壁进阶',
        enemy: 'ironwall',
        pet: 'steel_guardian',
        aiLevel: 3,
        difficulty: '中等',
        objective: '学会应对高血量敌人',
        rewards: {
            gold: 300,
            petFragment: 'steel_guardian'
        },
        isBoss: false
    },
    7: {
        chapter: 2,
        name: '影刺进阶',
        enemy: 'shadow',
        pet: 'shadow_spirit',
        aiLevel: 3,
        difficulty: '中等',
        objective: '学会应对高机动敌人',
        rewards: {
            gold: 300,
            petFragment: 'shadow_spirit'
        },
        isBoss: false
    },
    8: {
        chapter: 2,
        name: '法师进阶',
        enemy: 'mage',
        pet: 'magic_fairy',
        aiLevel: 3,
        difficulty: '中等',
        objective: '学会应对AOE伤害',
        rewards: {
            gold: 300,
            petFragment: 'magic_fairy'
        },
        isBoss: false
    },
    9: {
        chapter: 2,
        name: '射手进阶',
        enemy: 'archer',
        pet: 'hunter_falcon',
        aiLevel: 3,
        difficulty: '中等',
        objective: '学会应对远程控制',
        rewards: {
            gold: 300,
            petFragment: 'hunter_falcon'
        },
        isBoss: false
    },
    10: {
        chapter: 2,
        name: 'BOSS：钢铁守护者',
        enemy: 'ironwall',
        pet: 'steel_guardian',
        aiLevel: 4,
        difficulty: '中等',
        objective: '学会应对宠物组合',
        rewards: {
            gold: 1000,
            petFragment: 'random',
            petFragmentCount: 2
        },
        isBoss: true
    },

    // ==================== 第三章：终极试炼 ====================
    11: {
        chapter: 3,
        name: '影刃风暴',
        enemy: 'shadow',
        pet: 'shadow_spirit',
        aiLevel: 5,
        difficulty: '困难',
        objective: '学会应对瞬移和无法选中',
        rewards: {
            gold: 500,
            petFragment: 'shadow_spirit',
            petFragmentCount: 2
        },
        isBoss: false
    },
    12: {
        chapter: 3,
        name: '魔法屏障',
        enemy: 'mage',
        pet: 'magic_fairy',
        aiLevel: 5,
        difficulty: '困难',
        objective: '学会应对护罩防御',
        rewards: {
            gold: 500,
            petFragment: 'magic_fairy',
            petFragmentCount: 2
        },
        isBoss: false
    },
    13: {
        chapter: 3,
        name: '精准猎杀',
        enemy: 'archer',
        pet: 'hunter_falcon',
        aiLevel: 5,
        difficulty: '困难',
        objective: '学会应对无敌状态',
        rewards: {
            gold: 500,
            petFragment: 'hunter_falcon',
            petFragmentCount: 2
        },
        isBoss: false
    },
    14: {
        chapter: 3,
        name: '重力力场',
        enemy: 'ironwall',
        pet: 'steel_guardian',
        aiLevel: 5,
        difficulty: '困难',
        objective: '学会应对禁锢控制',
        rewards: {
            gold: 500,
            petFragment: 'steel_guardian',
            petFragmentCount: 2
        },
        isBoss: false
    },
    15: {
        chapter: 3,
        name: 'BOSS：终极对决',
        enemy: 'random',
        pet: 'match',  // 匹配对应宠物
        aiLevel: 5,
        difficulty: '困难',
        objective: '证明你的实力',
        rewards: {
            gold: 2000,
            petFragment: 'all',
            petFragmentCount: 1,
            achievement: '钢铁之王'
        },
        isBoss: true
    }
};

// 角色到宠物的映射
const MECHA_TO_PET = {
    'ironwall': 'steel_guardian',
    'shadow': 'shadow_spirit',
    'mage': 'magic_fairy',
    'archer': 'hunter_falcon'
};

// 宠物碎片数据
const PET_FRAGMENTS = {
    steel_guardian: { name: '钢铁卫士碎片', icon: '🛡️', color: '#4488ff' },
    shadow_spirit: { name: '暗影精灵碎片', icon: '👻', color: '#ff4488' },
    magic_fairy: { name: '魔法小精灵碎片', icon: '✨', color: '#aa44ff' },
    hunter_falcon: { name: '猎鹰碎片', icon: '🦅', color: '#44cc44' }
};

// 关卡进度管理类
class StageProgress {
    constructor() {
        this.unlockedLevels = [1];  // 已解锁关卡
        this.completedLevels = [];   // 已完成关卡
        this.currentLevel = 1;       // 当前关卡
        this.load();
    }

    // 加载进度
    load() {
        const saved = localStorage.getItem('stageProgress');
        if (saved) {
            const data = JSON.parse(saved);
            this.unlockedLevels = data.unlockedLevels || [1];
            this.completedLevels = data.completedLevels || [];
            this.currentLevel = data.currentLevel || 1;
        }
    }

    // 保存进度
    save() {
        localStorage.setItem('stageProgress', JSON.stringify({
            unlockedLevels: this.unlockedLevels,
            completedLevels: this.completedLevels,
            currentLevel: this.currentLevel
        }));
    }

    // 完成关卡
    completeLevel(levelId) {
        if (!this.completedLevels.includes(levelId)) {
            this.completedLevels.push(levelId);
            
            // 解锁下一关
            if (levelId < 15 && !this.unlockedLevels.includes(levelId + 1)) {
                this.unlockedLevels.push(levelId + 1);
                this.currentLevel = levelId + 1;
            }
            
            this.save();
        }
    }

    // 获取关卡状态
    getLevelStatus(levelId) {
        if (this.completedLevels.includes(levelId)) {
            return 'completed';
        } else if (this.unlockedLevels.includes(levelId)) {
            return 'current';
        } else {
            return 'locked';
        }
    }

    // 重置进度
    reset() {
        this.unlockedLevels = [1];
        this.completedLevels = [];
        this.currentLevel = 1;
        this.save();
    }
}

// 全局实例
const stageProgress = new StageProgress();