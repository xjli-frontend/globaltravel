import { SpriteSelect } from "./SpriteSelect";

const { ccclass, property } = cc._decorator;

export enum ButtonSelectEvent{
    CHANGE = "ButtonSelectEvent.CHANGE"
}

@ccclass
export class ButtonSelect extends SpriteSelect {

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd() {
        this.state = !this.state;
        this.node.dispatchEvent(new cc.Event.EventCustom(ButtonSelectEvent.CHANGE, true));
    }
}