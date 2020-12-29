
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";

const { ccclass, property } = cc._decorator;

export interface MailParams{
    /** 标题 */
    title:string,
    /** 内容 */
    content:string,
    /** 时间 */
    date:number,
}

@ccclass
export default class SettingMailListItem extends ComponentExtends {

    onLoad(){
        
    }

   setData(params:MailParams){
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);

        let title = mainNodes.get("title");
        title.getComponent(cc.Label).string = params.title;
        let content = mainNodes.get("text");
        content.getComponent(cc.Label).string = params.content;
      
        mainNodes.get("date").getComponent(cc.Label).string = this.getTimeStr(params.date);
    }


    getTimeStr(date:number){
        if(date > main.module.calcUiShow.getSeverCurrentTime()){
            cc.warn(`不可以小于当前时间`)
            return `不可以小于当前时间`;
        }
        let times = main.module.calcUiShow.getSeverCurrentTime() - date;
        let monParam = 1000 * 60 * 60 * 24 * 30;
        let dayParam = 1000 * 60 * 60 * 24;
        let hourParam = 1000 * 60 * 60;
        let minParam = 1000 * 60;
        let mon = times/monParam;
        let dateNum = -1;
        let timeUnit = ""
        if(mon >= 1){
            dateNum = mon;
            timeUnit = "month";
        }else{
            let day = times/dayParam;
            if(day >= 1){
                dateNum = day;
                timeUnit = "day";
            }else{
                let hour = times/hourParam;
                if(hour >= 1){
                    dateNum = hour;
                    timeUnit = "hour";
                }else{
                    let min = times/minParam;
                    if(min >= 1){
                        dateNum = min;
                        timeUnit = "minute";
                    }else{
                        if(min < 0){
                            cc.warn(`不可以小于当前时间${min}`)
                            return `不可以小于当前时间${min}`;
                        }else{
                            return `just`;
                        }
                    }
                }
            }
        }
        if(dateNum < 0){
            cc.warn(`${dateNum}不可小于当前时间`)
            return `error`;
        }else{
            return `${parseInt(dateNum+"")}${timeUnit}ago`;
        }
    }

    onDestroy(){
        super.onDestroy();
    }

}
