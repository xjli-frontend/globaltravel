/*
 * @CreateTime: Dec 7, 2018 8:44 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 10, 2018 2:44 PM
 * @Description: Modify Here, Please 
 * 地址栏参数处理，包含解密
 */

export class UrlParse {

    private _data:any = null;

    /** URL search参数对象 */
    public get query(){
        return this._data;
    }
    constructor ( key:string = "WH" ){
        if ( !cc.sys.isBrowser){
            cc.warn("UrlParse unsupported!");
            this._data = {};
            return;
        }
        let data:Object = null;
        if ( location && typeof VVJJQ3J5cHRv != "undefined" && VVJJQ3J5cHRv){
            data = VVJJQ3J5cHRv.d( location.search ,key ) || {};
        }else{
            data = this.parseUrl().params;
        }
        this._data = data;
    }
    private parseUrl(){
        let ret = {
            scheme:"",
            params:{}
        }
        if (typeof window !== "object") {
            return ret;
        }
        if (!window.document) {
            return ret;
        }
        let url = window.document.location.href.toString();
        return UrlParse.parseURL(url);

    }
    public static parseURL(url:string):{scheme:string,params:any}{
        let ret = {
            scheme:"",
            params:{}
        }
        url = decodeURI(url);
        let u = url.split(/[:/\?]+/);
        ret.scheme = u[0].split(":")[0];
        if (typeof (u[1]) == "string") {
            u = u[1].split("&");
            let get = {};
            for (let i = 0, l = u.length; i < l; ++i) {
                let j = u[i].split("=");
                get[j[0]] = j[1];
            }
            ret.params = get;
        }
        return ret;
    }
}