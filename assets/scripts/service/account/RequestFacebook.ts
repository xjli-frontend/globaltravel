/*
 * Author      : donggang
 * Create Time : 2017.8.31
 */
import { ezplugin } from "../../core/ezplugin/ezplugin";
import { PluginEntity } from "../../core/ezplugin/PluginEntity";
import { gui } from "../../core/gui/GUI";
import { service } from "../Service";
import { LoginType } from "./LoginType";
import { RequestAccount, RequestAccountPool } from "./RequestAccount";

const TAG = "RequestFacebook";
const PLUGIN_NAME = "PluginFacebook";

/** 请求facebook 登录 */
class RequestFacebook extends RequestAccount {

    readonly platform = 3;

    userInfo:any = null;

    sdkLoginComplete:(data:any)=>void = null;

    get plugin():PluginEntity{
        return ezplugin.get(PLUGIN_NAME);
    }

    constructor(){
        super();
        if (this.plugin){
            this.plugin.addEventListener(this.pluginEventHandler.bind(this))
        }
    }

    private pluginEventHandler(event:string,params:any){
        cc.log(`[${TAG}] ${event} ${params}`);
        switch(event){
            case "logined":{
                this.userInfo    = JSON.parse(params);
                this.sdkLoginComplete && this.sdkLoginComplete(this.userInfo);
                this.sdkLoginComplete = null;
                break;
            }
            case "login_cancel":{
                cc.log("当前登录取消");
                this.sdkLoginComplete && this.sdkLoginComplete(null);
                this.sdkLoginComplete = null;
                gui.notify.show("Login cancelled.", false);
                break;
            }
            case "login_error":{
                cc.log("登录失败");
                this.sdkLoginComplete && this.sdkLoginComplete(null);
                this.sdkLoginComplete = null;
                gui.notify.show("Login error.", false);
                // ToDo
                break;
            }
            case "logout":{
                cc.log("玩家退出登录");
                this.sdkLoginComplete && this.sdkLoginComplete(null);
                this.sdkLoginComplete = null;
                break;
            }
            case "update_error":{
                cc.log("账号升级失败");
                break;
            }
        }
    }
    /**
     * 登录SDK账号
     * @param callback 
     */
    public sdkLogin( callback ?: (data:any)=>void ){
        this.userInfo = null;
        this.sdkLoginComplete = null;
        if (this.plugin){
            cc.log(`【${TAG}】 sdkLogin `);
            this.sdkLoginComplete = callback;
            this.plugin.excute("login","");
        }else{
            gui.notify.show("errorcode_10007", true);
            callback(null);
        }
    }

    /**
     * 请求登录协议
     * @param callback 
     */
    public login( callback : (data:any)=>void ): void {
        if (!this.userInfo){
            this.sdkLogin( (data)=>{
                if (data){
                    this.login(callback);
                }else{
                    callback(null);
                }
            } )
            return;
        }
        cc.log(`【${TAG}】 login `);
        let userInfo = this.userInfo;
        let userID      = userInfo['id'];                  // facebook唯一标识ID
        let username    = userInfo["name"];                // 用户名
        let avatar      = "";
        if (userInfo["picture"] && userInfo["picture"]["data"]["url"]){
            avatar = userInfo["picture"]["data"]["url"];
        }
        this.normalLogin( {
            platform:this.platform,
            accountId:userID,
            nickname:username,
            avatar:avatar,
            os:cc.sys.os.toLowerCase(),
        }, callback ,
        ()=>{
            callback(null);
        } );
    }

    public bindAccount( $callback:(data:any)=>void ): void{
        cc.log(`【${TAG}】 bindAccount `);
        service.prompt.netInstableOpen();
        let callback = (data)=>{
            service.prompt.netInstableClose();
            $callback(data);
        }
        this.sdkLogin( (userInfo)=>{
            if (!userInfo){
                callback(null);
                return;
            }
            let userID      = userInfo['id'];                  // facebook唯一标识ID
            let username    = userInfo["name"];                // 用户名
            let avatar      = "";
            if (userInfo["picture"] && userInfo["picture"]["data"]["url"]){
                avatar = userInfo["picture"]["data"]["url"];
            }
            service.server.safetyRequest( "connector.hallServerHandler.bindAccount", {
                platform:this.platform,
                accountId:userID,
                nickname:username,
                avatar:avatar,
            } ,
            (data)=>{
                data["accountId"] = userID;
                data["nickname"] = username;
                callback(data);
            },()=>{
                callback(null)
            });
        } )
    }

    public logout(): void {
        if (this.plugin){
            this.plugin.excute("logout","");
        }
    }
    
    public exit():void{

    }
}

RequestAccountPool.register( LoginType.facebook , ()=>{
    return new RequestFacebook();
} )