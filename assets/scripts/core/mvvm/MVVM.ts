import { Observer } from "./Observer";
import { HashMap } from "../util/HashMap";
// 观察属性回调的对象封装
interface Watcher {
    target: any,
    key: string,
    weekWatch: boolean, // 是否弱观察，前后值相同将不触发回调
    handler: (newvalue: any, oldvalue: any) => void
}
export class MVVM {

    private observer: Observer = null;

    private _data: Object = {};
    private _keyHash: HashMap<string, Array<Watcher>> = new HashMap<string, Array<Watcher>>();

    private _handlerKeys: any = {};

    public get data(): any {
        return this._data;
    }
    public set data(obj: any) {
        this._data = obj;
        if (this.observer) {
            this.observer.release();
        }
        this.observer = new Observer(obj, this._handler.bind(this));
    }
    /**
     * 给VM加上锁，所有值设置无效
     */
    public set lock(val: boolean) {
        if (this.observer) {
            this.observer.lock = val;
        }
    }
    private _handler(data: any, key: string, oldvalue: any, newvalue: any) {
        if (this._handlerKeys[key]) {
            // cc.warn("执行错误，当前属性正在处理中，有可能导致死循环！key = "+key);
        }
        let isSame = oldvalue === newvalue;
        let watchers = this._keyHash.get(key);
        if (watchers) {
            this._handlerKeys[key] = true;
            for (let i = 0; i < watchers.length; i++) {
                let target = watchers[i].target;
                let handler = watchers[i].handler;
                if (watchers[i].weekWatch && isSame) {
                    continue;
                }
                if (target) {
                    handler.call(target, newvalue, oldvalue);
                } else {
                    handler(newvalue, oldvalue);
                }
            }
            delete this._handlerKeys[key];
        }
    }
    /**
     * 观察属性变化，不管值是否改变一律触发回调
     * @param targetKey 观察的属性值，如果该值data当中未定义则会报错。
     * @param handler 属性变化回调，注意，调用watch方法，handler将自动执行一次。
     * @param target 观察回调对象
     */
    alwaysWatch(targetKey: string, handler: (newvalue: any, oldvalue: any) => void, target: any = null) {
        if (!this._data.hasOwnProperty(targetKey)) {
            // cc.error("错误调用，ViewModel没有该属性！",targetKey);
            return;
        }
        let watchers = this._keyHash.get(targetKey)
        if (!watchers) {
            watchers = [];
            this._keyHash.set(targetKey, watchers)
        } else {
            for (let i = 0; i < watchers.length; i++) {
                let $target = watchers[i].target;
                let $handler = watchers[i].handler;
                if (target === $target && handler === $handler) {
                    cc.warn("MVVM 已经注册")
                    return;
                }
            }
        }
        let watcher = {
            target: target,
            handler: handler,
            key: targetKey,
            weekWatch: false
        }
        this._keyHash.get(targetKey).push(watcher);
        this._handlerKeys[targetKey] = true;
        if (target) {
            handler.call(target, this._data[targetKey], null);
        } else {
            handler(this._data[targetKey], null);
        }
        delete this._handlerKeys[targetKey];
    }
    /**
         * 观察属性变化
         * @param targetKey 观察的属性值，如果该值data当中未定义则会报错。
         * @param handler 属性变化回调，注意，调用watch方法，handler将自动执行一次。
         * @param target 观察回调对象
         */
    watch(targetKey: string, handler: (newvalue: any, oldvalue: any) => void, target: any = null) {
        if (!this._data.hasOwnProperty(targetKey)) {
            cc.error("错误调用，ViewModel没有该属性！", targetKey);
            return;
        }
        let watchers = this._keyHash.get(targetKey)
        if (!watchers) {
            watchers = [];
            this._keyHash.set(targetKey, watchers)
        } else {
            for (let i = 0; i < watchers.length; i++) {
                let $target = watchers[i].target;
                let $handler = watchers[i].handler;
                if (target === $target && handler === $handler) {
                    cc.warn("MVVM 已经注册")
                    return;
                }
            }
        }
        let watcher = {
            target: target,
            handler: handler,
            key: targetKey,
            weekWatch: true
        }
        this._keyHash.get(targetKey).push(watcher);
        this._handlerKeys[targetKey] = true;
        if (target) {
            handler.call(target, this._data[targetKey], null);
        } else {
            handler(this._data[targetKey], null);
        }
        delete this._handlerKeys[targetKey];
    }
    /**
     * 取消data的属性变化监听
     * @param targetKey 观察的属性值
     * @param target 观察回调对象
     */
    unwatch(targetKey: string, target: any = null) {
        let watchers = this._keyHash.get(targetKey)
        if (watchers) {
            for (let i = 0; i < watchers.length; i++) {
                let $target = watchers[i].target;
                if ($target === target) {
                    watchers.splice(i, 1);
                }
            }
        }
    }
    /**
     * 取消data的属性变化监听
     * @param target 观察回调对象
     */
    unwatchTargetAll(target: any = null) {
        this._keyHash.forEach((watchers) => {
            for (let i = 0; i < watchers.length; i++) {
                let $target = watchers[i].target;
                if ($target === target) {
                    watchers.splice(i, 1);
                }
            }
        })
    }
    /**
     * 是否Mvvm实例
     */
    release() {
        this._keyHash.clear();
        this._keyHash = null;
        this.observer.release();
        this.observer = null;
        this._data = null;
    }
}
