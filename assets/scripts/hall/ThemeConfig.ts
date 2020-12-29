import { HashMap } from "../core/util/HashMap";

/** 地标配置 */
export interface buildingConfigItem{
    id:number,
    /** 地标名字 */
    name:number,
    /** 可以解锁店铺上限 */
    count:number,
    /** 达到多少可解锁 */
    target:number,
    targetE:number ,
    /** 翻倍 */
    multi:number,
    /** 声望获取npc互动次数 */
    fameCount:number
}


export interface storeLvConfigItem{
    /**等级 */
    level:number,
    /** 价格基数 */
    price:number,
    /** 价格指数 */
    priceE:number,
}

export interface taskConfigItem{
    /**id */
    id:number,
    /** 任务类型 1：每日 2：主线 */
    taskType:number,
    /** 奖励类型 1：钻石 2：道具 */
    rewardType:number,
    /** 奖励值 */
    rewardValue:number,
    /** 目标值 */
    taskTag:number,
}

export interface addConfigItem{//道具配置
    /**id */
    id:number,
    /** 道具类型  */
    addType:number,
    /** 奖励值 */
    addValue:Array<number>,
}

/** 店铺收集速度配置 */
export interface storeSpeedLvConfigItem{
    id:number,
    /** 等级 */
    level:number,
    /** 类别 */
    type:number,
    /** 类别值 */
    value:number
    /** 时间缩减系数 除以 */
    timeDivTotal:number,
    /** 倍数基数 */
    multiTotal:number,
    /** 倍数指数 */
    multiTotalE:number,
    /** 倍数真实值 */
    multiTotalReal:number,
}

/** 声望配置 */
export interface fameLvConfigItem{
    tag:string,
    id:number,
    /** 声望等级 */
    level:number,
    /** 数量基数 */
    price?:number,
    /** 数量级数 */
    priceE?:number,
    type?:number ,
    value?:number,
    levelUp?:number,
    levelUpCostDiv?:number ,
    fameMultiTotal?:number,
    multiTotalReal?:number,
    multiTotal?:number ,
    multiTotalE?:number,
}

/** 店员等级相关配置 */
export interface clerkLevelConfigItem{//只有在最等级时只有clerkTag,clerkId,clerkLevel
    /** 店员Tag */
    clerkTag:string,
    /** 店员id */
    clerkId:number,
    /** 等级 */
    clerkLevel:number,
    /** 价格基数 */
    clerkPrice?:number,
    /** 价格级数 */
    clerkPriceE?:number,
    /** 店员当前作用（奖励）类型 */
    clerkRewardType?:number ,
    /** 这一级的 奖励数值 */
    clerkValue?:number,
    /** 店铺升级减少金钱比例 */
    clerkLevelUpCostDiv?:number,
    /** 声望收益提高的比例 */
    clerkFameMultiTotal?:number
    /**奖励倍率最终值 */
    clerkMultiTotalReal?:number,
    /**奖励倍率基数 */
    clerkMultiTotal?:number,
    /**奖励倍率级数 */
    clerkMultiTotalE?:number,
}

/** 店铺基础配置 */
export class StoreConfigItem{

    id:number = 0;
    tag:string = "";
    /** 店铺名字 */
    name:string = ""
    /** 最大等级 */
    maxLevel:number = 0;
    /** 奖励基数 */
    reward:number = 0;
    /** 奖励时间 */
    timeStamp:number = 0;
    /** 升级金额级数 */
    price:number = 0;
    /** 升级倍率 */
    priceMulti:number = 0.0;

    constructor(tag:string,item:any){
        this.id = parseInt(item.id);
        this.tag = tag;
        this.name = item["name"];
        this.maxLevel = item["maxLevel"];
        this.reward = item["reward"];
        this.timeStamp = item["timeStamp"];
        this.price = item["price"];
        this.priceMulti = item["priceMulti"];
    }
}

export class ThemeConfig {
    private storeMaxLvList:HashMap<number,number> = new HashMap<number,number>();
    private clerkMaxLvList:HashMap<number,number> = new HashMap<number,number>();
    private fameMaxLvList:HashMap<number,number> = new HashMap<number,number>();
    
    private storeList:HashMap<string,StoreConfigItem> = new HashMap<string,StoreConfigItem>();
    
    private storeLvConfig:HashMap<string,HashMap<number,storeLvConfigItem>> = new HashMap<string,HashMap<number,storeLvConfigItem>>();

    private clerkLevelList:HashMap<string,HashMap<number,clerkLevelConfigItem>> = new HashMap<string,HashMap<number,clerkLevelConfigItem>>();

    private fameLvList:HashMap<string,HashMap<number,fameLvConfigItem>> = new HashMap<string,HashMap<number,fameLvConfigItem>>();

    private buildingList:HashMap<number,buildingConfigItem> = new HashMap<number,buildingConfigItem>();

    private storeSpeedLvConfig:HashMap<string,HashMap<number,storeSpeedLvConfigItem>> = new HashMap<string,HashMap<number,storeSpeedLvConfigItem>>();

    private taskConfig:HashMap<string,taskConfigItem> = new HashMap<string,taskConfigItem>();

    private additionConfig:HashMap<string,addConfigItem> = new HashMap<string,addConfigItem>();


    constructor(){
        let storeConfig = cc.loader.getRes("main/json/storeConfig", cc.JsonAsset);
        let clerkLevelConfig = cc.loader.getRes("main/json/clerkLevel", cc.JsonAsset);
        let fameLvConfig = cc.loader.getRes("main/json/fameLevel", cc.JsonAsset);
        let buildingConfig = cc.loader.getRes("main/json/building", cc.JsonAsset);
        let storeSpeedLvConfig = cc.loader.getRes("main/json/storeLevel", cc.JsonAsset);
        let taskConfig = cc.loader.getRes("main/json/task", cc.JsonAsset);
        let additionConfig = cc.loader.getRes("main/json/addition", cc.JsonAsset);
        if (storeConfig.json){
            storeConfig = storeConfig.json;
            clerkLevelConfig = clerkLevelConfig.json;
            fameLvConfig = fameLvConfig.json;
            buildingConfig = buildingConfig.json;
            storeSpeedLvConfig = storeSpeedLvConfig.json;
            taskConfig = taskConfig.json;
            additionConfig = additionConfig.json;
        }
        
        this.fameMaxLvList.clear();
        this.clerkMaxLvList.clear();
        this.storeMaxLvList.clear();
        this.storeList.clear();
        this.storeLvConfig.clear();
        this.clerkLevelList.clear();
        this.fameLvList.clear();
        this.buildingList.clear();
        this.storeSpeedLvConfig.clear();
        this.additionConfig.clear();

        for (let k in buildingConfig["building"]){
            let buildingItem:buildingConfigItem = {
                id:buildingConfig["building"][k]["id"],
                name:buildingConfig["building"][k]["name"],
                count:buildingConfig["building"][k]["count"],
                target:buildingConfig["building"][k]["target"],
                targetE:buildingConfig["building"][k]["targetE"],
                multi:buildingConfig["building"][k]["multi"],
                fameCount:buildingConfig["building"][k]["fameCount"],
            }
            this.buildingList.set(buildingConfig["building"][k]["id"],buildingItem);
        }

        for (let k in storeConfig["store"]){
            this.storeList.set(k,new StoreConfigItem(k,storeConfig["store"][k]));
            this.storeLvConfig.set(k,this.conventStoreData(storeConfig["store"][k]))
            this.storeMaxLvList.set(storeConfig["store"][k]["id"],storeConfig["store"][k]["maxLevel"])
        }
        
        for (let k in clerkLevelConfig["clerk_level"]){
            let info = clerkLevelConfig["clerk_level"][k];
            let oneClerkLvConfig:HashMap<number,clerkLevelConfigItem> = new HashMap<number,clerkLevelConfigItem>();
            for (let lv in info){
                let clertLvItem:clerkLevelConfigItem = {
                    clerkTag:k,
                    clerkId: info[lv]["id"],
                    clerkLevel: info[lv]["level"],
                    clerkPrice: info[lv]["price"],
                    clerkPriceE: info[lv]["priceE"],
                    clerkRewardType: info[lv]["type"] ,
                    clerkValue: info[lv]["value"],
                    clerkLevelUpCostDiv: info[lv]["levelUpCostDiv"],
                    clerkFameMultiTotal: info[lv]["fameMultiTotal"],
                    clerkMultiTotalReal: info[lv]["multiTotalReal"],
                    clerkMultiTotal: info[lv]["multiTotal"],
                    clerkMultiTotalE: info[lv]["multiTotalE"],
                }
                oneClerkLvConfig.set(parseInt(lv),clertLvItem);
            }
            this.clerkLevelList.set(k,oneClerkLvConfig);
            this.clerkMaxLvList.set(parseInt(k.split("_")[1]),info.maxLevel);
        }
        for (let k in fameLvConfig["fame_level"]){
            let info = fameLvConfig["fame_level"][k];
            let oneFameLvConfig:HashMap<number,fameLvConfigItem> = new HashMap<number,fameLvConfigItem>();
            for (let lv in info){
                let fameLvItem:fameLvConfigItem = {
                    tag:k,
                    id: info[lv]["id"],
                    level: info[lv]["level"],
                    price: info[lv]["price"],
                    priceE: info[lv]["priceE"],
                    type: info[lv]["type"] ,
                    value: info[lv]["value"],
                    levelUp: info[lv]["levelUp"],
                    levelUpCostDiv: info[lv]["levelUpCostDiv"],
                    fameMultiTotal: info[lv]["fameMultiTotal"],
                    multiTotalReal: info[lv]["multiTotalReal"],
                    multiTotal: info[lv]["multiTotal"],
                    multiTotalE: info[lv]["multiTotalE"],
                }
                oneFameLvConfig.set(parseInt(lv),fameLvItem);
            }
            this.fameLvList.set(k,oneFameLvConfig);
            this.fameMaxLvList.set(parseInt(k.split("_")[1]),info.maxLevel);
        }
        for (let k in storeSpeedLvConfig["store_level"]){
            let oneInfo = storeSpeedLvConfig["store_level"][k]["data"];
            let map:HashMap<number,storeSpeedLvConfigItem> = new HashMap<number,storeSpeedLvConfigItem>();
            oneInfo.forEach((info) => {
                let storeSpeedLvConfigItem:storeSpeedLvConfigItem = {
                    id:info["id"],
                    level:info["level"],
                    type:info["type"],
                    value:info["value"],
                    timeDivTotal:info["timeDivTotal"],
                    multiTotal:info["multiTotal"],
                    multiTotalE:info["multiTotalE"],
                    multiTotalReal:info["multiTotalReal"]
                }
                map.set(storeSpeedLvConfigItem.level,storeSpeedLvConfigItem)
            });
            this.storeSpeedLvConfig.set(k,map);
        }

        for (let k in taskConfig["task"]){
            let info = taskConfig["task"][k];
            let taskItem:taskConfigItem = {
                id :info["id"],
                taskType :info["type"],
                rewardType :info["rewardType"],
                rewardValue :info["rewardValue"],
                taskTag :info["tag"],
            }
            this.taskConfig.set(k,taskItem);
        }

        
        for (let k in additionConfig["addition"]){
            let config: addConfigItem = {
                id:additionConfig["addition"][k]["id"],
                addType:additionConfig["addition"][k]["type"],
                addValue:additionConfig["addition"][k]["type"]==1 ? [additionConfig["addition"][k]["value"]]:[additionConfig["addition"][k]["value1"],additionConfig["addition"][k]["value2"]],
            }
            this.additionConfig.set(k,config);
        }
        cc.log("【themeConfig】解析完成",this.storeSpeedLvConfig,this.storeList,this.storeLvConfig,
        this.storeMaxLvList,this.clerkMaxLvList,this.fameLvList,this.buildingList,this.clerkLevelList,this.fameLvList,this.taskConfig,this.additionConfig)
    }

     /** 根据id获取地标对应的配置 */
     getBuildingConfigById(id:number):buildingConfigItem{
        if(this.buildingList.get(id)){
            return this.buildingList.get(id);
        }
        return null
    }

    getFameMaxLvById(id:number){
        return this.fameMaxLvList.get(id);
    }

    getClerkMaxLvById(id:number){
        return this.clerkMaxLvList.get(id);
    }

    getStoreMaxLvById(id:number){
        return this.storeMaxLvList.get(id);
    }

    /** 根据tag和等级获取店员对应的配置 */
    getClerkConfigBytagLv(tag:string,lv:number):clerkLevelConfigItem{
        if(this.clerkLevelList.get(tag).get(lv)){
            return this.clerkLevelList.get(tag).get(lv);
        }
        return null
    }

    conventStoreData(storeInfo) {
        let storeLevelConfig:HashMap<number,storeLvConfigItem> = new HashMap<number,storeLvConfigItem>();
        let price = 0;
        let priceE = 0;
        let max = storeInfo.maxLevel + 1;
        for (let level = 1; level < max; level++) {
            if (level === 1) {
                if (storeInfo.id === 1) {
                    price = 0;
                } else {
                    price = storeInfo.price;
                }
            } else {
                price = price * storeInfo.priceMulti;
                if (price === 0) {
                    price = storeInfo.price;
                }
                }
            if (price > 1000) {
                price = price / 1000;
                priceE += 3;
            }
            price = Number(price.toFixed(14));
            storeLevelConfig.set(level,{
                level:level,
                price:price,
                priceE:priceE,
            })
        }
        return storeLevelConfig;
    }

    /**根据tag获取店铺基础信息配置 */
    getStoreBaseConfigByTag( tag:string ){
        if(this.storeList.get(tag)){
            return this.storeList.get(tag);
        }
        return null;
    }

    /** 根据tag获取店铺等级配置 */
    getStoreLvConfigByTag(tag:string,level:number){
        if(this.storeLvConfig.get(tag).get(level)){
            return this.storeLvConfig.get(tag).get(level);
        }
        return null;
    }

    /** 根据tag获取店铺收集速度配置 */
    getStoreSpeedLvConfigByTag(tag:string){
        if(this.storeSpeedLvConfig.get(tag)){
            return this.storeSpeedLvConfig.get(tag);
        }
        return null;
    }

    /** 获取声望配置 */
    getFameConfigByTagLv(tag:string,lv:number){
        if(this.fameLvList.get(tag).get(lv)){
            return this.fameLvList.get(tag).get(lv);
        }
        return null;
    }
    
    /** 获取任务配置 */
    getTaskConfigByTag(tag:string){
        if(this.taskConfig.get(tag)){
            return this.taskConfig.get(tag);
        }
        return null;
    }

    /** 获取道具配置 */
    getPropConfigByTag(tag:string){
        if(this.additionConfig.get(tag)){
            return this.additionConfig.get(tag);
        }
        return null;
    }
    
}