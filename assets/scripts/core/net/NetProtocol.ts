import EventObjectEmitter from "../event/EventObjectEmitter";

/*
 * @CreateTime: Sep 21, 2017 9:33 AM
 * @Author: dgflash
 * @Contact: dgflash@qq.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 10, 2018 5:58 PM
 * @Description: pomelo ＴＣＰ协议处理
 */

/** 协议success */
const PROTOCOL_CODE_SUCCESS = 0;
/** 如果服务器协议数据不包含code则当成错误码9处理 */
const PROTOCOL_CODE_UNKNOWN_REQUEST = 9;


/** 协议事件 */
export enum NetProtocolEvent {
    /** 初始化事件 */
    INITED = "NetProtocolEvent.INITED",
    /** 关闭事件 */
    CLOSE = "NetProtocolEvent.CLOSE",
    /** 处理错误事件 */
    PARSE_ERROR = "NetProtocolEvent.PARSE_ERROR",
    /** 心跳超时 */
    HEARTBEAT_TIMEOUT = "NetProtocolEvent.HEARTBEAT_TIMEOUT",
}

export class NetProtocol extends EventObjectEmitter {

    public tag = "NetProtocol";
    /**
     * 错误码回调方法
     */
    protected errorCodeHandler: (protocol: string, code: number) => boolean = null;

    protected _tcp = null;
    protected initTcp() {
        let pomelo = require("pomelo-client");
        let tcp = pomelo("proto_" + this.tag);
        // 监听TCP协议的事件
        tcp.on(tcp.Events.CLOSE, () => {
            this.emit(NetProtocolEvent.CLOSE);
        });

        tcp.on(tcp.Events.PARSE_ERROR, (event: any) => {
            cc.warn(event.stack);
            cc.error(this.tag, JSON.stringify(event));
            this.emit(NetProtocolEvent.PARSE_ERROR);
        });
        tcp.on(tcp.Events.HEARTBEAT_TIMEOUT, (event: any) => {
            if (event) {
                if (event.stack) {
                    cc.log(this.tag, JSON.stringify(event.stack, null, 2))
                } else {
                    cc.log(this.tag, JSON.stringify(event, null, 2))
                }
            }
            this.emit(NetProtocolEvent.HEARTBEAT_TIMEOUT);
        });
        this._tcp = tcp;
        this.emit(NetProtocolEvent.INITED);
    }

    destroy() {
        if (this._tcp) {
            this._tcp.destroy();
            this._tcp = null;
        }
        super.destroy();
    }
    /***
     * 设置错误码回调方法，该回调方法需要返回一个boolean值
     */
    public setErrorCodeListener(func: (protocol: string, code: number) => boolean) {
        this.errorCodeHandler = func;
    }

    /**
     * 连接服务器
     * @param options 
     * @param successHandler 
     * @param errorHandler 
     */
    public connect(url: string, successHandler: Function, errorHandler: Function) {
        if (!this._tcp) {
            this.initTcp();
        }
        cc.log(`[${this.tag}] connect`, url);
        this._tcp.init({ url: url }, successHandler, errorHandler);
    }

    /**
     * 主动断开连接
     */
    public disconnect() {
        if (this._tcp) {
            this._tcp.disconnect();
        }
    }

    /**
     * 监听协议推送
     * @param pushProtocol 
     * @param handler 
     */
    public addProtocolListener(pushProtocol: string, handler: Function) {
        if (!this._tcp) {
            this.initTcp();
        }
        this._tcp.on(pushProtocol, handler);        // 玩家属性变化
    }
    /**
     * 删除协议推送的回调消息
     * @param pushProtocol 
     * @param handler 
     */
    public removeProtocolListener(pushProtocol: string, handler: Function) {
        if (this._tcp) {
            this._tcp.removeListener(pushProtocol, handler);
        }
    }


    /**
     * 取消所有监听
     * @param pushProtocol 
     */
    public removeProtocolListeners(pushProtocol: string) {
        if (this._tcp) {
            this._tcp.removeAllListeners(pushProtocol);        // 玩家属性变化
        }
    }

    /**
     * 服务器协议请求，连带返回码一起处理
     * @params {String}   protocol 协议字符串
     * @params {Object}   params   参数
     * @params {Function} complete 完成回调
     * @params {Function} error    错误回调
     */
    public request(protocol: string, params: any, complete: Function, error: Function = null) {
        if (typeof params == "function") {
            error = complete;
            complete = params;
            params = null;
        }
        // cc.log(`[${this.tag}] request ${protocol} `)
        if (!this._tcp) {
            this.initTcp();
        }
        this._tcp.request(protocol, params, (content: any) => {
            if (content.code === PROTOCOL_CODE_SUCCESS) {
                if (complete) complete(content.data);
            } else {
                cc.log(`[${this.tag}] 请求错误 ${protocol} error = ${content.code}`)
                if (content.code == null) {
                    content.code = PROTOCOL_CODE_UNKNOWN_REQUEST;
                }
                if (this.errorCodeFunction(protocol, content.code)) {

                }
                if (error) error(content.code, content.data);
            }
        });
    }

    /**
     * 返回true表示游戏可继续，false表示必须返回大厅或者退出游戏
     * @param code 
     */
    protected errorCodeFunction(protocol: string, code: number): boolean {
        cc.log(`[${this.tag}] errorCodeFunction ${protocol} code=${code} `)
        if (this.errorCodeHandler) {
            return this.errorCodeHandler(protocol, code);
        } else {
            cc.warn(`[${this.tag}] this.errorCodeHandler = null，请注册一个errorCode的回调函数! `)
            return true;
        }
    }
}