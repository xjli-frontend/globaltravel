import { gui } from "../../core/gui/GUI";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { service } from "../../service/Service";
import GameMainControl from "./GameMainControl";


const { ccclass, property } = cc._decorator;

@ccclass
export default class ViewMenu extends ComponentExtends {


    onLoad() {
        service.analytics.logEvent("menu_click_open", "", "")
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
    }

    mainControl: GameMainControl = null;
    onAdded(params: any) {
        this.mainControl = params.mainControl;
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
    }



    onTouchHandler(event: cc.Event.EventTouch) {
        switch (event.target.name) {
            case "btn_ranking":
            case "btn_gift":
            case "btn_setting": {
                this.mainControl.openMainPop(event.target.name);
                this.node.destroy();
                break;
            }
            default: {
                gui.delete(this.node);
            }
        }
    }

    onDestroy() {
        this.mainControl = null;
        super.onDestroy();
    }

}
