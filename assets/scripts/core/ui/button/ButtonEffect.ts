/*
 * @CreateTime: Sep 19, 2017 2:29 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: zhljian
 * @Last Modified Time: Jan 4, 2018 10:54 AM
 * @Description: Modify Here, Please 
 */
import main from "../../../Main";
import engine from "../../Engine";
import ButtonSimple from "./ButtonSimple";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonEffect extends ButtonSimple {
    /**
     * 默认全局设置
     */
    public static default:{touchStartCallback?:(btn:ButtonEffect)=>void, touchEndCallback?:(btn:ButtonEffect)=>void  } = {};

    @property({
        tooltip: "是否开启"
    })
    disabledeffect: boolean = false;

    @property({
        tooltip: "按钮动画播放时间"
    })
    duration: number = 0.1;

    @property({
        tooltip: "按钮动画缩放比例"
    })
    scale: number = 0.95;


    set canTouch(val: boolean) {
        this._canTouch = val;
    }

    get canTouch(): boolean {
        return this._canTouch;
    }

    private sourceScaleX: number = 1.0;
    private sourceScaleY: number = 1.0;

    protected scaleDownAction: cc.Action = null;
    protected scaleUpAction: cc.Action = null;
    private startTime: number = 1;
    protected _canTouch = true;

    public touchStartCallback:(btn:ButtonEffect)=>void = null;
    public touchEndCallback:(btn:ButtonEffect)=>void = null;


    onLoad() {
        // this.scale = 0.95;
        this.sourceScaleX = this.node.scaleX;
        this.sourceScaleY = this.node.scaleY;
        this.scaleDownAction = cc.scaleTo(this.duration, this.scale * this.sourceScaleX, this.scale * this.sourceScaleY);
        this.scaleUpAction = cc.scaleTo(this.duration, this.sourceScaleX, this.sourceScaleY);

        this.startTime = 1;
        super.onLoad();
    }
    onDestroy(){
        super.onDestroy();
        this.touchEndCallback = null;
        this.touchStartCallback = null;
        this.scaleDownAction = null;
        this.scaleUpAction = null;
    }
    onTouchtStart(event) {
        if(this.disabledeffect){
            return ;
        }
        if(main.module.vm.isMoving){
            engine.log.info(`${this.node.name}ButtonEffect,onTouchtStart`);
            if (this.node._touchListener) {
                this.node._touchListener.setSwallowTouches(false);
            }
            return ;
        }
        if ((new Date().getTime() - this.startTime > 400 && this.startTime != 0) 
        || (Math.abs(this.node.scaleX) == 1 && Math.abs(this.node.scaleY) == 1)) {
            this.node.stopAllActions();
            if (this._canTouch) {
                this.node.runAction(this.scaleDownAction);

                if (this.touchStartCallback){
                    this.touchStartCallback(this);
                }
                if (ButtonEffect.default.touchStartCallback){
                    ButtonEffect.default.touchStartCallback(this);
                }
            }
        }

        super.onTouchtStart(event);
    }

    onTouchEnd(event) {
        if(this.disabledeffect){
            return ;
        }
        if(main.module.vm.isMoving){
            if (this.node._touchListener) {
                this.node._touchListener.setSwallowTouches(false);
            }
            engine.log.info(`${this.node.name}ButtonEffect,onTouchEnd`);
            return ;
        }
        this.node.stopAllActions();
        this.startTime = new Date().getTime();
        let btn = this.node.getComponent(cc.Button);
        this.node.runAction(this.scaleUpAction);
        super.onTouchEnd(event);
        if (this.touchEndCallback){
            this.touchEndCallback(this);
        }
        if (ButtonEffect.default.touchEndCallback){
            ButtonEffect.default.touchEndCallback(this);
        }
    }
}