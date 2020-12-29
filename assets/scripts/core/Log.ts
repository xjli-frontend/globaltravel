/*
 * @CreateTime: Jul 24, 2020 2:52 PM 
 * @Author: howe 
 * @Contact: ihowe@outlook.com 
* @Last Modified By: howe
* @Last Modified Time: Jul 29, 2020 3:13 PM
 * @Description: Modify Here, Please 
 * log面板 
 */
import { HashMap } from "./util/HashMap";
import { ViewUtils } from "./ui/ViewUtils";
import engine from "./Engine";
import { ezplugin } from "./ezplugin/ezplugin";

class LogPanel extends cc.Component {/*  */
    nodes: HashMap<string, cc.Node> = null;
    scollView: cc.ScrollView = null;
    onLoad() {

        this.nodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.scollView = this.nodes.get("scrollview").getComponent(cc.ScrollView);
        this.nodes.get("btn_console").on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.nodes.get("btns").on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.onTouchHandler({ target: this.nodes.get("btn_console") })
        this.nodes.get("logitem").width = cc.winSize.width - 50;
    }
    onTouchHandler(event: any) {
        switch (event.target.name) {
            case "btn_console": {
                let aa = !this.nodes.get("scrollview").active;
                this.nodes.get("scrollview").active = aa;
                this.nodes.get("consolestate").getComponent(cc.Label).string = "log " + (aa ? "on" : "off");
                break;
            }
            case "btn_clearCache": {
                this.push("cc.sys.localStorage.clear()")
                cc.sys.localStorage.clear();
                break;
            }
            case "btn_paste": {
                let plugin = ezplugin.get("PluginOS");
                if (plugin) {
                    let labels = this.scollView.content.getComponentsInChildren(cc.Label);
                    let strs = "";
                    for (let lab of labels) {
                        strs += "\n" + lab.string;
                    }
                    plugin.excuteInUIThread("clipboard", strs);
                } else {

                }
                break;
            }
        }
    }
    onDestroy() {
        this.nodes.get("btns").off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.nodes.get("btn_console").off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.nodes.clear();
        this.nodes = null;
        this.scollView = null;
    }
    push(infos) {
        let str = engine.timer.format("MM-dd hh:mm:ss", new Date());
        let ouput = `[${str}] ${infos}`;
        let logitem = cc.instantiate(this.nodes.get("logitem"));
        logitem.parent = this.scollView.content;
        logitem.active = true;
        logitem.getComponent(cc.Label).string = ouput;
        this.scollView.scrollToBottom();
    }
}
export class Log {
    logPanel: LogPanel = null;
    constructor() {
        if (CC_EDITOR) {
            return;
        }
        if (cc.sys.isBrowser || CC_PREVIEW || CC_DEBUG) {
            let self = this;
            cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, function () {
                cc.loader.loadRes("debug/LogPanel", cc.Prefab, (err, res) => {
                    self.initview(res);
                    self = null;
                })
            });
        }
    }
    private initview(res: cc.Prefab) {
        let scene = cc.director.getScene();
        let logPanel: cc.Node = cc.instantiate(res);
        scene.addChild(logPanel, 999);
        this.logPanel = logPanel.addComponent(LogPanel);
    }
    public info(...args) {
        let prams = Array.prototype.slice.apply(arguments).join(",")
        if (this.logPanel) {
            this.logPanel.push(prams);
        }
        cc.log(prams)
    }
}