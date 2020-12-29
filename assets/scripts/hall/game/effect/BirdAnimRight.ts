
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

const flyBottom= [cc.v2(2019,-2076),cc.v2(3372,-836)];
@ccclass
export default class BirdAnimRight extends ComponentExtends {

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
        this.node.RunAction(ezaction.moveTo(this.duration,{x:initPos.x - 5309, y:initPos.y + 2943})).onStoped(()=>{
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
