/**
 * 字符串处理
 * Author      : dgflash
 * Create Time : 2017.7.4
 */

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

export class ValueExtends {

    /** 设置货币符号 */
    public currencySymbol: string = "";

    private _currency: string = "CNY";
    public set currency(val: string) {
        this._currency = val;
    }
    public numberToBoolen(value: any): boolean {
        return value != 0;
    }

    public convertIntegerToString(value: number) {
        return convertIntegerToString(value + "")
    }
    /**
     * 将金额换算成对应的数字格式
     * 比如人民币10000，转换成 10000.00 
     *     欧元 10000，转换成 10000.000
     * @param num 
     * @param showSplit 是否显示逗号分隔符，默认显示 
     */
    public toCurrencyNumber(num: number): number {
        let tag = "";
        if (num < 0) {
            tag = "-";
            num = Math.abs(num);
        }
        let str = num.toFixed(4);
        let arr = str.split(".");
        let integer = arr[0] || "0";
        let decimal = arr[1] || "0";
        let currencyType = this._currency || "CNY"; // 货币类型
        switch (currencyType) {
            case "AUD":
            case "BRL":
            case "GBP":
            case "BTC":
            case "SGD":
            case "USD":
            case "EUR":
            case "MYR": {
                // showIndex = ".000";
                decimal = fill(decimal, 3);
                break;
            }
            case "ESB": {
                return Number(tag + num);
            }
            default: {
                decimal = fill(decimal, 2);
                break;
            }
        }
        let ret = tag + integer + "." + decimal;
        return Number(ret);
    }
    /**
     * 将金额换算成对应的数字格式
     * 比如人民币10000，转换成 ￥10,000.00 
     *     美元 10000，转换成 $10,000.000
     * @param num 
     * @param showSplit 是否显示逗号分隔符，默认显示 
     */
    public toCurrencyFormat(num: number, showSplit: boolean = true, decNum?:number): string {//decNum小数位
        let tag = "";
        if (num < 0) {
            tag = "-";
            num = Math.abs(num);
        }
        let str = num.toFixed(4);
        let arr = str.split(".");
        let integer = arr[0] || "0";
        let decimal = arr[1] || "0";
        let currencyType = this._currency || "CNY"; // 货币类型
        switch (currencyType) {
            case "AUD":
            case "BRL":
            case "GBP":
            case "BTC":
            case "SGD":
            case "USD":
            case "EUR":
            case "MYR": {
                if(decNum){
                    decimal = fill(decimal, decNum);
                }else{
                    decimal = fill(decimal, 3);
                }
                break;
            }
            case "ESB": {
                return tag + this.currencySymbol + convertIntegerToString(integer);
            }
            default: {
                if(decNum){
                    decimal = fill(decimal, decNum);
                }else{
                    decimal = fill(decimal, 3);
                }
                break;
            }
        }
        let r = decimal.split("");
        for(let i=r.length-1;i>=0;i--){
            if( r[i] == "0" ){
                r.splice(i, 1);
            }else{
                break;
            }
        }
        decimal = r.join("");
        let ret = ""
        if(decNum == 0){
            ret = tag + this.currencySymbol + num;
        }else{
            if (!showSplit) {
                ret = tag + this.currencySymbol + integer + "." + decimal;
            } else {
                ret = tag + this.currencySymbol + convertIntegerToString(integer) + "." + decimal
            }
        }
        return ret;
    }

    /**
     * 将整数换算成对应的数字格式
     * 比如10000，转换成 10,000
     * @param num 
     * @param showSplit 
     */
    public toIntFormat(num: number, showSplit: boolean = true): string {
        let tag = "";
        if (num < 0) {
            tag = "-";
            num = Math.abs(num);
        }
        let str = num.toFixed(4);
        let arr = str.split(".");
        let integer = arr[0] || "0";
        let ret = ""
        if (!showSplit) {
            ret = integer;
        } else {
            ret = convertIntegerToString(integer);
        }
        return ret;
    }
}
