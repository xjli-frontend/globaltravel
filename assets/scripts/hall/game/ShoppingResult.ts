import engine from "../../core/Engine";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ShoppingResult extends ComponentExtends{
    
    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }   
    
    onBtnHandler(event){
        let name = event.target.name;
        switch (name) {
            case "btn_close":
            case "btn_ok":
                this.node.destroy();
                break;
        
            default:
                break;
        }
    }

    onAdded(params:any){
        let ske = this.node.getChildByName("skeleton").getComponent(sp.Skeleton);
        let lang  = engine.i18n.currentLanguage == "zh" ? "cn":"en";
        this.node.getChildByName("btn_ok").active = false;
        this.node.getChildByName("btn_close").active = false;
        ske.setCompleteListener((func)=>{
            if(func.animation.name == "reward_fadein"){
                ske.setAnimation(0,"reward_loop",true);
                this.node.getChildByName("btn_ok").active = true;
                this.node.getChildByName("btn_close").active = true;
            }
        })
        ske.setSkin(lang);
        ske.setAnimation(0,"reward_fadein",false);
        this.node.getChildByName("result").scale = 0;
        this.node.getChildByName("result").RunAction(ezaction.scaleTo(5/30,{scale:1.1})).onStoped(()=>{
            this.node.getChildByName("result").RunAction(ezaction.scaleTo(10/30,{scale:1})).onStoped(()=>{
            
            })
        })
        this.node.getChildByName("clock").active = params.goodsType == 2;
        this.node.getChildByName("clock").scale = 0;
        this.node.getChildByName("clock").RunAction(ezaction.scaleTo(5/30,{scale:1.1*1.3})).onStoped(()=>{
            this.node.getChildByName("clock").RunAction(ezaction.scaleTo(10/30,{scale:1.3})).onStoped(()=>{
            
            })
        });
        this.node.getChildByName("muti").active = params.goodsType == 3;
        this.node.getChildByName("muti").scale = 0;
        this.node.getChildByName("muti").RunAction(ezaction.scaleTo(5/30,{scale:1.1*1.3})).onStoped(()=>{
            this.node.getChildByName("muti").RunAction(ezaction.scaleTo(10/30,{scale:1.3})).onStoped(()=>{
            
            })
        });

        this.node.getChildByName("title_spr").scale = 0;
        let muti = lang == "en" ? 0.65:1;
        this.node.getChildByName("title_spr").RunAction(ezaction.scaleTo(5/30,{scale:1.1*muti})).onStoped(()=>{
            this.node.getChildByName("title_spr").RunAction(ezaction.scaleTo(10/30,{scale:1*muti})).onStoped(()=>{
            
            })
        })
        
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        mainNodes.get("result_lab").getComponent(LanguageLabel).dataID = `shop_${params.id-7}`;
        if(params.goodsType == 3){
            mainNodes.get("result_num").active = false;
            mainNodes.get("result_lab").y -= 30;
            mainNodes.get("result_lab").getComponent(LanguageLabel).dataID = `shop_5`;
            mainNodes.get("result_lab").getComponent(LanguageLabel).setVars("shop_5",params.value.value3+"");
        }
        mainNodes.get("result_num").getComponent(LabelChangeSymbol).num = params.reward;
    }
}



