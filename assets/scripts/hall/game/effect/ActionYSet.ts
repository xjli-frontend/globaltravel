
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ActionYSet extends ComponentExtends {
    @property
    range:number = 5;

    @property
    duration:number = 0.2;

    _initY:number = 0;
    onLoad(){
        
    }

    set initY(y:number){
        this._initY = y;
        this.node.y = y;
        this.action();
    }

    get initY(){
        return this._initY;
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
