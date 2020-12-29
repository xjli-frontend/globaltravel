/**
 * 定义HTTP参数
 */


export interface RequestConfigInterface {
    url?: string;
    method?: string,
    baseURL?: string,
    headers?: any,
    // for get
    params?: any;
    // for post
    data?: any;
    timeout?: number,
    withCredentials?: boolean,
    responseType?: XMLHttpRequestResponseType,
    // 校验http状态码是否成功
    validateStatus?: (status) => boolean,
    // 验证
    auth?: { username: string, password: string },

    callback?: (error: Error, response: any) => void,
}

export class RequestConfig implements RequestConfigInterface {

    url: string = "";

    method: string = 'get';

    baseURL: string = "";

    headers: any = { "Content-type": "application/x-www-form-urlencoded" };
    // for get
    params: any;
    // for post
    data: any;

    timeout: number = 5000;

    withCredentials: boolean = false;

    /** 返回js对象类型 */
    responseType: XMLHttpRequestResponseType = "json";

    validateStatus: (status) => boolean = function (status) {
        return status >= 200 && status < 300;
    }

    auth: { username: string, password: string } = null;

    // http回调
    callback: (error: Error, response?: any) => void = null;

    constructor(config: any) {
        if (!config) {
            return;
        }
        if (typeof config === "object") {
            for (let k in config) {
                this[k] = config[k];
            }
        }
    }
}