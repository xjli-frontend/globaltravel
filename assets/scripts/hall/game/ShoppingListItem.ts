
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";
import { goods } from "./ShoppingComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ShoppingListItem extends ComponentExtends {


    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }

    onBtnHandler(event:cc.Event.EventTouch){
        if(event.target.name == "btn_buy" && this.node.getChildByName("btn_buy").getComponent(ButtonEffect).canTouch){
            if (this.clickCallback){
                this.clickCallback(this.params,this.reward);
            }
        }
    }

    clickCallback:Function = null;
    reward = null;
    params:goods = null;
    setData(params:goods){
        this.params = params;
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        mainNodes.get("lab").getComponent(LanguageLabel).dataID = `shop_${params.id-7}`;
        mainNodes.get("clock").active = true;
        mainNodes.get("fanbei").active = false;
        if(params.id > 11){
            mainNodes.get("clock").active = false;
            mainNodes.get("fanbei").active = true;
            mainNodes.get("lab").getComponent(LanguageLabel).dataID = `shop_5`;
            mainNodes.get("lab").getComponent(LanguageLabel).setVars("shop_5",params.value.value3+"")
        }
        let times = 0;
        switch (params.id) {
            case 8://12小时
                times = 12 * 60 * 60;
                break;
            case 9://一天
                times = 24 * 60 * 60;
                break;
            case 10://一周
                times = 7 * 24 * 60 * 60;
                break;
            case 11://
                times = 2 * 7 * 24 * 60 * 60;
                break;
        }
        this.reward = main.module.calcUiShow.getTimeStageReward(times);
        let lab_numY = mainNodes.get("lab_num").y;
        mainNodes.get("lab_num").active = times > 0;
        if(times ==0){
            mainNodes.get("lab_num").y = lab_numY - 20;
        }else{
            mainNodes.get("lab_num").y = lab_numY;
        }
        mainNodes.get("lab_num").getComponent(LabelChangeSymbol).num = this.reward;
        mainNodes.get("btn_lab").getComponent(LabelChangeSymbol).string = params.price+"";
    }

    showButtonEffect(btnNode: cc.Node, state: boolean) {
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        btnNode.color = color;
        if (btnComp) {
            btnComp.canTouch = state;
        }
        let func = (_node) => {
            if (_node.children.length == 0) {
                return;
            }
            for (let child of _node.children) {
                child.color = color;
                func(child);
            }

        }
        func(btnNode)
    }


    onDestroy(){
        this.clickCallback = null;
        this.reward = null;
        this.params = null;
        super.onDestroy();
    }
  

}