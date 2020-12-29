import { Message } from "../../../core/event/MessageManager";
import { ezplugin } from "../../../core/ezplugin/ezplugin";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import main from "../../../Main";
import { service } from "../../../service/Service";
import { TaskType } from "../../CalcUiShow";


export enum AdvMessage {
    /** 播放广告 */
    PLAY = "play",

    /** 广告完成 */
    ADV_SUCCESS = "adv_success",

    /** 广告加载失败 */
    ADV_ERROR = "adv_error"
}

/** 哪种方式触发的广告 */
export enum AdvRewardType {

    /** 闲置状态 */
    NONE = 0,

    /** 离线收益触发的广告 */
    OFFLINE_REWARD = 1,

    /** NPC观看广告获得5倍金币奖励 */
    NPC_7_1 = 2,

    /** NPC观看广告获得5颗钻石 */
    NPC_7_2 = 3,

    /** NPC观看广告获得道具 */
    NPC_9 = 4,

    /** 观看广告卖楼声望翻倍 */
    FAME_MUTI = 5,

    /** 每日任务 */
    DAY_TASK = 6,

    /** 主界面金币X3 */
    MAIN_MUTI = 7,

    /** 礼包界面钻石奖励 */
    GIFT_DIAMOND = 8,

    /** 地标看广告 */
    LANDMARK = 9,

    /**光看广告 获取声望倒计时条件达成 */
    GET_FAME = 10

}

const { ccclass, property } = cc._decorator;

@ccclass
export default class AdvControl extends ComponentExtends {


    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        Message.on(AdvMessage.PLAY, this.onEventHandler, this);

        Message.on(AdvMessage.ADV_SUCCESS, this.onAdvStatusHandler, this);
        Message.on(AdvMessage.ADV_ERROR, this.onAdvStatusHandler, this);
    }

    isPlayAdv: boolean = false;
    onAdvStatusHandler(event: string, params: any) {
        switch (event) {
            case AdvMessage.ADV_SUCCESS: {
                if (!this.isPlayAdv) {
                    break;
                }
                service.prompt.netInstableClose();
                if (params.rewardType) {
                    cc.log(`AdvControl:观看完广告==>${JSON.stringify(params)}`)
                    let _taskList = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
                    main.module.gameProtocol.sendTaskList(_taskList, (obj) => {
                        main.module.vm.taskList = _taskList;
                    })
                    if (main.module.vm.advCount < 5) {
                        let count = main.module.vm.advCount + 1;
                        main.module.gameProtocol.sendAdvCount(count, () => {
                            main.module.vm.advCount = count;
                            this.currentCallback && this.currentCallback(true, this.currentRewardType);
                        });
                    } else {
                        this.currentCallback && this.currentCallback(true, this.currentRewardType);
                    }
                } else {
                    cc.log(`AdvControl:未观看完广告==>${JSON.stringify(params)}`)
                    service.analytics.logEvent("ad_close", "", "")
                    this.currentCallback && this.currentCallback(false, this.currentRewardType);
                }
                this.isPlayAdv = false;
                break;
            }
            case AdvMessage.ADV_ERROR: {
                if (!this.isPlayAdv) {
                    break;
                }
                service.prompt.netInstableClose();
                this.isPlayAdv = false;
                cc.log(`AdvControl:广告加载错误`)
                this.currentRewardType = AdvRewardType.NONE;
                this.currentCallback && this.currentCallback(false, this.currentRewardType);
                break;
            }
        }
    }

    currentRewardType: number = AdvRewardType.NONE;
    currentCallback: Function = null;
    onEventHandler(event: string, args) {
        switch (event) {
            case AdvMessage.PLAY: {
                if (cc.sys.isBrowser) {
                    return;
                }
                if (this.isPlayAdv) {
                    return;
                }
                cc.log(`AdvControl:播放广告`)
                service.prompt.netInstableOpen();
                if (args.callback) {
                    this.currentCallback = args.callback;
                }
                if (args.type) {
                    this.currentRewardType = args.type;
                }
                this.isPlayAdv = true;
                let plugin = ezplugin.get("PluginTopon");
                // if (!plugin) {
                //     plugin = ezplugin.get("PluginAdMob");
                // }
                // let plugin = ezplugin.get("PluginAdMob");
                if (plugin) {
                    plugin.excuteInUIThread("play", "");
                } else {
                    cc.error("不支持该平台！");
                }
                break;
            }
            default: {
            }
        }
    }

    onTouchHandler(event: cc.Event.EventTouch) {
        switch (event.target.name) {
            case "": {
                break;
            }
            default: {
            }
        }
    }

    onDestroy() {
        super.onDestroy();
        this.isPlayAdv = null;
        this.currentRewardType = null;
        this.currentCallback = null;
        Message.removeEventTarget(this)
        this.currentCallback = null;
    }

}
