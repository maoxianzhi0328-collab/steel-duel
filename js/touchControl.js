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

        // **优化：摇杆位置跟随手指**
        this.joystickBasePos = { x: 40, y: 40 };  // 默认位置（离左下角40px）
        this.joystickCenter = { x: 0, y: 0 };      // 摇杆圆心
        this.joystickTouchId = null;               // 当前触摸ID

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
        // 重置摇杆到默认位置
        this.resetJoystickPosition();
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
     * 重置摇杆到默认位置（左下角40px）
     */
    resetJoystickPosition() {
        const joystick = document.getElementById('moveJoystick');
        if (!joystick) return;

        // 获取屏幕尺寸
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // 摇杆容器尺寸
        const joystickSize = 120; // 摇杆容器宽度

        // 计算默认位置（离左下角40px）
        this.joystickBasePos.x = 40;
        this.joystickBasePos.y = 40;

        // 设置摇杆位置
        joystick.style.left = this.joystickBasePos.x + 'px';
        joystick.style.bottom = this.joystickBasePos.y + 'px';
        joystick.style.top = 'auto';
        joystick.style.right = 'auto';
        joystick.style.transform = 'none';
    }

    /**
     * **优化后的虚拟摇杆** - 跟随手指移动
     */
    initJoystick() {
        const joystick = document.getElementById('moveJoystick');
        const stick = document.getElementById('joystickStick');
        const direction = document.getElementById('joystickDirection');

        if (!joystick || !stick) return;

        const maxDistance = 35; // 摇杆最大移动距离(像素)
        const joystickSize = 120; // 摇杆容器宽度
        const activeAreaWidth = window.innerWidth * 0.4; // 左侧40%屏幕作为激活区域

        // 触摸开始 - 创建摇杆在手指位置
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches[0];
            this.joystickTouchId = touch.identifier;
            this.joystickPressed = true;
            joystick.classList.add('active');

            // 计算摇杆圆心（手指位置）
            this.joystickCenter.x = touch.clientX;
            this.joystickCenter.y = touch.clientY;

            // 移动摇杆到手指位置
            const newLeft = touch.clientX - joystickSize / 2;
            const newTop = touch.clientY - joystickSize / 2;

            joystick.style.left = newLeft + 'px';
            joystick.style.top = newTop + 'px';
            joystick.style.bottom = 'auto';
            joystick.style.transform = 'none';
        });

        // 触摸移动 - 更新摇杆位置
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!this.joystickPressed) return;

            // 找到对应的触摸点
            let touch = null;
            for (let i = 0; i < e.touches.length; i++) {
                if (e.touches[i].identifier === this.joystickTouchId) {
                    touch = e.touches[i];
                    break;
                }
            }
            if (!touch) return;

            // 计算相对于摇杆圆心的偏移
            let dx = touch.clientX - this.joystickCenter.x;
            let dy = touch.clientY - this.joystickCenter.y;
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

        // 触摸结束 - 恢复默认位置
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 检查是否是对应的触摸点结束
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystickTouchId) {
                    this.joystickTouchId = null;
                    this.joystickPressed = false;
                    joystick.classList.remove('active');
                    stick.style.transform = 'translate(-50%, -50%)';

                    this.joystickInput.x = 0;
                    this.joystickInput.y = 0;

                    // 恢复到默认位置
                    this.resetJoystickPosition();
                    break;
                }
            }
        });

        // 触摸取消
        joystick.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.joystickTouchId = null;
            this.joystickPressed = false;
            joystick.classList.remove('active');
            stick.style.transform = 'translate(-50%, -50%)';

            this.joystickInput.x = 0;
            this.joystickInput.y = 0;

            // 恢复到默认位置
            this.resetJoystickPosition();
        });

        // 初始化摇杆位置
        this.resetJoystickPosition();
    }

    /**
     * **新设计：技能轮盘**
     * 中心：攻击（点击触发）
     * 上滑：角色技能
     * 下滑：宠物技能
     * 左滑：冲刺
     * 右滑：防御（持续状态）
     */
    initSkillButtons() {
        const wheelCenter = document.getElementById('wheelCenter');
        const wheelIndicator = document.getElementById('wheelIndicator');
        const dirItems = {
            skill: document.getElementById('dirSkill'),
            pet: document.getElementById('dirPet'),
            dash: document.getElementById('dirDash'),
            defense: document.getElementById('dirDefense')
        };

        if (!wheelCenter) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let isTouching = false;
        let currentDirection = null;
        const threshold = 30; // 滑动阈值

        // 触摸开始
        wheelCenter.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            isTouching = true;
            currentDirection = null;

            wheelCenter.classList.add('pressed');
            if (navigator.vibrate) navigator.vibrate(10);
        });

        // 触摸移动
        wheelCenter.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!isTouching) return;

            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 清除所有激活状态
            Object.values(dirItems).forEach(item => {
                if (item) item.classList.remove('active');
            });

            // 判断滑动方向
            if (distance > threshold) {
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                let newDirection = null;

                // 上滑（-45° ~ 45°）
                if (angle >= -135 && angle < -45) {
                    newDirection = 'skill';
                }
                // 下滑（135° ~ 180° 或 -180° ~ -135°）
                else if (angle >= 45 && angle <= 180) {
                    newDirection = 'pet';
                }
                // 左滑（-180° ~ -135° 或 135° ~ 180°）
                else if (angle < -45 || angle > 135) {
                    newDirection = 'dash';
                }
                // 右滑（-45° ~ 45°）
                else if (angle >= -45 && angle < 45) {
                    newDirection = 'defense';
                }

                // 更新方向状态
                if (newDirection !== currentDirection) {
                    currentDirection = newDirection;
                    if (dirItems[currentDirection]) {
                        dirItems[currentDirection].classList.add('active');
                    }
                }

                // 激活滑动指示器
                if (wheelIndicator) {
                    wheelIndicator.classList.add('active');
                }
            } else {
                currentDirection = null;
                if (wheelIndicator) {
                    wheelIndicator.classList.remove('active');
                }
            }
        });

        // 触摸结束
        wheelCenter.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();

            isTouching = false;
            wheelCenter.classList.remove('pressed');

            // 清除所有激活状态
            Object.values(dirItems).forEach(item => {
                if (item) item.classList.remove('active');
            });

            if (wheelIndicator) {
                wheelIndicator.classList.remove('active');
            }

            // 触发对应动作
            if (currentDirection) {
                if (currentDirection === 'defense') {
                    // 防御是持续状态，touchend时关闭
                    this.buttons[currentDirection] = true;
                    setTimeout(() => {
                        this.buttons[currentDirection] = false;
                    }, 100);
                } else {
                    // 其他动作触发一次
                    this.buttons[currentDirection] = true;
                    setTimeout(() => {
                        this.buttons[currentDirection] = false;
                    }, 50);
                }
                if (navigator.vibrate) navigator.vibrate(20);
            } else {
                // 没有滑动，触发攻击
                this.buttons.attack = true;
                setTimeout(() => {
                    this.buttons.attack = false;
                }, 50);
                if (navigator.vibrate) navigator.vibrate(15);
            }
        });

        // 触摸取消
        wheelCenter.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            isTouching = false;
            wheelCenter.classList.remove('pressed');
            Object.values(dirItems).forEach(item => {
                if (item) item.classList.remove('active');
            });
            if (wheelIndicator) {
                wheelIndicator.classList.remove('active');
            }
        });
    }

    /**
     * 初始化暂停按钮
     */
    initPauseButton() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (!pauseBtn) return;

        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.game.gameState === 'playing') {
                this.game.pauseGame();
            } else if (this.game.gameState === 'paused') {
                this.game.resumeGame();
            }
        });
    }

    /**
     * 获取摇杆输入
     */
    getJoystickInput() {
        return this.joystickInput;
    }

    /**
     * 获取按钮状态
     */
    getButtonState(action) {
        return this.buttons[action] || false;
    }

    /**
     * 更新玩家移动
     */
    updatePlayerMovement(player) {
        if (!this.joystickPressed || !player) return;

        // 将摇杆输入转换为方向键
        const deadZone = 0.2;
        const pressed = Math.abs(this.joystickInput.x) > deadZone || Math.abs(this.joystickInput.y) > deadZone;

        if (pressed) {
            // 映射到WASD按键
            this.game.keys['KeyA'] = this.joystickInput.x < -deadZone;
            this.game.keys['KeyD'] = this.joystickInput.x > deadZone;
            this.game.keys['KeyW'] = this.joystickInput.y < -deadZone;
            this.game.keys['KeyS'] = this.joystickInput.y > deadZone;
        } else {
            this.game.keys['KeyA'] = false;
            this.game.keys['KeyD'] = false;
            this.game.keys['KeyW'] = false;
            this.game.keys['KeyS'] = false;
        }
    }
}