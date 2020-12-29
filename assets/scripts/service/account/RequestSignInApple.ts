/*
 * Author      : donggang
 * Create Time : 2017.8.31
 */
import { ezplugin } from "../../core/ezplugin/ezplugin";
import { PluginEntity } from "../../core/ezplugin/PluginEntity";
import { service } from "../Service";
import { RequestAccount, RequestAccountPool } from "./RequestAccount";
import { gui } from "../../core/gui/GUI";
import { LoginType } from "./LoginType";

const TAG = "RequestSignInApple";
const PLUGIN_NAME = "PluginSignInApple";

/** 请求苹果登录 */
class RequestSignInApple extends RequestAccount {

    readonly platform = 4;

    userInfo: any = null;

    sdkLoginComplete: (data: any) => void = null;

    get plugin(): PluginEntity {
        return ezplugin.get(PLUGIN_NAME);
    }
    constructor() {
        super();
        if (this.plugin) {
            this.plugin.addEventListener(this.pluginEventHandler.bind(this))
        }
    }
    private pluginEventHandler(event: string, params: any) {
        cc.log(`[${TAG}] ${event} ${params}`);
        switch (event) {
            case "logined": {
                this.userInfo = JSON.parse(params);
                this.sdkLoginComplete && this.sdkLoginComplete(this.userInfo);
                this.sdkLoginComplete = null;
                break;
            }
            case "login_cancel": {
                cc.log("当前登录取消");
                this.sdkLoginComplete && this.sdkLoginComplete(null);
                this.sdkLoginComplete = null;
                gui.notify.show("login_cancel");
                break;
            }
            case "login_error": {
                cc.log("登录失败");
                this.sdkLoginComplete && this.sdkLoginComplete(null);
                this.sdkLoginComplete = null;
                gui.notify.show("login_error");
                // ToDo
                break;
            }
            case "logout": {
                cc.log("玩家退出登录");
                this.sdkLoginComplete && this.sdkLoginComplete(null);
                this.sdkLoginComplete = null;
                break;
            }
            case "update_error": {
                cc.log("账号升级失败");
                break;
            }
        }
    }

    /**
     * 绑定SDK账号
     * @param callback 
     */
    public sdkBindAccount(callback?: (data: any) => void) {
        this.userInfo = null;
        this.sdkLoginComplete = null;
        if (this.plugin) {
            cc.log(`【${TAG}】 sdkBindAccount `);
            this.sdkLoginComplete = callback;
            this.plugin.excute("bindAccount", "");
        } else {
            gui.notify.show("bind_apple_not_support");
            callback(null);
        }
    }

    /**
     * 登录SDK账号
     * @param callback 
     */
    public sdkLogin(callback?: (data: any) => void) {
        this.userInfo = null;
        this.sdkLoginComplete = null;
        if (this.plugin) {
            cc.log(`【${TAG}】 sdkLogin `);
            this.sdkLoginComplete = callback;
            this.plugin.excute("login", "");
        } else {
            gui.notify.show("login_google_not_support");
            callback(null);
        }
    }

    /**
     * 请求登录协议
     * @param callback 
     */
    public login(callback: (data: any) => void): void {
        if (!this.userInfo) {
            this.sdkLogin((data) => {
                if (data) {
                    this.login(callback);
                } else {
                    callback(null);
                }
            })
            return;
        }
        cc.log(`【${TAG}】 login `);
        let userInfo = this.userInfo;
        let userID: string = userInfo['id'] || "";                  // 唯一标识ID
        if (userID && userID.length > 40) {
            userID = userID.substr(0, 40);
        }
        let username = userInfo["name"] || ezplugin.sysInfo["username"];        // 用户名
        let avatar = userInfo['avatar'] || "";        // avatar

        this.normalLogin({
            platform: this.platform,
            accountId: userID,
            nickname: username,
            avatar: avatar,
            os: cc.sys.os.toLowerCase(),
        }, callback,
            () => {
                callback(null);
            });
    }

    public bindAccount($callback: (data: any) => void): void {
        cc.log(`【${TAG}】 bindAccount `);
        service.prompt.netInstableOpen();
        let callback = (data) => {
            service.prompt.netInstableClose();
            $callback(data);
        }
        this.sdkBindAccount((userInfo) => {
            if (!userInfo) {
                callback(null);
                return;
            }
            let userID = userInfo['id'];                  // 唯一标识ID
            let username = userInfo["name"] || ezplugin.sysInfo["username"];        // 用户名
            let avatar = userInfo["avatar"];
            service.server.safetyRequest("connector.hallHandler.bindAccount", {
                platform: this.platform,
                accountId: userID,
                nickname: username,
                avatar: avatar,
            },
                (data) => {
                    data["accountId"] = userID;
                    data["nickname"] = username;
                    callback(data);
                }, () => {
                    callback(null)
                });
        })
    }

    public logout(): void {
        if (this.plugin) {
            this.plugin.excute("logout", "");
        }
    }

    public exit(): void {

    }
}

RequestAccountPool.register(LoginType.apple, () => {
    return new RequestSignInApple();
})