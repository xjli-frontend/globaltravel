import engine from "../../core/Engine";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PublicSuccess extends ComponentExtends{
    
    onLoad(){
    }   
    
    onAdded(params:any){
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("btn_ok").on(cc.Node.EventType.TOUCH_END, ()=>{
            this.node.destroy();
        }, this);
        nodes.get("unlock1").active = false;
        nodes.get("unlock2").active = false;
        nodes.get("unlock3").active = false;
        nodes.get("info").active = false;
        let result = main.module.calcTool.formatNum(main.module.vm.fame);
        let val = `${result.base}${result.gear}`;
        nodes.get("current").getComponent(LanguageLabel).setVars(`ui_personal_16`,"") ;
        nodes.get("current_lab").getComponent(cc.Label).string = val ;
        nodes.get("layout").getComponent(cc.Layout).updateLayout();
        let resultAdd = main.module.calcTool.formatNum(main.module.calcTool.calcAddNum(main.module.calcUiShow.rewardAdd(),{num:1,numE:0},false));
        let valAdd = `${resultAdd.base}${resultAdd.gear}`;
        nodes.get("total").getComponent(LanguageLabel).setVars(`ui_personal_17`,valAdd) ;
        let skeleton = this.node.getChildByName("public").getComponent(sp.Skeleton);
        let lang  = engine.i18n.currentLanguage == "zh" ? "cn":"en";
        skeleton.setSkin(lang);
        skeleton.setEventListener((entry, event) => {
            if (event.data.name == "1") {
                this.node.getChildByName("unlock1").active = true;
                this.node.getChildByName("unlock3").active = true;
            }else if(event.data.name == "2") {
                nodes.get("info").active = true;
            }
        });
        skeleton.setCompleteListener((func)=>{
            if(func.animation.name == "reward_1"){
                skeleton.setAnimation(0,"reward_loop",true);
                nodes.get("unlock2").active = true;
            }
        })
        skeleton.setAnimation(0,"reward_1",false);
       
    }

  
    onDestroy(){
        super.onDestroy();
    }

    
}



