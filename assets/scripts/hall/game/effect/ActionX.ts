
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ActionX extends ComponentExtends {

    @property
    range:number = 5;

    @property
    duration:number = 0.2;
    
    @property({
        tooltip:"是否左右摆动 {相对初始坐标}"
    })
    isAway:boolean = false;

    initX:number = 0;
    onLoad(){
        this.initX = this.node.x;
        this.action();
    }

    action(){
        let _range = this.isAway ? this.range:0;
        this.node.RunAction(ezaction.moveTo(this.duration,{x:this.initX + this.range})).onStoped(()=>{
            this.node.RunAction(ezaction.moveTo(this.duration,{x:this.initX-_range})).onStoped(()=>{
                this.action();
            })
        })
    }
    
    onDestroy(){
        this.initX = null;
        super.onDestroy();
    }

}
