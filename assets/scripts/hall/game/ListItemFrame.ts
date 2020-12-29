import { ComponentExtends } from "../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ListItemFrame extends ComponentExtends {

    @property(cc.SpriteFrame)
    frameArray:Array<cc.SpriteFrame> = [];

    onLoad(){
        
    }

    setFrame(index){
        if(this.frameArray[index]){
            this.node.getComponent(cc.Sprite).spriteFrame = this.frameArray[index];
        }else{
            this.node.getComponent(cc.Sprite).spriteFrame = null;
        }
    }

    onDestroy(){
        super.onDestroy();
    }
  

}