

export class AppResUrl {

    public appVersion: string = "";

    /**
     * 资源服务器根目录 
     * 如 http://abc.com
     */
    public res_server: string = "";

    /**
     * 资源服务器url 
     * 如
     * ios     http://abc.com/ios
     * android http://abc.com/android
     */
    public url_res_server: string = "";

    /** 获取热更新资源url
     * 如
     * ios     http://abc.com/ios/assetspatch1.0.0
     * android http://abc.com/android/assetspatch1.0.0
     */
    public get url_assets_patch(): string {
        return this.url_res_server + "/assetspatch" + this.appVersion;
    }

    /**
     * zip弹窗子游戏的下载目录
     */
    public get url_hall_games(): string {
        return this.res_server + "/hallgames";
    }

    /**
     * 本地的热更新缓存目录
     */
    public local_assets_patch_path: string = "";

    /**
     * 本地的子游戏热更新缓存目录
     */
    public local_games_assets_patch_path: string = ""

    public setResServer(res_server: string) {
        if (res_server[res_server.length - 1] == "/") {
            res_server = res_server.substring(0, res_server.length - 2);
        }
        this.res_server = res_server;
        this.url_res_server = res_server + "/" + cc.sys.os.toLowerCase();
    }
    constructor(appVersion: string) {
        this.appVersion = appVersion;
        if (typeof jsb !== "undefined") {
            let wpath = jsb.fileUtils.getWritablePath()
            this.local_assets_patch_path = cc.path.join(wpath, "assetspatch");
            // this.local_hall_games_path = cc.path.join(wpath, "hallgames");
            this.local_games_assets_patch_path = cc.path.join(wpath, "gamesassetspatch");
            jsb.fileUtils.createDirectory(this.local_games_assets_patch_path);
        }
    }
}