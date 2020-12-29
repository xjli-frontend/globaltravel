
import { gui } from "../../../core/gui/GUI";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import LabStepText from "../effect/LabStepText";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoviceBatchUp extends ComponentExtends {


    onLoad(){
        
    }

    panelAnim(panelNode: cc.Node, leftOrRight: boolean, show: boolean, callback: Function) {
        let hideX = leftOrRight ? -720 : 720;
        if (show) {
            panelNode.x = hideX;
        }
        panelNode.RunAction(ezaction.scaleTo(0.3, { x: show ? 0 : hideX })).onStoped(() => {
            callback();
        })
    }

    onAdded(params:any){
        let callback = params["callback"];
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        let btnNode = main.module.gameMainControl.storeOperation.mainNodes.get("btn_buy");
        nodes.get("skeleton").active = false;
        nodes.get("tip").active = false;
        if (gui.popup.get(main.module.gameMainControl.pop_storeunlock_id)) {
            gui.popup.delete(main.module.gameMainControl.pop_storeunlock_id);
        }
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_21`;
            nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                this.node.getChildByName("skeleton").active = true;
                let worldPos = btnNode.parent.convertToWorldSpaceAR(btnNode.getPosition());
                let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                this.node.getChildByName("skeleton").setPosition(spacePos);
                let copyNode = cc.instantiate(btnNode);
                copyNode.active = true;
                copyNode.parent = this.node;
                copyNode.setPosition(spacePos);
                this.node.getChildByName("skeleton").zIndex = 100;
                copyNode.once(cc.Node.EventType.TOUCH_END, () => {
                    copyNode.destroy();
                    callback && callback();
                    nodes.get("skeleton").active = false;
                    this.node.destroy();
                })
            })
        })
    }

    onDestroy(){
        super.onDestroy();
    }

}
