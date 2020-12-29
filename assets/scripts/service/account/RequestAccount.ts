import { EventDispatcher } from "../../core/event/EventDispatcher";
import { service } from "../Service";
import { LoginType } from "./LoginType";
import engine from "../../core/Engine";

export class RequestAccountPool {

    private static requestFactroyHash: any = {};
    /**
     * 注册登录请求对象
     * @param type 
     * @param func 
     */
    public static register(type: LoginType, func: () => RequestAccount) {
        RequestAccountPool.requestFactroyHash[type] = func;
    }
    /**
     * 获取登录请求对象，优先从内存池中查找，否则创建新的对象
     * @param type 
     * @param func 
     */
    public static get(type: LoginType): RequestAccount {
        if (!type) {
            return null;
        }
        let objOrfunc = RequestAccountPool.requestFactroyHash[type];
        if (!objOrfunc) {
            cc.error("没有注册该类型的生成器函数", type);
            return null;
        }
        let _desc = typeof objOrfunc;
        if (objOrfunc instanceof RequestAccount) {
            return objOrfunc;
        }
        if (_desc === "function") {
            let instance = objOrfunc();
            RequestAccountPool.requestFactroyHash[type] = instance;
            return instance;
        }
        return null;
    }
}

/** 帐号登录处理抽象类 */
export abstract class RequestAccount extends EventDispatcher {

    /**
     * 登录平台SDK
     * @param callback 
     */
    public abstract sdkLogin(callback?: (data: any) => void): void;

    /** 发送登录协议 */
    public abstract login(callback?: (data: any) => void): void;

    /** 退出登录，处理sdk登出 */
    public abstract logout(): void;

    /** 退出，可以处理sdk之类的接口 */
    public abstract exit(): void;

    public abstract bindAccount(callback: (data: any) => void): void;
    /**
     * 调用登录协议
     * @param data 
     * @param success 
     * @param error 
     */
    public normalLogin(data: any, success: Function, error: Function) {
        engine.log.info("登录参数 = ", JSON.stringify(data));
        service.server.request("connector.entryHandler.login", data, success, error);
    }
}
