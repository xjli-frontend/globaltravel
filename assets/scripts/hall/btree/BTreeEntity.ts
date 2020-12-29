import { BTDatabase } from "../../core/behaviorTree/BTDatabase";
import { BTNode } from "../../core/behaviorTree/BTNode";
import Charactor from "../../map/charactor/Charactor";
import { BTPrioritySelector } from "../../core/behaviorTree/BTPrioritySelector";
import { BTActionIdle } from "./actions/BTActionIdle";
import SceneMap from "../../map/SceneMap";
import { BTPreConditionWalk } from "./BTConditions";
import { BTActionWalk } from "./actions/BTActionWalk";


/**
 * 行为树实体
 */
export class BTreeEntity {

    database: BTNPCDatabase = null;

    btree: BTNode = null;

    constructor() {
        this.btree = new BTPrioritySelector();

        let walkAct = new BTActionWalk(new BTPreConditionWalk());
        let idleAct = new BTActionIdle(new BTPreConditionWalk());

        this.btree.AddChild(idleAct);
        this.btree.AddChild(walkAct);
    }

    Tick() {
        if (this.btree) {
            this.btree.Activate(this.database);
            this.btree.Tick();
        }

    }
}

export enum MsgState {
    NONE = 0,
    // 打招呼状态
    GREET = 1,
    // 等待别人说玩回复
    REPLY_WAIT = 2,
    // 回复状态
    REPLY = 2
}


export class BTNPCDatabase extends BTDatabase {

    public static npcDatabases: Array<BTNPCDatabase> = [];

    npcState: {
        msg: MsgState
    } = {
            msg: MsgState.NONE
        }

    sceneMap: SceneMap = null;
    /**
     * 数据对应的NPC
     */
    npc: Charactor = null;
    // 行走目标地
    walkTarget: cc.Vec2 = null;

    /** 隔得很近的npc */
    nearestNpcDatabase: BTNPCDatabase = null;

    /**
     * 休息时刻
     */
    idleTime: number = 0;

    /**
     * npc交互，receiveId表示收到的消息id，sendId表示发给对应的npcid
     */
    npcMsg: { receiveId: number, sendId: number } = { receiveId: 0, sendId: 0 };
}