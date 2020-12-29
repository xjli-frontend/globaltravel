import engine from "../../Engine";
import { ComponentExtends } from "../ComponentExtends";
import { NetworkEvent, NetworkState } from "../../net/Network";

/*
 * @CreateTime: May 31, 2018 5:56 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 7, 2018 8:58 PM
 * @Description: Modify Here, Please 
 * 
 * 自动给cc.Sprite或sp.Skeleton下载远程资源，下载完成后自动替换资源
 */

const { ccclass, property } = cc._decorator;
@ccclass
export class ViewAssetsLoader extends ComponentExtends {

    // 下载url地址
    @property(cc.String)
    public url:string = "";

    private _loadCount:number = 3;

    private _state:number = 0; // 0未下载，1下载中，2表示已完成

    private _loadCallback: (error:Error, loader:ViewAssetsLoader)=>void = null;
    
    start(){
        this.on( NetworkEvent.CHANGE,this.netchangeHandler,this)
    }
    
    onEnable(){
        if (this.url){
            this.setUrl(this.url,this._loadCallback);
        }
    }
    setCompleteListener(callback:(error:Error, loader:ViewAssetsLoader)=>void){
        if (this._state == 2){
            callback(null,this);
        }else{
            this._loadCallback = callback;
        }
    }
    protected loadCompleted(error,resource) {
        let url = this.url;
        let callback = this._loadCallback;
        if (error){
            cc.warn("ViewAssetsLoader 下载错误", url ,error);
            this._state = 0;
            if (this._loadCount <= 0){
                callback && callback( error,this );
            }else if ( engine.network.state === NetworkState.ONLINE ){
                // 如果当前有网络则立即下载
                this.setUrl(url,callback);
                this._loadCount--;
            }
            return;
        }
        this._state = 2;
        if (!this.node){
            return;
        }
        let spComp:cc.Sprite = this.node.getComponent(cc.Sprite);
        if(spComp){
            spComp.spriteFrame = resource;
        }else{
            let comp = this.node.getComponent(sp.Skeleton);
            if(comp){
                comp.skeletonData = resource;
            }
        }
        // 下载成功，回调
        callback && callback(null,this);
        this._loadCallback = null;
    }
    
    public setUrl(url:string,callback:(error:Error, loader:ViewAssetsLoader)=>void = null){
        if (!url){
            callback && callback(new Error("url 不能为空"),this);
            return;
        }
        if (this._state === 1){
            // cc.warn("[ViewAssetsLoader] 正在下载中");
            return;
        }
        this.url = url;
        this._loadCallback = callback;
        this._state = 0;
        if (engine.network.state === NetworkState.OFFLINE){
            cc.log("[ViewAssetsLoader] 断网环境，不下载");
            return;
        }

        let assetsType:any = cc.SpriteFrame;
        let spComp:cc.Sprite = this.node.getComponent(cc.Sprite);
        if(!spComp){
            let comp = this.node.getComponent(sp.Skeleton);
            if (comp){
                assetsType = sp.SkeletonData;
            }else{
                cc.warn("ViewAssetsLoader 无法给当前组件下载资源")
            }
        }
        let assetData = cc.loader.getRes(url,assetsType);
        if (assetData){
            this.loadCompleted(null,assetData);
            return;
        }
        this._state = 1;
        let res = cc.loader.getRes(url,assetsType);
        if (res){
            this.loadCompleted(null,res);
        }else{
            cc.log(`[ViewAssetsLoader] 开始下载资源 ${url}`);
            cc.loader.loadRes(url,assetsType, this.loadCompleted.bind(this) )
        }
    }

    private netchangeHandler(){
        if (this._state == 0 && engine.network.state === NetworkState.ONLINE ){
            // 网络连接上再重新下载
            if (this.url){
                this.setUrl(this.url,this._loadCallback);
            }
        }
    }
    onDestroy(){
        super.onDestroy();
        this._loadCallback = null;
    }
}