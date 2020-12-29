

const { ccclass, property } = cc._decorator;

@ccclass
export default class ActionX extends cc.Component {

    @property
    maxY:number = 0;

    @property
    minY:number = 0;

    @property
    duration:number = 30;
    
    onLoad(){
        this.action();
    }

    action(){
        let cloudY = this.getRandom(this.minY,this.maxY);
        this.node.y = cloudY;
        this.node.x = 4255 + this.getRandom(50,200);
        if(this.node.getComponent(sp.Skeleton)){
            this.node.getComponent(sp.Skeleton).setAnimation(0,`reward_${this.getRandomNum(1,3)}`,true);
        }
        this.node.RunAction(ezaction.moveTo(this.getRandom(this.duration,this.duration+10),{x:-300})).onStoped(()=>{
            this.action();
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
    
}
