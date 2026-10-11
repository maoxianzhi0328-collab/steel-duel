/**
 * 音效系统模块
 * 处理所有游戏音效
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    /**
     * 初始化音频上下文
     */
    init() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                console.warn('音频系统初始化失败:', e);
            }
        }
    }

    /**
     * 播放基础音效
     */
    playSound(freq, duration, type = 'square', volume = 0.2) {
        if (!this.enabled || !this.audioContext) return;

        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
        } catch(e) {
            console.warn('音效播放失败:', e);
        }
    }

    /**
     * 攻击音效
     */
    playAttack() {
        this.playSound(400, 0.1);
        setTimeout(() => this.playSound(600, 0.05), 50);
    }

    /**
     * 命中音效
     */
    playHit() {
        this.playSound(200, 0.15, 'sawtooth', 0.3);
        setTimeout(() => this.playSound(100, 0.1, 'sawtooth', 0.2), 50);
    }

    /**
     * 技能音效（通用）
     */
    playSkill() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.playSound(500 + i * 100, 0.1), i * 50);
        }
    }

    /**
     * 冲刺音效
     */
    playDash() {
        this.playSound(800, 0.05, 'sine');
        setTimeout(() => this.playSound(600, 0.05, 'sine'), 30);
    }

    /**
     * 防御音效
     */
    playDefense() {
        this.playSound(300, 0.1, 'sine');
        setTimeout(() => this.playSound(350, 0.1, 'sine'), 50);
    }

    /**
     * 射手普攻音效 - 弓弦释放（短促绷响 + 破空）
     */
    playArrowShot() {
        // 弓弦绷响（频率快速下滑，模拟弦回弹）
        this.playSound(700, 0.08, 'triangle', 0.22);
        setTimeout(() => this.playSound(420, 0.07, 'triangle', 0.18), 30);
        // 箭矢破空
        setTimeout(() => this.playSound(1100, 0.06, 'sine', 0.12), 50);
    }

    /**
     * 法师普攻音效 - 激光发射（尖锐起音 + 电流嗡鸣）
     */
    playLaserZap() {
        // 起音
        this.playSound(1400, 0.08, 'sawtooth', 0.22);
        // 电流嗡鸣（快速高频抖动）
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playSound(900 + Math.random() * 300, 0.05, 'sine', 0.12);
            }, i * 25);
        }
    }

    /**
     * 法师专属技能音效 - 魔法轰炸
     */
    playMageSkill() {
        // 魔法吟唱音效（上升音调）
        const notes = [300, 350, 400, 450, 500, 550, 600];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playSound(freq, 0.15, 'sine', 0.25), i * 50);
        });

        // 魔法爆发音效（延迟）
        setTimeout(() => {
            // 爆发主音
            this.playSound(800, 0.3, 'sawtooth', 0.35);
            setTimeout(() => this.playSound(600, 0.2, 'square', 0.25), 100);

            // 高频魔法音
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    this.playSound(1200 + i * 100, 0.1, 'sine', 0.15);
                }, i * 30);
            }
        }, 350);
    }

    /**
     * 铁壁专属技能音效 - 铁山靠
     */
    playIronwallSkill() {
        // 蓄力音效（低沉上升）
        const chargeNotes = [100, 120, 140, 160, 180, 200];
        chargeNotes.forEach((freq, i) => {
            setTimeout(() => this.playSound(freq, 0.2, 'sawtooth', 0.3), i * 60);
        });

        // 延迟后释放重击音效
        setTimeout(() => {
            // 主冲击音
            this.playSound(150, 0.4, 'sawtooth', 0.4);
            this.playSound(100, 0.3, 'square', 0.35);
            
            // 金属共鸣音
            setTimeout(() => {
                for (let i = 0; i < 5; i++) {
                    this.playSound(300 + i * 50, 0.15, 'triangle', 0.2);
                }
            }, 100);

            // 低频震荡
            setTimeout(() => {
                this.playSound(80, 0.5, 'sine', 0.25);
            }, 50);
        }, 360);
    }

    /**
     * 影刺专属技能音效 - 影刃风暴（飞刀投掷）
     */
    playShadowSkill() {
        // 投掷启动音（尖锐释放）
        this.playSound(800, 0.12, 'triangle', 0.28);
        setTimeout(() => this.playSound(1200, 0.1, 'sawtooth', 0.25), 30);

        // 飞刀破空音（高频快速闪烁）
        setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    this.playSound(1400 + Math.random() * 400, 0.06, 'sine', 0.22);
                }, i * 25);
            }
        }, 60);

        // 刀刃旋转嗡鸣
        setTimeout(() => {
            const rotateNotes = [1000, 1100, 1200, 1100, 1000];
            rotateNotes.forEach((freq, i) => {
                setTimeout(() => this.playSound(freq, 0.08, 'triangle', 0.18), i * 40);
            });
        }, 120);
    }

    /**
     * 射手专属技能音效 - 穿心箭
     */
    playArcherSkill() {
        // 弓弦拉伸音
        const drawNotes = [400, 450, 500, 550, 600];
        drawNotes.forEach((freq, i) => {
            setTimeout(() => this.playSound(freq, 0.1, 'triangle', 0.25), i * 40);
        });

        // 箭矢释放音
        setTimeout(() => {
            // 释放主音
            this.playSound(800, 0.15, 'sawtooth', 0.3);
            
            // 弓弦回弹音
            setTimeout(() => {
                this.playSound(600, 0.1, 'sine', 0.2);
            }, 30);

            // 箭矢飞行音（呼啸声）
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    this.playSound(1000 + Math.random() * 200, 0.05, 'sine', 0.15);
                }, i * 25);
            }
        }, 200);

        // 命中音效（眩晕）
        setTimeout(() => {
            this.playSound(300, 0.3, 'sine', 0.35);
            setTimeout(() => {
                // 眩晕嗡鸣音
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.playSound(200 + i * 30, 0.2, 'sine', 0.2);
                    }, i * 50);
                }
            }, 100);
        }, 350);
    }

    /**
     * 根据角色类型播放技能音效
     */
    playSkillByType(type) {
        if (type === 'mage') {
            this.playMageSkill();
        } else if (type === 'ironwall') {
            this.playIronwallSkill();
        } else if (type === 'shadow') {
            this.playShadowSkill();
        } else if (type === 'archer') {
            this.playArcherSkill();
        } else if (type === 'programmer') {
            this.playProgrammerSkill();
        } else if (type === 'ui_designer') {
            this.playUIDesignerSkill();
        } else if (type === 'product_manager') {
            this.playProductManagerSkill();
        } else if (type === 'boss') {
            this.playBossSkill();
        } else {
            this.playSkill();
        }
    }

    /**
     * 程序员技能音效：键盘敲击 + 电流故障音
     */
    playProgrammerSkill() {
        this.playSound(880, 0.05, 'square', 0.15);
        setTimeout(() => this.playSound(660, 0.05, 'square', 0.15), 60);
        setTimeout(() => this.playSound(440, 0.15, 'sawtooth', 0.15), 120);
    }

    /**
     * UI设计师技能音效：彩虹琶音上行
     */
    playUIDesignerSkill() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playSound(freq, 0.12, 'sine', 0.18), i * 70);
        });
    }

    /**
     * 产品经理技能音效：需求变更消息通知音（叮-咚）
     */
    playProductManagerSkill() {
        this.playSound(988, 0.1, 'sine', 0.2);
        setTimeout(() => this.playSound(1319, 0.2, 'sine', 0.2), 100);
    }

    /**
     * 老板技能音效：收银机"叮" + 金币声
     */
    playBossSkill() {
        this.playSound(1568, 0.08, 'square', 0.15);
        setTimeout(() => this.playSound(2093, 0.25, 'triangle', 0.15), 80);
    }
}

// 导出音效系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSystem;
}