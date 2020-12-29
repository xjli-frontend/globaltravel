import engine from "../../core/Engine";
import { Message } from "../../core/event/MessageManager";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";
import { service } from "../../service/Service";
import { TaskType } from "../CalcUiShow";
import { AdvMessage, AdvRewardType } from "./adv/AdvControl";


const { ccclass, property } = cc._decorator;

@ccclass
export default class SellConfirm extends ComponentExtends {


    onLoad(){
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        let calcUiShow = main.module.calcUiShow;
        let _fame = main.module.calcTool.calcAddNum(calcUiShow.calcCurrentCanGetFame(),main.module.vm.fame)
        nodes.get("right_lab").getComponent(LabelChangeSymbol).num = main.module.calcTool.calcDivideNum(_fame,main.module.vm.fame);
        nodes.get("right_lab").getComponent(LabelChangeSymbol).string = `X${nodes.get("right_lab").getComponent(LabelChangeSymbol).string}`;
        nodes.get("fame_lab").getComponent(LabelChangeSymbol).num = calcUiShow.calcCurrentCanGetFame();
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        }
        if(main.module.vm.level<10){
            let nextConfig = main.module.themeConfig.getBuildingConfigById(main.module.vm.level+1);
            if(main.module.calcTool.compare(main.module.vm.winTotal,{num:nextConfig.target,numE:nextConfig.targetE})){
                nodes.get("unlock_lab").getComponent(LanguageLabel).dataID = `ui_sale_5`;
                nodes.get("unlock_lab").getComponent(LanguageLabel).setVars(`ui_sale_5`,`${engine.i18n.getLangByID(`ui_map_${main.module.vm.level+1}`)}`)
            }else{
                nodes.get("unlock_lab").getComponent(LanguageLabel).dataID = `ui_sale_4`;
            }
        }
    }

  
    callback:Function = null;
    closeFunc:Function = null;
    onAdded(params:any){
        this.callback = params["callback"];
        this.closeFunc = params["closeFunc"];
    }
    onBtnHandler(event) {
        let name = event.target.name;
        switch (name) {
            case "btn_close":
                this.node.destroy();
                this.closeFunc && this.closeFunc();
                break;
            case "btn_sell":
                this.callback && this.callback(1);
                this.node.destroy();
                break;
            case "btn_poster":
                if (cc.sys.isBrowser) {
                    cc.log(`浏览器直接发放卖楼奖励`)
                    this.node.destroy();
                    this.callback && this.callback(1.2);
                    let _taskListAd = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
                    main.module.gameProtocol.sendTaskList(_taskListAd, (obj) => {
                        main.module.vm.taskList = _taskListAd;
                    })
                    return;
                }
                Message.dispatchEvent(AdvMessage.PLAY, {
                    callback: (success: boolean, type: number) => {
                        if (type == AdvRewardType.FAME_MUTI) {
                            if (success) {
                                cc.log(`卖楼观看广告成功`)
                                service.analytics.logEvent("ad_complete_sell", "", "")
                                this.callback && this.callback(1.2);
                                this.node.destroy();
                            } else {
                                cc.log(`卖楼观看广告失败`)
                                this.callback && this.callback(1);
                            }
                        }
                    }, type: AdvRewardType.FAME_MUTI
                });
                break;
            default:
                break;
        }
    }

    onDestroy(){
        this.callback = null;
        Message.removeEventTarget(this);
        super.onDestroy();
    }

}
