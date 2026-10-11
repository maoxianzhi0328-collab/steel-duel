/**
 * 线上联机客户端 - WebRTC P2P 模式
 *
 * 设计说明：
 * - 纯手机热点联机：用户A开WiFi热点，用户B连接，两台手机直接P2P通信
 * - 使用 PeerJS 库（公共信令服务器简化WebRTC连接）
 * - 输入同步：每帧发送本地按键状态，双方各自模拟
 * - 无需中心服务器运行游戏逻辑
 *
 * 消息协议（P2P数据通道，JSON对象）：
 *   {type: 'char_selected', player: 1|2, index: N}     角色选择
 *   {type: 'host_ready', charIndex: N}                 房主准备
 *   {type: 'ready', charIndex: N}                       客机准备
 *   {type: 'all_ready', p1Char: N, p2Char: N}           双方就绪
 *   {type: 'input', keys: {...}}                        输入同步（简化版）
 *   {type: 'action', action: 'attack'|'skill'|...}      触发动作
 */

class OnlineClient {
    constructor(game) {
        this.game = game;
        this.peer = null;           // PeerJS 实例
        this.conn = null;           // P2P 数据连接
        this.connected = false;     // P2P是否已连接
        this.isHost = false;        // 是否是房主
        this.localPlayerNum = 1;    // 本地玩家编号（房主=1，客机=2）
        this.roomCode = null;       // 房间号
        
        // 状态管理
        this.localCharIndex = 0;
        this.localReady = false;
        this.remoteCharIndex = -1;
        this.remoteReady = false;

        // **优化：输入同步改为最新状态模式**
        this.latestRemoteInput = null;  // 最新的对手输入（不依赖帧号）
        this.lastSendTime = 0;          // 上次发送时间
        this.sendInterval = 16;         // 发送间隔（ms），约60fps

        // 回调
        this.onConnected = null;
        this.onDisconnected = null;
        this.onRoomCreated = null;
        this.onOpponentJoined = null;
        this.onOpponentLeft = null;
        this.onCharSelected = null;
        this.onAllReady = null;
        this.onOpponentInput = null;
        this.onOpponentAction = null;
        this.onError = null;
    }

    createRoom() {
        this.isHost = true;
        this.localPlayerNum = 1;
        const roomId = this.generateRoomId();
        this.roomCode = roomId;

        this.peer = new Peer('sd-' + roomId);

        this.peer.on('open', (id) => {
            this.roomCode = id.replace('sd-', '');
            if (this.onRoomCreated) this.onRoomCreated(this.roomCode);
        });

        this.peer.on('connection', (conn) => {
            this.conn = conn;
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('Peer错误:', err);
            if (this.onError) this.onError(err.type + ': ' + err.message);
        });
    }

    joinRoom(roomCode) {
        this.isHost = false;
        this.localPlayerNum = 2;
        this.roomCode = roomCode.toUpperCase();

        this.peer = new Peer();

        this.peer.on('open', () => {
            const conn = this.peer.connect('sd-' + this.roomCode, {
                reliable: false,  // 使用不可靠传输降低延迟
                ordered: false    // 不保证顺序
            });
            this.conn = conn;
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('Peer错误:', err);
            if (this.onError) this.onError(err.type + ': ' + err.message);
        });
    }

    setupConnection(conn) {
        if (conn.open) {
            this.connected = true;
            if (this.onOpponentJoined) this.onOpponentJoined();
        }

        conn.on('open', () => {
            this.connected = true;
            if (this.onOpponentJoined) this.onOpponentJoined();
        });

        conn.on('data', (data) => {
            this.handleMessage(data);
        });

        conn.on('close', () => {
            this.connected = false;
            if (this.onOpponentLeft) this.onOpponentLeft();
        });

        conn.on('error', (err) => {
            console.error('连接错误:', err);
            if (this.onError) this.onError(err.message);
        });
    }

    handleMessage(msg) {
        switch (msg.type) {
            case 'char_selected':
                this.remoteCharIndex = msg.index;
                if (this.onCharSelected) this.onCharSelected(msg.player, msg.index);
                break;

            case 'host_ready':
                if (!this.isHost) {
                    this.remoteCharIndex = msg.charIndex;
                    this.remoteReady = true;
                    console.log('[客机] 收到房主准备消息');
                    if (this.onCharSelected) {
                        this.onCharSelected(1, msg.charIndex);
                    }
                }
                break;

            case 'ready':
                if (this.isHost) {
                    this.remoteCharIndex = msg.charIndex;
                    this.remoteReady = true;
                    if (this.onCharSelected) {
                        this.onCharSelected(2, msg.charIndex);
                    }
                    if (this.localReady && this.remoteReady) {
                        const p1Char = this.localCharIndex;
                        const p2Char = this.remoteCharIndex;
                        console.log('[房主] 双方都准备好，开始游戏', {p1Char, p2Char});
                        this.send({ type: 'all_ready', p1Char: p1Char, p2Char: p2Char });
                        if (this.onAllReady) this.onAllReady(p1Char, p2Char);
                    }
                }
                break;

            case 'all_ready':
                if (!this.isHost) {
                    console.log('[客机] 收到all_ready，开始游戏', msg);
                    if (this.onAllReady) this.onAllReady(msg.p1Char, msg.p2Char);
                }
                break;

            case 'input':
                // **优化：直接保存最新输入，不依赖帧号**
                this.latestRemoteInput = msg.keys;
                if (this.onOpponentInput) this.onOpponentInput(msg.keys);
                break;

            case 'action':
                if (this.onOpponentAction) this.onOpponentAction(msg.action);
                break;
        }
    }

    send(msg) {
        if (this.conn && this.connected) {
            this.conn.send(msg);
        }
    }

    leaveRoom() {
        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
        }
        this.peer = null;
        this.conn = null;
        this.connected = false;
        this.roomCode = null;
        this.localReady = false;
        this.remoteReady = false;
        this.localCharIndex = 0;
        this.remoteCharIndex = -1;
        this.latestRemoteInput = null;
    }

    selectChar(charIndex) {
        this.localCharIndex = charIndex;
        this.send({ type: 'char_selected', player: this.localPlayerNum, index: charIndex });
    }

    ready() {
        this.localReady = true;
        
        if (this.isHost) {
            this.send({ type: 'host_ready', charIndex: this.localCharIndex });
            console.log('[房主] 发送host_ready消息');
            
            if (this.remoteReady) {
                const p1Char = this.localCharIndex;
                const p2Char = this.remoteCharIndex;
                console.log('[房主] 双方都准备好，开始游戏', {p1Char, p2Char});
                this.send({ type: 'all_ready', p1Char: p1Char, p2Char: p2Char });
                if (this.onAllReady) this.onAllReady(p1Char, p2Char);
            }
        } else {
            this.send({ type: 'ready', charIndex: this.localCharIndex });
            console.log('[客机] 发送ready消息');
        }
    }

    /**
     * **优化后的输入同步**：每帧调用，但限制发送频率
     */
    sendInput(keys) {
        const now = performance.now();
        
        // 限制发送频率（约每16ms发送一次，即60fps）
        if (now - this.lastSendTime < this.sendInterval) {
            return;
        }
        this.lastSendTime = now;

        let inputKeys;
        if (this.localPlayerNum === 2) {
            inputKeys = {
                KeyW: keys.ArrowUp || false,
                KeyA: keys.ArrowLeft || false,
                KeyS: keys.ArrowDown || false,
                KeyD: keys.ArrowRight || false,
                KeyJ: keys.Comma || false,
                KeyK: keys.Period || false,
                KeyL: keys.Slash || false,
                ShiftLeft: keys.Enter || false,
                KeyI: keys.Quote || false
            };
        } else {
            inputKeys = {
                KeyW: keys.KeyW || false,
                KeyA: keys.KeyA || false,
                KeyS: keys.KeyS || false,
                KeyD: keys.KeyD || false,
                KeyJ: keys.KeyJ || false,
                KeyK: keys.KeyK || false,
                KeyL: keys.KeyL || false,
                ShiftLeft: keys.ShiftLeft || false,
                KeyI: keys.KeyI || false
            };
        }
        
        // 只发送有变化的按键（进一步优化流量）
        this.send({ type: 'input', keys: inputKeys });
    }

    /**
     * **优化：直接获取最新的对手输入**
     */
    getLatestRemoteInput() {
        return this.latestRemoteInput;
    }

    /**
     * 清理旧的输入缓存（保留兼容性）
     */
    cleanupInputs(currentFrame, keepFrames = 60) {
        // 不再需要清理，因为只保存最新输入
    }

    generateRoomId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    isReady() {
        return this.connected;
    }

    isOpponentCharSelected() {
        return this.remoteCharIndex >= 0;
    }

    isOpponentReady() {
        return this.remoteReady;
    }
}