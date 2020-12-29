
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import LabStepText from "../effect/LabStepText";
import WorldMapComponent from "../WorldMapComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoviceClerkUp extends ComponentExtends {


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
        let nextNoviceCallback = params["nextNoviceCallback"];
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("skeleton").active = false;
        nodes.get("tip_girl").active = false;
        nodes.get("tip_girl").active = false;
        this.panelAnim(nodes.get("panel_girl"), true, true, () => {
            nodes.get("tip_girl").active = true;
            nodes.get("tip_girl").getComponent(LabStepText).dataId = `beginner_13`;
            nodes.get("tip_girl").getComponent(LabStepText).changeTo(1, () => {
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
                    this.panelAnim(nodes.get("panel_girl"), true, false, () => {
                        this.panelAnim(nodes.get("panel_man"), false, true, () => {
                            nodes.get("skeleton").active = false;
                            main.module.gameMainControl.openMainPop("btn_world", () => {
                                nodes.get("tip_man").active = true;
                                nodes.get("tip_man").getComponent(LabStepText).dataId = `beginner_14`;
                                nodes.get("tip_man").getComponent(LabStepText).changeTo(1, () => {
                                    let popNode = main.module.gameMainControl.popup_container.getChildByName("word_map");
                                    let popNodes = ViewUtils.nodeTreeInfoLite(popNode);
                                    let btn_pass = popNodes.get("btn_pass");
                                    let btn_pass_copy = cc.instantiate(btn_pass);
                                    btn_pass_copy.active = true;
                                    btn_pass_copy.parent = this.node;
                                    this.showButtonEffect(btn_pass_copy, true);
                                    let worldPos = btn_pass.parent.convertToWorldSpaceAR(btn_pass.getPosition());
                                    let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                                    btn_pass_copy.setPosition(spacePos);
                                    nodes.get("skeleton").active = true;
                                    nodes.get("skeleton").zIndex = 999;
                                    nodes.get("skeleton").setPosition(spacePos);
                                    btn_pass_copy.once(cc.Node.EventType.TOUCH_END, () => {
                                        this.panelAnim(nodes.get("panel_man"), false, false, () => {
                                            this.node.destroy();
                                            popNode.getComponent(WorldMapComponent).btnPassHandler(callback,nextNoviceCallback);
                                        })
                                    })
                                })
                            })
                        });
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
