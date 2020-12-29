import { Message } from "../../core/event/MessageManager";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import ButtonEffectSprite from "../../core/ui/button/ButtonEffectSprite";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";
import { service } from "../../service/Service";
import { formatParams } from "../CalcTool";
import { TaskType } from "../CalcUiShow";
import { AdvMessage, AdvRewardType } from "./adv/AdvControl";
import LabTouchFont from "./effect/LabTouchFont";

const { ccclass, property } = cc._decorator;

@ccclass
export default class OfffLineRewardPrompt extends ComponentExtends {

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
    }

    reward: formatParams = null;
    onAdded(params: any) {
        this.btnState();
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        mainNodes.get("reward_time").active = params.spanTime > 0;
        mainNodes.get("reward_time").getComponent(cc.Label).string = `${Math.floor(params.spanTime / 1000)}s`;
        this.setLab(params["reward"]);
        let person = this.node.getChildByName("person").getComponent(sp.Skeleton);
        person.setCompleteListener((func) => {
            if (func.animation.name == "reward_fadein") {
                person.setAnimation(0, "reward_loop", true);
            } else if (func.animation.name == "reward_die") {
                this.node.active = false;
                main.module.gameMainControl.playCreditEffect(this.reward, (_reward) => {
                    main.module.calcUiShow.refreshCredit(_reward, () => {
                        let _taskList = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.OFF_LINE, 1)
                        main.module.gameProtocol.sendTaskList(_taskList, (obj) => {
                            main.module.vm.taskList = _taskList;
                        })
                    }, true)
                });
                this.node.destroy();
            }
        })
        person.setAnimation(0, "reward_fadein", false);
    }

    setLab(reward: formatParams) {
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        mainNodes.get("reward_lab").active = reward.num > 0;
        mainNodes.get("reward_lab").getComponent(LabelChangeSymbol).changeTo(0.3, reward, () => {

        });
        this.reward = reward;
        if (this.reward.numE == 0) {
            this.reward = {
                num: Math.floor(this.reward.num),
                numE: this.reward.numE
            }
        }
        cc.log(this.reward)
        let btnReward = main.module.calcTool.calcMutiNum(this.reward, {
            num: 3,
            numE: 0
        })
        mainNodes.get("btn_reward_lab").getComponent(LabelChangeSymbol).changeTo(0.3, btnReward, () => {

        });
    }


    btnState() {
        let comp = this.node.getChildByName("btn_diamond").getComponent(ButtonEffectSprite);
        comp.canTouch = main.module.vm.diamond >= 10;
        let compP = this.node.getChildByName("btn_poster").getComponent(ButtonEffectSprite);
        compP.canTouch = !cc.sys.isBrowser;
        comp.node.getChildByName("btn_reward_lab").getComponent(LabTouchFont).canTouch = comp.canTouch;
        // comp.node.getChildByName("btn_reward_lab").getComponent(cc.Label).spacingX = main.module.vm.diamond >= 10 ? -3:-5;
    }
    onTouchHandler(event: cc.Event.EventTouch) {
        if (event.target.getComponent(ButtonEffect) && !event.target.getComponent(ButtonEffect).canTouch) {
            return;
        }

        switch (event.target.name) {
            case "btn_close": {
                service.analytics.logEvent("offline_click_close", "", "")
                let person = this.node.getChildByName("person").getComponent(sp.Skeleton);
                person.setAnimation(0, "reward_die", false);
                break;
            }
            case "btn_poster": {
                service.analytics.logEvent("offline_click_ad", "", "")
                Message.dispatchEvent(AdvMessage.PLAY, {
                    callback: (success: boolean, type: number) => {
                        if (type == AdvRewardType.OFFLINE_REWARD) {
                            if (success) {
                                cc.log(`离线奖励观看视频翻7倍成功`)
                                this.reward = main.module.calcTool.calcMutiNum(this.reward, {
                                    num: 7,
                                    numE: 0
                                })
                                let person = this.node.getChildByName("person").getComponent(sp.Skeleton);
                                person.setAnimation(0, "reward_die", false);
                            } else {
                                cc.log(`离线奖励观看视频翻7倍失败`)
                                let person = this.node.getChildByName("person").getComponent(sp.Skeleton);
                                person.setAnimation(0, "reward_die", false);
                            }
                        }
                    }, type: AdvRewardType.OFFLINE_REWARD
                });
                break;
            }
            case "btn_diamond": {
                service.analytics.logEvent("offline_click_gem", "", "")
                let person = this.node.getChildByName("person").getComponent(sp.Skeleton);
                person.setAnimation(0, "reward_die", false);
                this.reward = main.module.calcTool.calcMutiNum(this.reward, {
                    num: 3,
                    numE: 0
                })
                main.module.gameProtocol.requestDiamondChange(10, (data) => {
                    main.module.vm.diamond = data["userAccount"]["credit"];
                })
                break;
            }
        }
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        Message.removeEventTarget(this);
        this.reward = null;
        super.onDestroy();
    }
}