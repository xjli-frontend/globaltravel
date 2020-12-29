/*
 * @CreateTime: Mar 11, 2019 6:48 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Mar 14, 2019 1:58 PM
 * @Description: Modify Here, Please 
 * 
 * 浮动层控制器
 * 该层的节点可显示多可浮动窗口，删除以后会自动从队列当中取一个弹窗，知道队列为空
 */


import { ViewParams } from "./Defines";
import { LayerUI } from "./LayerUI";

export class LayerFloat extends LayerUI{

    constructor(name:string,container:cc.Node){
        super(name,container);
        // this.layer.active = false;
    }

    // protected _handlerTask( next:Function, viewParams:ViewParams ){
        // // 一次只能出现一个PopUp界面
        // let callbacks = viewParams.callbacks;
        // let $onRemoved = callbacks.onRemoved;
        // callbacks.onRemoved = (node,params)=>{
        //     if ( $onRemoved ){
        //         $onRemoved(node,params);
        //     }
        //     // this.layer.active = this.size() > 0;
        //     next();
        // }
        // super._handlerTask(  ()=>{
        //     if (this.layer.childrenCount < 1){
        //         cc.warn("上次弹窗界面未成功显示，直接进入下一步");
        //         callbacks.onRemoved( null , viewParams.params);
        //     }
        // } , viewParams );
    // }

    protected _createNode( prefab:cc.Prefab, viewParams:ViewParams ):cc.Node{
        return super._createNode(prefab,viewParams);
    }

    clear(){
        // super.clear();
    }

}