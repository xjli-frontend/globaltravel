/*
 * @CreateTime: Mar 14, 2019 11:45 AM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Mar 14, 2019 2:16 PM
 * @Description: Modify Here, Please 
 * 
 * gui模块常用类型定义
 */

/*** 回调参数对象定义 */
export interface UICallbacks {

    /** 节点添加到层级以后的回调 */
    onAdded?: ( node:cc.Node, params:any ) =>void,

    /**
     * destroy之后回调
     */
    onRemoved?: ( node:cc.Node, params:any ) =>void,

    /** 
     * 注意：调用`delete`或`$delete`才会触发此回调，如果`this.node.destroy()`，该回调将直接忽略。
     * 
     * 如果指定onBeforeRemoved，则next必须调用，否则节点不会被正常删除。
     * 
     * 比如希望节点做一个FadeOut然后删除，则可以在`onBeforeRemoved`当中播放action动画，动画结束后调用next
     * 
     * */
    onBeforeRemove?: ( node:cc.Node, next:Function ) =>void,

    /**
     * 节点创建失败的回调
     */
    onError?:(error:any)=>void
}

/** gui.popup.add 弹框层回调对象定义 */
export interface PopViewParams extends UICallbacks {
    
    /** 相对的父级节点，弹出的界面将显示在该节点上，可选参数 */
    parent?:cc.Node, 

    /** 是否显示暗色背景 */
    modal?: boolean, 

    /** 是否触摸背景关闭弹窗 */
    touchClose?:boolean,

    /** 控制暗色背景的透明度 默认为190*/
    opacity?:number;

    /** 标记次窗口为唯一存在的窗口，不可重复弹窗 */
    isPop?:boolean
}

/** 本类型仅供gui模块内部使用，请勿在功能逻辑中使用 */
export type ViewParams =  {
    UUID:string,
    prefabPath:string,
    params:any,  // 传给组件`onAdded`、`onRemoved`的参数
    callbacks:UICallbacks,
    valid:boolean  // 该节点是否有效
}