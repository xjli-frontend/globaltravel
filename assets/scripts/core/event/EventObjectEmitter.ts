import { HashMap } from "../util/HashMap";

export type EventObject = {
    thisObj:any,
    listener:(event:string,params:any)=>void
}

export default class EventObjectEmitter{

    private _eventHash:HashMap<string, Array<EventObject>>  = new HashMap<string, Array<EventObject>>();

    private _maxListeners:number = 20;
    /**
     * 销毁
     */
    destroy(){
        this._eventHash.clear();
        this._eventHash = null;
    }
    /**
     * 设置最大侦听事件数
     * @param num 
     */
    public setMaxListeners(num:number):void{
        this._maxListeners = num;
    }

    /**
     * 发送事件
     * @param event 
     * @param args 
     */
    public emit(event:string, args?:any):void{
        let arr = this._eventHash.get(event);
        if (arr){
            for (let ec of arr){
                if (ec.thisObj){
                    ec.listener.call(ec.thisObj,event,args);
                }else{
                    ec.listener(event,args);
                }
            }
        }
    }
    /**
     * 监听对象事件
     * @param event 
     * @param listener 
     * @param thisObj 
     */
    public addEventListener(event:string, listener:(event:string,params:any)=>void, thisObj?:any):void{
        let arr = this._eventHash.get(event);
        if (!arr){
            arr = [];
            this._eventHash.set(event,arr);
        }
        arr.push({
            thisObj:thisObj,
            listener:listener
        })
    }

    public once(event:string, listener:(event:string,params:any)=>void, thisObj?:any ):void{
        let cb = (event,args)=>{
            this.removeEventListener(event,cb,thisObj);
            if (thisObj){
                listener.call(thisObj,event,args);
            }else{
                listener(event,args);
            }
        }
        this.addEventListener(event,listener,thisObj);
    }

    public removeEventListener( event:string, listener:(event:string,params:any)=>void, thisObj?:any ):void{
        if (!this._eventHash){
            return;
        }
        let arr = this._eventHash.get(event);
        if (arr && arr.length > 0 ){
            let newarr = [];
            for (let ec of arr){
                if (ec.listener != listener){
                    newarr.push(ec);
                }
            }
            if (newarr.length === arr.length){
                return;
            }
            arr = null;
            if (newarr.length < 0){
                this._eventHash.delete(event);
            }else{
                this._eventHash.set(event,newarr);
            }
        }
    }

    public removeEventListeners(event:string):void{
        if (!this._eventHash){
            return;
        }
        this._eventHash.delete(event);
    }
}