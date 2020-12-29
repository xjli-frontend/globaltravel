import engine from "../../Engine";
/*
 * @CreateTime: Sep 18, 2017 10:43 AM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 7, 2018 9:46 PM
 * @Description: Modify Here, Please 
 */

const { ccclass, property } = cc._decorator;

@ccclass
export default class LabelNumber extends cc.Label {
    @property(cc.Float)
    _num: number = 0;

    @property({
        tooltip: "是否显示货币符号"
    })
    _showSym: string = "";

    @property
    public set num(value: number) {
        this._num = value;
        this.updateLabel();
        this.numChange && this.numChange(value);
    }

    @property({
        tooltip: "是否显示小数位"
    })
    showdecimal: boolean = true;

    @property({
        tooltip:"最前面添加内容"
    })
    topAdd: string = "";

    public get num(): number {
        return this._num;
    }

    @property
    public set showSym(value: string) {
        if (value){
            this._showSym = value;
            this.updateLabel();
        }
    }

    public get showSym(): string {
        return this._showSym;
    }

    @property
    useFix: boolean = true;
    public numChange:(num:number)=>void = null;
    onDestroy(){
        this.numChange = null;
    }
    /** 刷新lab */
    protected updateLabel() {
        if (typeof(this._num) != "number"){
            cc.error("[LabelNumber] num不是一个合法数字");
        }
        if (this.useFix) {
            if(this.showdecimal){
                this.string = this.topAdd + engine.value.toCurrencyFormat(this._num);
            }
            else{
                this.string = this.topAdd + engine.value.toIntFormat(this._num);
            }
        } 
        else {
            this.string = this.topAdd + this.num.toString();
        }
    }
}