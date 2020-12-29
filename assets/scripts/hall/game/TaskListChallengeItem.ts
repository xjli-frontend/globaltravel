
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import main from "../../Main";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TaskListChallengeItem extends ComponentExtends {
 
    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }

    onBtnHandler(event:cc.Event.EventTouch){
    }
    
    clickCallback:Function = null;
    setData(data:any){
        let id = data["id"];
        this.setDataId(id,data["targetLv"]);
        let spf = cc.loader.getRes(`main/icon/icon${id}`,cc.SpriteFrame);
        this.node.getChildByName("task_progress_lab").getComponent(cc.Label).string = `${data["currentStoreLv"]}/${data["targetLv"]}`;
        this.node.getChildByName("task_spr").getComponent(cc.Sprite).spriteFrame = spf;
        this.setProgress(data["currentStoreLv"]/data["targetLv"]);
        let config = main.module.themeConfig.getStoreSpeedLvConfigByTag(`store_${id}`).get(data["targetLv"]);
        let type = config.type;
        this.node.getChildByName("clock").active = type == 2;
        this.node.getChildByName("muti").active = type == 1;
        this.node.getChildByName("clock").getChildByName("clock_lab").getComponent(cc.Label).string = `x${config.value}`;
        this.node.getChildByName("muti").getChildByName("muti_lab").getComponent(cc.Label).string = `x${config.value}`;
    }

  
    setProgress(val:number){
        this.node.getChildByName("task_progress_spr").getComponent(cc.Sprite).fillRange = val;
        this.node.getChildByName("task_progress_light").active = val >= 0.04 && val < 1;
        this.node.getChildByName("task_progress_light").x = -125 + (val-0.04) *  this.node.getChildByName("task_progress_spr").width;
    }

   
    setDataId(id:number,targetLv:number){
        let dataId = `ui_challenge_value${id}`;
        let comp = this.node.getChildByName("task_title").getComponent(LanguageLabel);
        comp.dataID = dataId;
        comp.setVars(`value${id}`,targetLv+"");
    }


    onDestroy(){
        this.clickCallback = null;
        super.onDestroy();
    }
  

}