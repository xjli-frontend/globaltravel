/*
 * @CreateTime: Sep 19, 2017 2:29 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: zhljian
 * @Last Modified Time: Jan 4, 2018 10:54 AM
 * @Description: Modify Here, Please 
 */
import ButtonEffect from "./ButtonEffect";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonEffectSprite extends ButtonEffect {
  
    @property({
        type:cc.SpriteFrame,
        tooltip: "状态sprite"
    })
    stateSpr:Array<cc.SpriteFrame> = [];
    
    set canTouch(val: boolean) {
        this._canTouch = val;
        this.node.getComponent(cc.Sprite).spriteFrame = this._canTouch? this.stateSpr[0]:this.stateSpr[1];
    }

    get canTouch(): boolean {
        return this._canTouch;
    }



  
}