
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

const canTouch = new cc.Color(64,140,8);
const canTouchShadow = new cc.Color(192,255,6);
const canNoTouch = new cc.Color(72,72,72);
const canNoTouchShadow = new cc.Color(169,169,169);
@ccclass
export default class LabTouchFont extends ComponentExtends {

    _canTouch:boolean = true;

    set canTouch(val: boolean) {
        if(this.node.getComponent(cc.LabelShadow)){
            this._canTouch = val;
            this.node.color = val ? canTouch:canNoTouch;
            this.node.getComponent(cc.LabelShadow).color = val ? canTouchShadow:canNoTouchShadow;
        }
    }

    get canTouch(): boolean {
        return this._canTouch;
    }

    start(){
    }
    
    onLoad(){
        this.node.addComponent(cc.LabelShadow);
        this.node.getComponent(cc.Label).enableBold = true;
        this.node.getComponent(cc.LabelShadow).blur = 2;
        this.node.getComponent(cc.LabelShadow).offset = new cc.Vec2(2,-2);
        this.canTouch = this._canTouch;
    }

   
    onDestroy(){
        super.onDestroy();
    }

}
