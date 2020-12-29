
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import LabStepText from "../effect/LabStepText";
import FameGetComponent from "../FameGetComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NovicePublicFame extends ComponentExtends {


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
        nodes.get("skeleton").active = false;
        nodes.get("tip").active = false;
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_25`;
            nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                this.node.getChildByName("skeleton").active = true;
                let copyNode = cc.instantiate(btnNode);
                copyNode.active = true;
                copyNode.parent = this.node;
                this.showButtonEffect(copyNode, true);
                let worldPos = btnNode.parent.convertToWorldSpaceAR(btnNode.getPosition());
                let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                this.node.getChildByName("skeleton").setPosition(spacePos);
                copyNode.setPosition(spacePos);
                this.node.getChildByName("skeleton").zIndex = 100;
                copyNode.once(cc.Node.EventType.TOUCH_END, () => {
                    copyNode.destroy();
                    this.node.getChildByName("skeleton").active = false;
                    main.module.gameMainControl.openShop(1, () => {
                        let popNode = main.module.gameMainControl.popup_container.getChildByName("shop");
                        nodes.get("tip").getComponent(LabStepText).dataId = `beginner_15`;
                        nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                            let popNodes = ViewUtils.nodeTreeInfoLite(popNode);
                            let btnGetNode = popNodes.get("btn_get");
                            let worldPos = btnGetNode.parent.convertToWorldSpaceAR(btnGetNode.getPosition());
                            let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                            let copyBtnGetNode = cc.instantiate(btnGetNode);
                            copyBtnGetNode.active = true;
                            copyBtnGetNode.parent = this.node;
                            nodes.get("skeleton").active = true;
                            nodes.get("skeleton").zIndex = 100;
                            nodes.get("skeleton").setPosition(spacePos);
                            copyBtnGetNode.setPosition(spacePos);
                            copyBtnGetNode.once(cc.Node.EventType.TOUCH_END, () => {
                                nodes.get("skeleton").active = false;
                                copyBtnGetNode.destroy();
                                this.node.destroy();
                                popNodes.get("public_get").getComponent(FameGetComponent).getFameCallback(callback);
                            })
                        })
                    })
                })
            })
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
