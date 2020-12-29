import { ezplugin } from "./ezplugin/ezplugin";

/*
 * @CreateTime: Feb 25, 2019 3:44 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
* @Last Modified By: howe
* @Last Modified Time: Nov 28, 2019 4:46 PM
 * @Description: Modify Here, Please
 *  
 * cocos creator的扩展方法
 */




/** 全屏问题报错hack */
cc.screen.$exitFullScreen = cc.screen.exitFullScreen;
cc.screen.exitFullScreen = function () {
    // let result = Promise.resolve( cc.screen.$exitFullScreen() );
    // result.catch( (err)=>{
    //     cc.log(err);
    // } )
}
cc.screen.$requestFullScreen = cc.screen.requestFullScreen;
cc.screen.requestFullScreen = function () {
    // let result = Promise.resolve( cc.screen.$requestFullScreen() );
    // result.catch( (err)=>{
    //     cc.log(err);
    // } )
}

if (CC_EDITOR) {
    sp.Skeleton.prototype.update = function (dt) {
        if (this.paused) return;
        dt *= this.timeScale * sp.timeScale;
        if (this.isAnimationCached()) {
            // Cache mode and has animation queue.
            if (this._isAniComplete) {
                if (this._animationQueue.length === 0 && !this._headAniInfo) return;
                if (!this._headAniInfo) {
                    this._headAniInfo = this._animationQueue.shift();
                }
                this._accTime += dt;
                if (this._accTime > this._headAniInfo.delay) {
                    let aniInfo = this._headAniInfo;
                    this._headAniInfo = null;
                    this.setAnimation(0, aniInfo.animationName, aniInfo.loop);
                }
                return;
            }
            this._updateCache(dt);
        } else {
            this._updateRealtime(dt);
        }
    }
}



export class CreatorEx {

    constructor() {
        window["__errorHandler"] = (file, line, msg, error) => {
            let plugin = ezplugin.get("PluginBugly");
            plugin && plugin.excute("log", {
                file: file,
                line: line,
                msg: msg,
                error: error
            })
        };
        if (!cc.sys.isBrowser) {
            let __$error = cc.error;
            cc.error = function () {
                let errstr = "";
                for (var i = 0; i < arguments.length; i++) {
                    errstr += (arguments[i].toString()); // 10, 20, 30
                }
                let plugin = ezplugin.get("PluginBugly");
                plugin && plugin.excute("log", {
                    file: "ccerror",
                    line: 0,
                    msg: "",
                    error: errstr
                })
                __$error(arguments);
            }
        }

        // 发布模式关闭cc.log和cc.warn
        if (!CC_DEBUG && CC_BUILD && !CC_PREVIEW) {
            let _c = function () { };
            Object.defineProperty(cc, 'log', {
                configurable: false,
                get: function () {
                    return _c;
                }
            });
            Object.defineProperty(cc, 'warn', {
                configurable: false,
                get: function () {
                    return _c;
                }
            })
        }

        // 解决2.0.x引擎的白边bug，2.0.8引擎已解决该问题
        // if (cc.sys.isBrowser && cc.dynamicAtlasManager){
        //     cc.dynamicAtlasManager.enabled = false;
        // }
        cc.WebView.Impl.prototype.evaluateJS = function (str) {
            var iframe = this._iframe;
            if (iframe) {
                return iframe.evaluateJS(str);
            }
        };
    }
}
