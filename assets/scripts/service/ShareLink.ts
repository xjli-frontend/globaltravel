import { ezplugin } from "../core/ezplugin/ezplugin";
import Config from "./config/Config";
import { service } from "./Service";
import { gui } from "../core/gui/GUI";

export class ShareLink {

    launchScheme = ""

    pluginFirebaseEventId: number = 0;

    // 启动链接参数
    launchLink: string = "";

    parseURL(url): any {
        let urlarr = url.split("?");
        let queryStr = urlarr[0];
        if (urlarr.length > 0) {
            queryStr = urlarr[1];
        }
        if (!queryStr) {
            return {};
        }
        let querys = queryStr.split("&");
        let data = {};
        for (let kv of querys) {
            if (kv) {
                let kvs = kv.split("=");
                if (kvs.length > 0 && kvs[0]) {
                    let k = kvs[0];
                    let v = kvs[1] || "";
                    data[k] = v;
                }
            }
        }
        return data;
    }

    parseLink(url: string): any {
        let data = {};
        if (!url) {
            return data;
        }
        try {
            if (url.indexOf(this.launchScheme) < 0) {
                let queryStr = decodeURIComponent(url);
                return this.parseURL(queryStr);
            }
            // 原始分享出去的url链接
            let target_url = "";
            let linkA = this.parseURL(url);
            if (linkA["al_applink_data"]) {
                let jsonstr = decodeURIComponent(linkA["al_applink_data"]);
                let jobj = JSON.parse(jsonstr);
                if (jobj["target_url"]) {
                    target_url = jobj["target_url"];
                }
            } else {
                if (linkA["target_url"]) {
                    target_url = decodeURIComponent(linkA["target_url"]);
                }
            }
            if (target_url) {
                let targetURLObj = this.parseURL(target_url);
                let referrer = targetURLObj["referrer"];
                if (referrer) {
                    referrer = decodeURIComponent(referrer);
                    // let querys = referrer.split("&");
                    // for (let kv of querys) {
                    //     if (kv) {
                    //         let kvs = kv.split("=");
                    //         if (kvs.length > 0 && kvs[0]) {
                    //             let k = kvs[0];
                    //             let v = kvs[1] || "";
                    //             data[k] = v;
                    //         }
                    //     }
                    // }
                    return this.parseURL(referrer);
                }
            }
        } catch (e) {
            cc.log(e);
        }
        return data;
    }
    getParams() {
        return this.parseLink(this.launchLink);
    }
    constructor(scheme: string = "epicslots://") {
        this.launchScheme = scheme;
        let pluginFirebase = ezplugin.get("PluginFirebase");
        if (pluginFirebase) {
            pluginFirebase.excute("getDynamicLink", "", (err, params) => {
                if (err) {
                    cc.error(err.message)
                } else {
                    this.launchLink = params;
                    // gui.notify.show(params); // 测试用
                    // let linkcachefile = jsb.fileUtils.getWritablePath() + "/sharelink.txt";
                    // jsb.fileUtils.writeStringToFile(params, linkcachefile)
                }
            })
            this.pluginFirebaseEventId = pluginFirebase.addEventListener((event, params) => {
                switch (event) {
                    case "DynamicLinkChanged": {
                        this.launchLink = params;
                        // gui.notify.show(params); // 测试用
                        // let linkcachefile = jsb.fileUtils.getWritablePath() + "/sharelink.txt";
                        // jsb.fileUtils.writeStringToFile(params, linkcachefile)
                        break;
                    }
                }
            })
        }
    }

    createShareLink(): string {
        let uid = service.account.data.uid;
        let accid = service.account.data.accountId;
        let shareLink = Config.game.data["fbshareLink"] || "";
        // uid和链接生成时间分享出去
        let params = 'uid=' + uid + "&accid=" + accid + "&ctime=" + Date.now();
        params = encodeURIComponent(params);
        return `${shareLink}?referrer=${params}`;
    }
}