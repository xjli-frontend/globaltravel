import { BTNode, BTResult } from "./BTNode";
/// BTAction is the base class for behavior node.
/// 
/// It cannot add / remove child.
/// 
/// Override the following to build a behavior (all are optional):
/// - Enter
/// - Execute
/// - Exit
/// - Clear

export enum BTActionStatus {
    Ready = 1,
    Running = 2,
}
export class BTAction extends BTNode {

    private _status: BTActionStatus = BTActionStatus.Ready;
    protected Enter() {

    }
    protected Exit() {

    }

    protected Execute(): BTResult {
        return BTResult.Running;
    }

    public Clear() {
        if (this._status != BTActionStatus.Ready) {
            this.Exit()
            this._status = BTActionStatus.Ready;
        }
    }
    public Tick(): BTResult {
        let result = BTResult.Ended;
        if (this._status == BTActionStatus.Ready) {
            this.Enter();
            this._status = BTActionStatus.Running;
        }
        if (this._status == BTActionStatus.Running) {		// not using else so that the status changes reflect instantly
            result = this.Execute();
            if (result != BTResult.Running) {
                this.Exit();
                this._status = BTActionStatus.Ready;
            }
        }
        return result;
    }
    public AddChild(aa: BTNode) {
        cc.error("BTAction: Cannot add a node into BTAction.")
    }
    public RemoveChild(aa: BTNode) {
        cc.error("BTAction: Cannot remove a node into BTAction.")
    }
}