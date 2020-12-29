import { BTAction } from "../../../core/behaviorTree/BTAction";
import { BTResult } from "../../../core/behaviorTree/BTNode";
import { BTNPCDatabase, MsgState } from "../BTreeEntity";

/**
 * npc 打招呼动作
 */
export class BTActionGreet extends BTAction {
    public getDatabase() {
        return this.database as BTNPCDatabase;
    }
    protected Enter() {
        cc.log("开始打招呼");
    }
    protected Exit() {
        cc.log("结束打招呼");

    }
    protected Execute(): BTResult {
        let nearestNpcDatabase = this.getDatabase().nearestNpcDatabase;
        if (!nearestNpcDatabase) {
            return BTResult.Ended;
        }
        if (this.getDatabase().npcState.msg != MsgState.GREET) {
            this.getDatabase().npcState.msg = MsgState.GREET;

            nearestNpcDatabase.npcMsg.receiveId = 1101; // 
            nearestNpcDatabase.npcState.msg = MsgState.REPLY_WAIT;
            setTimeout(() => {
                this.getDatabase().npcMsg.sendId = 0;
                this.getDatabase().npcState.msg = MsgState.NONE;
                let nearestNpcDatabase = this.getDatabase().nearestNpcDatabase;
                if (nearestNpcDatabase) {
                    nearestNpcDatabase.npcMsg.receiveId = 1101; // 
                    nearestNpcDatabase.npcState.msg = MsgState.REPLY;
                    this.getDatabase().nearestNpcDatabase = null;
                }
            }, 2000)
        }
        return BTResult.Running;
    }

}