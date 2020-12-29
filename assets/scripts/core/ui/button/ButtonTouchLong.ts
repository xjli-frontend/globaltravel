import ButtonEffect from "./ButtonEffect";

export enum ButtonTouchLongEvent{
    LONG_TOUCH = "ButtonTouchLongEvent.LONG_TOUCH"
}

const { ccclass, property } = cc._decorator;

@ccclass
export class ButtonTouchLong extends ButtonEffect {
    @property({
        tooltip : "长按时间"
    })
    time : number = 1; 

    protected _isTouchLong  : boolean  = true;
    /** 是否为长按 */
    public get isLongTouch(){
        return this._isTouchLong;
    }

    protected _passTime = 0;

    protected _event:cc.Event.EventTouch = null;

    public longTouchCallback:( event:cc.Event.EventTouch)=>void = null;

    onLoad() {
        this._isTouchLong  = false;
        super.onLoad();
    }
    onDestroy(){
        super.onDestroy();
        this._event = null;
        this.longTouchCallback = null;
    }
    /** 触摸开始 */
    onTouchtStart(event : cc.Event.EventTouch){
        if (!this.canTouch){
            return;
        }
        this._event = event;
        this._passTime = 0;
        super.onTouchtStart(event);
    }

    /** 触摸结束 */
    onTouchEnd(event : cc.Event.EventTouch) {
        if (!this.canTouch){
            return;
        }
        if (this._passTime > this.time){
            event.stopPropagation();
        }
        this._event = null;
        this._passTime = 0;
        this._isTouchLong  = false;
        super.onTouchEnd(event);
    }

    removeTouchLong(){
        this._event = null;
        this._isTouchLong  = false;
    }

    /** 引擎更新事件 */
    update(dt : number){
        if (!this.canTouch){
            return;
        }
        if (this._event && !this._isTouchLong ){
            this._passTime += dt;
            if (this._passTime >= this.time){
                this._isTouchLong  = true;
                this.longTouchCallback(this._event);
                this.removeTouchLong();
            }
        }
    }
}
