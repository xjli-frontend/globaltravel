
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TaskListMainItem extends ComponentExtends {
 
    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }

    onBtnHandler(event:cc.Event.EventTouch){
        if((event.target.name == "btn_get") && event.target.getComponent(ButtonEffect) && event.target.getComponent(ButtonEffect).canTouch ){
            let task_skeleton = this.node.getChildByName("task_skeleton").getComponent(sp.Skeleton);
            event.target.getComponent(ButtonEffect).canTouch = false;
            if(event.target.name == "btn_get"){
                task_skeleton.setAnimation(0,"reward",false);
            } 
            if (this.clickCallback){
                this.clickCallback(this.data);
            }
        }
    }
    
    clickCallback:Function = null;
    taskId:number = 0;
    data:any = null;
    setData(data:any,isFinish){
        let id = data["id"];
        this.taskId = id;
        this.data = data;
        this.node.getChildByName("btn_get").getComponent(ButtonEffect).canTouch = true;
        // this.node.getChildByName("btn_leave").getComponent(ButtonEffect).canTouch = true;
        this.node.getChildByName("task_reward_lab_prop").active = data["rewardType"] == 2;
        this.node.getChildByName("task_reward_lab").active = data["rewardType"] == 1;
        this.setDataId(id,data["rewardValue"]);
        let spf = cc.loader.getRes(`main/country/country_${id-20+1}`,cc.SpriteFrame);
        this.node.getChildByName("task_spr").getComponent(cc.Sprite).spriteFrame = spf;
        this.btnState(isFinish)

    }

    btnState(state:boolean){
        this.node.getChildByName("btn_get").active = state;
        // this.node.getChildByName("btn_leave").active = !state;
    }

   
    setDataId(id:number,value:number){
        let dataId = `ui_info_${id-20}`;
       let comp = this.node.getChildByName("task_title").getComponent(LanguageLabel);
       comp.dataID = dataId;
       let compRewad = this.node.getChildByName("task_reward_lab").getComponent(LanguageLabel);
       compRewad.setVars("reward1",value+"")
    }


    onDestroy(){
        this.taskId = null;
        this.clickCallback = null;
        this.data = null;
        super.onDestroy();
    }
  

}