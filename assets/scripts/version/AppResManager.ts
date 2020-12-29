import engine from "../core/Engine";
import Config from "../service/config/Config";
import { AppResUrl } from "./AppResUrl";
import { AssetsHotUpdate, AssetsHotUpdateEVent } from "./AssetsHotUpdate";

export class AppResManager {

    public appresUrlHelper: AppResUrl = null;

    /** 当前app是否为审核版本 */
    public isReview: boolean = false;

    private assetsHotUpdate: AssetsHotUpdate = null;
    constructor(appresUrlHelper: AppResUrl) {
        this.appresUrlHelper = appresUrlHelper;
        this.assetsHotUpdate = new AssetsHotUpdate()
    }
    /**
     * 开始检测当前游戏版本
     * @param callback 完成后回调
     * @param params 自定义参数
     */
    start(doHotUpdate: boolean, callback: (event: AssetsHotUpdateEVent, data: string) => void) {
        let appresUrlHelper = this.appresUrlHelper;
        this.assetsHotUpdate.refreshUrlAndPath(appresUrlHelper.url_assets_patch,
            appresUrlHelper.local_assets_patch_path);
        this.checkApp((event: AssetsHotUpdateEVent, data: string) => {
            switch (event) {
                case AssetsHotUpdateEVent.EVENT_PATCH_NEED: {
                    if (doHotUpdate) {
                        this.assetsHotUpdate.start(callback);
                        return;
                    }
                    break;
                }
                // case AssetsHotUpdateEVent.EVENT_APP_UPDATE: {
                //     service.prompt.appStoreUpdate();
                //     return;
                // }
            }
            callback(event, data);
        });
    }

    public checkApp(callback: (event: AssetsHotUpdateEVent, data: string) => void) {
        if (cc.sys.isBrowser) {
            callback(AssetsHotUpdateEVent.EVENT_PATCH_NONEED, "0");
            return;
        }
        this.checkAppVersion((state: number) => {
            switch (state) {
                case 0: {
                    this.isReview = true;
                    cc.log("本地版本大于线上版本，当前可能正在审核");
                    callback(AssetsHotUpdateEVent.EVENT_PATCH_NONEED, "0");
                    break
                }
                case 1: {
                    this.isReview = false;
                    cc.log("本地版本小于线上版本，下一步进入app更新！")
                    callback(AssetsHotUpdateEVent.EVENT_APP_UPDATE, "1");
                    break
                }
                case -1: {
                    this.isReview = false;
                    callback(AssetsHotUpdateEVent.EVENT_PATCH_NONEED, "0");
                    break;
                }
                default: {
                    this.isReview = false;
                    this.checkHotUpdateVersion((issame: boolean) => {
                        if (issame) {
                            // 本地和远程的version.json里面配置的res_mtime相同
                            callback(AssetsHotUpdateEVent.EVENT_PATCH_NONEED, "0");
                        } else {
                            callback(AssetsHotUpdateEVent.EVENT_PATCH_NEED, "0");
                        }
                    })
                    break;
                }
            }
        })
    }

    // 检查是否需要热更新
    private checkHotUpdateVersion(next: (issame: boolean) => void) {
        // 资源修改时间
        let res_mtime = Config.game.data["res_mtime"];
        if (!res_mtime) {
            cc.log("没有res_mtime数据, 不需要热更新");
            next(true);
            return;
        }
        let localMd5FileListContent = this.assetsHotUpdate.getLocalMd5FileContent();
        if (localMd5FileListContent) {
            localMd5FileListContent = localMd5FileListContent.substr(0, 64);
            let arr = localMd5FileListContent.split("\n");
            let tag = arr[0].split("|")[0];
            cc.log("本地的md5filelist res_mtime " + tag)
            next(tag === res_mtime);
            return;
        }
        next(false);
    }

    /**
     * 远程版本文件，配置，最新app版本，和app下载地址
     */
    private checkAppVersion(next: (state: number) => void) {
        let remoteVerion = Config.game.data["version"];
        let localVersion = engine.appVersion;
        let localVersionNum = this.versionToInt(localVersion);
        let remoteVersionNum = this.versionToInt(remoteVerion);
        if (localVersionNum > remoteVersionNum) {
            next(0);
        } else if (localVersionNum < remoteVersionNum) {
            next(1);
        } else {
            cc.log('本地版本等于线上版本，下一步检查热更新');
            next(2);
        }
    }

    private versionToInt(version: string) {
        let ret = 0;
        const sssi = [1000000, 10000, 100, 1]
        let vvs = version.split(".");
        for (let i = 0; i < vvs.length; i++) {
            ret += parseInt(vvs[i]) * sssi[i];
        }
        return ret;
    }
}