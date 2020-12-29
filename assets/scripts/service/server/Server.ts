import EventObjectEmitter from "../../core/event/EventObjectEmitter";
import { MessageEventData } from "../../core/event/MessageManager";
import { NetProtocol, NetProtocolEvent } from "../../core/net/NetProtocol";
import { network, NetworkEvent, NetworkState } from "../../core/net/Network";
import { service } from "../Service";

export enum ServerEvent {
    /**服务器状态变化事件 */
    CHANGE = "ServerEvent.CHANGE",
    /**服务器断开状态的轮训事件，1秒发送一次 */
    DISCONNECTED_TICK = "ServerEvent.DISCONNECTED_TICK",
    /** 大厅服务器断开连接 */
    DISCONNECTED = "ServerEvent.DISCONNECTED"
}
/**
 * 当前服务器状态
 */
export enum ServerState {
    DISCONNECTED = 0,    // 断开连接状态
    INLANUCH_SERVER = 1, // 正在连接服务器
    CONNECTTED = 2,      // 服务器已连接
}
export class Server extends EventObjectEmitter {

    public readonly tag: string = "Server"
    constructor(TAG: string = "Server") {
        super();
        this.tag = TAG;
    }
    private _uuid: number = Math.ceil(Date.now() / 1000);
    protected generateUUID(protocol: string): string {
        return protocol + (this._uuid++).toString();
    }

    protected _netProtocol: NetProtocol = null;
    /** 获取TCP协议层 */
    public get netProtocol(): NetProtocol {
        if (!this._netProtocol) {
            this._netProtocol = new NetProtocol();
        }
        return this._netProtocol
    }

    protected _state: ServerState = ServerState.DISCONNECTED;
    public get state(): ServerState {
        return this._state;
    }
    protected setState(val: ServerState) {
        this._state = val;
        cc.warn(`【${this.tag}】 state = ${val}`);
        this.emit(ServerEvent.CHANGE);
    }

    protected serverInfo: Array<string> = null;

    protected _disconnectAlertTimer = null;

    protected _isInitEvents: boolean = false;

    protected _tryConnectTime: number = 0;
    /** 是否可以主动连接服务器 */
    protected _canConnect: boolean = true;

    /** 主动设置 是否可以重连开关 */
    set canConnect(val: boolean) {
        this._canConnect = val;
    }

    /** 断网重连登陆成功后，关闭断网定时器 */
    closeDisconnectAlertTimer() {
        if (this._disconnectAlertTimer) {
            clearInterval(this._disconnectAlertTimer)
            this._disconnectAlertTimer = null;
        }
    }

    protected _tempSaveRequestsCache: Array<{ uuid: string, protocol: string, params?: any, sucess?: Function, failed?: Function }> = [];
    public stepTryConnectTime() {
        return this._tryConnectTime--;
    }

    public msgTarget: MessageEventData = new MessageEventData();

    protected initEvents() {
        if (this._isInitEvents) {
            return;
        }
        this._isInitEvents = true;
        this.msgTarget.on(NetworkEvent.CHANGE, (evt: string, state: NetworkState) => {
            if (state == NetworkState.OFFLINE) {
                cc.warn(`【${this.tag}】监听到网络断开事件，主动断开tcp连接！`);
                this._tryConnectTime = 0;
                this.disconnect(true);

                // 只要监听到网络事件就主动打开断网动画
                service.prompt.netInstableOpen();
            }
        }, this);

        let np = this.netProtocol;
        np.addEventListener(NetProtocolEvent.CLOSE, () => {
            cc.warn(`【${this.tag}】Socket close！`);
            if (this._state == ServerState.CONNECTTED) {
                this._tryConnectTime = 10;
            }
            this.networkCloseHandler();
            service.analytics.logEvent("disconnect", "close", "");

        });
        np.addEventListener(NetProtocolEvent.HEARTBEAT_TIMEOUT, () => {
            cc.warn(`【${this.tag}】Socket HEARTBEAT_TIMEOUT!`);
            if (this._state == ServerState.CONNECTTED) {
                this._tryConnectTime = 10;
            }
            this.networkCloseHandler();
            service.analytics.logEvent("disconnect", "heartTimeout", "");
        });
        np.addEventListener(NetProtocolEvent.PARSE_ERROR, (event: any) => {
            cc.warn(`【${this.tag}】Socket protocol parse error!`);
        });
    }
    destroy() {
        this.msgTarget.removes();
        this.msgTarget = null;
        if (this._netProtocol) {
            this.disconnect();
            this._netProtocol.destroy()
            this._netProtocol = null;
        }
        this._tempSaveRequestsCache = null;
        this.serverInfo = null;
        super.destroy();
    }
    /**
     * 设置错误码回调方法，该回调方法需要返回一个boolean值
     * 返回true 则会回调协议的error，反之跳过error
     * @param func
     */
    public setErrorCodeHandler(func: (protocol: string, code: number) => boolean) {
        this.netProtocol.setErrorCodeListener(func);
    }
    /**
     * 连接服务器
     * @param serverInfo 
     * @param callback 
     */
    public connect(serverurls: Array<string>, callback: Function) {
        // if (engine.network.state != NetworkState.ONLINE) {
        //     cc.log(`【${this.tag}】断网状态，无法connect！`);
        //     this._canConnect = true;
        //     this.networkCloseHandler();
        //     callback(false);
        //     return;
        // }
        this._canConnect = true;
        // 只有尝试连接才会开始监听底层协议事件
        this.initEvents();

        this.serverInfo = serverurls;
        cc.log("this.serverInfo", this.serverInfo)

        let connectSuccess = () => {
            this.setState(ServerState.CONNECTTED);
            callback(true);
        }
        let connectFailed = () => {
            this.setState(ServerState.DISCONNECTED);
            callback(false);
        }
        if (this._state === ServerState.DISCONNECTED) {
            cc.log(`【${this.tag}】尝试登录服务器！`);
            this.setState(ServerState.INLANUCH_SERVER)
            this.$connectNetProtocol(this.serverInfo.shift(), connectSuccess, connectFailed);
        } else {
            cc.log(`【${this.tag}】服务器已经是连接状态！`);
            connectSuccess();
        }
    }

    /** 连接游戏服务器 */
    protected $connectNetProtocol(cwsurl: string, success: Function, failed: Function) {
        let error = (err) => {
            cc.warn(`【${this.tag}】$connectNetProtocol connect error`, err);
            let wsurl = this.serverInfo.shift();
            if (wsurl) {
                this.$connectNetProtocol(wsurl, success, failed);
            } else {
                // service.prompt.serverConnectFail(() => {
                //     this.$connectNetProtocol(host, next);
                // });
                failed();
            }
        }
        this.netProtocol.connect(cwsurl, success, error);
    }

    /**
     * 主动断开服务器连接
     * @param showPopTips 是否提示断线重连提示
     */
    public disconnect(showPopTips: boolean = false) {
        cc.log(`${this.tag} 服务器主动disconnect`, showPopTips)
        this.clearSafeRequestCache();
        this._canConnect = false;
        if (this._disconnectAlertTimer) {
            clearInterval(this._disconnectAlertTimer)
            this._disconnectAlertTimer = null;
        }
        this.setState(ServerState.DISCONNECTED);
        if (this._netProtocol) {
            this._netProtocol.disconnect();
        }
        if (showPopTips) {
            this._canConnect = true;
            this.networkCloseHandler();
            return;
        }
    }

    /**
     * 监听协议推送
     * @param pushProtocol 
     * @param handler 
     */
    public addProtocolListener(pushProtocol: string, handler: Function) {
        return this.netProtocol.addProtocolListener(pushProtocol, handler);
    }
    /**
     * 删除协议推送的回调消息
     * @param pushProtocol 
     * @param handler 
     */
    public removeProtocolListener(pushProtocol: string, handler: Function) {
        if (this._netProtocol) {
            return this._netProtocol.removeProtocolListener(pushProtocol, handler);
        }
    }
    /**
 * 删除协议推送的回调消息
 * @param pushProtocol 
 * @param handler 
 */
    public removeProtocolListeners(pushProtocol: string) {
        if (this._netProtocol) {
            return this.netProtocol.removeProtocolListeners(pushProtocol);
        }
    }
    /**
     * 请求协议
     * @param protocol 
     * @param params 
     * @param complete 
     * @param error 
     */
    public request(protocol: string, params: any, complete: Function, error: Function = null) {
        if (this._state === ServerState.CONNECTTED && network.state == NetworkState.ONLINE) {
            cc.log(`【${this.tag}】,请求协议 ${protocol}`);
            this.netProtocol.request(protocol, params, complete, error);
            return true;
        } else {
            cc.warn(`【${this.tag}】当前服务器状态 ${this._state}，无法发送协议`);
            error(-1);
            return false;
        }
    }

    private _$safeRequestHandler(uuid: string) {
        let arr = this._tempSaveRequestsCache;
        for (let i = 0, flag = true, len = arr.length; i < len; flag ? i++ : i) {
            if (arr[i] && arr[i].uuid === uuid) {
                arr.splice(i, 1);
                flag = false;
            } else {
                flag = true;
            }
        }
    }
    /**
     * 安全请求协议，如果服务器断联，则会等服务器连接成功以后，自动重发
     * @param protocol 
     * @param params 
     * @param complete 
     * @param error 
     */
    public safetyRequest(protocol: string, params: any, complete: Function, error: Function = null) {
        if (typeof params == "function") {
            error = complete;
            complete = params;
            params = null;
        }
        for (const proInfo of this._tempSaveRequestsCache) {
            if (proInfo.uuid.indexOf(protocol) >= 0) {
                cc.warn(`【${this.tag}】safetyRequest 警告，调用safetyRequest必须等上个同样的协议返回后才可以调用下一个同等协议！ ${protocol}`);
                return;
            }
        }
        let uuid = this.generateUUID(protocol);
        this._tempSaveRequestsCache.push({
            uuid: uuid,
            protocol: protocol,
            params: params,
            sucess: complete,
            failed: error
        })
        let $complete = (data) => {
            this._$safeRequestHandler(uuid);
            complete && complete(data);
        }
        let $error = (code) => {
            if (code == -1) {
                return;
            }
            this._$safeRequestHandler(uuid);
            error && error(code);
        }
        this.request(protocol, params, $complete, $error);
    }
    /**
     * 清除未完成协议缓存
     */
    clearSafeRequestCache() {
        this._tempSaveRequestsCache = [];
    }

    public resendSafetyCacheRequest() {
        cc.log("resendSafetyCacheRequest")
        if (this._tempSaveRequestsCache.length < 1) {
            return;
        }
        let requestInfo = this._tempSaveRequestsCache.shift();
        cc.log("resendSafetyCacheRequest 重新补发送协议", requestInfo.protocol)
        let ok = null;
        if (requestInfo.sucess) {
            ok = (data) => {
                requestInfo.sucess(data);
                this.resendSafetyCacheRequest();
            }
        }
        let failed = null;
        if (requestInfo.failed) {
            failed = (code) => {
                requestInfo.failed(code);
                this.resendSafetyCacheRequest();
            }
        }
        this.request(requestInfo.protocol, requestInfo.params, ok, failed);
    }


    protected networkCloseHandler() {
        // 传递大厅断网事件
        this.emit(ServerEvent.DISCONNECTED);
        if (this._state != ServerState.DISCONNECTED) {
            if (this._netProtocol) {
                this._netProtocol.disconnect();
            }
        }
        this.setState(ServerState.DISCONNECTED);
        if (!this._disconnectAlertTimer && this._canConnect) {
            service.prompt.netInstableOpen();
            this._disconnectAlertTimer = setInterval(() => {
                if (this._state == ServerState.DISCONNECTED) {
                    this.emit(ServerEvent.DISCONNECTED_TICK);
                }
            }, 1000);
        }
    }
}