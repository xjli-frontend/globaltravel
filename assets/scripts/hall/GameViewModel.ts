import { Message } from "../core/event/MessageManager";
import { MVVM } from "../core/mvvm/MVVM";
import { formatParams } from "./CalcTool";
import { MainProgress, NoviceProgress } from "./game/novice/NoviceHandle";
import { ThemeMessage } from "./ThemeMessage";

/*
 * @CreateTime: Sep 11, 2018 4:02 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: May 16, 2019 3:11 PM
 * @Description: Modify Here, Please 
 * 
 * MVVM桥接文件，提供接口的setter和getter访问
 */

const LANG_KEY = "lang_key";
const GEAR_KEY = "gear_key";
const GLOBAL_KEY = "global_key";

export default class GameViewModel{

    private mvvm:MVVM = null;

    private _localStorageObj:Object = null;

    public key:string = "";
    public get localStorageObj(){
        if (!this._localStorageObj){
            let _localStorageObj = cc.sys.localStorage.getItem(GLOBAL_KEY + this.key);
            if (_localStorageObj) {
                try {
                    this._localStorageObj = JSON.parse(_localStorageObj);
                } catch (e) {
                    this._localStorageObj = {};
                }
            }else{
                this._localStorageObj = {};
            }
            // if (!this._localStorageObj.hasOwnProperty(LANG_KEY)) {
            //     this._localStorageObj[LANG_KEY] = "en";;
            // }
            // if(engine.i18n.languages.indexOf(Config.query.lang) != -1){
            //     this._localStorageObj[LANG_KEY] = Config.query.lang;
            // }
            if (!this._localStorageObj.hasOwnProperty(GEAR_KEY)) {
                this._localStorageObj[GEAR_KEY] = 1;;
            }
        }
        return this._localStorageObj;
    }
    save(){
        cc.sys.localStorage.setItem(GLOBAL_KEY +this.key, JSON.stringify(this.localStorageObj));
    }
    constructor(data){
        this.mvvm = new MVVM();
        // 定义MVVM应该观察的数据属性
        this.mvvm.data =data;
        this.lang = data["lang"];
        this.gear = this.localStorageObj[GEAR_KEY];
    }

    /**
     * 观察属性变化
     * @param targetKey 观察的属性值，如果该值data当中未定义则会报错。
     * @param handler 属性变化回调，注意，调用watch方法，handler将自动执行一次。
     * @param target 观察回调对象
     */
    public watch(targetKey:string, handler:  (newvalue:any,oldvalue:any)=>void ,target :any = null ){
        return this.mvvm.watch(targetKey,handler,target)
    }
    
    /**
     * 取消data的属性变化监听
     * @param targetKey 观察的属性值
     * @param target 观察回调对象
     */
    public unwatch(targetKey:string, target:any){
        return this.mvvm.unwatch(targetKey,target)
    }

    unwatchTargetAll(target:any){
        this.mvvm.unwatchTargetAll(target);
    }

    /** 获取视图语言 */
    public get lang():string{
        return this.mvvm.data.lang;
    }
    /** 设置视图语言 */
    public set lang(val:string){
        this.mvvm.data.lang = val;
        cc.sys.localStorage.setItem("language", val);
    }

    /** 升级挡位 */
    public get gear():string{
        return this.mvvm.data.gear;
    }
    /** 升级挡位 */
    public set gear(val:string){
        this.mvvm.data.gear = val;
        this.localStorageObj[GEAR_KEY] = val;
        this.save();
    }

    /** 获取视图钻石余额*/
    public get diamond():number{
        return this.mvvm.data.diamond;
    }
    
    /** 设置视图钻石余额*/
    public set diamond(val:number){
        this.mvvm.data.diamond = val;
    }

    /** 获取城市id*/
    public get cityId():number{
        return this.mvvm.data.cityId;
    }
    
    /** 设置城市id*/
    public set cityId(val:number){
       this.mvvm.data.cityId = val;
    }

    /** 获取最大城市id*/
    public get level():number{
        return this.mvvm.data.level;
    }
    
    /** 设置最大城市id*/
    public set level(val:number){
       this.mvvm.data.level = val;
    }

    /** 获取视图余额基数*/
    public get credit():formatParams{
        return this.mvvm.data.credit;
    }
    
    /** 设置视图余额基数 直接设置lab*/
    public set credit(val:formatParams){
        this.mvvm.data.credit = val;
        Message.dispatchEvent(ThemeMessage.CREDIT)
    }

    /** 总收益*/
    public get win():formatParams{
        return this.mvvm.data.win;
    }

    /** 总收益*/
    public set win(val:formatParams){
        this.mvvm.data.win = val;
    }

    /** 总收益*/
    public get winTotal():formatParams{
        return this.mvvm.data.winTotal;
    }

    /** 总收益*/
    public set winTotal(val:formatParams){
        this.mvvm.data.winTotal = val;
    }

    /** 刷新余额和店铺升级金额等主界面UI params:{余额基数，余额指数}*/
    public set refreshCreditUi(val:any){
        this.mvvm.data.refreshCreditUi = val;
    }

    /** 刷新某一个店铺的店员等级*/
    public set refreshClerkLv(val:any){
        this.mvvm.data.refreshClerkLv = val;
    }

    /** 刷新店铺列表*/
    public set storeList(val:any){
        this.mvvm.data.storeList = val;
    }
    
    /** 获取店铺列表数据*/
    public get storeList(){
        return this.mvvm.data.storeList;
    }
    
    /** 刷新店员列表*/
    public set clerkList(val:any){
        this.mvvm.data.clerkList = val;
    }

    /** 获取店员列表数据*/
    public get clerkList(){
        return this.mvvm.data.clerkList;
    }

    /** 刷新声望列表*/
     public set fameList(val:any){
        this.mvvm.data.fameList = val;
    }

    /** 获取声望列表数据*/
    public get fameList(){
        return this.mvvm.data.fameList;
    }

    /** 商品列表*/
    public set goodsList(val:any){
        this.mvvm.data.goodsList = val;
    }

    /** 获取商品列表数据*/
    public get goodsList(){
        return this.mvvm.data.goodsList;
    }

    /** 排行榜*/
    public set rankingList(val:any){
        this.mvvm.data.rankingList = val;
    }

    /** 获取排行榜数据*/
    public get rankingList(){
        return this.mvvm.data.rankingList;
    }

    /** 永久加成信息*/
    public set goodsInfo(val:any){
        this.mvvm.data.goodsInfo = val;
    }

    /** 获取永久加成信息*/
    public get goodsInfo(){
        return this.mvvm.data.goodsInfo;
    }
    
    /** 观看广告次数*/
    public set advCount(val:any){
        this.mvvm.data.advCount = val;
    }

    /** 获取观看广告次数*/
    public get advCount(){
        return this.mvvm.data.advCount;
    }

    /** 任务列表*/
    public set taskList(val:any){
        this.mvvm.data.taskList = val;
    }

    /** 获取任务列表*/
    public get taskList(){
        return this.mvvm.data.taskList;
    }

    /** 道具列表*/
    public get propStorageList(){
        return this.mvvm.data.propStorageList;
    }

    /** 道具列表*/
    public set propStorageList(val:any){
        this.mvvm.data.propStorageList = val;
    }

    /** 使用过的道具加成数据*/
    public set propList(val:any){
        this.mvvm.data.propList = val;
    }

    /** 使用过的道具加成数据*/
    public get propList(){
        return this.mvvm.data.propList;
    }

    /** 新手引导完成信息*/
    public set noviceProgress(val:NoviceProgress){
        cc.log(this.mvvm.data.noviceProgress)
        this.mvvm.data.noviceProgress = val;
    }

    /** 新手引导完成信息*/
    public get noviceProgress(){
        return this.mvvm.data.noviceProgress;
    }

    /** 主线任务引导完成信息*/
    public set mainProgress(val:MainProgress){
        this.mvvm.data.mainProgress = val;
    }

    /** 主线任务引导完成信息*/
    public get mainProgress(){
        return this.mvvm.data.mainProgress;
    }

    /** 过关次数*/
    public set sellNum(val:number){
        this.mvvm.data.sellNum = val;
    }

    /** 过关次数*/
    public get sellNum(){
        return this.mvvm.data.sellNum;
    }
    
    /** 是否可以过关*/
    public set isPass(val:number){
        this.mvvm.data.isPass = val;
    }

    /** 是否可以过关*/
    public get isPass(){
        return this.mvvm.data.isPass;
    }

    /** npc互动次数*/
    public set npcNum(val:number){
        this.mvvm.data.npcNum = val;
    }

    /** npc互动次数*/
    public get npcNum(){
        return this.mvvm.data.npcNum;
    }
    
    /** 声望*/
    public get fame():formatParams{
        return this.mvvm.data.fame;
    }
    /** 声望*/
    public set fame(val:formatParams){
        this.mvvm.data.fame = val;
    }

    /** 主线任务参数*/
    public get levelReward():number{
        return this.mvvm.data.levelReward;
    }
    /** 获取主线任务参数*/
    public set levelReward(val:number){
        this.mvvm.data.levelReward = val;
    }

    public get audio():boolean{
        return this.mvvm.data.audio;
    }
    
    public set audio(val:boolean){
        this.mvvm.data.audio = val;
    }

    /** 通知 */
    public get message():boolean{
        return this.mvvm.data.message;
    }
    /** 通知 */
    public set message(val:boolean){
        this.mvvm.data.message = val;
    }
    
    /** 地图是否正在移动 */
    public get isMoving():boolean{
        return this.mvvm.data.isMoving;
    }
    /** 地图是否正在移动 */
    public set isMoving(val:boolean){
        this.mvvm.data.isMoving = val;
    }
}