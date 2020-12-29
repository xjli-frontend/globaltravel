import { BTPrecondition } from "../../core/behaviorTree/BTPrecondition";
import { BTNPCDatabase, MsgState } from "./BTreeEntity";
import Charactor from "../../map/charactor/Charactor";



/**
 * 是否有收到其他NPC的消息
 */
export class BTConditionReceiveMsg extends BTPrecondition {

    public getDatabase() {
        return this.database as BTNPCDatabase;
    }

    public Check(): boolean {
        let receiveId = this.getDatabase().npcMsg.receiveId;
        let state = this.getDatabase().npcState.msg;
        return state == MsgState.REPLY && receiveId > 0;
    }
}

/**
 * 是否看到其他NPC
 * npc相距200像素以内则认为互相可见
 */
export class BTConditionLookAround extends BTPrecondition {
    public getDatabase() {
        return this.database as BTNPCDatabase;
    }

    public Check(): boolean {
        if (this.getDatabase().npcState.msg != MsgState.NONE) {
            return false;
        }
        this.getDatabase().nearestNpcDatabase = null;
        let nearestNpcDatabase: BTNPCDatabase = null;
        let nearestDis = 9999999;
        let npcs = BTNPCDatabase.npcDatabases;
        let self = this.getDatabase().npc;
        for (let i = 0; i < npcs.length; i++) {
            if (npcs[i].npc.uuid == self.uuid) {
                continue;
            }
            if (npcs[i].npcState.msg == MsgState.NONE) {
                let dx = npcs[i].npc.node.x - self.node.x;
                let dy = npcs[i].npc.node.y - self.node.y;
                let dis = dx * dx + dy * dy
                if (dis < 200) {
                    if (dis < nearestDis) {
                        nearestDis = dis;
                        nearestNpcDatabase = npcs[i];
                    }
                }
            }
        }
        if (nearestNpcDatabase) {
            this.getDatabase().nearestNpcDatabase = nearestNpcDatabase;
            return true;
        }
        return false;
    }
}

/**
 * idle休息时间是否已经结束
 */
export class BTConditionIDLE extends BTPrecondition {
    public getDatabase() {
        return this.database as BTNPCDatabase;
    }

    public Check(): boolean {
        let idleTime = this.getDatabase().idleTime;
        do {
            if (idleTime == 0) {
                idleTime = Date.now() + Math.random() * 3000;
                break;
            }
            if (idleTime <= Date.now()) {
                if (Math.random() < 0.22) {
                    idleTime = Date.now() + 1000 + Math.random() * 3000;
                    break;
                } else {


                }
            }

        } while (false);
        this.getDatabase().idleTime = idleTime;
        return idleTime > Date.now()
    }
}

/**
 * npc是否到达目的地
 */
export class BTPreConditionWalk extends BTPrecondition {
    public getDatabase() {
        return this.database as BTNPCDatabase;
    }

    public Check(): boolean {
        let database = this.getDatabase();
        if (database.walkTarget) {
            database.sceneMap.movePlayer(database.npc, database.walkTarget.x, database.walkTarget.y);
            database.walkTarget = null;
            return true;
        } else {
            if (database.npc.moving) {
                return true;
            }
        }
        return false;
    }
}
