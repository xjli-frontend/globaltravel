import engine from "./core/Engine";
import { ezplugin } from "./core/ezplugin/ezplugin";
import { gui } from "./core/gui/GUI";
import { AsyncQueue, NextFunction } from "./core/util/AsyncQueue";
import { ModuleManager } from "./hall/ModuleManager";
import Config from "./service/config/Config";
import { service } from "./service/Service";
import { AppResManager } from "./version/AppResManager";
import { AppResUrl } from "./version/AppResUrl";

const { ccclass } = cc._decorator;
@ccclass
export default class main extends engine {

    public static module: ModuleManager = null;

    public static appRes: AppResManager = null;

    protected gameFitHandler() {
        engine.orientation = cc.macro.ORIENTATION_PORTRAIT;
        let ccCanvas: cc.Canvas = engine.canvas.getComponent(cc.Canvas);
        let whScale = cc.winSize.width / cc.winSize.height;
        if (engine.fit) {
            if (whScale > 9 / 16) {
                ccCanvas.fitHeight = true;
                ccCanvas.fitWidth = false;
            } else {
                ccCanvas.fitHeight = false;
                ccCanvas.fitWidth = true;
            }
        } else {
            // 横屏处理
            if (whScale < 16 / 9) {
                ccCanvas.fitHeight = false;
                ccCanvas.fitWidth = true;
            } else {
                ccCanvas.fitHeight = true;
                ccCanvas.fitWidth = false;
            }
        }
        engine.designWidth = cc.winSize.width;
        engine.designHeight = cc.winSize.height;
    }
    onLoad() {
        if (typeof document != "undefined") {
            if (document.getElementById("splash")) {
                document.getElementById("splash").style.display = 'block';
            }
        }
        super.onLoad();
    }
    protected run() {
        cc.log("cc.sys.SafeAreaRect = ", cc.sys.getSafeAreaRect().toString())
        /**
         *  如果你的项目只支持横/竖屏 ，请开启该代码以自动支持横竖屏提示功能。
         * 
            engine.orientation = cc.macro.ORIENTATION_PORTRAIT;
            new OrientationPrompt( engine.orientation );
        */
        let asyncQueue: AsyncQueue = new AsyncQueue();
        asyncQueue.push((next) => {
            let sdkconfig = require('sdkconfig');
            if (cc.sys.isNative) {
                switch (cc.sys.os) {
                    case cc.sys.OS_ANDROID: {
                        ezplugin.initPlugins(sdkconfig('android'), next);
                        return;
                    }
                    case cc.sys.OS_IOS: {
                        ezplugin.initPlugins(sdkconfig('ios'), next);
                        return;
                    }
                }
            }
            if (cc.sys.isBrowser) {
                // ezplugin.initPlugins(sdkconfig.get('web'),next);
                // return;
            }
            next();
        })
        asyncQueue.push((next: NextFunction) => {
            service.init(next);
        });
        asyncQueue.push((next: NextFunction) => {
            let appVersion = ezplugin.sysInfo["appVersion"] || ezplugin.sysInfo["version"];
            if (!appVersion) {
                appVersion = Config.game.data["version"]; // 浏览器模式
            }
            cc.log("当前App版本号", appVersion);
            engine.appVersion = appVersion;

            let appresUrlHelper = new AppResUrl(engine.appVersion);
            main.appRes = new AppResManager(appresUrlHelper)
            next();
        });
        // 同时加载游戏永久缓存资源和对应游戏语言包资源
        asyncQueue.pushMulti({},
            (next: NextFunction) => {
                let syslang = cc.sys.localStorage.getItem("language") || cc.sys.language;
                if (syslang.indexOf("zh") >= 0) {
                    syslang = "zh";
                }
                engine.i18n.setLanguage(syslang, next);
            },
            (next: NextFunction) => {
                cc.loader.loadResDir("common", next);
            }
        );
        asyncQueue.complete = () => {
            main.module = new ModuleManager();
            engine.log.info(`加载loading预制件`);
            gui.ui.add('loading/loading', { state: 0 });
            asyncQueue.complete = null;
        }
        asyncQueue.play();
    }
}