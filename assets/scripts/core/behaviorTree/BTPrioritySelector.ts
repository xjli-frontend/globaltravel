import { BTNode, BTResult } from "./BTNode";


export class BTPrioritySelector extends BTNode {
    private _activeChild: BTNode = null;

    protected DoEvaluate(): boolean {
        for (let child of this._children) {
            if (child.Evaluate()) {
                if (this._activeChild && this._activeChild != child) {
                    this._activeChild.Clear();
                }
                this._activeChild = child;
                return true;
            }
        }
        if (this._activeChild) {
            this._activeChild.Clear();
            this._activeChild = null;
        }
        return false;
    }
    Clear() {
        if (this._activeChild) {
            this._activeChild.Clear();
            this._activeChild = null;
        }
    }
    public Tick(): BTResult {
        if (!this._activeChild) {
            return BTResult.Ended;
        }
        let result = this._activeChild.Tick();
        if (result != BTResult.Running) {
            this._activeChild.Clear();
            this._activeChild = null;
        }
        return result;
    }
}