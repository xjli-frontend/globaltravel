import engine from "../../core/Engine";
import { ComponentExtends } from "../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SerllStoresAnim extends ComponentExtends{
    
    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            // this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }   
    
    onAdded(params:any){
        this.node.getChildByName("particle").active = false;
        this.node.getChildByName("unlock1").active = false;
        this.node.getChildByName("unlock2").active = false;
        this.node.getChildByName("unlock3").active = false;
        let skeleton = this.node.getChildByName("hetong").getComponent(sp.Skeleton);
        let lang  = engine.i18n.currentLanguage == "zh" ? "cn":"en";
        skeleton.setSkin(lang);
        skeleton.setEventListener((entry, event) => {
            if (event.data.name == "1") {
                this.node.getChildByName("particle").active = true;
                this.node.getChildByName("unlock1").active = true;
                this.scheduleOnce(()=>{
                    this.node.getChildByName("unlock3").active = true;
                },0.2);
                this.scheduleOnce(()=>{
                    this.node.getChildByName("unlock2").active = true;
                },0.4);
            }
        });

        skeleton.setCompleteListener((func)=>{
            if(func.animation.name == "reward"){
                skeleton.setAnimation(0,"reward_idle",true);
                this.scheduleOnce(()=>{
                    this.node.getChildByName("bg").RunAction(ezaction.fadeTo(1/3,0)).onStoped(()=>{
                        params.callback && params.callback();
                        this.node.destroy();
                    })
                    this.node.getChildByName("hetong").RunAction(ezaction.fadeTo(1/3,0));
                    this.node.getChildByName("unlock1").RunAction(ezaction.fadeTo(1/3,0));
                    this.node.getChildByName("unlock2").RunAction(ezaction.fadeTo(1/3,0));
                    this.node.getChildByName("unlock3").RunAction(ezaction.fadeTo(1/3,0));
                },3)
            }
        })
       
        this.node.once(cc.Node.EventType.TOUCH_END, ()=>{
            skeleton.setAnimation(0,"reward",false);
            this.node.getChildByName("skeleton").active = false;
        } , this);
    }

  
    onDestroy(){
        super.onDestroy();
    }

    
}



