import { LanguageManager } from "./Language";
import { LanguageI18nEnum } from "./LanguageI18nEnum";
/**
 * 代理组件
 */
export class LanguageComponent extends cc.Component{
    public get i18n():LanguageManager{
        return LanguageManager.getInstance(LanguageI18nEnum.DEFAULT);
    }
    public set language(lang:string){

    }
}
