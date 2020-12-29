
import { Message } from "../../../core/event/MessageManager";
import { PopViewParams } from "../../../core/gui/Defines";
import { gui } from "../../../core/gui/GUI";
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import { AudioMessage } from "../../AudioMessage";
import LabStepText from "../effect/LabStepText";
import PackageListItem from "../PackageListItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NovicePackage extends ComponentExtends {


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
        let nextCallback = params["nextCallback"];
        let btnNode = params["btnNode"];
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("skeleton").active = false;
        nodes.get("tip").active = false;
        this.node.zIndex = 999;
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_17`;
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
                    main.module.gameMainControl.openMainPop("btn_package",()=>{
                        this.scheduleOnce(()=>{
                            let popNode = main.module.gameMainControl.popup_container.getChildByName("package");
                            let popNodes = ViewUtils.nodeTreeInfoLite(popNode);
                            let itemNode = popNodes.get("content").children[0];
                            let btn_package = itemNode.getChildByName("btn_package");
                            let copyBtn_package = cc.instantiate(btn_package);
                            copyBtn_package.active = true;
                            copyBtn_package.parent = this.node;
                            let worldPos = btn_package.parent.convertToWorldSpaceAR(btn_package.getPosition());
                            let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                            nodes.get("skeleton").active = true;
                            nodes.get("skeleton").zIndex = 99;
                            nodes.get("skeleton").setPosition(spacePos);
                            copyBtn_package.setPosition(spacePos);
                            copyBtn_package.once(cc.Node.EventType.TOUCH_END, () => {
                                copyBtn_package.destroy();
                                nodes.get("skeleton").active = false;
                                Message.dispatchEvent(AudioMessage.EFFECT, "alt");
                                nodes.get("panel").active = false;
                                gui.delete(popNode);
                                let popViewParams:PopViewParams = {
                                    modal:true,
                                    opacity:150,
                                    touchClose:false,
                                    onAdded:(view)=>{
                                        let viewNodes = ViewUtils.nodeTreeInfoLite(view);
                                        nodes.get("skeleton").parent = viewNodes.get("btn_ok");
                                        nodes.get("skeleton").active = true;
                                        nodes.get("skeleton").setPosition(0,0);
                                        callback && callback();
                                        this.node.destroy();
                                    },
                                    onRemoved:()=>{
                                        nextCallback && nextCallback();
                                    }
                                }
                                let packageListItem = itemNode.getComponent(PackageListItem);
                                packageListItem.clickCallback(packageListItem.params,packageListItem.reward,packageListItem,false);
                                gui.popup.add(`popup/prop_result`,{params:packageListItem.params,reward:packageListItem.reward},popViewParams);
                                main.module.calcUiShow.refreshCredit(packageListItem.reward,()=>{
                                },true);
                            })
                        },0.3);
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
