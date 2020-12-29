
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LabLayout extends ComponentExtends {


    onLoad(){
    }

   
    update(){
        this.node.width = this.node.getChildByName("lab").width + 20;
    }
}
