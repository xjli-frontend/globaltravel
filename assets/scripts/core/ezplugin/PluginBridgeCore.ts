import { PluginEntityData, PluginCallbackFunction, PluginEventFunction } from "./ezdefine";

const trace = function (...args) {
    cc.log("PluginBridgeCore", ...args)
}
const traceError = function (...args) {
    cc.error("PluginBridgeCore", ...args)
}
/**
 * 

// ArrayBuffer转为字符串，参数为ArrayBuffer对象
function bufferToString(buffer) {
    return String.fromCharCode.apply(null, new Uint16Array(buffer));
}

// 字符串转为ArrayBuffer对象，参数为字符串
function stringToBuffer(str) {
    var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
 */

export class PluginBridgeCore {

    /********************************************************************* */
    // 为避免app重启出现id重复，此处使用时间作为uuid起始数
    private _uuidcount = Math.floor(Date.now() / 1000);
    private generatorUUID(): number {
        return this._uuidcount++;
    }

    private nativeToJsCallbackHash = {};
    private exchangeCallbackID(func: Function): number {
        if (typeof func === 'function') {
            let uuid = this.generatorUUID();
            this.nativeToJsCallbackHash[uuid] = func;
            return uuid;
        }
        return 0;
    }

    private nativeToJsEventHash = {};
    /********************************************************************* */


    private NativePluginCorePATH: string = "";

    constructor(NativePluginCorePATH: string) {
        this.NativePluginCorePATH = NativePluginCorePATH;
    }
    /**
     * 获取设备系统信息
     * @param NativePluginCorePATH 
     */
    public sysInfo(): string {
        if (cc.sys.isNative) {
            switch (cc.sys.os) {
                case cc.sys.OS_ANDROID: {
                    return jsb.reflection.callStaticMethod(this.NativePluginCorePATH, "sysInfo", "()Ljava/lang/String;");
                }
                case cc.sys.OS_IOS: {
                    return jsb.reflection.callStaticMethod(this.NativePluginCorePATH, "sysInfo");
                }
            }
        }
        if (cc.sys.isBrowser) {
            return require(this.NativePluginCorePATH).sysInfo();
        }
    }
    /**
     * 初始化所有插件
     * @param pluginListData 
     * @param callback 
     */
    public initAllPlugins(pluginListData: Array<PluginEntityData>, callback: PluginCallbackFunction) {
        trace("initAllPlugins");
        try {
            let _callId = this.exchangeCallbackID(callback);
            if (cc.sys.isNative) {
                let params = JSON.stringify(pluginListData);
                switch (cc.sys.os) {
                    case cc.sys.OS_ANDROID: {
                        jsb.reflection.callStaticMethod(this.NativePluginCorePATH,
                            "initAllPlugins", "(Ljava/lang/String;I)V",
                            params, _callId);
                        return true;
                    }
                    case cc.sys.OS_IOS: {
                        jsb.reflection.callStaticMethod(this.NativePluginCorePATH,
                            "initAllPlugins:andCallback:",
                            params, _callId);
                        return true;
                    }
                }
            }
            if (cc.sys.isBrowser) {
                let webcore = require(this.NativePluginCorePATH);
                if (webcore) {
                    webcore.initAllPlugins(pluginListData, _callId);
                    return true;
                }
            }
            this.nativeCallbackErrorHandler(_callId, "not supported")
            trace(`[注意] 当前系统无法进行插件初始化！`);
        } catch (e) {
            traceError(" 错误", e);
        }
        return false;
    };

    public initPlugin(pluginData: PluginEntityData, callback: PluginCallbackFunction) {
        try {
            let _callId = this.exchangeCallbackID(callback);
            let pluginName = pluginData.pluginName;
            if (cc.sys.isNative) {
                let params = JSON.stringify(pluginData.params || {});
                switch (cc.sys.os) {
                    case cc.sys.OS_ANDROID: {
                        jsb.reflection.callStaticMethod(this.NativePluginCorePATH,
                            "initPlugin", "(Ljava/lang/String;Ljava/lang/String;I)V",
                            pluginName, params, _callId);
                        return true;
                    }
                    case cc.sys.OS_IOS: {
                        jsb.reflection.callStaticMethod(this.NativePluginCorePATH,
                            "initPlugin:andPluginData:andCallback:",
                            pluginName, params, _callId);
                        return true;
                    }
                }
            }
            if (cc.sys.isBrowser) {
                let webcore = require(this.NativePluginCorePATH);
                if (webcore) {
                    webcore.initPluigin(pluginName, pluginData["params"] || {}, _callId)
                    return true;
                }
            }
            this.nativeCallbackErrorHandler(_callId, pluginName + "not supported")
            trace("PluginCore", `[注意] 当前系统无法进行 ${pluginName}插件初始化！`);
        } catch (e) {
            traceError("[PluginCore]->initPlugin 错误", e);
            callback && callback(new Error("not supported"), e);
        }
        return false;
    };

    /**
    *  调用native插件方法
    * @param  {string}   pluginName    插件名称
    * @param  {string}   action        插件动作名
    * @param  {string|object}   params        参数    （optional可选）
    * @param  {boolean}  isInUITheard  是否在UI线程中调用 （optional可选）
    * @param  {function} callback      回调函数 （optional可选）
    * @return {number}  回调id 返回-1表示该方法无法执行
    */
    excute(pluginName: string, action: string, params: string | number | object, isInUITheard: boolean, callback?: PluginCallbackFunction): number {
        try {
            let _params = "";
            switch (typeof params) {
                case "string":
                case "number": {
                    _params = params.toString();
                    break;
                }
                case "object": {
                    try {
                        _params = JSON.stringify(params);
                    } catch (e) {
                        traceError(e)
                        _params = "";
                    }
                    break;
                }
            }
            let _callId = this.exchangeCallbackID(callback);
            if (cc.sys.isNative) {
                switch (cc.sys.os) {
                    case cc.sys.OS_ANDROID: {
                        let callName = 'excute';
                        if (isInUITheard) {
                            callName = 'excuteInUIThread'
                        }
                        jsb.reflection.callStaticMethod(this.NativePluginCorePATH,
                            callName, "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;I)V",
                            pluginName, action, _params, _callId);
                        return _callId;
                    }
                    case cc.sys.OS_IOS: {
                        jsb.reflection.callStaticMethod(this.NativePluginCorePATH,
                            'excute:andAction:andParams:andCallBack:',
                            pluginName, action, _params, _callId);
                        return _callId;
                    }
                }
            }
            if (cc.sys.isBrowser) {
                let webcore = require(this.NativePluginCorePATH);
                if (webcore) {
                    webcore.excute(pluginName, action, _params, _callId)
                    return _callId;
                }
            }
            this.nativeCallbackErrorHandler(_callId, pluginName + "not supported")
        } catch (e) {
            traceError("excute 错误", e);
            trace(arguments);
        }
        return -1;
    }

    /**
    * 注册插件事件
    * @param {function} callback 事件回调方法
    * @return {number} 事件id
    */
    addEventListener(pluginName: string, callback: PluginEventFunction): number {
        if (typeof callback !== "function") {
            return;
        }
        let cid = this.generatorUUID();
        this.nativeToJsEventHash[cid] = {
            pluginName: pluginName,
            callback: callback
        };
        return cid;
    }

    /**
     * 删除插件事件
     * @param {string|number}   eventIdOrPluginName 插件名称或事件ID
     */
    removeEventListener(eventIdOrPluginName: string | number): void {
        let nativeToJsEventHash = this.nativeToJsEventHash
        if (typeof eventIdOrPluginName === "number") {
            delete nativeToJsEventHash[eventIdOrPluginName];
        } if (typeof eventIdOrPluginName === "string") {
            for (let k in nativeToJsEventHash) {
                let obj = nativeToJsEventHash[k];
                if (obj && obj["pluginName"] === eventIdOrPluginName) {
                    delete nativeToJsEventHash[k];
                }
            }
        }
    }
    /*
    * 清理事件回调数据
    */
    dispose() {
        this.nativeToJsEventHash = {};
        this.nativeToJsCallbackHash = {};
        trace("dispose");
    }
    /**
     * 将16进制字符串转为字符串形式
     * @param params 47|42|42|32|20108|36827...
     */
    private _paramsToString(params: string): string {
        let ss = params.split("|");
        let buffer = new Uint16Array(ss.length);
        for (let i = 0; i < ss.length; i++) {
            buffer[i] = parseInt(ss[i]);
        }
        return String.fromCharCode.apply(null, buffer);
    }
    /**
     * native调用后通过此方法回调给js的事件参数信息
     * @param {string} pluginName 插件名称
     * @param {string} event      事件回调类型
     * @param {string} params     事件回调参数
     */
    nativeEventHandler(pluginName: string, event: string, params: string) {
        try {
            let nativeToJsEventHash = this.nativeToJsEventHash;
            params = this._paramsToString(params);
            let hascall = false;
            for (let k in nativeToJsEventHash) {
                let obj = nativeToJsEventHash[k];
                if (obj && obj["pluginName"] === pluginName) {
                    let callback = obj["callback"];
                    callback(event, params);
                    hascall = true;
                }
            }
            if (!hascall) {
                trace(`${pluginName} has nothing function to call! ${event}`)
            }
        } catch (e) {
            traceError(`${pluginName} nativeEventHandler exception, ${event} ${e.toString()}`)
        }
    }

    /**
     * native调用后通过此方法回调给js的参数数据
     * @param {number} callbackId 回调id
     * @param {string} params 参数
     */
    nativeCallbackHandler(callbackId: number, params: string) {
        try {
            let nativeToJsCallbackHash = this.nativeToJsCallbackHash;
            let _cbid = callbackId + "";
            let callback = nativeToJsCallbackHash[_cbid];
            if (typeof callback === 'function') {
                params = this._paramsToString(params);
                callback(null, params);
                delete nativeToJsCallbackHash[_cbid];// 为防止内存泄漏,一旦回调完成,callback的引用将会被去掉!!!!
            } else {
                trace(`nativeCallbackHandler, ${_cbid} not found!`)
            }
        } catch (e) {
            trace(`nativeCallbackHandler 异常 ${params} ${e.toString()}`)
        }
    }
    /**
     * native调用错误，通过此方法回调js的错误信息
     * @param {number} callbackId 回调id
     * @param {string} msg 错误信息
     */
    nativeCallbackErrorHandler(callbackId: number, msg: string) {
        try {
            msg = this._paramsToString(msg);
            trace(" nativeCallbackErrorHandler 错误信息:", msg);
            let nativeToJsCallbackHash = this.nativeToJsCallbackHash;
            let _cbid = callbackId + "";
            let callback = nativeToJsCallbackHash[_cbid];
            if (typeof callback === 'function') {
                callback(new Error(msg));
                delete nativeToJsCallbackHash[_cbid];// 防止内存泄漏,一旦回调完成,callback的引用将会被去掉!!!!
            } else {
                trace(`nativeCallbackHandler, ${_cbid} not found!`)
            }
        } catch (e) {
            traceError(`nativeCallbackErrorHandler 异常 ${msg} ${e.toString()}`)
        }
    }
}