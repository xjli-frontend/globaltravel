/*
 * @CreateTime: Mar 13, 2019 4:07 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Mar 13, 2019 4:07 PM
 * @Description: Modify Here, Please \
 *
 * GUI入口文件
 */
import { EngineMessage } from "../EngineMessage";
import { Message } from "../event/MessageManager";
import DelegateComponent from "./DelegateComponent";
import { LayerCustomPopUp } from "./LayerCustomPopUp";
import { LayerDialog } from "./LayerDialog";
import { LayerFloat } from './LayerFloat';
import { LayerLoading } from "./LayerLoading";
import { LayerNotify } from "./LayerNotify";
import { LayerPopUp } from "./LayerPopup";
import { LayerUI } from "./LayerUI";


export class gui {

    /** ui控制器，包括ui操作界面、freespin中奖、结算、小游戏可使用该模块 */
    public static ui: LayerUI = null;

    /** 浮动弹窗控制器，比游戏层级高，低于其他层级 */
    public static float: LayerFloat = null;

    /** ui弹出层 */
    public static popup: LayerPopUp = null;

    /** loading控制器，主loadig、游戏当中资源加载、网络连接提示使用该模块 */
    public static loading: LayerLoading = null;

    /** 普通弹窗控制器，游戏内功能对话界面、确认*/
    public static dialog: LayerDialog = null;

    /** 系统级控制器，比dialog层级更高，游戏内错误、网络等弹框*/
    public static alert: LayerDialog = null;

    /** 消息提示控制器，请使用show方法来显示 */
    public static notify: LayerNotify = null;

    /**
     * 自定义层popup
     */
    public static customPopup: LayerCustomPopUp = null;

    public static init(root: cc.Node) {
        if (gui.ui) {
            cc.warn('【gui】重复调用初始化！')
            return;
        }
        gui.ui = new LayerUI("LayerUI", new cc.Node());
        gui.customPopup = new LayerCustomPopUp("LayerCustomPopUp", null);
        gui.float = new LayerFloat("LayerFloat", new cc.Node());
        gui.popup = new LayerPopUp("LayerPopUp", new cc.Node());
        gui.loading = new LayerLoading("LayerLoading", new cc.Node());
        gui.dialog = new LayerDialog("LayerDialog", new cc.Node());
        gui.alert = new LayerDialog("LayerAlert", new cc.Node());
        gui.notify = new LayerNotify("LayerNotify", new cc.Node());

        root.addChild(gui.ui.layer);
        root.addChild(gui.float.layer);
        root.addChild(gui.popup.layer);
        root.addChild(gui.loading.layer);
        root.addChild(gui.dialog.layer);
        root.addChild(gui.alert.layer);
        root.addChild(gui.notify.layer);

        let resizeLayers = function () {
            let width = cc.winSize.width;
            let height = cc.winSize.height;
            gui.ui.layout(width, height);
            gui.float.layout(width, height);
            gui.popup.layout(width, height);
            gui.loading.layout(width, height);
            gui.dialog.layout(width, height);
            gui.alert.layout(width, height);
            gui.notify.layout(width, height);
        }
        resizeLayers();
        /** 监听resize事件处理 */
        Message.on(EngineMessage.GAME_RESIZE, resizeLayers, root);
        /** ui，popup层开启遮照，超出设计分辨率的部分不显示 */
        // gui.ui.enableMask(true);
        // gui.popup.enableMask(true);
        window["$gui"] = gui;
    }
    /**
     * 销毁所有层级
     */
    public static releaseAll() {
        gui.ui.clear();
        gui.float.clear();
        gui.popup.clear();
        gui.loading.clear();
        gui.dialog.clear();
        gui.alert.clear();
        gui.notify.clear();
    }
    /**
     * 删除一个通过gui框架添加进来的节点
     */
    public static delete(node: cc.Node) {
        if (node instanceof cc.Node) {
            let comp = node.getComponent(DelegateComponent);
            if (comp && comp.viewParams) {
                comp.removeView();
            } else {
                cc.warn(`【gui】当前删除的node不是通过gui框架添加到舞台上！`);
                node.destroy();
            }
            return;
        }
    }
}