
import engine from "../../../core/Engine";
import { Message } from "../../../core/event/MessageManager";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { AudioMessage } from "../../AudioMessage";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UiClickAudio extends ComponentExtends {

    @property
    string:string = "";

    onLoad(){
        this.node.on(cc.Node.EventType.TOUCH_END,this.click.bind(this),this)
    }

    click(){
        if(this.string){
            Message.dispatchEvent(AudioMessage.EFFECT, this.string);
        }
        engine.log.info(`音效点击穿透`);
        if (this.node._touchListener) {
            this.node._touchListener.setSwallowTouches(false);
        }
    }
    
    onDestroy(){
        super.onDestroy();
    }

}
