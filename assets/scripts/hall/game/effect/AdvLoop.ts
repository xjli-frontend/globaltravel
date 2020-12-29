
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AdvLoop extends ComponentExtends {


    onLoad(){
        this.action();
    }

    action(){
        let index = 1;
        this.schedule(()=>{
            let spr = this.node.getChildByName("spr");
            if(index > 11){
                index = 1;
            }
            spr.getComponent(cc.Sprite).spriteFrame = cc.loader.getRes(`main/adv/adv1/gg1_${index}`,cc.SpriteFrame);
            index++;
        },5/60)
    }
    
    onDestroy(){
        this.unscheduleAllCallbacks();
        super.onDestroy();
    }

}
