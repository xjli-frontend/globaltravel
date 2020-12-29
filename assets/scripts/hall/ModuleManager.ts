import engine from "../core/Engine";
import { Message } from "../core/event/MessageManager";
import { ezplugin } from "../core/ezplugin/ezplugin";
import { PopViewParams } from "../core/gui/Defines";
import { gui } from "../core/gui/GUI";
import ButtonEffect from '../core/ui/button/ButtonEffect';
import { AsyncQueue, NextFunction } from '../core/util/AsyncQueue';
import { AccountEvent } from "../service/account/Account";
import { service } from "../service/Service";
import { AudioMessage } from "./AudioMessage";
import { CalcTool, formatParams } from './CalcTool';
import { CalcUiShow } from "./CalcUiShow";
import { AdvMessage } from "./game/adv/AdvControl";
import GameMainControl from "./game/GameMainControl";
import MainScene from "./game/MainScene";
import NoviceHandle from "./game/novice/NoviceHandle";
import { GameAudio } from "./GameAudio";
import { GameData } from './GameData';
import { GameProtocol } from './GameProtocol';
import GameViewModel from './GameViewModel';
import { MapNpcController } from "./MapNpcController";
import { Pay } from "./Pay";
import { ThemeConfig } from './ThemeConfig';

export class ModuleManager {

    /** 业务协议类 */
    gameProtocol: GameProtocol = null;

    /** 游戏数据管理 */
    gamedata: GameData = new GameData();

    mainScene: MainScene = null;

    gameMainControl: GameMainControl = null;

    mapNpcController: MapNpcController = null;

    //-------------------------------------------------------
    themeConfig: ThemeConfig = null;

    calcTool: CalcTool = null;

    calcUiShow: CalcUiShow = null;

    /** 新手引导 */
    noviceHandle: NoviceHandle = null;

    audio: GameAudio = null;

    pay: Pay = new Pay();

    vm: GameViewModel = null;

    needShowLevelUp = false;

    constructor() {
        this.vm = new GameViewModel(
            {
                cityId: 1,
                level: 1,
                levelReward: 1,
                diamond: 0,
                refreshCreditUi: null,
                storeList: null,
                clerkList: null,
                fameList: null,
                goodsList: null,
                rankingList: null,
                goodsInfo: null,
                taskList: null,
                propList: null,
                propStorageList: null,
                noviceProgress: null,
                mainProgress: null,
                credit: null,
                win: null,
                winTotal: null,
                fame: null,
                lang: engine.i18n.currentLanguage,
                gear: null,
                message: true,
                advCount: 0,
                sellNum: 0,
                npcNum: 0,
                isMoving: false,
                isPass:0
            }
        )
        ButtonEffect.default.touchStartCallback = (btn: ButtonEffect) => {
            let name = btn.node.name;
            if (name != "btn_unlock" && name != "btn_uplv") {
                Message.dispatchEvent(AudioMessage.EFFECT, "ui_2")
            }
        }


        // 监听Admob广告事件
        let plugin = ezplugin.get("PluginTopon");
        // if (!plugin) {
        //     plugin = ezplugin.get("PluginAdMob");
        // }
        // let plugin = ezplugin.get("PluginAdMob");
        if (plugin) {
            plugin.addEventListener((event, params) => {
                let adInfo = JSON.parse(params);
                cc.log("[ModuleManager] admob ", event, params);
                switch (event) {
                    case "open": {
                        cc.log("[ModuleManager] Admob open")
                        break;
                    }
                    case "earned": {
                        cc.log("[ModuleManager] Admob earned")
                        break;
                    }
                    case "error": {
                        gui.notify.show("ad_error", true);
                        Message.dispatchEvent(AdvMessage.ADV_ERROR, adInfo);
                        break;
                    }
                    case "close": {
                        Message.dispatchEvent(AdvMessage.ADV_SUCCESS, adInfo);
                        break;
                    }
                }
            })
        }
        Message.on(AccountEvent.LOGINED, this.messageHandler, this);
    }

    /** 退回到登录界面 */
    public exitHall() {
        if (gui.ui.has('loading/loading')) {
            return;
        }
        this.currentOffLineNode = null;
        this.exitGame();
        gui.customPopup.clear();
        gui.popup.clear();
        gui.ui.clear();
        service.account.logout();
        gui.ui.add('loading/loading', { state: 1 });
        cc.log("[ModuleManager] exitHall")
    }

    exitGame(params: any = null) {
        if (this.gameMainControl) {
            this.gameMainControl.unwatchTargetAll();
        }
    }

    messageHandler(event, params) {
        switch (event) {
            case AccountEvent.LOGINED: {
                this.vm.key = service.account.data.uid.toString();
                this.vm.save();

                let plugin = ezplugin.get("PluginBugly");
                if (plugin) {
                    plugin.excute("userid", service.account.data.uid);
                } else {
                    plugin = ezplugin.get("PluginBugly");
                    plugin && plugin.excute("userid", service.account.data.uid);
                }
                break
            }
        }
    }

    /** 上一次的离线奖励 */
    preOffReward: formatParams = { num: 0, numE: 0 };
    currentOffLineNode: cc.Node = null;
    loadOffLineReward(reward: formatParams, spanTime: number, callback?: Function) {
        if (reward.num > 0) {
            if (this.currentOffLineNode) {
                this.preOffReward = this.calcTool.calcAddNum(reward, this.preOffReward);
                this.currentOffLineNode.destroy();
            }
            let popViewParams: PopViewParams = {
                modal: true,
                opacity: 180,
                onAdded: (node) => {
                    engine.timer.scheduleOnce(() => {
                        this.currentOffLineNode = node;
                    }, 0.01);
                },
                onRemoved: () => {
                    callback && callback();
                }
            }
            gui.popup.add(`popup/offline_reward`, { reward: reward, spanTime: spanTime }, popViewParams)
        } else {
            callback && callback();
        }
    }

    entry(next: Function) {
        this.gameProtocol.entry((data) => {
            let accountData = service.account.data;
            accountData.loginTime = data["loginTime"] || "";
            accountData.nowDate = data["nowDate"] || "";

            accountData.diamond = data["userAccount"]["credit"];
            this.vm.diamond = accountData.diamond;
            if (this.vm.noviceProgress && this.vm.noviceProgress.novice_7 == 0 && data["cityId"] == 1) {
                this.vm.cityId = 2;
            } else {
                this.vm.cityId = data["cityId"] == 0 ? 1 : data["cityId"];
            }
            // this.vm.cityId = 3;
            this.vm.level = data["level"] == 0 ? 1 : data["level"];
            this.vm.levelReward = data["levelReward"] == 0 ? 1 : data["levelReward"];;
            accountData.level = this.vm.level;
            accountData.fame = {
                num: data["fame"] || 0,
                numE: data["fameE"] || 0
            };
            if (accountData.fame.num < 0) {
                accountData.fame.num = 0;
            }
            this.vm.fame = accountData.fame;

            accountData.credit = {
                num: data["credit"] || 0,
                numE: data["creditE"] || 0
            };
            if (accountData.credit.num < 0) {
                accountData.credit.num = 0;
            }
            this.vm.credit = accountData.credit;

            accountData.win = {
                num: data["win"] || 0,
                numE: data["winE"] || 0
            };
            if (accountData.win.num < 0) {
                accountData.win.num = 0;
            }
            this.vm.win = accountData.win;

            accountData.winTotal = {
                num: data["winTotal"] || 0,
                numE: data["winTotalE"] || 0
            };
            if (accountData.winTotal.num < 0) {
                accountData.winTotal.num = 0;
            }
            this.vm.winTotal = accountData.winTotal;

            this.gamedata.cityId = data["cityId"];
            next();
        });
    }

    /** 进入游戏 */
    isEnterGame: boolean = false;
    enterGame() {
        engine.log.info(`enterGame`);
        let asyncQueue: AsyncQueue = new AsyncQueue();
        if (!this.themeConfig) {
            this.themeConfig = new ThemeConfig();
        }
        if (!this.audio) {
            this.audio = new GameAudio();
        }
        if (!this.gameProtocol) {
            this.gameProtocol = new GameProtocol(service.server);
        }
        if (!this.calcTool) {
            this.calcTool = new CalcTool(this.themeConfig);
        }
        if (!this.calcUiShow) {
            this.calcUiShow = new CalcUiShow(this.themeConfig, this.calcTool);
        }
        if (!this.noviceHandle) {
            this.noviceHandle = new NoviceHandle();
        }
        // entry游戏
        asyncQueue.push((next: NextFunction) => {
            this.entry(next);
        });
        // asyncQueue.push( (next:NextFunction)=>{
        //     gui.ui.add('main/start', null, {
        //         onAdded: (node: cc.Node) => {//
        //             gui.ui.$delete("loading/loading");
        //                 let startSkeleton = node.getComponent(sp.Skeleton);
        //                 startSkeleton.setCompleteListener((func)=>{
        //                     if(func.animation.name == "reward"){
        //                         node.destroy();
        //                         next();
        //                     }
        //                 })
        //                 startSkeleton.setAnimation(0,"reward",false);
        //         }
        //     })
        // } );
        asyncQueue.complete = () => {
            gui.ui.add('main/main_scene', null, {
                onAdded: (node: cc.Node) => {
                    gui.ui.$delete("loading/loading");
                },
                onRemoved: () => {
                }
            })
        };
        asyncQueue.play();
    }
}