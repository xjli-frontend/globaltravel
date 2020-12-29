
import { Message } from "../../core/event/MessageManager";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import main from "../../Main";
import { AdvMessage, AdvRewardType } from "./adv/AdvControl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TaskListDayItem extends ComponentExtends {
 
    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler , this);
        }
    }

    onBtnHandler(event:cc.Event.EventTouch){
        if( (event.target.name == "btn_get") && event.target.getComponent(ButtonEffect) && event.target.getComponent(ButtonEffect).canTouch ){
            let task_skeleton = this.node.getChildByName("task_skeleton").getComponent(sp.Skeleton);
            event.target.getComponent(ButtonEffect).canTouch = false;
            if(event.target.name == "btn_get"){
                task_skeleton.setAnimation(0,"reward",false);
            } 
            if (this.clickCallback){
                this.clickCallback(event,this.data);
            }
        }

        if(event.target.name == "btn_poster" && event.target.getComponent(ButtonEffect) && event.target.getComponent(ButtonEffect).canTouch){
            event.target.getComponent(ButtonEffect).canTouch = false;
            if (cc.sys.isBrowser) {
                cc.log(`浏览器直接修改每日任务完成状态`)
                let _taskListFinish = this.changTaskFinishState(this.data["id"])
                main.module.vm.taskList = _taskListFinish;
                main.module.gameProtocol.sendTaskList(_taskListFinish, (obj) => {
                    this.data = this.copy(main.module.vm.taskList[`task_${this.data["id"]}`]);
                    this.setData(this.data);
                })
                return;
            }
            Message.dispatchEvent(AdvMessage.PLAY, {
                callback: (success: boolean, type: number) => {
                    if (type == AdvRewardType.DAY_TASK) {
                        if (success) {
                            let _taskListFinish = this.changTaskFinishState(this.data["id"])
                            main.module.vm.taskList = _taskListFinish;
                            main.module.gameProtocol.sendTaskList(_taskListFinish, (obj) => {
                                this.data = this.copy(main.module.vm.taskList[`task_${this.data["id"]}`]);
                                this.setData(this.data);
                            })
                        } else {
                            cc.log(`每日任务观看广告失败`);
                            event.target.getComponent(ButtonEffect).canTouch = true;
                        }
                    }
                }, type: AdvRewardType.DAY_TASK
            });
        }
    }
    
    clickCallback:Function = null;
    data:any = null;
    status:number = 0; 

    copy(data){
        let obj:Object = {};
        for(let key in data){
            obj[key] = data[key];
        }
        return obj;
    }
    setData(data:any){
        this.data = this.copy(data);
        // this.node.getChildByName("btn_leave").getComponent(ButtonEffect).canTouch = true;
        this.node.getChildByName("btn_poster").getComponent(ButtonEffect).canTouch = true;
        this.node.getChildByName("btn_get").getComponent(ButtonEffect).canTouch = true;
        this.setProgress(data["taskValue"]/data["taskTag"])
        this.node.getChildByName("task_progress_lab").getComponent(cc.Label).string = `${data["taskValue"]}/${data["taskTag"]}`;
        this.status = data["status"]
        this.btnState(this.status);
        let id = data["id"];
        this.setDataId(id,data["taskTag"]);
        let config = main.module.themeConfig.getTaskConfigByTag(`task_${id}`);
        this.node.getChildByName("task_package").active = config.rewardType == 2;
        this.node.getChildByName("task_diamond").active = config.rewardType == 1;
        this.node.getChildByName("task_diamond").getChildByName("task_diamond_num").getComponent(cc.Label).string = `X${config.rewardValue}`;
    }

    btnState(state:number){
        // this.node.getChildByName("btn_leave").active = state < 2;
        this.node.getChildByName("btn_poster").active = state < 2;
        this.node.getChildByName("btn_get").active = state == 2;
    }

    setProgress(val:number){
        this.node.getChildByName("task_progress_spr").getComponent(cc.Sprite).fillRange = val;
        this.node.getChildByName("task_progress_light").active = val >= 0.04 && val < 1;
        this.node.getChildByName("task_progress_light").x = -123 + (val-0.04) *  this.node.getChildByName("task_progress_spr").width;
    }

    setDataId(id:number,target:number){
        let dataId = "";
        switch (id) {
             case 1:
             case 2:
             case 3:
                 dataId = "ui_info_value1";
                 break;
             case 4:
             case 5:
                 dataId = "ui_info_value2";
                 break;
             case 6:
             case 7:
                 dataId = "ui_info_value3";
                 break;
             case 8:
             case 9:
                 dataId = "ui_info_value4";
                 break;
             case 10:
                 dataId = "ui_info_value5";
                 break;                
             case 11:
             case 12:
             case 13:
                 dataId = "ui_info_value6";
                 break; 
             case 14:
             case 15:
                 dataId = "ui_info_value7";
                 break;
             case 16:
             case 17:
             case 18:
                 dataId = "ui_info_value8";
                 break;
             case 19:
             case 20:
                 dataId = "ui_info_value9";
                 break;                        
            default:
                break;
       }
       let comp = this.node.getChildByName("task_title").getComponent(LanguageLabel);
       comp.dataID = dataId;
       comp.setVars(dataId.split("_")[2],target+"");

    }

    changTaskFinishState(taskId:number){//改变任务完成状态
        let taskList = main.module.vm.taskList;
        let resultList:Object = {};
        for(let key in taskList){
            if(key!="dateKey"){
                if(taskList[key]["id"] == taskId){
                    resultList[key] = taskList[key];
                    resultList[key]["status"] = 2;
                    resultList[key]["taskValue"] = resultList[key]["taskTag"]
                }else{
                    resultList[key] =taskList[key];
                }
            }else{
                resultList["dateKey"] = taskList[key];
            }
        }
        return resultList;      
    }


    onDestroy(){
        this.clickCallback = null;
        this.data = null;
        this.status = null; 
        super.onDestroy();
    }
  

}