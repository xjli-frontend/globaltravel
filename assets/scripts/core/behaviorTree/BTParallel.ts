import { BTNode, BTResult } from "./BTNode";
import { BTPrecondition } from "./BTPrecondition";
/// BTParallel evaluates all children, if any of them fails the evaluation, BTParallel fails.
/// 
/// BTParallel ticks all children, if 
/// 	1. ParallelFunction.And: 	ends when all children ends
/// 	2. ParallelFunction.Or: 	ends when any of the children ends
/// 
/// NOTE: Order of child node added does matter!

export enum BTParallelFunction {
    And = 1,	// returns Ended when all results are not running
    Or = 2,		// returns Ended when any result is not running
}
export class BTParallel extends BTNode {

    protected _func: BTParallelFunction = BTParallelFunction.Or;
    protected _results: Array<BTResult> = [];
    constructor(func: BTParallelFunction, precondition?: BTPrecondition) {
        super(precondition);
        this._func = func;
        this._children = [];
    }
    protected DoEvaluate(): boolean {
        if (this._children) {
            for (let child of this._children) {
                if (!child.Evaluate()) {
                    return false
                }
            }
        }
        return true;
    }

    public Tick(): BTResult {
        let endingResultCount = 0;
        for (let i = 0; i < this._children.length; i++) {
            if (this._func == BTParallelFunction.And) {
                if (this._results[i] == BTResult.Running) {
                    this._results[i] = this._children[i].Tick();
                }
                if (this._results[i] != BTResult.Running) {
                    endingResultCount++;
                }
            }
            else {
                if (this._results[i] == BTResult.Running) {
                    this._results[i] = this._children[i].Tick();
                }
                if (this._results[i] != BTResult.Running) {
                    this.ResetResults();
                    return BTResult.Ended;
                }
            }
        }
        if (endingResultCount == this._children.length) {
            this.ResetResults()
            return BTResult.Ended;
        }
        return BTResult.Running;
    }

    Clear() {
        this.ResetResults();
        for (let child of this._children) {
            child.Clear();
        }
    }

    AddChild(node: BTNode) {
        if (!node) {
            return;
        }
        super.AddChild(node);
        this._results.push(BTResult.Running);
    }
    RemoveChild(node: BTNode) {
        let index = this._children.indexOf(node);
        if (index >= 0) {
            this._results.splice(index, 1);
        }
        super.RemoveChild(node);
    }

    private ResetResults() {
        for (let i = 0; i < this._results.length; i++) {
            this._results[i] = BTResult.Running;
        }
    }
}