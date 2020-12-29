import engine from "../../../core/Engine";
import { PopViewParams } from "../../../core/gui/Defines";
import { gui } from "../../../core/gui/GUI";
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { AsyncQueue } from "../../../core/util/AsyncQueue";
import main from "../../../Main";
import { service } from "../../../service/Service";
import StoreComponent from "../StoreComponent";

export class NoviceProgress {
    /** 解锁第一个店铺 */
    novice_1?: number = 0
    /** 收取店铺利润 */
    novice_2?: number = 0
    /** 升级店铺 */
    novice_3?: number = 0
    /** 引导店员升级 */
    novice_4?: number = 0
    /**  挑战任务解锁 */
    novice_5?: number = 0
    /**  商店解锁 */
    novice_6?: number = 0
    /**  引导卖楼 */
    novice_7?: number = 0
    /**  引导每日任务解锁按钮 */
    novice_8?: number = 0
    /**  解锁背包按钮 */
    novice_9?: number = 0
    /**  声望升级引导 */
    novice_10?: number = 0
    /**  批量升级 */
    novice_11?: number = 0
    /**  npc互动 */
    novice_12?: number = 0
    /**  发布会获取声望开放 */
    novice_13?: number = 0
    /**  主线任务打开 */
    novice_0?: number = 0
    /**  第一次进入游戏 */
    novice_start?: number = 0
}

export class MainProgress {
    /** 收集100金币 奖励：200金币 */
    progress_1?: number = 0
    /** 甜蜜饮品店升到25级 奖励：1K金币并且挑战任务解锁 */
    progress_2?: number = 0
    /** 购买奇趣玩具店铺 奖励：10k金币，解锁批量升级 */
    progress_3?: number = 0
    /** 购买福气家常菜 奖励：100钻石，解锁商店功能 */
    progress_4?: number = 0
    /** 和npc互动3次 奖励：100k金币*/
    progress_5?: number = 0
    /** 购买星星杂技团 奖励：1M金币并且解锁卖楼功能 */
    progress_6?: number = 0
    /** 雇佣3个店员 奖励：获得一个随机道具*/
    progress_7?: number = 0
    /** 完成一次出名 奖励：20钻石 并且解锁声望升级功能并且额外获得500点声望*/
    progress_8?: number = 0
}


export default class NoviceHandle {

    asyncQueue = new AsyncQueue();

    storeItemNode: cc.Node = null;
    constructor() {
    }

    popViewParams: PopViewParams = {
        modal: true,
        opacity: 100,
        touchClose: false,
    }

    /**新手引导缓存数据修改*/
    changeNoviceCacheData(id: number | string) {
        let noviceData = main.module.vm.noviceProgress;
        let _noviceData: object = {};
        for (let key in noviceData) {
            if (key == `novice_${id}` && noviceData[`novice_${id}`] == 0) {
                _noviceData[`novice_${id}`] = 1;
            } else {
                _noviceData[key] = noviceData[key];
            }
        }
        service.analytics.logEvent("novice_adopt", "", "")
        main.module.vm.noviceProgress = _noviceData;
        this.noviceLock = false;
        main.module.gameProtocol.writeCacheData("novice", _noviceData, (data) => {
            cc.log(`novice_${id}引导缓存写入成功`);
        })
    }

    /** 第一次登陆 */
    handleStart(callback: Function) {
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_start"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novicestart`, { callback: ()=>{
            engine.log.info(`novicestart执行回调`);
            callback && callback();
            this.changeNoviceCacheData("start");
        } }, _popViewParams)
    }



    noviceLock: boolean = false;
    /** 解锁第一个店铺引导 */
    handle1(btnNode: cc.Node, callback: Function) {
        if (main.module.vm.noviceProgress["novice_1"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice1`, { callback: ()=>{
            callback && callback();
            this.changeNoviceCacheData(1);
        },btnNode:btnNode }, _popViewParams)
    }


    /** 引导第一次获取收益引导 */
    handle2(btnNode: cc.Node, callback: Function) {
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_2"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        let handler = main.module.mainScene.storesNode.getChildByName("store_1").getComponent(StoreComponent).mainNodes.get("handler");
        handler.active = true;
        gui.popup.add(`novice/novice2`, { callback: ()=>{
            callback && callback();
            this.changeNoviceCacheData(2);
        },btnNode:btnNode }, _popViewParams)
    }

    /** 升级店铺引导 */
    noviceUpStore(callback: Function) {
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_3"] == 1) {
            this.noviceLock = false;
            return;
        }
        let handler = main.module.mainScene.storesNode.getChildByName("store_1").getComponent(StoreComponent).mainNodes.get("handler");
        handler.active = false;
        this.noviceLock = true;
        main.module.gameMainControl.openStoreOperation(1);
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice3`, { callback: ()=>{
            this.changeNoviceCacheData(3);
            callback && callback();
            main.module.gameMainControl.storeOperation.currentViewStoreId = -1;
        } }, _popViewParams)
    }


    /** 升级店员引导 */
    noviceShopClerk(btnNode: cc.Node,callback?:Function) {
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_4"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice4`, {btnNode:btnNode,callback:callback,
        noviceCallback:()=>{
            this.changeNoviceCacheData(4);
        }}, _popViewParams)
    }

    /** 挑战任务引导 */
    noviceCallengeTask(btnNode: cc.Node,callback?:Function) {
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_5"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice5`, {btnNode:btnNode,callback:()=>{
            this.changeNoviceCacheData(5);
            callback && callback();
        }}, _popViewParams)
    }

    /** 解锁商城引导 */
    noviceShopping(btnNode: cc.Node,callback?:Function) {
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_6"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice6`, {btnNode:btnNode,callback:()=>{
            this.changeNoviceCacheData(6);
            callback && callback();
        }}, _popViewParams)
    }


    /** 卖楼引导 */
    noviceSellStores(btnNode: cc.Node,callback?:Function) {
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_7"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice7`, {btnNode:btnNode,callback:()=>{
            this.changeNoviceCacheData(7);
            callback && callback();
        },nextNoviceCallback:()=>{
            engine.timer.scheduleOnce(() => {
                this.noviceMainTask(main.module.gameMainControl.mainNodes.get("btn_task"));
            })
        }}, _popViewParams)
    }

    /**  卖楼之后进入主线任务 */
    noviceMainTask(btnNode: cc.Node){
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_8"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice8`, {btnNode:btnNode,callback:()=>{
            this.changeNoviceCacheData(8);
        }}, _popViewParams)
    }
    
    /** 背包引导 */
    novicePackage(btnNode: cc.Node,callback?:Function){
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_9"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice9`, {btnNode:btnNode,callback:()=>{
            this.changeNoviceCacheData(9);
            callback && callback();
        },nextCallback:()=>{
            this.novicePublicFame();
        }}, _popViewParams)
    }
        
    /** 声望升级引导引导 */
    noviceFameUp(btnNode: cc.Node,callback?:Function){
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_10"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice10`, {btnNode:btnNode,callback:()=>{
            this.changeNoviceCacheData(10);
            callback && callback();
        }}, _popViewParams)
    }

    /** 第二次过关 引导结束 */
    noviceEnd(callback?:Function){
        if (this.noviceLock) {
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/noviceend`, {callback:()=>{
            this.noviceLock = false;
            callback && callback();
        }}, _popViewParams)
    }

            
    /** 批量升级引导 */
    noviceBatchUp(callback?:Function){
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_11"] == 1) {
            this.noviceLock = false;
            return;
        }
        let storeOperation = main.module.gameMainControl.openStoreOperation(2);
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice11`, {callback:()=>{
            this.changeNoviceCacheData(11);
            callback && callback();
            main.module.gameMainControl.storeOperation.setLvGear(10);
        }}, _popViewParams)
    }

    /** npc互动 */
    noviceNpcClick(callback?:Function){
        if (this.noviceLock) {
            return;
        }
        // if (main.module.vm.noviceProgress["novice_12"] == 1) {
        //     this.noviceLock = false;
        //     return;
        // }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: false,
            touchClose: false,
        }
        gui.popup.add(`novice/novice12`, {callback:()=>{
            this.changeNoviceCacheData(12);
            callback && callback();
        }}, _popViewParams)
    }

    noviceMainTaskOpen(mainTaskTipNode:cc.Node,callback?:Function){
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_0"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice0`, {callback:()=>{
            this.changeNoviceCacheData(0);
            callback && callback();
        },btnNode:mainTaskTipNode}, _popViewParams)
    }

    
    novicePublicFame(callback?:Function){
        if (this.noviceLock) {
            return;
        }
        if (main.module.vm.noviceProgress["novice_13"] == 1) {
            this.noviceLock = false;
            return;
        }
        this.noviceLock = true;
        let _popViewParams: PopViewParams = {
            modal: true,
            opacity: 150,
            touchClose: false,
        }
        gui.popup.add(`novice/novice13`, {callback:()=>{
            this.changeNoviceCacheData(13);
            callback && callback();
            main.module.noviceHandle.noviceFameUp(main.module.gameMainControl.mainNodes.get("btn_shop"));
        },btnNode:main.module.gameMainControl.mainNodes.get("btn_shop")}, _popViewParams)
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

    /** 商店引导 领取钻石特效 */
    playShoppingNoviceEffect(popNode: cc.Node) {
        let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/shopping_effect`, cc.Prefab);
        let _node: cc.Node = cc.instantiate(prefab);
        let gameMainControl = main.module.gameMainControl;
        let worldPos = gameMainControl.mainNodes.get("diamond_panel").parent.convertToWorldSpaceAR(gameMainControl.mainNodes.get("diamond_panel").getPosition());
        let spacePos = gameMainControl.mainNodes.get("effect").convertToNodeSpaceAR(worldPos);
        _node.parent = popNode;
        _node.setPosition(spacePos);
        _node.active = true;
        _node.zIndex = 100;
        engine.timer.scheduleOnce(() => {
            _node.destroy();
        }, 2)
    }

    panelAnim(panelNode: cc.Node, leftOrRight: boolean, show: boolean, callback: Function) {
        let hideX = leftOrRight ? -720 : 720;
        if (show) {
            panelNode.x = hideX;
        }
        panelNode.RunAction(ezaction.scaleTo(0.3, { x: show ? 0 : hideX })).onStoped(() => {
            callback();
        })
    }

}
