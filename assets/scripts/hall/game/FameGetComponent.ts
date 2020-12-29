import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { TaskType } from "../CalcUiShow";
import { AdvMessage, AdvRewardType } from "./adv/AdvControl";


const { ccclass, property } = cc._decorator;

@ccclass
export default class FameGetComponent extends ComponentExtends {
   
    nodes: HashMap<string, cc.Node> = null;

    onLoad(){
      this.init();
    }

    init(){
        this.nodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.setInfo();
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.refreshMutiInfo();
        this.schedule(()=>{
            this.refreshMutiInfo();
        },0.5)
    }

    setInfo(){
        this.nodes.get("fame_lab").getComponent(LabelChangeSymbol).num = main.module.vm.fame;
        let resultAdd = main.module.calcTool.formatNum(main.module.calcTool.calcAddNum(main.module.calcUiShow.rewardAdd(),{num:1,numE:0},false),false);
        let val = `${resultAdd.base}${resultAdd.gear}`;
        this.nodes.get("muti_lab").getComponent(LanguageLabel).setVars(`ui_personal_7`,val) ;
        let fameCount = main.module.themeConfig.getBuildingConfigById(main.module.vm.level).fameCount;
        this.nodes.get("times").getComponent(cc.Label).string = `${ main.module.gamedata.fameNpcNum >fameCount? fameCount : main.module.gamedata.fameNpcNum}/${fameCount}`;
        this.nodes.get("right_finish").active = main.module.gamedata.fameNpcNum >= fameCount;
        this.nodes.get("right_no_finish").active = main.module.gamedata.fameNpcNum < fameCount;
        this.nodes.get("new_muti_lab").getComponent(LanguageLabel).dataID = `ui_personal_9`;
        this.toggleConent();
    }

    refreshMutiInfo(){
        let calcUiShow = main.module.calcUiShow;
        let cutDownTime = main.module.gamedata.getFameTime - calcUiShow.getSeverCurrentTime();
        this.nodes.get("cut_time").getComponent(cc.Label).string = main.module.calcUiShow.formatTime( cutDownTime ); 
        this.nodes.get("left_finish").active = cutDownTime<=0;
        this.nodes.get("left_no_finish").active = cutDownTime>0;
        // this.nodes.get("btn_watch").active = main.module.calcUiShow.getSeverCurrentTime()<main.module.gamedata.getFameTime;
        let canGetFame = calcUiShow.calcCurrentCanGetFame()
        this.nodes.get("can_get").getComponent(LabelChangeSymbol).num = canGetFame;
        let resultAdd = main.module.calcTool.formatNum(main.module.calcTool.calcAddNum(main.module.calcUiShow.rewardAdd(canGetFame),{num:1,numE:0},false),false);
        let val = `${resultAdd.base}${resultAdd.gear}`;
        this.nodes.get("new_muti_lab").getComponent(LanguageLabel).setVars(`ui_personal_9`,val) ;
        this.toggleConent();
    }

    onDestroy(){
        this.nodes = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.unscheduleAllCallbacks();
        super.onDestroy();
    }

    update(){
        
    }

    getFameCallback(callback?:Function){
        let canGetFame = main.module.calcUiShow.calcCurrentCanGetFame()
        main.module.calcUiShow.refreshFame(canGetFame);
        main.module.gamedata.getFameTime = main.module.calcUiShow.getSeverCurrentTime() + 3 * 60 * 60 * 1000;
        main.module.gameProtocol.writeCacheData("getFameTime", main.module.gamedata.getFameTime as Object, (data) => {
        
        })
        main.module.gamedata.fameNpcNum = 0;
        main.module.gameProtocol.writeCacheData("fameNpcNum", main.module.gamedata.fameNpcNum as Object, (data) => {
                
        })
        this.setInfo();
        let popViewParams: PopViewParams = {
            touchClose: true,
            modal: false,
            onAdded: (node, params) => {
            },
            onRemoved: (node, next) => {
                if(callback){
                    callback && callback();
                }
            }
        }
        gui.popup.add(`popup/fame_result`, {  },popViewParams);
    }

    onTouchHandler(event:cc.Event.EventTouch){
        switch(event.target.name){
            case "btn_get":{
                this.getFameCallback();
                break;
            }
            case "btn_close":{
                gui.delete(this.node)
                // this.node.destroy()
                break;
            }
            case "btn_watch":{
                if (cc.sys.isBrowser) {
                    cc.log(`浏览器直接发放主界面金币翻倍奖励`);
                    let _taskListAd = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
                    main.module.gameProtocol.sendTaskList(_taskListAd, (obj) => {
                        main.module.vm.taskList = _taskListAd;
                    })
                    main.module.gamedata.getFameTime = main.module.calcUiShow.getSeverCurrentTime();
                    main.module.gameProtocol.writeCacheData("getFameTime", main.module.gamedata.getFameTime as Object, (data) => {
                    
                    })
                    return;
                }
                Message.dispatchEvent(AdvMessage.PLAY, {
                    callback: (success: boolean, type: number) => {
                        if (type == AdvRewardType.GET_FAME) {
                            if (success) {
                                cc.log(`获取声望倒计时达成观看广告成功`);
                                main.module.gamedata.getFameTime = main.module.calcUiShow.getSeverCurrentTime();
                                main.module.gameProtocol.writeCacheData("getFameTime", main.module.gamedata.getFameTime as Object, (data) => {
                    
                                })
                            } else {
                                cc.log(`获取声望倒计时达成观看广告失败`)
                            }
                        }
                    }, type: AdvRewardType.GET_FAME
                });
                break;
            }
        }
    }

    toggleConent(){
        let calcUiShow = main.module.calcUiShow;
        let cutDownTime = main.module.gamedata.getFameTime - calcUiShow.getSeverCurrentTime();
        let fameCount = main.module.themeConfig.getBuildingConfigById(main.module.vm.level).fameCount;
        this.nodes.get("content1").active = cutDownTime>0 || main.module.gamedata.fameNpcNum < fameCount;
        this.nodes.get("content2").active = cutDownTime<=0 && main.module.gamedata.fameNpcNum >= fameCount;
        if(main.module.vm.noviceProgress.novice_13 == 0){
            this.nodes.get("content2").active = true;
            this.nodes.get("content1").active = false;
        }
    }
}
