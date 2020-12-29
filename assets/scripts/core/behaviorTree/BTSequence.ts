import { BTNode, BTResult } from "./BTNode";
import { BTPrecondition } from "./BTPrecondition";

/// BTPrioritySelector selects the first sussessfully evaluated child as the active child.

export class BTSequence extends BTNode {
    private _activeChild: BTNode = null;
    private _activeIndex: number = -1;

    constructor(precondition?: BTPrecondition) {
        super(precondition);
        this._children = [];
    }

    protected DoEvaluate(): boolean {
        if (this._activeChild) {
            let result = this._activeChild.Evaluate();
            if (!result) {
                this._activeChild.Clear();
                this._activeChild = null;
                this._activeIndex = -1;
            }
            return result;
        } else {
            if (this._children.length > 0) {
                return this.children[0].Evaluate();
            }
            return false;
        }
    }
    public Tick(): BTResult {
        // first time
        if (this._activeChild == null) {
            this._activeChild = this._children[0];
            this._activeIndex = 0;
        }

        let result = this._activeChild.Tick();
        if (result == BTResult.Ended) {	// Current active node over
            this._activeIndex++;
            if (this._activeIndex >= this._children.length) {	// sequence is over
                this._activeChild.Clear();
                this._activeChild = null;
                this._activeIndex = -1;
            }
            else {	// next node
                this._activeChild.Clear();
                this._activeChild = this._children[this._activeIndex];
                result = BTResult.Running;
            }
        }
        return result;
    }

    public Clear() {
        if (this._activeChild != null) {
            this._activeChild = null;
            this._activeIndex = -1;
        }
        for (let child of this._children) {
            child.Clear();
        }
    }
}