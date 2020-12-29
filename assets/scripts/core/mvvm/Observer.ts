
export class Observer {
    data: Object = null;
    propertyChangeCallback: (data: any, key: string, oldvalue: any, newvalue: any) => void;

    lock: boolean = false;
    constructor(data: Object, func: (data: any, key: string, oldvalue: any, newvalue: any) => void) {
        this.data = data;
        this.propertyChangeCallback = func;
        this.walk(data);
    }

    walk(data) {
        let me = this;
        Object.keys(data).forEach((key) => {
            me.defineReactive(data, key, data[key]);
        });
    }

    defineReactive(data: any, key: string, val: any) {
        let callback = this.propertyChangeCallback;
        let value = val;
        let self = this;
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function () {
                return value;
            },
            set: function (newVal) {
                if (self.lock) {
                    return;
                }
                let oldvalue = value;
                value = newVal;
                callback && callback(data, key, oldvalue, newVal);
            }
        });
    }
    release() {
        this.data = null;
        this.propertyChangeCallback = null;
    }
}