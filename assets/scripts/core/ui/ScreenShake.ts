import { AsyncQueue } from "../util/AsyncQueue";

/**
 * 自定义抖动动作
 * 
 */
export class ScreenShake {
    //抖动时间
    private duration: 0;
    /* 相对于节点本身抖动的x轴偏移 */ 
    private shakeStrengthX: number = 0;
    /* 相对于节点本身抖动的y轴偏移 */ 
    private shakeStrengthY: number = 0;
    //抖动节点
    private shakeNode: cc.Node;
    //抖动节点初始位置
    private nodeInitialPos:cc.Vec2 =  null;
    //定时器绑定回调
    private bindCallback: null;
    //抖动次数
    private times: 0;

    private isBegin = false;

    constructor(shakeNode:cc.Node, duration, shakeStrengthX, shakeStrengthY, times) {
        this.shakeNode = shakeNode;
        this.nodeInitialPos = shakeNode.getPosition();
        this.shakeStrengthX = shakeStrengthX;
        this.shakeStrengthY = shakeStrengthY;
        this.duration = duration;
        this.times = times;
        this.isBegin = false;
    }

    /** 只抖动times次，times次后自动调用stopShake方法停止 */
    public shake() {
        if (!!window.ActiveXObject || "ActiveXObject" in window){   
            return; 
        } 
        let action = 
            cc.repeat(
                cc.sequence(
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX * 2,  this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x,                            this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX,      this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x,                            this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX * 2,  this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x, this.nodeInitialPos.y)),
                ), this.times);
        
        let callcunc = cc.callFunc(()=>{
            this.stopShake();
        })
        let seq = cc.sequence(action, callcunc);
        this.shakeNode.runAction(seq);
    }

    /** 会一直抖动 需要调用stopShake方法停止 */
    public shakeForever() {
        if (!!window.ActiveXObject || "ActiveXObject" in window){   
            return; 
        } 
        if(this.isBegin){
            return;
        }
        this.isBegin = true;
        let action = 
            cc.repeatForever(
                cc.sequence(
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX * 2,  this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x,                            this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX,      this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX * 2,  this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x + this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x,                            this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX * 2,  this.nodeInitialPos.y + this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x - this.shakeStrengthX,      this.nodeInitialPos.y + this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x, this.nodeInitialPos.y)),
                ));
        this.shakeNode.runAction(action);
    }

   
    public shakeBigwin() {
        if (!!window.ActiveXObject || "ActiveXObject" in window){   
            return; 
        } 
        let action1 = 
            cc.repeat(
                cc.sequence(
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x,      this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x,      this.nodeInitialPos.y - this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x,      this.nodeInitialPos.y - this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.nodeInitialPos.x, this.nodeInitialPos.y)),
                ), this.times);
        let action2 = cc.repeat(
                cc.sequence(
                    cc.scaleTo(this.duration, 1.05,1.05),
                    cc.scaleTo(this.duration, 1.1,1.1),
                    cc.scaleTo(this.duration, 1.05,1.05),
                    cc.scaleTo(this.duration, 1,1),
                ), this.times);
        let nextCall = AsyncQueue.excuteTimes(2,()=>{
            this.stopShake();
        })
        let callcunc = cc.callFunc(()=>{
            nextCall();
        })
        let seq1 = cc.sequence(action1, callcunc);
        this.shakeNode.runAction(seq1);
        let seq2 = cc.sequence(action2, callcunc);
        this.shakeNode.runAction(seq2);
    }
    public stopShake(){
        this.isBegin = false;
        if(this.nodeInitialPos){
            this.shakeNode.position = this.nodeInitialPos;
        }
        this.shakeNode.stopAllActions();
    }
}
