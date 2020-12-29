
import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import LabTouchFont from "./effect/LabTouchFont";
import ShoppingListItem from "./ShoppingListItem";

const { ccclass, property } = cc._decorator;



export interface goods{
    id:number,
    goods_type:number,
    price:number,
    priceType:number,
    value:any
}
@ccclass
export default class ShoppingComponent extends ComponentExtends {
    
    @property(cc.Node)
    item_node:cc.Node = null;

    onLoad(){
        service.analytics.logEvent("mall_click_open", "", "")
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.node.active = false;
        this.refreshList();
    }

    refreshList(){
        this.item_node.active = false;
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let itemParent = mainNodes.get("content");
        itemParent.children.forEach((child)=>{
            if(child.uuid != this.item_node.uuid){
                child.destroy();
            }
        })
        let index = 0;
        service.prompt.netInstableOpen();
        main.module.gameProtocol.requestGoodsList((data)=>{
            service.prompt.netInstableClose();
            main.module.vm.goodsList = data["goodsList"];;
            for(let key in main.module.vm.goodsList){
                let oneGoods = main.module.vm.goodsList[key];
                if(oneGoods.priceType == 2){
                    let param:goods = {
                        id : oneGoods.id,
                        goods_type : oneGoods.goodsType,
                        price : oneGoods.price,
                        priceType : oneGoods.priceType,
                        value : oneGoods.value,
                    }
                    let com:ShoppingListItem = null;
                    if(index == 0){
                        this.item_node.active = true;
                        this.item_node.name = `${oneGoods.id}`;
                        com = this.item_node.getComponent(ShoppingListItem)
                        com.setData(param)
                    }else{
                        let _itemNode = cc.instantiate(this.item_node);
                        _itemNode.name = `${oneGoods.id}`;
                        _itemNode.parent = itemParent;
                        com = _itemNode.getComponent(ShoppingListItem)
                        com.setData(param)
                    }
                    com.clickCallback = this.itemClickHandler.bind(this);

                    index ++;
                }
            }
            this.node.active = true;
        })
        this.refreshMutiLab();
    }

    /** 获取begin到length的随机数 整数 */
    public getRandomNum = function (begin: number, length: number) {
        return Math.round(Math.random() * (length - begin) + begin);
    };
    
    itemClickHandler(param:goods,reward){
        let vm = main.module.vm;
        cc.log(param.id);
        if(param.price > main.module.vm.diamond){
            cc.warn("【钻石余额不足】")
            return;
        }
        Message.dispatchEvent(AudioMessage.EFFECT, `shop_${this.getRandomNum(1,3)}`);
        let goodsId = param.id;
        switch (goodsId) {
            case 8:
                service.analytics.logEvent("mall_buy_12", "", "")
                break;
            case 9:
                service.analytics.logEvent("mall_buy_24", "", "")
                break;            
            case 10:
                service.analytics.logEvent("mall_buy_W", "", "")
                break;            
            case 11:
                service.analytics.logEvent("mall_buy_2W", "", "")
                break;            
            case 12:
                service.analytics.logEvent("mall_buy_3X", "", "")
                break;            
            case 13:
                service.analytics.logEvent("mall_buy_6X", "", "")
                break; 
            case 14:
                service.analytics.logEvent("mall_buy_12X", "", "")
                break; 
            case 15:
                service.analytics.logEvent("mall_buy_27X", "", "")
                break;                
            default:
                break;
        }
        main.module.gameProtocol.requestDiamondInfo(goodsId,(data)=>{
            let popViewParams:PopViewParams = {
                modal:true,
                opacity:150,
            }
            let value = data["goodsInfo"]["value"];
            let goodsType = data["goodsInfo"]["goodsType"];
            gui.delete(this.node)
            gui.popup.add(`popup/shopping_result`,{id:param.id,goodsType:goodsType,reward:reward,value:value},popViewParams);
            vm.diamond = data["userAccount"]["credit"];
            if(data["goodsData"]){
                vm.goodsInfo = data["goodsData"];
                this.refreshMutiLab();
            }
            main.module.calcUiShow.refreshCredit(reward,()=>{
                main.module.gameMainControl.refreshStoresCollectSpeed();
            },true)
        })
    }

    refreshMutiLab(){
        let vm = main.module.vm;
        let multiTotal = vm.goodsInfo["multiTotal"];
        let multiTotalE = vm.goodsInfo["multiTotalE"];
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let num = multiTotal * Math.pow(10,multiTotalE);
        if(num == 0){
            mainNodes.get("muti_title").active = false;
            mainNodes.get("muti_lab").active = false;
        }else{
            mainNodes.get("muti_title").active = true;
            mainNodes.get("muti_lab").active = true;
            mainNodes.get("muti_lab").getComponent(cc.Label).string = `${num}X`;
        }
    }

    refreshBtnState(){
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let itemParent = mainNodes.get("content");
        itemParent.children.forEach((child)=>{
            if(child.getComponent(ShoppingListItem).params){
                let reward = child.getComponent(ShoppingListItem).reward;
                if(child.getComponent(ShoppingListItem).params.goods_type == 3){
                    this.showButtonEffect(child.getChildByName("btn_buy"),main.module.vm.diamond >= child.getComponent(ShoppingListItem).params.price);
                }else{
                    this.showButtonEffect(child.getChildByName("btn_buy"),main.module.vm.diamond >= child.getComponent(ShoppingListItem).params.price && reward.num != 0)
                }
            }
        })
    }
    
    showButtonEffect(btnNode:cc.Node,state:boolean){
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        // btnNode.color = color;
        if (btnComp){
            btnComp.canTouch = state;
        }
        if(btnNode.name == "btn_buy"){
            btnNode.getChildByName("btn_lab").getComponent(LabTouchFont).canTouch = state;
            // btnNode.getChildByName("btn_lab").getComponent(cc.Label).spacingX = state ? 0:-5;
        }
        // let func = (_node)=>{
        //     if(_node.children.length == 0){
        //         return;
        //     }
        //     for (let child of _node.children){
        //         child.color = color;
        //         func(child);
        //     }
            
        // }
        // func(btnNode)
    }

    

    update(){
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        mainNodes.get("diamond_lab").getComponent(cc.Label).string = main.module.vm.diamond + ""; 
        this.refreshBtnState();
    }

    onDestroy(){
        // this.node.parent.active = false;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        super.onDestroy();
    }
    onTouchHandler(event:cc.Event.EventTouch){
        switch(event.target.name){
            case "btn_close":{
                gui.delete(this.node)
                // this.node.destroy()
                break;
            }
        }
    }

}
