import { gui } from "../../core/gui/GUI";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ViewLayout } from "../../core/ui/ViewLayout";
import { ViewUtils } from "../../core/ui/ViewUtils";

/** 
 * 通用弹窗组件
 * Author      : zhljian
 * Create Time : 2017.9.5
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class HallPrompt extends ViewLayout {
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

        let viewInfo = ViewUtils.nodeTreeInfoLite(this.node);
        viewInfo.get("lab_ok").getComponent(LanguageLabel).dataID = "determine";
        viewInfo.get("lab_cancel").getComponent(LanguageLabel).dataID = "cancel";
        viewInfo.clear()
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
        this.setTitle();
        this.setContent();
        // this.setOkWord();
        // this.setClose();
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
        this.titleLab.getComponent(cc.Label).string = this.config.title;
    }

    private setContent() {
        this.contentLab.getComponent(cc.Label).string = this.config.content;
    }

    private setOkWord() {
        // if (this.config.showOk === false ){
            // this.okLab.parent.active = this.config.showOk;
        // }else{
        //     let comp = this.okLab.getComponent("LanguageLabel");
        //     comp.dataID = this.config.okWord;
        // }
    }

    private setClose() {
        // this.closeBtn.active = this.config.needClose == null ? true : this.config.needClose;
    }

    private setCancelBtn() {
        // let comp = this.cancelLab.getComponent("LanguageLabel");
        this.cancelBtn.active = this.config.needCancel || false;
        // comp.dataID = this.config.cancelWord;
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