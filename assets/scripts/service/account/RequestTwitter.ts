/*
 * Author      : donggang
 * Create Time : 2017.8.31
 */
import { RequestAccount, RequestAccountPool } from "./RequestAccount";
import { LoginType } from "./LoginType";
import { PluginEntity } from "../../core/ezplugin/PluginEntity";
import { ezplugin } from "../../core/ezplugin/ezplugin";

/** twitter 登录 */
class RequestTwitter extends RequestAccount {

    platform = 2;
    constructor(){
        super();

    }
    get plugin():PluginEntity{
        return ezplugin.get("PluginTwitter");
    }
    
    /**
     * 
     * @param callback 
     */
    public sdkLogin( callback ?: (data:any)=>void ){
        
    }

    /**
     * 登录协议
     * @param callback 
     */
    public login( callback ?: (data:any)=>void ): void {
    }

    public logout(): void {
        this.plugin && this.plugin.excute("logout","");
    }
    
    public bindAccount( callback:(data:any)=>void ){}

    public exit():void{

    }
}

RequestAccountPool.register( LoginType.twitter , ()=>{
    return new RequestTwitter();
} )