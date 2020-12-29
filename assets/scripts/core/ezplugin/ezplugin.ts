
import { PluginCoreIOSPATH, PluginCoreJAVAPATH, PluginEntityData } from "./ezdefine";
import { PluginBridgeCore } from "./PluginBridgeCore";
import { PluginEntity } from "./PluginEntity";
const trace = function (...args) {
    cc.log("PluginBridgeCore", ...args)
}
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

export class Ezplugin {

    private core: PluginBridgeCore = null;

    private _sysInfo: any = null;
    /**
     * 获取系统和app信息
     */
    public get sysInfo(): any {
        return this._sysInfo;
    }

    private _plugins: any = {};

    private _initCallbacks: Array<Function> = [];

    constructor() {
        if (!CC_EDITOR) {
            try {
                if (cc.sys.isNative) {
                    if (cc.sys.OS_ANDROID === cc.sys.os) {
                        this.core = new PluginBridgeCore(PluginCoreJAVAPATH);
                    } else if (cc.sys.OS_IOS === cc.sys.os) {
                        this.core = new PluginBridgeCore(PluginCoreIOSPATH);
                    }
                } else if (cc.sys.isBrowser) {
                    // 是否开启web插件
                    // this.core = new PluginBridgeCore(PluginCoreWebPATH);
                }
                if (this.core) {
                    let info = this.core.sysInfo();
                    if (info) {
                        this._sysInfo = JSON.parse(info);
                    }
                    trace("Ezplugin_sysInfo", info);
                }
            } catch (e) {
                trace(e);
            }
            if (!this._sysInfo) {
                let uuidtoken = getWeakUUID();
                this._sysInfo = {
                    uuid: uuidtoken
                }
                if (cc.sys.isBrowser) {
                    this._sysInfo["browser"] = cc.sys.browserType + cc.sys.browserVersion;
                }
            }
            if (!this._sysInfo["username"]) {
                let ssusrname = cc.sys.localStorage.getItem("visitor_username");
                if (!ssusrname) {
                    ssusrname = uuid(8, 16);
                    cc.sys.localStorage.setItem("visitor_username", ssusrname);
                }
                this._sysInfo["username"] = ssusrname;
            }
        }
    }
    /**
     * 注册ezplugin插件列表初始化完成回调
     * @param callback 
     */
    public registerInitedCallback(callback: (ezplugin: Ezplugin) => void) {
        if (!this._initCallbacks) {
            callback(this);
        } else {
            this._initCallbacks.push(callback);
        }
    }
    /**
     * 初始化插件
     * @param pluginListData 
     * @param callback 
     */
    public initPlugins(pluginListData: Array<PluginEntityData>, callback: (ezplugin: Ezplugin) => void) {
        pluginListData.forEach(function (pluginData) {
            if (!pluginData.params) {
                pluginData.params = {};
            }
        });
        this.core.initAllPlugins(pluginListData, (error, ret) => {
            if (error) {
                trace("initAllPlugins 初始化插件错误", error.toString());
                return;
            }
            let pluginNames = ret.split("&");
            for (let pluginName of pluginNames) {
                if (pluginName) {
                    let iipluginData = null;
                    for (let pluginData of pluginListData) {
                        if (pluginData.pluginName === pluginName) {
                            iipluginData = pluginData;
                            break;
                        }
                    }
                    if (!iipluginData) {
                        iipluginData = {
                            pluginName: pluginName,
                            params: {}
                        };
                    }
                    this._createPlugin(iipluginData);
                }
            }
            callback(this);
            for (let cb of this._initCallbacks) {
                cb(this);
            }
            this._initCallbacks = null;
        });
    }
    /**
     * 初始化单个插件
     * @param pluginData 
     * @param callback 
     */
    public initPlugin(pluginData: PluginEntityData, callback: (plugin: PluginEntity) => void) {
        if (!pluginData.params) {
            pluginData.params = {};
        }
        this.core.initPlugin(pluginData, (error, ret) => {
            if (error) {
                trace("初始化发生错误", error.toString());
            } else {
                callback(this._createPlugin(pluginData));
            }
        })
    }
    /**
     * 获取一个插件
     * @param pluginName 
     */
    public get(pluginName: string): PluginEntity {
        return this._plugins[pluginName] || null;
    }

    private _createPlugin(pluginData: { pluginName: string, params: any }) {
        let plugin = new PluginEntity(pluginData, this.core);
        this._plugins[pluginData.pluginName] = plugin;
        return plugin;
    }

    nativeEventHandler(pluginName: string, event: string, params: string) {
        this.core.nativeEventHandler(pluginName, event, params)
    }
    nativeCallbackHandler(callbackId: number, params: string) {
        this.core.nativeCallbackHandler(callbackId, params);
    }
    nativeCallbackErrorHandler(callbackId: number, msg: string) {
        this.core.nativeCallbackErrorHandler(callbackId, msg)
    }

}

export const ezplugin = new Ezplugin();

if (window && typeof window === 'object') {
    window['ezplugin'] = ezplugin;
}
