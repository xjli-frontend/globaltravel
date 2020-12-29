
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import LabStepText from "../effect/LabStepText";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoviceStart extends ComponentExtends {


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
        nodes.get("tip").active = false;
        nodes.get("btn_start").active = false;
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_1`;
            nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                nodes.get("btn_start").active = true;
                nodes.get("btn_start").on(cc.Node.EventType.TOUCH_END, () => {
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
