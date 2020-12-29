
import engine from "../../core/Engine";
import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { ServerState } from "../../service/server/Server";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import { formatParams } from "../CalcTool";
import { TaskType } from "../CalcUiShow";


const PROGRESS_Y: Array<number> = [-75, -115, -130, -130, -110, -75, -75, -75, -75, -75];
const weilan_1: Array<cc.Vec2> = [cc.v2(3, -37), cc.v2(3, -49), cc.v2(3, -50)];
const weilan_2: Array<cc.Vec2> = [cc.v2(-8, 89), cc.v2(-7, 105), cc.v2(-5, 107)];
const lock_pos: Array<cc.Vec2> = [cc.v2(95, 5), cc.v2(132, -12), cc.v2(137, -10)];

const { ccclass, property } = cc._decorator;

@ccclass
export default class StoreComponent extends ComponentExtends {//每一个商店组件

    @property(sp.Skeleton)
    storeSkeleton: sp.Skeleton = null;

    mainNodes: HashMap<string, cc.Node> = null;

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        // Message.on(EventProtocol.ONREWARDRESULT,this.onEventHandler,this);
        this.mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.storeSkeleton.node.active = false;
        this.node.getChildByName("clerk").active = false;
        this.mainNodes.get("buff_skeleton_top").active = false;
        this.mainNodes.get("buff_skeleton_bottom").active = false;
        this.mainNodes.get("up_skeleton_top").active = false;
        this.mainNodes.get("up_skeleton_bottom").active = false;
        this.unscheduleAllCallbacks();
        this.schedule(() => {
            if (this.preReturnRewardTime != 0) {
                this.collectQuick();
            }
        }, 1)
        this.mainNodes.get("store_info").opacity = 0;
        this.mainNodes.get("lock").active = false;
        this.mainNodes.get("btn_lock").active = false;
        this.mainNodes.get("lock").getComponent(sp.Skeleton).setAnimation(0, "reward_loop", true);
        this.mainNodes.get("progress_full").active = false;
        this.mainNodes.get("progress_full").getComponent(sp.Skeleton).setAnimation(0, "reward_loop", true);
        this.mainNodes.get("btn_progress").active = false;
        this.mainNodes.get("border_back").active = false;
        this.mainNodes.get("border_front").active = false;
        this.mainNodes.get("up_tip").active = false;
    }

    progressInitY: number = 0;

    storeTag: string = "";
    currentStoreInfo: any = null;
    priceMuti: number = 1;
    /** 加载或刷新商店 */
    loadStore(tag: string, storeInfo: any, isFirst: boolean = false) {
        this.storeTag = tag;
        this.priceMuti = main.module.themeConfig.getStoreBaseConfigByTag(tag).priceMulti;
        this.storeId = storeInfo["id"];

        // window["store" + this.storeId] = this.node;
        this.mainNodes.get("store_name").getComponent(LanguageLabel).dataID = `ui_store_${this.storeId}`;
        this.refreshUi(storeInfo, isFirst);
        let skd = cc.loader.getRes(`main/store_skeleton/${this.storeTag}/${this.storeTag}`, sp.SkeletonData);
        this.storeSkeleton.skeletonData = skd;
        this.storeSkeleton.premultipliedAlpha = this.storeId == 6 || this.storeId == 7;
        this.storeSkeleton.node.active = true;
        this.mainNodes.get("btn_progress").active = true;
        this.progressInitY = PROGRESS_Y[this.storeId - 1];
        this.mainNodes.get("btn_progress").y = this.progressInitY;
        this.mainNodes.get("border_back").getComponent(cc.Sprite).spriteFrame = cc.loader.getRes(`main/no_pack/weilan/weilan_${this.getAimStr()}_2`, cc.SpriteFrame);
        this.mainNodes.get("border_front").getComponent(cc.Sprite).spriteFrame = cc.loader.getRes(`main/no_pack/weilan/weilan_${this.getAimStr()}_1`, cc.SpriteFrame);
        this.mainNodes.get("border_front").setPosition(weilan_1[parseInt(this.getAimStr()) - 1]);
        this.mainNodes.get("border_back").setPosition(weilan_2[parseInt(this.getAimStr()) - 1]);
        this.mainNodes.get("novice_num").active = true;
        if(this.storeId != 1){
            this.mainNodes.get("handler").destroy();
            this.mainNodes.get("novice_num").active = false;
        }
        if(this.storeId==3){
            this.mainNodes.get("buff_skeleton_top").y = -13;
            this.mainNodes.get("buff_skeleton_bottom").y = -13;
        }
        switch (this.getAimStr()) {
            case "1":
                this.mainNodes.get("up_tip").setPosition(cc.v2(-216,30-(this.storeId==3?13:0)));
                this.mainNodes.get("btn_lock").setPosition(lock_pos[0]);
                break;
            case "2":
                this.mainNodes.get("up_tip").setPosition(cc.v2(-265,28));
                this.mainNodes.get("btn_lock").setPosition(lock_pos[1]);
                break;  
            case "3":
                this.mainNodes.get("up_tip").setPosition(cc.v2(-300,12));
                this.mainNodes.get("btn_lock").setPosition(lock_pos[2]);
                break;
            default:
                break;
        }
        // this.mainNodes.get("btn_lock").setPosition(0,100);
        if (storeInfo["level"] == 0) {
            this.storeSkeleton.setAnimation(0, "idle_0", true);
            this.mainNodes.get("border_back").active = true;
            this.mainNodes.get("border_front").active = true;
        } else {
            this.mainNodes.get("border_back").active = false;
            this.mainNodes.get("border_front").active = false;
            if (storeInfo["level"] == 0) {
                this.storeSkeleton.setAnimation(0, "idle_0", true);
            } else if (storeInfo["level"] > 0 && storeInfo["level"] < 100) {
                this.storeSkeleton.setAnimation(0, "idle_1", true);
            } else if (storeInfo["level"] >= 100 && storeInfo["level"] < 1000) {
                this.storeSkeleton.setAnimation(0, "idle_2", true);
            } else if (storeInfo["level"] >= 1000) {
                this.storeSkeleton.setAnimation(0, "idle_3", true);
            }
        }
        this.node.getChildByName("clerk").name = `clerk_${this.storeId}`;
        this.clerkNode = this.node.getChildByName(`clerk_${this.storeId}`);
        this.node.getChildByName(`clerk_${this.storeId}`).parent = this.node.parent;
        this.clerkNode.zIndex = 9999 - this.clerkNode.y;

    }

    clerkNode: cc.Node = null;

    noviceStart(level) {
        if (this.storeId == 1 && level == 0 && main.module.vm.level == 1 && main.module.vm.noviceProgress.novice_1 == 0) {
            main.module.noviceHandle.handle1(this.mainNodes.get("btn_lock"), () => {
                let price = main.module.calcUiShow.calcTargetPrice(this.storeTag, this.currentStoreLv, 1);
                this.upLvHandler(1, price, true, () => {
                });
            });
        }
    }

    /** 店铺Id */
    storeId: number = 0;
    /** 当前店员等级 */
    private _currentClerkLv: number = -1;
    get currentClerkLv() {
        return this._currentClerkLv;
    }
    set currentClerkLv(lv: number) {
        if (this._currentClerkLv == 0 && lv == 1) {
            this.isAction = false;
            this.mainNodes.get("btn_progress").y = this.progressInitY;
            this.mainNodes.get("btn_progress").StopAllActions();
            let currentReturnRewardTime = main.module.calcUiShow.getSeverCurrentTime();
            let timeCount = currentReturnRewardTime - this.preReturnRewardTime;
            let returnCount = Math.floor(timeCount / this.currentTimeSpanTotal);//返奖次数
            if (returnCount > 0) {
                this.refreshCreditRewardTime(this.returnReward, currentReturnRewardTime, () => {
                    this.progresVal = 0;
                    this.isStopProgress = false;
                    this.preReturnRewardTime = currentReturnRewardTime;
                    this.refreshUpTip();
                }, true);
            }
        }
        this._currentClerkLv = lv;
        //获取店员当前等级对应的的奖励类型 
        main.module.gamedata.clerksIdLv.set(this.storeId, lv);
        this.clerkNode.active = lv > 0;
    }

    refreshUi(storeInfo: any, isFirst: boolean = false) {
        this.currentStoreInfo = storeInfo;
        let storeLv = storeInfo["level"] || 0;
        this.setLvLab(storeLv, isFirst)
        this.refreshUpTip();
    }

    playCaidai(){
        let prefab1: cc.Prefab = cc.loader.getRes(`main/effect_prefab/unlock1`, cc.Prefab);
        let effectNode = main.module.gameMainControl.mainNodes.get("effect");
        let _node1 = cc.instantiate(prefab1);
        _node1.parent = effectNode;
        let prefab2: cc.Prefab = cc.loader.getRes(`main/effect_prefab/unlock2`, cc.Prefab);
        let _node2 = cc.instantiate(prefab2);
        let worldPos2 = cc.v2(0,100 + cc.winSize.height/2);
        let space2 = effectNode.convertToNodeSpaceAR(worldPos2)
        _node2.parent = effectNode;
        _node2.setPosition(space2);
        _node2.parent = main.module.gameMainControl.mainNodes.get("effect");
        let prefab3: cc.Prefab = cc.loader.getRes(`main/effect_prefab/unlock3`, cc.Prefab);
        let _node3 = cc.instantiate(prefab3);
        let worldPos3 = cc.v2(cc.winSize.width,100 + cc.winSize.height/2);
        let space3 = effectNode.convertToNodeSpaceAR(worldPos3)
        _node3.parent = effectNode;
        _node3.setPosition(space3);
        this.scheduleOnce(() => {
            _node1.destroy();
            _node2.destroy();
            _node3.destroy();
        }, 6)
    }

    currentAddMuti: formatParams = {
        num: 1,
        numE: 0
    };
    /** 当前店铺等级 */
    currentStoreLv: number = 0;
    /**设置等级 */
    setLvLab(lv: number, isFirst: boolean) {
        if (lv == this.currentStoreLv && lv > 0) {
            return;
        }
        if (this.currentStoreLv != 0 && lv == 0 && !isFirst) {
            this.storeSkeleton.setAnimation(0, "idle_0", true);
            this.mainNodes.get("border_back").active = true;
            this.mainNodes.get("border_front").active = true;
        }
        if (this.currentStoreLv == 0 && lv > 0 && !isFirst) {
            this.mainNodes.get("border_back").active = false;
            this.mainNodes.get("border_front").active = false;
            this.scheduleOnce(()=>{
                this.playCaidai();
            },0.5)
        }
        if (lv > 0 && lv < 100 && this.currentStoreLv == 0) {//0到99
            this.storeSkeleton.setAnimation(0, "idle_1", true);
        } else if (lv >= 100 && lv < 1000 && this.currentStoreLv < 100) {//0到100
            this.storeSkeleton.setAnimation(0, "idle_2", true);
        } else if (lv >= 1000 && this.currentStoreLv < 1000) {//0到99
            this.storeSkeleton.setAnimation(0, "idle_3", true);
        }

        if (!isFirst) {
            this.isOpenTip(lv);
        }
        this.currentStoreLv = lv;
        this.mainNodes.get("lock").active = lv == 0;
        this.mainNodes.get("btn_lock").active = lv == 0;
        this.mainNodes.get("btn_progress").active = lv > 0;
        this.mainNodes.get("store_lv").getComponent(cc.Label).string = `lv.${lv}`;
        this.mainNodes.get("store_info").getComponent(cc.Layout).updateLayout();
        main.module.gamedata.storesIdLv.set(this.storeId, lv);
    }

    isOpenTip(realLv: number) {
        let storesIdLvValues1 = main.module.gamedata.storesIdLv.values();
        main.module.calcTool.sort(storesIdLvValues1);//取所有店铺的最小等级作为store_11的等级 升级之前
        let store_11_lv1 = storesIdLvValues1[0];

        main.module.gamedata.storesIdLv.set(this.storeId, realLv);
        let storesIdLvValues2 = main.module.gamedata.storesIdLv.values();;
        main.module.calcTool.sort(storesIdLvValues2);//取所有店铺的最小等级作为store_11的等级 升级之后
        let store_11_lv2 = storesIdLvValues2[0];

        let config11 = main.module.themeConfig.getStoreSpeedLvConfigByTag("store_11");
        let values11 = config11.values();
        let prePostIndex11 = -1;//下一个里程碑的下标  store11
        for (let i = 0; i < values11.length; i++) {
            if (store_11_lv1 < values11[i].level) {
                prePostIndex11 = i;
                break;
            }
        }
        let postIndex11 = -1;//当前需要展示的里程碑下标   store11
        if (prePostIndex11 != -1) {
            for (let i = prePostIndex11; i < values11.length; i++) {
                if (store_11_lv2 >= values11[i].level) {
                    postIndex11 = i;
                } else {
                    break;
                }
            }
        }
        if (postIndex11 != -1) {
            let result = values11[postIndex11];
            main.module.gameMainControl.openPosterTip(result);
        } else {
            let cofig = main.module.themeConfig.getStoreSpeedLvConfigByTag(this.storeTag);
            let values = cofig.values();
            let prePostIndex = 0;//下一个里程碑的下标   当前店铺
            for (let i = 0; i < values.length; i++) {
                if (this.currentStoreLv < values[i].level) {
                    prePostIndex = i;
                    break;
                }
            }
            let postIndex = -1;//当前需要展示的里程碑下标   当前店铺
            for (let i = prePostIndex; i < values.length; i++) {
                if (realLv >= values[i].level) {
                    postIndex = i;
                } else {
                    break;
                }
            }
            if (postIndex != -1) {
                let result = values[postIndex];
                main.module.gameMainControl.openPosterTip(result);
            }
        }
    }

    currentPropMutiAdd:Number = 1;
    currentMainAdMuti:Number = 1;
    currentTimeSpanTotal: number = 0;
    /**返奖值 */
    returnReward: formatParams = null;
    /**设置收金币的速度显示 */
    setSpeedLab(obj: HashMap<string, number | formatParams>) {
        this.mainNodes.get("progress_full").active = false;
        if (obj && this.currentStoreLv > 0) {
            this.currentTimeSpanTotal = obj.get("timeStamp") as number;
            if (this.currentTimeSpanTotal < 100 && this.currentTimeSpanTotal != 0) {
                this.returnReward = obj.get("rewardAvg") as formatParams;
                let rewardTotalGear = main.module.calcTool.formatNum(this.returnReward)
                this.mainNodes.get("progress_lab").getComponent(LabelChangeSymbol).num = this.returnReward;
                this.mainNodes.get("progress_lab").getComponent(cc.Label).string = `${rewardTotalGear.base}${rewardTotalGear.gear}/s`;
            } else {
                this.returnReward = obj.get("reward") as formatParams;
                let rewardTotalGear = main.module.calcTool.formatNum(this.returnReward)
                this.mainNodes.get("progress_lab").getComponent(LabelChangeSymbol).num = this.returnReward;
                this.mainNodes.get("progress_lab").getComponent(cc.Label).string = `${rewardTotalGear.base}${rewardTotalGear.gear}`;
            }
        } else {
            this.returnReward = {
                num: 0,
                numE: 0
            }
            this.mainNodes.get("progress_lab").getComponent(cc.Label).string = ``;
        }
        if ((this.currentPropMutiAdd != main.module.gameMainControl.propMutiAdd && main.module.gameMainControl.propMutiAdd != 1 
            || this.currentMainAdMuti != main.module.gameMainControl.mainAdMuti && main.module.gameMainControl.mainAdMuti != 1) && this.currentStoreLv > 0) {
            let str = this.getAimStr();;
            let topSkeleton = this.mainNodes.get("buff_skeleton_top").getComponent(sp.Skeleton);
            let bottomSkeleton = this.mainNodes.get("buff_skeleton_bottom").getComponent(sp.Skeleton);
            let topAnimName = `reward_idle_${str}_2`;
            let bottomAnimName = `reward_idle_${str}_1`;
            topSkeleton.setAnimation(0, topAnimName, true);
            bottomSkeleton.setAnimation(0, bottomAnimName, true);
            this.mainNodes.get("buff_skeleton_top").active = true;
            this.mainNodes.get("buff_skeleton_bottom").active = true;
            engine.timer.unschedule(this.mutiSche);
            this.mutiSche = engine.timer.scheduleOnce(()=>{
                this.mainNodes.get("buff_skeleton_top").active = false;
                this.mainNodes.get("buff_skeleton_bottom").active = false;
            },5)
        } else {
            this.mainNodes.get("buff_skeleton_top").active = false;
            this.mainNodes.get("buff_skeleton_bottom").active = false;
        }
        this.currentPropMutiAdd = main.module.gameMainControl.propMutiAdd;
        this.currentMainAdMuti = main.module.gameMainControl.mainAdMuti;
    }
    mutiSche:string = "";

    playProgressAnim() {
        this.mainNodes.get("btn_progress").RunAction(ezaction.scaleTo(0.5, { y: this.progressInitY + 10 })).onStoped(() => {
            this.mainNodes.get("btn_progress").RunAction(ezaction.scaleTo(0.5, { y: this.progressInitY - 10 })).onStoped(() => {
                this.playProgressAnim();
            })
        })
    }
    /**设置进度条 */
    isAction: boolean = false;
    setProgress(progress: number) {
        if (progress > 1) {
            progress = 1;
        }
        this.mainNodes.get("progress_full").active = progress == 1 && this.currentTimeSpanTotal < 100;
        this.mainNodes.get("progress_spr").getComponent(cc.Sprite).fillRange = progress;
    }

    animSche: string = "";
    /** 可以升级待机提示动画 */
    upTipSkeletonAnim() {
        let skeleton = this.mainNodes.get("up_tip").getComponent(sp.Skeleton);
        skeleton.node.active = true;
        if(skeleton.animation == "reward_loop"){
            return;
        }
        skeleton.setAnimation(0,"reward_loop",true);
    }

    isAnim: boolean = true;
    /** 点击升级按钮动画 */
    btnUpSkeletonAnim() {
        this.mainNodes.get("buff_skeleton_top").active = false;
        this.mainNodes.get("buff_skeleton_bottom").active = false;
        this.mainNodes.get("up_skeleton_top").active = true;
        this.mainNodes.get("up_skeleton_bottom").active = true;
        let topSkeleton = this.mainNodes.get("up_skeleton_top").getComponent(sp.Skeleton);
        let bottomSkeleton = this.mainNodes.get("up_skeleton_bottom").getComponent(sp.Skeleton);
        let str = this.getAimStr();;
        let topAnimName = `reward_up_${str}_2`;
        let bottomAnimName = `reward_up_${str}_1`;
        if (!this.isAnim) {
            return;
        }
        this.isAnim = false;
        topSkeleton.setAnimation(0, topAnimName, false);
        bottomSkeleton.setAnimation(0, bottomAnimName, false);
        topSkeleton.setCompleteListener(() => {
            this.isAnim = true;
            this.mainNodes.get("up_skeleton_top").active = false;
            this.mainNodes.get("up_skeleton_bottom").active = false;
        })
    }

    /** 刷新提示可以升级状态 */
    refreshUpTip() {
        let nextPrice = main.module.calcUiShow.calcTargetPrice(this.storeTag, this.currentStoreLv, 1);
        let maxLv = main.module.themeConfig.getStoreMaxLvById(this.storeId);
        this.mainNodes.get("lock_tip").active = main.module.calcTool.compare(main.module.vm.credit, nextPrice) && this.currentStoreLv == 0;
        if (main.module.calcTool.compare(main.module.vm.credit, nextPrice) && this.currentStoreLv < maxLv && this.currentStoreLv > 0) {
            this.upTipSkeletonAnim();
        }else{
            let skeletonNode = this.mainNodes.get("up_tip")
            let skeleton = skeletonNode.getComponent(sp.Skeleton);
            if(this.currentStoreLv > 0){
                skeleton.node.active = false;
            }else{
                skeleton.node.active = false;
            }
        }
        // let anim = main.module.calcTool.compare(main.module.vm.credit, nextPrice) ? "reward_loop":"reward";
        // let lockSkeleton = this.mainNodes.get("btn_lock").getChildByName("lock_skeleton").getComponent(sp.Skeleton)
        // if(lockSkeleton.animation != anim){
        //     lockSkeleton.setAnimation(0,anim,true);
        // }
        // this.mainNodes.get("btn_lock").getComponent(ButtonEffect).canTouch = main.module.calcTool.compare(main.module.vm.credit, nextPrice);
        this.showButtonEffect(this.mainNodes.get("btn_lock"),main.module.calcTool.compare(main.module.vm.credit, nextPrice));
        if(main.module.vm.noviceProgress.novice_3 == 0 && (4 - main.module.vm.winTotal.num)>0 && this.storeId == 1){
            this.mainNodes.get("novice_num").active = true;
            this.mainNodes.get("novice_num").getComponent(cc.Label).string = `${4 - main.module.vm.winTotal.num}`; 
        }else{
            this.mainNodes.get("novice_num").active = false;
        }
    }

    onTouchHandler(event: cc.Event.EventTouch) {
        let vm = main.module.vm;
        if (this.preReturnRewardTime == 0 && this.currentStoreLv > 0) {
            return;
        }
        let mapControl = main.module.mainScene.mapControl;
        if (mapControl.isMoving) {
            return;
        }
        let price = main.module.calcUiShow.calcTargetPrice(this.storeTag, this.currentStoreLv, 1);
        let popViewParams: PopViewParams = {
            modal: true,
            opacity: 126,
            touchClose: true,
        }
        if (vm.noviceProgress.novice_2 == 0) {
            return;
        }
        switch (event.target.name) {
            case "btn_progress": {
                Message.dispatchEvent(AudioMessage.BUILD_EFFECT, this.storeId);
                if (this.currentClerkLv > 0 || this.currentStoreLv == 0) {
                    if(this.currentClerkLv > 0){
                        this.playCollectEffect();
                        if (this.currentTimeSpanTotal < 100 && this.currentTimeSpanTotal != 0) {
                            this.preReturnRewardTime = this.preReturnRewardTime - this.currentTimeSpanTotal;
                        }else{
                            this.preReturnRewardTime = this.preReturnRewardTime - 1000;
                        }
                    }
                    return;
                }
                if (this.progresVal != 1) {// 
                    return;
                }
                this.playCollectEffect();
                service.analytics.logEvent("click_details", "", "")
                Message.dispatchEvent(AudioMessage.EFFECT, "ui_2")
                this.isAction = false;
                this.mainNodes.get("btn_progress").y = this.progressInitY;
                this.mainNodes.get("btn_progress").StopAllActions();
                this.isStopProgress = true;
                this.mainNodes.get("progress_click").getComponent(sp.Skeleton).setAnimation(0, "reward", false);
                let currentReturnRewardTime = main.module.calcUiShow.getSeverCurrentTime();
                this.refreshCreditRewardTime(this.returnReward, currentReturnRewardTime, () => {
                    if (main.module.calcTool.compare(vm.credit, { num: 4, numE: 0 }) && vm.storeList["store_1"]["level"] == 1 && main.module.vm.noviceProgress.novice_3 == 0 && vm.level == 1) {//新手引导3
                        main.module.noviceHandle.noviceUpStore(() => {
                            let price = main.module.calcUiShow.calcTargetPrice(this.storeTag, this.currentStoreLv, 1);
                            this.upLvHandler(1, price, false, () => {
                                if (!!main.module.gameMainControl.storeOperation.node.active) {
                                    main.module.gameMainControl.storeOperation.loadStoreBaseInfo();
                                }
                            });
                        });
                    } else {
                        this.progresVal = 0;
                        this.isStopProgress = false;
                        this.preReturnRewardTime = currentReturnRewardTime;
                        this.refreshUpTip();
                    }
                }, true);
                break;
            }
            case "btn_operation": {
                if (main.module.gameMainControl.storeOperation) {
                    return;
                }
                if (this.currentStoreLv == 0 && !main.module.gameMainControl.storeOperation) {
                    main.module.gameMainControl.mainTaskTip.setStorePosByMap(this.storeId);
                    main.module.gameMainControl.pop_storeunlock_id =
                        gui.popup.add(`main/store_unlock`, {
                            storeId: this.storeId, callback: () => {
                                this.upLvHandler(1, price, true, () => {
                                });
                            }, price: price, active: 0
                        }, popViewParams)
                    return;
                }
                if (main.module.gameMainControl.storeOperation) {
                    return;
                }
                service.analytics.logEvent("click_details", "", "")
                main.module.gameMainControl.openStoreOperation(this.storeId);
                // main.module.gameMainControl.storeOperation.setPrePosScale();
                // main.module.gameMainControl.storeOperation.currentViewStoreId = this.storeId;
                break;
            }
            case "btn_lock": {
                if (!event.target.getComponent(ButtonEffect)) {
                    return;
                }
                if (main.module.gameMainControl.storeOperation) {
                    return;
                }
                service.analytics.logEvent(`store_${this.storeId}_unlock`, "", "")
                main.module.gameMainControl.mainTaskTip.setStorePosByMap(this.storeId);
                main.module.gameMainControl.pop_storeunlock_id =
                    gui.popup.add(`main/store_unlock`, {
                        storeId: this.storeId, callback: () => {
                            this.upLvHandler(1, price, true, () => {
                            });
                        }, price: price, active: 0
                    }, popViewParams)
                break;
            }
        }
    }

    upLvHandler(upLv: number, costPrice: formatParams, isUnLock: boolean = false, callback: Function) {
        Message.dispatchEvent(AudioMessage.EFFECT, "shop_ui");
        Message.dispatchEvent(AudioMessage.EFFECT, "coin");
        this.btnUpSkeletonAnim();
        this.isAction = false;
        this.mainNodes.get("btn_progress").y = this.progressInitY;
        this.mainNodes.get("btn_progress").StopAllActions();
        this.isStopProgress = true;
        if(!isUnLock){
            this.playUpLvEffect();
        }
        let vm = main.module.vm;
        let price = costPrice;
        if (!main.module.calcTool.compare(vm.credit, price)) {
            gui.notify.show("lack_credit");
            return;
        }
        let _taskListUpLv = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.STORE_UP, upLv);
        let countPost = main.module.calcUiShow.calcPostNum(this.storeId, upLv);//里程碑
        main.module.gameProtocol.sendTaskList(_taskListUpLv, (obj) => {
            vm.taskList = _taskListUpLv;
            if (countPost > 0) {
                let _taskListPost = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.STORE_CHALLENGE, countPost);
                cc.log("店铺升级达成挑战改变任务列表" + JSON.stringify(_taskListPost));
                main.module.gameProtocol.sendTaskList(_taskListPost, (obj) => {
                    vm.taskList = _taskListPost;
                })
            }
        })
        let _storeList = this.changeList(upLv);
        let preTimeSpanTotal = this.currentTimeSpanTotal * this.progresVal;//升级遇到里程碑会有时间扣减
        main.module.gameProtocol.sendStoreList(_storeList, (obj) => {
        })
        vm.storeList = _storeList;
        main.module.calcUiShow.refreshCredit({
            num: -price.num,
            numE: price.numE
        }, () => {
            if (isUnLock) {
                this.progresVal = 0;
                this.preReturnRewardTime = main.module.calcUiShow.getSeverCurrentTime();
                let list = this.changStoreListUpdateTime(this.preReturnRewardTime);
                vm.storeList = list;
                main.module.gameProtocol.sendStoreList(list, (obj) => {
                })
                callback && callback();
                this.refreshUpTip();
            } else {
                this.progresVal = preTimeSpanTotal / this.currentTimeSpanTotal;
                if (this.progresVal >= 1) {
                    if (this.currentClerkLv > 0) {
                        main.module.calcUiShow.refreshCredit(this.returnReward, () => {
                            this.preReturnRewardTime = main.module.calcUiShow.getSeverCurrentTime();
                            this.progresVal = 0;
                        }, true)
                    } else {
                        this.progresVal = 1;
                    }
                }
                callback && callback();
                this.refreshUpTip();
            }
            this.isStopProgress = false;
        }, true);
    }

    changeList(upTargerLv?: number) {
        let maxLv = main.module.themeConfig.getStoreMaxLvById(this.storeId);
        let storeList = main.module.vm.storeList;
        let resultList: Object = {};
        for (let key in storeList) {
            if (storeList[key]["id"] == this.storeId) {
                resultList[key] = {
                    id: storeList[key]["id"],
                    level: this.currentStoreLv + upTargerLv >= maxLv ? maxLv : this.currentStoreLv + upTargerLv,
                    rewardTime: storeList[key]["rewardTime"]
                }
            } else {
                resultList[key] = {
                    id: storeList[key]["id"],
                    level: storeList[key]["level"],
                    rewardTime: storeList[key]["rewardTime"]
                }
            }
        }
        return resultList;
    }


    refreshCreditRewardTime(returnReward: formatParams, returnTime: number, callback?: Function, isSync: boolean = false) {
        let vm = main.module.vm;
        main.module.calcUiShow.refreshCredit(returnReward, callback, isSync);
        let _storeList = this.changStoreListUpdateTime(returnTime);
        main.module.calcUiShow.refreshReturnRewardTime(_storeList, isSync)
    }


    /** 升级特效 */
    playUpLvEffect() {
        let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/uplv_effect`, cc.Prefab);
        let _node = cc.instantiate(prefab);
        _node.parent = this.node;
    }

    /** 收集特效 */
    playCollectEffect() {
        let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/collect_effect`, cc.Prefab);
        let _node = cc.instantiate(prefab);
        _node.parent = this.mainNodes.get("progress_gold");
        this.scheduleOnce(() => {
            _node.destroy();
        }, 6)
    }

    progresVal = 0;
    isStopProgress: boolean = false;
    /** 上一次的返奖时间 */
    preReturnRewardTime: number = 0;
    isFullAnim: boolean = false;
    collect() {
        if (service.server.state == ServerState.DISCONNECTED) {
            return;
        }
        let currentReturnRewardTime = main.module.calcUiShow.getSeverCurrentTime();//当前时间
        let timeCount = currentReturnRewardTime - this.preReturnRewardTime;
        let returnCount = Math.floor(timeCount / this.currentTimeSpanTotal);//返奖次数
        let vm = main.module.vm;
        if (this.currentStoreLv > 0 && this.returnReward) {
            if (this.currentTimeSpanTotal >= 100) {
                if (this.currentClerkLv >= 1) {
                    if (timeCount >= this.currentTimeSpanTotal) {
                        this.refreshCreditRewardTime(main.module.calcTool.calcMutiNum(this.returnReward, { num: returnCount, numE: 0 }), this.preReturnRewardTime + returnCount * this.currentTimeSpanTotal)
                        this.preReturnRewardTime = this.preReturnRewardTime + returnCount * this.currentTimeSpanTotal;
                        this.progresVal = (currentReturnRewardTime - this.preReturnRewardTime) / this.currentTimeSpanTotal;
                    } else {
                        this.progresVal = timeCount / this.currentTimeSpanTotal;
                    }
                } else {
                    if (returnCount > 0 && !this.isStopProgress) {
                        if (this.currentStoreLv == 1 && this.storeId == 1 && main.module.vm.level == 1 && vm.credit.num == 0 && vm.credit.numE == 0
                            && main.module.vm.noviceProgress.novice_2 == 0) {//新手引导2
                            if (!this.isStopProgress) {
                                this.isStopProgress = true;
                                main.module.noviceHandle.handle2(this.mainNodes.get("btn_progress"), () => {
                                    let currentReturnRewardTime = main.module.calcUiShow.getSeverCurrentTime();
                                    this.isAction = false;
                                    this.mainNodes.get("btn_progress").y = this.progressInitY;
                                    this.mainNodes.get("btn_progress").StopAllActions();
                                    this.refreshCreditRewardTime(this.returnReward, currentReturnRewardTime, () => {
                                        this.progresVal = 0;
                                        this.isStopProgress = false;
                                        this.preReturnRewardTime = currentReturnRewardTime;
                                        this.progresVal = 0;
                                        this.refreshUpTip();
                                    }, true)
                                })
                            }
                        } else {
                            this.isStopProgress = true;
                        }
                        this.progresVal = 1;
                        if (!this.isAction) {
                            this.playProgressAnim();
                        }
                    } else {
                        if (!this.isStopProgress) {
                            this.progresVal = timeCount / this.currentTimeSpanTotal;
                        }
                    }
                }
            }
        } else {
            this.progresVal = 0;
        }
        this.setProgress(this.progresVal)
    }

    collectQuick() {
        if (service.server.state == ServerState.DISCONNECTED) {
            return;
        }
        let currentReturnRewardTime = main.module.calcUiShow.getSeverCurrentTime();//当前时间
        let timeCount = currentReturnRewardTime - this.preReturnRewardTime;
        if (this.currentStoreLv > 0 && this.returnReward) {
            if (this.currentTimeSpanTotal < 100) {
                this.progresVal = 1;
                if (this.currentClerkLv >= 1) {
                    let returnCount = Math.floor(timeCount / 1000);//返奖次数
                    if (this.currentClerkLv >= 1 && timeCount >= 1000 && !this.isStopProgress) {
                        this.refreshCreditRewardTime(main.module.calcTool.calcMutiNum(this.returnReward, { num: returnCount, numE: 0 }), this.preReturnRewardTime + returnCount * 1000)
                        this.preReturnRewardTime = this.preReturnRewardTime + returnCount * 1000;
                    }
                } else {

                }
            }
        } else {
            this.progresVal = 0;
        }
        this.setProgress(this.progresVal)
    }

    changStoreListUpdateTime(rewardTime: number) {
        let storeList = main.module.vm.storeList;
        let resultList: Object = {};
        for (let key in storeList) {
            if (storeList[key]["id"] == this.storeId) {
                resultList[key] = {
                    id: storeList[key]["id"],
                    level: this.currentStoreLv,
                    rewardTime: rewardTime
                }
            } else {
                resultList[key] = {
                    id: storeList[key]["id"],
                    level: storeList[key]["level"],
                    rewardTime: storeList[key]["rewardTime"]
                }
            }
        }
        return resultList;
    }
    showStoreInfo(active: boolean = true, scale: number) {
        let nodes = this.mainNodes;
        nodes.get("store_info").scale = 1 / scale;
        nodes.get("store_info").StopAllActions();
        nodes.get("store_info").RunAction(ezaction.fadeTo(active?0.1:0, active ? 255 : 0))
    }

    update(dt) {
        if (this.preReturnRewardTime != 0) {
            this.collect();
        }
    }

    getAimStr() {
        let str = "";
        switch (this.storeId) {
            case 1:
            case 2:
            case 3:
            case 4:
                str = "1";
                break;
            case 6:
            case 9:
                str = "2";
                break;
            case 5:
            case 7:
            case 8:
            case 10:
                str = "3";
                break;
        }
        return str;
    }

    onDestroy() {
        super.onDestroy()
        this.storeTag = null;
        this.priceMuti = null;
        this.clerkNode = null;
        this.currentTimeSpanTotal = null;
        this.currentAddMuti = null;
        this.returnReward = null;
        this._currentClerkLv = null;
        this.currentStoreLv = null;
        this.progresVal = null;
        this.preReturnRewardTime = null;
        this.isStopProgress = false;
        this.mainNodes = null;
        this.storeId = null;
        this.currentStoreInfo = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
    }

    showButtonEffect(btnNode: cc.Node, state: boolean) {
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        btnNode.color = color;
        if (btnComp) {
            btnComp.canTouch = state;
        }
        let func = (_node) => {
            if (_node.children.length == 0) {
                return;
            }
            for (let child of _node.children) {
                child.color = color;
                func(child);
            }

        }
        func(btnNode)
    }

}
