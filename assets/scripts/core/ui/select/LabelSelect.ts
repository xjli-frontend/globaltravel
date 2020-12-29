import SelectBase from "./SelectBase";

const { ccclass, property } = cc._decorator;


@ccclass
export class LabelSelect extends SelectBase {

    @property(cc.Color)
    offColor: cc.Color = null;

    @property(cc.Color)
    onColor: cc.Color = null;

    protected refresh() {
        this.node.color = this.state ? this.onColor : this.offColor;
    }
}