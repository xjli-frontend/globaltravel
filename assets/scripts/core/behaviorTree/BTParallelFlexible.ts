import { BTNode, BTResult } from "./BTNode";
import { BTPrecondition } from "./BTPrecondition";
/// BTParallelFlexible evaluates all children, if all children fails evaluation, it fails. 
/// Any child passes the evaluation will be regarded as active.
/// 
/// BTParallelFlexible ticks all active children, if all children ends, it ends.
/// 
/// NOTE: Order of child node added does matter!


export class BTParallelFlexible extends BTNode {

    private _activeList: Array<boolean> = [];

    constructor(precondition?: BTPrecondition) {
        super(precondition);
        this._children = [];
    }

    protected DoEvaluate(): boolean {
        let numActiveChildren = 0;
        for (let i = 0; i < this._children.length; i++) {
            let child = this._children[i];
            if (child.Evaluate()) {
                this._activeList[i] = true;
                numActiveChildren++;
            } else {
                this._activeList[i] = false;
            }
        }
        if (numActiveChildren == 0) {
            return false;
        }
        return true;
    }
    Tick(): BTResult {
        let numRunningChildren = 0;
        for (let i = 0; i < this._children.length; i++) {
            let active = this._activeList[i];
            if (active) {
                let result = this._children[i].Tick();
                if (result == BTResult.Running) {
                    numRunningChildren++;
                }
            }
        }
        if (numRunningChildren == 0) {
            return BTResult.Ended;
        }
        return BTResult.Running;
    }
    public AddChild(aNode: BTNode) {
        super.AddChild(aNode);
        this._activeList.push(false);
    }

    public RemoveChild(aNode: BTNode) {
        let index = this._children.indexOf(aNode);
        if (index >= 0) {
            this._activeList.splice(index, 1);
        }
        super.RemoveChild(aNode);
    }

    public Clear() {
        super.Clear();
        for (let child of this._children) {
            child.Clear();
        }
    }


}