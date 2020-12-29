/*
 * @CreateTime: May 29, 2018 3:43 PM
 * @Author: dgflash
 * @Contact: dgflash@qq.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 7, 2018 4:19 PM
 * @Description: 游戏全局消息管理
 */

class EventData {
    public event: string;
    public listener: ( event: string, args:any)=>void;
    public thisObj: any;
}

/**
 * 批量注册、移除全局事件对象
 */
export class MessageEventData {
    private eventMap:any = {};

    on(event: string, listener: ( event: string, args:any)=>void, thisObj: object) {
        let list: Array<EventData> = this.eventMap[event];
        if (list == null) {
            list = [];
            this.eventMap[event] = list;
        }
        let data: EventData = new EventData();
        data.event = event;
        data.listener = listener;
        data.thisObj = thisObj;
        list.push(data);

        Message.on(event, listener, thisObj);
    }

    off(event: string) {
        let ebs:Array<EventData> = this.eventMap[event];
        if (!ebs){
            return;
        }
        for (let eb of ebs){
            Message.off(event, eb.listener, eb.thisObj);
        }
        delete this.eventMap[event];
    }

    dispatchEvent(event: string, arg: any = null) {
        Message.dispatchEvent(event,arg);
    }
    removes() {
        for (let event in this.eventMap) {
            this.off(event);
        }
    }
}

class MessageManager {
    public static readonly Instance: MessageManager = new MessageManager();

    private eventMap: any = {};

    /**
     * 注册全局事件
     * @param event(string)      事件名
     * @param listener(function) 处理事件的侦听器函数
     * @param thisObj(object)    侦听函数绑定的this对象
     */
    on(event: string, listener: ( event: string, args:any)=>void, thisObj: object) {
        if (!event || !listener){
            cc.warn(`注册【${event}】事件的侦听器函数为空`);
            return;
        }

        let list: Array<EventData> = this.eventMap[event];
        if (list == null) {
            list = [];
            this.eventMap[event] = list;
        }

        let length = list.length;
        for (let i = 0; i < length; i++) {
            let bin = list[i];
            if (bin.listener == listener && bin.thisObj == thisObj) {
                cc.warn( `名为【${event}】的事件重复注册侦听器`);
            }
        }


        let data: EventData = new EventData();
        data.event = event;
        data.listener = listener;
        data.thisObj = thisObj;
        list.push(data);
    }

    /**
     * 监听一次事件，事件响应后，该监听自动移除
     * @param event 
     * @param listener 
     * @param thisObj 
     */
    once(event: string, listener: ( event: string, args:any)=>void, thisObj: object){
        let _listener =  ( $event: string, $args:any)=>{
            this.off( event ,_listener,thisObj);
            _listener = null;
            listener.call( thisObj, $event, $args);
        }
        this.on(event,_listener,thisObj);
    }

    /**
     * 移除全局事件
     * @param event(string)      事件名
     * @param listener(function) 处理事件的侦听器函数
     * @param thisObj(object)    侦听函数绑定的this对象
     */
    off(event: string, listener: Function, thisObj: object) {
        let list: Array<EventData> = this.eventMap[event];

        if (!list) {
            cc.log(`名为【${event}】的事件不存在`);
            return;
        }


        let length = list.length;
        for (let i = 0; i < length; i++) {
            let bin: EventData = list[i];
            if (bin.listener == listener && bin.thisObj == thisObj) {
                list.splice(i, 1);
                break;
            }
        }

        if (list.length == 0) {
            delete this.eventMap[event];
        }
    }

    /** 
     * 触发全局事件 
     * @param event(string)      事件名
     * @param arg(any)           事件参数
     */
    dispatchEvent(event: string, arg: any = null) {
        // cc.log(`[MessageManager] dispatchEvent=${event}`);
        let list: Array<EventData> = this.eventMap[event];

        if (list != null) {
            let temp: Array<EventData> = list.concat();
            let length = temp.length;
            for (let i = 0; i < length; i++) {
                let eventBin = temp[i];
                eventBin.listener.call(eventBin.thisObj, event, arg);
            }
        }
    }
    removeEventTarget(target:any){
        for (let event in this.eventMap){
            let list: Array<EventData> = this.eventMap[event]; 
            for (let i = 0, flag = true, len = list.length; i < len; flag ? i++ : i) {
                let eventData:EventData = list[i];
                if (eventData && eventData.thisObj === target){
                    list.splice(i, 1);
                    flag = false;
                }else{
                    flag = true;
                }
            }
        }
    }
}

export const Message = MessageManager.Instance;