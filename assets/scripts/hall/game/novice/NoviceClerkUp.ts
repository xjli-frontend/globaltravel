
import { gui } from "../../../core/gui/GUI";
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import { HashMap } from "../../../core/util/HashMap";
import main from "../../../Main";
import LabStepText from "../effect/LabStepText";
import ShopComponent from "../ShopComponent";

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
        let noviceCallback = params["noviceCallback"];
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("skeleton").active = false;
        nodes.get("tip").active = false;
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_8`;
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
                    nodes.get("skeleton").active = false;
                    main.module.gameMainControl.openShop(0, () => {
                        nodes.get("tip").getComponent(LabStepText).dataId = `beginner_9`;
                        nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                            let popNode = main.module.gameMainControl.popup_container.getChildByName("shop");
                            let salesmanNodes = ViewUtils.nodeTreeInfoLite(popNode.getChildByName("salesman"));
                            let btnUpNode = salesmanNodes.get("1").getChildByName("btn_up")
                            let copyNodeUp = cc.instantiate(btnUpNode);
                            copyNodeUp.active = true;
                            copyNodeUp.parent = this.node;
                            let worldPos = btnUpNode.parent.convertToWorldSpaceAR(btnUpNode.getPosition());
                            let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                            nodes.get("skeleton").active = true;
                            nodes.get("skeleton").zIndex = 999;
                            nodes.get("skeleton").setPosition(spacePos);
                            copyNodeUp.setPosition(spacePos);
                            copyNodeUp.once(cc.Node.EventType.TOUCH_END, () => {
                                copyNodeUp.destroy();
                                nodes.get("skeleton").active = false;
                                let lvUpParams: HashMap<number, number> = new HashMap<number, number>();
                                lvUpParams.set(1, 1)
                                let clerk = main.module.themeConfig.getClerkConfigBytagLv(`clerk_1`, 1);
                                popNode.getComponent(ShopComponent).clerkLvUp(lvUpParams, {
                                    num: clerk.clerkPrice,
                                    numE: clerk.clerkPriceE
                                });
                                noviceCallback && noviceCallback();
                                nodes.get("panel").active = false;
                                let popNodes = ViewUtils.nodeTreeInfoLite(popNode);
                                let worldPosClose = popNodes.get("btn_close").parent.convertToWorldSpaceAR(popNodes.get("btn_close").getPosition());
                                let spacePosClose = this.node.convertToNodeSpaceAR(worldPosClose);
                                    let btn_close = cc.instantiate(popNodes.get("btn_close"));
                                    btn_close.active = true;
                                    btn_close.parent = this.node;
                                    btn_close.setPosition(spacePosClose);
                                    nodes.get("skeleton").active = true;
                                    nodes.get("skeleton").setPosition(spacePosClose);
                                    btn_close.once(cc.Node.EventType.TOUCH_END, () => {
                                        this.node.destroy();
                                        main.module.gameMainControl.clerkChangeId = 1;
                                        gui.delete(popNode);
                                        callback && callback();
                                    })
                            })
                        })
                    });
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
