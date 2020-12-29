/*
 * @CreateTime: Dec 28, 2017 3:48 PM
 * @Author: zhljian
 * @Contact: 1065214861@qq.com
 * @Last Modified By: zhljian
 * @Last Modified Time: Dec 28, 2017 3:52 PM
 * @Description: 数字变化组件
 */
import LabelNumber from "./LabelNumber";

const {ccclass, property} = cc._decorator;

@ccclass
export class LabelChange extends LabelNumber {
    @property
    isInteger: boolean = false;

    private duration: number = 0;       // 持续时间
    private callback: Function = null;  // 完成回调
    private isBegin: boolean = false;   // 是否开始
    private speed: number = 0;          // 变化速度
    private end: number = 0;            // 最终值
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
    public changeTo(duration: number, end: number, callback?: Function) {
        if (duration == 0) {
            if (callback) callback();
            return;
        }
        this.playAnim(duration, this.num, end, callback);
    }


    /**
     * 变化值,如果从当前开始的begin传入null
     * @param {number} duration 
     * @param {number} value 
     * @param {Function} [callback] 
     * @memberof LabelChange
     */
    public changeBy(duration: number, value: number, callback?: Function) {
        if (duration == 0) {
            if (callback) callback();
            return;
        }
        this.playAnim(duration, this.num, this.num + value, callback);
    }

    /** 立刻停止 */
    public stop(excCallback: boolean = true) {
        this.num = this.end;
        this.isBegin = false;
        if (excCallback && this.callback) this.callback();
    }

    /**
     * 更换结束变化值，并返回是否结束
     * @param num 
     */
    public checkAndChange(duration: number, num: number){
        if(this.isBegin){
            this.end = num;
        }
        else{
            this.duration = duration;
            this.changeTo(this.duration, num);
        }
    }

    /** 播放动画 */
    private playAnim(duration: number, begin: number, end: number, callback?: Function) {
        this.duration = duration;
        this.end = end;
        this.callback = callback;
        this.speed = (end - begin) / duration;

        this.num = begin;
        this.isBegin = true;
    }

    /** 是否已经结束 */
    private isEnd(num: number): boolean {
        if (this.speed > 0) {
            return num >= this.end;
        } else {
            return num <= this.end;
        }
    }

    update(dt) {

        if (this.isBegin) {
            if (this.num == this.end){
                this.isBegin = false;
                if (this.callback) this.callback();
                return;
            }
            let num = this.num + dt * this.speed;
            if (this.isInteger) num = Math.ceil(num);

            /** 变化完成 */
            if (this.isEnd(num)) {
                num = this.end;
                this.isBegin = false;
                if (this.callback) this.callback();
            }
            this.num = num;
        }
    }
}