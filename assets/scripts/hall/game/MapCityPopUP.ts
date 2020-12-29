import engine from "../../core/Engine";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MapCityPopUP extends ComponentExtends {

    onLoad() {
        if (!this.node.getChildByName("main").hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.getChildByName("main").on(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        }
    }

    onBtnHandler(event) {
        let name = event.target.name;
        switch (name) {
            case "btn_close":
                this.node.destroy();
                break;
            case "btn_entry":
                break;
            case "main":
                break;
            default:
                // this.node.destroy();
                break;
        }
    }

    currentId: number = 1;
    onAdded(params: any) {
        if (params) {
            let level = main.module.vm.level;
            let nodes = ViewUtils.nodeTreeInfoLite(this.node);
            nodes.get("main").width = params["cityId"] == 1?250:400;
            nodes.get("btn_close").setPosition(params["cityId"]==1?cc.v2(100,20):cc.v2(170,15) );
            nodes.get("reach").active = params["cityId"]<level;
            nodes.get("country").getComponent(LanguageLabel).dataID = `ui_map_${params["cityId"]}`;
            let config = main.module.themeConfig.getBuildingConfigById(params["cityId"]);
            let result = main.module.calcTool.formatNum({num:config.target,numE:config.targetE});
            nodes.get("condition").active = params["cityId"]>=level && params["cityId"] != 1;
            nodes.get("condition").getComponent(LanguageLabel).setVars(`ui_mission_2`,`${result.base}${result.gear}`);
            let str = engine.i18n.getLangByID(`ui_store_${params["cityId"]+3}`);
            switch (params["cityId"]) {
                case 2:
                    str = engine.i18n.getLangByID(`ui_store_${5}`);
                    break;
                case 3:
                    str = `${engine.i18n.getLangByID(`ui_store_${6}`)},${engine.i18n.getLangByID(`ui_store_${7}`)}`;
                    break;
                case 4:
                    str = `${engine.i18n.getLangByID(`ui_store_${8}`)},${engine.i18n.getLangByID(`ui_store_${9}`)}`;
                    break;
                case 5:
                    str = `${engine.i18n.getLangByID(`ui_store_${10}`)}`;
                    break;
                default:
                    break;
            }
            
            nodes.get("unlock").active = params["cityId"] != 1 && params["cityId"]<6;
            nodes.get("unlock").getComponent(LanguageLabel).setVars(`ui_personal_19`,str);
            nodes.get("multi").active = params["cityId"] != 1;
            nodes.get("multi").getComponent(LanguageLabel).setVars(`ui_mission_4`,`X${config.multi}`);
            nodes.get("multi").color = params["cityId"]<=level?new cc.Color(40,170,70):new cc.Color(140,73,40);
            nodes.get("unlock").color = params["cityId"]<=level?new cc.Color(40,170,70):new cc.Color(140,73,40);

            let worldPos = params["worldPos"];
            let pos = this.node.parent.convertToNodeSpaceAR(worldPos);
            nodes.get("main").x = pos.x;
            nodes.get("main").y = pos.y;
            nodes.get("main").RunAction(ezaction.moveTo(0.2,{x:pos.x,y:pos.y + this.node.getChildByName("main").height / 2 + 20}))
        }
    }


    onDestroy() {
        let main = this.node.getChildByName("main");
        if (main) {
            main.off(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        }
        super.onDestroy();
        this.currentId = null;
    }


}



