
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { gui } from "../../core/gui/GUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ViewTerms extends ComponentExtends {


    onLoad(){
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);

    }


    onDestroy(){
        super.onDestroy()
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
    }
    onTouchHandler(event:cc.Event.EventTouch){
        switch(event.target.name){
            case "btn_close":{
                this.close();
                break;
            }
        }
    }

    close(){
        gui.delete(this.node);
    }
}
