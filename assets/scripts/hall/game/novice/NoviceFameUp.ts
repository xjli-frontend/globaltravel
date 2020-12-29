
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import { HashMap } from "../../../core/util/HashMap";
import main from "../../../Main";
import LabStepText from "../effect/LabStepText";
import ShopComponent from "../ShopComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NoviceFameUp extends ComponentExtends {


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

    popCallback (callback){
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("tip").getComponent(LabStepText).dataId = `beginner_19`;
        nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
            let popNode = main.module.gameMainControl.popup_container.getChildByName("shop");
            let prestigeNodes = ViewUtils.nodeTreeInfoLite(popNode.getChildByName("prestige"));
            let btnUpNode = prestigeNodes.get("1").getChildByName("btn_up")
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
                let lvUpParams:HashMap<number,number> = new HashMap<number,number>();
                lvUpParams.set(1,1)
                let fame = main.module.themeConfig.getFameConfigByTagLv(`fame_1`,1);
                popNode.getComponent(ShopComponent).fameLvUp(lvUpParams,{
                    num:fame.price,
                    numE:fame.priceE
                },()=>{
                    callback && callback();
                    this.node.destroy();
                });

            })
        })
    }

    onAdded(params:any){
        let btnNode = params["btnNode"];
        let callback = params["callback"];
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("skeleton").active = false;
        nodes.get("tip").active = false;
        this.panelAnim(nodes.get("panel"), true, true, () => {
            nodes.get("tip").active = true;
            nodes.get("tip").getComponent(LabStepText).dataId = `beginner_18`;
            nodes.get("tip").getComponent(LabStepText).changeTo(1, () => {
                if(main.module.gameMainControl.popup_container.getChildByName("shop")){
                    this.scheduleOnce(()=>{
                        this.popCallback(callback);
                    },2)
                    this.node.once(cc.Node.EventType.TOUCH_END, () => {
                        this.popCallback(callback);
                        this.unscheduleAllCallbacks();
                    })
                }else{
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
                        if(main.module.gameMainControl.popup_container.getChildByName("shop")){
                            this.popCallback(callback);
                        }else{
                            main.module.gameMainControl.openShop(1, () => {
                                this.popCallback(callback);
                            });
                        }
                    })
                }
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
