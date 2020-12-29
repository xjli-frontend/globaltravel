/*
 * @CreateTime: Jan 4, 2018 11:32 AM
 * @Author: zhljian
 * @Contact: 1065214861@qq.com
 * @Last Modified By: zhljian
 * @Last Modified Time: Jan 4, 2018 11:46 AM
 * @Description: 开关按钮
 */
const { ccclass, property } = cc._decorator;

@ccclass
export class ButtonSwitch extends cc.Component {
    @property({
        type: cc.SpriteFrame,
        tooltip: "true状态下的背景"
    })
    trueBg: cc.SpriteFrame = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: "false状态下的背景"
    })
    falseBg: cc.SpriteFrame = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: "true状态下按钮的背景"
    })
    trueBtnBg: cc.SpriteFrame = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: "false状态下按钮的背景"
    })
    falseBtnBg: cc.SpriteFrame = null;

    @property({
        type: cc.Float ,
        tooltip: "true状态下按钮的位置"
    })
    truePos: number = 0;

    @property({
        type: cc.Float ,
        tooltip: "false状态下按钮的位置"
    })
    falsePos: number = 0;

    @property({
        type: cc.Sprite,
        tooltip: "背景"
    })
    bg: cc.Sprite = null;

    @property({
        type: cc.Node,
        tooltip: "按钮"
    })
    btn: cc.Node = null;

     @property({
         tooltip: "是否能点击"
     })
     canTouch: boolean = true;

    private _state: boolean = false;
    public onChange: (val:boolean)=>void = null ;

    public set state(value: boolean) {
        this._state = value;
        this.refresh();
        if (this.onChange) this.onChange(value);
    }

    public get state(): boolean {
        return this._state;
    }

    onLoad() {
        this.refresh();
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    
    /** 刷新显示 */
    private refresh() {
        this.btn.getComponent(cc.Sprite).spriteFrame = this.state ? this.trueBtnBg : this.falseBtnBg;
        this.bg.spriteFrame = this.state ? this.trueBg : this.falseBg;
        this.btn.x = this.state ? this.truePos : this.falsePos;
    }

    private onTouchEnd() {
        if (!this.canTouch) return;
        this.state = !this.state;
    }
}