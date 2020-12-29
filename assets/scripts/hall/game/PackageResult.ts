import engine from "../../core/Engine";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PackageResult extends ComponentExtends{
    
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

    onAdded(data:any){
        let params = data.params;
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
        this.node.getChildByName("clock").scale = 0;
        this.node.getChildByName("clock").RunAction(ezaction.scaleTo(5/30,{scale:1.1*1.3})).onStoped(()=>{
            this.node.getChildByName("clock").RunAction(ezaction.scaleTo(10/30,{scale:1.3})).onStoped(()=>{
            
            })
        })

        this.node.getChildByName("title_spr").scale = 0;
        let muti = lang == "en" ? 0.65:1;
        this.node.getChildByName("title_spr").RunAction(ezaction.scaleTo(5/30,{scale:1.1*muti})).onStoped(()=>{
            this.node.getChildByName("title_spr").RunAction(ezaction.scaleTo(10/30,{scale:1*muti})).onStoped(()=>{
            
            })
        })

        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let sprNode = mainNodes.get("clock");
        sprNode.active = false;
        let config = main.module.themeConfig.getPropConfigByTag(`add_${params["pid"]}`);
        cc.loader.loadRes(`popup/package/prop${config.addType}`,cc.SpriteFrame,(error,resource)=>{
            sprNode.getComponent(cc.Sprite).spriteFrame = resource;
            sprNode.active = true;
        });
        mainNodes.get("result_lab").getComponent(LanguageLabel).dataID = `ui_prop_value${config.addType}`;
        mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}`,`${config.addValue}h`);
        if(config.addType == 1){
            mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}`,`${config.addValue[0]}`);
        }else{
            if(config.addType == 2){
                mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}_1`,`${config.addValue[0]}`);
                mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}_2`,`${config.addValue[1]}`);
            }else if(config.addType == 3){
                mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}_1`, `${Math.floor(Number((1 - config.addValue[0]).toFixed(1)) * 100)}%`);
                mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}_2`,`${config.addValue[1]}`);
            }else if(config.addType == 4){
                
                mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}_1`,`${engine.i18n.getLangByID(`ui_store_${config.addValue[0]}`)}`);
                mainNodes.get("result_lab").getComponent(LanguageLabel).setVars(`value${config.addType}_2`,`${config.addValue[1]}`);
            }
        } 
        if(config.addType == 1){
            mainNodes.get("result_num").active = true;
            if(data.reward.num == 0){
                mainNodes.get("result_num").getComponent(LabelChangeSymbol).num = {num:1,numE:3};
            }else{
                mainNodes.get("result_num").getComponent(LabelChangeSymbol).num = data.reward;
            }
        }else{
            mainNodes.get("result_num").active = false;
        }

    }

    onDestroy(){
        super.onDestroy();
    }
}



