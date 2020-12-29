/*
 * @CreateTime: Mar 11, 2019 6:47 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Mar 14, 2019 11:52 AM
 * @Description: Modify Here, Please 
 * 
 * 消息提示层，类似以前Toast
 * 请直接调用 show方法来显示提示
 */

import { LayerUI } from "./LayerUI";
import { ViewParams, UICallbacks } from "./Defines";

export class LayerNotify extends LayerUI{

    static toastPrefabPath:string = 'common/persist/prefab/toast';
    /**
     * 显示toast
     * @param content 文本表示
     * @param useI18n 
     */
    show( content:string ,useI18n: boolean = true ):void{
        super.add( LayerNotify.toastPrefabPath, {
            content:content,
            useI18n:useI18n
        }, null )
    }

    add( prefabPath:string, params:any, callbacks:UICallbacks = null):string{
        cc.error(`[LayerNotify]，不允许调用，请使用show方法`);
        return "";
    }

    protected _createNode( prefab:cc.Prefab, viewParams:ViewParams ){
        let childNode:cc.Node = super._createNode(prefab,viewParams);
        let toastCom = childNode.getComponent('Toast');
        childNode.active = true;
        toastCom.showToast(viewParams.params.content, viewParams.params.useI18n,()=>{
            childNode.destroy();
        });
        return childNode;
    }
}