import SelectBase from "./SelectBase";

const { ccclass, property } = cc._decorator;


@ccclass
export class SpriteSelect extends SelectBase {

    @property(cc.SpriteFrame)
    offSprite: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    onSprite: cc.SpriteFrame = null;

    protected refresh() {
        let sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.state ? this.onSprite : this.offSprite;
    }
}