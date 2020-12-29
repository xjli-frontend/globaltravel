import { LanguageComponent } from "./LanguageComponent";

const { ccclass, property } = cc._decorator;

@ccclass("LangLabelParamsItem")
export class LangLabelParamsItem {
    @property(cc.String)
    key: string = "";
    @property(cc.String)
    value: string = "";
}

@ccclass
export class LanguageLabel extends LanguageComponent{

    @property({
        type: LangLabelParamsItem,
        displayName: "params"
    })
    private _params: Array<LangLabelParamsItem> = [];
    @property({
        type: LangLabelParamsItem,
        displayName: "params"
    })
    set params(value: Array<LangLabelParamsItem>) {
        this._params = value;
        if (!CC_EDITOR) {
            this._needUpdate = true;
        }
    }
    get params(): Array<LangLabelParamsItem> {
        return this._params || [];
    }

    @property(cc.String)
    protected _dataID:string = "";
    @property({
        type: cc.String,
        displayName: "dataID"
    })
    set dataID(value:string) {
        this._dataID = value;
        if (!CC_EDITOR) {
            this._needUpdate = true;
        }
    }
    get dataID(): string {
        return this._dataID ||"";
    }

    get string():string{
        if (!this.i18n){
            return;
        }
        let _string = this.i18n.getLangByID(this._dataID);
        if (this.i18n.beforeChangeLabel){
            this.i18n.beforeChangeLabel(this,_string,this._dataID);
        }
        if (!_string){
            return;
        }
        if (_string && this._params.length > 0){
            this._params.forEach( (item:LangLabelParamsItem)=>{
                _string = _string.replace(`%{${item.key}}`,item.value)
            } )
        }
        if (!_string){
            _string = this._dataID;
        }
        return _string;
    }

    initFontSize:number =  0;
    onLoad(){
        this._needUpdate = true;
        this.initFontSize = this.node.getComponent(cc.Label).fontSize;

    }
    onDestroy(){
        this._params = null;
    }
    /**
     * 默认文本的系统字体名字
     */
    public getLabelFont(lang:string):string{
        switch( lang ){
            case "zh":
            case "tr":{
                return "SimHei";
            }
        }
        return "Arial";
    }

    /**
     * 修改多语言参数，采用惰性求值策略
     * @param key 对于i18n表里面的key值
     * @param value 替换的文本
     */
    setVars(key: string, value: string) {
        let haskey = false;
        for (let i = 0; i < this._params.length; i++) {
            let element: LangLabelParamsItem = this._params[i];
            if (element.key === key) {
                element.value = value;
                haskey = true;
            }
        }
        if (!haskey) {
            let ii = new LangLabelParamsItem();
            ii.key = key;
            ii.value = value;
            this._params.push(ii);
        }
        if (!CC_EDITOR) {
            this._needUpdate = true;
        }
    }
    protected _needUpdate: boolean = false;
    
    update(dt) {
        if (this._needUpdate) {
            this.updateLabel();
            this._needUpdate = false;
        }
    }
    public set language(lang:string){
        this._needUpdate = true;
    }

    updateLabel(){
        do {
            if (!this._dataID || !this.i18n ){
                break;
            }
            let spcomp:cc.Label = this.node.getComponent(cc.Label);
            if (!spcomp){
                cc.warn("[LanguageLabel], 该节点没有cc.Label组件");
                break;
            }
            spcomp.fontFamily = this.getLabelFont( this.i18n.currentLanguage);
            let _ss = this.string;
            if (_ss){
                spcomp.string = this.string;
            }
        } while (false);
    }
}
