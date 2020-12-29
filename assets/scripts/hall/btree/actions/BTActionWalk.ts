import { BTAction } from "../../../core/behaviorTree/BTAction";
import { BTNPCDatabase } from "../BTreeEntity";
import { BTResult } from "../../../core/behaviorTree/BTNode";


/**
 * npc 行走
 */
export class BTActionWalk extends BTAction {

    public getDatabase() {
        return this.database as BTNPCDatabase;
    }
    protected Enter() {
        cc.log("开始 walk");
    }
    protected Exit() {
        cc.log("结束 walk");

    }
    protected Execute(): BTResult {
        return BTResult.Running;
    }
}