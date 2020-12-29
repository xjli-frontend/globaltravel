import { BTPrecondition } from "./BTPrecondition";
import { BTDatabase } from "./BTDatabase";
/// BT node is the base of any nodes in BT framework.

export enum BTResult {
    Ended = 1,
    Running = 2,
}

export abstract class BTNode {
    public name: string;

    protected _children: Array<BTNode> = null;
    public get children() {
        return this._children;
    }

    // Used to check the node can be entered.
    public precondition: BTPrecondition = null;

    public database: BTDatabase = null;

    // Cooldown function.
    public interval = 0;
    private _lastTimeEvaluated = 0;

    public activated: boolean = false;

    constructor(precondition?: BTPrecondition) {
        this.precondition = precondition;
    }
    Activate(database: BTDatabase) {
        // if (this.activated) {
        //     return;
        // }
        this.database = database;
        if (this.precondition) {
            this.precondition.Activate(database);
        }
        if (this._children) {
            for (let child of this._children) {
                child.Activate(database);
            }
        }
        this.activated = true;
    }

    Evaluate(): boolean {
        let coolDownOK = this.CheckTimer();
        return this.activated && coolDownOK && (!this.precondition || this.precondition.Check()) && this.DoEvaluate();
    }

    protected DoEvaluate(): boolean {
        return true;
    }
    Tick(): BTResult {
        return BTResult.Ended;
    }

    Clear() {

    }

    AddChild(anode: BTNode) {
        if (!this._children) {
            this._children = [];
        }
        if (anode) {
            this._children.push(anode)
        }
    }
    RemoveChild(anode: BTNode) {
        if (this._children && anode) {
            let index = this._children.indexOf(anode);
            if (index >= 0) {
                this._children.splice(index, 1);
            }
        }
    }

    private CheckTimer(): boolean {
        let now = Date.now();
        if (now - this._lastTimeEvaluated > this.interval) {
            this._lastTimeEvaluated = now;
            return true;
        }
        return false;
    }


}