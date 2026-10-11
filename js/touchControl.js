/**
 * 触摸控制系统
 * 实现虚拟摇杆和技能按钮
 */

class TouchController {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();

        // 摇杆输入
        this.joystickInput = { x: 0, y: 0 };
        this.joystickPressed = false;

        // 技能按钮状态
        this.buttons = {
            attack: false,
            defense: false,
            skill: false,
            dash: false,
            pet: false
        };

        if (this.isMobile) {
            this.init();
            console.log('Touch controller initialized for mobile device');
        }
    }

    /**
     * 检测移动设备
     */
    detectMobile() {
        const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const screenWidth = window.innerWidth < 768;
        const touchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        return userAgent || screenWidth || touchScreen;
    }

    /**
     * 初始化触摸控制
     */
    init() {
        this.initJoystick();
        this.initSkillButtons();
        this.initPauseButton();

        // 初始隐藏触摸UI（只在战斗时显示）
        this.hide();
    }

    /**
     * 显示触摸控件（战斗时）
     */
    show() {
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            touchControls.style.display = 'block';
        }
    }

    /**
     * 隐藏触摸控件（非战斗时）
     */
    hide() {
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            touchControls.style.display = 'none';
        }
    }

    /**
     * 初始化虚拟摇杆
     */
    initJoystick() {
        const joystick = document.getElementById('moveJoystick');
        const stick = document.getElementById('joystickStick');
        const direction = document.getElementById('joystickDirection');

        if (!joystick || !stick) return;

        const maxDistance = 35; // 摇杆最大移动距离(像素)
        let centerX = 0;
        let centerY = 0;

        // 触摸开始
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.joystickPressed = true;
            joystick.classList.add('active');

            const rect = joystick.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
        });

        // 触摸移动
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!this.joystickPressed) return;

            const touch = e.touches[0];
            let dx = touch.clientX - centerX;
            let dy = touch.clientY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 限制在圆内
            if (distance > maxDistance) {
                dx = (dx / distance) * maxDistance;
                dy = (dy / distance) * maxDistance;
            }

            // 移动摇杆头
            stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

            // 保存输入值(-1 ~ 1)
            this.joystickInput.x = dx / maxDistance;
            this.joystickInput.y = dy / maxDistance;

            // 更新方向指示
            if (direction) {
                const angle = Math.atan2(dy, dx);
                const deg = (angle * 180 / Math.PI + 360) % 360;
                let dirText = '';
                if (deg >= 337.5 || deg < 22.5) dirText = '→';
                else if (deg >= 22.5 && deg < 67.5) dirText = '↘';
                else if (deg >= 67.5 && deg < 112.5) dirText = '↓';
                else if (deg >= 112.5 && deg < 157.5) dirText = '↙';
                else if (deg >= 157.5 && deg < 202.5) dirText = '←';
                else if (deg >= 202.5 && deg < 247.5) dirText = '↖';
                else if (deg >= 247.5 && deg < 292.5) dirText = '↑';
                else if (deg >= 292.5 && deg < 337.5) dirText = '↗';
                direction.textContent = dirText;
            }
        });

        // 触摸结束
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.joystickPressed = false;
            joystick.classList.remove('active');
            stick.style.transform = 'translate(-50%, -50%)';

            this.joystickInput.x = 0;
            this.joystickInput.y = 0;
        });

        // 触摸取消
        joystick.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.joystickPressed = false;
            joystick.classList.remove('active');
            stick.style.transform = 'translate(-50%, -50%)';

            this.joystickInput.x = 0;
            this.joystickInput.y = 0;
        });
    }

    /**
     * 初始化技能按钮
     */
    initSkillButtons() {
        // 攻击按钮(点击触发)
        this.initButton('btnAttack', 'attack', 'click');

        // 防御按钮(持续按住)
        this.initButton('btnDefense', 'defense', 'hold');

        // 技能按钮(点击触发)
        this.initButton('btnSkill', 'skill', 'click');

        // 冲刺按钮(点击触发)
        this.initButton('btnDash', 'dash', 'click');

        // 宠物技能按钮(点击触发)
        this.initButton('btnPet', 'pet', 'click');
    }

    /**
     * 初始化单个按钮
     */
    initButton(elementId, action, triggerType) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        if (triggerType === 'click') {
            // 点击触发
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buttons[action] = true;

                // 添加视觉反馈
                btn.classList.add('active');
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.classList.remove('active');
            });
        } else if (triggerType === 'hold') {
            // 持续按住
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buttons[action] = true;
                btn.classList.add('active');
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buttons[action] = false;
                btn.classList.remove('active');
            });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buttons[action] = false;
                btn.classList.remove('active');
            });
        }
    }

    /**
     * 初始化暂停按钮
     */
    initPauseButton() {
        // 创建暂停按钮
        const pauseBtn = document.createElement('div');
        pauseBtn.className = 'pause-btn-mobile';
        pauseBtn.id = 'pauseBtnMobile';
        pauseBtn.innerHTML = '⏸️';
        pauseBtn.style.display = 'flex';

        document.body.appendChild(pauseBtn);

        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // 暂停游戏逻辑(需要实现)
            console.log('Game paused');
        });
    }

    /**
     * 更新玩家移动
     */
    updatePlayerMovement(player) {
        if (!this.isMobile || !this.joystickPressed) return;

        // 死区检测
        const deadZone = 0.15;
        if (Math.abs(this.joystickInput.x) < deadZone && Math.abs(this.joystickInput.y) < deadZone) {
            return;
        }

        // 根据摇杆输入设置速度
        player.vx = this.joystickInput.x * player.speed;
        player.vy = this.joystickInput.y * player.speed;

        // 设置朝向(根据水平移动)
        if (this.joystickInput.x > deadZone) {
            player.facingRight = true;
        } else if (this.joystickInput.x < -deadZone) {
            player.facingRight = false;
        }
    }

    /**
     * 获取按钮状态
     */
    getButtonState(action) {
        const state = this.buttons[action];
        this.buttons[action] = false; // 重置(仅对click类型)
        return state;
    }

    /**
     * 更新按钮冷却显示
     */
    updateButtonCooldown(action, cooldown, maxCooldown) {
        const btnMap = {
            'skill': 'btnSkill',
            'pet': 'btnPet'
        };

        const btnId = btnMap[action];
        if (!btnId) return;

        const btn = document.getElementById(btnId);
        if (!btn) return;

        if (cooldown > 0) {
            btn.classList.add('cooldown');
        } else {
            btn.classList.remove('cooldown');
        }
    }

    /**
     * 震动反馈(如果设备支持)
     */
    vibrate(duration = 50) {
        if (!this.isMobile) return;

        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }
}