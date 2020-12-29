
import { Message } from "../../core/event/MessageManager";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import ButtonEffectSprite from "../../core/ui/button/ButtonEffectSprite";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";
import { AudioMessage } from "../AudioMessage";
import { clerkLevelConfigItem } from "../ThemeConfig";
import LabTouchFont from "./effect/LabTouchFont";

const REWARD_TYPE= ["奖励倍率","店铺升级减少金钱比例","自动收集金币","声望收益提高的比例"]
const { ccclass, property } = cc._decorator;

@ccclass
export default class ShopClerkListItem extends ComponentExtends {


    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        // mainNodes.get("clerk_lv").getComponent(cc.Label).string = "";
        mainNodes.get("clerk_effect").getComponent(cc.Label).string = "";
        let clerk_sprNode = mainNodes.get("clerk_spr");
        clerk_sprNode.active = false;
        let clerk_funceNode = mainNodes.get("clerk_func");
        clerk_funceNode.getComponent(cc.Label).string = "";
    }

    onBtnHandler(event:cc.Event.EventTouch){
        if(event.target.name == "btn_up" && this.node.getChildByName("btn_up").getComponent(ButtonEffect).canTouch){
            if (this.clickCallback){
                this.clickCallback(this.params);
                if(this.params.clerkId == 6 || this.params.clerkId == 9 || this.params.clerkId == 10|| this.params.clerkId == 12){
                    Message.dispatchEvent(AudioMessage.EFFECT,"buy_woman")
                }else{
                    Message.dispatchEvent(AudioMessage.EFFECT,"buy_man")
                }
            }
        }
    }
    clickCallback:Function = null;

    refreshBtnState(state:boolean,isLock:boolean){
        if(this.params.clerkLevel > main.module.themeConfig.getClerkMaxLvById(this.params.clerkId)){
            this.node.getChildByName("btn_unlock").active = false;
            this.node.getChildByName("btn_up").active = false;
            return;
        }
        this.node.getChildByName("btn_unlock").active = isLock;
        this.node.getChildByName("btn_unlock").getComponent(ButtonEffect).canTouch = false;
        this.node.getChildByName("btn_unlock").getChildByName("spr").active = true;
        this.node.getChildByName("btn_unlock").getChildByName("lab").active = false;
        let btnNode = this.node.getChildByName("btn_up");
        let btnComp = btnNode.getComponent(ButtonEffectSprite);
        if (btnComp){
            btnComp.canTouch = state;
        }
        this.node.getChildByName("btn_up").getChildByName("btn_lab").getComponent(LabTouchFont).canTouch = state;
    }
    
    params:clerkLevelConfigItem = null;
    setData(params:clerkLevelConfigItem,callback?:Function){
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.params = params;
        let clerk_sprNode = mainNodes.get("clerk_spr");
        clerk_sprNode.active = false;
        let clerk_headNode = mainNodes.get("clerk_head");
        clerk_headNode.active = false;
        cc.loader.loadRes(`popup/shop/clerk/${params.clerkTag}`,cc.SpriteFrame,(error,resource)=>{
            clerk_sprNode.getComponent(cc.Sprite).spriteFrame = resource;
            clerk_sprNode.active = true;
            callback && callback;
        });

        let clerk_nameNode = mainNodes.get("clerk_name");
        clerk_nameNode.getComponent(LanguageLabel).dataID = `ui_npc_${params.clerkId}`;
        
        let clerk_funceNode = mainNodes.get("clerk_func");
        clerk_funceNode.getComponent(cc.Label).string = "";
        if(params.clerkId<=10){
            clerk_funceNode.getComponent(LanguageLabel).dataID = `ui_store_${params.clerkId}`;
        }else{
            clerk_funceNode.getComponent(LanguageLabel).dataID = "ui_clerk_5";
        }
        mainNodes.get("clerk_effect").active = true;
        if(params.clerkLevel > main.module.themeConfig.getClerkMaxLvById(params.clerkId)){
            mainNodes.get("clerk_lv").getComponent(cc.Label).string = "MAX";
            mainNodes.get("clerk_effect").active = false;
            mainNodes.get("btn_lab").getComponent(cc.Label).string = "...";
        }else{
            mainNodes.get("clerk_lv").getComponent(cc.Label).string = "lv" +params.clerkLevel;
            let clerkLvInfo = params;
            mainNodes.get("clerk_effect").getComponent(LanguageLabel).dataID = `ui_clerk_${clerkLvInfo.clerkRewardType}`;
            if(clerkLvInfo.clerkRewardType != 3){
                let valueStr = "";
                if(clerkLvInfo.clerkRewardType == 1){
                    let result = main.module.calcTool.formatNum({num:clerkLvInfo.clerkMultiTotal,numE:clerkLvInfo.clerkMultiTotalE})
                    // valueStr = result.base+result.gear;
                    valueStr = `${clerkLvInfo.clerkValue}`;
                }else if(clerkLvInfo.clerkRewardType == 2){
                    valueStr = `${clerkLvInfo.clerkValue}%`;
                }else if(clerkLvInfo.clerkRewardType == 4){
                    valueStr = `${clerkLvInfo.clerkValue*100}%`;
                }
                mainNodes.get("clerk_effect").getComponent(LanguageLabel).setVars(`ui_clerk_${clerkLvInfo.clerkRewardType}`,valueStr);
            }
            let calcTool = main.module.calcTool; 
            mainNodes.get("btn_lab").getComponent(LabelChangeSymbol).num = {num:params.clerkPrice,numE:params.clerkPriceE};
        }
        

      
    }

    onDestroy(){
        this.params = null;
        this.clickCallback = null;
        super.onDestroy();
    }
  

}