import { ezplugin } from "../../core/ezplugin/ezplugin";
import { http } from "../../core/http/Http";
import engine from "../../core/Engine";

/*
 * @CreateTime: Aug 14, 2018 5:02 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 19, 2018 3:50 PM
 * @Description: Modify Here, Please 
 * 
 * 游戏配置解析，对应 resources/config.json 配置
 * 只提供getter接口和方法
 */
export default class GameConfig {

    /**
     * 获取当前客户端支持的语言类型
     */
    public get language(): Array<string> {
        return this._data["language"];
    }

    /**
     *  获取resources/config.json数据
     */
    public get data() {
        return this._data;
    }

    private _data: any = null;
    constructor(gameConfig: any) {
        let data = gameConfig;
        // 冻结data对象
        this._data = data;
    }

    public setData(data: any) {
        for (let k in data) {
            this._data[k] = data[k];
        }
        engine.log.info("[GameConfig] 合并后的游戏配置数据", JSON.stringify(this._data, null, 2))
    }


    /**
     * 从网关服务器获取服务器ip、port、app版本等数据
     * @param url 
     */
    public checkGateServer(next: Function) {
        let url = this._data["gate_server"];
        let packageName = ezplugin.sysInfo["packageName"] || this._data["packageName"];
        let os = cc.sys.isBrowser ? "web" : cc.sys.os.toLowerCase();
        let callback = (error: Error, response: any) => {
            if (error) {
                engine.log.info(url + "请求错误，" + error["code"] + " message:" + error["message"])
                cc.error(error);
                next(error);
                return;
            }
            if (response) {
                cc.log(response);
            }
            next(error, response.data["data"] || null);
        }
        let prams = {
            packageName: packageName,
            os: os,
            version: engine.appVersion
        };
        cc.log(url + "请求参数", prams);
        http.post(url, prams, {
            headers: { "Content-type": "application/json" },
            callback: callback
        })
    }
}