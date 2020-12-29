/*
 * @CreateTime: Jul 5, 2018 4:51 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
* @Last Modified By: howe
* @Last Modified Time: Nov 28, 2019 4:16 PM
 * @Description: Modify Here, Please 
 * 
 * 检测监听网络状态 
 * web模式基于HTML5 API
 * 
 */
import { EventDispatcher } from "../event/EventDispatcher";
import { ezplugin, Ezplugin } from "../ezplugin/ezplugin";

export enum NetworkEvent {
    /** 网络变化事件 */
    CHANGE = "NetworkEvent.CHANGE"
}

/** 网络状态 */
export enum NetworkState {
    /** 未知 */
    UNKNOWN = "unknown",
    /** 联网在线 */
    ONLINE = "online",
    /** 断网 */
    OFFLINE = "offline"
}

// typedef NS_ENUM(NSInteger, ReachabilityStatus) {
//     ///Direct match with Apple networkStatus, just a force type convert.
//     RealStatusUnknown = -1,
//     RealStatusNotReachable = 0,
//     RealStatusViaWWAN = 1,
//     RealStatusViaWiFi = 2
// };
function isValidIP(ip) {
    var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
    return reg.test(ip);
}
export class Network extends EventDispatcher {
    private _state: NetworkState = NetworkState.UNKNOWN;
    constructor() {
        super()
        if (CC_EDITOR) {
            return;
        }
        if (cc.sys.isBrowser) {
            // web模式
            this._webInit();
        } else {
            // native模式 待补充
            this._state = NetworkState.ONLINE;
            ezplugin.registerInitedCallback(this.nativeEzpluginInited.bind(this))
        }
    }

    /**
     * 是否为有效IP v4
     * @param ip 
     */
    isValidIP(ip: string) {
        return isValidIP(ip);
    }


    private nativeEzpluginInited(ezplugin: Ezplugin) {
        let plugin = ezplugin.get("PluginOS")
        if (plugin) {
            let netChangeHandler = (event: string, params: string) => {
                if (event !== "network_change") {
                    return;
                }
                cc.log("当前网络出现变化，", params);
                switch (params) {
                    case "-1":
                        {
                            this.changeState(NetworkState.OFFLINE);
                            break;
                        }
                    case "0": {
                        this.changeState(NetworkState.ONLINE);
                        break;
                    }
                    default: {
                        this.changeState(NetworkState.ONLINE);
                        break;
                    }
                }
            }
            plugin.excute("network", "", (err, params) => {
                if (!err) {
                    netChangeHandler("network_change", params);
                }
            })
            plugin.addEventListener(netChangeHandler)
        }
    }
    /**
     * 获取网络状态
     */
    get state(): NetworkState {
        return this._state;
    }

    private changeState(state: NetworkState) {
        if (this._state === state) {
            return;
        }
        this._state = state;
        cc.log("[Network] " + state);
        this.dispatchEvent(NetworkEvent.CHANGE, state);
    }

    private _webInit() {
        this._callback(navigator.onLine);

        let _window = <any>window;
        let el: any = document.body;
        if (el.addEventListener) {
            _window.addEventListener("online", () => {
                this._callback(true)
            }, true);
            _window.addEventListener("offline", () => {
                this._callback(false)
            }, true);
        } else if (el.attachEvent) {
            _window.attachEvent("ononline", () => {
                this._callback(true)
            });
            _window.attachEvent("onoffline", () => {
                this._callback(false)
            });
        } else {
            _window.ononline = () => {
                this._callback(true)
            };
            _window.onoffline = () => {
                this._callback(false)
            };
        }
        // PC模式用 online.js判断网络连接
        if (!cc.sys.isMobile) {
            (<any>window).onLineHandler = () => {
                this._callback(true);
            }
            (<any>window).offLineHandler = () => {
                this._callback(false);
            }
        }
    }
    private _callback(online: boolean) {
        if (online) {
            this.changeState(NetworkState.ONLINE)
        } else {
            this.changeState(NetworkState.OFFLINE)
        }
    }
}

export const network = new Network();