/*
 * @CreateTime: Dec 28, 2017 3:48 PM
 * @Author: zhljian
 * @Contact: 1065214861@qq.com
 * @Last Modified By: zhljian
 * @Last Modified Time: Dec 28, 2017 3:52 PM
 * @Description: 数字变化组件
 */
import { formatParams } from "../../../hall/CalcTool";
import main from "../../../Main";
import engine from "../../Engine";

const {ccclass, property} = cc._decorator;

@ccclass
export class LabelChangeSymbol extends cc.Label {
    _num: formatParams = {
        num:0,
        numE:0
    };
    
    labNum:number = 0;
    public set num(formatNum: formatParams) {
        this._num = formatNum;
        this.endAdd = main.module.calcTool.formatNum(formatNum).gear;
        if (this.isInteger && formatNum.numE < 0){
            this.labNum = Math.floor(this._num.num *  Math.pow(10, this._num.numE )) 
        }else{
            this.labNum = main.module.calcTool.formatNum(formatNum).base;
        }
        this.updateLabel();
    }

    @property({
        tooltip: "是否显示小数位"
    })
    showdecimal: boolean = true;

    @property({
        tooltip:"最前面添加内容"
    })
    topAdd: string = "";

    public get num(): formatParams {
        return this._num;
    }

    useFix: boolean = true;
    @property
    isInteger: boolean = false;

    private callback: Function = null;  // 完成回调
    private isBegin: boolean = false;   // 是否开始
    private speed: formatParams = null;          // 变化速度
    private end: formatParams = null;            // 最终值
  
    _endAdd: string = "";

    get endAdd(){
        return this._endAdd;
    }

    set endAdd(str:string){
        this._endAdd = str;
    }

    onDestroy(){
        super.onDestroy();
        this.callback = null;
    }
    /**
     * 变化到某值,如果从当前开始的begin传入null
     * @param {number} duration 
     * @param {number} end 
     * @param {Function} [callback]
     */
    public changeTo(duration: number, end: formatParams, callback?: Function) {
        if (duration == 0) {
            if (callback) callback();
            return;
        }
        this.playAnim(duration, this.num, end, callback);
    }

    /** 播放动画 */
    
    direction:boolean = true;
    private playAnim(duration: number, begin: formatParams, end: formatParams, callback?: Function) {
        this.end = end;
        this.callback = callback;
        if(main.module.calcTool.compare(end,begin)){
            let minsNum = main.module.calcTool.calcMinusNum(end ,begin)
            this.speed = {
                num:minsNum.num/duration,
                numE:minsNum.numE
            };
            this.direction = true;
        }else{
            let minsNum = main.module.calcTool.calcMinusNum(begin ,end)
            this.speed = {
                num:minsNum.num/duration,
                numE:minsNum.numE
            };
            this.direction = false;
        }
       
        this.num = begin;
        this.isBegin = true;
    }

    /** 是否已经结束 */
    private isEnd(num: formatParams): boolean {
        if (this.direction) {
            return main.module.calcTool.compare(num,this.end) ;
        } else {
            return main.module.calcTool.compareLess(num,this.end);
        }
    }

    update(dt) {
        if (this.isBegin) {
            if (this.num.num == this.end.num && this.num.numE == this.end.numE){
                this.isBegin = false;
                if (this.callback) this.callback();
                return;
            }
            this.isInteger = this.endAdd == "";
            let add = {
                num:this.speed.num * dt,
                numE:this.speed.numE
            }
            let num = {
                num:0,
                numE:0
            }
            if(this.direction){
                num = main.module.calcTool.calcAddNum(this.num,add,false);
            }else{
                num = main.module.calcTool.calcMinusNum(this.num,add,false);
            }
            /** 变化完成 */
            if (this.isEnd(num)) {
                num = this.end;
                this.isBegin = false;
                if (this.callback) this.callback();
            }
            this.num = num;
        }
    }

    /** 刷新lab */
    protected updateLabel() {
        if (typeof(this._num.num) != "number" || typeof(this._num.numE) != "number"){
            cc.error("[LabelNumber] num不是一个合法数字");
        }
        if (this.useFix) {
            if(this.showdecimal){
                if(this.endAdd.split("").length>2){
                    this.string = this.topAdd + this.toCurrencyFormat(this.labNum,true,2) + this.endAdd;
                }else if(this.endAdd == ""){
                    this.string = this.topAdd + this.toCurrencyFormat(this.labNum,true,0) + this.endAdd;
                }else{
                    this.string = this.topAdd + this.toCurrencyFormat(this.labNum,true,3) + this.endAdd;
                }
            }
            else{
                this.string = this.topAdd + engine.value.toIntFormat(this._num.num) + this.endAdd;
            }
            if(this.node.name == "lab_credit"){
                // cc.log(`toCurrencyFormat:`+this.labNum,this.toCurrencyFormat(this.labNum,true,0))
                this.spacingX = (this.string.split("").length > 7 || this.endAdd.split("").length >1) ? -12:-18;
            }
        } 
        else {
            // this.string = this.topAdd + this.num.toString() + this.endAdd;
        }
    }
     /**
     * 将金额换算成对应的数字格式
     * 比如人民币10000，转换成 ￥10,000.00 
     *     美元 10000，转换成 $10,000.000
     * @param num 
     * @param showSplit 是否显示逗号分隔符，默认显示 
     */
    public toCurrencyFormat(num: number, showSplit: boolean = true, decNum:number): string {//decNum小数位
        let tag = "";
        if (num < 0) {
            tag = "-";
            num = Math.abs(num);
        }
        let str = num.toString();
        let arr = str.split(".");
        let integer = arr[0] || "0";
        let decimal = arr[1] || "";
        let point = "";
        if(decNum != 0 && arr[1]){
            decimal = fill(decimal, decNum);
            point = ".";
        }
        let ret = ""
        if(decNum == 0){
            ret = tag + num;
        }else{
            if (!showSplit) {
                ret = tag + integer + point + decimal;
            } else {
                ret = tag + convertIntegerToString(integer) + point + decimal
            }
        }
        return ret;
    }
}

let convertIntegerToString = function (value) {
    let rets = [];
    let str = value;
    while (str.length >= 3) {
        rets.unshift(str.substr(-3));
        str = str.substr(0, str.length - 3);
    }
    if (str.length > 0) {
        rets.unshift(str);
    }
    return rets.join(",");
}

let fill = (str, num) => {
    if (str.length < num) {
        let knum = num - str.length;
        while (knum > 0) {
            str = str + "0";
            --knum;
        }
        return str;
    }
    return str.substr(0, num);
}