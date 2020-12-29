import engine from "../../Engine";
import { EngineMessage } from "../../EngineMessage";
import { ComponentExtends } from "../ComponentExtends";

/*
 * @CreateTime: Sep 23, 2017 2:57 PM
 * @Author: zhljian
 * @Contact: 1065214861@qq.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 7, 2018 9:35 PM
 * @Description: Modify Here, Please 
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class Toast extends ComponentExtends {
    @property(cc.Label)
    lab: cc.Label = null;

    private fadeTime: number = 0.5;
    private stayTime: number = 1.5;

    onLoad() {
        this.on(EngineMessage.GAME_RESIZE, (event: string, args?: any) => {
            if (event == EngineMessage.GAME_RESIZE) {
                this.layout();
            }
        }, this);
    }

    private layout() {
        this.node.scale = engine.fit ? 0.6 : 1;
    }

    /**
     * 显示toast
     * @param msg       文本
     * @param useI18n   多语言标签
     * @param callback  提示动画播放完成回调
     */
    public showToast(msg: string, useI18n: boolean, callback: Function) {
        this.layout();

        let label = this.lab.node.getComponent("LanguageLabel");
        if (useI18n) {
            label.dataID = msg;
        }
        else {
            if (label)
            label.dataID = "";
            this.lab.string = msg;
        }

        this.node.opacity = 255;
        this.node.setPosition(0, 0);

        let fadeAction = cc.fadeOut(this.fadeTime);
        let endAction = cc.callFunc(() => {
            if (callback) callback(this.node);
        });

        if (cc.isValid(this.node)) {
            this.node.stopAllActions();
            this.node.runAction(cc.sequence(cc.delayTime(this.stayTime), fadeAction, endAction));
        }
    }
}