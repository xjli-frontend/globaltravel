import ButtonEffect from "./ButtonEffect";

/*
 * @CreateTime: Sep 19, 2017 2:29 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: zhljian
 * @Last Modified Time: Jan 4, 2018 10:54 AM
 * @Description: Modify Here, Please 
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonEffectAnim extends ButtonEffect {

    @property
    range:number = 5;


    onLoad() {
        super.onLoad();
        let initPos = this.node.getPosition();
        this.scaleDownAction = cc.moveTo(this.duration, initPos.x , initPos.y-this.range);
        this.scaleUpAction = cc.moveTo(this.duration, initPos.x , initPos.y+this.range);
    }
}