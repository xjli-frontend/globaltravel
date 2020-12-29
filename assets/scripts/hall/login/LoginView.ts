/*
 * @CreateTime: Aug 7, 2019 3:46 PM 
 * @Author: undefined 
 * @Contact: undefined 
* @Last Modified By: undefined
* @Last Modified Time: Aug 8, 2019 2:53 PM
 * @Description: Modify Here, Please  
 * 登录界面
 */

import engine from "../../core/Engine";
import { ViewLayout } from "../../core/ui/ViewLayout";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { AccountEvent } from "../../service/account/Account";
import { LoginType } from "../../service/account/LoginType";
import { RequestAccountPool } from "../../service/account/RequestAccount";
import { service } from "../../service/Service";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginView extends ViewLayout {

    public viewObj: HashMap<string, cc.Node> = null;

    /**
     * 显示登录
     * @param autoLogin 是否自动登录
     */
    showLogin(autoLogin: boolean = false) {
        engine.log.info(`showLogin`);
        this.viewObj.get("loading_indicator").active = false;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.on(AccountEvent.LOGINED, this.eventHandler, this);
        if (autoLogin) {
            let lastLoginType: LoginType = service.account.currentPlatform;
            if (lastLoginType != LoginType.unlogin) {
                this.viewObj.get("btns").active = false;
                this.doLogin(lastLoginType);
            } else {
                this.viewObj.get("btns").active = true;
                this.viewObj.get("loading_tip").active = false;
            }
        } else {
            this.viewObj.get("btns").active = true;
            this.viewObj.get("loading_tip").active = false;
        }
    }

    onDestroy() {
        this.viewObj = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        super.onDestroy();
    }

    private eventHandler(event: string, data: any) {
        switch (event) {
            case AccountEvent.LOGINED: {
                this.viewObj.get("lab_loading_tip").getComponent(cc.Label).string = "login successfully";
                cc.log("登录成功，进入主界面")
                engine.log.info(`登录成功，进入主界面`);
                main.module.enterGame();
                break;
            }
        }
    }

    private doLogin(loginType: LoginType) {
        this.viewObj.get("lab_loading_tip").getComponent(cc.Label).string = "logging";
        this.viewObj.get("loading_indicator").active = true;
        let request = RequestAccountPool.get(loginType);
        request.sdkLogin((data) => {
            if (!data) {
                this.viewObj.get("loading_indicator").active = false;
                // 显示登录按钮
                this.viewObj.get("btns").active = true;
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
    private onTouchHandler(event: cc.Event.EventTouch) {
        switch (event.target.name) {
            case "btn_guest": {
                this.doLogin(LoginType.visitor);
                break;
            }
            case "btn_facebook": {
                this.doLogin(LoginType.facebook);
                break;
            }
            case "btn_google": {
                this.doLogin(LoginType.google);
                break;
            }
            case "btn_twitter": {
                this.doLogin(LoginType.twitter);
                break
            }
            default: {
                // gui.notify.show("未开放")
                break;
            }
        }
    }
}

