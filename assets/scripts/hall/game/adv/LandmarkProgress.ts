import { Message } from "../../../core/event/MessageManager";
import { gui } from "../../../core/gui/GUI";
import { LanguageLabel } from "../../../core/language/LanguageLabel";
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import { TaskType } from "../../CalcUiShow";
import { AdvMessage, AdvRewardType } from "./AdvControl";


const { ccclass, property } = cc._decorator;

@ccclass
export default class LandmarkProgress extends ComponentExtends {


    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        }
    }


    nextCanClickTime:number = 0;
    onAdded(params:any){
        cc.log(`LandmarkProgress界面弹窗`);
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        let reward = main.module.calcUiShow.getTimeStageReward(5*60);
        if(reward.num == 0){
            reward = {num:1,numE:3};
        }
        nodes.get("layout").active = false;
        this.scheduleOnce(()=>{
            nodes.get("layout").active = true;
        });
        nodes.get("coin_num").getComponent(LabelChangeSymbol).num = reward;
        nodes.get("diamond_skeleton").active = false;
        nodes.get("diamond_skeleton").getComponent(sp.Skeleton).setAnimation(0,"reward_loop",true);
        this.nextCanClickTime = main.module.calcUiShow.getSeverCurrentTime();
    }

    canGetDiamond:boolean = true;
    onTouchHandler(event:cc.Event.EventTouch){
        let reward = main.module.calcUiShow.getTimeStageReward(5*60);
        if(reward.num == 0){
            reward = {num:1,numE:3};
        }
        switch(event.target.name){
            case "btn_poster":{
                if(this.node.getChildByName("btn_poster").getComponent(ButtonEffect) && !this.node.getChildByName("btn_poster").getComponent(ButtonEffect).canTouch){
                    return;
                }
                this.canGetDiamond = false;
                this.nextCanClickTime = this.nextCanClickTime + 10 * 1000;
                let count = main.module.vm.advCount + 1;
                if(count-1 == 5){
                    main.module.gameMainControl.playAdDiamondEffect(()=>{
                        main.module.gameProtocol.requestDayTaskReward(31,(obj)=>{
                            main.module.vm.advCount = 0;
                            main.module.gameProtocol.sendAdvCount(0);
                            main.module.vm.diamond = obj["userAccount"]["credit"];
                        });
                    });
                    return;
                }
                if (cc.sys.isBrowser) {
                    cc.log(`浏览器直接发放地标金币奖励`);
                    main.module.gameMainControl.playCreditEffect(reward, () => {
                        main.module.calcUiShow.refreshCredit(reward, () => {
                        }, true)
                    });
                    let _taskListAd = main.module.calcUiShow.changeTaskListByTypeCount(TaskType.WATCH_AD, 1)
                    main.module.gameProtocol.sendTaskList(_taskListAd, (obj) => {
                        main.module.vm.taskList = _taskListAd;
                    })
                    if(count <= 5){
                        main.module.gameProtocol.sendAdvCount(count,()=>{
                            main.module.vm.advCount = count;
                            this.canGetDiamond = true;
                        });
                    }else{
                        main.module.gameProtocol.sendAdvCount(5,()=>{
                            main.module.vm.advCount = 5;
                            this.canGetDiamond = true;
                        });
                    }
                    return;
                }
                Message.dispatchEvent(AdvMessage.PLAY, {
                    callback: (success: boolean, type: number) => {
                        if (type == AdvRewardType.LANDMARK) {
                            if (success) {
                                cc.log(`点击地标观看广告成功`);
                                this.canGetDiamond = true;
                                main.module.gameMainControl.playCreditEffect(reward, () => {
                                    main.module.calcUiShow.refreshCredit(reward, () => {
                                    }, true)
                                });
                            } else {
                                this.canGetDiamond = true;
                                let currentDate = main.module.calcUiShow.getSeverCurrentTime();
                                this.nextCanClickTime = currentDate;
                                cc.log(`点击地标观看广告失败`)
                            }
                        }
                    }, type: AdvRewardType.LANDMARK
                });
                break;
            }
            case "bg":{
                cc.log(`LandmarkProgress:选择不观看视频bg`)
                break;
            }
            case "btn_diamond":{
                if(this.node.getChildByName("btn_diamond").getComponent(ButtonEffect) && !this.node.getChildByName("btn_diamond").getComponent(ButtonEffect).canTouch){
                    return;
                }
                cc.log(`LandmarkProgress:领取钻石`)
                this.nextCanClickTime = this.nextCanClickTime + 10 * 1000;
                main.module.gameMainControl.playAdDiamondEffect(()=>{
                    main.module.gameProtocol.requestDayTaskReward(31,(obj)=>{
                        main.module.vm.advCount = 0;
                        main.module.gameProtocol.sendAdvCount(0);
                        main.module.vm.diamond = obj["userAccount"]["credit"];
                    });
                });
                break;
            }
            default:{
                cc.log(`LandmarkProgress:选择不观看视频`)
                // this.node.destroy();
                gui.delete(this.node);
            }
        }
    }

    update(){
        this.setProgress(main.module.vm.advCount);
        let currentDate = main.module.calcUiShow.getSeverCurrentTime();
        this.showButtonEffect(this.node.getChildByName("btn_poster"),currentDate>=this.nextCanClickTime);
        let count = main.module.vm.advCount;
        this.node.getChildByName("diamond_skeleton").active = count>=5;
        this.node.getChildByName("btn_diamond").active = count>=5;
        this.node.getChildByName("progress").active = count<5;
        this.node.getChildByName("layout").active = count<5;
        this.showButtonEffect(this.node.getChildByName("btn_diamond"),count>=5 && this.canGetDiamond);
    }

    setProgress(times:number){
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        let range = 0;
        nodes.get("poster_lab").getComponent(LanguageLabel).dataID = "ui_ad_4";
        nodes.get("poster_lab").x = 35;
        nodes.get("adv").active = true;
        switch (times) {
            case 0:
                range = 0
                break;
            case 1:
                range = 0.09
                break;
            case 2:
                range = 0.295
                break;
            case 3:
                range = 0.51
                break;
            case 4:
                range = 0.75
                break;
            case 5:
                range = 0
                nodes.get("adv").active = false;
                nodes.get("poster_lab").getComponent(LanguageLabel).dataID = "ui_ad_6";
                nodes.get("poster_lab").x = 0;
                break;
            default:
                break;
        }
        nodes.get("progress_spr").getComponent(cc.Sprite).fillRange = range;
    }

    showButtonEffect(btnNode: cc.Node, state: boolean) {
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        btnNode.color = color;
        if (btnComp) {
            btnComp.canTouch = state;
        }
        let func = (_node) => {
            if (_node.children.length == 0) {
                return;
            }
            for (let child of _node.children) {
                child.color = color;
                func(child);
            }
        }
        func(btnNode)
    }
    
    onDestroy(){
        Message.removeEventTarget(this)
        super.onDestroy();
    }

}
