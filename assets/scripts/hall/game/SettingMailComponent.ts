
import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import ExToggleGroup from "../../core/ui/ExToggleGroup";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { LoginType } from "../../service/account/LoginType";
import { RequestAccountPool } from "../../service/account/RequestAccount";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import EditBoxControl from "./effect/EditBoxControl";
import HeadSelect from "./effect/HeadSelect";
import SettingMailListItem from "./SettingMailListItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SettingMailComponent extends ComponentExtends {

    @property(cc.Node)
    mailItemNode: cc.Node = null;

    @property(cc.Node)
    selectNode: cc.Node = null;

    mainNodes: HashMap<string, cc.Node> = null;

    onLoad() {
        service.analytics.logEvent("set_click_open", "", "")

        this.mainNodes = ViewUtils.nodeTreeInfoLite(this.node);

        this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).toggleCallback = (toggle) => {
            Message.dispatchEvent(AudioMessage.EFFECT, "ui_2");
            this.mainNodes.get("personal_info").active = toggle.node.name == "toggle1";
            this.mainNodes.get("mails").active = toggle.node.name != "toggle1";
            if (toggle.node.name == "toggle2") {
                this.refreshMailList();
            } else {
                this.refreshPersonalInfo();
            }
            this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).getItems().forEach((child) => {
                child.getChildByName("checkmark").active = toggle.node.name == child.name;
            })
        }
        this.mainNodes.get("personal_info").active = true;
        this.mainNodes.get("mails").active = false;
        this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).setIndex(0);

        this.mainNodes.get("btns").children.forEach((child) => {
            if (child.getComponent(cc.Toggle)) {
                child.on("toggle", (toggle: cc.Toggle) => {
                    child.getChildByName("Background").active = !toggle.isChecked;
                    child.getChildByName("checkmark").active = toggle.isChecked;
                    if (child.name == "btn_language") {
                        if (!toggle.isChecked) {
                            this.refreshLanguageList()
                        } else {
                            this.refreshLanguageList(main.module.vm.lang);
                        }
                        this.mainNodes.get("language").getComponent(cc.Sprite).enabled = !toggle.isChecked;
                    }
                    if (child.name == "btn_music") {
                        main.audio.musicSwitch = toggle.isChecked;
                    }
                    if (child.name == "btn_sound") {
                        main.audio.effectSwitch = toggle.isChecked;
                    }
                    if (child.name == "btn_notice") {
                        main.module.vm.message = toggle.isChecked;
                    }
                    Message.dispatchEvent(AudioMessage.EFFECT, "ui_2");
                }, this);
                child.getChildByName("Background").active = false;
                child.getChildByName("checkmark").active = true;

            }
        })
        this.mainNodes.get("btns").getChildByName("btn_music").getComponent(cc.Toggle).isChecked = main.audio.musicSwitch;
        this.mainNodes.get("btns").getChildByName("btn_sound").getComponent(cc.Toggle).isChecked = main.audio.effectSwitch;
        this.refreshLanguageList(main.module.vm.lang);
        this.mainNodes.get("btns").getChildByName("btn_notice").getComponent(cc.Toggle).isChecked = main.module.vm.message;

        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.refreshPersonalInfo();
        this.mainNodes.get("language").children.forEach((child) => {
            child.on(cc.Node.EventType.TOUCH_END, (event) => {
                main.module.vm.lang = event.target.name;
                this.mainNodes.get("btn_language").getComponent(cc.Toggle).isChecked = true;
            })
        })
        this.refreshHeadNickName();
        let callFunc = () => {
            service.analytics.logEvent("set_click_head", "", "")
            let popViewParams: PopViewParams = {
                touchClose: true,
                onAdded: (node, params) => {
                    node.getChildByName("main").y = -200;
                },
                onRemoved: (node) => {
                    let gameData = main.module.gamedata;
                    this.headId = node.getComponent(HeadSelect).headId;
                    gameData.headId = this.headId;
                    node.getComponent(HeadSelect).headId = null;
                }
            }
            gui.popup.add(`popup/head_array`, { targetNode: this.mainNodes.get("head"), headId: this.headId }, popViewParams)
        }
        this.mainNodes.get("click_head").on(cc.Node.EventType.TOUCH_END, callFunc, this);
        this.mainNodes.get("head").on(cc.Node.EventType.TOUCH_END, callFunc, this);
    }

    headId: number = 1;
    refreshHeadNickName() {
        this.mainNodes.get("head").active = false;
        this.mainNodes.get("nickname").getComponent(cc.EditBox).string = "";
        let gameData = main.module.gamedata;
        if (gameData.headId) {
            let spf = cc.loader.getRes(`main/head/head_${gameData.headId}`, cc.SpriteFrame);
            this.headId = gameData.headId;
            this.mainNodes.get("head").active = true;
            this.mainNodes.get("head").getComponent(cc.Sprite).spriteFrame = spf;
            this.mainNodes.get("nickname").getComponent(cc.EditBox).string = `${gameData.nickName}` || service.account.data.uid + "";
            this.mainNodes.get("nickname").getComponent(EditBoxControl).initStr = `${gameData.nickName}` || service.account.data.uid + "";;
        } else {
            main.module.gameProtocol.requestHead(service.account.data.uid, (data) => {
                let spf = cc.loader.getRes(`main/head/head_${data["icon"]["icon"] || 1}`, cc.SpriteFrame);
                this.headId = data["icon"]["icon"] || 1;
                gameData.headId = this.headId;
                this.mainNodes.get("head").active = true;
                this.mainNodes.get("head").getComponent(cc.Sprite).spriteFrame = spf;
                this.mainNodes.get("nickname").getComponent(cc.EditBox).string = `${data["icon"]["nickName"]}` || service.account.data.uid + "";
                gameData.nickName = data["icon"]["nickName"] || service.account.data.uid + "";
                this.mainNodes.get("nickname").getComponent(EditBoxControl).initStr = `${data["icon"]["nickName"]}` || service.account.data.uid + "";;
            })
        }
    }

    refreshLanguageList(language?: string) {
        if (language) {
            this.mainNodes.get("language").children.forEach((child) => {
                child.active = child.name == language;
            })
        } else {
            this.mainNodes.get("language").children.forEach((child) => {
                child.active = true;
            })
        }
    }

    update() {
        this.refreshPersonalInfo();
    }

    /** 刷新个人信息 */
    refreshPersonalInfo() {
        // this.mainNodes.get("can_use_num").getComponent(LabelChangeSymbol).num = main.module.vm.credit;
        // this.mainNodes.get("this_income_num").getComponent(LabelChangeSymbol).num = main.module.vm.win;
        // this.mainNodes.get("total_income_num").getComponent(LabelChangeSymbol).num = main.module.vm.winTotal;
        // this.mainNodes.get("total_prestige_num").getComponent(LabelChangeSymbol).num = main.module.vm.fame;
    }

    /** 刷新邮件列表 */
    mailItemPoool: Array<cc.Node> = [];
    refreshMailList() {
        this.mailItemNode.active = false;
        this.removeItems();
        main.module.gameProtocol.requestMessageList((data) => {
            this.mailItemNode.active = data["mailList"]["list"].length > 0;
            this.mainNodes.get("count_mail").active = data["mailList"]["list"].length > 0;
            this.mainNodes.get("count_mail_num").getComponent(cc.Label).string = data["mailList"]["list"].length;
            data["mailList"]["list"].forEach((mail, index) => {
                if (index == 0) {
                    this.mailItemNode.getComponent(SettingMailListItem).setData({
                        title: mail.title,
                        content: mail.content,
                        date: mail.sendTime
                    })
                } else {
                    let _itemNode = cc.instantiate(this.mailItemNode);
                    _itemNode.parent = this.mainNodes.get("content");
                    _itemNode.getComponent(SettingMailListItem).setData({
                        title: mail.title,
                        content: mail.content,
                        date: mail.sendTime
                    });
                    this.mailItemPoool.push(_itemNode);
                }
            })
        })
    }

    removeItems() {
        this.mainNodes.get("main").getComponent(cc.ScrollView).scrollToTop(0.2);
        this.mailItemPoool.forEach((item) => {
            item.removeFromParent(true);
        })
        this.mailItemPoool = [];
    }


    onDestroy() {
        // this.node.parent.active = false;
        this.mainNodes = null;
        this.headId = null;
        this.mailItemPoool = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        super.onDestroy();
    }
    onTouchHandler(event: cc.Event.EventTouch) {
        switch (event.target.name) {
            case "btn_close": {
                // this.node.destroy()
                gui.delete(this.node);
                break;
            }
            case "sign_facebook": {
                this.doLogin(LoginType.facebook);
                break;
            }
            case "sign_google": {
                this.doLogin(LoginType.google);
                break;
            }
            case "logout": {
                main.module.exitHall();
                break;
            }

        }
    }

    private doLogin(loginType: LoginType) {
        let request = RequestAccountPool.get(loginType);
        request.sdkLogin((data) => {
            if (!data) {
                return;
            }
            service.account.login(loginType);
        })
        let typedefine = {}
        typedefine[LoginType.visitor] = "login_ghost";
        typedefine[LoginType.facebook] = "login_fb";
        typedefine[LoginType.google] = "login_gp";
        service.analytics.logEvent(typedefine[loginType] || loginType, "", "")
    }

}
