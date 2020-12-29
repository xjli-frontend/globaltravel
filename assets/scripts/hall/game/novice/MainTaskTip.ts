
import { Message } from "../../../core/event/MessageManager";
import { PopViewParams } from "../../../core/gui/Defines";
import { gui } from "../../../core/gui/GUI";
import { LanguageLabel } from "../../../core/language/LanguageLabel";
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import { ViewUtils } from "../../../core/ui/ViewUtils";
import main from "../../../Main";
import { service } from "../../../service/Service";
import { MapControl } from "../effect/MapControl";
import { NPC_EVENT } from "../npc/NpcClickComponent";
import StoreComponent from "../StoreComponent";
import { MainProgress } from "./NoviceHandle";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MainTaskTip extends ComponentExtends {
    
    onLoad(){
        this.node.active = false;
        this.node.getComponent(ButtonEffect).canTouch = false; 
        this.node.on(cc.Node.EventType.TOUCH_END,this.onTouchEnd.bind(this),this);
        Message.on(NPC_EVENT.ADD_CAN_CLICK,(event,args)=>{
            this.canClickNpc = true;
        },this);
        Message.on(NPC_EVENT.REMOVE_CAN_CLICK,(event,args)=>{
            // this.removeNpcId(args);
            this.canClickNpc = false;
            this.currentNpcId = null;
        },this);
    }

    // removeNpcId(id:number){
    //     for(let i=0;i<this.canClickNpc.length;i++){
    //         if(this.canClickNpc[i] == id){
    //             this.canClickNpc.shift();
    //             return;
    //         }
    //     }
    // }

    canClickNpc:boolean = false;
    // canClickNpc:Array<number> = [];
    currentMainProgress:MainProgress = null;

    /**主线任务缓存数据修改*/
    changeMainCacheData(callback:Function) {
        let id = this.currentMianId;
        let mainProgress = main.module.vm.mainProgress;
        let _mainProgress: object = {};
        for (let key in mainProgress) {
            if (key == `progress_${id}` && mainProgress[`progress_${id}`] == 0) {
                _mainProgress[`progress_${id}`] = 1;
            } else {
                _mainProgress[key] = mainProgress[key];
            }
        }
        // main.module.vm.mainProgress = _mainProgress;
        this.currentMainProgress = _mainProgress;
        main.module.gameProtocol.writeCacheData("mainProgress", _mainProgress, (data) => {
            cc.log(`progress_${id}主线任务缓存写入成功`);
            callback && callback(data);
        })
    }

    /** 检查entry进来是否有领了主线任务奖励但新手引导未进行 */
    entryNoviceNoFinish(){
        let vm = main.module.vm;
        let mainProgress = main.module.vm.mainProgress;
        let noviceProgress = vm.noviceProgress;
        let mainNodes = main.module.gameMainControl.mainNodes;
        if(mainProgress.progress_1 == 1 && noviceProgress.novice_4 == 0  && vm.clerkList["clerk_1"]["level"]==0){
            main.module.noviceHandle.noviceShopClerk(mainNodes.get("btn_shop"));
        }
        else if(mainProgress.progress_2 == 1 && noviceProgress.novice_5 == 0){
            main.module.noviceHandle.noviceCallengeTask(mainNodes.get("btn_task"));
        }
        else if(mainProgress.progress_3 == 1 && noviceProgress.novice_11 == 0){
            main.module.noviceHandle.noviceBatchUp();
        }
        else if(mainProgress.progress_4 == 1 && noviceProgress.novice_6 == 0){
            main.module.noviceHandle.noviceShopping(mainNodes.get("btn_shopping"));
        }
        else if(mainProgress.progress_6 == 1 && noviceProgress.novice_7 == 0){
            main.module.noviceHandle.noviceSellStores(mainNodes.get("btn_world"));
        }
        else if(mainProgress.progress_7 == 1 && noviceProgress.novice_9 == 0){
            main.module.noviceHandle.novicePackage(mainNodes.get("btn_package"));
        }
        else if(noviceProgress.novice_13 == 0 && noviceProgress.novice_9 == 1){
            main.module.noviceHandle.novicePublicFame();
        }
        else if(noviceProgress.novice_13 == 1 && noviceProgress.novice_9 == 1 && noviceProgress.novice_10 == 0){
            main.module.noviceHandle.noviceFameUp(mainNodes.get("btn_shop"));
        }
    }

    currentMianId:number = 0;
    novice_3:number = -1;
    refreshMainProgressInfo(){
        let storeHandler = main.module.mainScene.storesNode.getChildByName("store_1").getComponent(StoreComponent).mainNodes.get("handler");
        let vm = main.module.vm;
        let noviceProgress = vm.noviceProgress;
        let mainProgress = main.module.vm.mainProgress;
        if(vm.mainProgress.progress_8 == 1){
            this.node.active = false;
            storeHandler.active = false;
            return;
        }
        if(vm.level < 1){
            this.node.active = false;
            storeHandler.active = false;
            return;
        }
        if(vm.noviceProgress.novice_3 == 0){
            this.node.active = false;
            storeHandler.active = false;
        }
        if(noviceProgress.novice_3 == 1 && this.novice_3 == 0){
            this.node.getChildByName("content").opacity = 0;
            // this.node.scaleX = 0;
            main.module.noviceHandle.noviceMainTaskOpen(this.node,()=>{
                this.node.active = true;
                nodes.get("task_skeleton").getComponent(sp.Skeleton).setAnimation(0,"reward",false);
                this.node.getChildByName("content").RunAction(ezaction.fadeTo(0.5,255)).onStoped(()=>{
                    this.node.width = cc.winSize.width * 1.2; 
                    this.novice_3 = noviceProgress.novice_3;
                });
            });
        }else{
            this.node.width = cc.winSize.width * 1.2;
            this.novice_3 = noviceProgress.novice_3;
        }
        if(this.novice_3 == 1){
            this.node.active = true;
        }
        if(mainProgress.progress_1 == 1){
            storeHandler.active = false;
        }
        if(noviceProgress.novice_3 == 0 && noviceProgress.novice_1 == 1){
            this.node.active = false;
            storeHandler.active = true;
            return;
        }
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("handler").active = false;
        if(noviceProgress.novice_3 == 1 && mainProgress.progress_1 == 0 && vm.clerkList["clerk_1"]["level"]==0){
            this.currentMianId = 1;
            let currentNum = vm.win.num * Math.pow(10,vm.win.numE);
            let taskTag = main.module.themeConfig.getTaskConfigByTag("task_41").taskTag;
            storeHandler.active = currentNum<taskTag;
            this.setInfo(currentNum,taskTag);
        }else if(mainProgress.progress_1 == 1 && mainProgress.progress_2 == 0){
            this.currentMianId = 2;
            let level = vm.storeList["store_1"]["level"];
            if(this.progressVal!=1){
                nodes.get("handler").active = true;
            }
            this.setInfo(level,25);
        }else if(mainProgress.progress_2 == 1 && mainProgress.progress_3 == 0){
            this.currentMianId = 3;
            let level = vm.storeList["store_2"]["level"];
            let lockPrice = main.module.calcUiShow.calcTargetPrice(`store_2`, 0, 1);
            if(main.module.calcTool.compare(vm.credit,lockPrice) && this.progressVal!=1 && !this.isLock){
                nodes.get("handler").active = true;
            }
            this.setInfo(level,1);
        }else if(mainProgress.progress_3 == 1 && mainProgress.progress_4 == 0){
            this.currentMianId = 4;
            let level = vm.storeList["store_3"]["level"];
            let lockPrice = main.module.calcUiShow.calcTargetPrice(`store_3`, 0, 1);
            if(main.module.calcTool.compare(vm.credit,lockPrice) && this.progressVal!=1 && !this.isLock){
                nodes.get("handler").active = true;
            }
            this.setInfo(level,1);
        }else if(mainProgress.progress_4 == 1 && mainProgress.progress_5 == 0){
            this.currentMianId = 5;
            let taskTag = main.module.themeConfig.getTaskConfigByTag("task_45").taskTag;
            let npcNum = vm.npcNum;
            if(this.canClickNpc && this.progressVal!=1 && !this.isLock){
                nodes.get("handler").active = true;
            }
            this.setInfo(npcNum,taskTag);
        }else if(mainProgress.progress_5 == 1 && mainProgress.progress_6 == 0){
            this.currentMianId = 6;
            let level = vm.storeList["store_4"]["level"];
            let lockPrice = main.module.calcUiShow.calcTargetPrice(`store_4`, 0, 1);
            if(main.module.calcTool.compare(vm.credit,lockPrice) && this.progressVal!=1 && !this.isLock){
                nodes.get("handler").active = true;
            }
            this.setInfo(level,1);
        }else if(mainProgress.progress_6 == 1 && mainProgress.progress_7 == 0){
            this.currentMianId = 7;
            let taskTag = main.module.themeConfig.getTaskConfigByTag("task_47").taskTag;
            let clerkNum = this.checkLockClerkNum();
            if( !!main.module.gameMainControl.mainNodes.get("red_point_clerk").active && this.progressVal!=1 && !this.isLock){
                nodes.get("handler").active = true;
            }
            this.setInfo(clerkNum,taskTag);
        }else if(mainProgress.progress_7 == 1 && mainProgress.progress_8 == 0){
            this.currentMianId = 8;
            let sellNum = vm.sellNum
            this.setInfo(sellNum-1<0?0:sellNum-1,1);
        }
        if(this.preMianId != this.currentMianId && this.preMianId != -1){//任务切换
            nodes.get("content").x = -cc.winSize.width*1.2;
            nodes.get("content").RunAction(ezaction.moveTo(5/30,{x:0,delay:5/30},)).onStoped(()=>{
                if(this.currentMianId == 5){
                    if(main.module.vm.noviceProgress.novice_12 == 0 ){
                        this.isLockPop = true;
                        main.module.noviceHandle.noviceNpcClick(()=>{ this.isLockPop = false });
                    }
                }
            })
            nodes.get("task_skeleton").getComponent(sp.Skeleton).setAnimation(0,"reward_2",false);
        }
        this.preMianId = this.currentMianId;
        
    }

    preMianId:number = -1;

    progressVal:number = -1;
    progressId:number = -1;

    setInfo(currNum:number,target:number){
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        let taskOffSke = nodes.get("task_off").getComponent(sp.Skeleton);
        let taskOnSke = nodes.get("task_on").getComponent(sp.Skeleton);
        let checkSke = nodes.get("check").getComponent(sp.Skeleton);
        currNum = currNum>target?target:currNum
        let num = currNum/target;
        if(this.progressVal == num && this.progressId == this.currentMianId){
            return;
        }
        this.setProgress(currNum,target);
        if(num>=1){
            this.node.getComponent(ButtonEffect).canTouch = true; 
            checkSke.node.active = true;
            if(this.progressVal<1){
                taskOnSke.setCompleteListener((func)=>{
                    if(func.animation.name == "reward"){
                        taskOnSke.setAnimation(0,"reward_idle_2",true);
                        nodes.get("tip_lab").getComponent(LanguageLabel).dataID = `ui_ad_6`;
                    }
                })
                checkSke.setCompleteListener((func)=>{
                    if(func.animation.name == "reward_fadein"){
                        checkSke.setAnimation(0,"reward_loop",true);
                    }
                })
                nodes.get("panel1").active = false;
                nodes.get("panel2").active = true;
                nodes.get("tip_lab").active = false;
                taskOnSke.setAnimation(0,"reward",false);
                checkSke.setAnimation(0,"reward_fadein",false);
                nodes.get("task_skeleton").getComponent(sp.Skeleton).setAnimation(0,"reward",false);
            }else{
                nodes.get("panel1").active = false;
                nodes.get("panel2").active = true;
                taskOnSke.setAnimation(0,"reward_idle_2",true);
                nodes.get("tip_lab").active = false;
                nodes.get("tip_lab").getComponent(LanguageLabel).dataID = `ui_ad_6`;
            }
        }else{
            nodes.get("panel1").active = true;
            this.node.getComponent(ButtonEffect).canTouch = false; 
            nodes.get("tip_lab").active = true;
            nodes.get("tip_lab").getComponent(LanguageLabel).dataID = `thread_${this.currentMianId}`;
            taskOffSke.setAnimation(0,"reward_idle_1",true);
            nodes.get("panel2").active = false;
            checkSke.node.active = false;
        }
        let spf = cc.loader.getRes(`main/no_pack/texture/main_task/main${this.currentMianId}`,cc.SpriteFrame);
        nodes.get("main_spr1").getComponent(cc.Sprite).spriteFrame = spf;
        nodes.get("main_spr2").getComponent(cc.Sprite).spriteFrame = spf;
        // nodes.get("main_spr1").scale = nodes.get("main_spr2").scale = this.currentMianId == 5? 0.8:1;
        this.progressVal = num;
        this.progressId = this.currentMianId;
    }

    isLockPop:boolean = false;
    isProgress:boolean = false;
    onTouchEnd(){
        let mapControl = main.module.mainScene.mapControl;
        if (mapControl.isMoving) {
            if (this.node._touchListener) {
                this.node._touchListener.setSwallowTouches(false);
            }
            return;
        }
        let popViewParams: PopViewParams = {
            modal: true,
            opacity: 126,
            touchClose: true,
            onRemoved:()=>{
                this.isLockPop = false;
            }
        }
        let mainProgress = main.module.vm.mainProgress;
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        if((!!nodes.get("handler").active || this.canClickNpc ) && !this.isLockPop){
            if(this.currentMianId == 3 || this.currentMianId == 4 || this.currentMianId == 6){
                this.isLockPop = true;
                let storeId = 1;
                switch (this.currentMianId) {
                    case 3:
                        storeId = 2
                        break;
                    case 4:
                        storeId = 3
                        break; 
                    case 6:
                        storeId = 4
                        break;
                }
                this.setStorePosByMap(storeId);
                let lockPrice = main.module.calcUiShow.calcTargetPrice(`store_${storeId}`, 0, 1);
                let storeComp = main.module.mainScene.storesNode.getChildByName(`store_${storeId}`).getComponent(StoreComponent);
                gui.popup.add(`main/store_unlock`, {
                    storeId: storeId, callback: () => {
                        storeComp.upLvHandler(1, lockPrice, true, () => {
                            this.isLockPop = false;
                        });
                    }, price: lockPrice, active: 0
                }, popViewParams)
            }
            else if(this.currentMianId == 5){
                this.setNpcByMap(3);
                if(main.module.vm.noviceProgress.novice_12 == 1 ){
                    this.isLockPop = true;
                    main.module.noviceHandle.noviceNpcClick(()=>{ this.isLockPop = false });
                }
            }
        }
        if(this.currentMianId == 1  && this.progressVal!=1){
            main.module.gameMainControl.openStoreOperation(1);
        }
        if(this.currentMianId == 7 && this.progressVal!=1){
            main.module.gameMainControl.openMainPop("btn_shop");
        }
        if(mainProgress.progress_1 == 1 && mainProgress.progress_2 == 0 && this.progressVal!=1){
            main.module.gameMainControl.openStoreOperation(1);
        }
         
        if(!this.node.getComponent(ButtonEffect).canTouch){
            return;
        }
        if(this.isLock){
            return;
        }
        this.node.getComponent(ButtonEffect).canTouch = false;
        let mainNodes = main.module.gameMainControl.mainNodes;
        let hideContent=()=>{
            nodes.get("content").RunAction(ezaction.moveTo(5/30,{x:cc.winSize.width*1.2})).onStoped(()=>{
            })
        }
        if(this.currentMianId == 1 && mainProgress.progress_1 == 0){
            hideContent();
            this.changeMainCacheData((data)=>{
                main.module.gameMainControl.playCreditEffect({num:2,numE:2},()=>{
                    main.module.calcUiShow.refreshCredit({num:2,numE:2},()=>{
                        main.module.noviceHandle.noviceShopClerk(mainNodes.get("btn_shop"),()=>{
                            this.syncMainProgress();
                        });
                    },true)
                })
            })
        }else if(this.currentMianId == 2 && mainProgress.progress_2 == 0){
            hideContent();
            this.changeMainCacheData((data)=>{
                main.module.gameMainControl.playCreditEffect({num:1,numE:3},()=>{
                    main.module.calcUiShow.refreshCredit({num:1,numE:3},()=>{
                        main.module.noviceHandle.noviceCallengeTask(mainNodes.get("btn_task"),()=>{
                            this.syncMainProgress();
                        });
                    },true)
                })
            })
        }else if(this.currentMianId == 3 && mainProgress.progress_3 == 0){
            hideContent();
            this.changeMainCacheData((data)=>{
                this.syncMainProgress(0);
                main.module.gameMainControl.playCreditEffect({num:1,numE:4},()=>{
                    main.module.calcUiShow.refreshCredit({num:1,numE:4},()=>{
                        main.module.noviceHandle.noviceBatchUp(()=>{
                        });
                    },true)
                })
            })
        }else if(this.currentMianId == 4 && mainProgress.progress_4 == 0){
            hideContent();
            service.prompt.netInstableOpen();
            this.changeMainCacheData((data)=>{
                main.module.gameProtocol.requestDayTaskReward(30,(data)=>{
                    service.prompt.netInstableClose();
                    if(data != 302){
                        main.module.gameMainControl.playAdDiamondEffect(()=>{
                            main.module.vm.diamond = data["userAccount"]["credit"];
                            main.module.noviceHandle.noviceShopping(mainNodes.get("btn_shopping"),()=>{
                                this.syncMainProgress();
                            });
                        });
                    }
                })
            })
        }else if(this.currentMianId == 5 && mainProgress.progress_5 == 0){
            hideContent();
            this.changeMainCacheData((data)=>{
                main.module.gameMainControl.playCreditEffect({num:1,numE:5},()=>{
                    main.module.calcUiShow.refreshCredit({num:1,numE:5},()=>{
                        this.syncMainProgress();
                    },true)
                })
            })
        }else if(this.currentMianId == 6 && mainProgress.progress_6 == 0){
            hideContent();
            this.changeMainCacheData((data)=>{
                main.module.gameMainControl.playCreditEffect({num:1,numE:6},()=>{
                    main.module.calcUiShow.refreshCredit({num:1,numE:6},()=>{
                        main.module.noviceHandle.noviceSellStores(mainNodes.get("btn_world"),()=>{
                            this.syncMainProgress();
                        });
                    },true)
                })
            })
        }else if(this.currentMianId == 7 && mainProgress.progress_7 == 0){
            hideContent();
            service.prompt.netInstableOpen();
            this.changeMainCacheData((data)=>{
                main.module.gameProtocol.requestDayTaskReward(47,(data)=>{
                    service.prompt.netInstableClose();
                    if(data != 302){
                        main.module.gameMainControl.playPackageffect(()=>{
                            main.module.noviceHandle.novicePackage(mainNodes.get("btn_package"),()=>{
                                this.syncMainProgress();
                            });
                        });
                    }
                })
            })
        }else if(this.currentMianId == 8 && mainProgress.progress_8 == 0){
            hideContent();
            service.prompt.netInstableOpen();
            this.changeMainCacheData((data)=>{
                this.syncMainProgress();
                main.module.gameProtocol.requestDayTaskReward(48,(data)=>{
                    service.prompt.netInstableClose();
                    if(data != 302){
                        main.module.gameMainControl.playAdDiamondEffect(()=>{
                            main.module.vm.diamond = data["userAccount"]["credit"];
                            main.module.noviceHandle.noviceEnd(()=>{
                            });
                        })
                    }
                })
            })
        }
    }

    syncMainProgress(delay:number=1){
        this.scheduleOnce(()=>{
            main.module.vm.mainProgress = this.currentMainProgress;
        },delay)
    }

    /** 定位到storeId店铺位置 */
    setStorePosByMap(storeId:number){
        let mapControl = main.module.mainScene.node.getChildByName("content").getComponent(MapControl);
        let storeNode:cc.Node = main.module.mainScene.storesNode.getChildByName(`store_${storeId}`);
        let worldPos = storeNode.parent.convertToWorldSpaceAR(storeNode.getPosition());
        let deviationX = (worldPos.x-cc.winSize.width/2);
        let deviationY = (worldPos.y-cc.winSize.height/2);
        let targetX = mapControl.node.x - deviationX;
        let targetY = mapControl.node.y - deviationY;
        const store_width = cc.winSize.width;
        const store_height = cc.winSize.height;
        if(targetX>mapControl.node.width/2*mapControl.node.scaleX-store_width/2){
            targetX = mapControl.node.width/2*mapControl.node.scaleX-store_width/2;
        }else if(targetX<-mapControl.node.width/2*mapControl.node.scaleX+store_width/2){
            targetX = -mapControl.node.width/2*mapControl.node.scaleX+store_width/2;
        }else if(targetY>mapControl.node.height/2*mapControl.node.scaleY-store_height/2){
            targetY = mapControl.node.height/2*mapControl.node.scaleY-store_height/2;
        }else if(targetY<-mapControl.node.height/2*mapControl.node.scaleY+store_height/2){
            targetY = -mapControl.node.height/2*mapControl.node.scaleY+store_height/2;
        }
        mapControl.node.RunAction(ezaction.moveTo(0.2,{x:targetX,y:targetY}));
    }

    currentNpcId:number = null;
    /** 定位到storeId店铺位置 */
    setNpcByMap(npcId:number){
        if(!npcId){
            return;
        }
        let mapControl = main.module.mainScene.node.getChildByName("content").getComponent(MapControl);
        let npc_3 = main.module.mainScene.storesNode.getChildByName(`npc_${npcId}`);
        mapControl.followTargetPos(npc_3,0.2);
        this.currentNpcId = npcId;
    }

    update(){
       
    }

    setProgress(currNum:number,target:number){
        let val = currNum/target;
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        nodes.get("tip_progress_bar").width = 96 * (val>1?1:val);
        nodes.get("tip_progress_lab").getComponent(cc.Label).string = `${currNum}/${target}`;
    }

    isLock:boolean = false;
    lockMainTaskTip(isLock:boolean=false){
        this.isLock = isLock;
        this.showButtonEffect(this.node,isLock);
    }

    checkLockClerkNum(){
        let clerkList = main.module.vm.clerkList;
        let levelNum = 0;
        for(let key in clerkList){
            if(clerkList[key]["level"]>0){
                levelNum+=clerkList[key]["level"];
            }
        }
        return levelNum;
    }

    showButtonEffect(btnNode:cc.Node,state:boolean){
        let color = state ? cc.Color.GRAY:cc.Color.WHITE;
        btnNode.color = color;
        let func = (_node)=>{
            if(_node.children.length == 0){
                return;
            }
            for (let child of _node.children){
                if(child.name  == "tip_lab"){
                    // color = new cc.Color(1,56,121);
                     color = new cc.Color(0,0,0);
                }
                if(child.name  == "handler"){
                    child.opacity = state?0:255;
                    continue;
                }
                if(child.name  == "bg"){
                    child.opacity = state?75:150;
                    continue;
                }
                child.color = color;
                func(child);
            }
            
        }
        func(btnNode)
    }

    onDestroy(){
        Message.removeEventTarget(this);
        this.currentMianId = null;
        this.novice_3 = null;
        this.isLock = null;
        this.canClickNpc = null;
        super.onDestroy();
    }

}
