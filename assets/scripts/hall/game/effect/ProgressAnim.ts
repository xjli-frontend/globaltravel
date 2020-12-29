import { ComponentExtends } from "../../../core/ui/ComponentExtends";


const { ccclass, property } = cc._decorator;

@ccclass
export default class ProgressAnim extends ComponentExtends {


    initY:number = 0;
    onLoad(){
        this.initY = this.node.y;
    }

    action(){
        this.node.RunAction(ezaction.moveTo(0.1,{y:this.initY + 2})).onStoped(()=>{
            this.node.RunAction(ezaction.moveTo(0.1,{y:this.initY - 2})).onStoped(()=>{
                // this.action();
            })
        })
        this.node.RunAction(ezaction.moveTo(0.1,{scale:1.1})).onStoped(()=>{
            this.node.RunAction(ezaction.moveTo(0.1,{scale:1})).onStoped(()=>{
                // this.action();
            })
        })
    }
    
    onDestroy(){
        this.initY = null;
        super.onDestroy();
    }

}
