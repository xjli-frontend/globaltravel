import { formatParams } from "../../hall/CalcTool";

/*
 * @CreateTime: Dec 10, 2018 3:45 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: May 24, 2019 11:22 AM
 * @Description: Modify Here, Please 
 * 
 * 用户账号数据
 */

export enum AccountDataEvent {
    LEVEL_CHANGE = "AccountDataEvent.LEVEL_CHANGE",
    EXP_CHANGE = "AccountDataEvent.EXP_CHANGE",
    GOLD_CHANGE = "AccountDataEvent.GOLD_CHANGE",
    AVATAR_CHANGE = "AccountDataEvent.AVATAR_CHANGE",
}

export class AccountData {

    /** 用户唯一编号 */
    public uid: number;

    /** 用户登录名 */
    public nickName: string;

    public level: number = 0;
    /** 钻石余额 */
    private _diamond: number = 0;
    public get diamond() {
        return this._diamond;
    }
    public set diamond(v: number) {
        this._diamond = v;
    }

    /** 用户金币余额 */
    private _credit: formatParams = null;
    public get credit() {
        return this._credit;
    }
    public set credit(v: formatParams) {
        this._credit = v;
    }

    /** 声望 */
    _fame: formatParams = null;
    public set fame(v: formatParams) {
        this._fame = v;
    }

    public get fame() {
        return this._fame;
    }

    /** 这一地标收益 */
    _win: formatParams = null;
    public set win(v: formatParams) {
        this._win = v;
    }

    public get win() {
        return this._win;
    }

    _winTotal: formatParams = null;
    public set winTotal(v: formatParams) {
        this._winTotal = v;
    }

    public get winTotal() {
        return this._winTotal;
    }

    _loginTime: string = null;
    public get loginTime() {
        return this._loginTime;
    }

    public set loginTime(val) {
        this._loginTime = val;
    }

    public get nowDate() {
        return this._nowDate;
    }

    _nowDate: string = null;
    public set nowDate(val) {
        this._nowDate = val;
    }

    // 账号id
    public accountId: string = "";

    public get currency(): string {
        return this._data["userInfo"]["currency"];
    }
    private _data: any = null;

    /** 服务器账号原始数据 */
    public get data(): any {
        return this._data;
    }
    public setData(data: any) {
        this._data = data;
        this.uid = data["uid"];
        this.nickName = data["nickName"] || this.accountId;
        // this.accountId = data["userInfo"]["accountId"];
        // this.avatar = data["userInfo"]["avatar"];

        // this.exp = data["userInfo"]["exp"];
        // this.mailUnread = data["mailUnread"];
        // this.ungetTask = data.taskUnget;
        // this.ungetAch = data.achUnget;
        cc.log("[AccountData] 收到登录数据", data);
    }

    /**
     * 登出处理
     */
    public logout() {

    }

}