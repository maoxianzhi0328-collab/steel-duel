/**
 * 粒子系统模块
 * 处理所有粒子特效
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * 添加命中特效粒子
     */
    addHitEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 250,
                vy: (Math.random() - 0.5) * 250,
                life: 0.5,
                color: '#ffcc00',
                size: 4,
                type: 'normal'
            });
        }
    }

    /**
     * 添加技能粒子（旧版本兼容）
     */
    addSkillParticle(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.4,
                color: '#aa44ff',
                size: 4,
                type: 'normal'
            });
        }
    }

    /**
     * 添加魔法粒子（华丽特效）
     */
    addMagicParticle(x, y, vx = 0, vy = 0) {
        // 随机选择魔法颜色
        const colors = ['#aa44ff', '#8822cc', '#ff44aa', '#44aaff', '#ffaa44', '#44ffaa'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        // 随机大小
        const size = 3 + Math.random() * 4;

        // 添加重力效果
        const hasGravity = Math.random() > 0.5;

        this.particles.push({
            x: x,
            y: y,
            vx: vx + (Math.random() - 0.5) * 20,
            vy: vy + (Math.random() - 0.5) * 20,
            life: 0.8 + Math.random() * 0.4,
            color: color,
            size: size,
            hasGravity: hasGravity,
            gravity: hasGravity ? 200 : 0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 10,
            type: 'magic'
        });
    }

    /**
     * 创建法师技能的完整粒子效果
     */
    createMageSkillEffect(x, y, radius) {
        // 外圈粒子（圆形扩散）
        for (let i = 0; i < 32; i++) {
            const angle = (Math.PI * 2 * i) / 32;
            this.addMagicParticle(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                Math.cos(angle) * 50,
                Math.sin(angle) * 50
            );
        }

        // 内圈粒子（密集爆发）
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            this.addMagicParticle(
                x + Math.cos(angle) * radius * 0.5,
                y + Math.sin(angle) * radius * 0.5,
                Math.cos(angle) * 80,
                Math.sin(angle) * 80
            );
        }

        // 中心爆发粒子
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            this.addMagicParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }

        // 垂直喷射粒子
        for (let i = 0; i < 10; i++) {
            this.addMagicParticle(
                x + (Math.random() - 0.5) * 40,
                y,
                (Math.random() - 0.5) * 30,
                -150 - Math.random() * 50
            );
        }
    }

    /**
     * 创建铁壁技能粒子效果 - 铁山靠（重型冲击波）
     */
    createIronwallSkillEffect(x, y, range, facingRight) {
        const direction = facingRight ? 1 : -1;

        // 主体冲击波粒子
        for (let i = 0; i < 30; i++) {
            const offset = i * 3;
            const angle = (Math.random() - 0.5) * Math.PI * 0.6;
            const speed = 150 + Math.random() * 100;
            const size = 5 + Math.random() * 5;

            this.particles.push({
                x: x + direction * offset,
                y: y + (Math.random() - 0.5) * 60,
                vx: direction * speed * Math.cos(angle),
                vy: speed * Math.sin(angle) * 0.5,
                life: 0.6 + Math.random() * 0.3,
                color: i % 2 === 0 ? '#4488ff' : '#2266cc',
                size: size,
                type: 'ironwave',
                rotation: 0
            });
        }

        // 地面震荡波
        for (let i = 0; i < 20; i++) {
            const angle = Math.PI * 2 * (i / 20);
            this.particles.push({
                x: x,
                y: y + 25,
                vx: Math.cos(angle) * 80,
                vy: Math.sin(angle) * 30 - 50,
                life: 0.8,
                color: '#666666',
                size: 4,
                type: 'shockwave',
                hasGravity: true,
                gravity: 300
            });
        }

        // 碎片粒子
        for (let i = 0; i < 15; i++) {
            const angle = (Math.random() - 0.5) * Math.PI * 0.8;
            this.particles.push({
                x: x + direction * (Math.random() * 40),
                y: y + (Math.random() - 0.5) * 40,
                vx: direction * (100 + Math.random() * 150) * Math.cos(angle),
                vy: -100 - Math.random() * 150,
                life: 1.0,
                color: '#8B5A2B',
                size: 3 + Math.random() * 3,
                type: 'debris',
                hasGravity: true,
                gravity: 400,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 15
            });
        }

        // 金属闪光
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: x + direction * (Math.random() * range * 0.5),
                y: y + (Math.random() - 0.5) * 50,
                vx: 0,
                vy: 0,
                life: 0.3,
                color: '#FFFFFF',
                size: 2,
                type: 'spark',
                flash: true
            });
        }
    }

    /**
     * 创建影刺技能粒子效果 - 影刃风暴（锁定飞刀投掷）
     */
    createShadowKnifeEffect(startX, startY, targetX, targetY, facingRight, hit) {
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const angle = Math.atan2(dy, dx);

        // 飞行轨迹：粉色残影线
        const trailCount = 12;
        for (let i = 0; i < trailCount; i++) {
            const progress = i / trailCount;
            this.particles.push({
                x: startX + dx * progress,
                y: startY + dy * progress,
                vx: 0,
                vy: 0,
                life: 0.3 + (trailCount - i) * 0.015,
                color: `rgba(255, 68, 136, ${0.7 - progress * 0.3})`,
                size: 8 - i * 0.4,
                type: 'slash'
            });
        }

        // 飞刀主体：沿飞行方向旋转的菱形刀刃
        this.particles.push({
            x: startX,
            y: startY,
            vx: (dx / dist) * 600,
            vy: (dy / dist) * 600,
            life: dist / 600,
            color: '#ff4488',
            size: 12,
            type: 'knife',
            rotation: angle,
            rotationSpeed: 12
        });

        // 命中效果
        if (hit) {
            // 爆炸火花
            for (let i = 0; i < 25; i++) {
                const sparkAngle = Math.random() * Math.PI * 2;
                const speed = 80 + Math.random() * 150;
                this.particles.push({
                    x: targetX,
                    y: targetY,
                    vx: Math.cos(sparkAngle) * speed,
                    vy: Math.sin(sparkAngle) * speed,
                    life: 0.5,
                    color: i % 2 === 0 ? '#ff4488' : '#cc2266',
                    size: 2 + Math.random() * 4,
                    type: 'slash'
                });
            }

            // 血色冲击波
            for (let i = 0; i < 15; i++) {
                const waveAngle = (Math.PI * 2 * i) / 15;
                this.particles.push({
                    x: targetX,
                    y: targetY,
                    vx: Math.cos(waveAngle) * 120,
                    vy: Math.sin(waveAngle) * 120,
                    life: 0.4,
                    color: '#ff6699',
                    size: 4,
                    type: 'slash'
                });
            }
        }
    }

    /**
     * 创建影刺瞬移预警特效（显示即将瞬移到的位置）
     */
    createShadowTeleportWarning(fromX, fromY, toX, toY, duration) {
        // 在起点显示即将消失的闪烁虚影
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 20;
            this.particles.push({
                x: fromX + Math.cos(angle) * radius,
                y: fromY + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                life: duration,
                color: 'rgba(255, 68, 136, 0.6)',
                size: 4 + Math.random() * 4,
                type: 'warp',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }

        // 在目标位置显示明显的粉红色圆形预警圈
        this.particles.push({
            x: toX,
            y: toY,
            vx: 0,
            vy: 0,
            life: duration,
            color: '#ff4488',
            size: 60,
            type: 'teleport_warning',
            rotation: 0,
            rotationSpeed: 8
        });

        // 目标位置中心脉冲点
        this.particles.push({
            x: toX,
            y: toY,
            vx: 0,
            vy: 0,
            life: duration,
            color: '#ff6699',
            size: 20,
            type: 'teleport_center',
            rotation: 0,
            rotationSpeed: -15
        });

        // 目标位置周围的闪烁星点
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const radius = 50;
            this.particles.push({
                x: toX + Math.cos(angle) * radius,
                y: toY + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                life: duration,
                color: '#ff88aa',
                size: 6,
                type: 'spark',
                rotation: angle,
                rotationSpeed: 6
            });
        }
    }

    /**
     * 创建影刺瞬移完成特效（瞬移轨迹和攻击特效）
     */
    createShadowTeleportComplete(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // 瞬移轨迹：密集的粉色残影连线
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            this.particles.push({
                x: fromX + dx * progress,
                y: fromY + dy * progress,
                vx: 0,
                vy: 0,
                life: 0.4 + (steps - i) * 0.02,
                color: `rgba(255, 68, 136, ${0.9 - progress * 0.4})`,
                size: 30 - i * 1.2,
                type: 'afterimage'
            });
        }

        // 起点爆炸
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            this.particles.push({
                x: fromX,
                y: fromY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6,
                color: '#ff4488',
                size: 3 + Math.random() * 4,
                type: 'warp',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 12
            });
        }

        // 终点到达爆炸
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            this.particles.push({
                x: toX,
                y: toY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                color: '#cc2266',
                size: 2 + Math.random() * 4,
                type: 'slash'
            });
        }

        // 攻击方向的速度线
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 0.6 - Math.PI * 0.3;
            const lineStart = toX + (Math.random() - 0.5) * 40;
            const lineY = toY + (Math.random() - 0.5) * 60;
            this.particles.push({
                x: lineStart,
                y: lineY,
                vx: Math.cos(angle) * 250,
                vy: Math.sin(angle) * 250,
                life: 0.4,
                color: '#ff6699',
                size: 2,
                type: 'speedline'
            });
        }
    }

    /**
     * 宠物技能特效 - 重力力场（钢铁卫士）
     * 在部署位置生成蓝色脉冲波 + 持续3秒的蓝色网格力场圈
     */
    createPetTauntEffect(x, y, range) {
        // 强烈的蓝色脉冲波
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 * i) / 40;
            const speed = 150 + Math.random() * 100;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6,
                color: i % 2 === 0 ? '#4488ff' : '#88ccff',
                size: 4 + Math.random() * 4,
                type: 'spark',
                rotation: angle,
                rotationSpeed: 5
            });
        }

        // 力场边界圈（持续3秒，与力场持续时间一致；静止在部署位置）
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 3.0,
            maxLife: 3.0,
            color: '#4488ff',
            size: range,
            type: 'pet_taunt_ring',
            rotation: 0,
            rotationSpeed: 1.2
        });

        // 力场边缘能量节点（8个蓝色菱形节点绕圈旋转）
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
                x: x + Math.cos(angle) * range,
                y: y + Math.sin(angle) * range,
                vx: 0,
                vy: 0,
                life: 3.0,
                color: '#88ccff',
                size: 6,
                type: 'pet_taunt_node',
                rotation: angle,
                rotationSpeed: 1.2,
                orbitRadius: range,
                centerX: x,
                centerY: y
            });
        }
    }

    /**
     * 宠物技能特效 - 影刃穿梭命中印记（暗影精灵）
     */
    createPetMarkEffect(x, y) {
        // 黑色印记漩涡
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const radius = 30;
            this.particles.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: Math.cos(angle) * 30,
                vy: Math.sin(angle) * 30,
                life: 0.8,
                color: '#ff4488',
                size: 6,
                type: 'slash',
                rotation: angle,
                rotationSpeed: 4
            });
        }

        // 中心黑色"眼睛"标记
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 5.0,
            color: '#ff66aa',
            size: 25,
            type: 'pet_mark_eye',
            rotation: 0,
            rotationSpeed: 2
        });

        // 印记铭刻特效
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 80,
                vy: Math.sin(angle) * 80,
                life: 0.5,
                color: '#cc2266',
                size: 3,
                type: 'magic',
                rotation: angle,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
    }

    /**
     * 宠物技能特效 - 魔法护罩（魔法小精灵）
     * 紫色能量爆发 + 扩散护罩波（持续的跟随护罩由 Mecha.drawPetStatusEffects 渲染）
     */
    createPetShieldEffect(x, y) {
        // 紫色魔法能量爆发
        for (let i = 0; i < 36; i++) {
            const angle = (Math.PI * 2 * i) / 36;
            const speed = 80 + Math.random() * 120;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.7,
                color: i % 2 === 0 ? '#aa44ff' : '#cc88ff',
                size: 4 + Math.random() * 3,
                type: 'magic',
                rotation: angle,
                rotationSpeed: (Math.random() - 0.5) * 8
            });
        }

        // 扩散的护罩波（0.6秒内从20扩散到46，随后由角色身上的常驻护罩承接）
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 0.6,
            maxLife: 0.6,
            color: '#cc88ff',
            size: 40,
            type: 'pet_shield_ring',
            rotation: 0,
            rotationSpeed: 0
        });

        // 向上飘散的紫色星尘
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 20,
                vy: -40 - Math.random() * 30,
                life: 0.8,
                color: '#ddbbff',
                size: 3,
                type: 'magic',
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 6
            });
        }
    }

    /**
     * 宠物技能特效 - 猎鹰庇护（猎鹰）
     * 绿色能量护盾爆发 + 金色无敌光环扩散（常驻光环由 Mecha.drawPetStatusEffects 渲染）
     */
    createPetInvincibleEffect(x, y) {
        // 金色能量爆发（无敌感）
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 100 + Math.random() * 140;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6,
                color: i % 3 === 0 ? '#ffdd66' : '#88ff88',
                size: 3 + Math.random() * 3,
                type: 'spark',
                rotation: angle,
                rotationSpeed: 6
            });
        }

        // 绿色护盾扩散波
        this.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 0.6,
            maxLife: 0.6,
            color: '#44cc44',
            size: 46,
            type: 'pet_invincible_ring',
            rotation: 0,
            rotationSpeed: 0
        });

        // 飘落的绿色羽毛
        for (let i = 0; i < 16; i++) {
            const featherAngle = (Math.PI * 2 * i) / 16;
            this.particles.push({
                x: x + Math.cos(featherAngle) * 30,
                y: y + Math.sin(featherAngle) * 30,
                vx: Math.cos(featherAngle) * 40,
                vy: -30 - Math.random() * 40,
                life: 1.0,
                color: '#88ff88',
                size: 4,
                type: 'pet_feather',
                rotation: featherAngle,
                rotationSpeed: (Math.random() - 0.5) * 8
            });
        }
    }

    // 保留旧方法用于向后兼容
    createShadowSkillEffect(fromX, toX, y, facingRight) {
        const direction = facingRight ? 1 : -1;

        // 瞬移轨迹残影
        const steps = 15;
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            const x = fromX + (toX - fromX) * progress;

            this.particles.push({
                x: x,
                y: y + (Math.random() - 0.5) * 20,
                vx: 0,
                vy: 0,
                life: 0.4 + (steps - i) * 0.02,
                color: 'rgba(255, 68, 136, ' + (0.8 - progress * 0.5) + ')',
                size: 30 - i * 1.5,
                type: 'afterimage',
                shape: 'rect'
            });
        }

        // 瞬移起点爆炸
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            this.particles.push({
                x: fromX,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,
                color: '#ff4488',
                size: 3 + Math.random() * 3,
                type: 'warp',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }

        // 斩击轨迹粒子
        for (let i = 0; i < 25; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = 200 + Math.random() * 150;
            this.particles.push({
                x: toX,
                y: y,
                vx: direction * speed * Math.cos(angle),
                vy: speed * Math.sin(angle) + 50,
                life: 0.6,
                color: '#cc2266',
                size: 2 + Math.random() * 3,
                type: 'slash',
                rotation: angle
            });
        }

        // 高速残影线
        for (let i = 0; i < 10; i++) {
            const startX = fromX + (toX - fromX) * Math.random();
            this.particles.push({
                x: startX,
                y: y + (Math.random() - 0.5) * 40,
                vx: direction * 300,
                vy: (Math.random() - 0.5) * 50,
                life: 0.2,
                color: '#ff66aa',
                size: 1,
                type: 'speedline'
            });
        }
    }

    /**
     * 创建射手技能粒子效果 - 穿心箭
     * @param {boolean} hit 是否命中（未命中时只渲染飞行轨迹，不生成冲击与星星）
     */
    createArcherSkillEffect(startX, startY, targetX, targetY, facingRight, hit = true) {
        const direction = facingRight ? 1 : -1;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        // 箭矢轨迹
        const arrowSteps = 20;
        for (let i = 0; i < arrowSteps; i++) {
            const progress = i / arrowSteps;
            const x = startX + dx * progress;
            const y = startY + dy * progress;

            this.particles.push({
                x: x,
                y: y + (Math.random() - 0.5) * 10,
                vx: 0,
                vy: 0,
                life: 0.3 + (arrowSteps - i) * 0.02,
                color: 'rgba(68, 204, 68, ' + (0.9 - progress * 0.5) + ')',
                size: 6,
                type: 'arrowtrail'
            });
        }

        // 箭矢主体
        this.particles.push({
            x: startX,
            y: startY,
            vx: normalizedDx * 600,
            vy: normalizedDy * 600,
            life: distance / 600,
            color: '#44cc44',
            size: 8,
            type: 'arrow',
            rotation: Math.atan2(dy, dx)
        });

        // 风痕效果
        for (let i = 0; i < 15; i++) {
            const offset = Math.random() * distance;
            this.particles.push({
                x: startX + normalizedDx * offset,
                y: startY + normalizedDy * offset + (Math.random() - 0.5) * 30,
                vx: normalizedDx * 50,
                vy: (Math.random() - 0.5) * 50,
                life: 0.3,
                color: 'rgba(100, 255, 100, 0.5)',
                size: 2,
                type: 'windtrail'
            });
        }

        // 以下粒子仅在命中时生成
        if (hit) {
            // 命中点冲击波
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 80 + Math.random() * 120;
                this.particles.push({
                    x: targetX,
                    y: targetY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.6,
                    color: i % 2 === 0 ? '#44cc44' : '#88ff88',
                    size: 3 + Math.random() * 3,
                    type: 'impact'
                });
            }

            // 眩晕效果粒子（星星）
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const radius = 40;
                this.particles.push({
                    x: targetX + Math.cos(angle) * radius,
                    y: targetY + Math.sin(angle) * radius,
                    vx: Math.cos(angle) * 20,
                    vy: Math.sin(angle) * 20,
                    life: 1.2,
                    color: '#ffcc00',
                    size: 4,
                    type: 'star',
                    rotation: angle,
                    rotationSpeed: 3
                });
            }
        }
    }

    /**
     * 创建法师普攻激光的光束火花
     * @param {number} x1 起点X @param {number} y1 起点Y
     * @param {number} x2 终点X @param {number} y2 终点Y
     * @param {boolean} hit 是否命中（命中时终点额外爆出火花）
     */
    createLaserBeamEffect(x1, y1, x2, y2, hit = false) {
        // 沿光束分布的紫色能量火花
        for (let i = 0; i < 10; i++) {
            const t = Math.random();
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 14;
            this.particles.push({
                x: px,
                y: py,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 80 - 20,
                life: 0.25 + Math.random() * 0.2,
                color: Math.random() > 0.4 ? '#cc88ff' : '#ffffff',
                size: 2 + Math.random() * 3,
                type: 'magic',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 12
            });
        }

        // 命中点爆出更密集的火花
        if (hit) {
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 60 + Math.random() * 100;
                this.particles.push({
                    x: x2,
                    y: y2,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.35,
                    color: Math.random() > 0.5 ? '#aa44ff' : '#ffffff',
                    size: 2 + Math.random() * 3,
                    type: 'magic',
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 14
                });
            }
        }
    }

    /**
     * 更新所有粒子
     */
    update(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            // 魔法粒子的特殊物理效果
            if (p.hasGravity) {
                p.vy += p.gravity * dt;
            }

            // 更新旋转（箭矢等固定朝向的粒子没有 rotationSpeed，不累加）
            if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
                p.rotation += p.rotationSpeed * dt;
            }

            return p.life > 0;
        });
    }

    /**
     * 渲染所有粒子
     */
    draw(ctx) {
        this.particles.forEach(p => {
            const alpha = p.life / (p.life > 0.6 ? 0.8 : 0.5);
            ctx.globalAlpha = alpha;

            if (p.type === 'magic') {
                // 魔法粒子的特殊渲染
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                // 绘制发光效果
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;

                // 绘制主体
                ctx.fillStyle = p.color;
                const size = p.size || 4;
                ctx.fillRect(-size / 2, -size / 2, size, size);

                // 绘制十字光芒
                ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.5) + ')';
                ctx.lineWidth = 1;
                const crossSize = size * 1.5;
                ctx.beginPath();
                ctx.moveTo(-crossSize, 0);
                ctx.lineTo(crossSize, 0);
                ctx.moveTo(0, -crossSize);
                ctx.lineTo(0, crossSize);
                ctx.stroke();

                ctx.restore();
            } else if (p.type === 'ironwave') {
                // 铁壁冲击波粒子
                ctx.save();
                ctx.translate(p.x, p.y);

                // 发光效果
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;

                // 绘制能量块
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

                // 内部高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(-p.size / 4, -p.size / 4, p.size / 2, p.size / 2);

                ctx.restore();
            } else if (p.type === 'afterimage') {
                // 影刺残影粒子
                ctx.save();
                ctx.translate(p.x, p.y);

                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 2);

                ctx.restore();
            } else if (p.type === 'slash') {
                // 斩击粒子
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.shadowBlur = 5;
                ctx.shadowColor = p.color;

                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);

                ctx.restore();
            } else if (p.type === 'warp') {
                // 瞬移粒子
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;

                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(-p.size, -p.size, p.size * 2, p.size * 2);

                ctx.restore();
            } else if (p.type === 'speedline') {
                // 高速线
                ctx.save();
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
                ctx.lineTo(p.x + p.vx * 0.05, p.y + p.vy * 0.05);
                ctx.stroke();
                ctx.restore();
            } else if (p.type === 'spark') {
                // 闪光粒子
                ctx.save();
                ctx.translate(p.x, p.y);

                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;

                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

                ctx.restore();
            } else if (p.type === 'debris') {
                // 碎片粒子
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

                ctx.restore();
            } else if (p.type === 'shockwave') {
                // 震荡波粒子
                ctx.fillStyle = p.color;
                const size = p.size || 4;
                ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
            } else if (p.type === 'arrow') {
                // 穿心箭箭矢主体（沿飞行方向旋转）
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.shadowBlur = 8;
                ctx.shadowColor = '#88ff88';

                // 箭杆
                ctx.fillStyle = '#ddbb77';
                ctx.fillRect(-14, -1.5, 22, 3);
                // 箭头（绿色三角）
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(16, 0);
                ctx.lineTo(6, -5);
                ctx.lineTo(6, 5);
                ctx.closePath();
                ctx.fill();
                // 尾羽
                ctx.fillStyle = '#88ff88';
                ctx.beginPath();
                ctx.moveTo(-14, 0);
                ctx.lineTo(-21, -5);
                ctx.lineTo(-16, 0);
                ctx.lineTo(-21, 5);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            } else if (p.type === 'knife') {
                // 影刺飞刀：旋转的菱形刀刃
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ff6699';

                // 刀刃主体：菱形
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(p.size, 0);
                ctx.lineTo(0, -p.size / 3);
                ctx.lineTo(-p.size * 0.7, 0);
                ctx.lineTo(0, p.size / 3);
                ctx.closePath();
                ctx.fill();

                // 刀刃高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(p.size * 0.6, 0);
                ctx.lineTo(0, -p.size / 6);
                ctx.lineTo(-p.size * 0.3, 0);
                ctx.lineTo(0, p.size / 6);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            } else if (p.type === 'teleport_warning') {
                // 瞬移预警圈：粉红色旋转圆环
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;
                
                // 外圈
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // 内圈
                ctx.strokeStyle = 'rgba(255, 136, 170, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                
                // 十字标记
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-p.size * 0.4, 0);
                ctx.lineTo(p.size * 0.4, 0);
                ctx.moveTo(0, -p.size * 0.4);
                ctx.lineTo(0, p.size * 0.4);
                ctx.stroke();
                
                ctx.restore();
            } else if (p.type === 'teleport_center') {
                // 瞬移中心脉冲点
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                
                ctx.shadowBlur = 20;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                
                // 中心脉冲
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 白色核心
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            } else if (p.type === 'pet_taunt_ring') {
                // 重力力场圈：蓝色半透明区域 + 旋转网格 + 边界
                const fade = p.maxLife ? Math.min(1, p.life / 0.5) : 1; // 最后0.5秒渐隐
                ctx.save();
                ctx.translate(p.x, p.y);

                // 力场半透明填充
                ctx.fillStyle = `rgba(68, 136, 255, ${0.08 * fade})`;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.rotate(p.rotation || 0);
                ctx.strokeStyle = `rgba(68, 136, 255, ${0.35 * fade})`;
                ctx.lineWidth = 1;
                // 网格十字线（4条直径）
                for (let i = 0; i < 4; i++) {
                    const a = (Math.PI * i) / 4;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a) * -p.size, Math.sin(a) * -p.size);
                    ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
                    ctx.stroke();
                }
                ctx.restore();

                // 外边界
                ctx.strokeStyle = `rgba(100, 170, 255, ${0.9 * fade})`;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 16;
                ctx.shadowColor = '#4488ff';
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.stroke();

                // 内圈
                ctx.strokeStyle = `rgba(136, 204, 255, ${0.5 * fade})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            } else if (p.type === 'pet_taunt_node') {
                // 重力力场边缘能量节点：沿边界绕行的蓝色菱形
                const fade = p.maxLife ? Math.min(1, p.life / 0.5) : 1;
                ctx.save();
                const angle = p.rotation || 0;
                const nx = (p.centerX || p.x) + Math.cos(angle) * (p.orbitRadius || 0);
                const ny = (p.centerY || p.y) + Math.sin(angle) * (p.orbitRadius || 0);
                ctx.translate(nx, ny);

                ctx.shadowBlur = 10;
                ctx.shadowColor = '#88ccff';
                ctx.fillStyle = `rgba(150, 210, 255, ${fade})`;
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size * 0.6, 0);
                ctx.lineTo(0, p.size);
                ctx.lineTo(-p.size * 0.6, 0);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            } else if (p.type === 'pet_shield_ring') {
                // 魔法护罩展开波：紫色圆环由内向外扩散
                const progress = 1 - p.life / (p.maxLife || 0.6);
                const radius = 20 + progress * p.size;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 4 * (1 - progress * 0.5);
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#aa44ff';
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            } else if (p.type === 'pet_invincible_ring') {
                // 猎鹰庇护展开波：绿金双层圆环扩散
                const progress = 1 - p.life / (p.maxLife || 0.6);
                const radius = 18 + progress * p.size;
                ctx.save();
                ctx.translate(p.x, p.y);

                ctx.strokeStyle = 'rgba(136, 255, 136, 0.95)';
                ctx.lineWidth = 4 * (1 - progress * 0.5);
                ctx.shadowBlur = 18;
                ctx.shadowColor = '#44cc44';
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();

                // 内层金线
                ctx.strokeStyle = 'rgba(255, 230, 120, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
            } else if (p.type === 'pet_mark_eye') {
                // 影刃穿梭"眼睛"印记
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                
                ctx.shadowBlur = 15;
                ctx.shadowColor = p.color;
                
                // 外圈
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // 眼睛瞳孔
                ctx.fillStyle = '#ff4488';
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                // 眼睛高光
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-p.size * 0.15, -p.size * 0.15, p.size * 0.15, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            } else if (p.type === 'pet_amplify_ring') {
                // 魔法增幅光环
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 20;
                ctx.shadowColor = p.color;
                
                // 外圈
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // 内圈
                ctx.strokeStyle = 'rgba(170, 68, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                
                // 魔法符文（6个点）
                ctx.fillStyle = '#cc88ff';
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const r = p.size * 0.8;
                    ctx.beginPath();
                    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            } else if (p.type === 'pet_feather') {
                // 猎鹰羽毛
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                
                // 羽毛形状
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 羽毛中轴
                ctx.strokeStyle = '#44aa44';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-p.size, 0);
                ctx.lineTo(p.size, 0);
                ctx.stroke();
                
                ctx.restore();
            } else if (p.type === 'pet_slow_zone') {
                // 减速区域
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                
                // 半透明绿色区域
                ctx.fillStyle = 'rgba(68, 204, 68, 0.2)';
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 区域边界
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.stroke();
                
                // 减速符号（箭头向下）
                ctx.fillStyle = '#88ff88';
                ctx.beginPath();
                ctx.moveTo(0, 15);
                ctx.lineTo(-8, 0);
                ctx.lineTo(8, 0);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            } else if (p.type === 'arrowtrail') {
                // 箭矢轨迹（绿色渐隐短条）
                ctx.save();
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size / 2, p.y - 1.5, p.size, 3);
                ctx.restore();
            } else if (p.type === 'windtrail') {
                // 风痕（浅绿细线，沿运动方向拉伸）
                ctx.save();
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.beginPath();
                ctx.moveTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
                ctx.lineTo(p.x + p.vx * 0.04, p.y + p.vy * 0.04);
                ctx.stroke();
                ctx.restore();
            } else if (p.type === 'impact') {
                // 命中冲击（发光绿色方块）
                ctx.save();
                ctx.translate(p.x, p.y);

                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

                // 中心高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fillRect(-p.size / 4, -p.size / 4, p.size / 2, p.size / 2);

                ctx.restore();
            } else if (p.type === 'star') {
                // 眩晕星星（金色旋转五角星）
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);

                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ffaa00';
                ctx.fillStyle = p.color;

                // 绘制五角星
                const r = (p.size || 4) + 2;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const innerAngle = outerAngle + Math.PI / 5;
                    const outerX = Math.cos(outerAngle) * r;
                    const outerY = Math.sin(outerAngle) * r;
                    const innerX = Math.cos(innerAngle) * r * 0.45;
                    const innerY = Math.sin(innerAngle) * r * 0.45;
                    if (i === 0) {
                        ctx.moveTo(outerX, outerY);
                    } else {
                        ctx.lineTo(outerX, outerY);
                    }
                    ctx.lineTo(innerX, innerY);
                }
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            } else if (p.type === 'errorText') {
                // ERROR文字闪烁
                if (p.target) {
                    ctx.save();
                    ctx.translate(p.target.x, p.target.y - 40);
                    ctx.font = 'bold 16px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#ff0000';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#ff0000';
                    ctx.fillText('ERROR', 0, 0);
                    ctx.restore();
                }
            } else if (p.type === 'rainbow') {
                // 彩虹粒子
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 12;
                ctx.shadowColor = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            } else if (p.type === 'changeNotice') {
                // 需求变更通知
                if (p.target) {
                    ctx.save();
                    ctx.translate(p.target.x, p.target.y - 50);
                    ctx.font = 'bold 14px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = '#4488ff';
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#4488ff';
                    ctx.fillText('需求变更', 0, 0);
                    ctx.restore();
                }
            } else if (p.type === 'capital') {
                // 金色资本光束
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.fillStyle = '#ffcc00';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ffcc00';
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            } else if (p.type === 'coin') {
                // 金币粒子
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation || 0);
                ctx.fillStyle = '#ffcc00';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffcc00';
                // 绘制金币（圆形）
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (p.type === 'capitalText') {
                // 资本流动文字
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.font = 'bold 18px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffcc00';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#ffcc00';
                ctx.fillText(p.text || '+$', 0, 0);
                ctx.restore();
            } else if (p.type === 'code') {
                // 代码粒子（二进制/代码字符，颜色可配置：默认红色Bug）
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.font = '10px monospace';
                ctx.fillStyle = p.color || '#ff0000';
                ctx.shadowBlur = 8;
                ctx.shadowColor = p.color || '#ff0000';
                ctx.fillText(p.char || '0', 0, 0);
                ctx.restore();
            } else if (p.type === 'data') {
                // 数据流粒子（颜色可配置：默认蓝色）
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.fillStyle = p.color || '#4488ff';
                ctx.shadowBlur = 6;
                ctx.shadowColor = p.color || '#4488ff';
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            } else if (p.type === 'floatText') {
                // 浮动提示文字（+10%、+20HP、护盾破碎等）
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = p.color || '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color || '#ffffff';
                ctx.fillText(p.text || '', 0, 0);
                ctx.restore();
            } else {
                // 普通粒子
                ctx.fillStyle = p.color;
                const size = p.size || 4;
                ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
            }
        });
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    /**
     * 清空所有粒子
     */
    clear() {
        this.particles = [];
    }

    // ==================== AI系列角色技能特效 ====================

    /**
     * 程序员 - Bug注入特效
     * 红色Bug代码包 + ERROR闪烁
     */
    addBugInjectEffect(x, y, target) {
        // Bug代码包（红色粒子）
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 1.0,
                color: '#ff0000',
                size: 5,
                type: 'code',
                char: Math.random() > 0.5 ? '0' : '1'
            });
        }
        
        // 如果有目标，添加ERROR闪烁
        if (target) {
            this.particles.push({
                x: target.x,
                y: target.y - 30,
                vx: 0,
                vy: 0,
                life: 2.0,
                type: 'errorText',
                text: 'ERROR',
                target: target
            });
        }
    }

    /**
     * UI设计师 - 色彩混淆特效
     * 彩虹色波纹
     */
    addColorConfusionEffect(x, y, radius) {
        const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
        
        // 多层彩虹波纹
        for (let layer = 0; layer < 3; layer++) {
            const layerRadius = radius * (0.6 + layer * 0.2);
            const layerDelay = layer * 0.1;
            
            for (let i = 0; i < 24; i++) {
                const angle = (Math.PI * 2 * i) / 24;
                const color = colors[i % colors.length];
                
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * 100,
                    vy: Math.sin(angle) * 100,
                    life: 1.5 + layerDelay,
                    color: color,
                    size: 8,
                    type: 'rainbow',
                    targetRadius: layerRadius
                });
            }
        }
    }

    /**
     * 产品经理 - 需求变更特效
     * 全地图数据波动
     */
    addRequirementChangeEffect(targets) {
        // 为每个目标添加变更通知
        targets.forEach((target, index) => {
            // 延迟显示，形成波浪效果
            setTimeout(() => {
                // 数据流粒子
                for (let i = 0; i < 20; i++) {
                    this.particles.push({
                        x: target.x + (Math.random() - 0.5) * 40,
                        y: target.y + (Math.random() - 0.5) * 40,
                        vx: (Math.random() - 0.5) * 30,
                        vy: (Math.random() - 0.5) * 30,
                        life: 1.5,
                        color: '#4488ff',
                        size: 4,
                        type: 'data'
                    });
                }
                
                // 变更通知文字
                this.particles.push({
                    x: target.x,
                    y: target.y - 40,
                    vx: 0,
                    vy: 0,
                    life: 3.0,
                    type: 'changeNotice',
                    text: '需求变更',
                    target: target
                });
            }, index * 100);
        });
    }

    /**
     * 老板 - 资源调配特效
     * 金色资本光束
     */
    addResourceTransferEffect(x, y, targetX, targetY) {
        // 创建资本光束路径
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(distance / 10);
        
        // 金色光束粒子
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            this.particles.push({
                x: x + dx * progress,
                y: y + dy * progress,
                vx: 0,
                vy: 0,
                life: 0.8,
                color: '#ffcc00',
                size: 6,
                type: 'capital',
                delay: i * 0.02
            });
        }
        
        // 金币飞散效果
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.particles.push({
                x: targetX,
                y: targetY,
                vx: Math.cos(angle) * 80,
                vy: Math.sin(angle) * 80,
                life: 1.0,
                color: '#ffcc00',
                size: 8,
                type: 'coin',
                rotation: 0,
                rotationSpeed: 10
            });
        }
        
        // 资本流动文字
        this.particles.push({
            x: (x + targetX) / 2,
            y: (y + targetY) / 2 - 30,
            vx: 0,
            vy: 0,
            life: 2.0,
            type: 'capitalText',
            text: '+$'
        });
    }

    // ==================== AI系列角色攻击特效 ====================

    /**
     * 近战挥击特效（前摇结束瞬间调用，按角色类型区分）
     * 仅AI系列4角色有专属挥击特效，其他近战角色不生成
     */
    addMeleeSwingEffect(type, x, y, facingRight) {
        const dir = facingRight ? 1 : -1;
        const sx = x + dir * 26; // 挥击位置（身前）

        if (type === 'programmer') {
            // 绿色代码斜劈：0/1字符沿扇形飞散
            for (let i = 0; i < 8; i++) {
                const angle = -Math.PI / 4 + (Math.PI / 2) * (i / 7);
                this.particles.push({
                    x: sx, y: y,
                    vx: Math.cos(angle) * dir * 220,
                    vy: Math.sin(angle) * 220,
                    life: 0.35,
                    color: '#00ff88',
                    size: 4,
                    type: 'code',
                    char: Math.random() > 0.5 ? '1' : '0'
                });
            }
        } else if (type === 'ui_designer') {
            // 粉色像素碎屑飞溅
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: sx, y: y + (Math.random() - 0.5) * 20,
                    vx: dir * (80 + Math.random() * 160),
                    vy: (Math.random() - 0.5) * 200,
                    life: 0.4,
                    color: Math.random() > 0.5 ? '#ff88ff' : '#ffffff',
                    size: 3 + Math.random() * 3
                });
            }
        } else if (type === 'product_manager') {
            // 蓝色数据弧线
            for (let i = 0; i < 8; i++) {
                const angle = -Math.PI / 4 + (Math.PI / 2) * (i / 7);
                this.particles.push({
                    x: sx, y: y,
                    vx: Math.cos(angle) * dir * 200,
                    vy: Math.sin(angle) * 200,
                    life: 0.35,
                    color: '#4488ff',
                    size: 4,
                    type: 'data'
                });
            }
        } else if (type === 'boss') {
            // 金币挥洒（抛物线飞出）
            for (let i = 0; i < 6; i++) {
                this.particles.push({
                    x: sx, y: y + (Math.random() - 0.5) * 16,
                    vx: dir * (100 + Math.random() * 150),
                    vy: -100 - Math.random() * 120,
                    life: 0.5,
                    color: '#ffcc00',
                    size: 6,
                    type: 'coin',
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 20,
                    hasGravity: true,
                    gravity: 500
                });
            }
        }
    }

    // ==================== AI系列宠物技能特效 ====================

    /**
     * CodeBot自动补全特效：绿色代码飞弹轨迹 + 命中爆裂
     * @param {number} shots 发射次数（30%概率追加攻击时为2）
     */
    createCodebotEffect(x, y, targetX, targetY, shots, hit) {
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const steps = Math.min(12, Math.floor(dist / 15));

        // 飞行轨迹（绿色代码字符）
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            this.particles.push({
                x: x + dx * progress,
                y: y + dy * progress,
                vx: 0,
                vy: 0,
                life: 0.5,
                color: '#00ff88',
                size: 4,
                type: 'code',
                char: Math.random() > 0.5 ? '{' : '}'
            });
        }

        // 命中爆裂（追加攻击时粒子更多）
        if (hit) {
            const count = 8 + shots * 6;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                this.particles.push({
                    x: targetX, y: targetY,
                    vx: Math.cos(angle) * (60 + Math.random() * 80),
                    vy: Math.sin(angle) * (60 + Math.random() * 80),
                    life: 0.5,
                    color: '#00ff88',
                    size: 4,
                    type: 'code',
                    char: Math.random() > 0.5 ? ';' : '}'
                });
            }
        }
    }

    /**
     * PixelPixa像素护盾展开特效：粉色像素方块向角色汇聚
     */
    createPixelShieldEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const radius = 40 + Math.random() * 30;
            this.particles.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: -Math.cos(angle) * 80,
                vy: -Math.sin(angle) * 80,
                life: 0.4,
                color: Math.random() > 0.4 ? '#ff88ff' : '#ffffff',
                size: 5
            });
        }
    }

    /**
     * PixelPixa像素护盾破碎特效：像素方块四散 + 提示文字
     */
    createPixelShieldBreakEffect(x, y) {
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            this.particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150,
                life: 0.5,
                color: Math.random() > 0.5 ? '#ff88ff' : '#ffddff',
                size: 5
            });
        }
        this.particles.push({
            x: x, y: y - 50,
            vx: 0, vy: -30,
            life: 1.2,
            color: '#ff88ff',
            type: 'floatText',
            text: '护盾破碎'
        });
    }

    /**
     * DataGrowth数据采集特效：蓝色数据流上升 + 属性提升提示
     */
    createDataBuffEffect(x, y) {
        for (let i = 0; i < 18; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + 20 + Math.random() * 20,
                vx: (Math.random() - 0.5) * 20,
                vy: -60 - Math.random() * 80,
                life: 0.8 + Math.random() * 0.4,
                color: '#4488ff',
                size: 4,
                type: 'data'
            });
        }
        this.particles.push({
            x: x, y: y - 55,
            vx: 0, vy: -30,
            life: 1.5,
            color: '#4488ff',
            type: 'floatText',
            text: '属性+10%'
        });
    }

    /**
     * ButlerAI应急预案特效：金色恢复光点上升 + 恢复量提示
     */
    createButlerHealEffect(x, y, healed) {
        for (let i = 0; i < 16; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 44,
                y: y + 24,
                vx: (Math.random() - 0.5) * 30,
                vy: -70 - Math.random() * 90,
                life: 0.8 + Math.random() * 0.4,
                color: '#ffcc00',
                size: 5,
                type: 'coin',
                rotation: 0,
                rotationSpeed: 6
            });
        }
        this.particles.push({
            x: x, y: y - 55,
            vx: 0, vy: -30,
            life: 1.6,
            color: '#ffcc00',
            type: 'floatText',
            text: '+' + healed + 'HP'
        });
    }
}

// 导出粒子系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}