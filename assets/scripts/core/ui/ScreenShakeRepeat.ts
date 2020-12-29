
//engine.scene
/**
 * 屏幕抖动效果
 * 
*/

/**
 * 自定义抖动动作
 */
export class ScreenShakeRepeat {
    private node: cc.Node;
    //抖动时间
    private duration: 0;
    //已抖动时间
    private dtCost: 0;
    //X轴抖动范围
    private shakeStrengthX: 0;
    private shakeStrengthY: 0;
    //抖动节点
    private shakeNode: cc.Node;
    //抖动节点初始位置
    private nodeInitialPos: cc.Vec2;
    //定时器绑定回调
    private bindCallback: null;
    private isBegin = false;

    constructor(shakeNode, duration, shakeStrengthX, shakeStrengthY) {
        this.shakeNode = shakeNode;
        this.nodeInitialPos = shakeNode.getposition;
        this.shakeStrengthX = shakeStrengthX;
        this.shakeStrengthY = shakeStrengthY;
        this.duration = duration;
        this.isBegin = false;
    }
    
    // private isBegin = false;
    public shakeForever() {
        if (!!window["ActiveXObject"] || "ActiveXObject" in window){   
            return; 
        } 
        if(this.isBegin){
            return;
        }
        this.isBegin = true;
        let action = 
            cc.repeatForever(
                cc.sequence(
                    cc.moveTo(this.duration, cc.v2(-this.shakeStrengthX, -this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(-this.shakeStrengthX * 2, -this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(-this.shakeStrengthX, -this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(0, -this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.shakeStrengthX, -this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.shakeStrengthX * 2, -this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.shakeStrengthX * 2, -this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.shakeStrengthX * 2, 0)),
                    cc.moveTo(this.duration, cc.v2(this.shakeStrengthX, this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(this.shakeStrengthX * 2, this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(this.shakeStrengthX, this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(0, this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(-this.shakeStrengthX, this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(-this.shakeStrengthX * 2, this.shakeStrengthY * 2)),
                    cc.moveTo(this.duration, cc.v2(-this.shakeStrengthX, this.shakeStrengthY)),
                    cc.moveTo(this.duration, cc.v2(0, 0)),
                ));
        this.nodeInitialPos = this.shakeNode.position ;
        this.shakeNode.runAction(action);
    }

    public stopShake(){
        this.isBegin = false;
        if(this.nodeInitialPos){
            this.shakeNode.position = this.nodeInitialPos;
        }
        this.shakeNode.stopAllActions();
    }
}
