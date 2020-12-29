import main from "../Main";
import { Server } from "../service/server/Server";
import { service } from "../service/Service";
import { formatParams } from "./CalcTool";


export enum EventProtocol {
    /** 自动收集事件 */
    ONREWARDRESULT = "onRewardResult"
}


export interface AccountChangeParams {
    credit?: formatParams,
    win?: formatParams,
    winTotal?: formatParams,
    fame?: formatParams
    level?: number,
    diamond?: number,
    cityId?: number
}

const CASH_TAG = "cashHandler";
export class GameProtocol {

    // // 服务器管理对象
    private _server: Server = null;


    constructor(server: Server) {
        this._server = server;

        server.setErrorCodeHandler(this.errorCodeHandler.bind(this))
        // 监听服务器协议推送事件
        // service.server.addProtocolListener("onRewardResult", this.onRewardResult.bind(this));        // 自动收集
        // service.server.addProtocolListener("onAutoCompleteOver", this.onAutoComplete.bind(this));    // 自动结算freespin或小游戏奖励
    }

    private errorCodeHandler(protocol: string, code: number): boolean {
        cc.warn(`【Server】, 收到服务器错误 ${code}`);
        service.analytics.logEvent("server_error_code", protocol, code.toString());

        switch (code) {
            case 302:
                break;
            default: {
                service.prompt.errorCodePrompt(code);
                return false;
            }
        }
    }
    /**
     * 开始充值
     * @param goodsId 
     * @param success 
     * @param error 
     */
    public startPay(goodsId: number, success?: Function, error?: Function) {
        this._server.safetyRequest(`connector.${CASH_TAG}.handler`, {
            title: "rechargeBegin",
            goodsId: goodsId
        }, success, error);
    }

    /**
     * 
     * @param orderId 自有订单号
     * @param receipt 苹果收据
     * @param billNO 苹果订单号
     * @param success 
     * @param error 
     */
    public finishApplePay(result: number, params: { orderId: string, receipt: string, billNo: string }, success?: Function, error?: Function) {
        cc.log("验证Apple订单，", JSON.stringify(params));

        let pa = {
            title: "rechargeResult",
            data: {
                payType: "apple",
                status: result
            }
        };
        if (result == 2) {
            for (let k in params) {
                pa.data[k] = params[k];
            }
        }
        this._server.safetyRequest(`connector.${CASH_TAG}.handler`, pa, success, error);
    }

    /**
     * 
     * @param result 支付结果 2:支付成功 3:支付失败
     * @param params 
     * @param success 
     * @param error 
     */
    public finishGooglePay(result: number, params: {
        orderId: string, packageName: string, productId: string,
        purchaseToken: string, billNo: string
    }, success?: Function, error?: Function) {
        let pa = {
            title: "rechargeResult",
            data: {
                payType: "google",
                status: result
            }
        };
        if (result == 2) {
            for (let k in params) {
                pa.data[k] = params[k];
            }
        }
        cc.log("验证google订单，", JSON.stringify(pa));
        this._server.safetyRequest(`connector.${CASH_TAG}.handler`, pa, success, error);
    }
    public onRewardResult(data: any) {
        // cc.log("自动收集",data);
        // Message.dispatchEvent(EventProtocol.ONREWARDRESULT,data);
    }

    /**
     * 进入主游戏
     * @编号 (2001)
     */
    public entry(successHandler: Function, failedHandler?: Function) {
        let route = `connector.${CASH_TAG}.entry`;

        if (!route) {
            cc.warn("【数据协议】进入路由配置不存在", route);
            return;
        }
        let complete = (data: any) => {
            cc.log('【数据协议】进入主游戏成功', data);
            successHandler(data);
        }

        this._server.request(route, null, complete, (code) => {
            cc.log(`${route} 错误`, code)
            failedHandler && failedHandler(code);
        });
    }


    /**
     * 读取服务器缓存数据
     * @param callback 
     * @编号 (2102)
     */
    public requestCashRead(params: any, callback: Function) {
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };
        this._server.request(`connector.${CASH_TAG}.read`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 获取店铺列表
     * @param callback 
     * @编号 (2102)
     */
    public requestStoreList(callback: Function) {
        let params = {
            title:"storeList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取店员列表
     * @param callback 
     * @编号 (2102)
     */
    public requestClerkList(callback: Function) {
        let params = {
            title:"clerkList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取声望列表
     * @param callback 
     * @编号 (2102)
     */
    public requestFameList(callback: Function) {
        let params = {
            title:"fameList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取商品列表
     * @param callback 
     * @编号 (2102)
     */
    public requestGoodsList(callback: Function) {
        let params = {
            title:"goodsList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取商品列表
     * @param callback 
     * @编号 (2102)
     */
    public checkBuyRecord(goodsId, callback: Function) {
        let params = {
            title: "checkBuyRecord",
            goodsId: goodsId
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 任务列表
     * @param callback 
     * @param goodsId 商品id
     */
    public requestTaskList(callback: Function) {
        let params = {
            title:"taskList"
        }
        this.requestCashRead(params, callback);
    }

    /**
     * 获取背包列表
     * @param callback 
     * @编号 (2102)
     */
    public requestPropStorageList(callback: Function) {
        let params = {
            title:"propStorageList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 使用过的道具加成数据
     * @param callback 
     * @编号 (2102)
     */
    public requestPropList(callback: Function) {
        let params = {
            title:"propList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取排行榜
     * @param callback 
     * @编号 (2102)
     */
    public requestRankingList(callback: Function) {
        let params = {
            title:"rankingList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取点赞信息
     * @param callback 
     * @编号 (2102)
     */
    public requestLikeInfo(callback: Function) {
        let params = {
            title:"likeInfo"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 邮件列表
     * @param pageSize 每页数量
     * @param pageIndex 页码
     * @param callback 
     * @编号 (2101)
     */
    public requestMessageList(callback: Function, pageSize?: number, pageIndex?: number) {
        let params = {
            title:"mailList"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取商品加成信息
     * @param callback 
     * @编号 (2102)
     */
    public requestGoodsInfo(callback: Function) {
        let params = {
            title:"goodsData"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 获取npc配置信息
     * @param callback 
     * @编号 (2102)
     */
    public requestNpcConfig(callback: Function) {
        let params = {
            title:"npcConfig"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * npc 互动数据
     * @param callback 
     * @编号 (2102)
     */
    public requestNpcData(callback: Function) {
        let params = {
            title:"npcData"
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 查询观看广告领取钻石次数
     * @param callback 
     * @编号 (2102)
     */
    public requestAdRechargeCount(callback: Function) {
        let params = {
            title:"adRechargeCount",
            goodsId:16
        }
        this.requestCashRead(params, callback)
    }

    /**
     * 查询广告观看次数
     * @param callback 
     * @编号 (2102)
     */
    public requestAdvCount(callback: Function) {
        let params = {
            title:"taskData",
            taskId:31
        }
        this.requestCashRead(params, callback)
    }


    /**
     * 保存数据
     * @param callback 
     * @编号 (2101)
     */
    public requestCashWrite(title: string, data: any, callback: Function) {
        let complete = (data) => {
            cc.log(title, data);
            if (callback) callback(data);
        };
        this._server.request(`connector.${CASH_TAG}.write`,
            {
                title: title,
                data: data
            },
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

        /**
     * 写入广告观看次数
     * @param callback 
     * @编号 (2102)
     */
    public sendAdvCount(count:number,callback?: Function) {
        let complete = (data) => {
            cc.log("taskData", data);
            if (callback) callback(data);
        };
        this._server.request(`connector.${CASH_TAG}.write`,
            {
                title: "taskData",
                taskId:31,
                count:count
            },
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }


    /**
     * 改变店铺列表
     * @param callback 
     */
    public sendStoreList(data: any, callback: Function) {
        this.requestCashWrite("storeList", data, callback)
    }

    /**
     * 改变店员列表
     * @param callback 
     */
    public sendClerkList(data: any, callback: Function) {
        this.requestCashWrite("clerkList", data, callback)
    }

    /**
     * 改变声望表
     * @param callback 
     */
    public sendFameList(data: any, callback: Function) {
        this.requestCashWrite("fameList", data, callback)
    }

    /**
     * 改变任务列表
     * @param callback 
     */
    public sendTaskList(data: any, callback: Function) {
        if (!main.module.calcUiShow.checkTaskListChange(main.module.vm.taskList, data)) {
            callback && callback(data);
            return;
        }
        this.requestCashWrite(`taskList`, data, callback)
    }

    /**
     * 发功收集速度验证
     * @param callback 
     */
    public sendRewardDetail(data: any, callback: Function) {
        this.requestCashWrite("rewardDetail", data, callback)
    }


    /**
     * 道具使用
     * @param callback 
     * @编号 (2103)
     */
    public requestUseProp(pid: number, callback: Function) {
        let params = {
            title: "useProp",
            pid: pid
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * handler
     * @param callback 
     * @编号 (2103)
     */
    public requestAccountChange(accountInfo: AccountChangeParams, callback: Function) {
        let params = {
            title: "accountChange",
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        if (accountInfo.credit) {
            params["credit"] = accountInfo.credit.num;
            params["creditE"] = accountInfo.credit.numE;
        }
        if (accountInfo.win) {
            params["win"] = accountInfo.win.num;
            params["winE"] = accountInfo.win.numE;
        }
        if (accountInfo.winTotal) {
            params["winTotal"] = accountInfo.winTotal.num;
            params["winTotalE"] = accountInfo.winTotal.numE;
        }
        if (accountInfo.fame) {
            params["fame"] = accountInfo.fame.num;
            params["fameE"] = accountInfo.fame.numE;
        }
        if (accountInfo.level) {
            params["level"] = accountInfo.level;
        }
        if (accountInfo.cityId) {
            params["cityId"] = accountInfo.cityId;
        }
        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }


    /**
     * 点赞操作
     * @param callback 
     * @编号 (2102)
     */
    public requestClickLike(uid, index, callback: Function) {
        let params = {
            title: "like",
            uid: uid,
            index: index//点赞名次
        }
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * handler
     * @param callback 
     * @编号 (2103)
     */
    public requestDiamondInfo(goodsId: number, callback: Function) {
        let params = {
            title: "goodsBuy",
            goodsId: goodsId
        }
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 钻石扣减
     * @param callback 
     * @编号 (2103)
     */
    public requestDiamondChange(cost: number, callback: Function) {
        let params = {
            title: "doCost",
            cost: cost
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 观看广告领取钻石
     * @param callback 
     * @编号 (2103)
     */
    public rechargeBegin(callback: Function) {
        let params = {
            title: "rechargeBegin",
            goodsId:16    
        }
        let complete = (data) => {
            cc.log(`rechargeBegin`,data);
            if (callback) callback(data);
        };
        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 每日任务领取
     * @param callback 
     * @编号 (2103)
     */
    public requestDayTaskReward(taskId: number, callback: Function) {
        let params = {
            title: "taskReward",
            taskId: taskId
        }

        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (taskId == 30) {
                    if (callback) callback(code);
                }
            }
        );
    }

    /**
     * 主线任务领取
     * @param callback 
     * @编号 (2103)
     */
    public requestMainTaskReward(callback: Function) {
        let params = {
            title: "levelReward",
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * npc 领奖
     * @param callback 
     * @编号 (2102)
     */
    public requestNpcReward(npcId: number, index: number, isWatch:boolean, callback: Function, adId?: number,) {
        let params = {
            title: "npcReward",
            npcId: npcId,
            index: index,
            isWatch:isWatch
        }
        let complete = (data) => {
            cc.log(params.title, data);
            if (callback) callback(data);
        };

        this._server.request(`connector.${CASH_TAG}.handler`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 请求头像
     * @param callback 
     * @编号 (2103)
     */
    public requestHead(uid: number, callback: Function) {
        let params = {
            title: "userIcon",
            uid: uid
        }
        let complete = (result) => {
            cc.log(params.title, result);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.read`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 换头像
     * @param callback 
     * @编号 (2103)
     */
    public sendHead(icon: number, callback: Function) {
        let params = {
            title: "userIcon",
            icon: icon
        }
        let complete = (result) => {
            cc.log(params.title);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.write`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 换昵称
     * @param callback 
     * @编号 (2103)
     */
    public sendNickName(nickName: string, callback: Function) {
        let params = {
            title: "nickName",
            nickName: nickName
        }
        let complete = (result) => {
            cc.log(params.title);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.write`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 请求缓存数据
     * @param callback 
     * @编号 (2103)
     */
    public requestCacheData(configName: string, callback: Function) {
        let params = {
            title: "clientConfig",
            configName: configName
        }
        let complete = (result) => {
            cc.log(params.title);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.read`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }

    /**
     * 写入缓存数据
     * @param callback 
     * @编号 (2103)
     */
    public writeCacheData(configName: string, configValue: object, callback: Function) {
        let params = {
            title: "clientConfig",
            configName: configName,
            configValue: configValue
        }
        let complete = (result) => {
            cc.log(params.title);
            if (callback) callback(result);
        };

        this._server.request(`connector.${CASH_TAG}.write`,
            params,
            complete, (code) => {
                if (callback) callback(null);
            }
        );
    }


}
