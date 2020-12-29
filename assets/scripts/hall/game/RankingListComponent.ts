
import { gui } from "../../core/gui/GUI";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { AsyncQueue } from "../../core/util/AsyncQueue";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { service } from "../../service/Service";
import { formatParams } from "../CalcTool";
import RankingListItem from "./RankingListItem";

const { ccclass, property } = cc._decorator;

export interface RankingListParams {
    /** 名次 */
    index: number
    /** id */
    id: number,
    /** 昵称 */
    nickname: string,
    /** 头像 */
    icon,
    /** 分数 */
    score: formatParams,
    /** 是否点赞 */
    like?: number
}

@ccclass
export default class RankingListComponent extends ComponentExtends {

    @property(cc.Node)
    itemNode: cc.Node = null;

    mainNodes: HashMap<string, cc.Node> = null;
    onLoad() {
        service.analytics.logEvent("rank_click_open", "", "")

        this.mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        // this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).toggleCallback = (toggle)=>{
        //     this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).getItems().forEach((child)=>{
        //         child.getChildByName("checkmark").active = toggle.node.name == child.name;
        //     })
        // }
        // this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).setIndex(0);
        this.node.active = false;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.setLikeInfo();
        this.node.getChildByName("scrollview").on("scroll-ended",()=>{
            service.analytics.logEvent("rank_click_slide", "", "")
        })
        main.module.gameMainControl.mainNodes.get("red_point_ranking").active = false;

    }

    setLikeInfo() {
        main.module.gameProtocol.requestLikeInfo((result) => {
            cc.log(result)
            this.refreshRankingList(result["likeData"]);
        })
    }

    personalIndex = -1;
    refreshRankingList(likeInfo) {
        let itemParent = this.mainNodes.get("content");
        this.itemNode.active = false;
        let nextCall = AsyncQueue.excuteTimes(2, () => {
            this.node.active = true;
        })
        let personInfo = null;
        main.module.gameProtocol.requestRankingList((result) => {
            main.module.vm.rankingList = result["rankingList"]["rankData"];
            main.module.vm.rankingList.forEach((data, index) => {
                let params: RankingListParams = {
                    index: index,
                    id: data["id"],
                    nickname: data["name"] || data["id"],
                    icon: data["icon"] || 1,
                    score: {
                        num: data["rankValue"],
                        numE: data["rankValueE"]
                    },
                }
                if (index < 3) {
                    params.like = likeInfo[index];
                }
                if (data["id"] == service.account.data.uid) {
                    // this.personalIndex = index;
                    personInfo = params;
                }
                let comp: RankingListItem = null;
                if (index == 0) {
                    this.itemNode.active = true;
                    comp = this.itemNode.getComponent(RankingListItem);
                    comp.setData(params);
                } else {
                    let _itemNode = cc.instantiate(this.itemNode);
                    _itemNode.parent = itemParent;
                    comp = _itemNode.getComponent(RankingListItem);
                    comp.setData(params);
                }
                if (index < 3) {
                    comp.clickCallback = this.itemClickHandler.bind(this);
                }
            })
            this.refreshPersonalInfo(personInfo, nextCall);
            nextCall();
        })
    }

    itemClickHandler(index: number, buttonStateFunc: Function) {
        service.analytics.logEvent("rank_click_like", "", "")
        let module = main.module;
        let reward = module.calcUiShow.getTimeStageReward(3 * 60);
        if(reward.num == 0 && reward.numE == 0){
            reward = {num:1,numE:3}
        }
        main.module.gameMainControl.playCreditEffect(reward, () => {
            main.module.calcUiShow.refreshCredit(reward, () => {
            }, true)
        });
        buttonStateFunc && buttonStateFunc();
        main.module.gameProtocol.requestClickLike(service.account.data.uid, index, (data) => {
        })
    }

    refreshPersonalInfo(personInfo: RankingListParams, callback: Function) {
        this.mainNodes.get("personal_head").active = false;
        if (personInfo) {
            this.mainNodes.get("onlist_lab").getComponent(cc.Label).fontSize = 55;
            this.mainNodes.get("onlist_lab").getComponent(cc.Label).string = personInfo.index + 1 + "";
            let headSpr = cc.loader.getRes(`main/head/head_${personInfo["icon"] || 1}`, cc.SpriteFrame);
            this.mainNodes.get("personal_head").active = true;
            this.mainNodes.get("personal_head").getComponent(cc.Sprite).spriteFrame = headSpr;
            this.mainNodes.get("personal_nickname").getComponent(cc.Label).string = `${personInfo["nickname"]}` || service.account.data.uid + "";
            this.mainNodes.get("ranking_num").getComponent(LabelChangeSymbol).num = personInfo.score;
            callback && callback();
        } else {
            this.mainNodes.get("onlist_lab").getComponent(LanguageLabel).dataID = "list_4";
            this.mainNodes.get("onlist_lab").getComponent(cc.Label).fontSize = 30;
            main.module.gameProtocol.requestHead(service.account.data.uid, (data) => {
                let headSpr = cc.loader.getRes(`main/head/head_${data["icon"]["icon"] || 1}`, cc.SpriteFrame);
                this.mainNodes.get("personal_head").active = true;
                this.mainNodes.get("personal_head").getComponent(cc.Sprite).spriteFrame = headSpr;
                this.mainNodes.get("personal_nickname").getComponent(cc.Label).string = `${data["icon"]["nickName"]}` || service.account.data.uid + "";
                callback && callback();
            })
            this.mainNodes.get("ranking_num").getComponent(LabelChangeSymbol).num = main.module.vm.credit;
        }
    }


    onDestroy() {
        // this.node.parent.active = false;
        this.mainNodes = null;
        this.personalIndex = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        super.onDestroy();
    }
    onTouchHandler(event: cc.Event.EventTouch) {
        switch (event.target.name) {
            case "btn_close": {
                // this.node.destroy();
                gui.delete(this.node)
                break;
            }
        }
    }

}
