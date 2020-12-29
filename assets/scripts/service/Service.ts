import { Server } from "./server/Server";
import { Prompt } from "./prompt/Prompt";
import { Account } from "./account/Account";
import { SettingManager } from "./SettingManager";
import { LogAnalytics } from "./LogAnalytics";

import Config from "./config/Config";
import engine from "../core/Engine";
import { ShareLink } from "./ShareLink";

export class service {
    /** 服务器连接管理层 */
    public static server: Server = null;

    // public static httpServer:HttpServer = null;

    /** 公共界面、错误码弹窗管理 */
    public static prompt: Prompt = null;
    /** 账号登录、登出、重连 */
    public static account: Account = null;
    /** 本地设置数据层 */
    public static setting: SettingManager = null;
    public static analytics: LogAnalytics = null;
    public static shareLink: ShareLink = null;

    public static init(callback: (data) => void) {
        service.analytics = new LogAnalytics();
        service.shareLink = new ShareLink("globaltycoon://");

        service.setting = new SettingManager();
        service.prompt = new Prompt();
        cc.log("[service] 读取客户端配置 config ");
        let configFile = "config";
        cc.loader.loadRes(configFile, (err, data) => {
            if (err) {
                cc.error("加载config.json失败");
            }

            Config.init(data.json || data);

            cc.log("[Service] config =", JSON.stringify(data.json));

            engine.i18n.supportLanguages = Config.game.language;
            // service.httpServer = new HttpServer();
            service.server = new Server("Server");
            service.account = new Account(service.server);
            window["account"] = service.account;
            callback(Config.game.data);
        });
    }
    /**
     * 退出关闭游戏，和以前executeCloseUrl作用一致
     */
    public static exitGame() {
        cc.log('【service】-> exitGame');
        // if (service.account && service.account.getRequestAccount()){
        //     service.account.getRequestAccount().exit();
        // }

        // if (cc.sys.isBrowser){
        //     let closeUrl = Config.query.closeUrl; 
        //     let disableHomeBtn = Config.query.disableHomeBtn;
        //     if ( disableHomeBtn == "0" || !disableHomeBtn ) {
        //         if ( closeUrl ) {
        //             let url: string = decodeURIComponent( closeUrl );
        //             (<any>window).location = url;
        //             return;
        //         }
        //     }
        //     else if ( disableHomeBtn == "1") {
        //         cc.log("移除所有关闭/退出的按钮");
        //     }
        // }
    }

}

