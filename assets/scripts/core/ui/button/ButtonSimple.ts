import engine from "../../Engine";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonSimple extends cc.Component {
    @property({
        tooltip : "是否只能触发一次"
    })
    once : boolean = false; 
    
    @property({
        tooltip : "每次触发间隔"
    })
    interval : number = 5;

    @property({
        tooltip : "回调方法名称"
    })
    reflectCallback : string = "";

    private touchCount    = 0;
    private touchtEndTime = 0;

    onLoad() {
        this.onListen();
    }

    /** 触摸开始 */
    onTouchtStart(event : cc.Event.EventTouch){
    }

    /** 触摸结束 */
    onTouchEnd(event : cc.Event.EventTouch) {
        if (this.once) {
            if (this.touchCount > 0) {
                event.stopPropagation();
                return;
            }
            this.touchCount++;
        }

        // 防连点500毫秒出发一次事件
        if (this.touchtEndTime && engine.timer.getTime() - this.touchtEndTime < this.interval) { 
            event.stopPropagation();
            cc.warn("防连点事件触发");
        }
        else {
            this.touchtEndTime = engine.timer.getTime();
        }
    }

    onDestroy(){
        this.reflectCallback = null;
        this.node.off(cc.Node.EventType.TOUCH_START , this.onTouchtStart, this);
        this.node.off(cc.Node.EventType.TOUCH_END   , this.onTouchEnd   , this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd   , this);
    }

    onListen () {
        this.node.on(cc.Node.EventType.TOUCH_START , this.onTouchtStart, this);
        this.node.on(cc.Node.EventType.TOUCH_END   , this.onTouchEnd   , this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd   , this);
    }
}
