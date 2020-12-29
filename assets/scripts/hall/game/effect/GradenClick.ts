
import engine from "../../../core/Engine";
import { LanguageLabel } from "../../../core/language/LanguageLabel";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GradenClick extends ComponentExtends {

    onLoad(){
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("pop_tip").active = false;
        let name:string = this.node.name;
        let id = parseInt(name.split("_")[1]);
        let str = "";
        switch (id) {
            case 6:
            case 7:
                str = engine.i18n.getLangByID("ui_map_3");
                break;
            case 8:
            case 9:
                str = engine.i18n.getLangByID("ui_map_4");
                break;        
            case 10:
                str = engine.i18n.getLangByID("ui_map_5");
                break;
            default:
                break;
        }
        nodes.get("tip_lab").getComponent(LanguageLabel).setVars("ui_mission_5",str);
        this.init();
    }
    
    init(){
        let clickNode = new cc.Node();
        clickNode.width = 300;
        clickNode.height = 150;
        clickNode.parent = this.node;
        clickNode.on(cc.Node.EventType.TOUCH_END,this.click.bind(this),this)
        
    }
    
    click(event){
        if (this.node._touchListener) {
            this.node._touchListener.setSwallowTouches(false);
        }
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("pop_tip").active = !nodes.get("pop_tip").active;
    }

    onDestroy(){
        super.onDestroy();
    }

}
