import { EventDispatcher } from "../event/EventDispatcher";
import { network, NetworkEvent, NetworkState } from "../net/Network";
import { HashMap } from "../util/HashMap";

enum AssetsLoaderState{
    LOADING = 0,
    WAIT = 1,
}

type CALL = Array<(res: cc.Asset)=>void>;

export class AssetsLoader <T extends cc.Asset> extends EventDispatcher {
    private _urls:Array<string> = [];
    private _state:AssetsLoaderState = AssetsLoaderState.WAIT;

    private _callbacks:HashMap<string, CALL > = new HashMap<string, CALL >();

    private _assetsType:any = null;

    public complete:Function = null;

    constructor( type: { new(): T }  ){
        super();
        this._assetsType = type;
        this.on( NetworkEvent.CHANGE,this.netchangeHandler,this);
        // cc.director.on(cc.Director.EVENT_BEFORE_UPDATE, this.eventBeforeUpdate,this);
    }
    // private eventBeforeUpdate(){
        
    // }
    public dispose(){
        this._urls = [];
        this.complete = null
        this._callbacks.clear();
        this._callbacks = null;
        this.destroy();
    }
    public setUrls( urls:Array<string>){
        for (let url of urls){
            if (this._urls.indexOf(url) < 0){
                this._urls.push(url);
            }
        }
        this.netchangeHandler();
    }

    public add(url:string){
        if (this._urls.indexOf(url) < 0){
            this._urls.push(url);
            this.netchangeHandler();
        }
    }
    /**
     * 获取资源
     * @param path 
     * @param callback 
     */
    public getRes( path:string, callback: (res: T )=>void ){
        let res = cc.loader.getRes(path, this._assetsType );
        if (res){
            callback(res);
        }else{
            let i = this._urls.indexOf(path);
            if ( i > 0){
                // 把要获取的元素资源优先级提前调整到第一个
                this._urls.splice(i,1);
                this._urls.unshift( path );
            }else if (i<0){
                cc.log("[AssetsLoader] 获取的资源不在下载列表当中，即将添加到下载列表中",path);
                this._urls.unshift( path );
            }
            let cbcs = this._callbacks.get(path);
            if (!cbcs){
                this._callbacks.set( path, [callback] )
            }else{
                cbcs.push(callback);
            }
            this._loadRes( this._urls[0] );
        }
    }

    private get canLoadview(){
        if (cc.sys.isBrowser){
            return network.state === NetworkState.ONLINE;
        }
        return true;
    }

    private _loadRes( url:string ){
        if (!url){
            return;
        }
        if ( !this.canLoadview ){
            this._state = AssetsLoaderState.WAIT;
            return;
        }
        if (this._state == AssetsLoaderState.LOADING){
            return;
        }
        let res:T = cc.loader.getRes(url, this._assetsType) 
        if ( res ){
            this._$loadComplete(url,res);
            return;
        }
        this._state = AssetsLoaderState.LOADING;
        // cc.log(`[AssetsLoader] 下载资源 ${url}`);
        cc.loader.loadRes(url, this._assetsType ,( error,res )=>{
            if (error || !res){
                cc.log("[AssetsLoader] 下载失败" + url , error);
                if ( !this.canLoadview ){
                    this._state = AssetsLoaderState.WAIT;
                    return;
                }
                // 把下载失败的资源路径添加到列表最后再下载。
                let i = this._urls.indexOf(url);
                if (i>=0){
                    this._urls.splice(i,1);
                    this._urls.push(url);
                }
                this._loadRes(this._urls[0]);
                return;
            }
            this._$loadComplete(url,res)
        } )
    }
    private _$loadComplete( url:string, res:T ){
        this._state = AssetsLoaderState.WAIT;
        let cbs = this._callbacks.get(url);
        if (cbs){
            // 删除回调索引对象
            this._callbacks.delete(url);
            cbs.forEach(e=>{
                e(res);
            })
        }
        // cc.log("AssetsLoader: 下载完成 " + url);
        let i = this._urls.indexOf(url);
        if (i>=0){
            this._urls.splice(i,1);
        }
        if (this._urls.length > 0){
            this._loadRes( this._urls[0] )
        }else{
            if (this.complete){
                this.complete();
            }
        }
    }
    private netchangeHandler(){
        if (this._state == AssetsLoaderState.WAIT && this.canLoadview ){
            // 网络连接上再重新下载
            if (this._urls.length > 0){
                this._loadRes( this._urls[0] );
            }
        }
    }
}