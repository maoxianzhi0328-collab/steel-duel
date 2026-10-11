/**
 * 角色模块
 * 包含机甲类和角色预览器
 */

/**
 * 机甲类
 */
class Mecha {
    constructor(x, y, playerNum, type) {
        this.x = x;
        this.y = y;
        this.playerNum = playerNum;
        this.type = type;

        const d = MECHA_DATA[type];
        this.name = d.name;
        this.maxHealth = d.maxHealth;
        this.health = d.maxHealth;
        this.attack = d.attack;
        this.speed = d.speed;
        this.dashSpeed = d.dashSpeed;
        this.defenseReduction = d.defenseReduction;
        this.attackRange = d.attackRange;
        this.color = d.color;
        this.accentColor = d.accentColor;
        this.skillName = d.skillName;
        this.skillDamage = d.skillDamage;
        this.skillRange = d.skillRange || 0;
        this.skillAOERadius = d.skillAOERadius || 0;
        this.skillStunDuration = d.skillStunDuration || 0;

        this.maxEnergy = GAME_CONFIG.game.maxEnergy;
        this.energy = this.maxEnergy;
        this.energyRegenRate = GAME_CONFIG.game.energyRegenRate;

        this.width = 40;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        this.facingRight = playerNum === 1;

        this.isAttacking = false;
        this.isDefending = false;
        this.isDashing = false;
        this.attackCooldown = 0;
        this.skillCooldown = 0;
        this.dashCooldown = 0;
        this.defenseTime = 0;

        this.attackWindup = 0;
        this.attackActive = 0;
        this.attackRecovery = 0;
        this.attackHit = false;
        this.attackJustFired = false; // 攻击前摇结束、进入生效帧的一次性标志（供Game生成子弹/激光）

        // 法师普攻激光特效 {x1,y1,x2,y2,time,maxTime}
        this.laserEffect = null;

        this.animTimer = 0;
        this.hitFlash = 0;

        // 眩晕状态（射手穿心箭施加；眩晕期间禁止一切行动）
        this.isStunned = false;
        this.stunTimer = 0;

        // ===== 宠物系统赋予的状态（统一在此初始化，避免 undefined/NaN） =====
        // 重力力场：禁锢时无法移动，但仍可攻击/防御/使用技能
        this.isImmobilized = false;
        this.immobilizeTimer = 0;
        // 影刃穿梭：无法被敌方攻击与技能选中
        this.isUntargetable = false;
        this.untargetableTimer = 0;
        // 猎鹰庇护：无敌，不受任何伤害
        this.isInvincible = false;
        this.invincibleTimer = 0;
        // 魔法护罩：短时高额免伤
        this.petShieldTimer = 0;
        this.petShieldReduction = 0;
        // 宠物被动加成（宠物存活期间由 Pet.applyPassiveEffect 每帧刷新，撤退时清零）
        this.petDamageReduction = 0;   // 钢铁卫士：减伤10%
        this.petDashSpeedBonus = 0;    // 暗影精灵：冲刺速度+15%
        this.petEnergyRegenBonus = 0;  // 魔法小精灵：能量恢复+20%
        this.petAttackRangeBonus = 0;  // 猎鹰：攻击/技能距离+15%

        // ===== AI系列新角色技能状态 =====
        // 程序员Bug注入：攻击速度降低（攻击冷却延长）
        this.attackSlowTimer = 0;
        this.attackSlowValue = 0;
        // UI设计师色彩混淆：视野缩小
        this.visionReduceTimer = 0;
        // PixelPixa像素护盾：抵挡1次攻击（最多吸收15HP）
        this.pixelShieldHP = 0;
        this.pixelShieldTimer = 0;
        this.pixelShieldBroken = false; // 本帧护盾被击破（供Game播放破碎特效）
        // DataGrowth数据采集：全属性临时+10%（基准值保存，增益期间按倍率生效）
        this.dataBuffTimer = 0;
        this.dataBuffValue = 0;
        this.baseAttack = d.attack;
        this.baseSpeed = d.speed;

        // 法师技能特效
        this.skillEffect = null;
    }

    /**
     * 获取受猎鹰被动加成后的普通攻击距离
     */
    getAttackRange() {
        return this.attackRange * (1 + (this.petAttackRangeBonus || 0));
    }

    /**
     * 获取受猎鹰被动加成后的技能距离
     */
    getSkillRange() {
        return (this.skillRange || 0) * (1 + (this.petAttackRangeBonus || 0));
    }

    /**
     * 更新角色状态
     */
    update(dt, keys, opponent) {
        this.facingRight = opponent.x > this.x;

        // 眩晕处理（最高优先级控制效果：期间无法移动/攻击/技能/冲刺/防御）
        if (this.isStunned) {
            this.stunTimer -= dt;
            this.vx = 0;
            this.vy = 0;
            this.isDefending = false;
            this.defenseTime = 0;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.stunTimer = 0;
            }
        }

        // 宠物技能状态计时器（统一在此递减，到期自动复位）
        if (this.immobilizeTimer > 0) {
            this.immobilizeTimer -= dt;
            if (this.immobilizeTimer <= 0) {
                this.isImmobilized = false;
                this.immobilizeTimer = 0;
            }
        }
        if (this.untargetableTimer > 0) {
            this.untargetableTimer -= dt;
            if (this.untargetableTimer <= 0) {
                this.isUntargetable = false;
                this.untargetableTimer = 0;
            }
        }
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.invincibleTimer = 0;
            }
        }
        if (this.petShieldTimer > 0) {
            this.petShieldTimer -= dt;
            if (this.petShieldTimer <= 0) {
                this.petShieldTimer = 0;
                this.petShieldReduction = 0;
            }
        }

        // AI系列新角色技能状态计时器
        if (this.attackSlowTimer > 0) this.attackSlowTimer -= dt;   // Bug注入：攻击减速剩余时间
        if (this.visionReduceTimer > 0) this.visionReduceTimer -= dt; // 色彩混淆：视野缩小剩余时间
        if (this.pixelShieldTimer > 0) this.pixelShieldTimer -= dt; // 像素护盾：剩余时间
        // DataGrowth数据采集：攻击力与移速临时+10%（增益期间按倍率重算，到期自动回落）
        if (this.dataBuffTimer > 0) this.dataBuffTimer -= dt;
        const buffMult = this.dataBuffTimer > 0 ? (1 + this.dataBuffValue) : 1;
        this.attack = this.baseAttack * buffMult;
        this.speed = this.baseSpeed * buffMult;

        // 禁锢处理：无法移动（重力力场持续刷新；仍可攻击/防御/放技能），并立即打断冲刺
        if (this.isImmobilized && !this.isStunned) {
            this.vx = 0;
            this.vy = 0;
            this.isDashing = false;
            this.dashDuration = 0;
        }

        // 能量恢复（魔法小精灵被动：恢复速度+20%）
        if (!this.isDefending) {
            const regenRate = this.energyRegenRate * (1 + (this.petEnergyRegenBonus || 0));
            this.energy = Math.min(this.maxEnergy, this.energy + regenRate * dt);
        }
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // 更新技能特效（影刺瞬移技能由checkDelayedSkills处理）
        if (this.skillEffect && this.skillEffect.type !== 'shadow_teleport' && this.skillEffect.type !== 'shadow_knife') {
            this.skillEffect.time -= dt;
            if (this.skillEffect.time <= 0) {
                this.skillEffect = null;
            }
        }

        // 更新普攻激光特效
        if (this.laserEffect) {
            this.laserEffect.time -= dt;
            if (this.laserEffect.time <= 0) {
                this.laserEffect = null;
            }
        }

        // 冷却递减
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.skillCooldown > 0) this.skillCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        // 攻击状态机
        if (this.attackWindup > 0) {
            this.attackWindup -= dt;
            if (this.attackWindup <= 0) {
                this.attackActive = 0.3;
                this.attackJustFired = true; // 前摇结束的瞬间：子弹/激光在本帧发射
            }
        } else if (this.attackActive > 0) {
            this.attackActive -= dt;
            if (this.attackActive <= 0) {
                this.attackRecovery = 0.3;
                this.isAttacking = false;
            }
        } else if (this.attackRecovery > 0) {
            this.attackRecovery -= dt;
        }
        if (this.attackActive <= 0) this.attackHit = false;

        // 防御时间管理
        if (this.isDefending) {
            this.defenseTime += dt;
            this.energy -= GAME_CONFIG.game.defenseCost * dt;
            if (this.energy <= 0) {
                this.energy = 0;
                this.isDefending = false;
                this.defenseTime = 0;
            }
            if (this.defenseTime >= GAME_CONFIG.physics.defenseMaxTime) {
                this.isDefending = false;
                this.defenseTime = 0;
            }
        } else {
            this.defenseTime = Math.max(0, this.defenseTime - dt * 0.5);
        }

        // 移动（眩晕/禁锢时不读取任何移动按键）
        if (this.attackRecovery <= 0 && !this.isDashing && !this.isStunned && !this.isImmobilized) {
            let dx = 0, dy = 0;
            if (this.playerNum === 1) {
                if (keys['KeyW']) dy = -1;
                if (keys['KeyS']) dy = 1;
                if (keys['KeyA']) dx = -1;
                if (keys['KeyD']) dx = 1;
            } else {
                if (keys['ArrowUp']) dy = -1;
                if (keys['ArrowDown']) dy = 1;
                if (keys['ArrowLeft']) dx = -1;
                if (keys['ArrowRight']) dx = 1;
            }
            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
            }
            this.vx = dx * this.speed * 60;
            this.vy = dy * this.speed * 60;
        }

        // 冲刺（眩晕/禁锢会立即打断冲刺；暗影精灵被动：冲刺速度+15%）
        if (this.isDashing && !this.isStunned && !this.isImmobilized) {
            this.vx = (this.facingRight ? 1 : -1) * this.dashSpeed * (1 + (this.petDashSpeedBonus || 0)) * 60;
            this.vy = 0;
            this.dashDuration = (this.dashDuration || 0) + dt;
            if (this.dashDuration >= GAME_CONFIG.physics.dashDuration) {
                this.isDashing = false;
                this.dashDuration = 0;
                this.vx = 0;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.x = Math.max(this.width / 2, Math.min(GAME_CONFIG.canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(GAME_CONFIG.canvas.height - this.height / 2, this.y));

        this.animTimer += dt;
    }

    /**
     * 施加眩晕（统一入口：立即中断目标当前的一切行动）
     * 眩晕只禁止行动，不免疫伤害
     */
    applyStun(duration) {
        this.isStunned = true;
        this.stunTimer = Math.max(this.stunTimer, duration);

        // 立即中断进行中的普通攻击（前摇/生效/收招全部清空）
        this.isAttacking = false;
        this.attackWindup = 0;
        this.attackActive = 0;
        this.attackRecovery = 0;
        this.attackHit = false;
        this.attackJustFired = false;

        // 立即中断冲刺与防御
        this.isDashing = false;
        this.dashDuration = 0;
        this.isDefending = false;
        this.defenseTime = 0;

        // 立即停住
        this.vx = 0;
        this.vy = 0;
    }

    /**
     * 执行攻击
     */
    performAttack() {
        if (this.isStunned || this.attackCooldown > 0 || this.isAttacking || this.isDashing) return false;
        this.isAttacking = true;
        this.attackWindup = 0.2;
        // 程序员专属0.5秒快速攻击间隔；Bug注入减速期间攻击冷却延长30%
        const baseInterval = MECHA_DATA[this.type].attackInterval || 0.7;
        this.attackCooldown = baseInterval * (this.attackSlowTimer > 0 ? (1 + this.attackSlowValue) : 1);
        return true;
    }

    /**
     * 执行技能
     */
    performSkill(opponent, game) {
        if (this.isStunned || this.skillCooldown > 0 || this.energy < (MECHA_DATA[this.type].skillCost || GAME_CONFIG.game.skillCost) || this.isAttacking || this.isDashing) return false;
        this.energy -= MECHA_DATA[this.type].skillCost || GAME_CONFIG.game.skillCost;
        this.skillCooldown = MECHA_DATA[this.type].skillCooldown;

        if (this.type === 'ironwall') {
            // 铁山靠：近距离重击
            const skillRange = this.getSkillRange();
            const hitX = this.x + (this.facingRight ? skillRange / 2 : -skillRange / 2);
            
            // 添加冲击效果
            this.skillEffect = {
                x: hitX,
                y: this.y,
                radius: skillRange,
                time: 0.5,
                damage: this.skillDamage
            };

            if (this.checkHit(opponent, skillRange)) {
                opponent.takeDamage(this.skillDamage);
            }

            // 添加粒子效果
            if (game && game.particleSystem) {
                game.particleSystem.createIronwallSkillEffect(this.x, this.y, this.skillRange, this.facingRight);
            }

            // 播放音效
            if (game && game.audioSystem) {
                game.audioSystem.playIronwallSkill();
            }

            return true;
        } else if (this.type === 'shadow') {
            // 影刃风暴：瞬移到对手背后攻击（可走位躲避）
            // 计算瞬移目标位置（对手背后）
            const behindOffset = this.facingRight ? -60 : 60;
            const teleportX = opponent.x + behindOffset;
            const teleportY = opponent.y;
            
            // 边界检查
            const clampedX = Math.max(this.width / 2, Math.min(GAME_CONFIG.canvas.width - this.width / 2, teleportX));

            // 创建瞬移预警特效（0.4秒延迟，给对手反应时间）
            this.skillEffect = {
                type: 'shadow_teleport',
                fromX: this.x,
                fromY: this.y,
                toX: clampedX,
                toY: teleportY,
                time: 0.4,  // 0.4秒后瞬移
                maxTime: 0.4,
                damage: this.skillDamage,
                targetRef: opponent  // 保存对手引用用于命中判定
            };

            // 添加瞬移预警视觉提示
            if (game && game.particleSystem) {
                // 在当前位置显示即将消失的残影
                game.particleSystem.createShadowTeleportWarning(
                    this.x, this.y,
                    clampedX, teleportY,
                    0.4
                );
            }

            // 播放音效
            if (game && game.audioSystem) {
                game.audioSystem.playShadowSkill();
            }

            return true;
        } else if (this.type === 'mage') {
            // 魔法轰炸：向前3格释放圆形AOE
            const skillRange = this.getSkillRange();
            const targetX = this.x + (this.facingRight ? skillRange : -skillRange);
            const targetY = this.y;

            // 添加技能特效
            this.skillEffect = {
                x: targetX,
                y: targetY,
                radius: this.skillAOERadius,
                time: 0.8,
                damage: this.skillDamage
            };

            // 检测是否命中（无法选中状态下AOE同样落空）
            const dx = opponent.x - targetX;
            const dy = opponent.y - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.skillAOERadius && !opponent.isUntargetable) {
                opponent.takeDamage(this.skillDamage);
            }

            // 添加华丽粒子特效
            if (game && game.particleSystem) {
                game.particleSystem.createMageSkillEffect(targetX, targetY, this.skillAOERadius);
            }

            // 播放法师专属音效
            if (game && game.audioSystem) {
                game.audioSystem.playMageSkill();
            }

            return true;
        } else if (this.type === 'archer') {
            // 穿心箭：朝面向方向射出一支箭，命中造成伤害并眩晕1秒
            const skillRange = this.getSkillRange();
            const hit = this.checkHit(opponent, skillRange);
            let targetX, targetY;

            if (hit) {
                // 命中：箭矢飞向对手，造成伤害并施加眩晕
                targetX = opponent.x;
                targetY = opponent.y;
                opponent.takeDamage(this.skillDamage);
                opponent.applyStun(this.skillStunDuration);
            } else {
                // 未命中：箭矢飞向最大射程处落空
                targetX = this.x + (this.facingRight ? skillRange : -skillRange);
                targetY = this.y;
            }

            // 添加箭矢飞行与命中粒子
            if (game && game.particleSystem) {
                game.particleSystem.createArcherSkillEffect(
                    this.x, this.y, targetX, targetY, this.facingRight, hit
                );
            }

            // 播放射手专属音效（拉弓→飞行→命中嗡鸣）
            if (game && game.audioSystem) {
                game.audioSystem.playArcherSkill();
            }

            return true;
        } else if (this.type === 'programmer') {
            // Bug注入：范围内注入Bug，造成伤害并降低敌方攻击速度30%持续2秒
            const skillRange = this.getSkillRange();
            const hit = this.checkHit(opponent, skillRange);
            const targetX = hit ? opponent.x : this.x + (this.facingRight ? skillRange : -skillRange);

            if (hit) {
                opponent.takeDamage(this.skillDamage);
                // Bug效果：敌方攻击冷却延长30%，持续2秒
                opponent.attackSlowTimer = MECHA_DATA.programmer.skillEffectDuration;
                opponent.attackSlowValue = MECHA_DATA.programmer.skillEffectValue;
            }

            // Bug代码包飞向目标 + ERROR闪烁
            if (game && game.particleSystem) {
                game.particleSystem.addBugInjectEffect(this.x, this.y, hit ? opponent : null);
            }

            // 播放程序员专属音效（键盘敲击+电流故障）
            if (game && game.audioSystem) {
                game.audioSystem.playProgrammerSkill();
            }
            return true;
        } else if (this.type === 'ui_designer') {
            // 色彩混淆：以自身为中心释放彩虹波纹，命中造成伤害并缩小敌方视野
            const skillRange = this.getSkillRange();
            const dx = opponent.x - this.x;
            const dy = opponent.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const hit = dist <= skillRange && !opponent.isUntargetable;

            if (hit) {
                opponent.takeDamage(this.skillDamage);
                // 视野干扰：敌方屏幕半区出现彩虹迷雾，持续3秒
                opponent.visionReduceTimer = MECHA_DATA.ui_designer.skillEffectDuration;
            }

            // 三层彩虹波纹扩散
            if (game && game.particleSystem) {
                game.particleSystem.addColorConfusionEffect(this.x, this.y, skillRange);
            }

            // 播放UI设计师专属音效（彩虹琶音）
            if (game && game.audioSystem) {
                game.audioSystem.playUIDesignerSkill();
            }
            return true;
        } else if (this.type === 'product_manager') {
            // 需求变更：全地图生效，造成伤害并重置敌方技能冷却为最大值
            const hit = !opponent.isUntargetable;

            if (hit) {
                opponent.takeDamage(this.skillDamage);
                // 需求变更：敌方技能被迫返工，冷却重置
                opponent.skillCooldown = MECHA_DATA[opponent.type].skillCooldown;
            }

            // 全地图数据波动（自己与敌方都收到"需求变更"通知，波浪延迟）
            if (game && game.particleSystem) {
                game.particleSystem.addRequirementChangeEffect([this, opponent]);
            }

            // 播放产品经理专属音效（消息通知音）
            if (game && game.audioSystem) {
                game.audioSystem.playProductManagerSkill();
            }
            return true;
        } else if (this.type === 'boss') {
            // 资源调配：近距离重击，造成伤害并偷取敌方10点能量
            const skillRange = this.getSkillRange();
            const hit = this.checkHit(opponent, skillRange);
            const targetX = hit ? opponent.x : this.x + (this.facingRight ? skillRange : -skillRange);

            if (hit) {
                opponent.takeDamage(this.skillDamage);
                // 偷取能量：资本转移，充入自己能量槽
                const stolen = Math.min(opponent.energy, MECHA_DATA.boss.skillStealAmount);
                opponent.energy -= stolen;
                this.energy = Math.min(this.maxEnergy, this.energy + stolen);
            }

            // 金色资本光束 + 金币飞散
            if (game && game.particleSystem) {
                game.particleSystem.addResourceTransferEffect(this.x, this.y, targetX, this.y);
            }

            // 播放老板专属音效（收银机叮声）
            if (game && game.audioSystem) {
                game.audioSystem.playBossSkill();
            }
            return true;
        }
        return true;
    }

    /**
     * 执行冲刺
     */
    performDash() {
        if (this.isStunned || this.isDashing || this.dashCooldown > 0 || this.energy < GAME_CONFIG.game.dashCost) return false;
        this.isDashing = true;
        this.dashDuration = 0;
        this.dashCooldown = GAME_CONFIG.physics.dashCooldown;
        this.energy -= GAME_CONFIG.game.dashCost;
        return true;
    }

    /**
     * 检测命中（目标处于"无法选中"状态时一切攻击/技能均落空）
     */
    checkHit(opponent, range) {
        if (opponent.isUntargetable) return false;
        const dx = opponent.x - this.x;
        const dy = opponent.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= range) {
            if ((this.facingRight && dx > -10) || (!this.facingRight && dx < 10)) return true;
        }
        return false;
    }

    /**
     * 受到伤害（全游戏唯一伤害结算入口：宠物无敌/免伤/被动统一在此生效）
     * @returns {number} 实际造成的伤害（无敌时为0）
     */
    takeDamage(damage) {
        // 猎鹰庇护：无敌期间不受任何伤害
        if (this.isInvincible) return 0;

        let actual = damage;
        // 本体防御减伤
        if (this.isDefending) actual = damage * (1 - this.defenseReduction);
        // 钢铁卫士被动：减伤10%（与本体防御叠乘）
        if (this.petDamageReduction > 0) actual *= (1 - this.petDamageReduction);
        // 魔法护罩：免伤80%
        if (this.petShieldTimer > 0 && this.petShieldReduction > 0) actual *= (1 - this.petShieldReduction);

        // PixelPixa像素护盾：最多吸收15点伤害，抵挡后护盾破碎
        if (this.pixelShieldHP > 0 && this.pixelShieldTimer > 0) {
            const absorbed = Math.min(this.pixelShieldHP, actual);
            this.pixelShieldHP -= absorbed;
            actual -= absorbed;
            if (this.pixelShieldHP <= 0) {
                this.pixelShieldTimer = 0;
                this.pixelShieldBroken = true; // 供Game检测播放破碎特效
            }
            if (actual <= 0) return 0; // 本次攻击被护盾完全抵挡
        }

        this.health = Math.max(0, this.health - actual);
        this.hitFlash = 0.3;
        return actual;
    }

    /**
     * 绘制角色
     */
    draw(ctx) {
        ctx.save();
        if (this.health < this.maxHealth * 0.3) {
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 100) * 0.3;
        }
        this.drawMecha(ctx);
        if (this.attackActive > 0) this.drawAttackEffect(ctx);
        if (this.isDefending) this.drawDefenseEffect(ctx);
        if (this.skillEffect) this.drawSkillEffect(ctx);
        if (this.laserEffect) this.drawLaserEffect(ctx);
        if (this.isDashing) {
            ctx.globalAlpha = 0.3;
            for (let i = 1; i <= 3; i++) {
                ctx.fillStyle = this.color;
                ctx.fillRect(
                    this.x - this.width / 2 - (this.facingRight ? -1 : 1) * i * 20,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
            }
            ctx.globalAlpha = 1;
        }
        ctx.restore();

        // 眩晕星星画在最上层（独立透明度，不受残血闪烁影响）
        if (this.isStunned) this.drawStunEffect(ctx);

        // 宠物技能赋予的状态效果（画在最上层，保证双方都能清晰识别）
        this.drawPetStatusEffects(ctx);
    }

    /**
     * 绘制宠物技能状态视觉（禁锢/无法选中/魔法护罩/无敌）
     */
    drawPetStatusEffects(ctx) {
        const now = Date.now();

        // 重力力场禁锢：脚下蓝色锁定光圈 + 锁链
        if (this.isImmobilized) {
            ctx.save();
            const pulse = 1 + Math.sin(now / 100) * 0.08;

            // 脚下蓝色网格光圈
            ctx.strokeStyle = 'rgba(68, 136, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#4488ff';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.height / 2, 26 * pulse, 9 * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 内圈
            ctx.strokeStyle = 'rgba(136, 204, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.height / 2, 18 * pulse, 6 * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 锁链（身体两侧蓝色短链节）
            ctx.strokeStyle = 'rgba(100, 160, 255, 0.85)';
            ctx.lineWidth = 3;
            for (let side = -1; side <= 1; side += 2) {
                for (let i = 0; i < 3; i++) {
                    const cy = this.y - 15 + i * 14;
                    ctx.beginPath();
                    ctx.arc(this.x + side * 22, cy, 4, 0, Math.PI * 1.5);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }

        // 影刃穿梭无法选中：粉色半透明残影环 + 闪烁轮廓
        if (this.isUntargetable) {
            ctx.save();
            const flicker = 0.5 + Math.sin(now / 60) * 0.3;

            ctx.globalAlpha = flicker;
            ctx.strokeStyle = '#ff66aa';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#ff4488';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.9 + Math.sin(now / 120) * 4, 0, Math.PI * 2);
            ctx.stroke();

            // 环绕粉色残影
            for (let i = 0; i < 3; i++) {
                const angle = now / 300 + (Math.PI * 2 * i) / 3;
                const rx = this.x + Math.cos(angle) * 30;
                const ry = this.y + Math.sin(angle) * 10;
                ctx.fillStyle = 'rgba(255, 102, 170, 0.7)';
                ctx.fillRect(rx - 2, ry - 2, 4, 4);
            }
            ctx.restore();
        }

        // 魔法护罩：紫色半球护罩（半径40，与配置一致）
        if (this.petShieldTimer > 0) {
            ctx.save();
            const radius = 40;
            const shimmer = 0.6 + Math.sin(now / 90) * 0.2;

            // 护罩填充
            ctx.fillStyle = 'rgba(170, 68, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // 护罩外环
            ctx.strokeStyle = `rgba(204, 136, 255, ${shimmer})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 16;
            ctx.shadowColor = '#aa44ff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.stroke();

            // 流动魔法符文（6个光点沿边缘旋转）
            ctx.fillStyle = '#ddbbff';
            for (let i = 0; i < 6; i++) {
                const angle = now / 500 + (Math.PI * 2 * i) / 6;
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * radius, this.y + Math.sin(angle) * radius, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 猎鹰庇护：绿色能量护盾 + 金色无敌光芒
        if (this.isInvincible) {
            ctx.save();
            const pulse = 1 + Math.sin(now / 80) * 0.06;

            // 金色护体光芒
            ctx.fillStyle = 'rgba(255, 220, 100, 0.18)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * pulse, 0, Math.PI * 2);
            ctx.fill();

            // 绿色护盾环
            ctx.strokeStyle = 'rgba(136, 255, 136, 0.9)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#44cc44';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width + 6, 0, Math.PI * 2);
            ctx.stroke();

            // 内层金线
            ctx.strokeStyle = 'rgba(255, 230, 120, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width - 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // PixelPixa像素护盾：粉色像素方块环绕（抵挡1次攻击）
        if (this.pixelShieldTimer > 0 && this.pixelShieldHP > 0) {
            ctx.save();
            const radius = this.width + 12;

            // 半透明粉色护罩
            ctx.fillStyle = 'rgba(255, 136, 255, 0.12)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // 环绕像素方块（8块旋转，组成像素护盾）
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff88ff';
            for (let i = 0; i < 8; i++) {
                const angle = now / 400 + (Math.PI * 2 * i) / 8;
                const px = this.x + Math.cos(angle) * radius;
                const py = this.y + Math.sin(angle) * radius;
                ctx.fillStyle = i % 2 === 0 ? '#ff88ff' : '#ffffff';
                ctx.fillRect(px - 3, py - 3, 6, 6);
            }
            ctx.restore();
        }
    }

    /**
     * 绘制眩晕效果（头顶旋转的金色星星）
     */
    drawStunEffect(ctx) {
        const baseAngle = Date.now() / 150;
        const starRadius = 6;

        for (let i = 0; i < 3; i++) {
            const angle = baseAngle + (Math.PI * 2 * i) / 3;
            const sx = this.x + Math.cos(angle) * 14;
            const sy = this.y - this.height / 2 - 12 + Math.sin(angle) * 5;

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle + Math.PI / 2);

            ctx.shadowBlur = 6;
            ctx.shadowColor = '#ffaa00';
            ctx.fillStyle = '#ffdd22';

            // 五角星
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
                const outerAngle = (Math.PI * 2 * j) / 5 - Math.PI / 2;
                const innerAngle = outerAngle + Math.PI / 5;
                const ox = Math.cos(outerAngle) * starRadius;
                const oy = Math.sin(outerAngle) * starRadius;
                const ix = Math.cos(innerAngle) * starRadius * 0.45;
                const iy = Math.sin(innerAngle) * starRadius * 0.45;
                if (j === 0) {
                    ctx.moveTo(ox, oy);
                } else {
                    ctx.lineTo(ox, oy);
                }
                ctx.lineTo(ix, iy);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * 绘制机甲主体
     */
    drawMecha(ctx) {
        const x = this.x - this.width / 2;
        const y = this.y - this.height / 2;
        const flash = this.hitFlash > 0;

        // 身体
        ctx.fillStyle = flash ? '#ffffff' : this.color;
        ctx.fillRect(x + 10, y + 15, this.width - 20, this.height - 25);
        // 头部
        ctx.fillStyle = flash ? '#ffffff' : this.accentColor;
        ctx.fillRect(x + 12, y, this.width - 24, 18);
        // 眼睛
        ctx.fillStyle = '#ffcc00';
        const eyeX = this.facingRight ? x + 20 : x + this.width - 25;
        ctx.fillRect(eyeX, y + 6, 8, 6);
        // 手臂
        ctx.fillStyle = flash ? '#ffffff' : this.color;
        const armOffset = Math.sin(this.animTimer * 10) * 3;
        ctx.fillRect(x, y + 20 + armOffset, 12, 25);
        ctx.fillRect(x + this.width - 12, y + 20 - armOffset, 12, 25);
        // 腿部
        ctx.fillStyle = flash ? '#ffffff' : this.accentColor;
        const legOffset = (this.vx !== 0 || this.vy !== 0) ? Math.sin(this.animTimer * 20) * 5 : 0;
        ctx.fillRect(x + 8, y + this.height - 20 + legOffset, 10, 20);
        ctx.fillRect(x + this.width - 18, y + this.height - 20 - legOffset, 10, 20);
        // 装甲细节
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x + 14, y + 20, 4, this.height - 35);
        ctx.fillRect(x + this.width - 18, y + 20, 4, this.height - 35);
    }

    /**
     * 绘制攻击效果
     */
    drawAttackEffect(ctx) {
        const direction = this.facingRight ? 1 : -1;
        const startX = this.x;
        const endX = this.x + direction * this.getAttackRange();

        if (this.type === 'ironwall') {
            // 铁壁：重型震荡攻击
            ctx.save();

            // 主冲击波
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 8;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.moveTo(startX, this.y);
            ctx.lineTo(endX, this.y);
            ctx.stroke();

            // 震荡环
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 4;
            for (let i = 0; i < 3; i++) {
                const offset = i * 15;
                ctx.beginPath();
                ctx.arc(startX + direction * (offset + 20), this.y, 15 - i * 3, -Math.PI / 2, Math.PI / 2);
                ctx.stroke();
            }

            // 冲击粒子
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = 'rgba(68, 136, 255, 0.7)';
                const px = startX + direction * (Math.random() * this.attackRange);
                const py = this.y + (Math.random() - 0.5) * 50;
                const size = 4 + Math.random() * 4;
                ctx.fillRect(px - size / 2, py - size / 2, size, size);
            }

            ctx.restore();
        } else if (this.type === 'shadow') {
            // 影刺：快速斩击
            ctx.save();

            // 斩击轨迹
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff66aa';

            // 多道快速斩击线
            for (let i = 0; i < 3; i++) {
                const yOffset = -20 + i * 20;
                const alpha = 1 - i * 0.2;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.moveTo(startX, this.y + yOffset);
                ctx.lineTo(endX, this.y + yOffset);
                ctx.stroke();
            }

            // 残影效果
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = this.color;
            for (let i = 0; i < 3; i++) {
                const offset = i * 10;
                ctx.fillRect(startX + direction * offset - 20, this.y - 30, 40, 60);
            }

            // 速度线
            ctx.strokeStyle = 'rgba(255, 102, 170, 0.8)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) {
                const lineStart = startX + direction * (Math.random() * this.attackRange * 0.3);
                const lineEnd = lineStart + direction * (20 + Math.random() * 30);
                ctx.beginPath();
                ctx.moveTo(lineStart, this.y + (Math.random() - 0.5) * 60);
                ctx.lineTo(lineEnd, this.y + (Math.random() - 0.5) * 60);
                ctx.stroke();
            }

            ctx.restore();
        } else if (this.type === 'archer') {
            // 射手：实际箭矢由 ProjectileSystem 渲染，这里只画发射瞬间的弓口闪光
            ctx.save();

            const muzzleX = this.x + direction * 20;
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#88ff88';
            ctx.fillStyle = 'rgba(180, 255, 180, 0.8)';
            ctx.fillRect(muzzleX - 5, this.y - 5, 10, 10);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(muzzleX - 2, this.y - 2, 4, 4);

            ctx.restore();
        }
        // 法师普攻为激光，由 drawLaserEffect() 统一渲染，此处不再画线条
    }

    /**
     * 绘制法师普攻激光特效（紫色发光光束，带闪烁与白色核心）
     */
    drawLaserEffect(ctx) {
        const e = this.laserEffect;
        const k = Math.max(0, e.time / e.maxTime); // 剩余时间比例 1→0
        const flicker = 0.75 + Math.random() * 0.25;

        ctx.save();

        // 外层紫色光晕（粗）
        ctx.globalAlpha = 0.35 * k * flicker;
        ctx.strokeStyle = '#aa44ff';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#cc66ff';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        // 中层亮紫光束
        ctx.globalAlpha = 0.8 * k;
        ctx.strokeStyle = '#cc88ff';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        // 白色高能核心（细）
        ctx.globalAlpha = k;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();

        // 发射点能量球
        ctx.globalAlpha = k;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(e.x1, e.y1, 5 + flicker * 2, 0, Math.PI * 2);
        ctx.fill();

        // 终点闪光
        ctx.globalAlpha = 0.8 * k * flicker;
        ctx.fillStyle = '#ddbbff';
        ctx.beginPath();
        ctx.arc(e.x2, e.y2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制防御效果
     */
    drawDefenseEffect(ctx) {
        ctx.strokeStyle = 'rgba(100,200,255,0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width + 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(100,200,255,0.4)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width + 10, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * 绘制技能效果
     */
    drawSkillEffect(ctx) {
        const effect = this.skillEffect;
        const alpha = effect.time / (effect.time > 0.5 ? 0.5 : 0.8);

        if (this.type === 'mage') {
            // 法师：魔法轰炸效果
            ctx.save();

            // 绘制魔法圈
            ctx.strokeStyle = `rgba(170, 68, 255, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();

            // 绘制内圈
            ctx.strokeStyle = `rgba(136, 34, 204, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();

            // 绘制魔法符号（十字）
            ctx.strokeStyle = `rgba(255, 204, 0, ${alpha * 0.8})`;
            ctx.lineWidth = 3;
            const size = effect.radius * 0.4;
            ctx.beginPath();
            ctx.moveTo(effect.x - size, effect.y);
            ctx.lineTo(effect.x + size, effect.y);
            ctx.moveTo(effect.x, effect.y - size);
            ctx.lineTo(effect.x, effect.y + size);
            ctx.stroke();

            // 绘制魔法能量粒子
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 + Date.now() / 200;
                const px = effect.x + Math.cos(angle) * effect.radius * 0.8;
                const py = effect.y + Math.sin(angle) * effect.radius * 0.8;
                ctx.fillStyle = `rgba(170, 68, 255, ${alpha})`;
                ctx.fillRect(px - 3, py - 3, 6, 6);
            }

            ctx.restore();
        } else if (this.type === 'ironwall') {
            // 铁壁：铁山靠冲击效果
            ctx.save();

            const direction = this.facingRight ? 1 : -1;

            // 主冲击波圆环
            ctx.strokeStyle = `rgba(68, 136, 255, ${alpha})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius * 0.3, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();

            // 震荡波纹
            for (let i = 0; i < 3; i++) {
                const waveRadius = effect.radius * (0.2 + i * 0.15);
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * (0.6 - i * 0.15)})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, waveRadius, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
            }

            // 冲击纹理线
            ctx.strokeStyle = `rgba(34, 102, 204, ${alpha * 0.8})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const angle = -Math.PI / 6 + (Math.PI / 3) * (i / 4);
                const lineLen = effect.radius * 0.25;
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y);
                ctx.lineTo(
                    effect.x + Math.cos(angle) * lineLen * direction,
                    effect.y + Math.sin(angle) * lineLen
                );
                ctx.stroke();
            }

            ctx.restore();
        } else if (this.type === 'shadow') {
            // 影刺：瞬影斩效果已通过粒子系统渲染
            // 这里可以添加额外的光环效果
            ctx.save();

            ctx.strokeStyle = `rgba(255, 68, 136, ${alpha * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width + 20, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    }
}

/**
 * 角色预览器
 * 用于在选择界面显示动态角色
 */
class MechaPreviewer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.animTimer = 0;
        this.type = 'ironwall';
    }

    /**
     * 设置预览角色类型
     */
    setType(type) {
        this.type = type;
    }

    /**
     * 更新动画
     */
    update(dt) {
        this.animTimer += dt;
    }

    /**
     * 绘制角色预览（基于Canvas尺寸自适应缩放）
     */
    draw() {
        const d = MECHA_DATA[this.type];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;

        // 原始设计基于 80x100 Canvas，计算缩放比例
        const scale = Math.min(this.canvas.width / 80, this.canvas.height / 100);

        // 身体
        this.ctx.fillStyle = d.color;
        this.ctx.fillRect(x - 10 * scale, y - 15 * scale, 20 * scale, 30 * scale);

        // 头部
        this.ctx.fillStyle = d.accentColor;
        this.ctx.fillRect(x - 8 * scale, y - 30 * scale, 16 * scale, 12 * scale);

        // 眼睛
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillRect(x - 4 * scale, y - 27 * scale, 5 * scale, 4 * scale);

        // 手臂（动画）
        const armOffset = Math.sin(this.animTimer * 10) * 2 * scale;
        this.ctx.fillStyle = d.color;
        this.ctx.fillRect(x - 20 * scale, y - 10 * scale + armOffset, 8 * scale, 15 * scale);
        this.ctx.fillRect(x + 12 * scale, y - 10 * scale - armOffset, 8 * scale, 15 * scale);

        // 腿部（动画）
        const legOffset = Math.sin(this.animTimer * 20) * 3 * scale;
        this.ctx.fillStyle = d.accentColor;
        this.ctx.fillRect(x - 8 * scale, y + 15 * scale + legOffset, 6 * scale, 15 * scale);
        this.ctx.fillRect(x + 2 * scale, y + 15 * scale - legOffset, 6 * scale, 15 * scale);

        // 装甲细节
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.fillRect(x - 3 * scale, y - 10 * scale, 2 * scale, 20 * scale);
        this.ctx.fillRect(x + 1 * scale, y - 10 * scale, 2 * scale, 20 * scale);
    }

    /**
     * 启动预览动画循环
     */
    startAnimation() {
        let lastTime = performance.now();

        const loop = () => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            this.update(dt);
            this.draw();

            requestAnimationFrame(loop);
        };

        loop();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Mecha, MechaPreviewer };
}