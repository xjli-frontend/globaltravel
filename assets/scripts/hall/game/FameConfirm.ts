import engine from "../../core/Engine";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FameConfirm extends ComponentExtends {

    onLoad() {
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        }
    }

    clickCallback: Function = null;
    onBtnHandler(event) {
        let name = event.target.name;
        switch (name) {
            case "btn_close":
            case "btn_cancel":
                this.node.destroy();
                break;
            case "btn_ok":
                if (this.clickCallback) {
                    this.clickCallback();
                }
                break;

            default:
                break;
        }
    }

    onAdded(params: any) {
        let ske = this.node.getChildByName("skeleton").getComponent(sp.Skeleton);
        let lang = engine.i18n.currentLanguage == "zh" ? "cn" : "en";
        this.node.getChildByName("btn_ok").active = false;
        this.node.getChildByName("btn_cancel").active = false;
        this.node.getChildByName("btn_close").active = false;
        ske.setCompleteListener((func) => {
            if (func.animation.name == "reward_fadein") {
                ske.setAnimation(0, "reward_loop", true);
                this.node.getChildByName("btn_ok").active = true;
                this.node.getChildByName("btn_close").active = true;
                this.node.getChildByName("btn_cancel").active = true;
            }
        })
        this.node.getChildByName("result_lab").getComponent(LanguageLabel).setVars("prestige_info_1", params.per);
        ske.setSkin(lang);
        ske.setAnimation(0, "reward_fadein", false);
        // this.node.getChildByName("title_spr").getComponent(cc.Label).string = params.string;
        this.node.getChildByName("result_spr").scale = 0;
        let spf = cc.loader.getRes(`main/icon/icon${params.id}`,cc.SpriteFrame)
        this.node.getChildByName("result_spr").getComponent(cc.Sprite).spriteFrame = spf;
        this.node.getChildByName("result_spr").RunAction(ezaction.scaleTo(5 / 30, { scale: 1.1 * 1.5 })).onStoped(() => {
            this.node.getChildByName("result_spr").RunAction(ezaction.scaleTo(10 / 30, { scale: 1.1 * 1.5 })).onStoped(() => {

            })
        })
        this.node.getChildByName("result_lab").scale = 0;
        this.node.getChildByName("result_lab").RunAction(ezaction.scaleTo(5 / 30, { scale: 1.1 })).onStoped(() => {
            this.node.getChildByName("result_lab").RunAction(ezaction.scaleTo(10 / 30, { scale: 1 })).onStoped(() => {

            })
        })
        this.node.getChildByName("title_spr").scale = 0;
        let muti = lang == "en" ? 0.8 : 1;
        this.node.getChildByName("title_spr").RunAction(ezaction.scaleTo(5 / 30, { scale: 1.1 * muti })).onStoped(() => {
            this.node.getChildByName("title_spr").RunAction(ezaction.scaleTo(10 / 30, { scale: 1 * muti })).onStoped(() => {

            })
        })
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);

        super.onDestroy();
        this.clickCallback = null;
    }
}



