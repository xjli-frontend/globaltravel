import { gui } from "../../core/gui/GUI";
import { ViewLayout } from "../../core/ui/ViewLayout";

/** 
 * 通用弹窗组件
 * Author      : zhljian
 * Create Time : 2017.9.5
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class CommonPrompt extends ViewLayout {
    @property(cc.Node)
    titleLab: cc.Node = null;

    @property(cc.Node)
    contentLab: cc.Node = null;

    @property(cc.Node)
    closeBtn: cc.Node = null;

    @property(cc.Node)
    okBtn: cc.Node = null;

    @property(cc.Node)
    okLab: cc.Node = null;

    @property(cc.Node)
    cancelBtn: cc.Node = null;

    @property(cc.Node)
    cancelLab: cc.Node = null;

    private config: any = {};

    public onLoad() {
        super.onLoad();

        // let viewInfo = ViewUtils.nodeTreeInfoLite(this.node);
        // viewInfo.get("lab_ok").getComponent(LanguageLabel).dataID = "determine";
        // viewInfo.get("lab_cancel").getComponent(LanguageLabel).dataID = "cancel";
        // viewInfo.clear()
        this.okBtn.on(cc.Node.EventType.TOUCH_END, this.onOk, this);
        this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onClose, this);
        this.cancelBtn.on(cc.Node.EventType.TOUCH_END, this.onCancel, this);
        this.node.active = false;
    }

    /**
     * @param params 参数 
     * {
     *  title:     标题
     *  content:   内容
     *  okWord:    ok按钮上的文字
     *  closeFunc: 关闭时执行的方法
     *  okFunc:    确认时执行的方法
     *  needClose: 是否需要关闭按钮
     *  needCancel: 是否需要取消按钮
     *  cancelWord: 取消按钮的文字
     *  cancelFunc: 取消时执行的方法
     * }
     */
    public onAdded(params: any = {}) {
        this.config = params || {};
        if (typeof this.config.useI18n == 'undefined') {
            this.config.useI18n = true;
        }
        this.setTitle();
        this.setContent();
        this.setOkWord();
        this.setClose();
        this.setCancelBtn();
        this.node.active = true;
    }

    onDestroy() {
        if (typeof this.config.cleanFunc == "function") {
            this.config.cleanFunc();
        }
        this.config = null;
        super.onDestroy();
    }

    private setTitle() {
        if (!this.config.title) {
            let lab = this.titleLab.getComponent(cc.Label);
            lab.string = "";
            return;
        }
        let lab = this.titleLab.getComponent(cc.Label);
        if (this.config.useI18n) {
            let comp = this.titleLab.getComponent("LanguageLabel");
            comp.dataID = this.config.title || "system_prompt";
        } else {
            lab.string = this.config.title;
        }
        if (!!this.config.type && this.config.type === "hall") {
            lab.string = lab.string.toLocaleUpperCase()
        }
    }

    private setContent() {
        if (this.config.useI18n) {
            let comp = this.contentLab.getComponent("LanguageLabel");
            if (comp) {
                comp.dataID = this.config.content;
            }
        } else {
            this.contentLab.getComponent(cc.Label).string = this.config.content;
        }
    }

    private setOkWord() {
        if (this.config.showOk === false) {
            this.okLab.parent.active = this.config.showOk;
        } else {
            if (this.config.useI18n) {
                let comp = this.okLab.getComponent("LanguageLabel");
                comp.dataID = this.config.okWord = "determine";
            } else {
                this.okLab.getComponent(cc.Label).string = this.config.okWord;
            }
        }
    }

    private setClose() {
        this.closeBtn.active = this.config.needClose == null ? true : this.config.needClose;
    }

    private setCancelBtn() {
        if (this.config.useI18n) {
            let comp = this.cancelLab.getComponent("LanguageLabel");
            comp.dataID = this.config.cancelWord = "popup_cancel";
        } else {
            this.cancelLab.getComponent(cc.Label).string = this.config.cancelWord;
        }
        this.cancelBtn.active = this.config.needCancel || false;
    }

    private onOk() {
        if (typeof this.config.okFunc == "function") {
            this.config.okFunc();
        }
        this.close();
    }

    private onClose() {
        if (typeof this.config.closeFunc == "function") {
            this.config.closeFunc();
        }
        this.close();
    }

    private onCancel() {
        if (typeof this.config.cancelFunc == "function") {
            this.config.cancelFunc();
        }
        this.close();
    }

    private close() {
        gui.delete(this.node);
    }
}