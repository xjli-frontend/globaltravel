
import { PopViewParams } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import ButtonSimple from "../../core/ui/button/ButtonSimple";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { service } from "../../service/Service";
import { TaskType } from "../CalcUiShow";
import ActionYSet from "./effect/ActionYSet";
import ListItemFrame from "./ListItemFrame";

const { ccclass, property } = cc._decorator;

const initMap = [2160,1600];
@ccclass
export default class WorldMapComponent extends ComponentExtends {

    @property(cc.Sprite)
    map: cc.Sprite = null;

    currentMapId: number = 1;

    nodes: HashMap<string, cc.Node> = null;
    onLoad() {
        this.nodes = ViewUtils.nodeTreeInfoLite(this.node);

        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        let safeArea: cc.Rect = cc.sys.getSafeAreaRect();
        safeArea.width = safeArea.width || cc.winSize.width;
        safeArea.height = safeArea.height || cc.winSize.height;
        this.node.getChildByName("scollview").width = cc.winSize.width;
        this.node.getChildByName("scollview").height = cc.winSize.height;
        let widget = this.node.getChildByName("btn_close").getComponent(cc.Widget);
        if (widget) {
            widget.top = (cc.winSize.height - safeArea.height) + 15 - cc.winSize.height/2;
            widget.right = - cc.winSize.width/2+10;
            widget.updateAlignment()
        }
        this.setInfo();
    }

    setInfo(){
        let fameMultiTotal = main.module.calcUiShow.oneFameAdd();
        this.nodes.get("bonus_lab").getComponent(LabelChangeSymbol).string = `${ Math.floor( fameMultiTotal*100) }%` +"";
        let rewardAdd = main.module.calcUiShow.rewardAdd()
        if(main.module.calcTool.compare({num:1,numE:3},rewardAdd)){
            let totalStr = rewardAdd.num * Math.pow(10,rewardAdd.numE); 
            let str = Math.floor( totalStr * 100);
            this.nodes.get("total_lab").getComponent(LabelChangeSymbol).string = `${str}%`;
        }else{
            this.nodes.get("total_lab").getComponent(LabelChangeSymbol).num = main.module.calcUiShow.rewardAdd();
        }
        this.nodes.get("current_lab").getComponent(LabelChangeSymbol).num = main.module.vm.fame;

        let canGetFame = main.module.calcUiShow.calcCurrentCanGetFame();
        this.nodes.get("will_lab").getComponent(LabelChangeSymbol).num = canGetFame;
    }

    countryCenter(){
        this.nodes.get("content").setPosition(this.calcPos(1));
        // this.scheduleOnce(()=>{
        //     this.countryCenterAnim();
        // },2)
    }

    calcPos(level?:number){
        if(!level){
            level = this.currentMapLevel;
        }
        let countryNode = this.nodes.get(`country_${level}`);
        let worldPosCountry = countryNode.parent.convertToWorldSpaceAR(countryNode.getPosition());
        let centerX = cc.winSize.width/2;
        let centerY = cc.winSize.height/2;
        let deviationX = worldPosCountry.x - centerX;
        let deviationY = worldPosCountry.y - centerY;
        let targetX = this.nodes.get("content").x - deviationX;
        let targetY = this.nodes.get("content").y - deviationY;
        const screen_width = cc.winSize.width;
        const screen_height = cc.winSize.height;
        let minX = -(this.nodes.get("content").width - screen_width)/2;
        let minY = -(this.nodes.get("content").height - screen_height)/2;
        let maxX = (this.nodes.get("content").width - screen_width)/2;
        let maxY = (this.nodes.get("content").height - screen_height)/2;
        if(targetX<minX){
            targetX = minX;
        }
        if(targetX>maxX){
            targetX = maxX;
        }
        if(targetY<minY){
            targetY = minY;
        }
        if(targetY>maxY){
            targetY = maxY;
        }
        return cc.v2(targetX,targetY);
    }

    currentMapLevel:number = 1;

    countryCenterAnim(callback?:Function){
        let ce3 = ezaction.HCustomEase.create("ce3", "M0,0 C0.084,0.61 0.214,0.802 0.28,0.856 0.356,0.918 0.374,1 1,1 ")
        const rollEaseOut = ezaction.ease.customEase(ce3);
        gui.popup.clear();
        this.nodes.get("scollview").getComponent(cc.ScrollView).enabled = false;
        this.nodes.get("content").RunAction(ezaction.moveTo(2,{x:this.calcPos().x,y:this.calcPos().y}).easing(rollEaseOut)).onStoped(()=>{
            let countryNode = this.nodes.get(`country_${main.module.vm.level}`);
            let worldPosCountry = countryNode.parent.convertToWorldSpaceAR(countryNode.getPosition());
            let spacePosCountry = this.nodes.get("content").convertToNodeSpaceAR(worldPosCountry);
            this.nodes.get("tip").StopAllActions();
            this.nodes.get("tip").getComponent(ActionYSet).initY = spacePosCountry.y + countryNode.height/2 +35;
            this.nodes.get("tip").x = spacePosCountry.x;
            // this.loadPopMapInfo();
            this.nodes.get("content").RunAction(ezaction.scaleTo(2,{scale:1.5})).onUpdate(()=>{
                this.nodes.get("content").width = initMap[0]*this.nodes.get("content").scale;
                this.nodes.get("content").height = initMap[1]*this.nodes.get("content").scale;
                this.nodes.get("content").setPosition(this.calcPos().x,this.calcPos().y);
            }).onStoped(()=>{
                this.nodes.get("content").RunAction(ezaction.fadeTo(0.5,0)).onStoped(()=>{
                    callback && callback();
                    gui.delete(this.node);
                    gui.popup.clear();
                });
            });
        });
    }
    
    onAdded(params: any) {
        this.countryCenter();
        let level = main.module.vm.level;
        this.currentMapLevel = level;
        this.refreshCityByMaxId();
        let countryNode = this.nodes.get(`country_${level}`);
        this.nodes.get("btn_pass").setPosition(countryNode.x,countryNode.y-countryNode.height/2-35);
        let worldPosCountry = countryNode.parent.convertToWorldSpaceAR(countryNode.getPosition());
        let spacePosCountry = this.nodes.get("content").convertToNodeSpaceAR(worldPosCountry);
        this.nodes.get("pass_skeleton").setPosition(spacePosCountry.x,spacePosCountry.y);
        this.nodes.get("pass_particle").setPosition(spacePosCountry.x,spacePosCountry.y);
        
        this.nodes.get("tip").getComponent(ActionYSet).initY = spacePosCountry.y + countryNode.height/2 +35;
        this.nodes.get("tip").x = spacePosCountry.x;

        this.loadPopMapInfo();
        this.initProgressRoadBtnPass();
    }

    initProgressRoadBtnPass(){
        let level = this.currentMapLevel;
        this.nodes.get("road").children.forEach((child)=>{
            child.active = child.name == `road${level-1}`;
        })
        let countryNode = this.nodes.get(`country_${level}`);
        this.nodes.get("btn_pass").setPosition(countryNode.x,countryNode.y-countryNode.height/2-35);
    }
    moveMap(index: number = 1) {
        let content = this.nodes.get("content");
        switch (index) {
            case 0:
                content.x = 720;
                break;
            case 1:
                content.x = 0;
                break;
            case 2:
                content.x = -720;
                break;
            default:
                break;
        }
    }

    refreshCityByMaxId() {
        let nodes = this.nodes;
        for (let i = 1; i < 11; i++) {
            nodes.get(`country_${i}`).addComponent(ButtonSimple);
            if (i <= this.currentMapLevel) {
                this.refreshCountryState(nodes.get(`country_${i}`), true);
            } else {
                this.refreshCountryState(nodes.get(`country_${i}`), false);
            }
        }
    }

    refreshCountryState(countryNode: cc.Node, state: boolean) {
        countryNode.getChildByName("country_name").active = state;
        // countryNode.getChildByName(`point_${countryNode.name.split("_")[1]}`).getComponent(ButtonEffect).canTouch = state;
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let countryComp = countryNode.getComponent(ButtonEffect);
        if (countryComp) {
            countryComp.canTouch = state;
        }
        countryNode.color = color;
        let id = parseInt(countryNode.name.split("_")[1]);
        let index = 0;
        if(id == main.module.vm.level){
            index = 1;
        }else if(id>main.module.vm.level){
            index = 2;
        }
        countryNode.getChildByName(`point_${id}`).getComponent(ListItemFrame).setFrame(index);
        
    }

    loadPopMapInfo(cityId?:number){
        if(!cityId){
            cityId = main.module.vm.level;
        }
        if(cityId ==  1){
            return;
        }
        gui.popup.clear();
        let countryNode = this.nodes.get(`country_${cityId}`);
        let worldPosCountry = countryNode.parent.convertToWorldSpaceAR(countryNode.getPosition());
        let popViewParams: PopViewParams = {
            modal: false,
            opacity: 126,
            touchClose: true,
            onAdded: (view, params) => {
            },
            onRemoved: () => {
            }
        }
        gui.popup.add(`world/city_explain`, { cityId: cityId,worldPos:worldPosCountry, callback: () => { this.node.destroy() } }, popViewParams)
    }

    onTouchHandler(event: cc.Event.EventTouch) {
        let suf = event.target.name.split("_")[0];
        let targetNode: cc.Node = event.target;
        let worldPos = targetNode.parent.convertToWorldSpaceAR(targetNode.getPosition());
        let cityId = parseInt(event.target.name.split("_")[1]);
        if (suf == "country" && event.target.name.split("_")[1] != "name") {
            this.loadPopMapInfo(cityId);
            return;
        }
        if (suf == "point" && event.target.getComponent(ButtonEffect) && event.target.getComponent(ButtonEffect).canTouch) {
            this.loadPopMapInfo(cityId);
            return;
        }
        
        switch (event.target.name) {
            case "btn_close": {
                gui.delete(this.node);
                break;
            }
            case "btn_pass":{
                if(!event.target.getComponent(ButtonEffect).canTouch){
                    return;
                }
                this.btnPassHandler(()=>{
                    cc.log("卖楼成功");
                });
                service.analytics.logEvent("fame_click_restart", "", "");
                break;
            }
        }
    }

    btnPassHandler(noviceCallback:Function,animCallback?:Function){
        let callback = ()=>{
            main.module.vm.sellNum+=1;
            main.module.gameProtocol.writeCacheData("sellNum", main.module.vm.sellNum as Object, (data) => {
            })
            let _storeList = this.getSellList(0);
            main.module.vm.storeList = this.getSellList(0);
            main.module.gameProtocol.sendStoreList(_storeList,()=>{
                cc.log("清空店铺等级成功");
            })
            let _clerkList = this.getSellList(1);
            main.module.vm.clerkList = _clerkList;
            main.module.gameProtocol.sendClerkList(_clerkList,()=>{
                cc.log("清空店员等级成功");
            })
            let _fameList = this.getSellList(2);
            main.module.vm.fameList = _fameList;
            main.module.gameProtocol.sendFameList(_fameList,()=>{
                cc.log("清空声望等级成功");
            })
            main.module.calcUiShow.sellStores(()=>{
                main.module.vm.isPass = 0;
                main.module.gameProtocol.writeCacheData("isPass", main.module.vm.isPass as Object, (data) => {
                        
                })
                noviceCallback && noviceCallback();
                let _taskList = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.SELL_STORES,1);
                main.module.gameProtocol.sendTaskList(_taskList,(obj)=>{
                    main.module.vm.taskList = _taskList;
                })
                let _animCallback = ()=>{
                    main.module.vm.level += 1;
                    animCallback ();
                }
                this.currentMapLevel = main.module.vm.level + 1;
                this.initProgressRoadBtnPass();
                this.refreshCityByMaxId();
                this.countryCenterAnim(_animCallback);
            })
        }
        let _popViewParams:PopViewParams = {
            touchClose:false,
        }
        main.module.mainScene.mapControl.initNode();
        gui.popup.add(`popup/sellstores_result`,{callback:()=>{
            callback && callback();
        }},_popViewParams);
        
     
    }

    getSellList(idx:number){
        let list = null
        switch (idx) {
            case 0:
                list = main.module.vm.storeList;
                break;
            case 1:
                list = main.module.vm.clerkList;
                break;
            case 2:
                list = main.module.vm.fameList;
                break;
        }
        let resultList:Object = {};
        for(let key in list){
            resultList[key] = {
                id:list[key]["id"],
                level:0
            }
            
        }
        return resultList;      
    }

    update(dt) {
        this.refreshBtnState(this.nodes.get("btn_pass"),main.module.vm.isPass==1);
        this.nodes.get("pass_skeleton").active = main.module.vm.isPass==1;
        this.nodes.get("pass_particle").active = main.module.vm.isPass==1;
    }

    refreshBtnState(btnNode:cc.Node,state:boolean){
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        if (btnComp){
            btnComp.canTouch = state;
        }
        btnNode.color = color;
        for (let child of btnNode.children){
            child.color = color;
        }
    }


    onDestroy() {
        // cc.loader.releaseAsset(this.map.spriteFrame)
        this.map = null;
        this.currentMapId = null;
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        this.nodes.clear();
        this.nodes = null;
        super.onDestroy()
    }
}
