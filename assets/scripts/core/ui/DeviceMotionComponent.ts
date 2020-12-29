/*
 * @CreateTime: Aug 17, 2018 10:17 AM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Sep 19, 2018 5:06 PM
 * @Description: Modify Here, Please 
 * 
 * 陀螺仪重力感应组件，目前只支持手机和平板
 */

const { ccclass, property } = cc._decorator;
@ccclass
export default class DeviceMotionComponent extends cc.Component{

    @property(cc.Float)
    ratioX:number = 30;

    @property(cc.Float)
    ratioY:number = 30;

    @property(cc.Float)
    rate:number = 0.15;

    _x:number = 0;
    _y:number = 0;

    _originX:number = 0;
    _originY:number = 0;

    onLoad(){
        if (cc.sys.isMobile){
            this._x = this.node.x;
            this._y = this.node.y;
            this._originX = this._x;
            this._originY = this._y;
            cc.systemEvent.setAccelerometerEnabled(true);
            cc.systemEvent.on(cc.SystemEvent.EventType.DEVICEMOTION, this.onDeviceMotionEvent, this);
        }

    }

    reactive(){
        this._x = this.node.x;
        this._y = this.node.y;
        this._originX = this._x;
        this._originY = this._y;
    }
    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.DEVICEMOTION, this.onDeviceMotionEvent, this);
    };

    onDeviceMotionEvent (event) {
        if (cc.sys.isMobile){
            this._x = this._originX + event.acc.x * this.ratioX;
            this._y = this._originY + event.acc.y * this.ratioY;
        }
    };

    update(){
        if (cc.sys.isMobile){
            if ( Math.abs(this._x -this.node.x ) < 0.01 ){
                return;
            }
            // x、y坐标添加一个简单缓动
            this.node.x = this.node.x + (this._x - this.node.x)* this.rate;
            this.node.y = this.node.y + (this._y - this.node.y)* this.rate;
        }
    }
}