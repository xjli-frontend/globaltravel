
import { Message } from "../../../core/event/MessageManager";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { AudioMessage } from "../../AudioMessage";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BalloonAnim extends ComponentExtends {

    @property
    id:number = 1;

    onLoad(){
        let skeleton = this.node.getComponent(sp.Skeleton);
        this.node.parent.on(cc.Node.EventType.TOUCH_END,this.action.bind(this),this)
        skeleton.setAnimation(0,`reward_${this.id}_idle`,true);
    }

    isAction:boolean = false;
    action(){
        if (this.node._touchListener) {
            this.node._touchListener.setSwallowTouches(false);
        }
        if(this.isAction){
            return;
        }
        this.isAction  = true;
        Message.dispatchEvent(AudioMessage.EFFECT, "wind");
        let skeleton = this.node.getComponent(sp.Skeleton);
        skeleton.setCompleteListener((func)=>{
            if(func.animation.name == `reward_${this.id}`){
                skeleton.setAnimation(0,`reward_${this.id}_idle`,true);
                this.scheduleOnce(()=>{
                    skeleton.setAnimation(0,`reward_${this.id}`,false);
                },5)
            }
        })
        skeleton.setAnimation(0,`reward_${this.id}`,false);
    }
    
    onDestroy(){
        super.onDestroy();
    }

}
