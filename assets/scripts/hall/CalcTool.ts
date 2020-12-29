import { ThemeConfig } from "./ThemeConfig";

export enum ClerkReward{
    /**奖励倍率 */
    muti = 1,
    /**店铺升级减少金钱比例 */
    uplv = 2,
    /**自动收集金币功能 */
    collect = 3,
    /**声望收益提高的比例 */
    fame = 4,
}

export enum fameReward{
    /**收益倍率 */
    muti = 1,
    /**店铺升级减少金钱比例 */
    uplv = 2,
    /**提高店铺等级 */
    raiseLv = 3,
    /**声望加成比例提高 */
    fame = 4,
}

export interface formatParams{
    num:number,
    numE:number
}

/** 辅助计算类 */
export class CalcTool{

    private themeConfig:ThemeConfig = null;

    constructor(config:ThemeConfig){
        this.themeConfig = config;
    }

    /**比较组合数字大小 >= */
    compare(format1:formatParams,format2:formatParams){
        if(format1.numE == 0 && format2.numE == 0){
            return Math.floor(format1.num)>=Math.floor(format2.num)
        }
        let numArr1 = [format1.num,format1.numE];
        let numArr2 = [format2.num,format2.numE];
        let add1 = (Math.floor(numArr1[0]) + "" ).split("").length - 1;
        let add2 = (Math.floor(numArr2[0]) + "" ).split("").length - 1;
        numArr1[0] = numArr1[0] / Math.pow(10,add1)
        numArr2[0] = numArr2[0] / Math.pow(10,add2)
        numArr1[1] = numArr1[1] + add1;
        numArr2[1] = numArr2[1] + add2;
        if(format1.numE == 0 && format2.numE == 0){
            return format1.num >= format2.num;
        }
        if(format1.num > 0 && format2.num < 0){
            return true;
        }
        if(format1.num < 0 && format2.num > 0){
            return false;
        }
        if( numArr1[1] > numArr2[1] ){
            return true;
        }else if(numArr1[1] == numArr2[1]){
            return numArr1[0] >= numArr2[0];
        }else{
            return false;
        }
    }
    /**比较组合数字大小 <= */
    compareLess(format1:formatParams,format2:formatParams){//用在LabelChangeSymbol组件滚动数字在递减上，一般都是 format1.num 出现负数
        if(format1.numE == 0 && format2.numE == 0){
            return Math.floor(format1.num)<=Math.floor(format2.num)
        }
        let numArr1 = [format1.num,format1.numE];
        let numArr2 = [format2.num,format2.numE];
        let add1 = (Math.floor(numArr1[0]) + "" ).split("").length - 1;
        let add2 = (Math.floor(numArr2[0]) + "" ).split("").length - 1;
        numArr1[0] = numArr1[0] / Math.pow(10,add1)
        numArr2[0] = numArr2[0] / Math.pow(10,add2)
        numArr1[1] = numArr1[1] + add1;
        numArr2[1] = numArr2[1] + add2;
        if(format1.numE == 0 && format2.numE == 0){
            return format1.num <= format2.num;
        }
        if(format1.num < 0 && format2.num > 0){
            return true;
        }
        if(format1.num > 0 && format2.num < 0){
            return false;
        }
        if( numArr1[1] < numArr2[1] ){
            return true;
        }else if(numArr1[1] == numArr2[1]){
            return numArr1[0] <= numArr2[0];
        }else{
            return false;
        }
    }

    /** aabb算法 */
    produce(power){
        let gear = ""
        switch (power) {
            case 0:
                gear = "";
                break;
            case 1:
                gear = "K";
                break;
            case 2:
                gear = "m";
                break;
            case 3:
                gear = "B";
                break;
            case 4:
                gear = "T";
                break;
            default:
                let array = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
                        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
                let str = array[ ((power-5)%52 ) ];
                let num = Math.ceil((power-4)/52)+1;
                for(let i=0;i<num;i++){
                    gear+=str;
                }
                break;
        }
        return gear;
    }


    /**格式化组合数字 保留的dec位小数 */
    formatNum(formatNum:formatParams,round:boolean=true){//calcFormatNum
        if(formatNum.numE < 3  && round){//主要解决精度丢失问题
            let resultNum= Math.floor(formatNum.num*Math.pow(10,formatNum.numE))
            formatNum = {
                num:Number(resultNum.toFixed(0)),
                numE:0
            };
            // cc.log(`formatNum`+formatNum.num,formatNum.numE)
        }
        let converNum = this.calcConvertNum(formatNum.num,formatNum.numE);
        let num = converNum.num;
        let index = converNum.num.toString().indexOf("99999");
        if(index!=-1){
            num = Number(converNum.num.toFixed(index-1));
        }
        let numE = converNum.numE;
        let format = (_num:number,dec:number=3)=>{
            if(!_num.toString().split(".")[1]){
                return _num;
            }else{
                let leng = _num.toString().split(".")[0].split("").length;
                let val =  _num.toString().substr(0,leng + 1 + dec);
                let str = val.split(".")[1];
                let r = str.split("");
                for(let i=r.length-1;i>=0;i--){
                    if( r[i] == "0" ){
                        r.splice(i, 1);
                    }else{
                        break;
                    }
                }
                let point = r.length == 0 ? "":".";
                return parseFloat( `${val.split(".")[0]}${point}${r.join("")}`);
            }
        }
        if(num==0){
            return {
                base:0 ,
                gear:""
            };
        }
        if(numE < 0){
            let result = {
                num:num,
                numE:numE
            }
            while (result.numE < 0) {
                result.num /= 10;
                result.numE += 1;
            }
            return {
                base:Math.floor(result.num),//format(result.num,6),
                gear:""
            }; 
        }
        if(numE<3 && round){
            return {
                base:Math.floor(formatNum.num),//没有到科学计数法时向下取整到保留整数位
                gear:""
            }; 
        }
        if(num<0){
            cc.warn("负数不可format")
        }
        let addE = (Math.floor(num) + "" ).split("").length - 1;
        let power = Math.floor((numE + addE)/3);
        let base = num * Math.pow(10, numE - power*3 )
        let arr = num.toString().split(".");
        if(arr && arr.length>1){
            base = Number(arr[0]) * Math.pow(10, numE - power*3 ) + Number(`0.${arr[1]}`) * Math.pow(10, numE - power*3 )
        }
        let gearStr = this.produce(power);
        let _dec= 3;
        if(gearStr.split("").length>2){
            _dec= 2;
        }
        if(gearStr == "" && round){
            return {
                base:Math.floor(base),
                gear:""
            };
        }else{
            return {
                base:format(base,_dec) ,
                gear:gearStr
            };
        }
    }
    
    calcConvertNum(num, numE) {
        let result = {
          num: num,
          numE: numE
        };
        if(num == 666){
            cc.log(result)
        }
        if (num != 0) {
            if(num > 0){
                while (result.num > 10) {
                    result.num = result.num / 10;
                    result.numE = result.numE + 1;
                }
                while (result.num < 1) {
                    result.num = result.num * 10;
                    result.numE = result.numE - 1;
                }
            }
        }
        return result;
    };

    /** 加 */
    calcAddNum(format1:formatParams,format2:formatParams,round:boolean=true){//没有用到科学计数法时round是否取整
        let num1 = format1.num;
        let numE1 = format1.numE;
        let num2 = format2.num;
        let numE2 = format2.numE;
        if(numE1 == 0 && round){
            num1 = Math.floor(num1);
        }
        if(numE2 == 0 && round){
            num2 = Math.floor(num2);
        }
        if(numE1 < 3 && numE2 < 3 && round){
            let resultNum1= Math.floor(num1*Math.pow(10,numE1))
            let resultNum2 = Math.floor(num2*Math.pow(10,numE2))
            return {
                num:Number((resultNum1 + resultNum2).toFixed(0)),
                numE:0
            };
        }
        if(num2 ==0){
            
        }else if(num1 ==0){
            numE1 = numE2;
        }else{
            while ( numE1 > numE2 ) {//
                numE2++;
                num2 /= 10;
            }
            while (numE1 < numE2) {
                numE1++;
                num1 /= 10;
            }
        }
        let addResult = this.calcConvertNum( num1 + num2, numE1);
        return addResult;
    }

    /**减 */
    calcMinusNum(format1:formatParams,format2:formatParams,round:boolean=true){//没有用到科学计数法时round是否取整
        let num1 = format1.num;
        let numE1 = format1.numE;
        let num2 = format2.num;
        let numE2 = format2.numE;
        if(numE1 == 0 && round){
            num1 = Math.floor(num1);
        }
        if(numE2 == 0 && round){
            num2 = Math.floor(num2);
        }
        if(numE1 < 3 && numE2 < 3 && round){
            let resultNum1= Math.floor(num1*Math.pow(10,numE1))
            let resultNum2 = Math.floor(num2*Math.pow(10,numE2))
            return {
                num:Number((resultNum1 - resultNum2).toFixed(0)),
                numE:0
            };
        }
        if(num2 ==0){
            return format1;
        }else if(format1.num ==0){
            return {
                num:-format2.num,
                numE:format2.numE
            }
        }else{
            while ( numE1 > numE2 ) {//
                numE2++;
                num2 /= 10;
            }
            while (numE1 < numE2) {
                numE1++;
                num1 /= 10;
            }
            let subResult = this.calcConvertNum(num1 - num2, numE1);
            return subResult;
        }
    }

    /**除 */
    calcDivideNum(format1:formatParams,format2:formatParams){
        if (format1.num == 0) {
            let divResult = {num:0,numE:0};
            return divResult;
        }
        if (format2.num !== 0) {
            let divResult = this.calcConvertNum(format1.num / format2.num, format1.numE - format2.numE);
            return divResult;
        }
        return format1;
    }

    /**乘 */
    calcMutiNum(format1:formatParams,format2:formatParams){
        let mutiResult = this.calcConvertNum(format1.num * format2.num, format1.numE + format2.numE);
        return mutiResult;
    }

    sort(values){
        values.sort((a: number, b: number) => {
            if (a<b) {
                return -1;
            }
            if (a>b) {
                return 1;
            }
            return 0;
        });
    }
    
}