import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";


const { ccclass, property } = cc._decorator;

@ccclass
export default class IncomeCoponent extends ComponentExtends {


    onLoad() {
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }

    onBtnHandler(event){
        let name = event.target.name;
        switch (name) {
            case "btn_close":
                this.node.destroy();
                break;
            default:
                break;
        }
    }


    onAdded(params: any) {
     
    }
    
    update(){
        this.refreshPersonalInfo();
    }
    
    /** 刷新个人信息 */
    refreshPersonalInfo() {
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let result = main.module.calcTool.formatNum(main.module.gamedata.rewardTotalAvg);
        mainNodes.get("total_speed_num").getComponent(cc.Label).string = `${result.base}${result.gear}/s`;
        mainNodes.get("can_use_num").getComponent(LabelChangeSymbol).num = main.module.vm.credit;
        mainNodes.get("this_income_num").getComponent(LabelChangeSymbol).num = main.module.vm.win;
        mainNodes.get("total_income_num").getComponent(LabelChangeSymbol).num = main.module.vm.winTotal;
    }

    

    onDestroy() {
        super.onDestroy();
    }

}
