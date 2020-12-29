import engine from "../core/Engine";

/** 热更新事件定义 */
export enum AssetsHotUpdateEVent {

    EVENT_PATCH_NEED = "EVENT_PATCH_NEED",

    /** 热更新开始*/
    EVENT_PATCH_START = "EVENT_PATCH_START",

    /** 热更新进度*/
    EVENT_PATCH_PROGRESS = "EVENT_PATCH_PROGRESS",

    /** 热更新失败*/
    EVENT_PATCH_FAILED = "EVENT_PATCH_FAILED",

    /** 热更新过程结束 */
    EVENT_PATCH_FINISHED = "EVENT_PATCH_FINISHED",

    /** 不需要热更新 */
    EVENT_PATCH_NONEED = "EVENT_PATCH_NONEED",
    /** APK更新 */
    EVENT_APP_UPDATE = "EVENT_APP_UPDATE",
}

export class AssetsHotUpdate {

    readonly MD5FILE_NAME = 'md5fileList.txt'
    url_assets_patch: string = "";
    local_assets_patch_path = "";
    local_assets_patch_path_temp = "";

    needdownloadList: Array<string> = [];
    downloadIndex: number = 0;

    eventCallback: (event: AssetsHotUpdateEVent, params: string) => void = null;

    private isLock: boolean = false;

    constructor() {
        if (typeof jsb === "undefined") {
            return;
        }
        let writablePath = jsb.fileUtils.getWritablePath();
        this.local_assets_patch_path_temp = cc.path.join(writablePath, "assetsHotUpdateTemp");
        jsb.fileUtils.removeDirectory(this.local_assets_patch_path_temp);
    }
    /**
     * 在每次热更前调用此方法
     * @param url_assets_patch 
     * @param local_assets_patch_path 
     */
    refreshUrlAndPath(url_assets_patch: string, local_assets_patch_path: string) {
        this.url_assets_patch = url_assets_patch;
        this.local_assets_patch_path = local_assets_patch_path;
    }
    /**
     * 读取本地md5文件内容
     */
    getLocalMd5FileContent() {
        let localMd5FileListContent = jsb.fileUtils.getStringFromFile(this.MD5FILE_NAME);
        return localMd5FileListContent || "";
    }
    /***
     * 检查热更新
     */
    start(callback: (event: AssetsHotUpdateEVent, params: string) => void) {
        if (typeof jsb === "undefined") {
            callback(AssetsHotUpdateEVent.EVENT_PATCH_NONEED, "");
            return;
        }
        if (this.isLock) {
            cc.log("[AssetsHotUpdate] 当前Lock状态, 不能进行热更新！")
            return;
        }
        this.isLock = true;
        let localMd5FileListContent = jsb.fileUtils.getStringFromFile(this.MD5FILE_NAME);
        if (!localMd5FileListContent) {
            cc.error(`[AssetsHotUpdate] 本地md5fileList.txt is empty!`);
            this.isLock = false;
            callback(AssetsHotUpdateEVent.EVENT_PATCH_NONEED, "");
            return;
        }
        this.downloadIndex = 0;
        let remoteMd5FileListUrl = cc.path.join(this.url_assets_patch, this.MD5FILE_NAME) + "?t=" + Date.now();
        let remoteSavePath = cc.path.join(this.local_assets_patch_path_temp, this.MD5FILE_NAME);
        cc.log("remoteMd5FileListUrl = " + 5);
        engine.downloader.download(remoteMd5FileListUrl, remoteSavePath, 2, 99, (success) => {
            let remoteMd5FileListContent = jsb.fileUtils.getStringFromFile(remoteSavePath);
            this.needdownloadList = this.compareLocalAndRemote(localMd5FileListContent, remoteMd5FileListContent);
            if (this.needdownloadList.length > 0) {
                cc.log(`[AssetsHotUpdate] assetsDownload  file count = ${this.needdownloadList.length}`)
                callback(AssetsHotUpdateEVent.EVENT_PATCH_START, "");
                this.eventCallback = callback;
                this.downloadIndex = 0;
                this.assetsDownload();
            } else {
                this.isLock = false;
                callback(AssetsHotUpdateEVent.EVENT_PATCH_NONEED, "");
            }
        })
    }
    private compareLocalAndRemote(localMd5FileListContent: string, remoteMd5FileListContent: string): Array<string> {
        if (localMd5FileListContent == remoteMd5FileListContent) {
            cc.log(`[AssetsHotUpdate] 本地和远程md5一致不需要热更新!`);
            return [];
        }
        let strToObj = function (txtContent: string) {
            let result = {};
            let arr = txtContent.split("\n");
            for (let kv of arr) {
                let _arr = kv.split('|');
                let md5 = _arr[0];
                let respath = _arr[1];
                if (md5 || respath) {
                    result[md5] = respath;
                }
            }
            return result;
        }
        let needdownloadList = [];
        let fileUtils = jsb.fileUtils;
        let localMd5FileList = strToObj(localMd5FileListContent);
        let remotearr = remoteMd5FileListContent.split("\n");
        let needDownloadMegaJson = false;
        for (let kv of remotearr) {
            let _arr = kv.split('|');
            let remoteMd5 = _arr[0];
            let remoteRespath = _arr[1];
            if (!remoteMd5 || !remoteRespath) {
                continue;
            }

            // 过滤掉不包含_megaJson.json之外的所有json文件
            if (!!remoteRespath.match(/\.json$/g) && remoteRespath.indexOf("_megaJson.json") === -1) {
                needDownloadMegaJson = true;
                continue;
            }

            // 没有需要下载的json文件，就过滤掉megajson文件的下载
            if (!needDownloadMegaJson && remoteRespath.indexOf("_megaJson.json") > -1) {
                continue;
            }


            if (!localMd5FileList[remoteMd5]) {
                needdownloadList.push(remoteRespath);
                continue;
            }
            if (!fileUtils.isFileExist(remoteRespath)) {
                needdownloadList.push(remoteRespath);
            }
        }
        return needdownloadList;
    }

    private assetsDownload() {
        if (this.downloadIndex >= this.needdownloadList.length) {
            this.moveFiles();
            return;
        }
        let respath = this.needdownloadList[this.downloadIndex];
        let resurl = cc.path.join(this.url_assets_patch, respath);
        let ressavePath = cc.path.join(this.local_assets_patch_path_temp, respath);
        engine.downloader.download(resurl, ressavePath, 3, 1, (success) => {
            if (success) {
                this.downloadIndex = this.downloadIndex + 1;
                this.eventCallback && this.eventCallback(AssetsHotUpdateEVent.EVENT_PATCH_PROGRESS, (this.downloadIndex / this.needdownloadList.length).toFixed(2));
                this.assetsDownload();
            } else {
                cc.log(`[AssetsHotUpdate]热更新失败 ${resurl} \n  ${ressavePath} `);
                this.isLock = false;
                // jsb.fileUtils.removeFile(ressavePath);
                this.eventCallback && this.eventCallback(AssetsHotUpdateEVent.EVENT_PATCH_FAILED, "");
            }
        })
    }
    private moveFiles() {
        let fileUtils = jsb.fileUtils;
        for (let respath of this.needdownloadList) {
            let ressavePath = cc.path.join(this.local_assets_patch_path_temp, respath);
            let despath = cc.path.join(this.local_assets_patch_path, respath);
            fileUtils.removeFile(despath);
            fileUtils.createDirectory(cc.path.dirname(despath));
            if (fileUtils.renameFile(ressavePath, despath)) {
                cc.log(`${ressavePath} 转移到 ${despath}`);
            }

            if (respath.indexOf("_megaJson.json") > -1) {
                this.backJsonData(despath);
            }
        }
        this.isLock = false;
        this.eventCallback && this.eventCallback(AssetsHotUpdateEVent.EVENT_PATCH_FINISHED, this.needdownloadList.length + "");
        this.needdownloadList = [];
    }

    private backJsonData(resUrl: string) {
        cc.log('开始解析合并工具', resUrl);
        let fileUtils = jsb.fileUtils;
        let fileDatas = JSON.parse(fileUtils.getStringFromFile(resUrl));
        for (const key in fileDatas) {
            let data = fileDatas[key];
            let path = cc.path.join(this.local_assets_patch_path, key);
            if (fileUtils.isFileExist(path)) {
                fileUtils.removeFile(path);
            }
            fileUtils.createDirectory(cc.path.dirname(path));
            fileUtils.writeStringToFile(JSON.stringify(data), path);
            cc.log("写入合并资源", path);
        }
        fileUtils.removeFile(resUrl);
    }
}