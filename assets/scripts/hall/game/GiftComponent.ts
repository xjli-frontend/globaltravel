
import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { AsyncQueue } from "../../core/util/AsyncQueue";
import main from "../../Main";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import { TaskType } from "../CalcUiShow";
import { AdvMessage, AdvRewardType } from "./adv/AdvControl";
import GiftListItem from "./GiftListItem";
import { goods } from "./ShoppingComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GiftComponent extends ComponentExtends {

    @property(cc.Node)
    item_node: cc.Node = null;

    @property(cc.Node)
    item_adv: cc.Node = null;

    onLoad() {
        service.analytics.logEvent("gift_click_open", "", "")

        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.node.active = false;
        this.refreshList();
        main.module.gameMainControl.mainNodes.get("red_point_gift").active = false;
    }

    refreshList() {
        
        this.item_node.active = false;
        let newActive = false;
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let itemParent = mainNodes.get("content");
        itemParent.children.forEach((child) => {
            if (child.uuid != this.item_node.uuid && child.uuid != this.item_adv.uuid) {
                child.destroy();
            }
        })
        let index = 0;
        let nextCall = AsyncQueue.excuteTimes(3, () => {
            this.item_adv.on(cc.Node.EventType.TOUCH_END, this.advItemClickHandler.bind(this), this);
            this.node.active = true;
            this.item_node.active = newActive;
        })
        service.prompt.netInstableOpen();
        main.module.gameProtocol.requestGoodsList((data) => {
            service.prompt.netInstableClose();
            main.module.vm.goodsList = data["goodsList"];
            for (let key in main.module.vm.goodsList) {
                let oneGoods = main.module.vm.goodsList[key];
                if (oneGoods.priceType == 1) {
                    let param: goods = {
                        id: oneGoods.id,
                        goods_type: oneGoods.goods_type,
                        price: oneGoods.price,
                        priceType: oneGoods.priceType,
                        value: oneGoods.value,
                    }
                    let com: GiftListItem = null;
                    if (index == 0) {
                        this.item_node.active = true;
                        com = this.item_node.getComponent(GiftListItem);
                        com.setData(param)
                    } else {
                        let _itemNode = cc.instantiate(this.item_node);
                        _itemNode.parent = itemParent;
                        com = _itemNode.getComponent(GiftListItem)
                        com.setData(param)
                    }
                    com.clickCallback = this.itemClickHandler.bind(this);
                    com.node.zIndex = index+2;
                    index++;
                }
            }
            nextCall();
        })
        main.module.gameProtocol.checkBuyRecord(1, (data) => {
            newActive = data["count"] == 0;
            nextCall();
        })
        main.module.gameProtocol.requestAdRechargeCount((data) => {
            this.giftAdvNum = data["adCount"]["count"] || 0;
            this.initAdvItem();
            nextCall();
        })
    }

    giftAdvNum:number = 0;    
    initAdvItem(){
        this.item_adv.getChildByName("progress").getComponent(cc.Label).string = `(${this.giftAdvNum}/5)`;
        this.item_adv.zIndex = this.giftAdvNum<5 ?1:200;
        this.item_adv.active = this.giftAdvNum<5;
    }


    advItemClickHandler(){
        if(this.giftAdvNum>=5){
            return;
        }
        if(!this.item_adv.getComponent(ButtonEffect).canTouch){
            return;
        }
        this.item_adv.getComponent(ButtonEffect).canTouch = false;
        let AdvCallback = ()=>{
            service.prompt.netInstableOpen();
            main.module.gameProtocol.rechargeBegin((data) => {
                service.prompt.netInstableClose();
                let vm = main.module.vm;
                this.item_adv.getComponent(ButtonEffect).canTouch = true;
                this.giftAdvNum +=1;
                vm.diamond = data["userAccount"]["credit"];
                this.initAdvItem();
            })
        }
        if (cc.sys.isBrowser) {
            cc.log(`浏览器直接发放礼包界面钻石奖励`);
            let _taskListAd = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
            main.module.gameProtocol.sendTaskList(_taskListAd, (obj) => {
                main.module.vm.taskList = _taskListAd;
            })
            main.module.gameMainControl.playAdDiamondEffect(()=>{
                AdvCallback && AdvCallback();
            });
            return;
        }
        Message.dispatchEvent(AdvMessage.PLAY, {
            callback: (success: boolean, type: number) => {
                if (type == AdvRewardType.GIFT_DIAMOND) {
                    if (success) {
                        cc.log(`礼包界面钻石奖励观看广告成功`);
                        service.analytics.logEvent("ad_complete_store", "", "")
                        main.module.gameMainControl.playAdDiamondEffect(()=>{
                            AdvCallback && AdvCallback();
                        });
                    } else {
                        cc.log(`礼包界面钻石奖励观看广告失败`)
                        this.item_adv.getComponent(ButtonEffect).canTouch = true;
                    }
                }
            }, type: AdvRewardType.GIFT_DIAMOND
        });
    }

    itemClickHandler(goodsId: number) {
        Message.dispatchEvent(AudioMessage.EFFECT, "buy_gem");
        main.module.gameProtocol.startPay(goodsId, (data) => {
            cc.log("[SHop]，充值订单消息", data);
            let billNo = data['payData']["billNo"];
            if (billNo) {
                main.module.pay.doPay(billNo, "globaltycoon.product_" + goodsId)
            }
            if (goodsId == 1) {
                let popViewParams: PopViewParams = {
                    modal: true,
                    opacity: 150,
                }
                let reward = main.module.calcUiShow.getTimeStageReward(7 * 24 * 60 * 60);//7*24*60*60
                if(reward.num == 0 && reward.numE == 0){
                    reward = {num:1,numE:3};
                }
                gui.popup.add(`popup/shopping_result`, { id: 10, goodsType: 2, reward: reward }, popViewParams);
                main.module.calcUiShow.refreshCredit(reward, () => {
                }, true)
            }
            this.refreshList();
        });
        return;
        let vm = main.module.vm;
        cc.log(goodsId);
        main.module.gameProtocol.requestDiamondInfo(goodsId, (data) => {
            vm.diamond = data["userAccount"]["credit"];
            this.node.destroy();
        })
    }


    onDestroy() {
        // this.node.parent.active = false;
        this.giftAdvNum = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        super.onDestroy();
    }
    onTouchHandler(event: cc.Event.EventTouch) {
        switch (event.target.name) {
            case "btn_close": {
                // this.node.destroy()
                gui.delete(this.node)
                break;
            }
        }
    }

}
