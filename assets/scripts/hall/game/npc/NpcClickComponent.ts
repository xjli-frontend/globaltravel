import engine from "../../../core/Engine";
import { Message } from "../../../core/event/MessageManager";
import { PopViewParams } from "../../../core/gui/Defines";
import { gui } from "../../../core/gui/GUI";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import { AsyncQueue } from "../../../core/util/AsyncQueue";
import main from "../../../Main";
import Charactor from "../../../map/charactor/Charactor";
import { service } from "../../../service/Service";
import { AudioMessage } from "../../AudioMessage";
import { formatParams } from "../../CalcTool";
import { TaskType } from "../../CalcUiShow";
import { AdvRewardType } from "../adv/AdvControl";

const { ccclass, property } = cc._decorator;

/**npc功能组件 */
@ccclass
export default class NpcClickComponent extends ComponentExtends {

    initTime: number = 0;
    rewardTimesSpan: number = 0;
    dataIdsMove: Array<string> = [];
    dataIdsDoor: Array<string> = [];
    onLoad() {
        this.initTime = main.module.calcUiShow.getSeverCurrentTime();

    }

    showSkeleton(storeID) {
        let skeleton = this.node.getChildByName("skeleton").getComponent(sp.Skeleton)
        skeleton.node.active = false;
        cc.loader.loadRes(`animator/npc/npc_${storeID}/npc_${storeID}`, sp.SkeletonData, (err, skd) => {
            if (err && storeID != 1) {
                this.showSkeleton(1);
                return;
            }
            if (err) {
                cc.error(err);
                return;
            }
            if (storeID == "3" || storeID == "5") {
                skeleton.isValid && (skeleton.premultipliedAlpha = true);
            }
            skeleton.skeletonData = skd;
            skeleton.node.active = true;
        })
    }

    initDataIds(npcId: number) {
        for (let i = 1; i < 10; i++) {
            let dataIdMove = `npc_stand_${npcId}_${i}`;
            let stringMove = engine.i18n.getLangByID(dataIdMove);
            if (stringMove) {
                this.dataIdsMove.push(dataIdMove);
            }
            // let dataIdDoor = `npc_door_${npcId}_${i}`;
            // let stringDoor = engine.i18n.getLangByID(dataIdDoor);
            // if (stringDoor) {
            //     this.dataIdsDoor.push(dataIdDoor);
            // }
        }
    }

    npcId: number = 1;
    /**初始化点击事件 */
    initClickEvent(id: number) {
        this.npcId = id;
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let qipaoNode = this.node.getChildByName("qipao");
        let npc_colid = this.node.getChildByName("npc_colid");
        qipaoNode.active = false;
        this.node.getChildByName("click_effect").active = false;
        this.node.getChildByName("click_skeleton").active = false;
        let skeleton = this.node.getChildByName("qipao").getChildByName("qipao_skeleton").getComponent(sp.Skeleton);

        if (id == 3 || id == 5 || id == 7 || id == 9) {
            if (this.npcId == 3 || this.npcId == 5) {
                if (this.npcId == 3) {
                    this.node.getChildByName("click_skeleton").scale = 1;
                    this.node.getChildByName("click_effect").y = 10;
                    this.node.getChildByName("click_skeleton").y = -5;
                    this.node.getChildByName("click_skeleton").x = -5;
                    qipaoNode.y = 30;
                    qipaoNode.width = 90;
                    skeleton.node.y = 35;
                    npc_colid.y = 15;
                    npc_colid.width = 70;
                }
                if (this.npcId == 5) {
                    this.node.getChildByName("click_skeleton").scaleX = 1.4;
                    this.node.getChildByName("click_skeleton").scaleY = 1;
                    this.node.getChildByName("click_effect").y = 20;
                    this.node.getChildByName("click_skeleton").x = -5;
                    qipaoNode.y = 45;
                    qipaoNode.width = 95;
                    skeleton.node.y = 35;
                    npc_colid.y = 15;
                    npc_colid.width = 80;
                }
            }
            if (this.npcId == 7) {
                qipaoNode.y = 40;
                skeleton.node.y = 65;
                qipaoNode.width = 85;
                qipaoNode.height = 160;
                this.node.getChildByName("click_skeleton").scaleX = 0.8;
                this.node.getChildByName("click_skeleton").scaleY = 1.6;
                this.node.getChildByName("click_effect").y = 10;
                npc_colid.y = 20;
                npc_colid.width = 60;
                npc_colid.height = 160;
            }
            if (this.npcId == 9) {
                qipaoNode.y = 50;
                skeleton.node.y = 95;
                qipaoNode.width = 120;
                qipaoNode.height = 210;
                this.node.getChildByName("click_skeleton").scaleX = 1.5;
                this.node.getChildByName("click_skeleton").scaleY = 1.9;
                this.node.getChildByName("click_effect").y = 100;
                this.node.getChildByName("click_skeleton").y = 10;
                npc_colid.y = 25;
                npc_colid.width = 120;
                npc_colid.height = 210;
            }            
            if (this.npcId == 7) {
                let skd = cc.loader.getRes(`main/skeleton/qipao_guanggao`, sp.SkeletonData);
                skeleton.skeletonData = skd;
            } else if (this.npcId == 3 || this.npcId == 5) {
                let skd = cc.loader.getRes(`main/skeleton/qipao_hongxin`, sp.SkeletonData);
                skeleton.skeletonData = skd;
            } else if (this.npcId == 9) {
                let skd = cc.loader.getRes(`main/skeleton/qipao_dianzan`, sp.SkeletonData);
                skeleton.skeletonData = skd;
            }
            skeleton.setCompleteListener((func) => {
                if (func.animation.name == "reward_fadein") {
                    skeleton.setAnimation(0, "reward_loop", true);
                }
                // else if (func.animation.name == "reward_die") {
                //     qipaoNode.active = false;
                //     this.node.getChildByName("click_effect").active = false;
                //     this.node.getChildByName("click_skeleton").active = false;
                // }
            })
        } else {
            mainNodes.get("handler").destroy();

            this.node.getChildByName("click_skeleton").destroy();
            this.node.getChildByName("click_effect").destroy();
        }
        qipaoNode.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd.bind(this), this);
        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            let effectId = "";
            switch (this.npcId) {
                case 1:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10://男的
                    effectId = "man_" + this.getRandomNum(1, 4) + "";
                    break;
                case 2:
                case 4://女的
                    effectId = "woman_" + this.getRandomNum(1, 4);
                    break;
                case 5://猫
                    service.analytics.logEvent("npc_click_cat", "", "")
                    effectId = "dog_" + this.getRandomNum(1, 2);
                    break;
                case 3://狗
                    service.analytics.logEvent("npc_click_dog", "", "")
                    effectId = "cat_" + + this.getRandomNum(1, 2);
                    break;
                default:
                    break;
            }
            if(this.npcId == 9){
                service.analytics.logEvent("npc_click_takeaway", "", "")
            }
            if(this.npcId == 7){
                service.analytics.logEvent("npc_click_advocate", "", "")
            }
            Message.dispatchEvent(AudioMessage.EFFECT, effectId);
        }, this)
        this.initRewardTimesSpan(id);
        this.showSkeleton(id);
        this.randomLabAnimStand();
    }
    
    /** 行走时显示的循环 */
    randomLabAnimStand() {
        if (this.npcId == 3 || this.npcId == 5 || this.npcId == 7 || this.npcId == 9) {
            return;
        }
        this.unscheduleAllCallbacks();
        this.schedule(() => {
            let skeleton = this.node.getChildByName("emoticon").getComponent(sp.Skeleton);
            skeleton.setSkin(`npc_${this.npcId}`);
            skeleton.setAnimation(0,"reward",false);
        }, 20 + 8 * this.npcId)
    }

    /** 初始化奖励时间段 */
    initRewardTimesSpan(id: number) {
        if (this.npcId == 3 || this.npcId == 5 || this.npcId == 7 || this.npcId == 9) {
            this.rewardTimesSpan = main.module.gamedata.npcConfig.get(`npc_${id}`).timeSpan * 1000;
        }
    }

    preRewardTime: number = 0;
    onTouchEnd(touch,event) {
        let touchLoc = touch.getLocation();
        if( main.module.gameMainControl.checkCollidPoints(touchLoc)){
            cc.log(`onTouchEnd:点击碰撞在地标上，不触发npc点击回调`);
            return;
        }
        if( !this.canClick ){
            cc.log(`onTouchEnd:点击爱心，正在生效不可重复点击`)
            return;
        }
        this.canClick = false;
        cc.log(`点击npc_${this.npcId}爱心`);
        if (main.module.gamedata.npcData[`npc_${this.npcId}`]) {
            let preRewardTime = main.module.gamedata.npcData[`npc_${this.npcId}`]["rewardTime"];
            let timeCount = main.module.calcUiShow.getSeverCurrentTime() - preRewardTime;
            if (preRewardTime && timeCount < this.rewardTimesSpan) {
                return;
            }
        }
        let popViewParams: PopViewParams = {
            modal: true,
            opacity: 120,
            touchClose:false,
            onAdded: (node, params) => {
                node.x = 0;
                node.y = 30;
                node.scale = 0.1;
                node.RunAction(ezaction.scaleTo(0.3, { scale: 1 }));
            },
            // 节点删除动画
            onBeforeRemove: (node, next) => {
                node.RunAction(ezaction.scaleTo(0.2, { scale: 0.1 })).onStoped(next);
            }
        }
        cc.log(this.npcId,"奖励时间："+main.module.gamedata.npcConfig.get(`npc_${this.npcId}`).rewardData[0]["value"])
        let reward = main.module.calcUiShow.getTimeStageReward(main.module.gamedata.npcConfig.get(`npc_${this.npcId}`).rewardData[0]["value"]);
        if(reward.num == 0 && reward.numE == 0){
            reward = {num:1,numE:3};
        }
        let qipaoNode = this.node.getChildByName("qipao");
        qipaoNode.active = false;
        this.node.getChildByName("click_effect").active = false;
        this.node.getChildByName("click_skeleton").active = false;
        main.module.vm.npcNum+=1;
        main.module.gameProtocol.writeCacheData("npcNum", main.module.vm.npcNum as Object, (data) => {
        })
        if(main.module.vm.mainProgress.progress_5 == 0){
            Message.dispatchEvent(NPC_EVENT.REMOVE_CAN_CLICK,this.npcId);
            let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
            mainNodes.get("handler").active = false;
        }
        if(main.module.vm.mainProgress.progress_7 == 1){
            Message.dispatchEvent(NPC_EVENT.NPC_FAME,this.npcId);
            main.module.gamedata.fameNpcNum+=1;
            main.module.gameProtocol.writeCacheData("fameNpcNum", main.module.gamedata.fameNpcNum as Object, (data) => {
                    
            })
        }
        switch (this.npcId) {
            case 7:
                let type = this.getRandomNum(2, 3);
                gui.popup.add(`popup/adv_choose`, { reward:reward,
                    type: type, callback: (success: boolean, _type: number) => {
                        service.prompt.netInstableOpen();
                        if (success) {
                            service.analytics.logEvent("ad_complete_advocate", "", "")
                            if (type == AdvRewardType.NPC_7_1) {
                                cc.log(`观看完广告，金币翻5倍`)
                                service.analytics.logEvent("ad_complete_profits", "", "")
                                main.module.gameProtocol.requestNpcReward(this.npcId, 0, success , (data) => {
                                    service.prompt.netInstableClose();
                                    main.module.gamedata.npcData = data["npcData"];
                                    reward = main.module.calcTool.calcMutiNum(
                                        { num: main.module.gamedata.npcConfig.get(`npc_${this.npcId}`).rewardData[0]["watch"], numE: 0 },
                                        reward);
                                    cc.log("翻倍："+main.module.gamedata.npcConfig.get(`npc_${this.npcId}`).rewardData[0]["watch"]);
                                    let result = main.module.calcTool.formatNum(reward);
                                    cc.log(`金币翻五倍结果:${result.base}${result.gear}`)
                                    this.onTouchEndCallback(reward);
                                })
                            } else {
                                cc.log(`观看完广告，获得5颗钻石`)
                                main.module.gameProtocol.requestNpcReward(this.npcId, 1, success, (data) => {
                                    service.prompt.netInstableClose();
                                    main.module.gamedata.npcData = data["npcData"];
                                    main.module.gameMainControl.playAdDiamondEffect(()=>{
                                        main.module.vm.diamond = data["userAccount"]["credit"];
                                    });
                                    this.onTouchEndCallback();
                                })
                            }
                           this.taskCount();
                        } else {
                            if (type == AdvRewardType.NPC_7_1) {
                                cc.log(`未观看完广告，金币不翻倍`);
                                main.module.gameProtocol.requestNpcReward(this.npcId, 0, success, (data) => {
                                    service.prompt.netInstableClose();
                                    let result = main.module.calcTool.formatNum(reward);
                                    cc.log(`金币不翻倍结果:${result.base}${result.gear}`)
                                    main.module.gamedata.npcData = data["npcData"];
                                    this.onTouchEndCallback(reward);
                                })
                            } else {
                                cc.log(`未观看完广告，未获得钻石`);
                                main.module.gameProtocol.requestNpcReward(this.npcId, 1,success, (data) => {
                                    service.prompt.netInstableClose();
                                    main.module.gamedata.npcData = data["npcData"];
                                    this.onTouchEndCallback();
                                })
                            }
                        }
                    }
                }, popViewParams);
                break;
            case 3:
            case 5:
                let skeleton = this.node.getChildByName("skeleton").getComponent(sp.Skeleton);
                let animation = skeleton.animation;
                let nextCall = AsyncQueue.excuteTimes(2,()=>{
                    skeleton.setAnimation(0, animation, true);
                    this.node.getComponent(Charactor).stopAndMove();
                })
                skeleton.setCompleteListener((func) => {
                    if (func.animation.name == "reward_show_1") {
                        skeleton.setCompleteListener((func) => {
                        })
                        nextCall();
                    }
                })
                this.node.getComponent(Charactor).down();
                service.prompt.netInstableOpen();
                main.module.gameProtocol.requestNpcReward(this.npcId, 0,false, (data) => {
                    service.prompt.netInstableClose();
                    main.module.gamedata.npcData = data["npcData"];
                    if(reward.num == 0 && reward.numE == 0){
                        reward = {num:1,numE:3}
                    }
                    this.onTouchEndCallback(reward);
                    nextCall();
                })
                let _taskList = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.LUCKY_reward, 1)
                main.module.gameProtocol.sendTaskList(_taskList, (obj) => {
                    main.module.vm.taskList = _taskList;
                })
                break;
            case 9:
                gui.popup.add(`popup/adv_choose`, {
                    type: AdvRewardType.NPC_9, callback: (success: boolean, _type: number) => {
                        if (success) {
                            service.analytics.logEvent("ad_complete_takeaway", "", "")
                            cc.log(`观看完广告，可以获得道具`);
                            service.prompt.netInstableOpen();
                            main.module.gameProtocol.requestNpcReward(this.npcId, 0, success,  (data) => {
                                service.prompt.netInstableClose();
                                main.module.gamedata.npcData = data["npcData"];
                                cc.log(`获得道具成功`);
                                this.initTime = data["npcData"]["npc_9"]["rewardTime"];
                                this.onTouchEndCallback();
                                main.module.gameMainControl.playPackageffect();
                            })
                            this.taskCount();
                        } else {
                            cc.log(`未观看完广告，不可以获得道具`);
                            service.prompt.netInstableOpen();
                            main.module.gameProtocol.requestNpcReward(this.npcId, 0, success, (data) => {
                                service.prompt.netInstableClose();
                                main.module.gamedata.npcData = data["npcData"];
                                this.onTouchEndCallback();
                            })
                        }
                    }
                }, popViewParams);
                break;
            default:
                break;
        }
    }

    taskCount(){
        // let _taskListAd = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
        // main.module.gameProtocol.sendTaskList(_taskListAd, (obj) => {
        //     main.module.vm.taskList = _taskListAd;
        // })
    }

    canClick:boolean = true;
    onTouchEndCallback(reward?: formatParams) {
        this.initTime = main.module.gamedata.npcData[`npc_${this.npcId}`]["rewardTime"];
        this.canClick = true;
        if (reward) {
            main.module.gameMainControl.playCreditEffect(reward, () => {
                main.module.calcUiShow.refreshCredit(reward, () => {
                }, true)
            });
        } 
    }

    qipaoAnim() {
        this.unscheduleAllCallbacks();
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        if(main.module.vm.mainProgress.progress_5 == 0){
            Message.dispatchEvent(NPC_EVENT.ADD_CAN_CLICK,this.npcId);
            mainNodes.get("handler").active = true;
        }else{
            if(mainNodes.get("handler")){
                mainNodes.get("handler").destroy();
            }
        }
        let qipaoNode = this.node.getChildByName("qipao");
        qipaoNode.active = true;
        let skeleton = this.node.getChildByName("qipao").getChildByName("qipao_skeleton").getComponent(sp.Skeleton);
        skeleton.setAnimation(0, "reward_fadein", false);
        this.node.getChildByName("click_effect").active = true;
        this.node.getChildByName("click_skeleton").active = true;

    }


    update(dt) {
        let currentTime = main.module.calcUiShow.getSeverCurrentTime();
        if (this.npcId == 3 || this.npcId == 5 || this.npcId == 7 || this.npcId == 9) {
            let qipaoNode = this.node.getChildByName("qipao");
            if (currentTime - this.initTime >= this.rewardTimesSpan) {
                if (!qipaoNode.active && this.canClick) {
                    this.qipaoAnim();
                }
            }
        }
    }

    getRandomNum(begin: number, end: number) {
        let result = Math.round(Math.random() * (end - begin) + begin);
        return result;
    }

    onDestroy() {
        this.unscheduleAllCallbacks();

        // if(this.node.getChildByName("skeleton")){
        //     let skeleton = this.node.getChildByName("skeleton").getComponent(sp.Skeleton)
        //     cc.loader.releaseAsset(skeleton.skeletonData);
        //     skeleton.skeletonData = null;
        // }
        let qipaoNode = this.node.getChildByName("qipao");
        if (qipaoNode) {
            qipaoNode.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd.bind(this), this);
        }
        Message.removeEventTarget(this);
        this.rewardTimesSpan = null;
        this.preRewardTime = null;
        this.initTime = null;
        this.dataIdsMove = null;
        this.dataIdsDoor = null;
        this.npcId = null;
        this.node.targetOff(this)
        super.onDestroy();
    }


}

export enum NPC_EVENT{
    /** 引导点击三次npc事件 */
    ADD_CAN_CLICK = "add_can_click",
    /**删除 引导点击三次npc事件 */
    REMOVE_CAN_CLICK = "remove_can_click",
    /** 获取声望界面统计npc交互次数*/
    NPC_FAME = "npc_fame"
}