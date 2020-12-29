import engine from "./core/Engine";
import { ezplugin } from "./core/ezplugin/ezplugin";
import { gui } from "./core/gui/GUI";
import { ViewUtils } from "./core/ui/ViewUtils";
import { HashMap } from "./core/util/HashMap";
import Config from "./service/config/Config";

const { ccclass } = cc._decorator;
@ccclass
export default class ServerTest extends cc.Component {

    viewObj: HashMap<string, cc.Node> = null;

    config: any = null;

    config_test: any = null;

    next: Function = null;

    selected: any = null;

    onLoad() {
        this.viewObj = ViewUtils.nodeTreeInfoLite(this.node);
        this.node.on(cc.Node.EventType.TOUCH_END, this.clickHandler, this);
        // this.initLogPrint();

        // let _cclog = cc.log;
        // cc.log = function (...log) {
        //     let str = "";
        //     for (let i = 0; i < arguments.length; i++) {
        //         str += arguments[i] + " , ";
        //     }
        //     // 同步输出到 logPanel上
        //     engine.log.info(str);
        //     _cclog(...log);
        // }
    }
    initLogPrint() {
        if (typeof jsb === "undefined" || !jsb) {
            return;
        }
        let _cclog = cc.log;
        let plugin = ezplugin.get("PluginOS")
        let logprint = function () {
            let str = engine.timer.format("MM-dd hh:mm:ss", new Date()) + " ";
            for (let i = 0; i < arguments.length; i++) {
                str += arguments[i] + " , ";
            }
            plugin && plugin.excute("nslog", str);

            // let content = "";
            // if (jsb.fileUtils.isFileExist(logfilepath)) {
            //     content = jsb.fileUtils.getStringFromFile(logfilepath);
            // }
            // content = content + str + "\n";
            // jsb.fileUtils.writeStringToFile(content, logfilepath);
            // if (cc.sys.os == cc.sys.OS_IOS) {
            //     plugin && plugin.excute("nslog", str);
            // } else {
            //     _cclog(arguments);
            // }
        }
        cc.log = logprint;
        cc.warn = logprint;
        cc.error = logprint;
    }
    onAdded(params: any) {
        this.next = params.next;
        let remoteGateData = params.data;
        if (remoteGateData) {
            this.config_test = remoteGateData["debug"];
            this.config = remoteGateData["release"];
        } else {
            this.config = Config.game.data;
            this.config_test = Config.game.data;
        }
        this.setInputShow(this.config_test);
    }
    onDestroy() {
        this.next = null;
        this.config = null;
        this.config_test = null;
        this.selected = null;
        this.viewObj = null;
        cc.loader.releaseRes("debug/LogPanel", cc.Prefab);
    }
    setInputShow(data) {
        if (!data) {
            return;
        }
        this.selected = data;
        this.viewObj.get("input_server").getComponent(cc.EditBox).string = data["server"];
        this.viewObj.get("input_res_server").getComponent(cc.EditBox).string = `${data["res_server"]}`;
        this.viewObj.get("lab_desc").getComponent(cc.Label).string = JSON.stringify(data, null, 2)
    }

    clickHandler(event) {
        switch (event.target.name) {
            case "btn_enter": {
                if (!this.selected) {
                    return;
                }
                let ipsAndPort = this.viewObj.get("input_server").getComponent(cc.EditBox).string;
                this.selected["server"] = ipsAndPort;
                this.selected["res_server"] = this.viewObj.get("input_res_server").getComponent(cc.EditBox).string;
                this.next(this.selected);
                gui.delete(this.node);
                break;
            }
            case "btn_aws": {
                this.setInputShow(this.config);
                break;
            }
            case "btn_145": {
                this.setInputShow(this.config_test);
                break;
            }
        }
    }
}