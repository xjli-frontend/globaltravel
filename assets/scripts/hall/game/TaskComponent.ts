
import { Message } from "../../core/event/MessageManager";
import { gui } from "../../core/gui/GUI";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import ExToggleGroup from "../../core/ui/ExToggleGroup";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { AsyncQueue } from "../../core/util/AsyncQueue";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import TaskListChallengeItem from "./TaskListChallengeItem";
import { default as TaskListDayItem } from "./TaskListDayItem";
import TaskListMainItem from "./TaskListMainItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TaskComponent extends ComponentExtends {

    mainNodes:HashMap<string,cc.Node> = null;

    @property(cc.Node)
    item_node1:cc.Node = null;
    @property(cc.Node)
    item_node2:cc.Node = null;
    @property(cc.Node)
    item_node3:cc.Node = null;

    @property(cc.Node)
    cutdownNode:cc.Node = null
    onLoad(){
        service.analytics.logEvent("task_click_open", "", "")
        this.mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).toggleCallback = (toggle)=>{
            Message.dispatchEvent(AudioMessage.EFFECT,"ui_2");
            let suf = toggle.node.name.replace(/[^\d]+/, "");
            this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).getItems().forEach((child)=>{
                child.getChildByName("checkmark").active = toggle.node.name == child.name;
            })
            this.switchTag(suf);
        }
        this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).setIndex(0);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.node.active = false;
        main.module.gameMainControl.mainNodes.get("red_point_task").active = false;
        this.switchTag("1");
    }


    
    switchTag(tag:string){
        switch (tag) {
            case "1":
                if(main.module.vm.level == 1){
                    this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).setIndex(2);
                    this.switchTag("3");
                    return;
                }
                this.mainNodes.get("toggle_group").children.forEach((child)=>{
                    child.active = true
                })
                this.mainNodes.get("day").active = true;
                this.mainNodes.get("main").active = false;
                this.mainNodes.get("challenge").active = false;
                this.loadTaskDayList();
                break;
            case "2":
                if(main.module.vm.level == 1){
                    this.mainNodes.get("toggle_group").getComponent(ExToggleGroup).setIndex(2);
                    this.switchTag("3");
                    return;
                }
                service.analytics.logEvent("task_click_maintask", "", "")
                this.mainNodes.get("toggle_group").children.forEach((child)=>{
                    child.active = true
                })
                this.mainNodes.get("day").active = false;
                this.mainNodes.get("main").active = true;
                this.mainNodes.get("challenge").active = false;
                this.loadTaskMainList();
                break;
            case "3":
                service.analytics.logEvent("task_click_challenges", "", "")
                this.mainNodes.get("day").active = false;
                this.mainNodes.get("main").active = false;
                this.mainNodes.get("challenge").active = true;
                if(main.module.vm.level == 1){
                    this.mainNodes.get("toggle_group").children.forEach((child)=>{
                        child.active = child.name == "toggle3" || child.name == "bg_on" || child.name == "Background3";
                        if(child.name == "toggle3" || child.name == "Background3"){
                            child.x = 89.5;
                        }
                    })
                }
                this.loadTaskChallengeList();
                break;
            default:
                break;
        }
    }

    loadTaskDayList(){
        if(!this.item_node1){
            return;
        }
        if(this.item_node1.parent.children.length > 1){
            return;
        }
        let taskList = main.module.vm.taskList;
        let index = 0;
        for(let key in taskList){
            let info = taskList[key];
            if(key!="dateKey" && key!="endTime"){
                let comp = null;
                if(index < 4 && info["status"] != 3){
                    if(index == 0){
                        this.item_node1.active = true;
                        comp = this.item_node1.getComponent(TaskListDayItem);
                        comp.setData(info);
                    }else{
                        let _node = cc.instantiate(this.item_node1);
                        _node.parent = this.item_node1.parent;
                        _node.active = true;
                        comp = _node.getComponent(TaskListDayItem);
                        comp.setData(info);
                    }
                    comp.node.zIndex = info["id"];
                    comp.clickCallback = this.itemClickDayHandler.bind(this);
                    index++;
                }
            }
        }
        let dayNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("day"));
        if(index == 0){
            this.item_node1.active = false;
            dayNodes.get("no_task").active = true;
        }else{
            dayNodes.get("no_task").active = false;
        }
        this.node.active = true;
    }

    loadTaskMainList(){
        let level = main.module.vm.level;
        if(level == 10){
            this.mainNodes.get("main").active = false;
        }
        let levelReward = main.module.vm.levelReward;
        let comp = this.item_node2.getComponent(TaskListMainItem);
        let config = main.module.themeConfig.getTaskConfigByTag(`task_${20+levelReward}`);
        let isFinish = level > levelReward;
        comp.setData(config,isFinish);
        comp.clickCallback = (config)=>{
            if(isFinish){
                let callback = ()=>{
                    main.module.gameProtocol.requestMainTaskReward((obj)=>{
                        main.module.vm.diamond = obj["userAccount"]["credit"];
                        main.module.vm.levelReward = obj["accountInfo"]["levelReward"];
                        this.loadTaskMainList();
                    })
                }
                if(config.rewardType == 1){
                    main.module.gameMainControl.playDiamondffect(()=>{
                        callback && callback();
                    });
                }else if(config.rewardType == 2){
                    main.module.gameMainControl.playPackageffect(()=>{
                        callback && callback();
                    });
                }
            }else{
                this.node.destroy();
            }
        }
        this.node.active = true;
    }

    loadTaskChallengeList(){
        if(this.item_node3.parent.children.length > 1){
            return;
        }
        let storesIdLv = main.module.gamedata.storesIdLv;
        let keys = storesIdLv.keys();
        let index = 0;
        this.item_node3.active = false;
        keys.forEach((key)=>{
            let storeLvConfig = main.module.themeConfig.getStoreSpeedLvConfigByTag(`store_${key}`);
            let values = storeLvConfig.values();
            let currentStoreLv = storesIdLv.get(key);
            let targetLv = 0;
            let targetValue = 0;
            let maxLv = main.module.themeConfig.getStoreMaxLvById(key);
            if(currentStoreLv<maxLv){
                for(let i=0;i<values.length;i++){
                    if(values[i].level>currentStoreLv){
                        targetLv = values[i].level;
                        targetValue = values[i].value;
                        break;
                    }
                }
                let comp = null;
                let data = {
                    currentStoreLv:currentStoreLv,
                    targetLv:targetLv,
                    id:key,
                }
                if(index == 0){
                    this.item_node3.active = true;
                    comp = this.item_node3.getComponent(TaskListChallengeItem);
                    this.item_node3.name = `item_${key}`;
                    comp.setData(data);
                }else{
                    let _node = cc.instantiate(this.item_node3);
                    _node.parent = this.item_node3.parent;
                    _node.active = true;
                    _node.name = `item_${key}`;
                    comp = _node.getComponent(TaskListChallengeItem);
                    comp.setData(data);
                }
                index++;
            }
        })
        //---- 11号店铺
       
        let values = storesIdLv.values();
        main.module.calcTool.sort(values);
        let config = main.module.themeConfig.getStoreSpeedLvConfigByTag("store_11");
        let configKeys = config.keys();
        let postLv = 0;
        for(let i=0;i<configKeys.length;i++){
            if(values[0] < configKeys[i]){
                postLv = configKeys[i];
                break;
            }
        }
        if(values[0]<= configKeys[configKeys.length-1]){
            let data = {
                currentStoreLv:values[0],
                targetLv:postLv,
                id:11,
            }
            let _node11 = cc.instantiate(this.item_node3);
            _node11.parent = this.item_node3.parent;
            _node11.name = `item_11`;
            _node11.active = true;
            let comp11 = _node11.getComponent(TaskListChallengeItem);
            comp11.setData(data);
        }
        this.node.active = true;
    }

    changTaskGetDayState(taskId:number){//改变领取状态 每日任务
        let taskList = main.module.vm.taskList;
        let resultList:Object = {};
        for(let key in taskList){
            if(key!="dateKey"){
                if(taskList[key]["id"] == taskId){
                    resultList[key] = taskList[key];
                    resultList[key]["status"] = 3;
                }else{
                    resultList[key] =taskList[key];
                }
            }else{
                resultList["dateKey"] = taskList[key];
            }
        }
        return resultList;      
    }

    /** 获取下一个每日任务 */
    getNextDayTask(){
        let taskList = main.module.vm.taskList;
        let index = 0;
        for(let key in taskList){
            let info = taskList[key];
            if(key!="dateKey" && key!="endTime"){
                if(index < 4 && info["status"] != 3){
                    if(index == 3){
                        return info;
                    }
                    index++;
                }
            }
        }
        return null;
    }

    itemClickDayHandler(event,data:any){
        let vm = main.module.vm;
        cc.log(JSON.stringify(data));
        service.prompt.netInstableOpenByTask();
        let callback = ()=>{
            if(data["status"]==2 && this.item_node1){
                // let _taskList = this.changTaskGetDayState(data["id"]);
                // vm.taskList = _taskList;
                if(event.target.parent.uuid == this.item_node1.uuid){
                    this.item_node1.active = false;
                }else{
                    event.target.parent.destroy();
                }
                let infoNext = this.getNextDayTask();
                if(infoNext){
                    let _node = cc.instantiate(this.item_node1);
                    _node.parent = this.item_node1.parent;
                    _node.active = true;
                    _node.zIndex = infoNext["id"]
                    let comp = _node.getComponent(TaskListDayItem);
                    comp.setData(infoNext);
                    comp.clickCallback = this.itemClickDayHandler.bind(this);
                }
                let dayNodes = ViewUtils.nodeTreeInfoLite(this.node.getChildByName("day"));
                this.scheduleOnce(()=>{
                    if(!this.item_node1.active && dayNodes.get("content").children.length == 1){
                        dayNodes.get("no_task").active = true;
                    }else{
                        dayNodes.get("no_task").active = false;
                    }
                })
            }
        }
        let rewardType = main.module.themeConfig.getTaskConfigByTag(`task_${data["id"]}`).rewardType;
        if(data["status"]==2){
            let _taskList = this.changTaskGetDayState(data["id"]);
            service.analytics.logEvent("task_click_get", "", "")
            let nextCall = AsyncQueue.excuteTimes(2,()=>{
                callback && callback();
                service.prompt.netInstableClose();
            });
            if(rewardType == 1){
                main.module.gameMainControl.playDiamondffect(()=>{
                    main.module.gameProtocol.requestDayTaskReward(data["id"],(obj)=>{
                        main.module.vm.diamond = obj["userAccount"]["credit"];
                        nextCall && nextCall();
                    });
                    main.module.gameProtocol.sendTaskList(_taskList, (obj) => {
                        main.module.vm.taskList = _taskList;
                        nextCall && nextCall();
                    })
                });
            }else if(rewardType == 2){
                main.module.gameMainControl.playPackageffect(()=>{
                    main.module.gameProtocol.requestDayTaskReward(data["id"],(obj)=>{
                        nextCall && nextCall();
                    })
                    main.module.gameProtocol.sendTaskList(_taskList, (obj) => {
                        main.module.vm.taskList = _taskList;
                        nextCall && nextCall();
                    })
                });
            }
            return;
        }
        return;
        service.analytics.logEvent("task_click_go", "", "")
        service.prompt.netInstableClose();
        switch (data["id"]) {
             case 1:
             case 2:
             case 3:
                gui.delete(this.node)
                break;
             case 4:
             case 5:
                gui.delete(this.node)
                break;
             case 6:
             case 7:
                gui.delete(this.node)
                break;
             case 8:
             case 9:
                gui.delete(this.node)
                break;
             case 10:
                gui.delete(this.node)
                break;                
             case 11:
             case 12:
             case 13:
                main.module.gameMainControl.openShop(0);
                break; 
             case 14:
             case 15:
                gui.delete(this.node)
                break;
             case 16:
             case 17:
             case 18:
                 if(main.module.gameMainControl.shopFameIsShow()){
                     main.module.gameMainControl.openShop(1);
                 }else{
                    gui.delete(this.node)
                 }
                break;
             case 19:
             case 20:
                main.module.gameMainControl.openMainPop("btn_package");
                break;                        
            default:
                break;
       }
    }

    onDestroy(){
        this.mainNodes = null;
        // this.node.parent.active = false;
        this.isUpdate = null;
        main.module.gameMainControl.clearContainer();
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        super.onDestroy();
    }

    isUpdate:boolean = false;
    update(){
        let cutdownTimes = main.module.vm.taskList["endTime"] - main.module.calcUiShow.getSeverCurrentTime();
        let str = main.module.calcUiShow.formatTime(cutdownTimes);
        // cc.log(`cutdownTimes=>${cutdownTimes}`,`formatTime=>${str}`,`severCurrentTime=>${main.module.calcUiShow.getSeverCurrentTime()}`);
        if(cutdownTimes <= 0 && !this.isUpdate){
            this.isUpdate = true;
            main.module.gameProtocol.requestTaskList((obj)=>{
                main.module.vm.taskList = obj["taskList"];
                this.loadTaskDayList();
                this.isUpdate = false;
            })
            this.item_node1.parent.children.forEach((child)=>{
                if(child.uuid != this.item_node1.uuid){
                    child.destroy();
                }
            })
        }
        this.cutdownNode.getComponent(cc.Label).string = str;
    }
    
    onTouchHandler(event:cc.Event.EventTouch){
        switch(event.target.name){
            case "btn_close":{
                gui.delete(this.node)
                // this.node.destroy()
                break;
            }
        }
    }
}