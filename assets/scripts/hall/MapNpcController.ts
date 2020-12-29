import { HashMap } from "../core/util/HashMap";
import main from "../Main";
import Charactor, { CharactorState } from "../map/charactor/Charactor";
import SceneMap from "../map/SceneMap";
import NpcClickComponent from "./game/npc/NpcClickComponent";


type StorePosInfo = { x: number, y: number, gateposX: number, gateposY: number };
const npc_init_pos = [new cc.Vec2(3690, 2115), new cc.Vec2(3630, 2085), new cc.Vec2(2190, 1365), new cc.Vec2(2250, 1395), new cc.Vec2(2490, 2265),
new cc.Vec2(1980, 2010), new cc.Vec2(1440, 1740), new cc.Vec2(1980, 2520), new cc.Vec2(1470, 2265), new cc.Vec2(930, 1995),]

/** NPC行走速度 */
const npc_speed = [64, 48, 64, 80, 80, 48, 64, 80, 96, 48];

const { ccclass, property } = cc._decorator;

@ccclass
export class MapNpcController extends cc.Component {

    @property(SceneMap)
    sceneMap: SceneMap = null;

    @property(cc.Prefab)
    npcPrefab: cc.Prefab = null;

    npcHash: HashMap<string, Charactor> = new HashMap<string, Charactor>();

    storePos: HashMap<string, StorePosInfo> = new HashMap<string, StorePosInfo>();

    npcAIDataHash: HashMap<string, any> = new HashMap<string, any>();

    onLoad() {
        // this.sceneMap.node.on(cc.Node.EventType.TOUCH_START, this.onMapMouseDown, this);

        this.storePos = this.parseStoreJson();
        // cc.log("storePos", this.storePos)
        // this.createNpcs();
        this.schedule(this.AIHandler, 0.3)
    }

    parseStoreJson() {
        let storePos: HashMap<string, StorePosInfo> = new HashMap<string, StorePosInfo>();
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
    onDestroy() {
        this.npcHash.clear();
        this.npcAIDataHash.clear();
        this.storePos = null;
        // this.sceneMap.node.off(cc.Node.EventType.TOUCH_START, this.onMapMouseDown, this);
        this.unscheduleAllCallbacks();
    }

    AIHandler() {
        let players = this.npcHash.values();
        for (let player of players) {
            if (player.state === CharactorState.run) {
                continue;
            }
            if (player.state === CharactorState.sitdown) {
                continue;
            }
            if (!player.node) {
                return;
            }
            let aiStateInfo = this.npcAIDataHash.get(player.node.uuid);
            if (aiStateInfo.idleTime > 0) {
                if (aiStateInfo.idleTime < Date.now()) {
                    // idle时间已到，90%去下一个商店
                    if (Math.random() > 0.2) {
                        // let storeIDS = this.storePos.keys();
                        let storeIDS = main.module.gameMainControl.getUnlockStoreIds();
                        if (storeIDS.length > 0) {
                            let randomStoreIndex = Math.floor((storeIDS.length) * Math.random());
                            let storeID = storeIDS[randomStoreIndex];
                            let kA = this.storePos.get(storeID);
                            let gateId: string = storeID;
                            this.sceneMap.movePlayer(player, kA.gateposX, kA.gateposY, gateId);
                            aiStateInfo.idleTime = 0;
                            aiStateInfo.targetStoreID = storeID;
                        }
                    }
                }
            } else {
                aiStateInfo.idleTime = Date.now() + 1000 + Math.random() * 3000;
            }
        }
    }
    // public onMapMouseDown(event: cc.Event.EventTouch): void {
    //     let pos = this.sceneMap.node.convertToNodeSpaceAR(event.getLocation());
    //     this.sceneMap.movePlayer(this.npcHash.get("npc1"), pos.x, pos.y);
    // }

    currentIds: Array<string> = [];
    public createNpcs(ids: Array<string>) {
        for (let i = 0; i < 10; i++) {
            let storeID = ids[i];
            if (ids.indexOf(storeID) != -1 && this.currentIds.indexOf(storeID) == -1) {
                let npcNode: cc.Node = cc.instantiate(this.npcPrefab);
                let pos = npc_init_pos[parseInt(storeID) - 1];
                npcNode.setPosition(pos);
                // let skd = cc.loader.getRes(`animator/npc/npc_${storeID}/npc_${storeID}`,sp.SkeletonData);
                // if(!skd){
                //     skd = cc.loader.getRes(`main/npc/npc_${1}/npc_${1}`,sp.SkeletonData);
                // }
                // if(storeID == "3" || storeID == "5"){
                //     npcNode.getChildByName("skeleton").getComponent(sp.Skeleton).premultipliedAlpha = true;
                // }
                // npcNode.getChildByName("skeleton").getComponent(sp.Skeleton).skeletonData = skd;
                npcNode.getComponent(NpcClickComponent).initClickEvent(parseInt(storeID));

                this.sceneMap.node.addChild(npcNode);
                npcNode.name = `npc_${storeID}`;
                let charactor = npcNode.getComponent(Charactor);
                charactor.sceneMap = this.sceneMap;
                charactor.id = storeID;
                charactor.moveSpeed = npc_speed[parseInt(storeID) - 1] || 44;
                this.npcHash.set(npcNode.uuid, charactor);
                this.npcAIDataHash.set(npcNode.uuid, {
                    state: charactor.state,
                    idleTime: Date.now() + Math.random() * 2000,
                    targetStoreID: 0
                })
            } else if (ids.length == 0 && this.currentIds.length > 0) {
                let delId = this.currentIds[i];
                let child = this.sceneMap.node.getChildByName(`npc_${delId}`)
                if (child) {
                    this.npcHash.delete(child.uuid);
                    this.npcAIDataHash.delete(child.uuid);
                    child.destroy();
                }
            }
        }
        this.currentIds = ids;

    }
}