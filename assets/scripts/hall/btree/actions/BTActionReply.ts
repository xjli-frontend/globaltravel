import { BTAction } from "../../../core/behaviorTree/BTAction";
import { BTNPCDatabase, MsgState } from "../BTreeEntity";
import { BTResult } from "../../../core/behaviorTree/BTNode";


/**
 * npc 回复交谈
 */
export class BTActionReply extends BTAction {
    public getDatabase() {
        return this.database as BTNPCDatabase;
    }
    protected Enter() {
        cc.log("开始回复");
    }
    protected Exit() {
        cc.log("结束回复");

    }

    protected Execute(): BTResult {
        if (this.getDatabase().npcMsg.receiveId == 0 || this.getDatabase().npcState.msg != MsgState.REPLY) {
            return BTResult.Ended;
        }
        setTimeout(() => {
            this.getDatabase().npcMsg.receiveId = 0;
            this.getDatabase().npcState.msg = MsgState.NONE;
        }, 1111)
        return BTResult.Running;
    }
}