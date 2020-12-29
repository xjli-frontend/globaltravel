
import { Message } from "../../../core/event/MessageManager";
import { gui } from "../../../core/gui/GUI";
import { LanguageLabel } from "../../../core/language/LanguageLabel";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import main from "../../../Main";
import { TaskType } from "../../CalcUiShow";
import GameMainControl from "../GameMainControl";
import { AdvMessage, AdvRewardType } from "./AdvControl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AdvMainMuti extends ComponentExtends {

    @property(cc.Label)
    timeLab:cc.Label = null;

    @property(LanguageLabel)
    btnLab:LanguageLabel = null;

    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        }
    }

    callback:Function = null;
    mainControl:GameMainControl = null;
    onAdded(params:any){
        cc.log(`AdvMainMuti界面弹窗`);
        this.mainControl = params["mainControl"];
    }

    onTouchHandler(event:cc.Event.EventTouch){
        switch(event.target.name){
            case "btn_poster":{
                if (cc.sys.isBrowser) {
                    cc.log(`浏览器直接发放主界面金币翻倍奖励`);
                    this.mainControl.cacheMainMutiTime();
                    let _taskListAd = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
                    main.module.gameProtocol.sendTaskList(_taskListAd, (obj) => {
                        main.module.vm.taskList = _taskListAd;
                    })
                    return;
                }
                Message.dispatchEvent(AdvMessage.PLAY, {
                    callback: (success: boolean, type: number) => {
                        if (type == AdvRewardType.MAIN_MUTI) {
                            if (success) {
                                cc.log(`主界面金币奖励翻倍观看广告成功`);
                                this.mainControl.cacheMainMutiTime();
                            } else {
                                cc.log(`主界面金币奖励翻倍观看广告失败`)
                            }
                        }
                    }, type: AdvRewardType.MAIN_MUTI
                });
                break;
            }
            case "spr":
            case "bg":{
                cc.log(`AdvMainMuti:选择不观看视频bg`)
                break;
            }
            default:{
                cc.log(`AdvMainMuti:选择不观看视频`)
                // this.node.destroy();
                gui.delete(this.node);
            }
        }
    }

    update(){
        this.timeLab.string = main.module.calcUiShow.formatTime( this.mainControl.mainAdMutiEndTime ); 
        this.node.getChildByName("progress_spr").width = this.mainControl.mainAdMutiEndTime /(12*60*60*1000) * 390;
        if(this.mainControl.mainAdMutiEndTime>=max_muti_time){
            this.node.getChildByName("btn_full").active = true;
            this.node.getChildByName("progress_spr").active = true;
            this.node.getChildByName("progress_bg").active = true;
            this.node.getChildByName("time_bg").active = true;
            this.node.getChildByName("btn_poster").active = false;
        }else{
            this.node.getChildByName("btn_full").active = false; 
            this.node.getChildByName("btn_poster").active = true;
            if(this.mainControl.mainAdMutiEndTime>0){
                this.btnLab.dataID = "ui_sale_10";
                this.node.getChildByName("progress_spr").active = true;
                this.node.getChildByName("progress_bg").active = true;
                this.node.getChildByName("time_bg").active = true;
                this.node.getChildByName("btn_poster").y = -210;
            }else{
                this.btnLab.dataID = "ui_sale_9";
                this.node.getChildByName("progress_spr").active = false;
                this.node.getChildByName("progress_bg").active = false;
                this.node.getChildByName("time_bg").active = false;
                this.node.getChildByName("btn_poster").y = -190;
            }
        }
    }
    
    onDestroy(){
        this.callback = null;
        this.mainControl = null;
        Message.removeEventTarget(this)
        this.node.off(cc.Node.EventType.TOUCH_END);
        super.onDestroy();
    }

}

const max_muti_time = 11*60*60*1000+59*60*1000;
