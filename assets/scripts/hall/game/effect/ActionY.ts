
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;


@ccclass
export default class ActionY extends ComponentExtends {
    @property
    range:number = 5;

    @property
    duration:number = 0.2;

    initY:number = 0;
    onLoad(){
        this.initY = this.node.y;
        this.action();
    }

    action(){
        this.node.RunAction(ezaction.moveTo(this.duration,{y:this.initY + this.range})).onStoped(()=>{
            this.node.RunAction(ezaction.moveTo(this.duration,{y:this.initY - this.range})).onStoped(()=>{
                this.action();
            })
        })
    }
    
    onDestroy(){
        this.initY = null;
        super.onDestroy();
    }

}
