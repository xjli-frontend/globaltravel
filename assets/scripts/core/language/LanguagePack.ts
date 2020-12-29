
export default class LanguagePack {

    private _languageLabels: Object = {};

    private _exLanguageLabels = {};

    // 默认资源文件目录
    private _langjsonPath: string = "langjson";
    private _langTexturePath: string = "language";

    constructor() {
    }
    destroy() {
        this._languageLabels = null;
        this._exLanguageLabels = null;
    }
    /**
     * 设置多语言资源目录
     * @param langjsonPath 多语言json目录
     * @param langTexturePath 多语言图片目录
     */
    public setAssetsPath(langjsonPath: string, langTexturePath: string) {
        if (langjsonPath) {
            this._langjsonPath = langjsonPath;
        }
        if (langTexturePath) {
            this._langTexturePath = langTexturePath;
        }
    }
    /**
     * 设置扩展多语言json配置对象
     * @param labels 
     */
    public setExLabels(labels: any) {
        this._exLanguageLabels = labels;
    }

    /**
     * 设置多语言
     * @param lang 
     */
    public updateLanguage(lang: string, callback: Function) {
        lang = lang.toLowerCase();
        this._loadLanguageAssets(lang, (err) => {
            if (err) {
                callback(err);
                return;
            }
            let lanjson = cc.loader.getRes(`${this._langjsonPath}/${lang}`);
            if (lanjson) {
                this._languageLabels = lanjson.json;
            } else {
                cc.warn("没有找到指定语言内容配置", lang);
            }
            callback(null);
        })

    }
    /**
     * 根据dataID，获取对应语言的字符
     * @param uuid 
     */
    public getLangByID(labId: string) {
        let _ss = this._languageLabels[labId];
        if (!_ss && this._exLanguageLabels) {
            _ss = this._exLanguageLabels[labId]
        }
        return _ss || "";
    }
    /**
     * 根据资源id，解析出对应的资源路径
     * @param uuid 
     */
    public parseUuidToUrl(uuid: string): string {
        let pathToUuid = null;
        if (cc.loader["_resources"]) {
            pathToUuid = cc.loader["_resources"]._pathToUuid;
        }
        if (!pathToUuid) {
            // 兼容2.1.1
            pathToUuid = (<any>cc.loader)._assetTables["assets"]._pathToUuid;
        }
        for (let key in pathToUuid) {
            let entrys = pathToUuid[key];
            if (entrys instanceof Array) {
                for (let entry of entrys) {
                    if (entry.uuid === uuid) {
                        return key;
                    }
                }
            } else {
                if (entrys["uuid"] === uuid) {
                    return key;
                }
            }
        }
        return "";
    }
    /**
     * 下载对应语言包资源
     * @param lang 语言标识
     * @param callback 下载完成回调
     */
    private _loadLanguageAssets(lang: string, callback: Function) {
        let langpath = `${this._langTexturePath}/${lang}`;
        let langjsonpath = `${this._langjsonPath}/${lang}`;
        cc.log("下载语言包 textures 资源", langpath);
        cc.log("下载语言包 json 资源", langjsonpath);
        cc.loader.loadResDir(langpath, (err) => {
            cc.log(`loadcomplete,${langpath}`, err)
            if (err) {
                cc.warn(err);
            }
            cc.loader.loadRes(langjsonpath, cc.JsonAsset, (err) => {
                cc.log(`loadcomplete,${langjsonpath}`, err)
                if (err) {
                    cc.warn(err);
                }
                callback(null, lang);
            })
        })
    }
    /**
     * 释放某个语言的语言包资源包括json
     * @param lang 
     */
    public releaseLanguageAssets(lang: string) {
        let langpath = `${this._langTexturePath}/${lang}`;
        cc.loader.releaseResDir(langpath);
        cc.log("释放语言包资源", langpath);

        let langjsonpath = `${this._langjsonPath}/${lang}`;
        cc.loader.releaseRes(langjsonpath);
        cc.log("释放语言系统文字资源", langjsonpath);
    }
}