import { ViewUtils } from './ViewUtils';
/*
 * @CreateTime: Apr 10, 2018 3:19 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
* @Last Modified By: howe
* @Last Modified Time: Nov 28, 2019 5:47 PM
 * @Description: Modify Here, Please 
 * loading指示器
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class LoadingIndicator extends cc.Component {
    @property(cc.Node)
    sp_indicator: cc.Node = null;// 旋转指示器
    @property(cc.Node)
    bg: cc.Node = null;
    private _rotate:number = 0;
    onLoad(){
        this.node.opacity = 0;
        this.bg && ViewUtils.fullscreen(this.bg);
    }
    update(dt){
        let opa = this.node.opacity;
        if (opa < 255){
            opa += 35;
            this.node.opacity = Math.min(opa,255);
        }
        this._rotate -= dt*220;
        this.sp_indicator.angle = this._rotate%360;
        if (this._rotate <- 360){
            this._rotate += 360;
        }
    }
}