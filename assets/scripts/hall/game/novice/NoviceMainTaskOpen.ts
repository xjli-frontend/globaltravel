
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import LabStepText from "../effect/LabStepText";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoviceMainTaskOpen extends ComponentExtends {


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
        let btnNode = params["btnNode"];
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("tip").active = false;
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_20`;
            nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                // let worldPos = btnNode.parent.convertToWorldSpaceAR(btnNode.getPosition());
                // let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                // let copyNode:cc.Node = cc.instantiate(btnNode);
                // copyNode.opacity = 255;
                // copyNode.parent = this.node;
                // copyNode.active = true;
                // let copyNodes = ViewUtils.nodeTreeInfoLite(this.node);
                // let taskOffSke = copyNodes.get("task_off").getComponent(sp.Skeleton);
                // taskOffSke.setAnimation(0,"reward_idle_1",true);
                // copyNode.setPosition(spacePos);
                this.node.once(cc.Node.EventType.TOUCH_END, () => {
                    callback && callback();
                    this.node.destroy();
                })
            })
        })
    }

    onDestroy(){
        super.onDestroy();
    }

}
