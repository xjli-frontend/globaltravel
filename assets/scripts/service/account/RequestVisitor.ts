/*
 * Author      : donggang
 * Create Time : 2017.8.31
 */
import { ezplugin } from "../../core/ezplugin/ezplugin";
import { PluginEntity } from "../../core/ezplugin/PluginEntity";
import Config from "../config/Config";
import { LoginType } from "./LoginType";
import { RequestAccount, RequestAccountPool } from "./RequestAccount";

/**
 * // 平台类型
	PLATFORM: {
		NONE: 0,    // 其它
		GOOGLE: 1,
		APPLE: 2,
		FACEBOOK: 3,
		TWITTER: 4,
	}
 */

const TAG = "RequestVisitor";
/** 请求游客登录 */
class RequestVisitor extends RequestAccount {
    platform = 0;

    uuid: string = "";
    username: string = ""
    constructor() {
        super();
        if (this.plugin) {
            this.plugin.addEventListener(this.pluginEventHandler.bind(this))
        }
    }

    get plugin(): PluginEntity {
        return ezplugin.get("PluginVisitor");
    }

    private pluginEventHandler(event: string, params: any) {
        cc.log(event, params);
        switch (event) {
            case "logined": {
                // this.sdkLoginedHandler(params);
                break;
            }
            case "login_cancel": {
                cc.log("当前登录取消");
                break;
            }
            case "login_error": {
                cc.log("登录失败");
                // ToDo        
                break;
            }
            case "logout": {
                cc.log("玩家退出登录");
            }
        }
    }
    /**
     * 
     * @param callback 
     */
    public sdkLogin(callback?: (data: any) => void) {
        cc.log(`【${TAG}】 sdkLogin `);
        let token = "";
        if (cc.sys.isBrowser) {
            token = getWeakUUID();
        } else {
            token = ezplugin.sysInfo["uuid"] || getWeakUUID();
        }
        this.uuid = token;
        let ssusrname = cc.sys.localStorage.getItem("visitor_username");
        if (!ssusrname) {
            ssusrname = token.substr(0, 8);
            cc.sys.localStorage.setItem("visitor_username", ssusrname);
        }
        this.username = ssusrname;
        callback(this.uuid);
    }

    /**
     * 登录协议
     * @param callback 
     */
    public login(callback?: (data: any) => void): void {
        cc.log(`【${TAG}】 login `);
        let query = Config.query;
        this.normalLogin({
            accountId: cc.sys.isBrowser ? (query.name || this.uuid):this.uuid,
            nickname: this.username,
            os: cc.sys.os.toLowerCase(),
            platform: this.platform,
            avatar: ""
        }, callback,
            (code) => {
                callback(null);
            });
    }

    public logout(): void {
        this.plugin && this.plugin.excute("logout", "");
    }

    public bindAccount(callback: (data: any) => void) { }

    public exit(): void { }
}

RequestAccountPool.register(LoginType.visitor, () => {
    return new RequestVisitor();
})

let getWeakUUID = function () {
    function uuidGenerator(len, radix) {
        let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        let uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            // Compact form
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
        } else {
            // rfc4122, version 4 form
            let r;

            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            // Fill in random data. At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }
        return uuid.join('');
    }
    let uuid = cc.sys.localStorage.getItem("__uuid_");
    if (!uuid) {
        uuid = cc.sys.os + cc.sys.platform + "_" + uuidGenerator(13, 16);
        uuid = uuid.replace(/[\s]+/, "")
        cc.sys.localStorage.setItem("__uuid_", uuid);
    }
    return uuid;
}

function uuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form  
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form  
        var r;

        // rfc4122 requires these characters  
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data.  At i==19 set the high bits of clock sequence as  
        // per rfc4122, sec. 4.1.5  
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join('');
}  