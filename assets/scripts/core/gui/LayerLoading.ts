/*
 * @CreateTime: Mar 11, 2019 6:50 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: May 29, 2019 2:57 PM
 * @Description: Modify Here, Please 
 * 
 * loading层控制器
 * 同时只能有一个正在显示，且只有上loading完全消失才允许调用add
 */

import { UICallbacks, ViewParams } from "./Defines";
import { LayerUI } from "./LayerUI";

export class LayerLoading extends LayerUI{

    constructor(name:string,container:cc.Node){
        super(name,container);
        this.layer.addComponent(cc.BlockInputEvents);
        this.layer.active = false;
    }
    
    /**
     * 添加一个预制件节点到层容器中，该方法将返回一个唯一uuid来标识该操作节点
     * @param prefabPath 预制件路径
     * @param params     传给组件onAdded、onRemoved方法的参数。
     * @param callbacks  回调函数对象，可选
     */
    add( prefabPath:string, params:any, callbacks:UICallbacks = null):string{
        if (this.__nodes.length > 0){
            cc.warn(`[${this.name} 已经存在loading]`)
            return "";
        }
        if ( this._asyncQueue.isProcessing ){
            cc.warn(`[${this.name} loading界面正在下载中]`)
            return "";
        }
        return super.add(prefabPath,params,callbacks);
    }
    protected _handlerTask( next:Function, viewParams:ViewParams ){
        // 一次只能出现一个PopUp界面
        let callbacks = viewParams.callbacks;
        let $onRemoved = callbacks.onRemoved;
        callbacks.onRemoved = (node,params)=>{
            if ( $onRemoved ){
                $onRemoved(node,params);
            }
            this.layer.active = this.size() > 0;
        }
        super._handlerTask( next , viewParams );
    }

    protected _createNode( prefab:cc.Prefab, viewParams:ViewParams ):cc.Node{
        this.layer.active = true;
        return super._createNode(prefab,viewParams);
    }
}