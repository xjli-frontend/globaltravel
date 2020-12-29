
import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import ExToggleGroup from "../../core/ui/ExToggleGroup";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { AsyncQueue } from "../../core/util/AsyncQueue";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import { formatParams } from "../CalcTool";
import { TaskType } from "../CalcUiShow";
import { clerkLevelConfigItem, fameLvConfigItem } from "../ThemeConfig";
import LabTouchFont from "./effect/LabTouchFont";
import FameConfirm from "./FameConfirm";
import { default as ShopAssistantListItem, default as ShopClerkListItem } from "./ShopClerkListItem";
import ShopPrestigeListItem from "./ShopPrestigeListItem";

const { ccclass, property } = cc._decorator;

interface calcQuickCountParams {
    price: formatParams,
    id: number,
    canUpLv?
}

@ccclass
export default class ShopComponent extends ComponentExtends {

    mainNodes: HashMap<string, cc.Node> = null;

    @property(cc.Node)
    shopItemNode: cc.Node = null;

    @property(cc.Node)
    prestigeItemNode: cc.Node = null;

    clerkQuickParams: HashMap<number, number> = new HashMap<number, number>();

    fameQuickParams: HashMap<number, number> = new HashMap<number, number>();

    onLoad() {
        service.analytics.logEvent("upgrade_click_open", "", "")
        this.mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        // this.node.active = false;
        this.refreshBtnState();
        this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).toggleCallback = (toggle) => {
            Message.dispatchEvent(AudioMessage.EFFECT, "ui_2");
            this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).getItems().forEach((child) => {
                child.getChildByName("checkmark").active = toggle.node.name == child.name;
            })
            let suf = toggle.node.name.replace(/[^\d]+/, "");
            if (suf == "1") {
                this.refreshClerkList();
                this.isShowQuickPanel();
            } else if (suf == "2") {
                service.analytics.logEvent("upgrade_click_prestige", "", "")
                this.refreshFameList()
                this.isShowQuickPanel();
            }
        }
        this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).setIndex(0);
        this.entryClerkList = main.module.vm.clerkList;
        this.loadShopClerkList()
        this.loadPrestigeList();
        this.initActive();
        this.isShowQuickPanel();
        this.scollviewSwitch(true)
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
    }

    entryClerkList = null;

    initActive() {
        if (this.clerkQuickParams.size > 1 || (this.clerkQuickParams.size == 1 && this.clerkQuickParams.values()[0] > 1)) {
            this.initClerkActive = true;
            this.mainNodes.get("salesman").height = 780;
            this.mainNodes.get("salesman").y = -90;
        } else {
            this.initClerkActive = false;
            this.mainNodes.get("salesman").height = 930;
            this.mainNodes.get("salesman").y = -15;
        }
        if (this.fameQuickParams.size > 1 || (this.fameQuickParams.size == 1 && this.fameQuickParams.values()[0] > 1)) {
            this.initFameActive = true;
            this.mainNodes.get("prestige").height = 440;
            this.mainNodes.get("prestige").y = -260;
        } else {
            this.initFameActive = false;
            this.mainNodes.get("prestige").height = 600;
            this.mainNodes.get("prestige").y = -180;
        }
    }

    /** 初次进来时的值 */
    initClerkActive: boolean = false;
    initFameActive: boolean = false;
    isShowQuickPanel() {
        let toggleIndex = this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).getIndex();
        this.mainNodes.get("explain_clerk").active = this.initClerkActive && toggleIndex == 0;
        this.mainNodes.get("explain_fame").active = this.initFameActive && toggleIndex == 1;
        this.mainNodes.get("public_get").active = toggleIndex == 1;
    }

    clerkItemPool: Array<cc.Node> = [];
    fameItemPool: Array<cc.Node> = [];
    /** 加载店员列表 */
    loadShopClerkList() {
        let vm = main.module.vm;
        let salesmanNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("salesman"));
        let itemParent = salesmanNodes.get("content");
        this.shopItemNode.active = true;
        let nextCall = AsyncQueue.excuteTimes(12, () => {
            // this.node.active = true;
        })
        for (let key in vm.clerkList) {
            let id = parseInt(vm.clerkList[key]["id"])
            let clerk = vm.clerkList[key];
            let params = this.getUpClerkLv(key, id, clerk["level"])
            if (!params) {
                params = {
                    clerkTag: key,
                    clerkId: id,
                    clerkLevel: clerk["level"] + 1
                }
            }
            if (id - 1 == 0) {
                let comp = this.shopItemNode.getComponent(ShopAssistantListItem);
                comp.setData(params, nextCall);
                if (!comp.clickCallback) {
                    comp.clickCallback = this.clerkItemClickHandler.bind(this);
                }
                this.shopItemNode.name = id + "";
                this.clerkItemPool.push(this.shopItemNode);
            } else {
                let _itemNode = cc.instantiate(this.shopItemNode);
                _itemNode.parent = itemParent;
                let comp = _itemNode.getComponent(ShopAssistantListItem);
                comp.setData(params, nextCall);
                if (!comp.clickCallback) {
                    comp.clickCallback = this.clerkItemClickHandler.bind(this);
                }
                _itemNode.name = id + "";
                this.clerkItemPool.push(_itemNode);
            }
        }
        this.refreshBtnState();
        this.calcCountClerkPrice();

    }

    /** 刷新店员列表 */
    refreshClerkList() {
        this.scollviewSwitch(true);
        let vm = main.module.vm;
        let salesmanNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("salesman"));
        let itemParent = salesmanNodes.get("content");
        itemParent.children.forEach((clerkNode) => {
            let comp: ShopAssistantListItem = clerkNode.getComponent(ShopAssistantListItem);
            let clerkTag = comp.params.clerkTag;
            let clerkId = comp.params.clerkId;
            let clerkData = vm.clerkList[clerkTag];
            let params = this.getUpClerkLv(clerkTag, clerkId, clerkData["level"])
            if (!params) {
                params = {
                    clerkTag: clerkTag,
                    clerkId: clerkId,
                    clerkLevel: clerkData["level"] + 1
                }
            }
            comp.setData(params);
        })
    }


    changeClerkList(lvUpParams: HashMap<number, number>) {
        let keys = lvUpParams.keys();
        let clerkList = main.module.vm.clerkList;
        let resultList: Object = {};
        for (let key in clerkList) {
            if (keys.indexOf(clerkList[key]["id"]) != -1) {
                resultList[key] = {
                    id: clerkList[key]["id"],
                    level: clerkList[key]["level"] + lvUpParams.get(clerkList[key]["id"])
                }
            } else {
                resultList[key] = {
                    id: clerkList[key]["id"],
                    level: clerkList[key]["level"]
                }
            }
        }
        return resultList;
    }


    clerkItemClickHandler(params: clerkLevelConfigItem) {
        let vm = main.module.vm;
        if (!main.module.calcTool.compare(vm.credit, { num: params.clerkPrice, numE: params.clerkPriceE })) {
            cc.warn("升级店员余额不足")
            gui.notify.show("lack_credit");
            return;
        }
        let lvUpParams: HashMap<number, number> = new HashMap<number, number>();
        lvUpParams.set(params.clerkId, 1)
        this.clerkLvUp(lvUpParams, {
            num: params.clerkPrice,
            numE: params.clerkPriceE
        });
    }

    canClickClerkBtn:boolean =  true;
    canClickFameBtn:boolean =  true;
    clerkClickQuickBtnHandler(event: cc.Event.EventTouch) {
        if (!event.target.getComponent(ButtonEffect).canTouch) {
            return;
        }
        service.analytics.logEvent("upgrade_click_quickemp", "", "")
        if (this.clerkQuickParams.size > 0) {
            Message.dispatchEvent(AudioMessage.EFFECT, "shop_batch");
            this.clerkLvUp(this.clerkQuickParams, this.currentClerkQuickNum);
        }
    }

    clerkLvUp(lvUpParams: HashMap<number, number>, subNum: formatParams) {
        cc.log("canClickClerkBtn"+this.canClickClerkBtn);
        let vm = main.module.vm;
        let _clerkList = this.changeClerkList(lvUpParams)
        vm.clerkList = _clerkList;
        main.module.gameProtocol.sendClerkList(_clerkList, (data) => {
        })
        main.module.calcUiShow.refreshCredit({
            num: -subNum.num,
            numE: subNum.numE
        }, () => {
            this.refreshClerkList();
            this.refreshBtnState();
            this.calcCountClerkPrice();
        }, true)

        let _taskListUpLv = this.changTaskListOnUpLvClerk(lvUpParams);

        main.module.gameProtocol.sendTaskList(_taskListUpLv, (obj) => {
            vm.taskList = _taskListUpLv;
        })
    }

    changTaskListOnUpLvClerk(lvUpParams: HashMap<number, number>) {
        let values = lvUpParams.values();
        let count = 0;
        values.forEach((value) => {
            count += value;
        })
        return main.module.calcUiShow.changeTaskListByTypeCount(TaskType.CLERK_UP, count);
    }

    changTaskListOnUpLvFame(lvUpParams: HashMap<number, number>) {
        let values = lvUpParams.values();
        let count = 0;
        values.forEach((value) => {
            count += value;
        })
        return main.module.calcUiShow.changeTaskListByTypeCount(TaskType.FAME_UP, count);
    }

    /** 获取currentLv + targetGear等级的店员显示信息 targetGear默认等于1*/
    getUpClerkLv(tag: string, id: number, currentLv: number, targetGear: number = 1) {
        let clerkLvInfo = main.module.themeConfig.getClerkConfigBytagLv(tag, currentLv + targetGear);
        if (!clerkLvInfo) {
            cc.warn(`${tag}标签或者${currentLv + targetGear}}【找不到对应配置】或已到最大等级`)
            return;
        }
        return clerkLvInfo;
    }
    /** 当前快速升级店员累计值 */
    currentClerkQuickNum: formatParams = null;
    /** 计算快速升级店员的钱 */
    calcCountClerkPrice(useAction: boolean = true,isSort:boolean=true) {
        let sortFunc = (_calcParamArray) => {
            _calcParamArray.sort((a: calcQuickCountParams, b: calcQuickCountParams) => {
                if (!main.module.calcTool.compare(a.price, b.price)) {
                    return -1;
                }
                if (main.module.calcTool.compare(a.price, b.price)) {
                    return 1;
                }
                return 0;
            });
        }
        let _keys = main.module.gamedata.clerksIdLv.keys();
        let keys = [];
        _keys.forEach((key) => {//去掉未解锁的店员
            if (main.module.gamedata.storesIdLv.get(key) != 0) {
                keys.push(key);
            }
        })
        keys.push(11, 12);
        let result: HashMap<number, number> = new HashMap<number, number>();
        let gear = 0;
        let countLab = {
            num: 0,
            numE: 0,
        }
        let calc = (_credit: formatParams) => {
            if (keys.length == 0) {
                return;
            }
            gear++
            let calcParamArray: Array<calcQuickCountParams> = [];
            keys.forEach((key) => {
                let nextLv = main.module.gamedata.clerksIdLv.get(key) + gear;
                let config = main.module.themeConfig.getClerkConfigBytagLv(`clerk_${key}`, nextLv);
                if (config) {
                    let param: calcQuickCountParams = {
                        price: {
                            num: config.clerkPrice,
                            numE: config.clerkPriceE
                        },
                        id: key,
                        canUpLv: gear
                    }
                    calcParamArray.push(param);
                } else {
                    keys.splice(keys.indexOf(key), 1);
                }
            })
            sortFunc(calcParamArray);
            let count: formatParams = {
                num: 0,
                numE: 0
            }
            calcParamArray.forEach((val) => {
                let _compare = main.module.calcTool.calcAddNum(count, val.price);
                if (main.module.calcTool.compare(_credit, _compare)) {
                    count = main.module.calcTool.calcAddNum(count, val.price);
                    result.set(val.id, val.canUpLv);
                } else {
                    keys.splice(keys.indexOf(val.id), 1);
                }
            })
            countLab = main.module.calcTool.calcAddNum(countLab, count);
            let credit = main.module.calcTool.calcMinusNum(_credit, count);
            calc(credit);
        }
        calc(main.module.vm.credit);
        this.currentClerkQuickNum = countLab;
        this.mainNodes.get("clerk_lab").getComponent(LabelChangeSymbol).num = countLab;
        this.showButtonEffect(this.mainNodes.get("btn_quick_clerk"), result.size > 0);
        this.clerkQuickParams = result;

        if(!isSort)return;
        let salesmanNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("salesman"));
        let itemParent = salesmanNodes.get("content");

        let priceArr: Array<calcQuickCountParams> = [];
        itemParent.children.forEach((child) => {
            let params = child.getComponent(ShopClerkListItem).params;
            let _p = {
                price: {
                    num: params.clerkPrice,
                    numE: params.clerkPriceE
                },
                id: params.clerkId
            }
            priceArr.push(_p);
        })
        sortFunc(priceArr);
        let ids = [];
        priceArr.forEach((val) => {
            ids.push(val.id);
        })
        let childarr = itemParent.children
        childarr.forEach((child) => {
            let pam = child.getComponent(ShopClerkListItem).params;
            if (pam.clerkLevel > main.module.themeConfig.getClerkMaxLvById(pam.clerkId)) {
                child.zIndex = 50 + pam.clerkId;
            } else if (pam.clerkLevel == 1 && main.module.gamedata.storesIdLv.get(pam.clerkId) == 0) {
                child.zIndex = 100 + pam.clerkId;
            } else {
                child.zIndex = ids.indexOf(child.getComponent(ShopClerkListItem).params.clerkId) + pam.clerkId / 100;
            }
        })
        // Add by howe 增加列表item动画
        childarr.sort((a, b) => {
            return a.zIndex - b.zIndex;
        })
        let itemHeight = childarr[0].height;
        let totalHeight = 15 + childarr.length * (10 + itemHeight);
        itemParent.height = totalHeight;
        for (let i = 0; i < childarr.length; i++) {
            let childNode = childarr[i];
            let cy = childNode.y;
            let ty = -15 - i * (itemHeight + 10) - itemHeight / 2;
            let dis = Math.abs(cy - ty);
            if (useAction || dis < 5) {
                childNode.y = ty;
            } else {
                childNode.RunAction(ezaction.moveTo(dis / 1666, { y: ty }));
            }
        }


    }

    //-----------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------

    private refreshBtnState() {
        if (this.node.getChildByName("salesman").active) {
            let mainNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("salesman"));
            let itemParent1 = mainNodes.get("content");
            itemParent1.children.forEach((child) => {
                let clerkComp = child.getComponent(ShopClerkListItem)
                if (child.active && clerkComp.params) {
                    let params = clerkComp.params;
                    let isUnlockClerk = true;
                    isUnlockClerk = main.module.gamedata.storesIdLv.get(params.clerkId) == 0 && params.clerkId <= 10;
                    clerkComp.refreshBtnState(main.module.calcTool.compare(main.module.vm.credit, { num: params.clerkPrice, numE: params.clerkPriceE }), isUnlockClerk);
                }
            })
        }
        if (this.node.getChildByName("prestige").active) {
            let prestigeNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("prestige"));
            let itemParent2 = prestigeNodes.get("content");
            itemParent2.children.forEach((child) => {
                let fameComp = child.getComponent(ShopPrestigeListItem)
                if (child.active && fameComp.params) {
                    let params = fameComp.params;
                    let isUnlockFame = false;
                    isUnlockFame = main.module.gamedata.storesIdLv.get(params.id) == 0 && params.id <= 10;
                    fameComp.refreshBtnState(main.module.calcTool.compare(main.module.vm.fame, { num: params.price, numE: params.priceE }), isUnlockFame);
                }
            })
        }
    }

    //-----------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------

    /** 刷新声望列表 */
    loadPrestigeList() {
        let fameNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("prestige"));
        let itemParent = fameNodes.get("content");
        this.prestigeItemNode.active = true;
        let vm = main.module.vm;
        for (let key in vm.fameList) {
            let fame = vm.fameList[key];
            let fameId = parseInt(fame["id"])
            let fameLv = fame["level"];
            if (fameId <= 11) {
                let params = this.getUpFamekLv(key, fameId, fameLv)
                if (!params) {
                    params = {
                        tag: key,
                        id: fameId,
                        level: fameLv + 1
                    }
                }
                if (fameId - 1 == 0) {
                    let comp = this.prestigeItemNode.getComponent(ShopPrestigeListItem);
                    comp.setData(params);
                    if (!comp.clickCallback) {
                        comp.clickCallback = this.fameItemClickHandler.bind(this);
                    }
                    this.prestigeItemNode.name = fameId + "";
                    this.fameItemPool.push(this.prestigeItemNode);
                } else {
                    let _itemNode = cc.instantiate(this.prestigeItemNode);
                    _itemNode.parent = itemParent;
                    let comp = _itemNode.getComponent(ShopPrestigeListItem);
                    comp.setData(params);
                    if (!comp.clickCallback) {
                        comp.clickCallback = this.fameItemClickHandler.bind(this);
                    }
                    _itemNode.name = fameId + "";
                    this.fameItemPool.push(_itemNode);
                }
                main.module.gamedata.fameIdLv.set(fameId, fameLv);
            }
        }
        this.refreshBtnState();
        this.calcCountFamePrice();
        // this.node.active = true;

    }

    /** 刷新声望列表 */
    refreshFameList() {
        this.scollviewSwitch(false)
        let vm = main.module.vm;
        let fameNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("prestige"));
        let itemParent = fameNodes.get("content");
        itemParent.children.forEach((fameNode) => {
            let comp: ShopPrestigeListItem = fameNode.getComponent(ShopPrestigeListItem);
            let fameTag = comp.params.tag;
            let fameId = comp.params.id;
            let fameData = vm.fameList[fameTag];
            let params = this.getUpFamekLv(fameTag, fameId, fameData["level"])
            if (!params) {
                params = {
                    tag: fameTag,
                    id: fameId,
                    level: fameData["level"] + 1
                }
            }
            comp.setData(params);
        })
    }
    /** 当前快速升级声望累计值 */
    currentFameQuickNum: formatParams = null;
    /** 计算快速升级声望的钱 */
    calcCountFamePrice(useAction: boolean = true) {
        let sortFunc = (_calcParamArray) => {
            _calcParamArray.sort((a: calcQuickCountParams, b: calcQuickCountParams) => {
                if (!main.module.calcTool.compare(a.price, b.price)) {
                    return -1;
                }
                if (main.module.calcTool.compare(a.price, b.price)) {
                    return 1;
                }
                return 0;
            });
        }
        let keys = main.module.gamedata.fameIdLv.keys();
        // let keys = _keys;
        keys.forEach((key)=>{//去掉未解锁的声望
            if(main.module.gamedata.storesIdLv.get(key) <= main.module.calcUiShow.checkLockStoreIdByLevel()){
                keys.push(key);
            }
        })
        // keys.push(11);
        let result: HashMap<number, number> = new HashMap<number, number>();
        let gear = 0;
        let countLab = {
            num: 0,
            numE: 0,
        }
        let calc = (_credit: formatParams) => {
            if (keys.length == 0) {
                return;
            }
            gear++
            let calcParamArray: Array<calcQuickCountParams> = [];
            keys.forEach((key) => {
                let nextLv = main.module.gamedata.fameIdLv.get(key) + gear;
                let config = main.module.themeConfig.getFameConfigByTagLv(`fame_${key}`, nextLv);
                if (config) {
                    let param: calcQuickCountParams = {
                        price: {
                            num: config.price,
                            numE: config.priceE
                        },
                        id: key,
                        canUpLv: gear
                    }
                    calcParamArray.push(param);
                } else {
                    keys.splice(keys.indexOf(key), 1);
                }
            })
            sortFunc(calcParamArray);
            let count: formatParams = {
                num: 0,
                numE: 0
            }
            calcParamArray.forEach((val) => {
                let _compare = main.module.calcTool.calcAddNum(count, val.price);
                if (main.module.calcTool.compare(_credit, _compare)) {
                    count = main.module.calcTool.calcAddNum(count, val.price);
                    result.set(val.id, val.canUpLv);
                } else {
                    keys.splice(keys.indexOf(val.id), 1);
                }
            })
            countLab = main.module.calcTool.calcAddNum(countLab, count);
            let credit = main.module.calcTool.calcMinusNum(_credit, count);
            calc(credit);
        }
        calc(main.module.calcTool.calcDivideNum(main.module.vm.fame, { num: 1, numE: 2 }));
        this.currentFameQuickNum = countLab;
        this.mainNodes.get("fame_lab").getComponent(LabelChangeSymbol).num = countLab;
        this.showButtonEffect(this.mainNodes.get("btn_quick_fame"), result.size > 0);
        this.fameQuickParams = result;


        let prestigeNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("prestige"));
        let itemParent = prestigeNodes.get("content");
        let priceArr: Array<calcQuickCountParams> = [];
        itemParent.children.forEach((child) => {
            let params = child.getComponent(ShopPrestigeListItem).params;
            let _p = {
                price: {
                    num: params.price,
                    numE: params.priceE
                },
                id: params.id
            }
            priceArr.push(_p);
        })
        sortFunc(priceArr);
        let ids = [];
        priceArr.forEach((val) => {
            ids.push(val.id);
        })
        itemParent.children.forEach((child) => {
            let pam = child.getComponent(ShopPrestigeListItem).params;
            if (pam.id > main.module.themeConfig.getBuildingConfigById(main.module.vm.level).count && pam.id != 11) {
                child.zIndex = 30 + pam.id;
            } else {
                child.zIndex = ids.indexOf(child.getComponent(ShopPrestigeListItem).params.id) + pam.id / 100;
            }
        })

        // Add by howe 增加列表item动画
        let childarr = itemParent.children
        childarr.sort((a, b) => {
            return a.zIndex - b.zIndex;
        })
        let itemHeight = childarr[0].height;
        let totalHeight = 15 + childarr.length * (10 + itemHeight);
        itemParent.height = totalHeight;
        for (let i = 0; i < childarr.length; i++) {
            let childNode = childarr[i];
            let cy = childNode.y;
            let ty = -15 - i * (itemHeight + 10) - itemHeight / 2;
            let dis = Math.abs(cy - ty);
            if (useAction || dis < 5) {
                childNode.y = ty;
            } else {
                childNode.RunAction(ezaction.moveTo(dis / 1666, { y: ty }));
            }
        }
    }

    fameClickQuickBtnHandler(event: cc.Event.EventTouch) {
        if (!event.target.getComponent(ButtonEffect).canTouch) {
            return;
        }
        cc.log(`canClickFameBtn`+this.canClickFameBtn);
        let vm = main.module.vm;
        service.analytics.logEvent("upgrade_click_quickpre", "", "");
        if (!main.module.calcTool.compare(vm.fame, this.currentFameQuickNum)) {
            cc.warn("升级声望余额不足")
            gui.notify.show("lack_credit");
            return;
        };
        if (this.fameQuickParams.size > 0) {
            Message.dispatchEvent(AudioMessage.EFFECT, "shop_batch");
            this.fameLvUp(this.fameQuickParams, this.currentFameQuickNum);
        }
    }

    fameItemClickHandler(params: fameLvConfigItem,event) {
        let vm = main.module.vm;
        cc.log(`canClickFameBtn`+this.canClickFameBtn);
        if (!main.module.calcTool.compare(vm.fame, { num: params.price, numE: params.priceE })) {
            cc.warn("升级声望余额不足")
            gui.notify.show("lack_credit");
            return;
        }
        if (!main.module.calcTool.compare(vm.fame, { num: params.price, numE: params.priceE })) {
            cc.warn("升级声望余额不足")
            gui.notify.show("lack_credit");
            return;
        }
        let div = main.module.calcTool.calcDivideNum({ num: params.price, numE: params.priceE }, vm.fame);
        let _per = Math.floor(div.num * Math.pow(10, div.numE) * 100);
        if (_per >= 1) {
            let popViewParams: PopViewParams = {
                modal: true,
                opacity: 180,
                onAdded: (node) => {
                    node.getComponent(FameConfirm).clickCallback = () => {
                        let lvUpParams: HashMap<number, number> = new HashMap<number, number>();
                        lvUpParams.set(params.id, 1)
                        this.fameLvUp(lvUpParams, {
                            num: params.price,
                            numE: params.priceE
                        }, () => {
                            node.destroy();
                        });
                    }
                }
            }
            // let string = event.node.getChildByName("prestige_name").getComponent(cc.Label).string;
            gui.popup.add(`popup/fame_confirm`, { per: _per,id:params.id }, popViewParams)
        } else {
            let lvUpParams: HashMap<number, number> = new HashMap<number, number>();
            lvUpParams.set(params.id, 1)
            this.fameLvUp(lvUpParams, {
                num: params.price,
                numE: params.priceE
            });
        }
    }

    changeFameList(lvUpParams: HashMap<number, number>) {
        let keys = lvUpParams.keys();
        let fameList = main.module.vm.fameList;
        let resultList: Object = {};
        for (let key in fameList) {
            if (keys.indexOf(fameList[key]["id"]) != -1) {
                resultList[key] = {
                    id: fameList[key]["id"],
                    level: fameList[key]["level"] + lvUpParams.get(fameList[key]["id"])
                }
            } else {
                resultList[key] = {
                    id: fameList[key]["id"],
                    level: fameList[key]["level"]
                }
            }
        }
        return resultList;
    }


    fameLvUp(lvUpParams: HashMap<number, number>, subNum: formatParams, callback?: Function) {
        let vm = main.module.vm;
        let _fameList = this.changeFameList(lvUpParams);
        main.module.gameProtocol.sendFameList(_fameList, (data) => {
        });

        let _storeList = this.changeStoreList(lvUpParams);
        main.module.calcUiShow.refreshFame({
            num: -subNum.num,
            numE: subNum.numE
        }, () => {
            vm.fameList = _fameList;
            this.refreshFameList();
            this.refreshBtnState();
            this.calcCountFamePrice();
            callback && callback();
        });

        vm.storeList = _storeList;
        main.module.gameProtocol.sendStoreList(_storeList, (obj) => {
        });
        let _taskListUpLv = this.changTaskListOnUpLvFame(lvUpParams);
        main.module.gameProtocol.sendTaskList(_taskListUpLv, (obj) => {
            vm.taskList = _taskListUpLv;
        })
    }

    changeStoreList(lvUpParams: HashMap<number, number>) {
        let keys = lvUpParams.keys();
        let lvUpStoreParams: HashMap<number, number> = new HashMap<number, number>();
        keys.forEach((key) => {
            let maxUpLv = lvUpParams.get(key);
            let upStoreLvTotal = 0;
            let fameTag = `fame_${key}`;
            let fameLevel = main.module.vm.fameList[fameTag]["level"]
            for (let i = 1; i <= maxUpLv; i++) {
                let fameConfig = main.module.themeConfig.getFameConfigByTagLv(fameTag, fameLevel+i);
                if (fameConfig.type == 3) {
                    upStoreLvTotal += fameConfig.levelUp;
                }
            }
            lvUpStoreParams.set(key, upStoreLvTotal);
        })
        let storeList = main.module.vm.storeList;
        let resultList: Object = {};
        for (let key in storeList) {
            let maxLv = main.module.themeConfig.getStoreMaxLvById(storeList[key]["id"]);
            let resultLv = storeList[key]["level"] + lvUpStoreParams.get(storeList[key]["id"]);
            if (keys.indexOf(storeList[key]["id"]) != -1) {
                resultList[key] = {
                    id: storeList[key]["id"],
                    level: resultLv >= maxLv ? maxLv : resultLv,
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

    /** 获取currentLv + targetGear等级的声望显示信息 targetGear默认等于1 */
    getUpFamekLv(tag: string, id: number, currentLv: number, targetGear: number = 1) {
        let fameLvInfo = main.module.themeConfig.getFameConfigByTagLv(tag, currentLv + targetGear);
        if (!fameLvInfo) {
            cc.warn(`${tag}标签或者${currentLv + targetGear}}【找不到对应配置】`)
            return;
        }
        return fameLvInfo;
    }

    //------------------------------------------------------------------------------------------------------
    //------------------------------------------------------------------------------------------------------

    scollviewSwitch(bool: boolean) {
        if (!main.module.gameMainControl.shopFameIsShow()) {
            this.mainNodes.get("toggle_group").children.forEach((child) => {
                child.active = child.name == "toggle1" || child.name == "bg" || child.name == "Background1";
            })
        } else {
            this.mainNodes.get("toggle_group").children.forEach((child) => {
                child.active = true;
            })
        }
        if (bool) {
            // this.mainNodes.get("explain_clerk").active = this.initClerkActive;
            // this.mainNodes.get("explain_fame").active = this.initClerkActive;
            this.scheduleOnce(() => {
                this.mainNodes.get("salesman").getComponent(cc.ScrollView).scrollToTop(0.2);
            })
            this.mainNodes.get("salesman").active = true;
            this.mainNodes.get("prestige").active = false;
            // this.mainNodes.get("btn_quick_fame").active = false;
            // this.mainNodes.get("btn_quick_clerk").active = true;
        } else {
            this.scheduleOnce(() => {
                this.mainNodes.get("prestige").getComponent(cc.ScrollView).scrollToTop(0.2);
            })
            // this.mainNodes.get("explain_clerk").active = false;
            // this.mainNodes.get("explain_fame").active = this.initFameActive;

            this.mainNodes.get("prestige").active = true;
            this.mainNodes.get("salesman").active = false;
            // this.mainNodes.get("pubilc_get").getComponent(FameGetComponent).init();
            // this.mainNodes.get("btn_quick_fame").active = true;
            // this.mainNodes.get("btn_quick_clerk").active = false;
        }
    }


    update() {
        this.refreshBtnState();
        this.calcCountClerkPrice(true,false);
        this.mainNodes.get("red_point_clerk_off").active = main.module.gameMainControl.isShopClerkPoint;
        this.mainNodes.get("red_point_fame_off").active = main.module.gameMainControl.isShopFamePoint;
        this.mainNodes.get("red_point_clerk").active = main.module.gameMainControl.isShopClerkPoint;
        this.mainNodes.get("red_point_fame").active = main.module.gameMainControl.isShopFamePoint || main.module.gameMainControl.isPublicGetFame;
    }

    onDestroy() {
        // this.node.parent.active = false;
        this.currentClerkQuickNum = null;
        this.clerkQuickParams = null;
        this.fameQuickParams = null;
        this.clerkItemPool = null;
        this.fameItemPool = null;
        this.initFameActive = null;
        this.initClerkActive = null;
        this.currentFameQuickNum = null;
        this.mainNodes = null;
        this.clerkItemPool = null;
        if (main.module.gameMainControl.isShopFamePoint && !main.module.gameMainControl.isShopClerkPoint) {
            main.module.gameMainControl.mainNodes.get("red_point_clerk").active = false;
        }
        if (main.module.gameMainControl.isShopFamePoint) {
            main.module.gameMainControl.isShopFamePoint = false;
        }
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        super.onDestroy();
    }

    onTouchHandler(event: cc.Event.EventTouch) {
        switch (event.target.name) {
            case "btn_close": {
                // this.node.destroy()
                main.module.gameMainControl.clerkChangeId = this.checkClerkListChange();
                gui.delete(this.node);
                break;
            }
            case "btn_quick_clerk": {
                this.clerkClickQuickBtnHandler(event);
                break;
            }
            case "btn_quick_fame": {
                this.fameClickQuickBtnHandler(event);
                break;
            }
        }
    }

    /** 比较进入店员界面和关闭店员界面列表的变化 */
    checkClerkListChange(){
        let changIds = [];
        for(let key in this.entryClerkList){
            if(this.entryClerkList[key]["level"] != main.module.vm.clerkList[key]["level"] && [11,12].indexOf(this.entryClerkList[key]["id"])==-1){
               changIds.push(this.entryClerkList[key]["id"]) ;
            }
        }
        if(changIds.length>0){
            return changIds[changIds.length-1];
        }
        return null;
    }

    showButtonEffect(btnNode: cc.Node, state: boolean) {
        let btnComp = btnNode.getComponent(ButtonEffect);
        if (btnComp) {
            btnComp.canTouch = state;
        }
        if (btnNode.name == "btn_quick_fame") {
            btnNode.getChildByName("fame_lab").getComponent(LabTouchFont).canTouch = state;
        } else if (btnNode.name == "btn_quick_clerk") {
            btnNode.getChildByName("clerk_lab").getComponent(LabTouchFont).canTouch = state;
        }

    }

}
