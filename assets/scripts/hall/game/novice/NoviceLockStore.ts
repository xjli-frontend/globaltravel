
import { PopViewParams } from "../../../core/gui/Defines";
import { gui } from "../../../core/gui/GUI";
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import LabStepText from "../effect/LabStepText";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoviceLockStore extends ComponentExtends {


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
        let btnNode = params["btnNode"];
        let callback = params["callback"];
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("skeleton").active = false;
        nodes.get("tip").active = false;
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_2`;
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                this.node.getChildByName("skeleton").active = true;
                let copyNode = cc.instantiate(btnNode);
                copyNode.active = true;
                copyNode.parent = this.node;
                let worldPos = btnNode.parent.convertToWorldSpaceAR(btnNode.getPosition());
                let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                this.node.getChildByName("skeleton").setPosition(spacePos);
                copyNode.setPosition(spacePos);
                this.node.getChildByName("skeleton").zIndex = 100;
                copyNode.once(cc.Node.EventType.TOUCH_END, () => {
                    copyNode.destroy();
                    this.panelAnim(nodes.get("panel"), true, false, () => {
                        let price = main.module.calcUiShow.calcTargetPrice(`store_1`, 0, 1);
                        let popViewParams: PopViewParams = {
                            modal: true,
                            opacity: 126,
                            touchClose: false,
                            onAdded: (unlockNode) => {
                                let buyNode = unlockNode.getChildByName("btn_buy");
                                let _skeleton = this.node.getChildByName("skeleton")
                                _skeleton.parent = unlockNode;
                                this.node.destroy();
                                _skeleton.setPosition(buyNode.getPosition())
                            }
                        }
                        gui.popup.add(`main/store_unlock`, {
                            storeId: 1, callback: () => {
                                callback && callback();
                            }, price: price, active: 1
                        }, popViewParams)
                    })
                })
            });
    })
}

    onDestroy(){
        super.onDestroy();
    }

    showButtonEffect(btnNode: cc.Node, state: boolean) {
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        btnNode.color = color;
        if (btnComp) {
            btnComp.canTouch = state;
        }
        let func = (_node) => {
            if (_node.children.length == 0) {
                return;
            }
            for (let child of _node.children) {
                child.color = color;
                func(child);
            }
        }
        func(btnNode)
    }


}
