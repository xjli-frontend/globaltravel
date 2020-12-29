import { HashMap } from "../core/util/HashMap";
import { formatParams } from "./CalcTool";

/** 邮件实体类 */
export interface messageInfo{
    /**邮件ID */
    messageId:number,
    /** 消息类型 */
    messageType:number,
    /** 消息状态 */
    messageStatus:number,
    /** 消息标题 */
    messageTitle:string,
    /** 消息内容 */
    messageContent:string,
    /** 附件 */
    attachment:string,
    /** 发送者 */
    sender:string,
    /** 发送时间 */
    sendTime:number,
    /** 阅读时间 */
    readTime:number
}

/** npc配置 */
export interface npcConfig{
    /**ID */
    id:number,
    /** 奖励时间 */
    timeSpan:number,
    /** 奖励数据 */
    rewardData:Array<any>,
}

export class GameData{

    /**当前店铺的等级 key:id,value:lv 店铺id，等级 用于判断店员是否解锁*/
    storesIdLv:HashMap<number,number> = new HashMap<number,number>();

    /***当前店员的等级 key:id,value:lv 店员id，等级 */
    clerksIdLv:HashMap<number,number> = new HashMap<number,number>();

    /***当前声望的等级 key:id,value:lv 声望id，等级 */
    fameIdLv:HashMap<number,number> = new HashMap<number,number>();

    collectSpeedData:HashMap<string,HashMap<string,number | formatParams>> = new HashMap<string,HashMap<string,number | formatParams>>();

    rewardTotalAvg:formatParams = null;

    storeBaseRewardList:HashMap<string,HashMap<string,number | formatParams>> = new HashMap<string,HashMap<string,number | formatParams>>();

    updateTime:number = 0;

    headId:number = null;

    nickName:string = "";

    /** 城市ID */
    public cityId:number = 0;

    /** 声望 */
    public fame:number = 0;

    public npcConfig:HashMap<string,npcConfig> = new HashMap<string,npcConfig>();

    /**npc返奖时间信息 */
    public npcData:any = null;
    
    /**npc返奖时间信息 */
    public newPropId:Array<number> = [];

    /** 主界面广告翻倍时间戳 */
    mainMutiEndTime:number = 0;

    /** 可以获得声望的时间 */
    getFameTime:number = 0;

    /** 获取声望界面与npc交互了几次 */
    fameNpcNum:number = 0;
    
    constructor(){
    }
}

