import engine from "../core/Engine";
import { HashMap } from "../core/util/HashMap";
import main from "../Main";
import { CalcTool, formatParams } from "./CalcTool";
import { AccountChangeParams } from "./GameProtocol";
import { ThemeConfig } from "./ThemeConfig";


/** 界面展示计算 */
export class CalcUiShow{

    private themeConfig:ThemeConfig = null;
    private calcTool:CalcTool = null;
 
    
    constructor(config:ThemeConfig,calcTool:CalcTool){
        this.themeConfig = config;
        this.calcTool = calcTool;
        this.nextRefreshDate = this.getSeverCurrentTime() + 1000 * 2;;
        this.nextRefreshStoreListDate = this.getSeverCurrentTime() + 1000 * 2;;
    }

    /** 获取时间段内奖励 以秒为单位 */
    getTimeStageReward(rewardTimes:number){
        let rewardTotalAvg = main.module.gamedata.rewardTotalAvg;
        let reward = this.calcTool.calcMutiNum(rewardTotalAvg, {
            num: rewardTimes,
            numE: 0
        })
        return reward;
    }

    /** 根据扣减或者返奖计算相关余额 */
    nextRefreshDate = null;
    refreshCredit(returnReward:formatParams,callback?:Function,isSync:boolean=false){//isSync 是否同步到服务器
        let vm = main.module.vm;
        let result = this.getCreditInfo(returnReward);
        let complete = ()=>{
            vm.credit = result.credit;
            vm.win = result.win;
            vm.winTotal = result.winTotal;
            vm.refreshCreditUi = vm.credit;
            callback && callback();
        }
        let currentDate = this.getSeverCurrentTime();
        if(currentDate >= this.nextRefreshDate || isSync){
            this.nextRefreshDate = currentDate + 1000 * 2;
            complete();
            main.module.gameProtocol.requestAccountChange(result,(result)=>{
                // let dateStr = result["data"]["accountInfo"]["updateTime"];
            })
        }else{
            complete();
        }
    }

    /** 获取服务器当前时间 */
    getSeverCurrentTime(){
        let serverTimeElasped = engine.timer.serverTimeElasped();
        return new Date().getTime() + serverTimeElasped;
    }

    
    /** 下一次更新店铺列表返奖时间 */
    nextRefreshStoreListDate = null;
    refreshReturnRewardTime(storeList:any,isSync:boolean=false){//isSync 是否同步到服务器
        let vm = main.module.vm;
        let currentDate = this.getSeverCurrentTime();
        if(currentDate >= this.nextRefreshStoreListDate || isSync){
            this.nextRefreshStoreListDate = currentDate + 1000 * 2;
            vm.storeList = storeList;
            main.module.gameProtocol.sendStoreList(storeList,(result)=>{
            })
        }else{
            vm.storeList = storeList;
        }
    }

    getCreditInfo(reward:formatParams){
        let vm = main.module.vm;
        let _credit = this.calcTool.calcAddNum(vm.credit, reward) ;
        let _win = this.calcTool.calcAddNum(vm.win, reward) ;
        let _winTotal = this.calcTool.calcAddNum(vm.winTotal, reward) ;
        if(reward.num < 0 ){
            let _returnReward = {
                num:-reward.num,
                numE:reward.numE
            }
            _credit = this.calcTool.calcMinusNum(vm.credit,_returnReward);
            _win = vm.win;//this.calcTool.calcMinusNum(vm.win,_returnReward);
            _winTotal = vm.winTotal;//this.calcTool.calcMinusNum(vm.winTotal,_returnReward);
        }
        let result:AccountChangeParams = {
            credit:_credit,
            win:_win,
            winTotal:_winTotal
        }
        return result;      
    }

    /** 根据扣减或者返奖计算相关声望余额 */
    refreshFame(returnReward:formatParams,callback?:Function){
        let vm = main.module.vm;
        let result = this.getFameInfo(returnReward);
        let complete = ()=>{
            vm.fame = result.fame;
            callback && callback();
        }
        complete && complete();
        main.module.gameProtocol.requestAccountChange(result,(data)=>{
        })
    }

    /** 声望扣减 */
    getFameInfo(reward:formatParams){
        let vm = main.module.vm;
        let _fame = main.module.calcTool.calcAddNum(vm.fame,reward) ;
        if(reward.num < 0 ){
            let _returnReward = {
                num:-reward.num,
                numE:reward.numE
            }
            _fame = this.calcTool.calcMinusNum(vm.fame,_returnReward);
        }
        let result:AccountChangeParams = {
            fame:_fame,
        }
        return result;      
    }

    /** 过关 清空余额和当前地标收入 level+1 */
    sellStores(callback?:Function){
        let vm = main.module.vm;
        let demoNum = {
            num:0,
            numE:0
        }
        let accountInfo:AccountChangeParams = {}
        accountInfo.credit = demoNum;
        accountInfo.win = demoNum;
        accountInfo.winTotal = vm.winTotal;
        accountInfo.level = vm.level+1;
        let complete = ()=>{
            vm.credit = accountInfo.credit;
            vm.win = accountInfo.win;
            vm.winTotal = accountInfo.winTotal;
            vm.refreshCreditUi = vm.credit;
            callback && callback();
        }
        complete && complete();
        main.module.gameProtocol.requestAccountChange(accountInfo,(data)=>{
        })
    }
  
    /** 根据等级计算到目标等级需要的金额 */
    calcTargetPrice(storeTag:string,currentStoreLv:number,upTargetLv:number):formatParams{
        let addition = 1;
        if(main.module.vm.clerkList){//店员扣减
            let id = parseInt( storeTag.split("_")[1] );
            let clerkTag = `clerk_${id}`;
            let clerkLv = main.module.vm.clerkList[clerkTag]["level"];
            let clerkConfig = this.themeConfig.getClerkConfigBytagLv(clerkTag,clerkLv);
            let selfAddClerk = 1;
            if(clerkConfig){
                selfAddClerk = clerkConfig.clerkLevelUpCostDiv;
            }
            addition *= selfAddClerk;
            
        }
        if(main.module.vm.fameList){//声望扣减
            let id = parseInt( storeTag.split("_")[1] );
            let fameTag = `fame_${id}`;
            let fameLv = main.module.vm.fameList[fameTag]["level"];
            let fameConfig = this.themeConfig.getFameConfigByTagLv(fameTag,fameLv);
            let selfAddFame = 1;
            if(fameConfig){
                selfAddFame = fameConfig.levelUpCostDiv;
            }
            addition *= selfAddFame;
        }

        let price = {num:0,numE:0}
        for(let i=1;i<=upTargetLv;i++){
            let config = this.themeConfig.getStoreLvConfigByTag(storeTag,currentStoreLv+i)
            if(!config){
                break;
            }
            price = this.calcTool.calcAddNum(price,{num:config.price,numE:config.priceE},false)
        }
        if( addition < 1){
            // cc.log(`【计算升级需要的钱】：店铺${storeTag.split("_")[1]}-->店员等级${clerkLv},店铺升级消耗减少${Addition}`)
        }

        let propCostAdd = main.module.gameMainControl.propCostAdd;//升级消耗扣减加成
        return this.calcTool.calcMutiNum(price,{num:addition*propCostAdd,numE:0});
    }


    /** 计算收集速度 mutiAdd:道具翻倍加成*/
    calcCollectSpeed(mutiAdd:number=1){
        let storeListData = main.module.vm.storeList;
        let clerkListData = main.module.vm.clerkList;
        let fameListData = main.module.vm.fameList;

        let storeBaseRewardList:HashMap<string,HashMap<string,number | formatParams>> = new HashMap<string,HashMap<string,number | formatParams>>();
        for(let tag in storeListData){//店铺基础速度 基础奖励 * 店铺等级 * 店铺等级加成（到达里程碑等级包括时间缩减和翻倍）
            let map:HashMap<string, number | formatParams> = new HashMap<string, number | formatParams>();
            let storeBaseConfig = this.themeConfig.getStoreBaseConfigByTag(tag);
            let reward = storeBaseConfig.reward;//奖励基数
            let baseTimeStamp = storeBaseConfig.timeStamp;
            let currentStoreLv = storeListData[tag]["level"];
            let speedLvConfig = this.themeConfig.getStoreSpeedLvConfigByTag(tag);
            let keys = speedLvConfig.keys();
            let levelGear = 0;
            for(let i=0;i<keys.length;i++){
                if(currentStoreLv<keys[i]){
                    if(i != 0){
                        levelGear = keys[i-1]
                    }
                    break;
                }
            }
            if(currentStoreLv>=this.themeConfig.getStoreMaxLvById(speedLvConfig.get(keys[0]).id)){
                levelGear = keys[keys.length-1];
            }
            let baseReward = {
                num:reward * currentStoreLv,
                numE:0
            };
            if(levelGear != 0){
                baseReward = this.calcTool.calcConvertNum(baseReward.num,baseReward.numE);
                let otherAdd = this.themeConfig.getStoreSpeedLvConfigByTag(tag).get(levelGear);
                let speedReward = this.calcTool.calcMutiNum(baseReward,{num:otherAdd.multiTotal,numE:otherAdd.multiTotalE})
                let timeStamp = baseTimeStamp / otherAdd.timeDivTotal;
                map.set("reward",speedReward);
                map.set("timeStamp",timeStamp);
            }else{
                map.set("reward",baseReward);
                map.set("timeStamp",baseTimeStamp);
            }
            if(currentStoreLv == 0){
                baseReward = {
                    num:0,
                    numE:0
                }
                map.set("reward",baseReward);
                map.set("timeStamp",0);
            }
            storeBaseRewardList.set(tag,map);
        }

        let clerkAddList:HashMap<string,formatParams> = new HashMap<string,formatParams>();//店员加成 翻倍参数
        if(clerkListData){
            for(let tag in clerkListData){//店员对收集速度的加成
                let clerkLvConfig = this.themeConfig.getClerkConfigBytagLv(tag,clerkListData[tag]["level"]);
                if(clerkLvConfig){
                    let add:formatParams = {
                        num:clerkLvConfig.clerkMultiTotal,
                        numE:clerkLvConfig.clerkMultiTotalE
                    }
                    clerkAddList.set(tag,add);
                }else{
                    clerkAddList.set(tag,{
                        num:1,
                        numE:0
                    });
                }
            }
        }

        let fameAddList:HashMap<string,formatParams> = new HashMap<string,formatParams>();//声望加成 翻倍参数
        if(fameListData){
            for(let tag in fameListData){//声望对收集速度的加成
                let fameLvConfig = this.themeConfig.getFameConfigByTagLv(tag,fameListData[tag]["level"]);
                if(fameLvConfig){
                    let add:formatParams = {
                        num:fameLvConfig.multiTotal,
                        numE:fameLvConfig.multiTotalE
                    }
                    fameAddList.set(tag,add);
                }else{
                    fameAddList.set(tag,{
                        num:1,
                        numE:0
                    });
                }            
            }
        }
        
        let clerkAddKeys = clerkAddList.keys();
        clerkAddKeys.forEach((clerkAddKey)=>{//店员加成 翻倍计算
            let id =  parseInt( clerkAddKey.split("_")[1] ) ;
            if(id < 11){
                let reward = this.calcTool.calcMutiNum(storeBaseRewardList.get(`store_${id}`).get("reward") as formatParams,clerkAddList.get(clerkAddKey));
                storeBaseRewardList.get(`store_${id}`).set("reward",reward);
            }else{
                let keys = storeBaseRewardList.keys();//店员12对所有店铺的加成
                keys.forEach((key)=>{
                    let reward = this.calcTool.calcMutiNum(storeBaseRewardList.get(key).get("reward") as formatParams,clerkAddList.get(clerkAddKey))
                    storeBaseRewardList.get(key).set("reward",reward);
                })
            }
        })

        let fameAddKeys = fameAddList.keys();
        fameAddKeys.forEach((fameAddKey)=>{//声望加成 翻倍计算
            let id =  parseInt( fameAddKey.split("_")[1] ) ;
            if(id < 11){
                let reward = this.calcTool.calcMutiNum(storeBaseRewardList.get(`store_${id}`).get("reward") as formatParams,fameAddList.get(fameAddKey));
                storeBaseRewardList.get(`store_${id}`).set("reward",reward);
            }else{
                let keys = storeBaseRewardList.keys();//声望11对所有店铺的加成
                keys.forEach((key)=>{
                    let reward = this.calcTool.calcMutiNum(storeBaseRewardList.get(key).get("reward") as formatParams,fameAddList.get(fameAddKey))
                    storeBaseRewardList.get(key).set("reward",reward);
                })
            }
        })

        let values = main.module.gamedata.storesIdLv.values();//store_11(店铺里程碑)的加成 翻倍和时间缩减
        this.sort(values);
        let config = this.themeConfig.getStoreSpeedLvConfigByTag("store_11");
        let configKeys = config.keys();
        let muti = {
            num:1,
            numE:0
        };
        let divTime = 1;
        let idx = 0;
        for(let i=0;i<configKeys.length;i++){
            if(values[0] < configKeys[i]){
                if(i>0){
                    let result = config.get(configKeys[i-1])  
                    muti = {
                        num:result.multiTotal,
                        numE:result.multiTotalE
                    }
                    divTime = result.timeDivTotal;
                }
                break;
            }else{
                idx = i;
            }
        }
        if(idx===configKeys.length-1){
            let result = config.get(configKeys[configKeys.length-1])  
            divTime = result.timeDivTotal;
        }
        
        let finalKeys = storeBaseRewardList.keys();
        let rewardAdd = main.module.calcTool.calcAddNum(this.rewardAdd(),{num:1,numE:0},false);;//收益加成
        let foreverMuti:formatParams = {
            num:1,
            numE:0
        } 
        if(main.module.vm.goodsInfo){
            foreverMuti = {
                num:main.module.vm.goodsInfo["multiTotal"],
                numE:main.module.vm.goodsInfo["multiTotalE"]
            } 
        }
       
        finalKeys.forEach((key)=>{
            let reward = this.calcTool.calcMutiNum(storeBaseRewardList.get(key).get("reward") as formatParams,muti)//里程碑翻倍
            let fameReward = this.calcTool.calcMutiNum(reward,rewardAdd)//收益加成
            let finalReward = this.calcTool.calcMutiNum(fameReward,foreverMuti)//收益永久加成
            let timeStamp = (storeBaseRewardList.get(key).get("timeStamp") as number)/divTime;//里程碑时间缩减
            storeBaseRewardList.get(key).set("reward",finalReward);
            storeBaseRewardList.get(key).set("timeStamp",timeStamp);
        })

        storeBaseRewardList.keys().forEach((key)=>{
            let reward = storeBaseRewardList.get(key).get("reward")as formatParams;
            reward = this.calcTool.calcMutiNum(reward,{
                num:mutiAdd,
                numE:0
            }) as formatParams;
            storeBaseRewardList.get(key).set("reward",reward);
        })
        if(mutiAdd!=1){
            cc.log(`速度计算:道具提升速度${mutiAdd}倍`);
        }

        let str = "";
        let strAvg = "";
        storeBaseRewardList.keys().forEach((key)=>{
            let reward = storeBaseRewardList.get(key).get("reward")as formatParams;
            let result = this.calcTool.formatNum(reward)
            let timeStamp = storeBaseRewardList.get(key).get("timeStamp") as number;
            if(timeStamp<100 && timeStamp!=0){
                let rewardAvg = this.calcTool.calcMutiNum(reward,{
                    num:1000/timeStamp,
                    numE:0
                }) as formatParams;
                storeBaseRewardList.get(key).set("rewardAvg",rewardAvg)
                let resultAvg = this.calcTool.formatNum(rewardAvg)
                strAvg += `${key} =>${resultAvg.base}${resultAvg.gear}/s\n`;
            }
            str += `${key} =>${result.base}${result.gear}/${timeStamp}\n`
        })
        cc.log("【所有店铺收集速度】"+str,"timeStamp<100的收集速度"+strAvg);
        

        
        //---计算总收入的平均速度（所有）
        let avgSpeed:HashMap<string,number | formatParams> = new HashMap<string,number | formatParams>();
        let avgKeys = storeBaseRewardList.keys();
        let rewardTotal = {
            num:0,
            numE:0
        }
        avgKeys.forEach((key)=>{
            let store = storeBaseRewardList.get(key);
            let storeSpeed= (store.get("reward") as formatParams);
            let timeStamp = store.get("timeStamp") as number
            let finalSpeed = {
                num:0,
                numE:0
            }
            let id = parseInt( key.split("_")[1] ) 
            let clerkLv = 0
            if(main.module.vm.clerkList){
                clerkLv = main.module.vm.clerkList[`clerk_${id}`]["level"];
            }
            if(timeStamp == 0 || clerkLv == 0){
                finalSpeed = {
                    num:0,
                    numE:0
                };
            }else{
                finalSpeed = {
                    num:storeSpeed.num * 1000/(store.get("timeStamp") as number),
                    numE:storeSpeed.numE
                };
            }
            rewardTotal = this.calcTool.calcAddNum(rewardTotal,finalSpeed,false);
        })
        avgSpeed.set("reward",rewardTotal);
        avgSpeed.set("timeStamp",1000);
        main.module.gamedata.rewardTotalAvg = avgSpeed.get("reward") as formatParams;
        let result = this.calcTool.formatNum(avgSpeed.get("reward") as formatParams)
        cc.log(`【平均收集速度 =>${result.base}${result.gear}/每秒】` );
        main.module.gamedata.storeBaseRewardList = storeBaseRewardList;
        return storeBaseRewardList;
    }

    /** 计算加上可升等级级后的收集速度*/
    calcCollectSpeedSupport(storeList,storeId:number){
        let multi = main.module.gameMainControl.mainAdMuti * (main.module.themeConfig.getBuildingConfigById(main.module.vm.level).multi);
        let mutiAdd = main.module.gameMainControl.propMutiAdd * multi;
        let storeListData = storeList;
        let clerkListData = main.module.vm.clerkList;
        let fameListData = main.module.vm.fameList;

        let storeReward:HashMap<string,number | formatParams> = new HashMap<string,number | formatParams>();
        let tag = `store_${storeId}`;
        let storeBaseConfig = this.themeConfig.getStoreBaseConfigByTag(tag);
        let reward = storeBaseConfig.reward;//奖励基数
        let baseTimeStamp = storeBaseConfig.timeStamp;
        let currentStoreLv = storeListData[tag]["level"];
        let speedLvConfig = this.themeConfig.getStoreSpeedLvConfigByTag(tag);
        let levelGear = 0;
        let keys = speedLvConfig.keys();
        for(let i=0;i<keys.length;i++){
            if(currentStoreLv<keys[i]){
                if(i != 0){
                    levelGear = keys[i-1]
                }
                break;
            }
        }
        if(currentStoreLv>=this.themeConfig.getStoreMaxLvById(speedLvConfig.get(keys[0]).id)){
            levelGear = keys[keys.length-1];
        }
        let baseReward = {
            num:reward * currentStoreLv,
            numE:0
        };
        if(levelGear != 0){
            baseReward = this.calcTool.calcConvertNum(baseReward.num,baseReward.numE);
            let otherAdd = this.themeConfig.getStoreSpeedLvConfigByTag(tag).get(levelGear);
            let speedReward = this.calcTool.calcMutiNum(baseReward,{num:otherAdd.multiTotal,numE:otherAdd.multiTotalE})
            let timeStamp = baseTimeStamp / otherAdd.timeDivTotal;
            storeReward.set("reward",speedReward);
            storeReward.set("timeStamp",timeStamp);
        }else{
            storeReward.set("reward",baseReward);
            storeReward.set("timeStamp",baseTimeStamp);
        }
        if(currentStoreLv == 0){
            baseReward = {
                num:0,
                numE:0
            }
            storeReward.set("reward",baseReward);
            storeReward.set("timeStamp",0);
        }

        let clerkAddList:HashMap<string,formatParams> = new HashMap<string,formatParams>();//店员加成 翻倍参数
        if(clerkListData){
            for(let tag in clerkListData){//店员对收集速度的加成
                let clerkLvConfig = this.themeConfig.getClerkConfigBytagLv(tag,clerkListData[tag]["level"]);
                if(clerkLvConfig){
                    let add:formatParams = {
                        num:clerkLvConfig.clerkMultiTotal,
                        numE:clerkLvConfig.clerkMultiTotalE
                    }
                    clerkAddList.set(tag,add);
                }else{
                    clerkAddList.set(tag,{
                        num:1,
                        numE:0
                    });
                }
            }
        }

        let fameAddList:HashMap<string,formatParams> = new HashMap<string,formatParams>();//声望加成 翻倍参数
        if(fameListData){
            for(let tag in fameListData){//声望对收集速度的加成
                let fameLvConfig = this.themeConfig.getFameConfigByTagLv(tag,fameListData[tag]["level"]);
                if(fameLvConfig){
                    let add:formatParams = {
                        num:fameLvConfig.multiTotal,
                        numE:fameLvConfig.multiTotalE
                    }
                    fameAddList.set(tag,add);
                }else{
                    fameAddList.set(tag,{
                        num:1,
                        numE:0
                    });
                }            
            }
        }
        
        let clerkAddKeys = clerkAddList.keys();
        clerkAddKeys.forEach((clerkAddKey)=>{//店员加成 翻倍计算
            let id =  parseInt( clerkAddKey.split("_")[1] ) ;
            if(id == 11 || id == storeId || id == 12){
                let rewardClerk = this.calcTool.calcMutiNum(storeReward.get("reward") as formatParams,clerkAddList.get(clerkAddKey));
                storeReward.set("reward",rewardClerk);
            }
        })

        let fameAddKeys = fameAddList.keys();
        fameAddKeys.forEach((fameAddKey)=>{//声望加成 翻倍计算
            let id =  parseInt( fameAddKey.split("_")[1] ) ;
            if(id == 11 || id == storeId){
                let rewardFame = this.calcTool.calcMutiNum(storeReward.get("reward") as formatParams,fameAddList.get(fameAddKey));
                storeReward.set("reward",rewardFame);
            }
        })

        let values = main.module.gamedata.storesIdLv.values();//store_11(店铺里程碑)的加成 翻倍和时间缩减
        this.sort(values);
        let config = this.themeConfig.getStoreSpeedLvConfigByTag("store_11");
        let configKeys = config.keys();
        let muti = {
            num:1,
            numE:0
        };
        let divTime = 1;
        let idx = 0;
        for(let i=0;i<configKeys.length;i++){
            if(values[0] < configKeys[i]){
                if(i>0){
                    let result = config.get(configKeys[i-1])  
                    muti = {
                        num:result.multiTotal,
                        numE:result.multiTotalE
                    }
                    divTime = result.timeDivTotal;
                }
                break;
            }else{
                idx = i;
            }
        }
        if(idx===configKeys.length-1){
            let result = config.get(configKeys[configKeys.length-1])  
            divTime = result.timeDivTotal;
        }
        
        let rewardAdd = main.module.calcTool.calcAddNum(this.rewardAdd(),{num:1,numE:0},false);;//收益加成
        let foreverMuti:formatParams = {
            num:1,
            numE:0
        } 
        if(main.module.vm.goodsInfo){
            foreverMuti = {
                num:main.module.vm.goodsInfo["multiTotal"],
                numE:main.module.vm.goodsInfo["multiTotalE"]
            } 
        }
        
        let rewardResult = this.calcTool.calcMutiNum(storeReward.get("reward") as formatParams,muti)//里程碑翻倍
        let fameReward = this.calcTool.calcMutiNum(rewardResult,rewardAdd)//收益加成
        let finalReward = this.calcTool.calcMutiNum(fameReward,foreverMuti)//收益永久加成
        let timeStamp = (storeReward.get("timeStamp") as number)/divTime;//里程碑时间缩减
        storeReward.set("reward",finalReward);
        storeReward.set("timeStamp",timeStamp);

        let rewardProp = storeReward.get("reward")as formatParams;
        rewardProp = this.calcTool.calcMutiNum(rewardProp,{
            num:mutiAdd,
            numE:0
        }) as formatParams;
        storeReward.set("reward",rewardProp);
        if(mutiAdd!=1){
            cc.log(`速度计算:道具提升速度${mutiAdd}倍`);
        }

        let str = "";
        let strAvg = "";
        let _reward = storeReward.get("reward")as formatParams;
        let _result = this.calcTool.formatNum(_reward)
        let _timeStamp = storeReward.get("timeStamp") as number;
        if(_timeStamp<100 && _timeStamp!=0){
            let rewardAvg = this.calcTool.calcMutiNum(_reward,{
                num:1000/_timeStamp,
                numE:0
            }) as formatParams;
            storeReward.set("rewardAvg",rewardAvg)
            let resultAvg = this.calcTool.formatNum(rewardAvg)
            strAvg += `=>${resultAvg.base}${resultAvg.gear}/s\n`;
        }
        str = `=>${_result.base}${_result.gear}/${_timeStamp}\n`
        cc.log(`【模拟store${storeId}店铺收集速度】`+str,"timeStamp<100的收集速度"+strAvg);
        return storeReward;
    }
    
    /**收益速度加成 收益速度加成= 当前声望*（基础收益红利+店员收益红利加成+声望收益红利加成）跟买楼界面需要区分开 */
    rewardAdd(getFame:formatParams={num:0,numE:0}){
        if(main.module.vm.clerkList && main.module.vm.fameList && (main.module.vm.fame.num > 0 || getFame.num>0)){
            return this.calcTool.calcMutiNum(main.module.calcTool.calcAddNum(main.module.vm.fame,getFame,false),{
                num:this.oneFameAdd(),
                numE:0
            })
        }
        return {
            num:0,
            numE:0
        }
    }

    /** 每个声望红利 =（基础收益红利+店员收益红利加成+声望收益红利加成） */
    oneFameAdd(){
        let base = 0.02;
        let clerkLevel = main.module.vm.clerkList["clerk_12"]["level"] || 0;
        let clerkAdd = 0;
        let maxClerkLevel = this.themeConfig.getClerkMaxLvById(12);
        if(clerkLevel > 0 && clerkLevel<=maxClerkLevel){
            let clerkConfig = this.themeConfig.getClerkConfigBytagLv("clerk_12",clerkLevel);
            clerkAdd = clerkConfig.clerkFameMultiTotal;
        }
        let fameLevel = main.module.vm.fameList["fame_11"]["level"] || 0;
        let fameAdd = 0;
        let maxFameLevel = this.themeConfig.getFameMaxLvById(11);
        if(fameLevel > 0 && fameLevel<=maxFameLevel){
            let fameConfig = this.themeConfig.getFameConfigByTagLv("fame_11",fameLevel);
            fameAdd = fameConfig.fameMultiTotal;
        }
        let allAdd = base + clerkAdd + fameAdd;
        return allAdd;
    }

    checkLockStoreIdByLevel(){
        let level = main.module.vm.level;
        let maxId = 4;
        switch (level) {
            case 1:
                maxId =4;
                break;
            case 2:
                maxId =5;
                break;
            case 3:
                maxId =7;
                break;
            case 4:
                maxId =9;
                break;
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
                maxId =10;
                break;
        }
        return maxId;
    }

    /** 
     * 计算当前可获得声望 = 当前阶段总收益/（5000000000000*（1+当前收益加成））
     * 基础收益红利是2%
     * 收益加成= 当前声望*（基础收益红利+店员收益红利加成+声望收益红利加成）
     * fameMultiTotal =  店员收益红利加成 + 声望收益红利加成
     * */
    calcCurrentCanGetFame(){
        let add = this.calcTool.calcAddNum( 
                {num:1,numE:0},
                this.rewardAdd() );
        let base = this.calcTool.calcMutiNum( 
                {num:5,numE:12},
                add );
        let result = this.calcTool.calcDivideNum  ( 
                main.module.vm.win,
                base );
       
        if(result.numE<0){// || result.num == 0
            result = {num:0,numE:0};
        }else{
            let fomat = main.module.calcTool.formatNum(result);
            if(fomat.gear == "" ){
                result = {num:Math.floor( result.num * Math.pow(10,result.numE) ),numE:0};
            }else{
                result = result;
            }
        }
        return main.module.calcTool.calcAddNum({num:1,numE:2},result);
    }

    /** 验证最大余额是否可以过关 */
    calcPassBarrier(){
        let level = main.module.vm.level;
        let config = main.module.themeConfig.getBuildingConfigById(level);
        let bool = main.module.calcTool.compare(main.module.vm.credit,{num:config.target,numE:config.targetE});
        main.module.vm.isPass = bool?1:0;
        if(bool && main.module.vm.isPass==0){
            main.module.gameProtocol.writeCacheData("isPass", main.module.vm.isPass as Object, (data) => {
            })
        }
    }

    /**计算达成几次店铺挑战（里程碑） */
    calcPostNum(storeId:number,upLv:number){
        let cofig = main.module.themeConfig.getStoreSpeedLvConfigByTag(`store_${storeId}`);
        let currentStoreLv = main.module.vm.storeList[`store_${storeId}`]["level"];
        let values = cofig.values();
        let prePostIndex = 0;//下一个里程碑的下标
        for(let i=0;i<values.length;i++){
            if(currentStoreLv < values[i].level){
                prePostIndex = i;
                break;
            }
        }
        let count = 0;
        for(let i=prePostIndex;i<values.length;i++){
            if(currentStoreLv + upLv >= values[i].level){
                count++;
            }else{
                break;
            }
        }
        return count + this.calcPostNumStore11(storeId,currentStoreLv + upLv);
    }

    calcPostNumStore11(storeId,realLv:number){
        let storesIdLvValues1 = main.module.gamedata.storesIdLv.values();
        main.module.calcTool.sort(storesIdLvValues1);//取所有店铺的最小等级作为store_11的等级 升级之前
        let store_11_lv1 = storesIdLvValues1[0];

        let storesIdLv:HashMap<number,number> = new HashMap<number,number>();
        main.module.gamedata.storesIdLv.keys().forEach((key)=>{
            storesIdLv.set(key,main.module.gamedata.storesIdLv.get(key));
        })
        storesIdLv.set(storeId,realLv);
        let storesIdLvValues2 = storesIdLv.values();;
        main.module.calcTool.sort(storesIdLvValues2);//取所有店铺的最小等级作为store_11的等级 升级之后
        let store_11_lv2= storesIdLvValues2[0];
        
        let config11 = main.module.themeConfig.getStoreSpeedLvConfigByTag("store_11");
        let values11 = config11.values();
        let prePostIndex11 = -1;//下一个里程碑的下标  store11
        for(let i=0;i<values11.length;i++){
            if(store_11_lv1 < values11[i].level){
                prePostIndex11 = i;
                break;
            }
        }
        let postIndex11 = -1;//当前需要展示的里程碑下标   store11
        let count = 0;
        if(prePostIndex11 == -1){
            return count;
        }
        for(let i=prePostIndex11;i<values11.length;i++){
            if(store_11_lv2 >= values11[i].level){
                count++;
                postIndex11 = i;
            }else{
                break;
            }
        }
        return count;
    }

    /** 检查每日任务列表是否有变化 */
    checkTaskListChange(preList, currentList) {
        if (!preList) {
            return true;
        }
        for (let key in preList) {
            if(key == "endTime" || key == "dateKey"){
                continue;
            }
            if (preList[key]["taskValue"] != currentList[key]["taskValue"] || preList[key]["status"] != currentList[key]["status"]) {
                return true;
            }
        }
        return false;
    }

    /** 根据任务类别和累计次数，更改任务列表 */
    changeTaskListByTypeCount(type:number,count:number){
        let taskList = main.module.vm.taskList;
        if (main.module.vm.noviceProgress.novice_7 == 0 && main.module.vm.level == 1) {
            return taskList;
        }
        let ids = this.getTaskIds(type);
        let index = 0;
        let resultList:Object = {};
        for(let key in taskList){
            let info = taskList[key];
            if(key!="dateKey" && key!="endTime"){
                let id = key.split("_")[1];
                if(index< 4 && info["status"] != 3 && ids.indexOf(id) != -1){
                    resultList[key] = {
                        id:info["id"],
                        taskType:info["taskType"],
                        status:info["taskValue"]+count >=info["taskTag"] ? 2:0,
                        taskTag:info["taskTag"],
                        taskValue:info["taskValue"]+count >= info["taskTag"] ? info["taskTag"]:info["taskValue"]+count
                    }
                }else{
                    resultList[key] = info;
                }
                if(info["status"] != 3){
                    index++
                }
            }else{
                resultList[key]= info;
            }
        }
        return resultList;
    }

    getTaskIds(type:number){
        let ids:Array<string> = [];
        switch (type) {
            case TaskType.STORE_UP:
                ids = ["1","2","3"];
                break;
            case TaskType.STORE_CHALLENGE:
                ids = ["4","5"];
                break;    
            case TaskType.OFF_LINE:
                ids = ["6","7"];
                break;     
            case TaskType.LUCKY_reward:
                ids = ["8","9"];
                break;  
            case TaskType.SELL_STORES:
                ids = ["10"];
                break;  
            case TaskType.CLERK_UP:
                ids = ["11","12","13"];
                break;  
            case TaskType.WATCH_AD:
                ids = ["8","9","14","15"];
                break;    
            case TaskType.FAME_UP:
                ids = ["16","17","18"];
                break;       
            case TaskType.USE_PROP:
                ids = ["19","20"];
                break;                   
            default:
                break;
        }
        return ids;
    }
    
    sort(values){
        values.sort((a: number, b: number) => {
            if (a<b) {
                return -1;
            }
            if (a>b) {
                return 1;
            }
            return 0;
        });
    }

    /**显示时间字符串 00:00:00 */
    public formatTime(ms,isHour:boolean=true) {  
        if(ms<=0){
            return `${isHour?"00:":""}00:00`;  
        }
	    let ss = 1000;  
	    let mi = ss * 60;  
	    let hh = mi * 60;  
	    let dd = hh * 24;  
	  
        let hour = Math.floor( ms / hh );  
        let _hour = "";
        if(hour<10){
            _hour = "0";
        }
        let minute = Math.floor( (ms - hour * hh) / mi );  
        let _minute = "";
        if(minute<10){
            _minute = "0";
        }
        let second = Math.floor( (ms - hour * hh - minute * mi) / ss );  
        let _second = "";
        if(second<10){
            _second = "0";
        }
	    return `${isHour?`${_hour}${hour}:`:""}${_minute}${minute}:${_second}${second}`;  
    }  
}

export enum TaskType {
    /** 店铺升级 */
    STORE_UP = 1,
    /** 店铺挑战 */
    STORE_CHALLENGE = 2,
    /** 离线 */
    OFF_LINE = 3,
    /** 幸运收益 */
    LUCKY_reward = 4,
    /** 卖楼 */
    SELL_STORES = 5,
    /** 店员升级 */
    CLERK_UP = 6,
    /** 观看广告 */
    WATCH_AD = 7,
    /** 声望升级 */
    FAME_UP = 8,
    /** 使用道具 */
    USE_PROP = 9,

}