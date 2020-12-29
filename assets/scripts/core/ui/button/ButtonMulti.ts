import ButtonEffect from "./ButtonEffect";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonMulti extends ButtonEffect {
    @property(cc.SpriteFrame)
    normalFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    pressedFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    hoverFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    disabledFrame: cc.SpriteFrame = null;

    private isPressed: boolean = false;
    private isHover: boolean = false;

    get spriteFrame(): cc.SpriteFrame {
        return this.node.getComponent(cc.Sprite).spriteFrame;
    }
    
    set spriteFrame(frame: cc.SpriteFrame) {
        this.node.getComponent(cc.Sprite).spriteFrame = frame;
    }

    onLoad() {
        super.onLoad();
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }

    onEnable() {
        this.changeState();
    }

    onDisable() {
        this.isHover = false;
        this.changeState();
    }

    onMouseMove(event: cc.Event.EventMouse) {
        if (this.canTouch) {
            this.isHover = true;
            this.changeState();
        }
    }

    onMouseLeave(event: cc.Event.EventMouse) {
        if (this.canTouch) {
            this.isHover = false;
            this.changeState();
        }
    }

    onTouchtStart(event) {
        if (this.canTouch) {
            super.onTouchtStart(event);
            this.isPressed = true;
            this.changeState();
        }   
    }

    onTouchEnd(event) {
        if (this.canTouch) {
            super.onTouchEnd(event);
            this.isPressed = false;
            this.changeState();
        }
    }

    changeState() {
        if (!this.enabled) {
            this.spriteFrame = this.disabledFrame;
        } else if (this.isPressed) {
            this.spriteFrame = this.pressedFrame;
        } else if (this.isHover) {
            this.spriteFrame = this.hoverFrame;
        } else {
            this.spriteFrame = this.normalFrame;
        }
    }
}