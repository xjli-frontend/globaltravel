/*
 * @CreateTime: Jun 10, 2020 6:48 PM 
 * @Author: howe 
 * @Contact: ihowe@outlook.com 
 * @Last Modified By: howe 
 * @Last Modified Time: Jun 10, 2020 6:48 PM 
 * @Description: Modify Here, Please  
 * 日志事件上报系统
 */

import { ezplugin } from "../core/ezplugin/ezplugin";
import { service } from "./Service";

export class LogAnalytics {

    setUserProperty() {
        let plugin = ezplugin.get("PluginFirebase");
        if (plugin) {
            let accountData = service.account.data;
            plugin.excute("setUserProperty", {
                uid: accountData.uid.toString(),
                accountID: accountData.accountId.toString(),
                accountPlatform: service.account.currentPlatform.toString(),
                level: accountData.level.toString()
            })
        }
    }
    logEvent(event: string, key: string, value: string | number) {
        let plugin = ezplugin.get("PluginFirebase");
        if (plugin) {
            // cc.log("LogAnalytics event = " + event + ' -- key = ' + key)
            plugin.excute("log_event", {
                event: event || "unknow",
                key: key || "",
                value: value.toString()
            })
        }
    }

}