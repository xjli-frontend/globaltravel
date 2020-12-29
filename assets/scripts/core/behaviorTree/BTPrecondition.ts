import { BTNode, BTResult } from "./BTNode";
import { BTDatabase } from "./BTDatabase";

enum BTFloatFunction {
    LessThan = 1,
    GreaterThan = 2,
    EqualTo = 3,
}
export class BTPrecondition extends BTNode {

    public Check(): boolean {
        return false;
    }

    public Tick(): BTResult {
        return this.Check() ? BTResult.Ended : BTResult.Running;
    }
}


export class BTPreconditionUseDB extends BTPrecondition {

    protected _dataToCheck: string;
    protected _dataIdToCheck: number;

    constructor(dataToCheck: string) {
        super();
        this._dataToCheck = dataToCheck;
    }

    Activate(database: BTDatabase) {
        super.Activate(database);
        this._dataIdToCheck = database.GetDataId(this._dataToCheck);
    }
}


export class BTPreconditionFloat extends BTPreconditionUseDB {
    rhs: number;
    func: BTFloatFunction;

    constructor(dataToCheck: string, rhs: number, func: BTFloatFunction) {
        super(dataToCheck);
        this.rhs = rhs;
        this.func = func;
    }

    public Check(): boolean {
        let lhs = this.database.GetData(this._dataIdToCheck);
        switch (this.func) {
            case BTFloatFunction.LessThan:
                return lhs < this.rhs;
            case BTFloatFunction.GreaterThan:
                return lhs > this.rhs;
            case BTFloatFunction.EqualTo:
                return lhs == this.rhs;
            default: {
                return false;
            }
        }
    }
}