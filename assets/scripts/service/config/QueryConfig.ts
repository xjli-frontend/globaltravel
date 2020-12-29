/*
 * @CreateTime: Aug 14, 2018 4:33 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 10, 2018 4:34 PM
 * @Description: Modify Here, Please 
 * 
 * QueryConfig 获取和处理浏览器地址栏参数
 * 
 * 只提供getter接口和方法
 * 
 */
import { UrlParse } from "../../core/url/UrlParse";

const SALT_KEY = "WH";
export default class QueryConfig {

    /**只有2个值:
     *  0:在所有必要情况下显示货币符号(​详细信息​)
     *  1:货币符号应该在所有情况下隐藏
     *  */
    public get hideCurrency():string{
        return this._data["hideCurrency"] || "0";
    }
    /**
     * 只有2个值: 
     * 0:显示RTP值(​详细信息​) 
     * 1:RTP值应隐藏在所有情况下
     * RTP表示实际返奖率
     */
    public get hideRTP():string{
        return this._data["hideRTP"] || "0";
    }

    // /** 获取运行平台 */
    // public get platform(): Platform{
    //     return this._data["platform"] || Platform.NONE;
    // }

    /** 1-5个ip地址,并使用”_”作分隔 从外部指定的伺服器地址 */
    public get ips(): string{
        return this._data["ips"];
    }
    /** 1-5个网域地址,并使用”_”作分隔 从外部指定的伺服器地址 */
    public get ipdomains(): string{
        return this._data["ipdomains"];
    }
    /** 玩家帳號 */
    public get username(): string{
        return this._data["username"];
    }
    /** 用於跟錢包對接(session) */
    public get token(): string{
        return this._data["token"];
    }
    /** 遊戲代號 */
    public get gameid(): string{
        return this._data["gameid"];
    }
    /** 
     * 0代表用戶是真錢帳號
     * 1代表用戶是試玩帳號
     */
    public get userFlag(): string{
        return this._data["userFlag"];
    }
    /** 用户名 */
    public get name(): string{
        return this._data["name"];
    }
    /**
     * 客戶使用的語言
     * 遊戲需要自動調節成對應語言,若該語言是不支持的話,請自動改為使用英語
     * 遊戲默認使用簡體中文. 
     */
    public get lang(): string{
        return this._data["lang"];
    }

    /** 显示礼包按钮 */
    public get gift():string{
        let _gift = this._data["gift"] || "0";
        if(cc.sys.isBrowser && _gift == 1){
            return "1";
        }
        return "0";
    }

    /**
     * 遊戲需檢查此值是否存在,
     * IF(該值是不存在)
     * 將遊戲內所有能夠關閉/退出的按鈕移除,
     * IF(該值是存在)
     * 將遊戲內所有能夠關閉/退出的按鈕,改成跳至該值的網址位置.
     */
    public get closeUrl(): string{
        return this._data["closeUrl"];
    }
    /** 0代表按closeUrl方法处理所有关闭/退出按钮即可
      * 1代表需要完全移除所有能够关闭/退出的按钮 , 即使closeUrl是带有任何值都好. 
      */
    public get disableHomeBtn(): string{
        return this._data["disableHomeBtn"];
    }
    /** 游戏服务器端口 */
    public get port(): string{
        return this._data["port"];
    }
    /** 测试模式高几率中奖 */
    public get debug(): string{
        return this._data["debug"];
    }
    /** 测试模式高几率中奖类型（地址栏传参数 bigwin , megawin championwin freespin minigame） */
    public get wintype(): string{
        return this._data["wintype"];
    }
    
    /** 客户端ip，区别于ips */
    public get ip(): string{
        return this._data["ip"] || "";
    }

    /** 处理动态传递给游戏的服务器地址 */
    public getConfigServerInfo(): {ips:Array<string>, ssl:boolean, port:number } {
        let ret = {
            ips:[],
            ssl:false,
            port:0
        }
        if ( this.ips ) {
            ret.ips = this.ips.split('_');
            ret.ssl = false;
        }
        if ( this.ipdomains ) {
            ret.ips = this.ipdomains.split('_');
            ret.ssl = true;
        }
        if ( this.port ) {
            ret.port = parseInt(this.port)
        }
        if (ret.ips.length < 1){
            cc.warn("[QueryConfig]请在地址栏输入游戏服务器ip");
        }
        if (ret.port < 1){
            cc.warn("[QueryConfig]请在地址栏输入端口号")
        }
        return ret;
    }
    
    // 浏览器地址栏原始参数，不可修改！
    private _data:any = null;
    public get data(){
        return this._data;
    }
    constructor(){
        let data:Object = (new UrlParse(SALT_KEY)).query;
        if (!data){
            this._data = {};
            return;
        }
        if ( !data["username"] ) {   // && CC_DEBUG
            data["username"] = getWeakUUID();
        }
        this._data = Object.freeze(data);
    }
}

let getWeakUUID = function() {
    function uuidGenerator(len, radix) {
        let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        let uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            // Compact form
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
        } else {
            // rfc4122, version 4 form
            let r;

            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            // Fill in random data. At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }
        return uuid.join('');
    }
    let uuid = cc.sys.localStorage.getItem("__uuid_");
    if (!uuid) {
        uuid = cc.sys.os + cc.sys.platform + "_" + uuidGenerator(13, 16);
        uuid = uuid.replace(/[\s]+/, "")
        cc.sys.localStorage.setItem("__uuid_", uuid);
    }
    return uuid;
}