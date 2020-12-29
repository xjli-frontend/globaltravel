/*
 * @CreateTime: Dec 7, 2018 3:53 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 7, 2018 4:18 PM
 * @Description: Modify Here, Please 
 * 
 * 事件对象基类，继承该类将拥有发送和接送事件的能力
 */

import { MessageEventData } from "./MessageManager";

export class EventDispatcher{

    protected _msg: MessageEventData = null;

    
    /**
     * 注册全局事件
     * @param event(string)      事件名
     * @param listener(function) 处理事件的侦听器函数
     * @param thisObj(object)    侦听函数绑定的this对象
     */
    public on(event: string, listener: ( event: string, args:any)=>void, thisObj: any) {
        if (this._msg == null) {
            this._msg = new MessageEventData();
        }
        this._msg.on( event , listener , thisObj);
    }

    /**
     * 移除全局事件
     * @param event(string)      事件名
     * @param listener(function) 处理事件的侦听器函数
     * @param thisObj(object)    侦听函数绑定的this对象
     */
    public off(event: string) {
        if (this._msg) {
            this._msg.off(event);
        }
    }

    /** 
     * 触发全局事件 
     * @param event(string)      事件名
     * @param arg(Array)         事件参数
     */
    public dispatchEvent(event, arg = null) {
        if (this._msg == null) {
            this._msg = new MessageEventData();
        }
        this._msg.dispatchEvent(event, arg);
    }
    /**
     * 销毁事件对象
     */
    public destroy() {
        if (this._msg) {
            this._msg.removes();
        }
        this._msg = null;
    }
}