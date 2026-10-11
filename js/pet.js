/**
 * 宠物系统模块
 * 实现宠物跟随、被动效果和主动技能
 */

/**
 * 宠物类
 */
class Pet {
    /**
     * @param {Mecha} owner 宠物主人
     * @param {string} type 宠物类型（steel_guardian/shadow_spirit/magic_fairy/hunter_falcon）
     */
    constructor(owner, type) {
        this.owner = owner;
        this.type = type;
        
        const data = PET_DATA[type];
        this.name = data.name;
        this.maxHealth = data.health;
        this.health = data.health;
        this.color = data.color;
        
        // 技能属性
        this.skillName = data.skillName;
        this.skillCooldown = 0;
        this.skillMaxCooldown = data.skillCooldown;
        
        // 被动属性
        this.passiveName = data.passiveName;
        this.passiveEffect = data.passiveEffect;
        
        // 状态
        this.isRetreated = false;
        this.retreatTimer = 0;
        this.isActive = false;
        
        // 位置（相对于主人）
        this.x = owner.x + 50;
        this.y = owner.y - 50;
        this.offsetX = 50;
        this.offsetY = -50;
        
        // 技能效果标记
        this.skillEffect = null;
        this.tauntTimer = 0;      // 钢铁卫士：重力力场剩余持续时间
        this.fieldX = 0;          // 重力力场部署位置（静止区域，不会随宠物移动）
        this.fieldY = 0;
        this.markTarget = null;   // 暗影精灵：穿梭后残影标记
        this.markTimer = 0;
        this.amplifyTimer = 0;    // 魔法小精灵：护罩剩余时间（宠物自身视觉用）
        this.slowTimer = 0;       // 兼容保留
    }

    /**
     * 更新宠物状态
     */
    update(dt, opponent) {
        // 撤退状态
        if (this.isRetreated) {
            this.retreatTimer -= dt;
            if (this.retreatTimer <= 0) {
                this.respawn();
            }
            return;
        }

        // 跟随主人
        this.followOwner();

        // 技能冷却
        if (this.skillCooldown > 0) {
            this.skillCooldown -= dt;
        }

        // 技能效果计时器
        if (this.markTimer > 0) {
            this.markTimer -= dt;
            if (this.markTimer <= 0) {
                this.markTarget = null;
            }
        }
        if (this.amplifyTimer > 0) this.amplifyTimer -= dt;
        if (this.slowTimer > 0) this.slowTimer -= dt;

        // 钢铁卫士：重力力场（静止区域，持续3秒）
        // 敌方主动进入力场半径内才会被禁锢；力场结束立即释放
        if (this.tauntTimer > 0) {
            this.tauntTimer -= dt;
            const fieldRange = PET_DATA[this.type].skillRange;
            const dx = opponent.x - this.fieldX;
            const dy = opponent.y - this.fieldY;
            const inField = Math.sqrt(dx * dx + dy * dy) <= fieldRange;

            if (inField) {
                // 每帧刷新0.15秒禁锢：留在场内持续被锁，离场后0.15秒自动恢复
                opponent.isImmobilized = true;
                opponent.immobilizeTimer = 0.15;
            }

            if (this.tauntTimer <= 0) {
                this.tauntTimer = 0;
                // 力场结束：若敌方仍被本力场禁锢，立即释放
                if (opponent.isImmobilized) {
                    opponent.isImmobilized = false;
                    opponent.immobilizeTimer = 0;
                }
            }
        }

        // 应用被动效果
        this.applyPassiveEffect();
    }

    /**
     * 跟随主人移动
     */
    followOwner() {
        const targetX = this.owner.x + (this.owner.facingRight ? this.offsetX : -this.offsetX);
        const targetY = this.owner.y + this.offsetY;
        
        // 平滑跟随
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;
        
        // 浮动动画
        this.y += Math.sin(Date.now() / 500) * 2;
    }

    /**
     * 应用被动效果
     */
    applyPassiveEffect() {
        const effect = this.passiveEffect;
        
        // 铁壁守护：主人减伤10%
        if (effect.damageReduction && !this.isRetreated) {
            this.owner.petDamageReduction = effect.damageReduction;
        }
        
        // 影之共鸣：冲刺速度提升15%
        if (effect.dashSpeedBonus && !this.isRetreated) {
            this.owner.petDashSpeedBonus = effect.dashSpeedBonus;
        }
        
        // 魔力源泉：能量恢复提升20%
        if (effect.energyRegenBonus && !this.isRetreated) {
            this.owner.petEnergyRegenBonus = effect.energyRegenBonus;
        }
        
        // 鹰眼视野：攻击距离提升15%
        if (effect.attackRangeBonus && !this.isRetreated) {
            this.owner.petAttackRangeBonus = effect.attackRangeBonus;
        }
    }

    /**
     * 执行宠物技能
     */
    performSkill(opponent, game) {
        if (this.skillCooldown > 0 || this.isRetreated) return false;

        // ButlerAI应急预案：仅在主人血量<30%时可发动（每局1次）
        if (this.type === 'butlerai' &&
            this.owner.health / this.owner.maxHealth >= PET_DATA.butlerai.skillHealTrigger) {
            return false;
        }

        this.skillCooldown = this.skillMaxCooldown;

        // 根据宠物类型执行不同技能
        if (this.type === 'steel_guardian') {
            return this.performTaunt(opponent, game);
        } else if (this.type === 'shadow_spirit') {
            return this.performMark(opponent, game);
        } else if (this.type === 'magic_fairy') {
            return this.performAmplify(opponent, game);
        } else if (this.type === 'hunter_falcon') {
            return this.performFalconAttack(opponent, game);
        } else if (this.type === 'codebot') {
            return this.performAutoComplete(opponent, game);
        } else if (this.type === 'pixelpixa') {
            return this.performPixelShield(opponent, game);
        } else if (this.type === 'datagrowth') {
            return this.performDataCollect(opponent, game);
        } else if (this.type === 'butlerai') {
            return this.performEmergencyHeal(opponent, game);
        }

        return false;
    }

    /**
     * 钢铁卫士：重力力场
     * 在宠物当前位置展开持续3秒的静止力场（半径100），
     * 敌方必须主动进入力场范围才会被禁锢（可攻击/放技能，但无法移动）
     */
    performTaunt(opponent, game) {
        const data = PET_DATA[this.type];

        // 部署静止力场（记录位置，不随宠物移动）
        this.tauntTimer = data.skillDuration;
        this.fieldX = this.x;
        this.fieldY = this.y;

        // 力场展开特效（蓝色脉冲 + 持续3秒的力场圈）
        if (game && game.particleSystem) {
            game.particleSystem.createPetTauntEffect(this.fieldX, this.fieldY, data.skillRange);
        }

        return true;
    }

    /**
     * 暗影精灵：影刃穿梭
     * 主人瞬移至敌方背后，1.5秒内无法被选中，
     * 并造成敌方【当前生命值】百分比伤害（铁壁7%/其他角色10%）
     */
    performMark(opponent, game) {
        const data = PET_DATA[this.type];

        // 主人瞬移到敌方背后
        const behindOffset = this.owner.facingRight ? -60 : 60;
        const teleportX = opponent.x + behindOffset;
        const clampedX = Math.max(this.owner.width / 2, Math.min(GAME_CONFIG.canvas.width - this.owner.width / 2, teleportX));

        // 记录原始位置用于粒子特效
        const fromX = this.owner.x;
        const fromY = this.owner.y;

        // 瞬移
        this.owner.x = clampedX;
        this.owner.y = opponent.y;

        // 无法选中状态（1.5秒，按方案配置）
        this.owner.isUntargetable = true;
        this.owner.untargetableTimer = data.untargetableDuration;

        // 百分比伤害：基于敌方当前生命值（对铁壁衰减为7%），至少造成1点伤害
        const percent = opponent.type === 'ironwall' ? data.ironwallDamagePercent : data.damagePercent;
        const percentDamage = opponent.health * percent;
        opponent.takeDamage(Math.max(1, Math.round(percentDamage)));

        // 残影标记（扩展/视觉用：宠物与目标间的连接线）
        this.markTarget = opponent;
        this.markTimer = data.markDuration;
        opponent.markedByPet = true;
        opponent.petMarkDamage = data.markDamage;

        // 添加穿梭命中特效与瞬移轨迹
        if (game && game.particleSystem) {
            game.particleSystem.createPetMarkEffect(opponent.x, opponent.y);
            game.particleSystem.createShadowTeleportComplete(fromX, fromY, this.owner.x, this.owner.y);
        }

        return true;
    }

    /**
     * 魔法小精灵：魔法护罩
     * 主人获得2秒魔法护罩，受到的伤害减少80%（护罩跟随主人，期间可自由行动）
     */
    performAmplify(opponent, game) {
        const data = PET_DATA[this.type];

        // 在主人身上施加护罩状态（由 Mecha.takeDamage 统一结算免伤）
        this.owner.petShieldTimer = data.skillDuration;
        this.owner.petShieldReduction = data.shieldReduction;
        this.amplifyTimer = data.skillDuration; // 宠物自身光柱视觉计时

        // 护罩展开特效
        if (game && game.particleSystem) {
            game.particleSystem.createPetShieldEffect(this.owner.x, this.owner.y);
        }

        return true;
    }

    /**
     * 猎鹰：猎鹰庇护
     * 主人进入1.5秒无敌状态，不受任何伤害，期间仍可移动/攻击/放技能，
     * 且无法被敌方任何技能打破
     */
    performFalconAttack(opponent, game) {
        const data = PET_DATA[this.type];

        // 无敌状态（由 Mecha.takeDamage 统一拦截伤害）
        this.owner.isInvincible = true;
        this.owner.invincibleTimer = data.invincibleDuration;

        // 无敌庇护特效（绿色护盾 + 金光爆发）
        if (game && game.particleSystem) {
            game.particleSystem.createPetInvincibleEffect(this.owner.x, this.owner.y);
        }

        return true;
    }

    /**
     * CodeBot：自动补全
     * 向敌方发射代码飞弹（伤害=主人攻击力），30%概率追加1次攻击（双输出流）
     */
    performAutoComplete(opponent, game) {
        const data = PET_DATA[this.type];

        // 30%概率追加攻击：一次施放射出两发
        const shots = Math.random() < data.skillChance ? 2 : 1;
        const hit = !opponent.isUntargetable; // 敌方无法选中时落空

        if (hit) {
            for (let i = 0; i < shots; i++) {
                opponent.takeDamage(this.owner.attack);
            }
        }

        // 绿色代码飞弹轨迹 + 命中爆裂
        if (game && game.particleSystem) {
            game.particleSystem.createCodebotEffect(this.x, this.y, opponent.x, opponent.y, shots, hit);
        }

        return true;
    }

    /**
     * PixelPixa：像素护盾
     * 主人获得持续5秒的像素护盾，抵挡1次攻击（最多吸收15点伤害），破碎时像素飞散
     */
    performPixelShield(opponent, game) {
        const data = PET_DATA[this.type];

        // 护盾状态（由 Mecha.takeDamage 统一结算吸收，到期自动消失）
        this.owner.pixelShieldHP = data.skillShieldHP;
        this.owner.pixelShieldTimer = data.skillDuration;

        // 像素方块汇聚特效
        if (game && game.particleSystem) {
            game.particleSystem.createPixelShieldEffect(this.owner.x, this.owner.y);
        }

        return true;
    }

    /**
     * DataGrowth：数据采集
     * 收集战斗数据，主人攻击力与移动速度临时+10%，持续5秒
     */
    performDataCollect(opponent, game) {
        const data = PET_DATA[this.type];

        // 属性增益（由 Mecha.update 按倍率重算攻击力与移速，到期自动回落）
        this.owner.dataBuffTimer = data.skillBuffDuration;
        this.owner.dataBuffValue = data.skillBuffValue;

        // 蓝色数据流上升 + 属性提升提示
        if (game && game.particleSystem) {
            game.particleSystem.createDataBuffEffect(this.owner.x, this.owner.y);
        }

        return true;
    }

    /**
     * ButlerAI：应急预案
     * 主人血量<30%时自动恢复20HP（每局1次，由60秒冷却限制）；
     * 也可在满足条件时手动触发
     */
    performEmergencyHeal(opponent, game) {
        const data = PET_DATA[this.type];

        const before = this.owner.health;
        this.owner.health = Math.min(this.owner.maxHealth, this.owner.health + data.skillHealAmount);
        const healed = Math.round(this.owner.health - before);
        this.skillCooldown = this.skillMaxCooldown; // 每局1次（60秒冷却）

        // 金色恢复光点 + 恢复量提示
        if (game && game.particleSystem && healed > 0) {
            game.particleSystem.createButlerHealEffect(this.owner.x, this.owner.y, healed);
        }

        return true;
    }

    /**
     * 宠物受到伤害
     */
    takeDamage(damage) {
        // 力场展开期间宠物更坚固，伤害减半
        if (this.tauntTimer > 0) {
            damage *= 0.5;
        }

        this.health -= damage;

        if (this.health <= 0) {
            this.retreat();
        }
    }

    /**
     * 宠物撤退
     */
    retreat() {
        this.isRetreated = true;
        this.retreatTimer = 15;
        this.health = 0;

        // 清除所有技能效果
        this.tauntTimer = 0;
        this.markTarget = null;
        this.amplifyTimer = 0;
        this.slowTimer = 0;

        // 清除主人身上的宠物被动加成（否则撤退后被动仍残留）
        this.owner.petDamageReduction = 0;
        this.owner.petDashSpeedBonus = 0;
        this.owner.petEnergyRegenBonus = 0;
        this.owner.petAttackRangeBonus = 0;
    }

    /**
     * 宠物复活
     */
    respawn() {
        this.isRetreated = false;
        this.health = this.maxHealth;
        this.skillCooldown = 0;
    }

    /**
     * 绘制宠物
     */
    draw(ctx) {
        if (this.isRetreated) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // 根据宠物类型绘制不同外观
        if (this.type === 'steel_guardian') {
            this.drawSteelGuardian(ctx);
        } else if (this.type === 'shadow_spirit') {
            this.drawShadowSpirit(ctx);
        } else if (this.type === 'magic_fairy') {
            this.drawMagicFairy(ctx);
        } else if (this.type === 'hunter_falcon') {
            this.drawHunterFalcon(ctx);
        } else if (this.type === 'codebot') {
            this.drawCodebot(ctx);
        } else if (this.type === 'pixelpixa') {
            this.drawPixelpixa(ctx);
        } else if (this.type === 'datagrowth') {
            this.drawDatagrowth(ctx);
        } else if (this.type === 'butlerai') {
            this.drawButlerAI(ctx);
        }

        ctx.restore();
    }

    /**
     * 绘制钢铁卫士
     */
    drawSteelGuardian(ctx) {
        // 悬浮球体
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        // 主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(3, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 重力力场状态：单眼发出强光与脉冲环
        if (this.tauntTimer > 0) {
            ctx.strokeStyle = 'rgba(255, 204, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 15 + Math.sin(Date.now() / 50) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * 绘制暗影精灵
     */
    drawShadowSpirit(ctx) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        
        // 飘带状身体
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-15 + i * 3, -20 + i * 5, 6, 40 - i * 5);
        }
        
        // 粉色核心
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 标记状态：连接线到目标
        if (this.markTarget && this.markTimer > 0) {
            ctx.strokeStyle = 'rgba(255, 68, 136, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.markTarget.x - this.x, this.markTarget.y - this.y);
            ctx.stroke();
        }
    }

    /**
     * 绘制魔法小精灵
     */
    drawMagicFairy(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // 翅膀
        ctx.fillStyle = 'rgba(170, 68, 255, 0.5)';
        const wingAngle = Math.sin(Date.now() / 100) * 0.3;
        ctx.save();
        ctx.rotate(wingAngle);
        ctx.fillRect(-12, -8, 10, 16);
        ctx.restore();
        ctx.save();
        ctx.rotate(-wingAngle);
        ctx.fillRect(2, -8, 10, 16);
        ctx.restore();
        
        // 主体光球
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 护罩状态：紫色光柱连接主人
        if (this.amplifyTimer > 0) {
            ctx.fillStyle = 'rgba(170, 68, 255, 0.3)';
            ctx.fillRect(-10, -100, 20, 100);
        }
    }

    /**
     * 绘制猎鹰
     */
    drawHunterFalcon(ctx) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        
        // 身体
        ctx.fillStyle = this.color;
        ctx.fillRect(-12, -6, 24, 12);
        
        // 翅膀
        const wingFlap = Math.sin(Date.now() / 80) * 10;
        ctx.fillStyle = '#88ff88';
        ctx.save();
        ctx.rotate(wingFlap * Math.PI / 180);
        ctx.fillRect(-18, -15, 12, 30);
        ctx.restore();
        ctx.save();
        ctx.rotate(-wingFlap * Math.PI / 180);
        ctx.fillRect(6, -15, 12, 30);
        ctx.restore();
        
        // 眼睛
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(-6, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 庇护状态：主人无敌期间，猎鹰盘旋散发绿色光环
        if (this.owner.invincibleTimer > 0) {
            ctx.fillStyle = 'rgba(68, 204, 68, 0.4)';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(
                    Math.sin(Date.now() / 200 + i) * 20,
                    Math.cos(Date.now() / 200 + i) * 20,
                    3, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    /**
     * 绘制CodeBot（绿色方形小机器人：屏幕脸+天线+悬浮推进光）
     */
    drawCodebot(ctx) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // 方形身体
        ctx.fillStyle = this.color;
        ctx.fillRect(-9, -8, 18, 16);

        // 屏幕脸（深色面板）
        ctx.fillStyle = '#0a2a1a';
        ctx.fillRect(-6, -5, 12, 8);

        // 像素眼睛（周期性闪烁）
        if (Math.sin(Date.now() / 300) > -0.9) {
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(-4, -3, 3, 4);
            ctx.fillRect(1, -3, 3, 4);
        }

        // 天线 + 信号灯
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, -14);
        ctx.stroke();
        ctx.fillStyle = Math.sin(Date.now() / 200) > 0 ? '#ffcc00' : '#884400';
        ctx.fillRect(-2, -17, 4, 4);

        // 底部悬浮推进光
        ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.fillRect(-5, 10, 10, 3 + Math.sin(Date.now() / 150) * 2);
    }

    /**
     * 绘制PixelPixa（粉色像素方块精灵：主体+环绕小像素块）
     */
    drawPixelpixa(ctx) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;

        // 中心大方块
        ctx.fillStyle = this.color;
        ctx.fillRect(-8, -8, 16, 16);

        // 环绕小像素块（旋转）
        ctx.fillStyle = '#ffddff';
        for (let i = 0; i < 4; i++) {
            const angle = Date.now() / 400 + (Math.PI * 2 * i) / 4;
            ctx.fillRect(Math.cos(angle) * 14 - 2, Math.sin(angle) * 14 - 2, 5, 5);
        }

        // 白色像素眼
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5, -4, 3, 5);
        ctx.fillRect(2, -4, 3, 5);

        // 主人护盾激活时：中心白光闪烁
        if (this.owner.pixelShieldTimer > 0 && this.owner.pixelShieldHP > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 80) * 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-4, -4, 8, 8);
            ctx.globalAlpha = 1;
        }
    }

    /**
     * 绘制DataGrowth（蓝色数据晶核：菱形核心+环绕数据块，增益时高速旋转）
     */
    drawDatagrowth(ctx) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;

        // 菱形核心
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(9, 0);
        ctx.lineTo(0, 12);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();

        // 内部数据纹路（十字）
        ctx.strokeStyle = '#aaccff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.moveTo(-5, 0);
        ctx.lineTo(5, 0);
        ctx.stroke();

        // 环绕数据块（增益激活时加速旋转并变亮）
        const buffed = this.owner.dataBuffTimer > 0;
        ctx.fillStyle = buffed ? '#88ccff' : '#4466aa';
        for (let i = 0; i < 3; i++) {
            const angle = Date.now() / (buffed ? 150 : 500) + (Math.PI * 2 * i) / 3;
            ctx.fillRect(Math.cos(angle) * 16 - 2, Math.sin(angle) * 16 - 2, 4, 4);
        }
    }

    /**
     * 绘制ButlerAI（金色管家机器人：圆顶头+单片眼镜+领结）
     */
    drawButlerAI(ctx) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // 圆顶头部 + 方形下颌
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -4, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-9, -4, 18, 10);

        // 单片眼镜眼
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(3, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(3, -2, 4, 0, Math.PI * 2);
        ctx.stroke();

        // 红色领结
        ctx.fillStyle = '#ff4488';
        ctx.fillRect(-6, 7, 4, 3);
        ctx.fillRect(2, 7, 4, 3);
        ctx.fillRect(-3, 7, 6, 2);

        // 应急预案刚触发时：白光一闪
        if (this.skillCooldown > this.skillMaxCooldown - 0.3) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Pet };
}