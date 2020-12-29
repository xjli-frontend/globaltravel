
import ButtonSimple from "../../../core/ui/button/ButtonSimple";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import main from "../../../Main";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HeadSelect extends ComponentExtends {

    @property(cc.Node)
    selectNode:cc.Node = null;

    @property(cc.Node)
    arrayNode:cc.Node = null;

    onLoad(){
        this.arrayNode.on(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this);
    }

    targetNode:cc.Node = null;
    onAdded(params:any){
        this.targetNode = params["targetNode"];
        this.selectHead(params["headId"]);
    }

    onTouchEnd(event:cc.Event.EventTouch){
        if(event.target.getComponent(ButtonSimple)){
            let name:string = event.target.name;
            let id = name.split("_")[1];
            if(parseInt(id) == this.headId){
                return
            }else{
                main.module.gameProtocol.sendHead(parseInt(id),()=>{
                    this.headId = parseInt(id);
                    this.selectHead(parseInt(id));
                    let fame = cc.loader.getRes(`main/head/head_${parseInt(id)}`,cc.SpriteFrame);
                    this.targetNode.getComponent(cc.Sprite).spriteFrame = fame;
                })
            }
        }
    }
    
    headId:number = 1;
    selectHead(headId:number){
        this.headId = headId;
        this.arrayNode.children.forEach((child)=>{
            if(child.name == `head_${headId}`){
                this.selectNode.parent = child;
                this.selectNode.x = 30;
                this.selectNode.y = -30;
            }
        })
    }
    onDestroy(){
        this.targetNode = null;
        this.node.destroy();
        super.onDestroy();
    }

}
