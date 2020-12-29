import EventObjectEmitter from "../event/EventObjectEmitter";
import { HashMap } from "../util/HashMap";
import { LanguageComponent } from "./LanguageComponent";
import { LanguageI18nEnum } from "./LanguageI18nEnum";
import { LanguageLabel } from "./LanguageLabel";
import LanguagePack from "./LanguagePack";

export enum LanguageEvent{
    /** 语种变化事件, 此时界面上多语言组件还未更新 */
    CHANGE = 'LanguageEvent.CHANGE',
    /** 多语言组件更新完成事件 */
    CHANGE_COMPLETE = 'LanguageEvent.CHANGE_COMPLETE',
    /** 语种资源释放事件 */
    RELEASE_RES = "LanguageEvent.RELEASE_RES"
}
const DEFAULT_LANGUAGE = "en";

export class LanguageManager extends EventObjectEmitter {

    private static instances:HashMap<string,LanguageManager> = new HashMap<string,LanguageManager>();
    /**
     * 获得一个i18n
     * @param name 
     */
    public static getInstance(name:string):LanguageManager{
        return LanguageManager.instances.get(name);
    }

    private _currentLang:string = "";

    private _languagePack:LanguagePack = null;

    private _supportLanguages:Array<string> = ["zh","en","tr"];

    /** 设置多语言系统支持哪些语种 */
    public set supportLanguages(supportLanguages:Array<string>){
        this._supportLanguages = supportLanguages;
    }
    
    /** Label修改之前的回调 */
    public beforeChangeLabel: ( comp:LanguageLabel, content:string,dataID:string )=>void = null; 

    private _name:LanguageI18nEnum = LanguageI18nEnum.DEFAULT;
    constructor(name?:LanguageI18nEnum){
        super();
        if (name){
            this._name = name;
        }
        if (LanguageManager.instances.has(this._name)){
            cc.error("LanguageManager instances has same name!!",this._name);
        }
        LanguageManager.instances.set(this._name,this);
    }

    /**
     * 设置多语言资源目录
     * @param langjsonPath 多语言json目录
     * @param langTexturePath 多语言图片目录
     */
    public setAssetsPath( langjsonPath:string,langTexturePath:string ){
        this.languagePack.setAssetsPath(langjsonPath,langTexturePath);
    }
    /**
     * 销毁i18n实例
     */
    destroy(){
        super.destroy();
        LanguageManager.instances.delete(this._name);
        if (this._languagePack){
            this._languagePack.destroy();
            this._languagePack = null;
        }
    }
    public get languagePack():LanguagePack{
        if (!this._languagePack){
            this._languagePack = new LanguagePack();
        }
        return this._languagePack;
    }
    /**
     * 获取当前语种
     */
    public get currentLanguage(): string {
        return this._currentLang;
    }

    /**
     * 获取支持的多语种数组
     */
    public get languages(): string[] {
        return this._supportLanguages;
    }

    public isExist(lang: string): boolean {
        return this.languages.indexOf(lang) > -1;
    }

    /**
     * 改变语种，会自动下载对应的语种，下载完成回调
     * @param language 
     */
    public setLanguage(language : string, callback: (success:boolean)=>void ) {
        if ( !language ){
            language = DEFAULT_LANGUAGE;
        }
        language = language.toLowerCase();
        let index = this.languages.indexOf(language);
        if (index < 0){
            cc.warn("当前不支持该语种"+language + " 将自动切换到 en 英文语种！");
            language = DEFAULT_LANGUAGE;
        }
        if ( language === this._currentLang ){
            callback(false);
            return;
        }
        this.languagePack.updateLanguage( language, (err)=>{
            if (err){
                cc.warn("language res package download failed!",err);
            }
            cc.log("[i18n] current language is "+language);
            this._currentLang = language;
            this.emit(LanguageEvent.CHANGE,language);
            this._updateComponents( cc.director.getScene() );
            this.emit(LanguageEvent.CHANGE_COMPLETE,language);
            callback(true);
        } );
    }

    private _updateComponents(rootNode:cc.Node){
        if (!rootNode){
            return;
        }
        let rootNodes = rootNode.children;
        for (let i = 0; i < rootNodes.length; ++i) {
            // 更新所有的LanguageComponent组件
            let languagelabels = rootNodes[i].getComponentsInChildren(LanguageComponent);
            for (const languageComp of languagelabels) {
                if (languageComp.i18n == this){
                    languageComp.language = this.currentLanguage;
                }
            }
        }
    }

    /**
     * 根据资源id，解析出对应的资源路径
     * @param uuid 
     */
    public parseUuidToUrl(uuid:string):string{
        return this.languagePack.parseUuidToUrl(uuid)
    }

    /**
     * 根据data获取对应语种的字符
     * @param labId 
     * @param arr 
     */
    public getLangByID(labId:string):string{
        return this.languagePack.getLangByID(labId);
    }
    /**
     * 获取下一个语种
     */
    public getNextLang():string{
        let supportLangs = this.languages;
        let index = supportLangs.indexOf(this._currentLang);
        let newLanguage = supportLangs[(index + 1) % supportLangs.length];
        return newLanguage;
    }
    /**
     * 释放不需要的语言包资源
     * @param lang 
     */
    public releaseLanguageAssets(lang:string){
        lang = lang.toLowerCase();
        this.languagePack.releaseLanguageAssets(lang);
        this.emit(LanguageEvent.RELEASE_RES,lang);
    }
}