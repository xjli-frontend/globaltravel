/*
 * @CreateTime: Sep 29, 2017 10:12 AM
 * @Author: zhljian
 * @Contact: 1065214861@qq.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 10, 2018 2:19 PM
 * @Description: Modify Here, Please 
 */

const StorageKeys = {
    SETTING: 'setting'
}

export class SettingManager {

    private _settingObj = null;

    constructor() {
        let obj = JSON.parse(cc.sys.localStorage.getItem(StorageKeys.SETTING)) || {};
        this._settingObj = obj;
    }
    /** 设置某项设置的值 */
    public setSettingValue(key: string, value: any, save: boolean = true) {
        this._settingObj[key] = value;
        if (save) this.save();
    }

    /** 获取某项设置的值 */
    public getSettingValue(key: string): any {
        return this._settingObj[key];
    }

    public save() {
        let obj: any = this._settingObj;
        cc.sys.localStorage.setItem(StorageKeys.SETTING, JSON.stringify(obj));
    }
}