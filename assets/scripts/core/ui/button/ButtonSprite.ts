import ButtonSimple from "./ButtonSimple";

/*
 * @CreateTime: Mar 9, 2018 11:53 AM
 * @Author: dgflash
 * @Contact: dgflash@qq.com
 * @Last Modified By: dgflash
 * @Last Modified Time: Mar 9, 2018 12:02 PM
 * @Description: 图片按钮
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonSprite extends ButtonSimple {
    @property({
        type: cc.SpriteFrame,
        tooltip: "普通状态下按钮所显示的图片"
    })
    normal: cc.SpriteFrame = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: "按下状态时按钮所显示的图片"
    })
    pressed: cc.SpriteFrame = null;

    /** 触摸开始 */
    onTouchtStart(event: cc.Event.EventTouch) {
        if (this.enabled)
            this.node.getComponent(cc.Sprite).spriteFrame = this.pressed;
    }

    /** 触摸结束 */
    onTouchEnd(event: cc.Event.EventTouch) {
        if (this.enabled) {
            this.node.getComponent(cc.Sprite).spriteFrame = this.normal;
            super.onTouchEnd(event);
        }
    }
}
