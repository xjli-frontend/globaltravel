
import { PopViewParams } from "../../../core/gui/Defines";
import { gui } from "../../../core/gui/GUI";
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import LabStepText from "../effect/LabStepText";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoviceShopping extends ComponentExtends {


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
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_11`;
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
                    main.module.gameMainControl.openMainPop("btn_shopping",()=>{
                        let popNode = main.module.gameMainControl.popup_container.getChildByName("shopping");
                        if(main.module.vm.diamond<60){
                            gui.delete(popNode);
                            this.node.destroy();
                            callback && callback();
                            return;
                        }
                        nodes.get("tip").getComponent(LabStepText).dataId = `beginner_12`;
                        nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                            let salesmanNodes = ViewUtils.nodeTreeInfoLite(popNode);
                            let btnBuyNode = salesmanNodes.get("8").getChildByName("btn_buy")
                            let worldPos = btnBuyNode.parent.convertToWorldSpaceAR(btnBuyNode.getPosition());
                            let spacePos = this.node.convertToNodeSpaceAR(worldPos);
                            let copyBtnBuyNode = cc.instantiate(btnBuyNode);
                            copyBtnBuyNode.active = true;
                            copyBtnBuyNode.parent = this.node;
                            nodes.get("skeleton").active = true;
                            nodes.get("skeleton").zIndex = 100;
                            nodes.get("skeleton").setPosition(spacePos);
                            copyBtnBuyNode.setPosition(spacePos);
                            copyBtnBuyNode.once(cc.Node.EventType.TOUCH_END, () => {
                                main.module.gameProtocol.requestDiamondInfo(8,(data)=>{
                                    let popViewParams:PopViewParams = {
                                        modal:true,
                                        opacity:150,
                                        onAdded:(view:cc.Node)=>{
                                            let viewNodes = ViewUtils.nodeTreeInfoLite(view);
                                            let btn_ok = viewNodes.get("btn_ok");
                                            nodes.get("skeleton").parent = btn_ok;
                                            nodes.get("skeleton").setPosition(0,0);
                                            this.node.destroy();
                                            main.module.calcUiShow.refreshCredit(reward,()=>{
                                            },true)
                                        },
                                        onRemoved:()=>{
                                            callback && callback();
                                        }
                                    }
                                    let value = data["goodsInfo"]["value"];
                                    let goodsType = data["goodsInfo"]["goodsType"];
                                    gui.delete(popNode)
                                    let vm = main.module.vm;
                                    let times = 12 * 60 * 60;
                                    let reward = main.module.calcUiShow.getTimeStageReward(times);
                                    gui.popup.add(`popup/shopping_result`,{id:8,goodsType:goodsType,reward:reward,value:value},popViewParams);
                                    vm.diamond = data["userAccount"]["credit"];
                                    if(data["goodsData"]){
                                        vm.goodsInfo = data["goodsData"];
                                    }
                                })
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
