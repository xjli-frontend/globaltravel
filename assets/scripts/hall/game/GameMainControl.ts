
import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import ExToggleGroup from "../../core/ui/ExToggleGroup";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import SceneMap from "../../map/SceneMap";
import Config from "../../service/config/Config";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import { formatParams } from "../CalcTool";
import { storeSpeedLvConfigItem } from "../ThemeConfig";
import LandmarkComonent from "./adv/LandmarkComonent";
import LandmarkProgress from "./adv/LandmarkProgress";
import { MapControl } from "./effect/MapControl";
import PosterTip from "./effect/PosterTip";
import MainTaskTip from "./novice/MainTaskTip";
import { NoviceProgress } from "./novice/NoviceHandle";
import ShopComponent from "./ShopComponent";
import ShoppingComponent from "./ShoppingComponent";
import StoreComponent from "./StoreComponent";
import StoreOperation from "./StoreOperation";
import StoreUnLock from "./StoreUnLock";


let ce = ezaction.HCustomEase.create
("ce", "M0,0 C0.029,0.214 0.033,0.386 0.044,0.521 0.062,0.772 0.095,0.98 0.138,1.016 0.145,1.022 0.145,0.96 0.216,0.96 0.23,0.96 0.267,1 0.3,1 0.472,1 0.757,1 1,1")
const rollEaseOut = ezaction.ease.customEase(ce);

export class PropAddType {
    /** 道具翻2倍截止时间 */
    prop_5: number = 0;
    /** 道具翻3倍截止时间 */
    prop_6: number = 0;
    /** 道具翻4倍截止时间 */
    prop_7: number = 0;
    /** 道具翻5倍截止时间 */
    prop_8: number = 0;
    /** 升级消耗折扣30%截止时间 */
    prop_9: number = 0;
    /** 升级消耗折扣50%截止时间 */
    prop_10: number = 0;
    /** 升级消耗折扣80%截止时间 */
    prop_11: number = 0;
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameMainControl extends ComponentExtends {

    mainNodes: HashMap<string, cc.Node> = null;

    popup_container: cc.Node = null;

    propAddType: PropAddType = new PropAddType();

    storeOperation: StoreOperation = null;

    landMarkCom: LandmarkComonent = null;

    mainTaskTip:MainTaskTip = null;

    checkCollidPoints(touchLoc) {
        let nodes = ViewUtils.nodeTreeInfoLite(main.module.mainScene.node);
        if (cc.Intersection.pointInPolygon(touchLoc, nodes.get("adv_colid").getComponent(cc.PolygonCollider).world.points)) {
            return true;
        }
        return false;
    }

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.popup_container = this.mainNodes.get("popup_container");
        this.popup_container.active = false;
        // 设置自定义popup层
        gui.customPopup.setLayer(this.popup_container);

        this.mainNodes.get("muti_spr").active = false;
        this.mainNodes.get("cost_spr").active = false;
        this.mainNodes.get("adv_panel").active = false;
        this.mainNodes.get("main_time_lab").active = false;
        let safeArea: cc.Rect = cc.sys.getSafeAreaRect();
        this.mainNodes.get("top_panel_1").active = false;
        this.mainNodes.get("diamond_lab").getComponent(cc.Label).string = "";
        if (cc.winSize.height > safeArea.height) {
            this.mainNodes.get("top_panel_1").active = true;
            this.mainNodes.get("top").getComponent(cc.Widget).updateAlignment();
            this.mainNodes.get("left").getComponent(cc.Widget).top = this.mainNodes.get("top").height;
        }
        this.scheduleOnce(() => {
            this.mainNodes.get("main_tip").getComponent(cc.Widget).top = this.mainNodes.get("top").height+15;
            this.mainNodes.get("main_tip").width = cc.winSize.width;
            this.mainNodes.get("main_tip").getComponent(cc.Widget).updateAlignment();
        })
        this.popup_container.on(cc.Node.EventType.CHILD_REMOVED, () => {
            this.currentPop = "";
            this.mainNodes.get("bottom").active = true;
        }, this);
        // safeArea.width = safeArea.width || cc.winSize.width;
        // safeArea.height = safeArea.height || cc.winSize.height;
        // let widget = this.mainNodes.get("top").getComponent(cc.Widget);
        // if (widget) {
        //     widget.top = cc.winSize.height - safeArea.height;
        //     widget.updateAlignment()
        // }
    }

    preCredit: formatParams = { num: 0, numE: 0 };
    preCreditUi: formatParams = { num: 0, numE: 0 };
    preStoreList: any = null;
    onceEntry: boolean = true;
    isProtocol: boolean = false;
    initUserView() {
        let vm = main.module.vm;
        this.showButtonEffect(this.mainNodes.get("btn_task"), false);
        this.showButtonEffect(this.mainNodes.get("btn_shop"), false);
        this.showButtonEffect(this.mainNodes.get("btn_shopping"), false);
        this.showButtonEffect(this.mainNodes.get("btn_world"), false);
        this.showButtonEffect(this.mainNodes.get("btn_package"), false);
        this.mainTaskTip = this.mainNodes.get("main_tip").getComponent(MainTaskTip);
        let calcTool = main.module.calcTool;
        this.preCredit = vm.credit;
        this.preCreditUi = vm.credit;
        this.preLevel = vm.level;
        this.preNoviceProgress = vm.noviceProgress;
        this.mainNodes.get("lab_credit").getComponent(LabelChangeSymbol).num = vm.credit;
        this.mainNodes.get("red_point_package").active = false;
        this.mainNodes.get("red_point_gift").active = service.account.data.loginTime.indexOf(service.account.data.nowDate)==-1;
        this.mainNodes.get("red_point_ranking").active = service.account.data.loginTime.indexOf(service.account.data.nowDate)==-1;
        this.mainNodes.get("btn_gift").getComponent(sp.Skeleton).setAnimation(0, "animation", true);
        this.mainNodes.get("adv_").getComponent(sp.Skeleton).setAnimation(0, "animation", true);
        vm.watch("cityId", (val) => {
            if (val) {
                if (!this.onceEntry) {
                }
                this.onceEntry = false;
            }
        }, this);
        vm.watch("diamond", (val) => {
            this.mainNodes.get("diamond_lab").getComponent(cc.Label).string = val;
        }, this);
        vm.watch("fame", (val) => {
            if (val.num != vm.fame.num && val.numE != vm.fame.numE) {
                if (vm.fameList) {
                }
            }
            this.refreshShopFameRedPoint();
        }, this);
        vm.watch("credit", (credit: formatParams) => {
            if (credit) {
                let baseStr = calcTool.formatNum(credit).base;
                let preStr = calcTool.formatNum(this.preCredit).base;
                let baseGear = calcTool.formatNum(credit).gear;
                let preGear = calcTool.formatNum(this.preCredit).gear;

                if (Number(baseStr.toFixed(1)) != Number(preStr.toFixed(1)) || baseGear != preGear) {
                    this.refreshShopClerkRedPoint();
                    // cc.log(`余额显示`+credit.num,credit.numE);
                    this.mainNodes.get("lab_credit").getComponent(LabelChangeSymbol).num = credit;
                    this.refreshUpTip();
                    if (this.storeOperation && main.module.calcTool.compareLess(this.preCredit, credit)) {
                        this.storeOperation.setLvGear();
                    }
                }
                this.mainTaskTip.refreshMainProgressInfo();
                this.preCredit = credit;
                main.module.calcUiShow.calcPassBarrier();
            }
        }, this);
        vm.watch("refreshCreditUi", (credit: formatParams) => {
       
        }, this);
        vm.watch("isPass", (val:number) => {
            this.mainNodes.get("red_point_world").active = val == 1 && main.module.vm.noviceProgress.novice_7 == 1;
        }, this);
        vm.watch("storeList", (obj) => {
            if (obj) {
                if (!this.checkStoreListLv(this.preStoreList, obj)) {
                    return;
                }
                let storeArray = main.module.mainScene.storesNode;
                storeArray.children.forEach((store: cc.Node) => {
                    let com = store.getComponent(StoreComponent);
                    if (com) {
                        com.refreshUi(obj[com.storeTag]);
                        com.noviceStart(obj[com.storeTag]["level"]);
                    }
                })
                if (this.storeOperation) {
                    this.storeOperation.setBasePrice();
                    this.refreshStoreProgress(this.storeOperation.currentViewStoreId);
                }
                this.refreshShopClerkRedPoint();
                this.refreshStoresCollectSpeed();
                if (main.module.calcTool.compare(vm.credit, { num: 4, numE: 0 }) && vm.storeList["store_1"]["level"] == 1 && vm.noviceProgress.novice_3 == 0 && vm.level == 1) {//新手引导3
                    main.module.noviceHandle.noviceUpStore(() => {
                        let price = main.module.calcUiShow.calcTargetPrice(`store_1`, 1, 1);
                        let storeArray = main.module.mainScene.storesNode;
                        storeArray.getChildByName("store_1").getComponent(StoreComponent).upLvHandler(1, price, false, () => {
                            this.storeOperation.loadStoreBaseInfo()
                        });
                    });
                }
                this.mainTaskTip.refreshMainProgressInfo();
                main.module.mapNpcController.createNpcs(this.getUnlockStoreIds());
                this.preStoreList = obj;
            }
        }, this);
        vm.watch("clerkList", (obj) => {
            if (obj) {
                let storeArray = main.module.mainScene.storesNode;
                storeArray.children.forEach((store: cc.Node) => {
                    let com = store.getComponent(StoreComponent)
                    if (com && com.storeId == obj[`clerk_${com.storeId}`]["id"]) {
                        com.currentClerkLv = obj[`clerk_${com.storeId}`]["level"];
                    }
                })
                for (let key in obj) {
                    let clerk = obj[key];
                    main.module.gamedata.clerksIdLv.set(clerk["id"], clerk["level"]);
                }
                this.mainTaskTip.refreshMainProgressInfo();
                this.refreshShopClerkRedPoint();
                this.refreshStoresCollectSpeed();
            }
        }, this);
        vm.watch("fameList", (obj) => {
            if (obj) {
                for (let key in obj) {
                    let id = parseInt(obj[key]["id"])
                    let fame = obj[key];
                    main.module.gamedata.fameIdLv.set(id, fame["level"]);
                }
                this.preFameList = obj;
                this.refreshShopFameRedPoint();
                this.refreshStoresCollectSpeed();
            }
        }, this);
        vm.watch("goodsInfo", (obj) => {
            if (obj) {
                this.refreshStoresCollectSpeed();
            }
        }, this);

        vm.watch("level", (val) => {
            this.mainNodes.get("red_point_task").active = this.preLevel != val;
            if (this.preLevel != val) {
                this.supClickEvent(val);
                Message.dispatchEvent(AudioMessage.BGM);
                this.mainNodes.get("city_lab").getComponent(LanguageLabel).dataID = `ui_map_${val}`;
                let spf = cc.loader.getRes(`main/country/country_${val}`, cc.SpriteFrame);
                this.mainNodes.get("country").getComponent(cc.Sprite).spriteFrame = spf;
                // val = 3;
                val = val >9?9:val;
                main.module.mainScene.exchangeScene(val);
                main.module.mainScene.refreshStores(val);
            }
            let mapId = val;
            let pos = [cc.v2(530,-335),cc.v2(585,-330),cc.v2(640,-335),cc.v2(545,-530)];
            let advPos = pos[0];
            switch (val) {
                case 1:
                    mapId = 3;
                    break;
                case 2:
                    mapId = 1;
                    advPos = pos[0];
                    break;
                case 3:
                    mapId = 2;
                    advPos = pos[1];
                    break;
                case 4:
                case 5:
                case 6:
                    mapId = 3;
                    advPos = pos[2];
                    break;
                case 7:
                case 8:
                case 9:
                case 10:
                    mapId = 4;
                    advPos = pos[3];
                    break;
            }
            // this.setStoresActive(val);
            main.module.mainScene.storesNode.getComponent(SceneMap).initMapData(mapId);
            let advNode = main.module.mainScene.node.getChildByName("content").getChildByName("adv");
            advNode.active = val != 1;
            advNode.setPosition(advPos); 
            advNode.getChildByName("spine").getComponent(sp.Skeleton).setSkin(`db_${val}`);
            this.refreshGraden(val);
            this.preLevel = val;
        }, this);

        vm.watch("advCount", (val) => {
            let nodes = ViewUtils.nodeTreeInfoLite(this.landMarkCom.node.parent);
            let skeleton = nodes.get("adv_skeleton").getComponent(sp.Skeleton);
            skeleton.setAnimation(0, val >= 5 ? "reward_2" : "reward", true);
        }, this);

        vm.watch("sellNum", (val) => {
            this.mainTaskTip.refreshMainProgressInfo();
        }, this);

        vm.watch("npcNum", (val) => {
            this.mainTaskTip.refreshMainProgressInfo();
        }, this);

        vm.watch("mainProgress", (val) => {
            this.mainTaskTip.refreshMainProgressInfo();
        }, this);

        vm.watch("noviceProgress", (val: NoviceProgress) => {
            if (val) {
                this.mainNodes.get("btn_gift").active = val.novice_7 == 1 || main.module.vm.level > 1 || Config.query.gift === "1";
                this.mainNodes.get("btn_ranking").active = val.novice_7 == 1 || main.module.vm.level > 1;
                this.mainNodes.get("btn_adv").active = val.novice_7 == 1 || main.module.vm.level > 1;
                this.landMarkCom.node.parent.getChildByName("circle").active = val.novice_7 == 1 || main.module.vm.level > 1;
                this.showButtonEffect(this.mainNodes.get("btn_task"), val.novice_5 == 1 || main.module.vm.level > 1);
                this.showButtonEffect(this.mainNodes.get("btn_shop"), val.novice_4 == 1 || main.module.vm.level > 1 || main.module.vm.clerkList["clerk_1"]["level"] > 0);
                this.showButtonEffect(this.mainNodes.get("btn_shopping"), val.novice_6 == 1 || main.module.vm.level > 1);
                this.showButtonEffect(this.mainNodes.get("btn_world"), val.novice_7 == 1 || main.module.vm.level > 1);
                this.showButtonEffect(this.mainNodes.get("btn_package"), val.novice_9 == 1);
                this.showButtonEffect(this.mainNodes.get("btn_add"), main.module.vm.noviceProgress.novice_7 == 1 || main.module.vm.level > 1);
                this.mainTaskTip.refreshMainProgressInfo();
                this.preNoviceProgress = val;
            }
        }, this);

        vm.watch("propStorageList", (obj) => {
            if (obj) {
                for (let key in obj) {
                    let preData = this.prePropStorageList[key];
                    let currentData = obj[key];
                    // currentData["usedCount"] = 0;
                    if (!preData && currentData["totalCount"] > 0) {
                        main.module.gamedata.newPropId.push(currentData["pid"])
                    } else if (currentData["totalCount"] > preData["totalCount"]) {
                        main.module.gamedata.newPropId.push(currentData["pid"])
                    }
                }
                cc.log(main.module.gamedata.newPropId);
                this.prePropStorageList = obj;
            }
        }, this);
        vm.watch("taskList", (obj) => {
            if (obj) {
                if (!main.module.calcUiShow.checkTaskListChange(this.preTaskList, obj)) {
                    return;
                }
                let preTaskFinishNum = 0;
                for (let key in this.preTaskList) {
                    let data = this.preTaskList[key];
                    if (data["status"] == 2) {
                        preTaskFinishNum++;
                    }
                }
                let currentTaskFinishNum = 0;
                for (let key in obj) {
                    let data = obj[key];
                    if (data["status"] == 2) {
                        currentTaskFinishNum++;
                    }
                }
                if (currentTaskFinishNum > preTaskFinishNum) {
                    this.mainNodes.get("red_point_task").active = true;
                }
                this.preTaskList = obj;
            }
        }, this);
        vm.watch("propList", (obj) => {
            if (obj) {
                this.setPropEndTime(obj);
                this.refreshStoresCollectSpeed();
            }
        }, this);

        main.module.gameProtocol.requestPropStorageList((data) => {
            this.prePropStorageList = data["propStorageList"];
            vm.propStorageList = data["propStorageList"];
        })
        main.module.gameProtocol.requestTaskList((data) => {
            // this.preTaskList = data["taskList"];
            vm.taskList = data["taskList"];
        })

        this.mainTaskTip.entryNoviceNoFinish();
    }

    /** 刷新花园 */
    refreshGraden(level){
        let nodes = ViewUtils.nodeTreeInfoLite(main.module.mainScene.node);
        nodes.get("scene_bg").children.forEach((child)=>{
            let maxId = main.module.calcUiShow.checkLockStoreIdByLevel();
            child.active = parseInt(child.name.split("_")[1]) > maxId && level>1;
        })
    }


    set clerkChangeId(id){
        this._clerkChangeId = id;
        this.clerkChangeAnim();
    }

    get clerkChangeId(){
        return this._clerkChangeId;
    }
    _clerkChangeId = null;
    clerkChangeAnim(){
        let mapControl = main.module.mainScene.node.getChildByName("content").getComponent(MapControl);
        mapControl.node.StopAllActions();
        if(!this.clerkChangeId){
            mapControl.isMoving = false;
            return;
        }
        let clerkNode = main.module.mainScene.storesNode.getChildByName(`clerk_${this.clerkChangeId}`);
        mapControl.followTargetPos(clerkNode,0.5,()=>{
            let skeleton = clerkNode.getChildByName("clerk_up").getComponent(sp.Skeleton);
            skeleton.setCompleteListener((func)=>{
                if(func.animation.name == "reward_1"){
                    this._clerkChangeId = null;
                    mapControl.isMoving = false;
                }
            });
            skeleton.setAnimation(0,"reward_1",false);
        },true);
    }

    preFameList = null;//上一次的声望列表
    prePropStorageList = null;//上一次的背包列表
    preTaskList = null;//上一次的任务列表
    preLevel = null;//上一次的等级
    preNoviceProgress = null;//上一次的新手引导进度

    supClickEvent(level) {
        switch (level) {
            case 2:
                service.analytics.logEvent("unlock_laos_num", "", "")
                break;
            case 3:
                service.analytics.logEvent("unlock_thai_num", "", "")
                break;
            case 4:
                service.analytics.logEvent("unlock_cam_num", "", "")
                break;
            case 5:
                service.analytics.logEvent("unlock_mal_num", "", "")
                break;
            case 6:
                service.analytics.logEvent("unlock_sing_num", "", "")
                break;
            case 7:
                service.analytics.logEvent("unlock_ind_num", "", "")
                break;
            case 8:
                service.analytics.logEvent("unlock_jap_num", "", "")
                break;
            case 9:
                service.analytics.logEvent("unlock_kor_num", "", "")
                break;
            case 10:
                service.analytics.logEvent("unlock_chi_num", "", "")
                break;
            default:
                break;
        }
    }

    isPublicGetFame:boolean = false;
    update() {
        this.calcCurrentPropAdd();
        let cutDownTime = main.module.gamedata.getFameTime - main.module.calcUiShow.getSeverCurrentTime();
        let fameCount = main.module.themeConfig.getBuildingConfigById(main.module.vm.level).fameCount;
        this.isPublicGetFame = cutDownTime<=0 && main.module.gamedata.fameNpcNum >= fameCount;
        if(this.isPublicGetFame){
            this.mainNodes.get("red_point_clerk").active = true;
        }else{
            if(!this.isShopFamePoint && !this.isShopClerkPoint){
                this.mainNodes.get("red_point_clerk").active = false;
            }
        }
    }

    
    /** 打开StoreOperation处理按钮或UI状态*/
    openStoreOperationBtnState(isLock:boolean=false){
        this.mainTaskTip.lockMainTaskTip(isLock);
        this.showButtonEffect(this.mainNodes.get("btn_gift"), !isLock);
        this.showButtonEffect(this.mainNodes.get("btn_adv"), !isLock);
        this.showButtonEffect(this.mainNodes.get("btn_ranking"), !isLock);
        
        this.showButtonEffect(this.mainNodes.get("muti_spr"), !isLock);
        this.showButtonEffect(this.mainNodes.get("cost_spr"), !isLock);
    }

    refreshUpTip() {
        let storeArray = main.module.mainScene.storesNode;
        storeArray.children.forEach((store: cc.Node) => {
            let com = store.getComponent(StoreComponent);
            if (com) {
                com.refreshUpTip();
            }
        })
    }

    /**显示道具加成 */
    propAddInfo: HashMap<number, number> = new HashMap<number, number>();
    setPropEndTime(obj: any) {
        for (let key in obj) {
            this.propAddType[key] = obj[key]["endTime"]
            this.propAddInfo.set(obj[key]["pid"], obj[key]["endTime"]);
        }
    }

    /** 道具翻倍加成 */
    propMutiAdd: number = 1;
    /** 升级消耗扣减加成 */
    propCostAdd: number = 1;
    /** 主界面看广告翻倍  */
    mainAdMuti: number = 1;
    mainAdMutiEndTime: number = 0;
    calcCurrentPropAdd() {
        let keys = this.propAddInfo.keys();
        let currentDate = main.module.calcUiShow.getSeverCurrentTime();
        let mainMutiEndTime = main.module.gamedata.mainMutiEndTime;
        if (keys.length == 0 && (mainMutiEndTime == 0 || mainMutiEndTime <= currentDate)) {
            return;
        }
        main.module.calcUiShow.sort(keys);
        let muti = 1;
        let mutiEndTime = 0;
        let cost = 1;
        let costEndTime = 0;
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] < 9) {
                let _mutiEndTime = this.propAddInfo.get(keys[i]);
                if (_mutiEndTime > currentDate) {
                    let mutiValue = main.module.themeConfig.getPropConfigByTag(`add_${keys[i]}`).addValue[0]
                    muti *= mutiValue;
                    mutiEndTime = _mutiEndTime;
                }

            } else if (keys[i] > 8 && keys[i] < 12) {
                let _costEndTime = this.propAddInfo.get(keys[i]);
                if (_costEndTime > currentDate) {
                    let costValue = main.module.themeConfig.getPropConfigByTag(`add_${keys[i]}`).addValue[0]
                    cost *= costValue;
                    costEndTime = _costEndTime;
                }
            }
        }

        let mainAdMuti = 1;
        let _mainAdMutiEndTime = 0;
        if (mainMutiEndTime == 0 || mainMutiEndTime - currentDate <= 0) {
            mainAdMuti = 1;
            _mainAdMutiEndTime = 0;
        } else if (mainMutiEndTime - currentDate > 0) {
            mainAdMuti = 3;
            _mainAdMutiEndTime = mainMutiEndTime - currentDate;
        }
        this.mainNodes.get("muti_spr").active = muti != 1;
        this.mainNodes.get("cost_spr").active = cost != 1;
        this.mainNodes.get("main_time_lab").active = mainAdMuti != 1;
        // this.mainNodes.get("adv_panel").active = mainAdMuti != 1;
        if (muti != this.propMutiAdd || mainAdMuti != this.mainAdMuti) {
            this.propMutiAdd = muti;
            this.mainAdMuti = mainAdMuti;
            this.refreshStoresCollectSpeed();
            if (this.storeOperation) {
                this.storeOperation.setSpeedLab();
            }
            if (this.popup_container.getChildByName("shopping")) {
                this.popup_container.getChildByName("shopping").getComponent(ShoppingComponent).refreshList();
            }
            if (gui.popup.has(`popup/landmark_progress`)) {
                let node: cc.Node = gui.popup.$get(`popup/landmark_progress`)[0];
                if (node && node.getComponent(LandmarkProgress)) {
                    let coin_num = node.getChildByName("layout").getChildByName("coin_num");
                    let reward = main.module.calcUiShow.getTimeStageReward(5 * 60);
                    if (reward.num == 0) {
                        reward = { num: 1, numE: 3 };
                    }
                    coin_num.getComponent(LabelChangeSymbol).num = reward;
                }
            }
        }
        if (cost != this.propCostAdd) {
            this.propCostAdd = cost;
            this.refreshUpTip();
            if (this.storeOperation) {
                this.storeOperation.setBasePrice();
            }
            if (gui.popup.get(this.pop_storeunlock_id)) {
                let node = gui.popup.get(this.pop_storeunlock_id);
                node.getComponent(StoreUnLock).refreshLab();
            }
        }
        this.mainNodes.get("muti_num").getComponent(cc.Label).string = `x${muti}`;
        this.mainNodes.get("muti_lab").getComponent(cc.Label).string = main.module.calcUiShow.formatTime(mutiEndTime - currentDate);
        this.mainNodes.get("cost_num").getComponent(cc.Label).string = `${Math.floor(cost * 100)}%`;
        this.mainNodes.get("cost_lab").getComponent(cc.Label).string = main.module.calcUiShow.formatTime(costEndTime - currentDate);
        this.mainNodes.get("main_time_lab").getComponent(cc.Label).string = main.module.calcUiShow.formatTime(_mainAdMutiEndTime);
        this.mainAdMutiEndTime = _mainAdMutiEndTime;
    }
    pop_storeunlock_id: string = "";

    /** 检查店铺等级是否有变化 */
    checkStoreListLv(preList, currentList) {
        if (!preList) {
            return true;
        }
        for (let key in preList) {
            if (preList[key]["level"] != currentList[key]["level"]) {
                return true;
            }
            // if(preList[key]["rewardTime"] != currentList[key]["rewardTime"]){
            //     cc.log(`最近一次返奖时间`+currentList[key]["rewardTime"]);
            //     return true;
            // }
        }
        return false;
    }

    isNovicePackage: boolean = false;

    /** 是否显示声望升级界面 */
    shopFameIsShow() {
        return main.module.vm.noviceProgress.novice_9 > 0;
    }

    /** 刷新所有店铺的收集速度lab */
    refreshStoresCollectSpeed() {
        let vm = main.module.vm;
        let mutiAdd = this.propMutiAdd * this.mainAdMuti * (main.module.themeConfig.getBuildingConfigById(vm.level).multi);
        if (vm.storeList && vm.clerkList && vm.fameList && vm.goodsInfo) {
            let collectSpeedData = main.module.calcUiShow.calcCollectSpeed(mutiAdd);
            let storeArray = main.module.mainScene.storesNode;
            storeArray.children.forEach((store: cc.Node) => {
                let com = store.getComponent(StoreComponent);
                if (com) {
                    com.setSpeedLab(collectSpeedData.get(com.storeTag));
                }
            })
        }
    }

    /** 显示storeId商铺的进度条节点，隐藏其它的 默认为全显示*/
    refreshStoreProgress(storeId: number = -1) {
        let storeArray = main.module.mainScene.storesNode;
        storeArray.children.forEach((store: cc.Node) => {
            let com = store.getComponent(StoreComponent);
            if (com) {
                let maxLv = main.module.themeConfig.getStoreMaxLvById(com.storeId);
                let nextPrice = main.module.calcUiShow.calcTargetPrice(com.storeTag, com.currentStoreLv, 1);
                let active = main.module.calcTool.compare(main.module.vm.credit, nextPrice) && com.currentStoreLv < maxLv;
                if ((com.storeId == storeId || storeId == -1) && com.currentStoreLv > 0) {
                    com.mainNodes.get("btn_progress").active = true;
                } else {
                    com.mainNodes.get("btn_progress").active = false;
                }
                if ((com.storeId == storeId || storeId == -1) && com.currentStoreLv == 0) {
                    com.mainNodes.get("btn_lock").active = true;
                } else {
                    com.mainNodes.get("btn_lock").active = false;
                }
            }
        })
    }

    cacheMainMutiTime() {
        let maxEndTime = main.module.calcUiShow.getSeverCurrentTime() + 12 * 60 * 60 * 1000;
        let currentDate = main.module.calcUiShow.getSeverCurrentTime()
        if (main.module.gamedata.mainMutiEndTime == 0 || main.module.gamedata.mainMutiEndTime <= currentDate) {
            main.module.gamedata.mainMutiEndTime = currentDate + 2 * 60 * 60 * 1000;
        } else {
            main.module.gamedata.mainMutiEndTime += 2 * 60 * 60 * 1000;
        }
        if (main.module.gamedata.mainMutiEndTime >= maxEndTime) {
            main.module.gamedata.mainMutiEndTime = maxEndTime;
        }
        main.module.gameProtocol.writeCacheData("mainMutiEndTime", main.module.gamedata.mainMutiEndTime as Object, (data) => {
            cc.log(`mainMutiEndTime缓存写入成功`);
        })
    }

    openMainPop(name: string, callback?: Function) {
        Message.dispatchEvent(AudioMessage.EFFECT, "window");
        if(this.node.parent.getChildByName("content").getComponent(MapControl).isMoving){
            return;
        }
        if(this.storeOperation){
            this.storeOperation.currentViewStoreId = -1;
            this.storeOperation = null;
        }
        let pathEnd = name.split("_")[1];
        if (this.currentPop == pathEnd) {
            return;
        }
        gui.customPopup.clear();
        this.currentPop = pathEnd;
        this.mainNodes.get("bottom").active = pathEnd != "world";
        this.popup_container.active = true;
        service.prompt.netInstableOpen();
        let popViewParams: PopViewParams = {
            modal: true,
            touchClose:false,
            opacity:150,
            // 节点添加动画
            onAdded: (node, params) => {
                service.prompt.netInstableClose();
                this.currentPop = pathEnd;
                node.x = 0;
                if(pathEnd == "credit" || pathEnd == "fame" || pathEnd == "setting"){
                    let world = this.mainNodes.get("btn_credit").parent.convertToWorldSpaceAR(this.mainNodes.get("btn_credit").getPosition());
                    let space = this.popup_container.convertToNodeSpaceAR(world);
                    node.y = space.y - node.height/2;
                    node.RunAction(ezaction.moveTo(0.2, { y: 30 }));
                    callback && callback();
                }else{
                    node.y = -cc.winSize.height/2;
                    node.RunAction(ezaction.moveTo(0.2, { y: 30 }));
                    callback && callback();
                }
            },
            // 节点删除动画
            onBeforeRemove: (node, next) => {
                this.currentPop = "";
                node.destroy();
                next();
            }
        }
        gui.customPopup.add(`popup/${pathEnd}`, {}, popViewParams)
    }

    openStoreOperation(storeId:number=-1){
        if(this.node.parent.getChildByName("content").getComponent(MapControl).isMoving){
            return;
        }
        if (this.currentPop == "operation") {
            return;
        }
        gui.popup.clear();
        gui.customPopup.clear();
        this.currentPop = "operation";
        this.mainNodes.get("bottom").active = true;
        this.popup_container.active = true;
        service.prompt.netInstableOpen();
        let popViewParams: PopViewParams = {
            touchClose:false,
            // 节点添加动画
            onAdded: (node, params) => {
                this.storeOperation = node.getComponent(StoreOperation);
                this.currentPop = "operation";
                node.x = 0;
                node.y = -cc.winSize.height/2;
                service.prompt.netInstableClose();
                node.RunAction(ezaction.moveTo(1, { y: 30}).easing(rollEaseOut)).onStoped(()=>{
                });
            },
            onRemoved:()=>{
                this.currentPop = "";
                this.storeOperation = null;
            }
        }
        gui.customPopup.add(`main/store_operation`, {contentNode:this.node.parent.getChildByName("content"),
            storesNode:main.module.mainScene.storesNode,storeId:storeId}, popViewParams)
    }

    currentPop: string = "";
    onTouchHandler(event: cc.Event.EventTouch) {
        let mapControl = main.module.mainScene.mapControl;
        if (mapControl.isMoving) {
            if (this.node._touchListener) {
                this.node._touchListener.setSwallowTouches(false);
            }
            return;
        }
        switch (event.target.name) {
            case "btn_setting":
            case "btn_ranking":
            case "btn_shopping":
            case "btn_shop":
            case "btn_task":
            case "btn_package":
            case "btn_gift":
            case "btn_world": {
                if (event.target.getComponent(ButtonEffect) && !event.target.getComponent(ButtonEffect).canTouch) {
                    return;
                }
                this.openMainPop(event.target.name);
                break;
            }
            case "btn_credit": {
                // let popViewParams: PopViewParams = {
                //     touchClose: true,
                //     modal: false,
                //     onAdded: (node, params) => {
                //     },
                //     onRemoved: (node, next) => {
                //     }
                // }
                // gui.popup.add(`popup/fame_result`, {  },popViewParams);
                this.openMainPop("btn_credit");
                // main.module.noviceHandle.novicePackage(this.mainNodes.get("btn_package"));
                break;
            }
            case "pic_diamond":
            case "btn_add": {
                if (main.module.vm.noviceProgress.novice_7 == 0 && main.module.vm.level == 1) {
                    return;
                }
                this.openMainPop("btn_gift");
                break;
            }
            case "btn_adv": {
                if (event.target.getComponent(ButtonEffect) && !event.target.getComponent(ButtonEffect).canTouch) {
                    return;
                }
                let popViewParams: PopViewParams = {
                    touchClose: true,
                    modal: true,
                    opacity: 120,
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
                gui.popup.add(`popup/adv_main_muti`, { mainControl: this }, popViewParams)
                break;
            }
        }
    }

    openMenu(active: boolean) {
        this.mainNodes.get("menu").active = active;
    }

    /** 获取已解锁店铺id */
    getUnlockStoreIds() {
        let ids = [];
        let storeList = main.module.vm.storeList;
        for (let key in storeList) {
            if (storeList[key]["level"] > 0) {
                ids.push(storeList[key]["id"] + "")
            }
        }
        return ids;
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

    /** 打开里程碑弹窗提示 */
    openPosterTip(config: storeSpeedLvConfigItem) {
        let prefab: cc.Prefab = cc.loader.getRes(`main/poster_finish`, cc.Prefab);
        let _node: cc.Node = cc.instantiate(prefab);
        let pam = { id: config.id, type: config.type, value: config.value }
        _node.getComponent(PosterTip).setData(pam);
        _node.parent = this.node.getChildByName("main");
        let width = this.node.getChildByName("main").width;
        let height = this.node.getChildByName("main").height;
        _node.x = -width;
        _node.y = 480;
        _node.RunAction(ezaction.moveTo(0.5, { x: -width / 2 })).onStoped(() => {
            if (config.level == 25 && main.module.vm.noviceProgress.novice_4 == 0) {
            }
        })
        Message.dispatchEvent(AudioMessage.EFFECT, "shop_warn");//里程碑
    }

    /** 打开店铺 */
    openShop(toggle: number, callback?: Function) {
        this.openMainPop("btn_shop", () => {
            let popNode = this.popup_container.getChildByName("shop");
            this.scheduleOnce(() => {
                popNode.getComponent(ShopComponent).scollviewSwitch(toggle == 0)
                popNode.getComponent(ShopComponent).mainNodes.get("toggle_group").getComponent(ExToggleGroup).setIndex(toggle);
                callback && callback();
            })
        });
    }

    /** 余额更新特效 */
    playCreditEffect(changeNum: formatParams, callback?: Function) {
        Message.dispatchEvent(AudioMessage.EFFECT, "additional_coin");
        let worldPos = this.mainNodes.get("lab_credit").parent.convertToWorldSpaceAR(this.mainNodes.get("lab_credit").getPosition());
        let spacePos = this.mainNodes.get("effect").convertToNodeSpaceAR(worldPos);
        let credit_skeletonNode = new cc.Node();
        let credit_skeleton = credit_skeletonNode.addComponent(sp.Skeleton);
        credit_skeleton.skeletonData = cc.loader.getRes(`main/skeleton/offline_gold`, sp.SkeletonData);//金币spine
        credit_skeletonNode.parent = this.mainNodes.get("effect");
        credit_skeletonNode.setPosition(spacePos);
        let effect_prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/credit_skeleton`, cc.Prefab);//光圈和粒子
        let effectNode: cc.Node = cc.instantiate(effect_prefab);
        effectNode.parent = this.mainNodes.get("effect");
        effectNode.x = 0;
        effectNode.y = 0;
        let labNode = effectNode.getChildByName("lab");
        labNode.scale = 0;
        labNode.getComponent(LabelChangeSymbol).num = changeNum;
        labNode.RunAction(ezaction.scaleTo(0.5, { scale: 3 })).onStoped(() => {
            labNode.RunAction(ezaction.moveTo(0.5, { y: spacePos.y - 20, delay: 1 })).onStoped(() => {
                labNode.active = false;
                effectNode.destroy();
                callback && callback(changeNum);
            })
            labNode.RunAction(ezaction.fadeTo(0.5, 50, { delay: 1 })).onStoped(() => {
            })
        });
        let _node: cc.Node = null;
        credit_skeleton.setEventListener((entry, event) => {
            if (event.data.name == "1") {
                let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/credit_effect`, cc.Prefab);
                _node = cc.instantiate(prefab);
                _node.parent = this.mainNodes.get("effect");
                _node.setPosition(spacePos);
            }
        });
        credit_skeleton.setCompleteListener(() => {
            credit_skeletonNode.destroy();
        })
        credit_skeleton.setAnimation(0, "reward", false);
    }


    /** 看视频：钻石更新特效 */
    playAdDiamondEffect(callback?: Function) {
        Message.dispatchEvent(AudioMessage.EFFECT, "additional_gem");
        let worldPos = this.mainNodes.get("diamond_panel").parent.convertToWorldSpaceAR(this.mainNodes.get("diamond_panel").getPosition());
        let spacePos = this.mainNodes.get("effect").convertToNodeSpaceAR(worldPos);
        let ad_diamond = new cc.Node();
        let diamond_skeleton = ad_diamond.addComponent(sp.Skeleton);
        diamond_skeleton.premultipliedAlpha = false;
        diamond_skeleton.skeletonData = cc.loader.getRes(`main/skeleton/offline_zuanshi`, sp.SkeletonData);//金币spine
        ad_diamond.parent = this.mainNodes.get("effect");
        ad_diamond.setPosition(spacePos);
        let effect_prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/credit_skeleton`, cc.Prefab);//光圈和粒子
        let effectNode: cc.Node = cc.instantiate(effect_prefab);
        effectNode.parent = this.mainNodes.get("effect");
        effectNode.x = 0;
        effectNode.y = 0;
        effectNode.getChildByName("lab").active = false;;
        this.scheduleOnce(() => {
            effectNode.destroy();
        }, 3)
        let _node: cc.Node = null;
        diamond_skeleton.setEventListener((entry, event) => {
            if (event.data.name == "1") {
                let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/credit_effect`, cc.Prefab);
                _node = cc.instantiate(prefab);
                _node.parent = this.mainNodes.get("effect");
                _node.setPosition(spacePos);
                callback && callback();
            }
        });
        diamond_skeleton.setCompleteListener(() => {
            ad_diamond.destroy();
        })
        diamond_skeleton.setAnimation(0, "reward", false);
    }

    /** 任务领取：钻石更新特效 */
    playDiamondffect(callback?: Function) {
        Message.dispatchEvent(AudioMessage.EFFECT, "additional_coin");
        let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/diamond_effect`, cc.Prefab);
        let worldPos = this.mainNodes.get("diamond_panel").parent.convertToWorldSpaceAR(this.mainNodes.get("diamond_panel").getPosition());
        let spacePos = this.mainNodes.get("effect").convertToNodeSpaceAR(worldPos);
        let _node: cc.Node = cc.instantiate(prefab);
        _node.setPosition(spacePos);
        _node.parent = this.mainNodes.get("effect");
        this.scheduleOnce(() => {
            let prefab2: cc.Prefab = cc.loader.getRes(`main/effect_prefab/diamond_effect2`, cc.Prefab);
            let _node2: cc.Node = cc.instantiate(prefab2);
            _node2.parent = this.mainNodes.get("effect");
            _node2.setPosition(spacePos);
        }, 0.7)
        this.scheduleOnce(() => {
            callback && callback();
        }, 1.2)
    }

    clearContainer() {
        this.mainNodes.get("effect").children.forEach((child) => {
            child.destroy();
        })
    }

    /** 任务领取： 背包更新特效 */
    playPackageffect(callback?: Function) {
        Message.dispatchEvent(AudioMessage.EFFECT, "additional_coin");
        let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/package_effect`, cc.Prefab);
        let worldPos = this.mainNodes.get("btn_package").parent.convertToWorldSpaceAR(this.mainNodes.get("btn_package").getPosition());
        let spacePos = this.mainNodes.get("effect").convertToNodeSpaceAR(worldPos);
        let _node: cc.Node = cc.instantiate(prefab);
        _node.setPosition(spacePos);
        _node.parent = this.mainNodes.get("effect");
        this.scheduleOnce(() => {
            let prefab2: cc.Prefab = cc.loader.getRes(`main/effect_prefab/package_effect2`, cc.Prefab);
            let _node2: cc.Node = cc.instantiate(prefab2);
            _node2.parent = this.mainNodes.get("effect");
            _node2.setPosition(spacePos);
        }, 0.7)
        this.scheduleOnce(() => {
            callback && callback();
            if(main.module.vm.noviceProgress.novice_9 == 1){
               this.mainNodes.get("red_point_package").active = true;
            }
        }, 1.2)
    }

    /** 有店员可升级就显示红点 */
    isShopClerkPoint: boolean = false;
    isShopFamePoint: boolean = false;
    refreshShopClerkRedPoint() {
        let clerkKeys = main.module.gamedata.clerksIdLv.keys();
        this.mainNodes.get("red_point_clerk").active = false;
        this.isShopClerkPoint = false;
        let unLockShop = false;
        let clerkList = main.module.vm.clerkList;
        if(main.module.vm.mainProgress.progress_1 == 0){
            return ;
        }
        for (let key in clerkList) {
            if (clerkList[key]["level"] >= 1) {
                unLockShop = true;
                break;
            }
        }
        if (main.module.vm.level > 1) {
            unLockShop = true;
        }
        if (main.module.calcTool.compare(main.module.vm.credit, { num: 200, numE: 0 })) {
            unLockShop = true;
        }
        clerkKeys.forEach((key) => {
            let config = main.module.themeConfig.getClerkConfigBytagLv(`clerk_${key}`, main.module.gamedata.clerksIdLv.get(key) + 1);
            let active = false;
            if (config) {
                active = main.module.calcTool.compare(main.module.vm.credit, { num: config.clerkPrice, numE: config.clerkPriceE });
            }
            if (key == 11 || key == 12) {
                if (!!active && unLockShop) {
                    this.isShopClerkPoint = true;
                }
            } else {
                if (!!active && main.module.gamedata.storesIdLv.get(key) > 0 && unLockShop) {
                    this.isShopClerkPoint = true;
                }
            }

        })
        if (this.isShopClerkPoint) {
            this.mainNodes.get("red_point_clerk").active = true;
        } else if (this.isShopFamePoint) {
            this.mainNodes.get("red_point_clerk").active = true;
        }

    }

    refreshShopFameRedPoint() {
        let fameKeys = main.module.gamedata.fameIdLv.keys();
        this.isShopFamePoint = false;
        if(!this.shopFameIsShow()){
            return ;
        }
        fameKeys.forEach((key) => {
            let config = main.module.themeConfig.getFameConfigByTagLv(`fame_${key}`, main.module.gamedata.fameIdLv.get(key) + 1);
            let active = false;
            if (config) {
                active = main.module.calcTool.compare(main.module.calcTool.calcDivideNum(main.module.vm.fame, { num: 1, numE: 2 }), { num: config.price, numE: config.priceE });
            }
            if (key == 11) {
                if (!!active && this.shopFameIsShow()) {
                    this.isShopFamePoint = true;
                }
            } else {
                if (!!active && this.shopFameIsShow()) {
                    this.isShopFamePoint = true;
                }
            }
        })
        
        if (this.isShopFamePoint) {
            this.mainNodes.get("red_point_clerk").active = true;
        }
        if (this.isShopFamePoint) {
            this.mainNodes.get("red_point_clerk").active = true;
        }
    }

    unwatchTargetAll() {
        main.module.vm.unwatchTargetAll(this);
    }

    onDestroy() {
        // 清理自定义popup
        gui.customPopup.clear();
        super.onDestroy()
        let vm = main.module.vm;
        vm.unwatchTargetAll(this)
        this.mainNodes = null;
        this.popup_container = null;
        this.propAddType = null;
        this.storeOperation = null;
        this.preCredit = null;
        this.preCreditUi = null;
        this.preStoreList = null;
        this.onceEntry = null;
        this.isProtocol = null;
        this.propAddInfo = null;
        this.propMutiAdd = null;
        this.propCostAdd = null;
        this.isNovicePackage = null;
        this.preFameList = null;
        this.prePropStorageList = null;
        this.preTaskList = null;
        this.preLevel = null;
        this.currentPop = null;
        this.isShopClerkPoint = null;
        this.isShopFamePoint = null;
        this.landMarkCom = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
    }
}
