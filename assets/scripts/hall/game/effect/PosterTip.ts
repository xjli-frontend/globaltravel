
import { LanguageLabel } from "../../../core/language/LanguageLabel";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PosterTip extends ComponentExtends {


    onLoad(){
        
    }

    setData(params){
        let dataId = params["type"] == 1 ? `store_profits_value${params["id"]}`:`store_speed_value${params["id"]}`;
        this.node.getChildByName("poster_lab").getComponent(LanguageLabel).dataID = dataId;
        this.node.getChildByName("poster_lab").getComponent(LanguageLabel).setVars(`value${params["id"]}`,params["value"]);
        this.scheduleOnce(()=>{
            this.node.RunAction(ezaction.moveTo(1,{x:-800})).onStoped(()=>{
                this.node.destroy();
            });
        },2);
    }

}
