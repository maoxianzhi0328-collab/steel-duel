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
 *   {type: 'ready', charIndex: N}                       准备就绪（客机发给房主）
 *   {type: 'all_ready', p1Char: N, p2Char: N}           双方就绪（房主广播）
 *   {type: 'input', frame: N, keys: {...}}              输入同步
 *   {type: 'action', action: 'attack'|'skill'|...}      触发动作
 *   {type: 'ping'}                                      心跳
 */

class OnlineClient {
    constructor(game) {
        this.game = game;
        this.peer = null;           // PeerJS 实例
        this.conn = null;           // P2P 数据连接
        this.connected = false;     // P2P是否已连接
        this.isHost = false;        // 是否是房主
        this.localPlayerNum = 1;    // 本地玩家编号（房主=1，客机=2）
        this.roomCode = null;       // 房间号（即Peer ID的后半部分）
        this.localCharIndex = 0;    // 本地选择的角色
        this.localReady = false;    // 本地是否已就绪

        // 接收到的对手输入
        this.remoteInputs = {};

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

    /**
     * 创建房间（作为房主）
     * 生成随机房间号，创建Peer并等待连接
     */
    createRoom() {
        this.isHost = true;
        this.localPlayerNum = 1;
        const roomId = this.generateRoomId();
        this.roomCode = roomId;

        // 用房间号作为Peer ID
        this.peer = new Peer('sd-' + roomId);

        this.peer.on('open', (id) => {
            // id = 'sd-' + roomId，显示时去掉前缀
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

    /**
     * 加入房间（作为客机）
     * @param {string} roomCode - 6位房间号
     */
    joinRoom(roomCode) {
        this.isHost = false;
        this.localPlayerNum = 2;
        this.roomCode = roomCode.toUpperCase();

        // 创建Peer并连接房主
        this.peer = new Peer();

        this.peer.on('open', () => {
            const conn = this.peer.connect('sd-' + this.roomCode);
            this.conn = conn;
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('Peer错误:', err);
            if (this.onError) this.onError(err.type + ': ' + err.message);
        });
    }

    /**
     * 设置数据连接的事件处理
     */
    setupConnection(conn) {
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

    /**
     * 处理接收到的消息
     */
    handleMessage(msg) {
        switch (msg.type) {
            case 'char_selected':
                if (this.onCharSelected) this.onCharSelected(msg.player, msg.index);
                break;
            case 'ready':
                // 房主收到客机的ready
                if (this.isHost) {
                    // 房主自己也ready了，广播all_ready
                    if (this.localReady) {
                        const p1Char = this.localCharIndex;
                        const p2Char = msg.charIndex;
                        this.send({ type: 'all_ready', p1Char: p1Char, p2Char: p2Char });
                        if (this.onAllReady) this.onAllReady(p1Char, p2Char);
                    }
                }
                break;
            case 'all_ready':
                if (this.onAllReady) this.onAllReady(msg.p1Char, msg.p2Char);
                break;
            case 'input':
                this.remoteInputs[msg.frame] = msg.keys;
                if (this.onOpponentInput) this.onOpponentInput(msg.frame, msg.keys);
                break;
            case 'action':
                if (this.onOpponentAction) this.onOpponentAction(msg.action);
                break;
        }
    }

    /**
     * 发送消息（通过P2P数据通道）
     */
    send(msg) {
        if (this.conn && this.connected) {
            this.conn.send(msg);
        }
    }

    /**
     * 离开房间
     */
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
    }

    /**
     * 选择角色
     */
    selectChar(charIndex) {
        this.localCharIndex = charIndex;
        this.send({ type: 'char_selected', player: this.localPlayerNum, index: charIndex });
    }

    /**
     * 准备就绪
     */
    ready() {
        this.localReady = true;
        if (this.isHost) {
            // 房主：等待客机ready，暂时不做什么
            // 当收到客机ready时，在handleMessage中处理
        } else {
            // 客机：发送ready给房主
            this.send({ type: 'ready', charIndex: this.localCharIndex });
        }
    }

    /**
     * 发送本地输入（每帧调用）
     * 协议统一使用玩家1的按键名（KeyW/KeyA/.../KeyI），
     * 本地是玩家2时，把Arrow/Comma/.../Quote映射到玩家1的按键名再发送。
     */
    sendInput(frame, keys) {
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
        this.send({ type: 'input', frame: frame, keys: inputKeys });
    }

    /**
     * 获取对手在某帧的输入
     */
    getRemoteInput(frame) {
        return this.remoteInputs[frame] || null;
    }

    /**
     * 清理过期的输入缓存
     */
    cleanupInputs(currentFrame, keepFrames = 60) {
        const cutoff = currentFrame - keepFrames;
        Object.keys(this.remoteInputs).forEach(frame => {
            if (parseInt(frame) < cutoff) {
                delete this.remoteInputs[frame];
            }
        });
    }

    /**
     * 生成6位房间号（不含易混淆字符）
     */
    generateRoomId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    /**
     * 检查对手是否已连接
     */
    isReady() {
        return this.connected;
    }
}
