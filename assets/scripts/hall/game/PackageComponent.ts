
import { Message } from "../../core/event/MessageManager";
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import { formatParams } from "../CalcTool";
import { TaskType } from "../CalcUiShow";
import PackageListItem from "./PackageListItem";
import StoreComponent from "./StoreComponent";

export interface PackageListParams{
    /** 名次 */
    index:number
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class PackageComponent extends ComponentExtends {
    
    @property(cc.Node)
    itemNode:cc.Node = null;

    mainNodes:HashMap<string,cc.Node> = null;

    onLoad(){
        
        service.analytics.logEvent("backpack_click_open", "", "")
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.node.active = false;
        this.refreshPackageList()
        
    }

    /** 刷新package列表 */
    refreshPackageList(){
        this.itemNode.active = false;
        let vm = main.module.vm;
        main.module.gameMainControl.mainNodes.get("red_point_package").active = false;
        service.prompt.netInstableOpen();
        main.module.gameProtocol.requestPropStorageList((data)=>{
            service.prompt.netInstableClose();
            let list = data["propStorageList"]
            vm.propStorageList = list;
            let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
            let itemParent = mainNodes.get("content");
            let index = 0;
            for(let key in list){
                let com = null;
                let info = list[key];
                let config = main.module.themeConfig.getPropConfigByTag(`add_${info["pid"]}`);
                if(info["totalCount"]-info["usedCount"] > 0){
                    if(index == 0){
                        this.itemNode.active = true;
                        this.itemNode.getComponent(PackageListItem).setData(key,info);
                        com = this.itemNode.getComponent(PackageListItem);
                        this.itemNode.zIndex = config.addType*20 + config.addValue[0] || 0;
                    }else{
                        let _itemNode = cc.instantiate(this.itemNode);
                        _itemNode.parent = itemParent;
                        _itemNode.getComponent(PackageListItem).setData(key,info);
                        com = _itemNode.getComponent(PackageListItem);
                        _itemNode.zIndex = config.addType*20 + config.addValue[0] || 0;
                    }
                    com.clickCallback = this.itemClickHandler.bind(this);
                    index++;
                }
            }
            if(index == 0){
                this.itemNode.active = false;
                mainNodes.get("no_package").active = true;
            }else{
                mainNodes.get("no_package").active = false;
            }
            this.node.active = true;
        })
    }

    changeList(storeId:number,upTargerLv?:number){
        let maxLv = main.module.themeConfig.getStoreMaxLvById(storeId);
        let storeList = main.module.vm.storeList;
        let resultList:Object = {};
        for(let key in storeList){
            if(storeList[key]["id"] == storeId){
                resultList[key] = {
                    id:storeList[key]["id"],
                    level:storeList[key]["level"] + upTargerLv >= maxLv ?maxLv:storeList[key]["level"] + upTargerLv,
                    rewardTime:main.module.calcUiShow.getSeverCurrentTime()
                }
            }else{
                resultList[key] = {
                    id:storeList[key]["id"],
                    level:storeList[key]["level"],
                    rewardTime:storeList[key]["rewardTime"]
                }
            }
        }
        return resultList;      
    }

    canClick:boolean = true;
    itemClickHandler(params:any,reward:formatParams,nodeObj:PackageListItem,isPop:boolean=true){
        if(!this.canClick){
            return;
        }
        this.canClick = false;
        let vm = main.module.vm;
        cc.log(`道具ID`+params.pid);
        let pid = params.pid;
        if(isPop){
            Message.dispatchEvent(AudioMessage.EFFECT, "alt")
            let popViewParams:PopViewParams = {
                modal:true,
                opacity:150,
                touchClose:false,
                onRemoved:()=>{
                    this.canClick = true;
                }
            }
            
            gui.popup.add(`popup/prop_result`,{params:params,reward:reward},popViewParams);
            main.module.calcUiShow.refreshCredit(reward,()=>{
            },true)
        }

        switch (params.addType) {
            case 1:
                service.analytics.logEvent("backpack_click_use1", "", "")
                break;
            case 2:
                service.analytics.logEvent("backpack_click_use2", "", "")
                break;            
            case 3:
                service.analytics.logEvent("backpack_click_use3", "", "")
                break;            
            case 4:
                service.analytics.logEvent("backpack_click_use4", "", "")
                break;            
            default:
                break;
        }
        
        let callback = ()=>{
            main.module.vm.propStorageList = this.changePropStorageList(params.pid);
            if(main.module.vm.propStorageList[`prop_${pid}`]["totalCount"] - main.module.vm.propStorageList[`prop_${pid}`]["usedCount"]<=0){
                nodeObj.node.destroy();
            }else{
                nodeObj.setData(`prop_${pid}`,main.module.vm.propStorageList[`prop_${pid}`]);
            }
            let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
            let itemParent = mainNodes.get("content");
            mainNodes.get("no_package").active = itemParent.children.length == 1 && !this.itemNode.active ;
        }
        let config = main.module.themeConfig.getPropConfigByTag(`add_${pid}`);
        if(config.addType == 4){
            let _taskListUpLv = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.STORE_UP,config.addValue[1]);
            let countPost = main.module.calcUiShow.calcPostNum(config.addValue[0],config.addValue[1]);//里程碑
            main.module.gameProtocol.sendTaskList(_taskListUpLv,(obj)=>{
                vm.taskList = _taskListUpLv;
                if(countPost>0){
                    let _taskListPost = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.STORE_CHALLENGE,countPost);
                    cc.log("道具升级店铺达成挑战改变任务列表"+JSON.stringify( _taskListPost ));
                    main.module.gameProtocol.sendTaskList(_taskListPost,(obj)=>{
                        vm.taskList = _taskListPost;
                    })
                    
                }
            })
            let storeNode = main.module.mainScene.storesNode.getChildByName(`store_${config.addValue[0]}`);
            storeNode.getComponent(StoreComponent).upLvHandler(config.addValue[1],{num:0,numE:0},true,()=>{
                callback && callback();
                this.refreshBtnMaxLvState();
            })
        }
        
        main.module.gameProtocol.requestUseProp(pid,(data)=>{
            // this.refreshPackageList();
        })  
        if(config.addType != 4){
            callback && callback();
        }
        main.module.gameProtocol.requestPropList((data)=>{
            main.module.vm.propList = data["propList"];
        })
        let _taskList = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.USE_PROP,1);
        main.module.gameProtocol.sendTaskList(_taskList,(obj)=>{
            main.module.vm.taskList = _taskList;
        })
       
    }

    changePropStorageList(pid:number){
        let propList = main.module.vm.propStorageList;
        let resultList:Object = {};
        for(let key in propList){
            if(propList[key]["pid"] == pid){
                resultList[key] = {
                    pid:propList[key]["pid"],
                    totalCount:propList[key]["totalCount"],
                    usedCount:propList[key]["usedCount"]+1>=propList[key]["totalCount"]?propList[key]["totalCount"]:propList[key]["usedCount"]+1
                }
            }else{
                resultList[key] = {
                    pid:propList[key]["pid"],
                    totalCount:propList[key]["totalCount"],
                    usedCount:propList[key]["usedCount"]
                }
            }
        }
        return resultList;      
    }

    refreshBtnMaxLvState(){
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let itemParent = mainNodes.get("content");
        itemParent.children.forEach((child:cc.Node)=>{
            child.getComponent(PackageListItem).refreshBtnState();
        })
    }

    onDestroy(){
        this.mainNodes = null;
        // this.node.parent.active = false;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        main.module.gamedata.newPropId = [];
        super.onDestroy();
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