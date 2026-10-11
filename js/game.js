/**
 * 游戏主模块
 * 整合所有系统并管理游戏流程
 */

class Game {
    constructor() {
        // 初始化画布
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // 游戏状态
        this.keys = {};
        this.gameState = 'menu';
        this.gameTime = GAME_CONFIG.game.duration;
        this.lastTime = performance.now();

        // 玩家
        this.player1 = null;
        this.player2 = null;
        this.selectedMecha = { player1: 'ironwall', player2: 'shadow' };

        // 宠物
        this.pet1 = null;
        this.pet2 = null;

        // 系统初始化
        this.audioSystem = new AudioSystem();
        this.particleSystem = new ParticleSystem();
        this.projectileSystem = new ProjectileSystem();
        this.screenShake = 0;

        // 初始化触摸控制器
        this.touchController = new TouchController(this);

        // 初始化线上联机客户端
        this.onlineClient = new OnlineClient(this);

        // 响应式画布适配
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 100);
        });

        // 角色预览器
        this.previewers = {};

        // 设置监听
        this.setupEventListeners();
        this.setupUIListeners();

        // 启动游戏循环
        this.gameLoop();

        // 初始化角色网格（延迟确保DOM已加载）
        setTimeout(() => {
            this.buildCharGrids();
            this.updateGridSelection('player1');
            this.updateGridSelection('player2');
        }, 200);
    }

    /**
     * 设置键盘监听
     */
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (this.player1 && e.code === KEY_MAPPING.player1.defense) {
                this.player1.isDefending = false;
            }
            if (this.player2 && e.code === KEY_MAPPING.player2.defense) {
                this.player2.isDefending = false;
            }
        });
    }

    /**
     * 设置UI监听
     */
    setupUIListeners() {
        // 轮播选择器索引
        this.carouselIndex = { player1: 0, player2: 1 };
        this.mechaTypes = ['ironwall', 'shadow', 'mage', 'archer', 'programmer', 'ui_designer', 'product_manager', 'boss'];
        
        // 当前游戏模式
        this.gameMode = 'versus'; // 'versus'(本地联机), 'online'(线上联机), 'stage'
        this.currentStageId = 1;
        this.netMode = 'local'; // 'local' 或 'online'

        // 首页模式卡片监听
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                if (mode === 'stage') {
                    this.showScreen('stageSelect');
                } else if (mode === 'versus') {
                    // 本地联机：复用 onlineSelectScreen，通过 netMode 区分
                    this.netMode = 'local';
                    this.showScreen('onlineSelect');
                    // 设置标题与提示
                    document.querySelector('#onlineSelectScreen .screen-title').textContent = '本地联机';
                    document.getElementById('onlineBottomHintText').textContent = '本地联机 - 两台设备连接同一WiFi';
                    // 隐藏快速匹配按钮（仅线上联机需要）
                    const qmBtn = document.getElementById('quickMatchBtn');
                    if (qmBtn) qmBtn.style.display = 'none';
                } else if (mode === 'online') {
                    this.netMode = 'online';
                    this.showScreen('onlineSelect');
                    document.querySelector('#onlineSelectScreen .screen-title').textContent = '线上联机';
                    document.getElementById('onlineBottomHintText').textContent = '线上联机 - 跨设备房间对战';
                    const qmBtn = document.getElementById('quickMatchBtn');
                    if (qmBtn) qmBtn.style.display = '';
                }
            });
        });

        // 返回按钮监听
        document.getElementById('stageBackBtn').addEventListener('click', () => this.showScreen('home'));
        document.getElementById('versusBackBtn').addEventListener('click', () => this.showScreen('home'));

        // 角色网格点击监听（事件委托）
        document.getElementById('player1Grid').addEventListener('click', (e) => {
            const cell = e.target.closest('.char-cell');
            if (cell) this.selectChar('player1', parseInt(cell.dataset.index));
        });
        document.getElementById('player2Grid').addEventListener('click', (e) => {
            const cell = e.target.closest('.char-cell');
            if (cell) this.selectChar('player2', parseInt(cell.dataset.index));
        });

        // 按钮监听
        document.getElementById('startVersusBtn').addEventListener('click', () => {
            this.gameMode = 'versus';
            this.netMode = 'local';
            this.startGame();
        });
        document.getElementById('startChallengeBtn').addEventListener('click', () => {
            const status = stageProgress.getLevelStatus(this.currentStageId);
            if (status === 'locked') return;
            this.gameMode = 'stage';
            this.startGame();
        });
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('menuBtn').addEventListener('click', () => this.showScreen('home'));

        // 线上联机按钮监听
        document.getElementById('onlineBackBtn').addEventListener('click', () => this.showScreen('home'));
        document.getElementById('createRoomBtn').addEventListener('click', () => this.handleCreateRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.showJoinRoomForm());
        document.getElementById('quickMatchBtn').addEventListener('click', () => this.handleQuickMatch());
        document.getElementById('confirmJoinBtn').addEventListener('click', () => this.handleJoinRoom());
        document.getElementById('leaveRoomBtn').addEventListener('click', () => this.handleLeaveRoom());
        document.getElementById('onlineReadyBtn').addEventListener('click', () => this.handleOnlineReady());

        // 线上联机角色网格
        document.getElementById('onlinePlayerGrid').addEventListener('click', (e) => {
            const cell = e.target.closest('.char-cell');
            if (cell) this.selectOnlineChar(parseInt(cell.dataset.index));
        });
        
        // 底部功能栏按钮监听
        document.querySelectorAll('.func-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'gallery') {
                    this.showScreen('gallery');
                } else {
                    alert(`${action}功能即将推出！`);
                }
            });
        });
        
        // 图鉴返回按钮
        document.getElementById('galleryBackBtn').addEventListener('click', () => this.showScreen('home'));
        
        // 图鉴标签切换
        document.querySelectorAll('.gallery-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterGalleryCards(tab.dataset.series);
            });
        });
    }

    /**
     * 构建角色选择网格（为每个玩家生成8个角色格，各含独立预览Canvas）
     */
    buildCharGrids() {
        this.gridPreviewers = {};

        ['player1', 'player2'].forEach(player => {
            const grid = document.getElementById(player + 'Grid');
            if (!grid) return;
            grid.innerHTML = '';
            this.gridPreviewers[player] = [];

            this.mechaTypes.forEach((type, index) => {
                const cell = document.createElement('div');
                cell.className = 'char-cell';
                cell.dataset.index = index;
                cell.dataset.type = type;

                const canvas = document.createElement('canvas');
                canvas.width = 30;
                canvas.height = 34;
                canvas.className = 'char-cell-canvas';

                const name = document.createElement('div');
                name.className = 'char-cell-name';
                name.textContent = MECHA_DATA[type].name;

                cell.appendChild(canvas);
                cell.appendChild(name);
                grid.appendChild(cell);

                // 为每个角色格创建独立预览器
                const previewer = new MechaPreviewer(canvas);
                previewer.setType(type);
                previewer.startAnimation();
                this.gridPreviewers[player].push(previewer);
            });
        });
    }

    /**
     * 选中角色（点击网格格触发）
     */
    selectChar(player, index) {
        this.carouselIndex[player] = index;
        this.updateGridSelection(player);
    }

    /**
     * 更新网格选中状态与信息面板
     */
    updateGridSelection(player) {
        const index = this.carouselIndex[player];
        const mechaType = this.mechaTypes[index];
        this.selectedMecha[player] = mechaType;

        const data = MECHA_DATA[mechaType];
        const prefix = player === 'player1' ? 'p1' : 'p2';

        // 更新信息面板
        document.getElementById(prefix + 'MechaName').textContent = data.name;
        document.getElementById(prefix + 'MechaStats').innerHTML =
            '血量: ' + data.maxHealth + ' | 攻击: ' + data.attack + ' | 速度: ' + this.getSpeedText(data.speed) + '<br>' +
            '技能: ' + data.skillName + ' | 被动: ' + data.passiveName;

        // 更新选中高亮
        const grid = document.getElementById(player + 'Grid');
        if (grid) {
            grid.querySelectorAll('.char-cell').forEach((cell, i) => {
                cell.classList.toggle('selected', i === index);
            });
        }
    }

    /**
     * 获取速度文本
     */
    getSpeedText(speed) {
        if (speed >= 4) return '快';
        if (speed >= 3.5) return '中快';
        if (speed >= 3) return '中';
        return '慢';
    }

    /**
     * 获取角色类型文本
     */
    getMechaTypeText(type) {
        const map = {
            ironwall: '坦克', shadow: '刺客', mage: '法师', archer: '射手',
            programmer: 'AI系列', ui_designer: 'AI系列',
            product_manager: 'AI系列', boss: 'AI系列'
        };
        return map[type] || '机甲';
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.audioSystem.init();
        this.gameState = 'playing';
        this.gameTime = GAME_CONFIG.game.duration;

        // 创建玩家
        this.player1 = new Mecha(150, 300, 1, this.selectedMecha.player1);
        
        if (this.gameMode === 'stage') {
            // 关卡模式：玩家2是AI
            const stageData = STAGE_DATA[this.currentStageId];
            let enemyType = stageData.enemy;
            if (enemyType === 'random') {
                // 随机选择角色
                const types = ['ironwall', 'shadow', 'mage', 'archer'];
                enemyType = types[Math.floor(Math.random() * types.length)];
            }
            this.player2 = new Mecha(650, 300, 2, enemyType);
            this.player2.isAI = true;
            this.player2.aiLevel = stageData.aiLevel;
            this.aiConfig = AI_LEVELS[stageData.aiLevel];
            this.currentStageData = stageData;
        } else if (this.netMode === 'online') {
            // 联机对战（本地联机+线上联机，输入同步模式）：玩家2是真人
            this.player2 = new Mecha(650, 300, 2, this.selectedMecha.player2);
            this.player2.isAI = false;
            this.aiConfig = null;
            this.currentStageData = null;
            // 重置帧计数器
            this.frameCount = 0;
        } else if (this.netMode === 'local' && this.touchController && this.touchController.isMobile) {
            // 本地双人键盘联机移动端降级：玩家2由AI控制（手机无法双人同屏）
            this.player2 = new Mecha(650, 300, 2, this.selectedMecha.player2);
            this.player2.isAI = true;
            this.player2.aiLevel = 2; // 中等AI
            this.aiConfig = AI_LEVELS[2];
            this.currentStageData = null;
        } else {
            // 本地联机（PC双人键盘）：玩家2是真人
            this.player2 = new Mecha(650, 300, 2, this.selectedMecha.player2);
            this.player2.isAI = false;
            this.aiConfig = null;
            this.currentStageData = null;
        }

        // 创建宠物
        this.pet1 = this.createPet(this.player1);
        this.pet2 = this.createPet(this.player2);

        // 关卡模式：为AI创建特定宠物
        if (this.gameMode === 'stage' && this.currentStageData.pet) {
            let petType = this.currentStageData.pet;
            if (petType === 'match') {
                petType = MECHA_TO_PET[this.player2.type];
            }
            if (PET_DATA[petType]) {
                this.pet2 = new Pet(this.player2, petType);
            }
        }

        // 清空粒子与投射物
        this.particleSystem.clear();
        this.projectileSystem.clear();
        this.screenShake = 0;

        // 更新UI
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('uiOverlay').style.display = 'flex';
        document.getElementById('gameTimer').style.display = 'block';
        document.getElementById('p1Name').textContent = `玩家1 - ${this.player1.name}`;
        document.getElementById('p2Name').textContent = this.player2.isAI ? 
            `AI - ${this.player2.name} (${AI_LEVELS[this.player2.aiLevel].name})` : 
            `玩家2 - ${this.player2.name}`;

        this.lastTime = performance.now();

        // 显示触摸控件（移动端战斗时）
        if (this.touchController && this.touchController.isMobile) {
            this.touchController.show();
        }
    }

    /**
     * 创建宠物
     */
    createPet(owner) {
        const petTypeMap = {
            'ironwall': 'steel_guardian',
            'shadow': 'shadow_spirit',
            'mage': 'magic_fairy',
            'archer': 'hunter_falcon',
            'programmer': 'codebot',
            'ui_designer': 'pixelpixa',
            'product_manager': 'datagrowth',
            'boss': 'butlerai'
        };
        
        const petType = petTypeMap[owner.type];
        if (petType && PET_DATA[petType]) {
            return new Pet(owner, petType);
        }
        return null;
    }

    /**
     * 显示菜单
     */
    showMenu() {
        this.showScreen('home');
    }

    /**
     * 显示指定界面
     */
    showScreen(screenName) {
        // 隐藏所有界面
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 显示目标界面
        const screenId = screenName + 'Screen';
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // 特定界面的初始化
        if (screenName === 'stageSelect') {
            this.initStageSelectScreen();
        } else if (screenName === 'versusSelect') {
            // 本地联机：移动端提示切换
            this.initVersusSelectScreen();
            // 初始化角色网格
            setTimeout(() => {
                if (!this.gridPreviewers || !this.gridPreviewers.player1) {
                    this.buildCharGrids();
                }
                this.updateGridSelection('player1');
                this.updateGridSelection('player2');
            }, 100);
        } else if (screenName === 'onlineSelect' || screenName === 'onlineSelectScreen') {
            // 线上/本地联机界面初始化
            this.initOnlineScreen();
        } else if (screenName === 'gallery') {
            // 初始化图鉴
            this.initGalleryScreen();
        }

        // 隐藏游戏UI
        document.getElementById('uiOverlay').style.display = 'none';
        document.getElementById('gameTimer').style.display = 'none';
        document.getElementById('gameOverScreen').classList.add('hidden');

        // 隐藏触摸控件（非战斗时）
        if (this.touchController && this.touchController.isMobile) {
            this.touchController.hide();
        }

        this.gameState = 'menu';
    }

    /**
     * 初始化关卡选择界面
     */
    initStageSelectScreen() {
        // 清空现有关卡按钮
        ['chapter1Levels', 'chapter2Levels', 'chapter3Levels'].forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = '';
        });

        // 生成关卡按钮
        for (let i = 1; i <= 15; i++) {
            const chapter = Math.ceil(i / 5);
            const containerId = `chapter${chapter}Levels`;
            const container = document.getElementById(containerId);
            if (!container) continue;

            const stageData = STAGE_DATA[i];
            const status = stageProgress.getLevelStatus(i);

            const levelBtn = document.createElement('button');
            levelBtn.className = `level-btn ${status} ${stageData.isBoss ? 'boss' : ''}`;
            levelBtn.dataset.levelId = i;

            // 关卡号
            const numberDiv = document.createElement('div');
            numberDiv.className = 'level-number';
            numberDiv.textContent = i;
            levelBtn.appendChild(numberDiv);

            // 状态图标
            const statusDiv = document.createElement('div');
            statusDiv.className = 'level-status';
            if (status === 'completed') {
                statusDiv.textContent = '✓';
            } else if (status === 'current') {
                statusDiv.textContent = '★';
            } else {
                statusDiv.textContent = '🔒';
            }
            levelBtn.appendChild(statusDiv);

            // 点击监听
            levelBtn.addEventListener('click', () => this.selectLevel(i));

            container.appendChild(levelBtn);
        }

        // 初始选择当前关卡
        this.selectLevel(stageProgress.currentLevel);
    }

    /**
     * 选择关卡
     */
    selectLevel(levelId) {
        this.currentStageId = levelId;
        const stageData = STAGE_DATA[levelId];
        const status = stageProgress.getLevelStatus(levelId);

        // 更新详情面板
        const titleEl = document.getElementById('stageDetailTitle');
        const infoEl = document.getElementById('stageDetailInfo');
        const btnEl = document.getElementById('startChallengeBtn');

        titleEl.textContent = `关卡${levelId} - ${stageData.name}`;

        let infoHTML = `<div>敌方：${MECHA_DATA[stageData.enemy].name}`;
        if (stageData.pet) {
            infoHTML += ` + ${PET_DATA[stageData.pet].name}`;
        }
        infoHTML += `</div>`;
        infoHTML += `<div>难度：${stageData.difficulty}</div>`;
        infoHTML += `<div>目标：${stageData.objective}</div>`;
        infoHTML += `<div>奖励：💰 ${stageData.rewards.gold}`;
        if (stageData.rewards.petFragment) {
            const fragName = stageData.rewards.petFragment === 'random' ? '随机宠物碎片' : 
                           PET_FRAGMENTS[stageData.rewards.petFragment].name;
            const count = stageData.rewards.petFragmentCount || 1;
            infoHTML += ` | 🧩 ${fragName} x${count}`;
        }
        infoHTML += `</div>`;

        infoEl.innerHTML = infoHTML;

        // 更新按钮状态
        btnEl.disabled = (status === 'locked');
        btnEl.textContent = status === 'locked' ? '🔒 未解锁' : '开始挑战';
    }

    /**
     * 显示游戏结束
     */
    showGameOver(winner) {
        this.gameState = 'gameover';
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('winnerText').textContent = winner;

        // 隐藏触摸控件（游戏结束时）
        if (this.touchController && this.touchController.isMobile) {
            this.touchController.hide();
        }
    }

    /**
     * 更新游戏状态
     */
    update(dt) {
        if (this.gameState !== 'playing') return;

        // 更新时间
        this.gameTime -= dt;
        document.getElementById('gameTimer').textContent = Math.ceil(this.gameTime);
        if (this.gameTime <= 0) {
            this.determineWinner();
            return;
        }

        // 处理输入
        // 应用触摸输入（移动端）：将摇杆输入映射到虚拟按键
        const isOnline = (this.netMode === 'online' && this.gameMode === 'versus' && this.onlineClient && this.onlineClient.connected);
        const isOnlineP2 = isOnline && this.onlineClient.localPlayerNum === 2;

        if (this.touchController.isMobile && this.player1) {
            const input = this.touchController.joystickInput;
            const pressed = this.touchController.joystickPressed;
            const deadZone = 0.15;

            if (isOnlineP2) {
                // 联机模式本地是玩家2：摇杆 → 方向键，触摸按钮 → 玩家2按键
                this.keys['ArrowLeft'] = pressed && input.x < -deadZone;
                this.keys['ArrowRight'] = pressed && input.x > deadZone;
                this.keys['ArrowUp'] = pressed && input.y < -deadZone;
                this.keys['ArrowDown'] = pressed && input.y > deadZone;
                this.keys['Comma'] = this.touchController.getButtonState('attack');
                this.keys['Period'] = this.touchController.buttons.defense || false;
                this.keys['Slash'] = this.touchController.getButtonState('skill');
                this.keys['Enter'] = this.touchController.getButtonState('dash');
                this.keys['Quote'] = this.touchController.getButtonState('pet');
            } else if (isOnline) {
                // 联机模式本地是玩家1：摇杆 → WASD，触摸按钮 → 玩家1按键（便于同步）
                this.keys['KeyA'] = pressed && input.x < -deadZone;
                this.keys['KeyD'] = pressed && input.x > deadZone;
                this.keys['KeyW'] = pressed && input.y < -deadZone;
                this.keys['KeyS'] = pressed && input.y > deadZone;
                this.keys['KeyJ'] = this.touchController.getButtonState('attack');
                this.keys['KeyK'] = this.touchController.buttons.defense || false;
                this.keys['KeyL'] = this.touchController.getButtonState('skill');
                this.keys['ShiftLeft'] = this.touchController.getButtonState('dash');
                this.keys['KeyI'] = this.touchController.getButtonState('pet');
            } else {
                // 非联机模式：原有逻辑，摇杆 → WASD（按钮由handleInput直接处理）
                this.keys['KeyA'] = pressed && input.x < -deadZone;
                this.keys['KeyD'] = pressed && input.x > deadZone;
                this.keys['KeyW'] = pressed && input.y < -deadZone;
                this.keys['KeyS'] = pressed && input.y > deadZone;
            }
        }

        // 联机输入同步：发送本地输入 + 接收对手输入
        if (isOnline) {
            this.frameCount = (this.frameCount || 0) + 1;
            // 每2帧发送一次以减少流量（移动键为持续状态，2帧间隔可接受）
            if (this.frameCount % 2 === 0) {
                this.onlineClient.sendInput(this.frameCount, this.keys);
            }
            // 接收对手输入
            const remoteInput = this.onlineClient.getRemoteInput(this.frameCount);
            if (remoteInput) {
                if (this.onlineClient.localPlayerNum === 2) {
                    // 本地是玩家2，对手是玩家1：直接应用WASD到本地按键
                    Object.keys(remoteInput).forEach(k => {
                        this.keys[k] = remoteInput[k];
                    });
                } else {
                    // 本地是玩家1，对手是玩家2：把对手的WASD映射到Arrow键
                    const keyMap = {
                        'KeyW': 'ArrowUp', 'KeyA': 'ArrowLeft', 'KeyS': 'ArrowDown', 'KeyD': 'ArrowRight',
                        'KeyJ': 'Comma', 'KeyK': 'Period', 'KeyL': 'Slash',
                        'ShiftLeft': 'Enter', 'KeyI': 'Quote'
                    };
                    Object.keys(remoteInput).forEach(k => {
                        const mapped = keyMap[k];
                        if (mapped) this.keys[mapped] = remoteInput[k];
                    });
                }
            }
            this.onlineClient.cleanupInputs(this.frameCount);
        }

        this.handleInput();

        // AI控制（关卡模式）
        if (this.player2.isAI && this.aiConfig) {
            this.updateAI(dt);
        }

        // 更新玩家
        this.player1.update(dt, this.keys, this.player2);
        this.player2.update(dt, this.keys, this.player1);

        // 更新宠物
        if (this.pet1) this.pet1.update(dt, this.player2);
        if (this.pet2) this.pet2.update(dt, this.player1);

        // 像素护盾破碎检测与特效（任意伤害来源击破后触发一次）
        [this.player1, this.player2].forEach(m => {
            if (m.pixelShieldBroken) {
                m.pixelShieldBroken = false;
                this.particleSystem.createPixelShieldBreakEffect(m.x, m.y);
                this.audioSystem.playHit();
            }
        });

        // ButlerAI应急预案：主人血量<30%时自动触发（每局1次）
        if (this.pet1 && this.pet1.type === 'butlerai' && !this.pet1.isRetreated &&
            this.pet1.skillCooldown <= 0 &&
            this.player1.health / this.player1.maxHealth < PET_DATA.butlerai.skillHealTrigger) {
            this.pet1.performEmergencyHeal(this.player2, this);
        }
        if (this.pet2 && this.pet2.type === 'butlerai' && !this.pet2.isRetreated &&
            this.pet2.skillCooldown <= 0 &&
            this.player2.health / this.player2.maxHealth < PET_DATA.butlerai.skillHealTrigger) {
            this.pet2.performEmergencyHeal(this.player1, this);
        }

        // 处理本帧进入攻击生效帧的角色（射手发射子弹 / 法师发射激光）
        this.handleFiredAttacks();

        // 近战角色（铁壁/影刺）的即时命中检测
        this.checkMeleeAttacks();

        // 更新投射物并结算命中
        const projectileHits = this.projectileSystem.update(dt, {
            player1: this.player1,
            player2: this.player2
        });
        projectileHits.forEach(hit => {
            hit.target.takeDamage(hit.damage);
            this.particleSystem.addHitEffect(hit.x, hit.y);
            this.audioSystem.playHit();
            this.screenShake = Math.max(this.screenShake, 0.15);
        });

        // 更新粒子
        this.particleSystem.update(dt);

        // 处理延迟命中技能（影刃风暴）
        this.checkDelayedSkills();

        // 更新屏幕震动
        if (this.screenShake > 0) this.screenShake -= dt * 2;

        // 更新UI
        this.updateUI();

        // 检查胜负
        if (this.player1.health <= 0) {
            if (this.gameMode === 'stage') {
                this.showStageResult(false);
            } else {
                this.showGameOver('玩家2 获胜！');
            }
            return;
        }
        if (this.player2.health <= 0) {
            if (this.gameMode === 'stage') {
                this.showStageResult(true);
            } else {
                this.showGameOver('玩家1 获胜！');
            }
            return;
        }
    }

    /**
     * 显示关卡结果
     */
    showStageResult(victory) {
        this.gameState = 'gameover';
        const winnerText = document.getElementById('winnerText');
        
        if (victory) {
            winnerText.textContent = '🎉 挑战成功！';
            
            // 完成关卡
            stageProgress.completeLevel(this.currentStageId);
            
            // 显示奖励
            const rewards = this.currentStageData.rewards;
            console.log(`获得奖励：金币 ${rewards.gold}`, rewards.petFragment);
        } else {
            winnerText.textContent = '💀 挑战失败';
        }
        
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    /**
     * 初始化图鉴界面
     */
    initGalleryScreen() {
        this.galleryMechaTypes = {
            original: ['ironwall', 'shadow', 'mage', 'archer'],
            ai: ['programmer', 'ui_designer', 'product_manager', 'boss']
        };
        
        this.currentGallerySeries = 'original';
        this.selectedGalleryMecha = null;
        
        this.renderGalleryCards();
        
        // 初始化大预览器
        if (!this.galleryPreviewer) {
            const canvas = document.getElementById('galleryMechaCanvas');
            if (canvas) {
                this.galleryPreviewer = new MechaPreviewer(canvas);
                this.galleryPreviewer.startAnimation();
            }
        }
    }

    /**
     * 渲染图鉴卡片
     */
    renderGalleryCards() {
        const container = document.getElementById('galleryCards');
        if (!container) return;
        
        container.innerHTML = '';
        
        const types = this.galleryMechaTypes[this.currentGallerySeries];
        types.forEach(type => {
            const data = MECHA_DATA[type];
            if (!data) return;
            
            const card = document.createElement('div');
            card.className = 'gallery-card';
            card.dataset.mechaType = type;
            
            // 创建小型Canvas预览
            const canvas = document.createElement('canvas');
            canvas.width = 60;
            canvas.height = 75;
            canvas.className = 'gallery-card-canvas';
            
            const previewer = new MechaPreviewer(canvas);
            previewer.setType(type);
            previewer.update(0);
            previewer.draw();
            
            card.appendChild(canvas);
            
            // 角色名称
            const nameDiv = document.createElement('div');
            nameDiv.className = 'gallery-card-name';
            nameDiv.textContent = data.name;
            card.appendChild(nameDiv);
            
            // 角色类型
            const typeDiv = document.createElement('div');
            typeDiv.className = 'gallery-card-type';
            const typeText = this.currentGallerySeries === 'original' ? '原始系列' : 'AI系列';
            typeDiv.textContent = typeText;
            card.appendChild(typeDiv);
            
            // 点击事件
            card.addEventListener('click', () => this.selectGalleryMecha(type));
            
            container.appendChild(card);
        });
    }

    /**
     * 过滤图鉴卡片
     */
    filterGalleryCards(series) {
        this.currentGallerySeries = series;
        this.selectedGalleryMecha = null;
        this.renderGalleryCards();
        
        // 清空详情面板
        document.getElementById('galleryMechaName').textContent = '选择角色查看详情';
        document.getElementById('galleryMechaType').textContent = '';
        document.getElementById('galleryStats').innerHTML = '';
        document.getElementById('gallerySkills').innerHTML = '';
        document.getElementById('galleryPet').innerHTML = '';
    }

    /**
     * 选择图鉴角色
     */
    selectGalleryMecha(type) {
        this.selectedGalleryMecha = type;
        
        // 更新卡片选中状态
        document.querySelectorAll('.gallery-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.mechaType === type) {
                card.classList.add('selected');
            }
        });
        
        const data = MECHA_DATA[type];
        if (!data) return;
        
        // 更新大预览器
        if (this.galleryPreviewer) {
            this.galleryPreviewer.setType(type);
        }
        
        // 更新标题
        document.getElementById('galleryMechaName').textContent = data.name;
        const seriesText = this.galleryMechaTypes.original.includes(type) ? '原始系列机甲' : 'AI系列机甲';
        document.getElementById('galleryMechaType').textContent = seriesText;
        
        // 更新属性
        this.renderGalleryStats(data);
        
        // 更新技能
        this.renderGallerySkills(data, type);
        
        // 更新宠物
        this.renderGalleryPet(type);
    }

    /**
     * 渲染图鉴属性
     */
    renderGalleryStats(data) {
        const container = document.getElementById('galleryStats');
        if (!container) return;
        
        const stats = [
            { label: '生命值', value: `${data.maxHealth} HP` },
            { label: '攻击力', value: `${data.attack} HP` },
            { label: '移动速度', value: this.getSpeedText(data.speed) },
            { label: '防御减免', value: `${Math.round(data.defenseReduction * 100)}%` }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <div class="stat-label">${stat.label}</div>
                <div class="stat-value">${stat.value}</div>
            </div>
        `).join('');
    }

    /**
     * 渲染图鉴技能
     */
    renderGallerySkills(data, type) {
        const container = document.getElementById('gallerySkills');
        if (!container) return;
        
        let skillsHTML = '';
        
        // 普通攻击
        skillsHTML += `
            <div class="skill-item">
                <div class="skill-name">【普通攻击】${this.getAttackName(type)}</div>
                <div class="skill-desc">${this.getAttackDesc(type)}</div>
                <div class="skill-stats">
                    <span class="skill-stat">伤害: ${data.attack} HP</span>
                    <span class="skill-stat">距离: ${data.attackRange} 像素</span>
                    <span class="skill-stat">间隔: ${data.attackInterval || 0.7} 秒</span>
                </div>
            </div>
        `;
        
        // 主动技能
        skillsHTML += `
            <div class="skill-item">
                <div class="skill-name">【主动技能】${data.skillName}</div>
                <div class="skill-desc">${this.getSkillDesc(type)}</div>
                <div class="skill-stats">
                    <span class="skill-stat">伤害: ${data.skillDamage} HP</span>
                    <span class="skill-stat">范围: ${data.skillRange} 像素</span>
                    <span class="skill-stat">冷却: ${data.skillCooldown} 秒</span>
                </div>
            </div>
        `;
        
        // 被动技能
        skillsHTML += `
            <div class="skill-item">
                <div class="skill-name">【被动技能】${data.passiveName}</div>
                <div class="skill-desc">${data.passiveDesc}</div>
            </div>
        `;
        
        container.innerHTML = skillsHTML;
    }

    /**
     * 获取攻击名称
     */
    getAttackName(type) {
        const names = {
            'ironwall': '重拳连击',
            'shadow': '影刃斩',
            'mage': '魔法激光',
            'archer': '精准射击',
            'programmer': '代码飞弹',
            'ui_designer': '像素飞刀',
            'product_manager': '数据射线',
            'boss': '金币飞刀'
        };
        return names[type] || '普通攻击';
    }

    /**
     * 获取攻击描述
     */
    getAttackDesc(type) {
        const descs = {
            'ironwall': '近距离震荡攻击,命中时产生蓝色冲击波特效,造成物理伤害。',
            'shadow': '快速三连斩,带粉色残影特效与速度线,适合高频骚扰输出。',
            'mage': '发射紫色激光光束,带闪烁特效与白色核心,造成魔法伤害。',
            'archer': '发射绿色箭矢,发射瞬间弓口产生绿色闪光,适合远程消耗。',
            'programmer': '发射绿色代码片段飞弹,带有"01101"二进制流特效,命中时产生数据碎片四散效果。攻击频率最快。',
            'ui_designer': '投掷彩色像素块飞刀,带有RGB渐变色彩特效,命中时产生像素爆炸效果。',
            'product_manager': '发射蓝色数据流射线,带有图表曲线特效,命中时显示"+"数字跳动。',
            'boss': '投掷金色金币飞刀,带有金币旋转特效,命中时产生"$$$"文字特效。攻击时播放金币音效。'
        };
        return descs[type] || '基础攻击技能。';
    }

    /**
     * 获取技能描述
     */
    getSkillDesc(type) {
        const descs = {
            'ironwall': '向前方短距离冲刺重击,造成范围震荡伤害,产生白色震荡波纹特效。',
            'shadow': '位移到对方背后攻击,可走位躲避,命中产生粉色轨迹粒子特效。',
            'mage': '在前方指定位置召唤紫色魔法阵,造成圆形范围伤害,产生旋转魔法粒子特效。',
            'archer': '直线飞行箭矢,命中后施加1秒眩晕(目标无法移动/攻击/技能/冲刺/防御),头顶出现旋转金色星星特效。',
            'programmer': '向前方发射红色Bug代码包,命中后敌方机甲出现"ERROR"红色闪烁特效,攻击动作变慢30%。唯一降低攻速技能。',
            'ui_designer': '释放彩虹色波纹,命中后敌方屏幕出现色彩扭曲特效,视野范围临时缩小50%。唯一影响视野技能。',
            'product_manager': '全地图数据波动,敌方身上出现"变更通知"特效,所有技能冷却时间重置为最大值。唯一重置冷却技能。',
            'boss': '发射金色资本光束,命中后敌方能量减少10点,自己获得10点。产生"资本流动"特效。唯一偷取能量技能。'
        };
        return descs[type] || '角色专属技能。';
    }

    /**
     * 渲染图鉴宠物
     */
    renderGalleryPet(type) {
        const container = document.getElementById('galleryPet');
        if (!container) return;
        
        const petMap = {
            'ironwall': 'steel_guardian',
            'shadow': 'shadow_spirit',
            'mage': 'magic_fairy',
            'archer': 'hunter_falcon',
            'programmer': 'codebot',
            'ui_designer': 'pixelpixa',
            'product_manager': 'datagrowth',
            'boss': 'butlerai'
        };
        
        const petType = petMap[type];
        if (!petType) return;
        
        const petData = PET_DATA[petType];
        if (!petData) return;
        
        container.innerHTML = `
            <div class="pet-item">
                <div class="pet-name">【${petData.name}】</div>
                <div class="pet-desc">${petData.description}</div>
                <div class="skill-stats">
                    <span class="skill-stat">生命: ${petData.health} HP</span>
                    <span class="skill-stat">技能: ${petData.skillName}</span>
                    <span class="skill-stat">冷却: ${petData.skillCooldown} 秒</span>
                </div>
            </div>
        `;
    }

    /**
     * 更新AI行为
     */
    updateAI(dt) {
        const ai = this.player2;
        const target = this.player1;
        
        // 初始化AI状态计时器
        if (!ai.aiTimers) {
            ai.aiTimers = {
                lastDecision: 0,
                lastAttack: 0,
                decisionInterval: this.aiConfig.reactionDelay / 1000
            };
        }
        
        ai.aiTimers.lastDecision += dt;
        
        // 根据反应延迟决定决策频率
        if (ai.aiTimers.lastDecision < ai.aiTimers.decisionInterval) {
            return;
        }
        
        ai.aiTimers.lastDecision = 0;
        
        // 计算与目标的距离
        const dx = target.x - ai.x;
        const dy = target.y - ai.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 智能决策
        const decision = this.makeAIDecision(ai, target, distance);
        
        // 执行决策
        this.executeAIDecision(ai, target, decision, distance);
    }

    /**
     * AI决策
     */
    makeAIDecision(ai, target, distance) {
        const strategy = this.aiConfig.skillStrategy;
        
        // 根据策略和距离做出决策
        if (distance < 50) {
            // 近距离：优先攻击或防御
            if (target.isAttacking && ai.energy > 20) {
                return 'defend';
            }
            return 'attack';
        } else if (distance < 150) {
            // 中距离：根据策略行动
            if (strategy === 'random') {
                return Math.random() < 0.5 ? 'approach' : 'attack';
            } else if (strategy === 'occasional') {
                if (Math.random() < 0.3 && ai.skillCooldown <= 0) {
                    return 'skill';
                }
                return 'attack';
            } else {
                // 高级策略
                if (ai.skillCooldown <= 0 && Math.random() < 0.4) {
                    return 'skill';
                }
                if (target.health < target.maxHealth * 0.3) {
                    return 'chase';  // 追击低血量目标
                }
                return 'attack';
            }
        } else {
            // 远距离：接近或使用远程技能
            if (ai.type === 'archer' && ai.skillCooldown <= 0) {
                return 'skill';
            }
            if (ai.type === 'mage' && ai.skillCooldown <= 0 && Math.random() < 0.5) {
                return 'skill';
            }
            return 'approach';
        }
    }

    /**
     * 执行AI决策
     */
    executeAIDecision(ai, target, decision, distance) {
        switch (decision) {
            case 'attack':
                if (ai.performAttack()) {
                    this.playAttackSound(ai);
                }
                break;
                
            case 'defend':
                if (ai.energy > 0) {
                    ai.isDefending = true;
                    setTimeout(() => {
                        if (ai) ai.isDefending = false;
                    }, 500);
                }
                break;
                
            case 'skill':
                const result = ai.performSkill(target, this);
                if (result) {
                    this.screenShake = 0.4;
                }
                // AI宠物技能
                if (this.aiConfig.usePetSkill && this.pet2 && Math.random() < 0.5) {
                    this.pet2.performSkill(target, this);
                }
                break;
                
            case 'approach':
            case 'chase':
                // 向目标移动
                const dx = target.x - ai.x;
                const dy = target.y - ai.y;
                const dir = Math.sign(dx);
                
                // 模拟按键
                ai.vx = dir * ai.speed;
                if (Math.abs(dy) > 20) {
                    ai.vy = Math.sign(dy) * ai.speed;
                }
                
                // 高级AI会尝试冲刺
                if (this.aiConfig.movementMode === 'aggressive' || 
                    this.aiConfig.movementMode === 'predictive') {
                    if (distance > 100 && Math.random() < 0.3) {
                        ai.performDash();
                    }
                }
                break;
        }
    }

    /**
     * 处理输入
     */
    handleInput() {
        // 联机模式下，触摸按钮已在update()中映射到对应按键，这里跳过直接调用
        const isOnline = (this.netMode === 'online' && this.gameMode === 'versus' && this.onlineClient && this.onlineClient.connected);
        // 处理触摸按钮（移动端，非联机模式）
        if (this.touchController.isMobile && !isOnline) {
            // 攻击按钮
            if (this.touchController.getButtonState('attack')) {
                if (this.player1.performAttack()) {
                    this.playAttackSound(this.player1);
                }
            }

            // 防御按钮（持续状态）
            if (this.touchController.buttons.defense && !this.player1.isStunned) {
                if (this.player1.energy > 0 && !this.player1.isDefending) {
                    this.audioSystem.playDefense();
                }
                this.player1.isDefending = this.player1.energy > 0;
            } else if (!this.touchController.buttons.defense) {
                this.player1.isDefending = false;
            }

            // 技能按钮
            if (this.touchController.getButtonState('skill')) {
                const result = this.player1.performSkill(this.player2, this);
                if (result) {
                    this.screenShake = 0.4;
                }
            }

            // 冲刺按钮
            if (this.touchController.getButtonState('dash')) {
                if (this.player1.performDash()) {
                    this.audioSystem.playDash();
                }
            }

            // 宠物技能按钮
            if (this.touchController.getButtonState('pet')) {
                if (this.pet1) {
                    this.pet1.performSkill(this.player2, this);
                }
            }
        }

        // 玩家1攻击
        if (this.keys[KEY_MAPPING.player1.attack]) {
            if (this.player1.performAttack()) {
                this.playAttackSound(this.player1);
            }
            this.keys[KEY_MAPPING.player1.attack] = false;
        }

        // 玩家1防御（眩晕时无法防御）
        if (this.keys[KEY_MAPPING.player1.defense] && !this.player1.isStunned) {
            if (this.player1.energy > 0 && !this.player1.isDefending) {
                this.audioSystem.playDefense();
            }
            if (this.player1.energy > 0) {
                this.player1.isDefending = true;
            }
        }

        // 玩家1技能
        if (this.keys[KEY_MAPPING.player1.skill]) {
            const result = this.player1.performSkill(this.player2, this);
            if (result) {
                // 音效已在performSkill内部播放
                this.screenShake = 0.4;
            }
            this.keys[KEY_MAPPING.player1.skill] = false;
        }

        // 玩家1冲刺
        const dashKeys = KEY_MAPPING.player1.dash;
        if (Array.isArray(dashKeys)) {
            if (dashKeys.some(key => this.keys[key])) {
                if (this.player1.performDash()) {
                    this.audioSystem.playDash();
                }
                dashKeys.forEach(key => this.keys[key] = false);
            }
        } else {
            if (this.keys[dashKeys]) {
                if (this.player1.performDash()) {
                    this.audioSystem.playDash();
                }
                this.keys[dashKeys] = false;
            }
        }

        // 玩家2攻击（如果不是AI）
        if (!this.player2.isAI && (this.keys[KEY_MAPPING.player2.attack] || this.keys[KEY_MAPPING.player2.attackAlt])) {
            if (this.player2.performAttack()) {
                this.playAttackSound(this.player2);
            }
            this.keys[KEY_MAPPING.player2.attack] = false;
            this.keys[KEY_MAPPING.player2.attackAlt] = false;
        }

        // 玩家2防御（如果不是AI）
        if (!this.player2.isAI && (this.keys[KEY_MAPPING.player2.defense] || this.keys[KEY_MAPPING.player2.defenseAlt]) && !this.player2.isStunned) {
            if (this.player2.energy > 0 && !this.player2.isDefending) {
                this.audioSystem.playDefense();
            }
            if (this.player2.energy > 0) {
                this.player2.isDefending = true;
            }
        }

        // 玩家2技能（如果不是AI）
        if (!this.player2.isAI && (this.keys[KEY_MAPPING.player2.skill] || this.keys[KEY_MAPPING.player2.skillAlt])) {
            const result = this.player2.performSkill(this.player1, this);
            if (result) {
                // 音效已在performSkill内部播放
                this.screenShake = 0.4;
            }
            this.keys[KEY_MAPPING.player2.skill] = false;
            this.keys[KEY_MAPPING.player2.skillAlt] = false;
        }

        // 玩家2冲刺（如果不是AI）
        if (!this.player2.isAI && this.keys[KEY_MAPPING.player2.dash]) {
            if (this.player2.performDash()) {
                this.audioSystem.playDash();
            }
            this.keys[KEY_MAPPING.player2.dash] = false;
        }

        // 宠物技能（如果不是AI）
        if (!this.player2.isAI && this.keys[KEY_MAPPING.player2.petSkill]) {
            if (this.pet2) {
                this.pet2.performSkill(this.player1, this);
            }
            this.keys[KEY_MAPPING.player2.petSkill] = false;
        }

        // 宠物技能
        if (this.keys[KEY_MAPPING.player1.petSkill]) {
            if (this.pet1) {
                this.pet1.performSkill(this.player2, this);
            }
            this.keys[KEY_MAPPING.player1.petSkill] = false;
        }

        if (this.keys[KEY_MAPPING.player2.petSkill]) {
            if (this.pet2) {
                this.pet2.performSkill(this.player1, this);
            }
            this.keys[KEY_MAPPING.player2.petSkill] = false;
        }
    }

    /**
     * 按角色类型播放普攻音效
     */
    playAttackSound(mecha) {
        if (mecha.type === 'archer') {
            this.audioSystem.playArrowShot();
        } else if (mecha.type === 'mage') {
            this.audioSystem.playLaserZap();
        } else {
            this.audioSystem.playAttack();
        }
    }

    /**
     * 处理攻击生效帧：射手射出箭矢子弹，法师射出激光
     */
    handleFiredAttacks() {
        this.fireAttack(this.player1, this.player2, 'player1');
        this.fireAttack(this.player2, this.player1, 'player2');
    }

    /**
     * 单个角色的攻击生效结算
     */
    fireAttack(shooter, target, ownerKey) {
        if (!shooter.attackJustFired) return;
        shooter.attackJustFired = false;

        // AI系列近战角色挥击特效（前摇结束瞬间，按角色类型区分）
        if (shooter.type !== 'archer' && shooter.type !== 'mage') {
            this.particleSystem.addMeleeSwingEffect(shooter.type, shooter.x, shooter.y, shooter.facingRight);
        }

        if (shooter.type === 'archer') {
            // 射手：发射一支朝目标当前位置飞行的箭矢（可被走位躲避）
            const dx = target.x - shooter.x;
            const dy = target.y - shooter.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const arrowSpeed = 480; // 像素/秒
            const startX = shooter.x + (shooter.facingRight ? 18 : -18);

            this.projectileSystem.spawn({
                x: startX,
                y: shooter.y,
                vx: (dx / dist) * arrowSpeed,
                vy: (dy / dist) * arrowSpeed,
                maxDistance: shooter.getAttackRange() + 24, // 射程加一点碰撞余量（含猎鹰被动加成）
                damage: shooter.attack,
                owner: ownerKey,
                color: '#44cc44'
            });
        } else if (shooter.type === 'mage') {
            // 法师：水平激光束，前方矩形走廊内命中（垂直错位/无法选中可躲避）
            const dir = shooter.facingRight ? 1 : -1;
            const range = shooter.getAttackRange();
            const x1 = shooter.x + dir * 18;
            const x2 = shooter.x + dir * range;
            const y = shooter.y;

            // 激光特效（约0.22秒）
            shooter.laserEffect = { x1: x1, y1: y, x2: x2, y2: y, time: 0.22, maxTime: 0.22 };

            const forwardDist = (target.x - shooter.x) * dir;
            const verticalGap = Math.abs(target.y - shooter.y);
            const hit = !target.isUntargetable && forwardDist > 0 && forwardDist <= range && verticalGap < 34;

            if (hit) {
                target.takeDamage(shooter.attack);
                shooter.attackHit = true;
                this.particleSystem.addHitEffect(target.x, y);
                this.audioSystem.playHit();
                this.screenShake = Math.max(this.screenShake, 0.1);
            }

            // 光束火花（无论是否命中都有，命中时终点额外爆火花）
            this.particleSystem.createLaserBeamEffect(x1, y, x2, y, hit);
        }
    }

    /**
     * 近战角色（铁壁/影刺）的即时命中检测
     * 射手与法师的伤害分别由投射物碰撞与激光结算，不走这里
     */
    checkMeleeAttacks() {
        // 玩家1近战命中检测
        if (this.player1.type !== 'archer' && this.player1.type !== 'mage' &&
            this.player1.attackActive > 0 && !this.player1.attackHit) {
            if (this.player1.checkHit(this.player2, this.player1.getAttackRange())) {
                this.player2.takeDamage(this.player1.attack);
                this.player1.attackHit = true;
                this.particleSystem.addHitEffect(this.player2.x, this.player2.y);
                this.audioSystem.playHit();
                this.screenShake = 0.2;
            }
        }

        // 玩家2近战命中检测
        if (this.player2.type !== 'archer' && this.player2.type !== 'mage' &&
            this.player2.attackActive > 0 && !this.player2.attackHit) {
            if (this.player2.checkHit(this.player1, this.player2.getAttackRange())) {
                this.player1.takeDamage(this.player2.attack);
                this.player2.attackHit = true;
                this.particleSystem.addHitEffect(this.player1.x, this.player1.y);
                this.audioSystem.playHit();
                this.screenShake = 0.2;
            }
        }
    }

    /**
     * 检查延迟命中技能（影刃风暴等）
     */
    checkDelayedSkills() {
        // 玩家1的瞬移技能
        if (this.player1.skillEffect && this.player1.skillEffect.type === 'shadow_teleport') {
            this.player1.skillEffect.time -= 1/60;
            if (this.player1.skillEffect.time <= 0) {
                const effect = this.player1.skillEffect;
                
                // 瞬移到目标位置
                this.player1.x = effect.toX;
                this.player1.y = effect.toY;
                
                // 判定命中：瞬移后立即攻击（目标无法选中时落空）
                const hitRange = 100; // 攻击范围
                const dist = Math.sqrt(
                    Math.pow(this.player2.x - effect.toX, 2) + 
                    Math.pow(this.player2.y - effect.toY, 2)
                );
                
                if (dist < hitRange && !this.player2.isUntargetable) {
                    this.player2.takeDamage(effect.damage);
                    this.particleSystem.addHitEffect(this.player2.x, this.player2.y);
                    this.audioSystem.playHit();
                    this.screenShake = 0.3;
                }
                
                // 添加瞬移完成特效
                this.particleSystem.createShadowTeleportComplete(
                    effect.fromX, effect.fromY,
                    effect.toX, effect.toY
                );
                
                this.player1.skillEffect = null;
            }
        }

        // 玩家2的瞬移技能
        if (this.player2.skillEffect && this.player2.skillEffect.type === 'shadow_teleport') {
            this.player2.skillEffect.time -= 1/60;
            if (this.player2.skillEffect.time <= 0) {
                const effect = this.player2.skillEffect;
                
                // 瞬移到目标位置
                this.player2.x = effect.toX;
                this.player2.y = effect.toY;
                
                // 判定命中（目标无法选中时落空）
                const hitRange = 100;
                const dist = Math.sqrt(
                    Math.pow(this.player1.x - effect.toX, 2) + 
                    Math.pow(this.player1.y - effect.toY, 2)
                );
                
                if (dist < hitRange && !this.player1.isUntargetable) {
                    this.player1.takeDamage(effect.damage);
                    this.particleSystem.addHitEffect(this.player1.x, this.player1.y);
                    this.audioSystem.playHit();
                    this.screenShake = 0.3;
                }
                
                // 添加瞬移完成特效
                this.particleSystem.createShadowTeleportComplete(
                    effect.fromX, effect.fromY,
                    effect.toX, effect.toY
                );
                
                this.player2.skillEffect = null;
            }
        }

        // 兼容旧的shadow_knife类型（如果还有）
        if (this.player1.skillEffect && this.player1.skillEffect.type === 'shadow_knife') {
            this.player1.skillEffect.time -= 1/60;
            if (this.player1.skillEffect.time <= 0) {
                const effect = this.player1.skillEffect;
                const dx = this.player2.x - effect.targetX;
                const dy = this.player2.y - effect.targetY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 40 && !this.player2.isUntargetable) {
                    this.player2.takeDamage(effect.damage);
                    this.particleSystem.addHitEffect(this.player2.x, this.player2.y);
                    this.audioSystem.playHit();
                    this.screenShake = 0.3;
                }
                
                this.player1.skillEffect = null;
            }
        }

        if (this.player2.skillEffect && this.player2.skillEffect.type === 'shadow_knife') {
            this.player2.skillEffect.time -= 1/60;
            if (this.player2.skillEffect.time <= 0) {
                const effect = this.player2.skillEffect;
                const dx = this.player1.x - effect.targetX;
                const dy = this.player1.y - effect.targetY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 40 && !this.player1.isUntargetable) {
                    this.player1.takeDamage(effect.damage);
                    this.particleSystem.addHitEffect(this.player1.x, this.player1.y);
                    this.audioSystem.playHit();
                    this.screenShake = 0.3;
                }
                
                this.player2.skillEffect = null;
            }
        }
    }

    /**
     * 更新UI
     */
    updateUI() {
        // 更新玩家1状态
        const p1HP = (this.player1.health / this.player1.maxHealth) * 100;
        const p1EP = (this.player1.energy / this.player1.maxEnergy) * 100;
        document.getElementById('p1HealthBar').style.width = p1HP + '%';
        document.getElementById('p1EnergyBar').style.width = p1EP + '%';
        document.getElementById('p1HealthValue').textContent = Math.round(p1HP) + '%';
        document.getElementById('p1EnergyValue').textContent = Math.round(p1EP) + '%';

        // 更新玩家2状态
        const p2HP = (this.player2.health / this.player2.maxHealth) * 100;
        const p2EP = (this.player2.energy / this.player2.maxEnergy) * 100;
        document.getElementById('p2HealthBar').style.width = p2HP + '%';
        document.getElementById('p2EnergyBar').style.width = p2EP + '%';
        document.getElementById('p2HealthValue').textContent = Math.round(p2HP) + '%';
        document.getElementById('p2EnergyValue').textContent = Math.round(p2EP) + '%';

        // 更新技能冷却显示
        const p1SkillCooldown = this.player1.skillCooldown;
        const p2SkillCooldown = this.player2.skillCooldown;

        const p1SkillText = p1SkillCooldown > 0 ? Math.ceil(p1SkillCooldown) + '秒' : '就绪';
        const p2SkillText = p2SkillCooldown > 0 ? Math.ceil(p2SkillCooldown) + '秒' : '就绪';

        document.getElementById('p1SkillCooldown').textContent = p1SkillText;
        document.getElementById('p2SkillCooldown').textContent = p2SkillText;

        // 改变颜色表示状态
        document.getElementById('p1SkillCooldown').style.color = p1SkillCooldown > 0 ? '#ff6666' : '#ffcc00';
        document.getElementById('p2SkillCooldown').style.color = p2SkillCooldown > 0 ? '#ff6666' : '#ffcc00';

        // 更新被动技能状态
        const p1PassiveStatus = this.player1.isDefending ? '激活中' : '待激活';
        const p2PassiveStatus = this.player2.isDefending ? '激活中' : '待激活';
        
        document.getElementById('p1PassiveStatus').textContent = p1PassiveStatus;
        document.getElementById('p2PassiveStatus').textContent = p2PassiveStatus;
        
        document.getElementById('p1PassiveStatus').style.color = this.player1.isDefending ? '#00ff00' : '#88ff88';
        document.getElementById('p2PassiveStatus').style.color = this.player2.isDefending ? '#00ff00' : '#88ff88';

        // 更新玩家名称
        document.getElementById('p1Name').textContent = '玩家1 - ' + MECHA_DATA[this.player1.type].name;
        document.getElementById('p2Name').textContent = '玩家2 - ' + MECHA_DATA[this.player2.type].name;

        // 更新宠物UI
        this.updatePetUI();
    }

    /**
     * 更新宠物UI
     */
    updatePetUI() {
        // 更新玩家1宠物
        if (this.pet1) {
            this.updateSinglePetUI(this.pet1, 'p1');
        }
        
        // 更新玩家2宠物
        if (this.pet2) {
            this.updateSinglePetUI(this.pet2, 'p2');
        }
    }

    /**
     * 更新单个宠物UI
     */
    updateSinglePetUI(pet, prefix) {
        const petHealthBar = document.getElementById(prefix + 'PetHealthBar');
        const petSkillText = document.getElementById(prefix + 'PetSkillCooldown');
        const petIcon = document.getElementById(prefix + 'PetIcon');
        const petName = document.getElementById(prefix + 'PetName');

        // 设置宠物图标颜色
        petIcon.style.backgroundColor = pet.color;
        petIcon.style.color = pet.color;

        // 设置宠物名称
        petName.textContent = pet.name;

        if (pet.isRetreated) {
            // 撤退状态
            petHealthBar.style.width = '0%';
            petHealthBar.classList.remove('warning');
            petHealthBar.classList.add('retreated');
            petSkillText.textContent = '撤退中 ' + Math.ceil(pet.retreatTimer) + '秒';
            petSkillText.className = 'pet-skill-text retreated';
        } else {
            // 正常状态
            const petHealthPercent = (pet.health / pet.maxHealth) * 100;
            petHealthBar.style.width = petHealthPercent + '%';
            petHealthBar.classList.remove('retreated');
            
            // 血量低于30%时闪烁警告
            if (petHealthPercent < 30) {
                petHealthBar.classList.add('warning');
            } else {
                petHealthBar.classList.remove('warning');
            }

            // 技能冷却
            if (pet.skillCooldown > 0) {
                petSkillText.textContent = Math.ceil(pet.skillCooldown) + '秒';
                petSkillText.className = 'pet-skill-text cooldown';
            } else {
                petSkillText.textContent = '就绪';
                petSkillText.className = 'pet-skill-text ready';
            }
        }
    }

    /**
     * 判定胜负
     */
    determineWinner() {
        if (this.player1.health > this.player2.health) {
            this.showGameOver('玩家1 获胜！');
        } else if (this.player2.health > this.player1.health) {
            this.showGameOver('玩家2 获胜！');
        } else if (this.player1.energy > this.player2.energy) {
            this.showGameOver('玩家1 获胜（能量优势）！');
        } else if (this.player2.energy > this.player1.energy) {
            this.showGameOver('玩家2 获胜（能量优势）！');
        } else {
            this.showGameOver('平局！');
        }
    }

    /**
     * 渲染画面
     */
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#2a2a4a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState !== 'playing') return;

        // 应用屏幕震动
        this.ctx.save();
        if (this.screenShake > 0) {
            this.ctx.translate(
                (Math.random() - 0.5) * this.screenShake * 10,
                (Math.random() - 0.5) * this.screenShake * 10
            );
        }

        // 绘制背景
        this.drawBackground();

        // 绘制玩家
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);

        // 绘制投射物（射手箭矢子弹）
        this.projectileSystem.draw(this.ctx);

        // 绘制粒子
        this.particleSystem.draw(this.ctx);

        // 绘制宠物
        if (this.pet1) this.pet1.draw(this.ctx);
        if (this.pet2) this.pet2.draw(this.ctx);

        this.ctx.restore();

        // 色彩混淆视野遮挡（UI设计师技能，画在最上层不受屏幕震动影响）
        this.drawVisionReduceOverlay();
    }

    /**
     * 绘制色彩混淆视野遮挡
     * 玩家1受影响时遮挡左半屏，玩家2受影响时遮挡右半屏，最后1秒渐隐
     */
    drawVisionReduceOverlay() {
        const drawFog = (x, w, timer) => {
            const alpha = timer > 1 ? 0.4 : 0.4 * timer;
            const colors = ['255,0,0', '255,136,0', '255,255,0', '0,255,0', '0,255,255', '0,136,255', '255,0,255'];
            const stripW = w / 7;
            for (let i = 0; i < 7; i++) {
                this.ctx.fillStyle = `rgba(${colors[i]},${alpha})`;
                this.ctx.fillRect(x + i * stripW, 0, stripW + 1, this.canvas.height);
            }
            // 干扰提示文字（闪烁）
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, alpha * 2) * (0.6 + Math.sin(Date.now() / 150) * 0.4)})`;
            this.ctx.fillText('视野受到色彩干扰', x + w / 2, 80);
        };

        if (this.player1.visionReduceTimer > 0) {
            drawFog(0, this.canvas.width / 2, this.player1.visionReduceTimer);
        }
        if (this.player2.visionReduceTimer > 0) {
            drawFog(this.canvas.width / 2, this.canvas.width / 2, this.player2.visionReduceTimer);
        }
    }

    // ============================================
    // 联机模式相关方法
    // ============================================

    /**
     * 初始化本地联机界面（移动端提示切换）
     */
    initVersusSelectScreen() {
        const isMobile = this.touchController && this.touchController.isMobile;
        const controlsInfo = document.getElementById('versusControlsInfo');
        const mobileHint = document.getElementById('versusMobileHint');
        if (controlsInfo) controlsInfo.style.display = isMobile ? 'none' : 'flex';
        if (mobileHint) mobileHint.style.display = isMobile ? 'flex' : 'none';
    }

    /**
     * 初始化线上联机界面
     */
    initOnlineScreen() {
        const statusEl = document.getElementById('onlineStatus');
        // 重置界面到初始状态（用于从对战返回）
        document.getElementById('onlineActions').classList.remove('hidden');
        document.getElementById('joinRoomForm').classList.add('hidden');
        document.getElementById('onlineRoom').classList.add('hidden');
        document.getElementById('onlineCharSelect').classList.add('hidden');
        const readyBtn = document.getElementById('onlineReadyBtn');
        if (readyBtn) {
            readyBtn.textContent = '准备就绪';
            readyBtn.disabled = false;
        }

        // P2P模式：不需要预先连接服务器，直接显示操作选项
        if (statusEl) {
            statusEl.textContent = '请创建房间或加入房间（两台设备连接同一WiFi热点）';
            statusEl.style.color = '#88aaff';
        }

        // 注册回调
        this.onlineClient.onRoomCreated = (code) => {
            document.getElementById('onlineActions').classList.add('hidden');
            document.getElementById('joinRoomForm').classList.add('hidden');
            document.getElementById('onlineRoom').classList.remove('hidden');
            document.getElementById('roomCodeDisplay').textContent = code;
            document.getElementById('roomStatus').textContent = '房间已创建，等待对手加入...';
        };

        this.onlineClient.onOpponentJoined = () => {
            document.getElementById('roomStatus').textContent = '对手已加入！请选择角色';
            document.getElementById('onlineRoom').classList.add('hidden');
            document.getElementById('onlineCharSelect').classList.remove('hidden');
            // 显示等待提示
            const statusEl = document.getElementById('onlineWaitingStatus');
            if (statusEl) {
                statusEl.textContent = '等待对手选择角色...';
                statusEl.style.color = '#ffcc44';
            }
            this.buildOnlineCharGrid();
        };

        this.onlineClient.onOpponentLeft = () => {
            document.getElementById('roomStatus').textContent = '对手已离开';
            document.getElementById('onlineCharSelect').classList.add('hidden');
            document.getElementById('onlineRoom').classList.remove('hidden');
            const readyBtn = document.getElementById('onlineReadyBtn');
            if (readyBtn) {
                readyBtn.textContent = '准备就绪';
                readyBtn.disabled = false;
            }
            const statusEl = document.getElementById('onlineWaitingStatus');
            if (statusEl) {
                statusEl.textContent = '';
            }
        };

        this.onlineClient.onCharSelected = (player, index) => {
            if (player !== this.onlineClient.localPlayerNum) {
                const mechaName = this.mechaConfigs[index]?.name || '未知';
                const statusEl = document.getElementById('onlineWaitingStatus');
                if (statusEl) {
                    statusEl.textContent = '对手已选择：' + mechaName;
                    statusEl.style.color = '#88ff88';
                }
            }
        };

        this.onlineClient.onAllReady = (p1Char, p2Char) => {
            // 双方就绪，开始游戏
            this.selectedMecha = {
                player1: this.onlineClient.isHost ? this.onlineSelectedChar : p1Char,
                player2: this.onlineClient.isHost ? p2Char : this.onlineSelectedChar
            };
            this.gameMode = 'versus';
            this.netMode = 'online'; // 标记为联机对战（输入同步模式）
            this.startGame();
        };

        this.onlineClient.onError = (msg) => {
            const statusEl = document.getElementById('onlineStatus');
            if (statusEl) {
                statusEl.textContent = '错误：' + msg;
                statusEl.style.color = '#ff6666';
            }
        };
    }

    /**
     * 创建房间（P2P模式：直接创建Peer等待连接）
     */
    handleCreateRoom() {
        // 先清理之前的连接
        if (this.onlineClient.peer) {
            this.onlineClient.leaveRoom();
        }
        this.onlineClient.createRoom();
        const statusEl = document.getElementById('onlineStatus');
        if (statusEl) {
            statusEl.textContent = '正在创建房间...';
            statusEl.style.color = '#ffcc44';
        }
    }

    /**
     * 显示加入房间表单
     */
    showJoinRoomForm() {
        document.getElementById('joinRoomForm').classList.remove('hidden');
        document.getElementById('roomCodeInput').focus();
    }

    /**
     * 加入房间（P2P模式：直接连接房主Peer）
     */
    handleJoinRoom() {
        const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
        if (code.length !== 6) {
            alert('房间号为6位字符');
            return;
        }
        // 清理之前的连接
        if (this.onlineClient.peer) {
            this.onlineClient.leaveRoom();
        }
        this.onlineClient.joinRoom(code);
        const statusEl = document.getElementById('onlineStatus');
        if (statusEl) {
            statusEl.textContent = '正在连接房间...';
            statusEl.style.color = '#ffcc44';
        }
    }

    /**
     * 快速匹配（P2P模式不支持，已隐藏按钮）
     */
    handleQuickMatch() {
        alert('P2P联机模式暂不支持快速匹配，请使用创建房间或加入房间');
    }

    /**
     * 离开房间
     */
    handleLeaveRoom() {
        if (this.onlineClient.connected) {
            this.onlineClient.leaveRoom();
        }
        this.onlineClient.roomCode = null;
        this.onlineClient.opponentConnected = false;
        document.getElementById('onlineRoom').classList.add('hidden');
        document.getElementById('onlineCharSelect').classList.add('hidden');
        document.getElementById('joinRoomForm').classList.add('hidden');
        document.getElementById('onlineActions').classList.remove('hidden');
        const statusEl = document.getElementById('onlineStatus');
        if (statusEl && this.onlineClient.connected) {
            statusEl.textContent = '已连接服务器，请选择操作';
            statusEl.style.color = '#88ff88';
        }
    }

    /**
     * 构建线上联机角色网格
     */
    buildOnlineCharGrid() {
        const grid = document.getElementById('onlinePlayerGrid');
        if (!grid) return;
        grid.innerHTML = '';
        this.mechaTypes.forEach((type, index) => {
            const config = MECHA_CONFIG[type];
            const cell = document.createElement('div');
            cell.className = 'char-cell';
            cell.dataset.index = index;
            cell.innerHTML = `
                <div class="char-cell-name">${config.name}</div>
                <div class="char-cell-canvas-wrap"><canvas width="50" height="60" class="char-cell-canvas"></canvas></div>
                <div class="char-cell-type">${this.getMechaTypeText(type)}</div>
            `;
            grid.appendChild(cell);
        });
        this.onlineSelectedChar = 0;
        this.updateOnlineGridSelection(0);
    }

    /**
     * 选择线上联机角色
     */
    selectOnlineChar(index) {
        this.onlineSelectedChar = index;
        this.updateOnlineGridSelection(index);
        const config = MECHA_CONFIG[this.mechaTypes[index]];
        document.getElementById('onlineMechaName').textContent = config.name;
        document.getElementById('onlineMechaStats').textContent =
            `血量:${config.maxHealth} 攻击:${config.attack} 速度:${this.getSpeedText(config.speed)}`;
        if (this.onlineClient.connected) {
            this.onlineClient.selectChar(index);
        }
    }

    /**
     * 更新线上联机网格选中态
     */
    updateOnlineGridSelection(index) {
        const grid = document.getElementById('onlinePlayerGrid');
        if (!grid) return;
        grid.querySelectorAll('.char-cell').forEach((cell, i) => {
            cell.classList.toggle('selected', i === index);
        });
    }

    /**
     * 线上联机准备就绪
     */
    handleOnlineReady() {
        if (!this.onlineClient.connected) {
            alert('对手还未连接，请等待对手加入房间');
            return;
        }
        this.onlineClient.ready();
        const btn = document.getElementById('onlineReadyBtn');
        if (btn) {
            btn.textContent = '已就绪，等待对手...';
            btn.disabled = true;
        }
        // 更新等待状态
        const statusEl = document.getElementById('onlineWaitingStatus');
        if (statusEl) {
            statusEl.textContent = '等待对手准备...';
            statusEl.style.color = '#ffcc44';
        }
    }

    /**
     * 响应式画布适配
     */
    resizeCanvas() {
        const isMobile = this.touchController ? this.touchController.isMobile : false;
        const isLandscape = window.innerWidth > window.innerHeight;

        if (isMobile && isLandscape) {
            // 手机横屏模式：画布占满屏幕，保持4:3比例
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // 保持宽高比 800:600 = 4:3
            const gameRatio = 800 / 600;
            const screenRatio = screenWidth / screenHeight;

            let displayWidth, displayHeight;

            if (screenRatio > gameRatio) {
                // 屏幕更宽（如16:9），以高度为准，画布占满高度
                displayHeight = screenHeight;
                displayWidth = displayHeight * gameRatio;
            } else {
                // 屏幕更方，以宽度为准
                displayWidth = screenWidth;
                displayHeight = displayWidth / gameRatio;
            }

            // 居中显示
            this.canvas.style.width = displayWidth + 'px';
            this.canvas.style.height = displayHeight + 'px';
            this.canvas.style.marginLeft = ((screenWidth - displayWidth) / 2) + 'px';
            this.canvas.style.marginTop = ((screenHeight - displayHeight) / 2) + 'px';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
        } else {
            // PC或竖屏模式
            const maxWidth = Math.min(window.innerWidth, 800);
            const maxHeight = window.innerHeight;

            const ratio = 800 / 600;
            let width = maxWidth;
            let height = width / ratio;

            if (height > maxHeight) {
                height = maxHeight;
                width = height * ratio;
            }

            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            this.canvas.style.marginLeft = 'auto';
            this.canvas.style.marginTop = 'auto';
            this.canvas.style.position = 'static';
        }

        // 保持内部渲染分辨率不变
        this.canvas.width = 800;
        this.canvas.height = 600;

        console.log(`Canvas resized: display ${this.canvas.style.width}x${this.canvas.style.height}, render 800x600`);
    }

    /**
     * 绘制背景
     */
    drawBackground() {
        // 网格地面
        this.ctx.strokeStyle = 'rgba(100,100,150,0.3)';
        this.ctx.lineWidth = 1;
        for (let y = 0; y < 600; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(800, y);
            this.ctx.stroke();
        }
        for (let x = 0; x < 800; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 600);
            this.ctx.stroke();
        }

        // 中心线
        this.ctx.strokeStyle = 'rgba(255,204,0,0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(400, 0);
        this.ctx.lineTo(400, 600);
        this.ctx.stroke();

        // 边缘警示区
        this.ctx.fillStyle = 'rgba(255,100,100,0.1)';
        this.ctx.fillRect(0, 0, 30, 600);
        this.ctx.fillRect(770, 0, 30, 600);
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.update(dt);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}