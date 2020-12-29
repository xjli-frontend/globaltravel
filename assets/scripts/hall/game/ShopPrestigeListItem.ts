
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import ButtonEffectSprite from "../../core/ui/button/ButtonEffectSprite";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";
import { fameLvConfigItem } from "../ThemeConfig";
import LabTouchFont from "./effect/LabTouchFont";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ShopPrestigeListItem extends ComponentExtends {



    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }

    onBtnHandler(event){
        if(event.target.name == "btn_up" && this.node.getChildByName("btn_up").getComponent(ButtonEffect).canTouch){
            if (this.clickCallback){
                this.clickCallback(this.params,this);
            }
        }
    }
    clickCallback:Function = null;

    refreshBtnState(state:boolean,isLock:boolean){
        if(this.params.level > main.module.themeConfig.getFameMaxLvById(this.params.id)){
            this.node.getChildByName("btn_unlock").active = false;
            this.node.getChildByName("btn_up").active = false;
            return;
        }
        if(this.params.id > main.module.themeConfig.getBuildingConfigById(main.module.vm.level).count && this.params.id != 11){
            this.node.getChildByName("btn_unlock").active = true;
            this.node.getChildByName("btn_up").active = false;
            return;
        }
        this.node.getChildByName("btn_unlock").active = false;
        // this.node.getChildByName("btn_unlock").getComponent(ButtonEffect).canTouch = false;
        // this.node.getChildByName("btn_unlock").getChildByName("spr").active = true;
        // this.node.getChildByName("btn_unlock").getChildByName("lab").active = false;
        let btnNode = this.node.getChildByName("btn_up");
        let btnComp = btnNode.getComponent(ButtonEffectSprite);
        if (btnComp){
            btnComp.canTouch = state;
        }
        this.node.getChildByName("btn_up").getChildByName("btn_lab").getComponent(LabTouchFont).canTouch = state;
    }

    params:fameLvConfigItem = null;
    setData(params:fameLvConfigItem){
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.params = params;
        let prestige_nameNode = mainNodes.get("prestige_name");
        let value = params.value;
        let prestige_funcNode = mainNodes.get("prestige_func");
        if(params.id<=10){
            prestige_funcNode.getComponent(LanguageLabel).dataID = `ui_store_${params.id}`;
        }else{
            prestige_funcNode.getComponent(LanguageLabel).dataID = "ui_clerk_5";
        }
        let spf = cc.loader.getRes(`main/icon/icon${params.id}`,cc.SpriteFrame)
        mainNodes.get("prestige_spr").getComponent(cc.Sprite).spriteFrame = spf;
        prestige_nameNode.active = true;
        if(params.level > main.module.themeConfig.getFameMaxLvById(params.id)){
            prestige_funcNode.y = 0;
            prestige_nameNode.active = false;
            mainNodes.get("prestige_lv").y = 0;
            prestige_nameNode.getComponent(cc.Label).string = "";
            mainNodes.get("prestige_lv").getComponent(cc.Label).string = "MAX";
            mainNodes.get("prestige_func").getComponent(cc.Label).string = "";
            mainNodes.get("btn_lab").getComponent(cc.Label).string = "";
        }else{
            prestige_funcNode.y = -20;
            mainNodes.get("prestige_lv").y = -20;
            prestige_nameNode.getComponent(LanguageLabel).setVars(`prestige_${params.type}`,`${value}`);
            if(params.type == 2){
                prestige_nameNode.getComponent(LanguageLabel).setVars(`prestige_${params.type}`,`${(1-value)*100}%`);
            }else if(params.type == 4){
                prestige_nameNode.getComponent(LanguageLabel).setVars(`prestige_${params.type}`,`${value*100}%`);
            }
            prestige_nameNode.getComponent(LanguageLabel).dataID = `prestige_${params.type}`;
            let prestige_lvNode = mainNodes.get("prestige_lv");
            prestige_lvNode.getComponent(cc.Label).string = `lv${params.level}`;
            let calcTool = main.module.calcTool; 
            let price = calcTool.formatNum( {num:params.price,numE:params.priceE} ); 
            mainNodes.get("btn_lab").getComponent(LabelChangeSymbol).num = {num:params.price,numE:params.priceE};
        }
    }

    onDestroy(){
        this.params = null;
        this.clickCallback = null;
        super.onDestroy();
    }
  

}