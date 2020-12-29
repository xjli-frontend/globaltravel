
import ButtonEffectSprite from "../../core/ui/button/ButtonEffectSprite";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import ListItemFrame from "./ListItemFrame";
import { RankingListParams } from "./RankingListComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RankingListItem extends ComponentExtends {


    onLoad() {
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.once(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        }
    }

    clickCallback: Function = null;
    onBtnHandler(event: cc.Event.EventTouch) {
        if (event.target.name == "liked" && this.node.getChildByName("liked").getComponent(ButtonEffectSprite).canTouch) {
            if (this.clickCallback) {
                this.clickCallback(this.params.index, () => {
                    let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
                    let likedNode = mainNodes.get("liked");//点赞
                    this.showButtonEffect(likedNode, false);
                });
            }
        }
    }

    params: any = null;
    setData(params: RankingListParams) {
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.params = params;
        let index = params.index;
        let ranking_sprNode = mainNodes.get("ranking_spr");//名次图片
        ranking_sprNode.active = index <= 2;
        ranking_sprNode.getComponent(ListItemFrame).setFrame(index);
        this.node.getComponent(ListItemFrame).setFrame(index <= 2 ? 0 : 1);

        let likedNode = mainNodes.get("liked");//点赞
        likedNode.active = index <= 2;
        this.showButtonEffect(likedNode, params.like == 0);

        let head_spr = mainNodes.get("head_spr");
        let fame = cc.loader.getRes(`main/head/head_${params.icon}`, cc.SpriteFrame);
        head_spr.getComponent(cc.Sprite).spriteFrame = fame;//用户头像

        let ranking_labNode = mainNodes.get("ranking_lab");//名次lab
        ranking_labNode.active = index > 2;
        ranking_labNode.getComponent(cc.Label).string = "" + (index + 1);

        mainNodes.get("nickname").getComponent(cc.Label).string = params.nickname;
        mainNodes.get("score").getComponent(LabelChangeSymbol).num = params.score;
    }


    showButtonEffect(btnNode: cc.Node, state: boolean) {
        let btnComp = btnNode.getComponent(ButtonEffectSprite);
        if (btnComp) {
            btnComp.canTouch = state;
        }
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);

        this.clickCallback = null;
        this.params = null;
        super.onDestroy();
    }


}