/**
 * 投射物系统模块（Projectile System）
 * 管理飞行道具：数据生成(spawn) → 生命周期更新(update/碰撞) → 渲染(draw)
 * 当前用于射手普通攻击发射的箭矢子弹
 */

/**
 * 单个投射物（箭矢）
 */
class Projectile {
    /**
     * @param {Object} opts 投射物参数
     * @param {number} opts.x 初始X
     * @param {number} opts.y 初始Y
     * @param {number} opts.vx X方向速度（像素/秒）
     * @param {number} opts.vy Y方向速度（像素/秒）
     * @param {number} opts.maxDistance 最大飞行距离（超过后自动消失）
     * @param {number} opts.damage 命中伤害
     * @param {string} opts.owner 所有者标识：'player1' | 'player2'
     * @param {string} opts.color 箭矢主题色
     */
    constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.vx = opts.vx;
        this.vy = opts.vy;
        this.maxDistance = opts.maxDistance || 200;
        this.damage = opts.damage;
        this.owner = opts.owner;
        this.color = opts.color || '#44cc44';
        this.radius = 6; // 碰撞盒半径（与机甲AABB做膨胀检测）

        this.traveled = 0; // 已飞行距离
        this.dead = false; // 待清理标记
        this.trail = [];   // 最近的位置，用于绘制拖尾
    }

    /**
     * 生命周期更新
     */
    update(dt) {
        // 记录拖尾点（保留5个）
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.pop();

        const stepX = this.vx * dt;
        const stepY = this.vy * dt;
        this.x += stepX;
        this.y += stepY;
        this.traveled += Math.sqrt(stepX * stepX + stepY * stepY);

        // 飞完最大射程 → 消失（life ≥ 距离/速度 由 maxDistance 保证）
        if (this.traveled >= this.maxDistance) {
            this.dead = true;
        }

        // 飞出画布边界 → 消失
        if (this.x < -20 || this.x > GAME_CONFIG.canvas.width + 20 ||
            this.y < -20 || this.y > GAME_CONFIG.canvas.height + 20) {
            this.dead = true;
        }
    }

    /**
     * 与机甲的碰撞检测（圆 vs 机甲包围盒AABB膨胀）
     */
    hits(mecha) {
        return Math.abs(this.x - mecha.x) < mecha.width / 2 + this.radius * 0.5 &&
               Math.abs(this.y - mecha.y) < mecha.height / 2 + this.radius * 0.5;
    }

    /**
     * 渲染：绿色发光箭矢 + 渐隐拖尾
     */
    draw(ctx) {
        // 拖尾（由旧到新绘制）
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const t = this.trail[i];
            const alpha = (1 - i / (this.trail.length + 2)) * 0.35;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(t.x - 3, t.y - 1.5, 6, 3);
            ctx.restore();
        }

        // 箭体（沿速度方向旋转）
        const angle = Math.atan2(this.vy, this.vx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.shadowBlur = 8;
        ctx.shadowColor = '#88ff88';

        // 箭杆
        ctx.fillStyle = '#ddbb77';
        ctx.fillRect(-10, -1.5, 16, 3);
        // 箭头
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(3, -4);
        ctx.lineTo(3, 4);
        ctx.closePath();
        ctx.fill();
        // 尾羽
        ctx.fillStyle = '#aaffaa';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-16, -4);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-16, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

/**
 * 投射物系统：统一管理所有投射物的生成、更新、碰撞与渲染
 */
class ProjectileSystem {
    constructor() {
        this.projectiles = [];
    }

    /**
     * 生成一支箭矢
     */
    spawn(opts) {
        this.projectiles.push(new Projectile(opts));
    }

    /**
     * 更新所有投射物并返回本帧命中事件
     * @param {Object} mechaMap 双方机甲映射 { player1: Mecha, player2: Mecha }
     * @returns {Array} 命中事件 [{ target, damage, x, y }]
     */
    update(dt, mechaMap) {
        const hits = [];

        this.projectiles.forEach(p => {
            if (p.dead) return;
            p.update(dt);

            // 只可能命中敌方机甲（目标"无法选中"时箭矢穿透，不销毁）
            const targetKey = p.owner === 'player1' ? 'player2' : 'player1';
            const target = mechaMap[targetKey];

            if (!p.dead && target && target.health > 0 && !target.isUntargetable && p.hits(target)) {
                p.dead = true; // 命中立即销毁，保证只造成一次伤害
                hits.push({ target: target, damage: p.damage, x: p.x, y: p.y });
            }
        });

        this.projectiles = this.projectiles.filter(p => !p.dead);
        return hits;
    }

    /**
     * 渲染所有投射物
     */
    draw(ctx) {
        this.projectiles.forEach(p => p.draw(ctx));
        ctx.shadowBlur = 0;
    }

    /**
     * 清空（重新开局时调用）
     */
    clear() {
        this.projectiles = [];
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Projectile, ProjectileSystem };
}
