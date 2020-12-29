
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { service } from "../../service/Service";
import { goods } from "./ShoppingComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GiftListItem extends ComponentExtends {


    onLoad() {
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        }
    }

    onBtnHandler(event) {
        if (this.clickCallback) {
            service.analytics.logEvent("gift_buy_new", "", "")
            this.clickCallback(this.goodsId, this);
        }
    }

    clickCallback: Function = null;

    goodsId: number = 7;
    diamond_num: number = 0;
    setData(params: goods) {
        this.goodsId = params.id;
        this.diamond_num = params.value;
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        mainNodes.get("zuanshi").active = false;
        cc.loader.loadRes(`popup/gift/zuanshi${params.id > 1 ? params.id - 1 : params.id}`, cc.SpriteFrame, (error, resource) => {
            if (!error) {
                let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
                mainNodes.get("zuanshi").getComponent(cc.Sprite).spriteFrame = resource;
                mainNodes.get("zuanshi").active = true;
            }
        });
        mainNodes.get("title").getComponent(LanguageLabel).dataID = `gift_${params.id}`
        mainNodes.get("hua").active = params.id == 1;
        mainNodes.get("diamond_num").getComponent(cc.Label).string = "x" +params.value.value1;
        mainNodes.get("type").getComponent(cc.Label).string = "获取";
        mainNodes.get("price").getComponent(cc.Label).string = "USD" + params.price;
        mainNodes.clear()
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        this.goodsId = null;
        this.diamond_num = null;
        this.clickCallback = null;
        super.onDestroy();
    }


}