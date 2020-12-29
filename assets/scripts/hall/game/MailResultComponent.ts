
import engine from "../../core/Engine";
import { ComponentExtends } from "../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MailResultComponent extends ComponentExtends {

    onAdded(params: any) {
        let ske = this.node.getChildByName("skeleton").getComponent(sp.Skeleton);
        let lang = engine.i18n.currentLanguage == "zh" ? "cn" : "en";
        this.node.getChildByName("btn_ok").active = false;
        ske.setCompleteListener((func) => {
            if (func.animation.name == "reward_fadein") {
                ske.setAnimation(0, "reward_loop", true);
                this.node.getChildByName("btn_ok").active = true;
                this.node.getChildByName("btn_ok").on(cc.Node.EventType.TOUCH_END, () => {
                    this.node.destroy();
                })
            }
        })
        ske.setSkin(lang);
        ske.setAnimation(0, "reward_fadein", false);
        this.node.getChildByName("result").children.forEach((child) => {
            child.scale = 0;
            child.RunAction(ezaction.scaleTo(5 / 30, { scale: 1.2 })).onStoped(() => {
                child.RunAction(ezaction.scaleTo(10 / 30, { scale: 1 })).onStoped(() => {

                })
            })
        })
    }
}