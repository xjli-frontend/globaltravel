import { BTAction } from "../../../core/behaviorTree/BTAction";
import { BTNPCDatabase } from "../BTreeEntity";
import { CharactorState } from "../../../map/charactor/Charactor";
import { BTResult } from "../../../core/behaviorTree/BTNode";


/**
 * npc 待机休息
 */
export class BTActionIdle extends BTAction {
    public getDatabase() {
        return this.database as BTNPCDatabase;
    }
    protected Enter() {
        cc.log("开始 IDLE");
        this.getDatabase().npc.state = CharactorState.stand;
    }
    protected Exit() {
        cc.log("结束 IDLE");

    }
    protected Execute(): BTResult {
        return BTResult.Running;
    }
}