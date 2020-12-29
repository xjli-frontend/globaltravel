
import engine from "../../core/Engine";
import { Message } from "../../core/event/MessageManager";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import ButtonSimple from "../../core/ui/button/ButtonSimple";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { AsyncQueue } from "../../core/util/AsyncQueue";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { AccountEvent } from "../../service/account/Account";
import Config from "../../service/config/Config";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import { formatParams } from "../CalcTool";
import { npcConfig } from "../GameData";
import { MapNpcController } from "../MapNpcController";
import LandmarkComonent from "./adv/LandmarkComonent";
import { MapControl } from "./effect/MapControl";
import GameMainControl from "./GameMainControl";
import { MainProgress, NoviceProgress } from "./novice/NoviceHandle";
import StoreComponent from "./StoreComponent";

const { ccclass, property } = cc._decorator;
@ccclass
export default class MainScene extends ComponentExtends {

    @property({
        type: cc.Prefab,
        tooltip: "主控制"
    })
    main_control: cc.Prefab = null;

    @property({
        type: cc.Node,
        tooltip: "所有商店的父节点"
    })
    storesNode: cc.Node = null;

    gameMainControl: GameMainControl = null;
    mapNpcController: MapNpcController = null;
    mapControl: MapControl = null;
    nodes: HashMap<string, cc.Node> = null;
    onLoad() {
        main.module.vm.watch("lang", (newlang, oldlang) => {
            service.analytics.logEvent("set_click_language", "language", newlang);

            // 语言改变 先下载对应语言的资源文件，然后变更语言
            if (oldlang === null) {
                return;
            }
            // 删除语言弹框 
            service.prompt.netInstableOpen();
            engine.i18n.setLanguage(newlang, (success: boolean) => {
                service.prompt.netInstableClose();
                if (success) {
                    // 释放之前的语言包内存
                    if (oldlang != newlang && oldlang != "zh") {
                        engine.i18n.releaseLanguageAssets(oldlang);
                    }
                }
            })
        }, this)
        this.mapNpcController = this.node.getComponent(MapNpcController);
        main.module.mapNpcController = this.mapNpcController;
        Message.on(AccountEvent.LOGINED, this.messageHandler, this);
        this.initMainControl();
        this.loadStoreList();
        Message.dispatchEvent(AudioMessage.BGM);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        main.module.mainScene = this;
        this.mapControl = this.node.getChildByName("content").getComponent(MapControl);

        engine.log.info(`mainScene的onload`);
    }

    currentPop: string = "";
    onTouchHandler(event: cc.Event.EventTouch) {
        if (event.target.getComponent(ButtonEffect) || event.target.getComponent(ButtonSimple)) {
            return;
        }
        if (this.gameMainControl.storeOperation) {
            this.gameMainControl.storeOperation.currentViewStoreId = -1;
        }
    }

    initMainControl() {
        let controlNode = cc.instantiate(this.main_control);
        this.gameMainControl = controlNode.getComponent(GameMainControl);
        controlNode.getChildByName("click_mask").active = true;
        controlNode.getChildByName("main").getComponent(cc.Widget).target = this.node;
        controlNode.getChildByName("main").getComponent(cc.Widget).top = 0;
        controlNode.getChildByName("main").getComponent(cc.Widget).bottom = 0;
        this.scheduleOnce(() => {
            controlNode.getChildByName("main").getComponent(cc.Widget).updateAlignment();
        })
        main.module.gameMainControl = this.gameMainControl;
        let nodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.gameMainControl.landMarkCom = nodes.get("adv_colid").getComponent(LandmarkComonent);
        controlNode.parent = this.node;
        this.nodes = nodes;
    }
    parseStoreJson() {
        let storePos: HashMap<string, { x: number, y: number, gateposX: number, gateposY: number }> = new HashMap<string, { x: number, y: number, gateposX: number, gateposY: number }>();
        let storepos1 = cc.loader.getRes("main/json/storepos", cc.JsonAsset).json;
        for (let k in storepos1) {
            let item = storepos1[k];
            let poss = item.pos.split(",");
            let gateposs = item.gatepos.split(",");
            let info = {
                x: parseInt(poss[0].replace(/[^\d]/, "")),
                y: parseInt(poss[1].replace(/[^\d]/, "")),
                gateposX: parseInt(gateposs[0].replace(/[^\d]/, "")),
                gateposY: parseInt(gateposs[1].replace(/[^\d]/, "")),
            }
            storePos.set(k, info);
        }
        return storePos;
    }

    /** isClose=false关闭云层 isClose=true打开云层*/
    playCloudAnim(isClose: boolean, callback?: Function) {
        let cloudSkeleton = this.gameMainControl.mainNodes.get("cloud").getComponent(sp.Skeleton);
        cloudSkeleton.node.active = true;
        if (isClose) {
            cloudSkeleton.setAnimation(0, "reward_loop", true);
        } else {
            callback && callback();
            cloudSkeleton.setCompleteListener((func) => {
                if (func.animation.name == "reward_die") {
                    cloudSkeleton.node.active = false;
                }
            })
            cloudSkeleton.setAnimation(0, "reward_die", false);
        }
    }

    /** 初始化店铺 */
    refreshStores(level) {
        let module = main.module;
        let storePosHash = this.parseStoreJson();
        let config = main.module.themeConfig.getBuildingConfigById(level);
        let lockNum = config.count;
        for (let key in module.vm.storeList) {
            let info = module.vm.storeList[key];
            let id = module.vm.storeList[key]["id"];
            let prefab = cc.loader.getRes(`main/store`)
            if (!this.storesNode.getChildByName(key)) {
                let storeNode: cc.Node = cc.instantiate(prefab);
                let storepos = storePosHash.get(id + "");
                storeNode.name = key;
                storeNode.parent = this.storesNode;
                storeNode.position = cc.v3(storepos.x, storepos.y);
                // storeNode.zIndex = 11-id;
                storeNode.zIndex = 9999 - storeNode.y;
                let storeCom = storeNode.getComponent(StoreComponent);
                storeCom.loadStore(key, info, true);
                if (id > lockNum) {
                    storeNode.active = false;
                }
            } else {
                if (id <= lockNum) {
                    this.storesNode.getChildByName(key).active = true;
                }
            }

        }
    }

    /** 加载场景的店铺列表 */
    loadStoreList() {
        engine.log.info(`loadStoreList`);
        let module = main.module;
        let logoNode = this.gameMainControl.mainNodes.get("logo");
        logoNode.active = true;
        this.playCloudAnim(true);
        let noviceCallback = () => {
            engine.log.info(`执行noviceCallback`);
            this.exchangeScene(module.vm.level, () => {//module.vm.cityId
                engine.log.info(`加载场景完成初始化initUserView`);
                this.gameMainControl.initUserView();
                this.reloadStoresReward(() => {
                    this.gameMainControl.node.getChildByName("click_mask").active = false;
                });
            })
        }
        let nextCall = AsyncQueue.excuteTimes(12, () => {
            this.refreshStores(module.vm.level);
            engine.log.info(`11条协议请求数据完成`);
            if (module.vm.noviceProgress.novice_start == 0) {
                module.noviceHandle.handleStart(noviceCallback);
            } else {
                noviceCallback && noviceCallback();
            }
            logoNode.RunAction(ezaction.fadeTo(0.2, 0)).onStoped(() => {
                logoNode.destroy();
            });
        })
        //1
        module.gameProtocol.requestStoreList((data) => {
            module.vm.storeList = data["storeList"];
            nextCall();
        })

        //2
        module.gameProtocol.requestClerkList((data) => {
            module.vm.clerkList = data["clerkList"];
            nextCall();
        })
        //3
        module.gameProtocol.requestFameList((data) => {
            module.vm.fameList = data["fameList"];
            module.gameMainControl.preFameList = data["fameList"];
            nextCall();
        })
        //4
        module.gameProtocol.requestGoodsInfo((data) => {
            module.vm.goodsInfo = data["goodsData"];
            nextCall();
        })
        //5
        module.gameProtocol.requestPropList((data) => {
            main.module.vm.propList = data["propList"];
            nextCall();
        })

        //6
        module.gameProtocol.requestNpcConfig((data) => {
            let npcConfig = data["npcConfig"];
            for (let key in npcConfig) {
                let config: npcConfig = {
                    id: npcConfig[key]["id"],
                    timeSpan: npcConfig[key]["timeSpan"],
                    rewardData: npcConfig[key]["data"]
                }
                module.gamedata.npcConfig.set(key, config);
            }
            nextCall();
        })

        //7
        main.module.gameProtocol.requestCacheData("novice", (data) => {
            if (data["novice"]) {
                module.vm.noviceProgress = data["novice"];
            } else {
                module.vm.noviceProgress = new NoviceProgress();
            }
            // module.vm.noviceProgress.novice_9 = 0;
            // module.vm.noviceProgress.novice_13 = 0;
            nextCall();
        })

        //8
        main.module.gameProtocol.requestCacheData("mainProgress", (data) => {
            if (data["mainProgress"]) {
                module.vm.mainProgress = data["mainProgress"];
            } else {
                module.vm.mainProgress = new MainProgress();
            }
            nextCall();
        })

        //9
        main.module.gameProtocol.requestCacheData("sellNum", (data) => {
            if (data["sellNum"]) {
                module.vm.sellNum = data["sellNum"];
            } else {
                module.vm.sellNum = 0;
            }
            nextCall();
        })

        //10
        main.module.gameProtocol.requestCacheData("mainMutiEndTime", (data) => {
            if (data["mainMutiEndTime"]) {
                module.gamedata.mainMutiEndTime = data["mainMutiEndTime"];
            } else {
                module.gamedata.mainMutiEndTime = 0;
            }
            nextCall();
        })

        //11
        main.module.gameProtocol.requestCacheData("npcNum", (data) => {
            if (data["npcNum"]) {
                module.vm.npcNum = data["npcNum"];
            } else {
                module.vm.npcNum = 0;
            }
            nextCall();
        })

        //12
        main.module.gameProtocol.requestCacheData("getFameTime", (data) => {
            if (data["getFameTime"]) {
                module.gamedata.getFameTime = data["getFameTime"];
            } else {
                module.gamedata.getFameTime = main.module.calcUiShow.getSeverCurrentTime() + 3 * 60 * 60 * 1000;
                main.module.gameProtocol.writeCacheData("getFameTime", module.gamedata.getFameTime as Object, (data) => {

                })
            }
            nextCall();
        });

        main.module.gameProtocol.requestCacheData("fameNpcNum", (data) => {
            if (data["fameNpcNum"]) {
                module.gamedata.fameNpcNum = data["fameNpcNum"];
            } else {
                module.gamedata.fameNpcNum = 0;
            }
        })

        main.module.gameProtocol.requestCacheData("isPass", (data) => {
            if (data["isPass"]) {
                module.vm.isPass = data["isPass"];
            } else {
                module.vm.isPass = 0;
            }
        })

        main.module.gameProtocol.requestNpcData((data) => {
            module.gamedata.npcData = data["npcData"];;
        })

        main.module.gameProtocol.requestAdvCount((data) => {
            module.vm.advCount = data["taskData"]["count"];
        })
    }

    /** 离线收益计算 并重置上次返奖时间 */
    reloadStoresReward(callback?: Function) {
        let module = main.module;
        let rewardCount: formatParams = { num: 0, numE: 0 };
        let maxTimes = 7 * 24 * 60 * 60 * 1000;;
        let currentDate = main.module.calcUiShow.getSeverCurrentTime();
        let store1 = this.storesNode.getChildByName(`store_1`).getComponent(StoreComponent);
        let spanTime = 0;
        if (store1.currentClerkLv > 0) {
            spanTime = currentDate - module.vm.storeList[`store_1`]["rewardTime"];
        }
        // cc.log(new Date().getTime(),currentDate,module.vm.storeList[`store_1`]["rewardTime"],engine.timer.serverTimeElasped())
        for (let key in module.vm.storeList) {
            let rewardTime = module.vm.storeList[key]["rewardTime"];
            let timeCount = currentDate - rewardTime;
            if (timeCount > maxTimes) {
                timeCount = maxTimes;
            }
            let store = this.storesNode.getChildByName(key).getComponent(StoreComponent);
            if (store.currentClerkLv > 0) {
                let currentTimeSpanTotal = store.currentTimeSpanTotal;
                let returnCount = Math.floor(timeCount / currentTimeSpanTotal);
                if (currentTimeSpanTotal < 100 && currentTimeSpanTotal != 0) {
                    returnCount = Math.floor(timeCount / currentTimeSpanTotal / 1000);
                }
                let reward: formatParams = module.calcTool.calcMutiNum(store.returnReward, { num: returnCount, numE: 0 })
                rewardCount = module.calcTool.calcAddNum(rewardCount, reward);
                store.preReturnRewardTime = rewardTime + returnCount * currentTimeSpanTotal;
            } else {
                store.preReturnRewardTime = rewardTime;
            }

        }
        if (rewardCount.num > 0) {
            if (spanTime < 60 * 1000) {
                main.module.calcUiShow.refreshCredit(rewardCount, () => {
                    callback && callback()
                }, true)
            } else {
                module.loadOffLineReward(rewardCount, spanTime, callback);
            }
        } else {
            callback && callback();
        }

    }

    messageHandler(event, params) {
        switch (event) {
            case AccountEvent.LOGINED: {
                main.module.entry(() => {
                    cc.log("重新entry成功")
                    this.reloadStoresReward();
                })
            }
        }
    }

    showStoresName(active: boolean = true, scale: number) {
        let storeArray = this.node.getComponent(MainScene).storesNode;
        storeArray.children.forEach((store: cc.Node) => {
            let com = store.getComponent(StoreComponent);
            if (com) {
                com.showStoreInfo(active, scale);
                // let nodes = ViewUtils.nodeTreeInfoLite(store);
                // nodes.get("store_info").scale = 1/scale;
                // nodes.get("store_info").StopAllActions();
                // nodes.get("store_info").RunAction(ezaction.fadeTo(0.1,active?255:0))
            }
        })
    }

    currentMapID = "";
    rescache: Array<cc.SpriteFrame> = [];
    exchangeScene(cityId: number, callback?: Function) {
        this.playCloudAnim(true);
        cityId = cityId > 9 ? 9 : cityId;
        let active = cityId == 9 || cityId == 6;
        let nodes = this.nodes;
        let asyncQueue = new AsyncQueue();
        asyncQueue.push((next: Function) => {
            let newMapID = `main_bg${cityId}`;
            if (this.currentMapID && newMapID != this.currentMapID) {
                let sprite = nodes.get("scene_bg").getComponent(cc.Sprite);
                cc.loader.release(sprite.spriteFrame.getTexture());
                sprite.spriteFrame = null;
            }
            for (let res of this.rescache) {
                cc.log("释放资源", res.url);
                try {
                    cc.loader.release(res.getTexture())
                    cc.loader.release(res);
                } catch (e) {
                    cc.warn(e);
                }
            }
            this.rescache = [];
            this.currentMapID = newMapID;
            cc.loader.loadRes(`scene/bg_texture/${this.currentMapID}`, cc.SpriteFrame, (error, res) => {
                if (error) {
                    next(null)
                } else {
                    this.rescache.push(res);
                    next(res);
                }
            });
        })
        asyncQueue.push((next: Function, params: any, args: any) => {
            if (args) {
                // 如果本地有图片就不再去下载了
                nodes.get("scene_bg").getComponent(cc.Sprite).spriteFrame = args;
                next();
            } else {
                let res_server = Config.game.data["qiniucdn"];
                if (!res_server) {
                    next();
                }
                let showsprite = (sptpath) => {
                    let sprite = nodes.get("scene_bg").getComponent(cc.Sprite);
                    cc.loader.load(sptpath, (err, res) => {
                        if (res) {
                            let spf = new cc.SpriteFrame(res);
                            this.rescache.push(spf);
                            sprite.spriteFrame = spf;
                        }
                        next();
                    })
                }
                let url = `${res_server}/map/main_bg${cityId}.jpg`;
                cc.log("图片url " + url);
                if (cc.sys.isBrowser) {
                    showsprite(url);
                } else {
                    let local_games_assets_patch_path = main.appRes.appresUrlHelper.local_games_assets_patch_path;
                    let storagePath = `${local_games_assets_patch_path}/main_bg${cityId}.jpg`;
                    if (jsb.fileUtils.isFileExist(storagePath)) {
                        // 本地已下载
                        showsprite(storagePath);
                        return;
                    }
                    cc.log("engine.downloader 下载 " + url);
                    engine.downloader.download(url, storagePath, 3, 1, (success: boolean) => {
                        showsprite(storagePath);
                    })
                }
            }
        })
        asyncQueue.push((next: Function) => {
            switch (cityId) {
                case 4:
                case 5:
                case 6:
                    cityId = 4;
                    break;
                case 7:
                case 8:
                case 9:
                case 10:
                    cityId = 7;
                    break;
            }
            cc.loader.loadRes(`scene/scene_bottom_${cityId}`, (error, res) => {
                nodes.get("scene_bottom").children.forEach((child) => {
                    child.destroy();
                })
                let bottomNode: cc.Node = cc.instantiate(res);
                bottomNode.parent = nodes.get("scene_bottom");
                if (bottomNode.getChildByName("xue")) {
                    bottomNode.getChildByName("xue").active = active;
                }
                next();
            });
        })
        asyncQueue.complete = () => {
            engine.log.info(`场景加载完成，云散开，执行初始化Callback`);
            this.playCloudAnim(false, callback);
            asyncQueue.clear();
        }
        asyncQueue.play();

        // let nextCall = AsyncQueue.excuteTimes(2, () => {
        //     engine.log.info(`场景加载完成，云散开，执行初始化Callback`);
        //     this.playCloudAnim(false, callback);
        // })
        // cc.loader.loadRes(`scene/bg_texture/main_bg${cityId}`, cc.SpriteFrame, (error, res) => {
        //     nodes.get("scene_bg").getComponent(cc.Sprite).spriteFrame = res;
        //     nextCall && nextCall();
        // });
        // switch (cityId) {
        //     case 4:
        //     case 5:
        //     case 6:
        //         cityId = 4;
        //         break;
        //     case 7:
        //     case 8:
        //     case 9:
        //     case 10:
        //         cityId = 7;
        //         break;
        // }
        // cc.loader.loadRes(`scene/scene_bottom_${cityId}`, (error, res) => {
        //     nodes.get("scene_bottom").children.forEach((child) => {
        //         child.destroy();
        //     })
        //     let bottomNode: cc.Node = cc.instantiate(res);
        //     bottomNode.parent = nodes.get("scene_bottom");
        //     if (bottomNode.getChildByName("xue")) {
        //         bottomNode.getChildByName("xue").active = active;
        //     }
        //     nextCall && nextCall();
        // });

    }

    update() {
        let position = this.node.getChildByName("content").position;
        // cc.log(position.x,position.y);
    }

    onDestroy() {
        for (let res of this.rescache) {
            cc.log("释放资源", res.url);
            try {
                cc.loader.release(res.getTexture())
                cc.loader.release(res);
            } catch (e) {
                cc.warn(e);
            }
        }
        this.rescache = null;
        this.nodes.clear()
        super.onDestroy()
        main.module.vm.unwatchTargetAll(this);
        this.gameMainControl = null;
        this.mapNpcController = null;
        Message.removeEventTarget(this);
        this.currentPop = null;
    }
}
