/*
 * @CreateTime: Aug 6, 2018 7:34 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Aug 6, 2018 7:36 PM
 * @Description: Modify Here, Please 
 * 自动下载spine并播放组件
 */


import { ViewAssetsLoader } from "./ViewAssetsLoader";

const { ccclass, property } = cc._decorator;

@ccclass
export class ViewSpineLoader extends ViewAssetsLoader {

    /**
     * 是否循环播放spine动画
     */
    @property(cc.Boolean)
    public loop:boolean = false;
    /**
     * 播放spine动画名称
     */
    @property(cc.String)
    public animation:string = "";

    onLoad(){
        if (this.url){
            this.setUrl(this.url, (error:Error, loader:ViewAssetsLoader) =>{
                if (error){
                    return;
                }
                let comp = this.node.getComponent(sp.Skeleton);
                if(comp && this.animation){
                    comp.setAnimation(0, this.animation,this.loop)
                }
            })
        }
    }
}
