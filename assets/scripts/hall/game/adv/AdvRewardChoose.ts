
import { Message } from "../../../core/event/MessageManager";
import { gui } from "../../../core/gui/GUI";
import { LanguageLabel } from "../../../core/language/LanguageLabel";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../../core/ui/label/LabelChangeSymbol";
import main from "../../../Main";
import { TaskType } from "../../CalcUiShow";
import { AdvMessage, AdvRewardType } from "./AdvControl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AdvRewardChoose extends ComponentExtends {


    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        }
    }

    callback:Function = null;
    chooseType:number = 0;
    onAdded(params:any){
        cc.log(`AdvRewardChoose选择界面弹窗`)
        this.node.active = false;
        this.node.getChildByName("spr").scale = params.type-1 == 1?0.8:1;
        cc.loader.loadRes(`popup/adv_choose/ad_bg_${params.type-1}`, cc.SpriteFrame, (err, spf) => {
            if (err) {
                cc.error(err);
                return;
            }
            this.node.active = true;
            this.node.getChildByName("spr").getComponent(cc.Sprite).spriteFrame = spf;
        })
        this.node.getChildByName("content").active = params.type == AdvRewardType.NPC_7_1;
        this.node.getChildByName("content").getComponent(LanguageLabel).dataID = `popup_reward_${params.type-1}`;
        this.callback = params.callback;
        if(params.reward){
            let _reward = main.module.calcTool.calcMutiNum(params.reward,{num:5,numE:0});
            this.node.getChildByName("btn_poster").getChildByName("coin").getComponent(LabelChangeSymbol).num = _reward;
        }
        this.node.getChildByName("btn_poster").getChildByName("coin").active = params.type == AdvRewardType.NPC_7_1;
        this.node.getChildByName("btn_poster").getChildByName("damond").active = params.type == AdvRewardType.NPC_7_2 || params.type == AdvRewardType.NPC_9;
        this.node.getChildByName("coin_spr").active = params.type-1 == 1;
        this.node.getChildByName("zuanshi").active = params.type-1 == 2;
        this.node.getChildByName("random_prop").active = params.type-1 == 3;
        this.node.getChildByName("btn_poster").y = params.type-1 == 2?-195:-210;;
        // switch (params.type-1) {
        //     case 1:
        //         this.node.getChildByName("btn_close").y = 182;
        //         break;
        //     case 2:
        //         this.node.getChildByName("btn_close").y = 190;
        //         break;
        //     case 3:
        //         this.node.getChildByName("btn_close").y = 170;
        //         break;
        //     default:
        //         break;
        // }
        this.chooseType = params.type;
    }

    onTouchHandler(event:cc.Event.EventTouch){
        switch(event.target.name){
            case "btn_poster":{
                let type = AdvRewardType.NPC_7_1;
                if(this.chooseType == 2){
                    type = AdvRewardType.NPC_7_2;
                }else if(this.chooseType == 3){
                    type = AdvRewardType.NPC_9;
                }
                if (cc.sys.isBrowser) {
                    cc.log(`浏览器直接发放卖楼奖励`);
                    this.node.destroy();
                    let _taskListAd = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
                    main.module.gameProtocol.sendTaskList(_taskListAd, (obj) => {
                        main.module.vm.taskList = _taskListAd;
                    })
                    this.callback && this.callback(true,type);
                    return;
                }
                cc.log(`AdvRewardChoose:选择观看视频`)
                Message.dispatchEvent(AdvMessage.PLAY,{callback:(success:boolean,type:number)=>{
                    this.node.destroy();
                    this.callback && this.callback(success,type);
                },type:type});
                break;
            }
            case "spr":
            case "bg":{
                cc.log(`AdvRewardChoose:选择不观看视频bg`)
                break;
            }
            default:{
                cc.log(`AdvRewardChoose:选择不观看视频`)
                // this.node.destroy();
                gui.delete(this.node);
                this.callback && this.callback(false,this.chooseType);
            }
        }
    }
    onDestroy(){
        this.callback = null;
        this.chooseType = null;
        Message.removeEventTarget(this)
        this.node.off(cc.Node.EventType.TOUCH_END);
        super.onDestroy();
    }

}
