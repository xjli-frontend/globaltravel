
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

const flyBottom= [cc.v2(-2484,-326),cc.v2(-2446,-1598)];
@ccclass
export default class BirdAnim extends ComponentExtends {

    @property
    duration:number = 10;

    @property({
        tooltip:"间隔时间"
    })
    cutDownTime:number = 3;

    onLoad(){
        this.action();
    }

    action(){
        let initPos = cc.v2( this.getRandom(flyBottom[0].x,flyBottom[1].x,), this.getRandom(flyBottom[0].y,flyBottom[1].y,) )
        this.node.setPosition(initPos);
        this.node.RunAction(ezaction.moveTo(this.duration,{x:initPos.x + 5024, y:initPos.y + 4157})).onStoped(()=>{
            this.scheduleOnce(()=>{
                this.action();
            },this.cutDownTime);
        })
    }
    
    
    /** 获取begin到length的随机数 */
    public getRandom = function (begin: number, length: number) {
        return Math.random() * (length - begin) + begin;
    };

    /** 获取begin到length的随机数 整数 */
    public getRandomNum = function (begin: number, length: number) {
        return Math.round(Math.random() * (length - begin) + begin);
    };
    
    onDestroy(){
        super.onDestroy();
    }

}
