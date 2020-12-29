/*
 * @CreateTime: Dec 11, 2018 11:25 AM
 * @Author: howe
 * @Contact: ihowe@outlook.com
* @Last Modified By: howe
* @Last Modified Time: Oct 9, 2019 5:24 PM
 * @Description: 用户账号系统接口，包括登录，重连处理
 */

import engine from "../../core/Engine";
import { EventDispatcher } from "../../core/event/EventDispatcher";
import main from "../../Main";
import Config from "../config/Config";
import { Server, ServerEvent, ServerState } from "../server/Server";
import { service } from "../Service";
import { AccountData } from "./AccountData";
import { LoginType } from "./LoginType";
import { RequestAccount, RequestAccountPool } from "./RequestAccount";

export enum AccountEvent {
    /** 登录成功事件*/
    LOGINED = "AccountEvent.LOGINED",
    /** 登录失败事件*/
    LOGIN_FAILED = "AccountEvent.LOGIN_FAILED",
    /** 登出事件 */
    LOGOUT = "AccountEvent.LOGOUT",
    /** 游客绑定成功 */
    VISITOR_BIND_SUCCESS = "AccountEvent.VISITOR_BIND_SUCCESS",
    /** 游客绑定失败 */
    VISITOR_BIND_FAILED = "AccountEvent.VISITOR_BIND_FAILED"
}
export class Account extends EventDispatcher {

    protected _isReconnect: boolean = false;                           // 是否重连接
    /** 是否正在重连接 */
    public get isReconnected() {
        return this._isReconnect;
    }
    protected _isLogined: boolean = false;
    public get isLogined(): boolean {
        return this._isLogined;
    }

    public getRequestAccount(): RequestAccount {
        return RequestAccountPool.get(this.currentPlatform);
    }

    protected _data: AccountData = null;
    public get data() {
        return this._data;
    }
    // // 服务器管理对象
    private _server: Server = null;

    public get currentPlatform(): LoginType {
        let saveType = cc.sys.localStorage.getItem("logintype");
        return (saveType as LoginType) || LoginType.unlogin;
    }

    public set currentPlatform(type: LoginType) {
        cc.sys.localStorage.setItem("logintype", type);
    }

    constructor(server: Server) {
        super();
        this._server = server;

        this._data = new AccountData();

        server.addEventListener(ServerEvent.DISCONNECTED_TICK, this.eventHandler, this);

        this._server.addProtocolListener("onKick", this.onKick.bind(this));
        cc.log(`[Account] constructor`);
    }

    /**
     * 登录
     * @param type 
     */
    public login(loginType: LoginType) {
        this.currentPlatform = loginType;
        let serverConnectHandler = (val) => {
            this.$loginServer(loginType, val);
        }
        if (this._server.state == ServerState.DISCONNECTED) {
            this._isLogined = false;
            let serverurl = Config.game.data["server"];
            cc.log("[Account] 连接游戏", serverurl);
            this._server.connect([serverurl, serverurl, serverurl], serverConnectHandler);
        } else if (this._server.state == ServerState.CONNECTTED) {
            serverConnectHandler(true);
        } else {
            cc.log("[Account] 正在连接服务器！");
        }
    }

    private $loginServer(platformType: LoginType, val: boolean) {
        if (!val) {
            cc.log("[Account]服务器连接失败");
            this.currentPlatform = platformType;
            return;
        }
        let request = RequestAccountPool.get(platformType);
        if (!request) {
            cc.error(` ${platformType} is null!`);
            return;
        }
        request && request.login((data) => {
            this.accountLoginHandler(platformType, data);
        });
    }

    private accountLoginHandler(platformType: LoginType, data) {
        if (!data) {
            cc.log(`[Account] 登录失败`);
            this.dispatchEvent(AccountEvent.LOGIN_FAILED);
            service.server.disconnect(true);
            return;
        }
        this.currentPlatform = platformType;
        cc.log(" [Account] 登录成功", JSON.stringify(data.userInfo, null, 2));
        this._data.setData(data);
        let serverTime = data.serverTime || data.timeStamp;
        engine.timer.serverTimeElasped(serverTime - Date.now());
        // 全局保存货币类型
        // engine.value.currency = data["userInfo"]["currency"];

        this._isReconnect = false;
        this._isLogined = true;
        this._server.resendSafetyCacheRequest();
        engine.log.info(`发送LOGINED事件`);
        this.dispatchEvent(AccountEvent.LOGINED);
        service.prompt.netInstableClose();
        this._server.closeDisconnectAlertTimer();
    }

    private visitorBindHandler(platformType: LoginType, data: any) {
        if (data) {
            cc.log(" [Account] 绑定成功", JSON.stringify(data, null, 2));
            if (data["userInfo"]) {
                // this.data.gold = data["userInfo"]["balance"]
            }
            this.data.nickName = data.nickname;
            this.data.accountId = data.accountId;
            this.currentPlatform = platformType;
            this.dispatchEvent(AccountEvent.VISITOR_BIND_SUCCESS);
        } else {
            cc.log(`[Account] 绑定失败`);
            this.dispatchEvent(AccountEvent.VISITOR_BIND_FAILED);
        }
    }
    /**
     * 断线重连登录
     */
    public relogin(platform: LoginType) {
        this._isReconnect = true;
        cc.warn("触发重新登陆流程");
        this.login(platform);
    }

    bindAccount(platformType: LoginType) {
        if (this.currentPlatform !== LoginType.visitor) {
            cc.log("[Account] 只有游客账号才可以绑定！！！");
            return;
        }
        let request = RequestAccountPool.get(platformType);
        switch (platformType) {
            case LoginType.facebook: {
                cc.log("[Account] 执行绑定Facebook账号")
                request && request.bindAccount((data) => {
                    this.visitorBindHandler(platformType, data);
                })
                break;
            }
            case LoginType.google: {
                request && cc.log("[Account] [Account]执行绑定google账号")
                request.bindAccount((data) => {
                    this.visitorBindHandler(platformType, data);
                })
                break;
            }
        }
    }
    /**
     * 登出
     */
    public logout() {
        let request = RequestAccountPool.get(this.currentPlatform);
        if (!request) {
            cc.error(` ${this.currentPlatform} is null!`)
        }
        request && request.logout();
        this.currentPlatform = LoginType.unlogin;
        this._isLogined = false;

        this._data.logout();
        this._server.disconnect();
        // service.httpServer.logout();
        this.dispatchEvent(AccountEvent.LOGOUT);
    }


    private onKick(data: any) {
        cc.log("[Account]  User is kicked! msg=", data);
        if (data.reason == 4) {
            cc.log("[Account] 长时间未操作自动重连");
            this.relogin(this.currentPlatform);
            return;
        }
        this.logout();
        // 账号被踢
        service.prompt.errorCodePrompt(10000 + parseInt(data.reason), () => {
            main.module.exitHall();
        });
    }
    private eventHandler(event, args) {
        switch (event) {
            case ServerEvent.DISCONNECTED_TICK: {
                // 判断是否可以自动重连，只有10次自动重连
                let count = service.server.stepTryConnectTime();
                if (count > 0) {
                    cc.log("[Account] 重连剩余次数" + count)
                    this.relogin(this.currentPlatform);
                    return;
                }
                service.prompt.netInstableClose();
                if (!service.prompt.hasPopView()) {
                    cc.log("[Account] 大厅服务器 断线重连");
                    service.prompt.hallServerDisconnected(
                        () => {
                            cc.log("用户选择重连！")
                            // 打开重连动画
                            service.prompt.netInstableOpen();
                            this.relogin(this.currentPlatform);
                        },
                        () => {
                            cc.log("用户选择返回登录界面！")
                            main.module.exitHall();
                        })
                }
                break;
            }
        }
    }
}