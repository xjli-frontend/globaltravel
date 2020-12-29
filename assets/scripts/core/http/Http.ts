import { RequestEntity } from "./RequestEntity";
import { RequestConfig, RequestConfigInterface } from "./RequestConfig";

export class Http {

    public baseURL: string = "";

    private _requestHashMap = {};

    /**
     * 中断请求
     * @param requestIdOrRequestEntity 
     */
    abort(requestIdOrRequestEntity: string | RequestEntity) {
        let request: RequestEntity = null;
        if (typeof requestIdOrRequestEntity === "string") {
            request = this._requestHashMap[requestIdOrRequestEntity];
        } else if (requestIdOrRequestEntity instanceof RequestEntity) {
            request = requestIdOrRequestEntity;
        }
        if (!request) {
            return;
        }
        request.$abort();
        this.destroy(request);
    }
    /**
     * 发送get请求
     * @param url 
     * @param config 
     */
    public get(url: string, config?: RequestConfigInterface): RequestEntity {
        let $config = config || {};
        $config.url = url;
        if (!$config.baseURL && this.baseURL) {
            $config.baseURL = this.baseURL;
        }
        $config.method = "GET";
        let request = new RequestEntity(new RequestConfig($config));
        this._requestHashMap[request.UUID] = request;
        request.$complete = () => {
            this.destroy(request);
        }
        return request;
    }

    /**
     * 
     * @param url 
     * @param params 
     * @param config 
     */
    public post(url: string, data: any, config?: RequestConfigInterface): RequestEntity {
        let $config = config || {};
        $config.url = url;
        if (!$config.baseURL && this.baseURL) {
            $config.baseURL = this.baseURL;
        }
        $config.method = "POST";
        $config.data = JSON.stringify(data);
        let request = new RequestEntity(new RequestConfig($config));
        this._requestHashMap[request.UUID] = request;
        request.$complete = () => {
            this.destroy(request);
        }
        return request;
    }
    private destroy(request: RequestEntity) {
        delete this._requestHashMap[request.UUID];
        request.$dispose();
    }
}

export const http = new Http();