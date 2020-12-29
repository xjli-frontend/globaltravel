/*
 * @CreateTime: Aug 7, 2019 3:46 PM 
 * @Author: undefined 
 * @Contact: undefined 
* @Last Modified By: howe
* @Last Modified Time: Nov 28, 2019 4:16 PM
 * @Description: Modify Here, Please  
 * 加载界面逻辑
 */
import engine from "../../core/Engine";
import { ezplugin } from "../../core/ezplugin/ezplugin";
import { gui } from "../../core/gui/GUI";
import { ViewLayout } from "../../core/ui/ViewLayout";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { AsyncQueue } from "../../core/util/AsyncQueue";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import Config from "../../service/config/Config";
import { Prompt_Size, Prompt_Type } from "../../service/prompt/Prompt";
import { service } from "../../service/Service";
import { AssetsHotUpdateEVent } from "../../version/AssetsHotUpdate";
import LoginView from "../login/LoginView";

const { ccclass, property } = cc._decorator;
@ccclass
export default class LoadingView extends ViewLayout {
    private viewObj: HashMap<string, cc.Node> = null;
    private loginState = 0;
    onLoad() {
        this.viewObj = ViewUtils.nodeTreeInfoLite(this.node);
        this.viewObj.get("progressBar").active = false;
        this.viewObj.get("btns").active = false;
        // this.viewObj.get("lab_version").getComponent(cc.Label).string = main.appRes.appresUrlHelper.appVersion;
        let buildversion = ezplugin.sysInfo["versionCode"] || ezplugin.sysInfo["buildVersion"];
        if (!buildversion) {
            buildversion = "";
        }
        this.viewObj.get("lab_version").getComponent(cc.Label).string = `${engine.appVersion}(${buildversion})`;
        ViewUtils.fullscreen(this.viewObj.get("bg"))
        cc.log("LoadingView onLoad")
    }

    onAdded(params: any) {
        cc.log("LoadingView onAdded params", params)
        this.node.getComponent(LoginView).viewObj = this.viewObj;
        this.loginState = params["state"] || 0;

        let retry = 5;
        let asyncQueue = new AsyncQueue();
        asyncQueue.push((next: Function) => {
            let handler = (err, data) => {
                if (err) {
                    if (retry-- > 0) {
                        cc.log("重试 checkGateServer ");
                        engine.log.info("重试 checkGateServer")
                        Config.game.checkGateServer(handler);
                    } else {
                        next(null);
                    }
                } else {
                    next(data);
                }
            }
            Config.game.checkGateServer(handler);
        })
        asyncQueue.push((next: Function, pp: any, responsedata: any) => {
            engine.log.info(JSON.stringify(responsedata))
            cc.log(responsedata)
            let complete = (data) => {
                // 合并网关数据
                data && Config.game.setData(data);
                let appresUrlHelper = main.appRes.appresUrlHelper;
                appresUrlHelper.setResServer(Config.game.data["res_server"]);
                next();
            }
            let copyGateData = JSON.parse(JSON.stringify(responsedata));
            if (copyGateData["debug"]) {
                copyGateData["debug"]["version"] = copyGateData.version
            }
            if (copyGateData["release"]) {
                copyGateData["release"]["version"] = copyGateData.version
            }
            // 判断是否显示调试面板
            if (Config.query.debug == "1" || CC_PREVIEW || CC_DEBUG) {
                gui.popup.add("debug/servertest", { next: complete, data: copyGateData }, { modal: true });
            } else {
                // release版本直接使用服务器数据连接游戏
                if (copyGateData["release"]) {
                    complete(copyGateData["release"]);
                } else {
                    complete(null);
                }
            }
        })
        asyncQueue.complete = () => {
            // 检查app版本，是否有热更新
            main.appRes.start(true, this.patchEventHandler.bind(this));
            asyncQueue.complete = null;
        }
        asyncQueue.play();
    }

    patchEventHandler(event: AssetsHotUpdateEVent, params: string) {
        cc.log("LoadingView patchEventHandler -> " + event, params)
        switch (event) {
            case AssetsHotUpdateEVent.EVENT_PATCH_NONEED: {
                this.loadRes();
                engine.log.info(`不需要热更新`);
                break;
            }
            case AssetsHotUpdateEVent.EVENT_PATCH_FAILED: {
                this.loadRes();
                engine.log.info(`热更新失败！EVENT_PATCH_FINISHED`);
                break;
            }
            case AssetsHotUpdateEVent.EVENT_PATCH_START: {
                this.viewObj.get("lab_loading_tip").getComponent(cc.Label).string = "assets patching";
                this.viewObj.get("progressBar").active = true;
                this.viewObj.get("lab_progress").active = false;
                this.viewObj.get("lab_patch_progress").active = true;
                this.viewObj.get("progressBar").getComponent(cc.ProgressBar).progress = 0;
                this.viewObj.get("lab_patch_progress").getComponent(cc.Label).string = "0/100";
                break;
            }
            case AssetsHotUpdateEVent.EVENT_PATCH_PROGRESS: {
                cc.log("更新进度", params)
                let percent = parseFloat(params);
                this.viewObj.get("progressBar").getComponent(cc.ProgressBar).progress = percent;
                this.viewObj.get("lab_patch_progress").getComponent(cc.Label).string = Math.ceil(percent * 100) + "%";
                break;
            }
            case AssetsHotUpdateEVent.EVENT_PATCH_FINISHED: {
                cc.log("热更新结束！")
                this.viewObj.get("lab_patch_progress").getComponent(cc.Label).string = "COMPLETED！";
                if (params === "1") {
                    cc.log("只更新了md5fileList.txt,不需要重启")
                    this.loadRes();
                    engine.log.info(`热更新结束！EVENT_PATCH_FINISHED`);
                } else {
                    gui.ui.clear();
                    gui.loading.clear();
                    this.restartGame();
                }
                break;
            }
            case AssetsHotUpdateEVent.EVENT_APP_UPDATE: {
                this.appStoreUpdate();
                break
            }
        }
    }
    private isLock: boolean = false;
    restartGame() {
        if (this.isLock) {
            return;
        }
        this.isLock = true;
        cc.log(" cc.game.restart");
        service.prompt.restart(() => {
            if (typeof jsb != "undefined" || jsb) {
                jsb.fileUtils.purgeCachedEntries();
            }
            cc.loader.releaseAll();
            cc.game.restart();
        });
    }
    private appStoreUpdate() {
        let func = () => {
            // 应用商店更新
            let pluginOS = ezplugin.get("PluginOS");
            if (pluginOS) {
                switch (cc.sys.os) {
                    case cc.sys.OS_ANDROID: {
                        pluginOS.excute("appStore", "com.android.vending")
                        break;
                    }
                    case cc.sys.OS_IOS: {
                        pluginOS.excute("appStore", "itms-apps://itunes.apple.com/app/id1480181667?mt=8");
                        break;
                    }
                }
            } else {
                // 打开官网
            }
        }
        // 获取错误码描述内容
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: `有新的App需要下载更新，确定将打开应用商店！`,
                okFunc: func,
                showOk: true,
                okWord: 'determine',
                needClose: false
            }
        };
        service.prompt.addCommonPrompt(operate);
    }

    /**
     * 加载游戏通用资源
     */
    loadRes() {
        this.viewObj.get("lab_loading_tip").getComponent(cc.Label).string = "assets loading";

        this.viewObj.get("progressBar").active = true;
        this.viewObj.get("lab_progress").active = true;
        this.viewObj.get("lab_patch_progress").active = false;
        this.viewObj.get("progressBar").getComponent(cc.ProgressBar).progress = 0;
        let asyncQueue = new AsyncQueue();
        asyncQueue.push((next) => {
            cc.loader.loadResDir("langjson", (err) => {
                if (err) {
                    cc.log(JSON.stringify(err));
                }
                next();
            });
        });
        asyncQueue.push((next) => {
            cc.loader.loadResDir("audio", (err) => {
                if (err) {
                    cc.log(JSON.stringify(err));
                }
                next();
            });
        });
        asyncQueue.push((next) => {
            cc.loader.loadResDir("main", (completedCount: number, totalCount: number, item: any) => {
                let progress = completedCount / totalCount;
                this.viewObj.get("lab_progress").getComponent(cc.Label).string = (Math.ceil(progress * 100) + "%");
                this.viewObj.get("progressBar").getComponent(cc.ProgressBar).progress = progress;
            }, (err) => {
                if (err) {
                    cc.log(JSON.stringify(err));
                }
                next();
            });
        })
        asyncQueue.complete = () => {
            this.showLogin();
        }
        asyncQueue.play()
    }

    showLogin() {
        this.viewObj.get("progressBar").active = false;
        this.node.getComponent(LoginView).showLogin(this.loginState == 0);
    }

    onDestroy() {
        super.onDestroy();
        this.viewObj = null;
        cc.loader.releaseResDir("loading");
    }
}

