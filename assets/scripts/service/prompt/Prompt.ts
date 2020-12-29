import engine from "../../core/Engine";
import { UICallbacks } from "../../core/gui/Defines";
import { gui } from "../../core/gui/GUI";
import { NetworkState } from "../../core/net/Network";
import { service } from "../Service";

export enum Prompt_Type {
    POP = 1,         // 不同弹窗
    POPSTATIC = 2,   // 静态弹窗
    POPSYS = 3,      // 系统弹唱
}

export enum Prompt_Size {
    FIRST = 1,       // 最大尺寸
    SECOND = 2,      // 第二尺寸
    THIRD = 3,       // 第三尺寸
}

export class Prompt {

    /**
     * 打开网络不稳定提示
     * @param time 延迟关闭时间，默认不关闭
     */
    public netInstableOpen(time: number = 0) {
        let loading: string = "common/persist/prefab/loading";
        if (!gui.loading.has(loading)) {
            gui.loading.add(loading, null);
        }
        if (time > 0) {
            if (this._timeId) {
                engine.timer.unschedule(this._timeId);
            }
            this._timeId = engine.timer.scheduleOnce(this.netInstableClose, time);
        }
    }

    /**
     * 打开网络不稳定提示 只用在任务领取奖励等待服务器返回
     * @param time 延迟关闭时间，默认不关闭
     */
    public netInstableOpenByTask(time: number = 0) {
        let loading: string = "common/persist/prefab/loading_task";
        if (!gui.loading.has(loading)) {
            gui.loading.add(loading, null);
        }
        if (time > 0) {
            if (this._timeId) {
                engine.timer.unschedule(this._timeId);
            }
            this._timeId = engine.timer.scheduleOnce(this.netInstableClose, time);
        }
    }

    public netInstableClose() {
        gui.loading.$delete("common/persist/prefab/loading");
        gui.loading.$delete("common/persist/prefab/loading_task");
    }

    /**
     * 打开网络不稳定提示
     * @param time 延迟关闭时间，默认不关闭
     */
    public roomLoadOpen(time: number = 0) {
        let loading: string = "hall/room_load";
        if (!gui.loading.has(loading)) {
            gui.loading.add(loading, null);
        }
        // if (time > 0){
        //     if (this._roomLoadTimeId){
        //         engine.timer.unschedule(this._roomLoadTimeId);
        //     }
        //     this._roomLoadTimeId = engine.timer.scheduleOnce( this.netInstableClose,time );
        // }
    }

    public roomLoadClose() {
        gui.loading.$delete("hall/room_load");
    }

    private _timeId = ""
    private _roomLoadTimeId = "";
    /** 网络恢复 */
    public networkRecovery() {
        if (this._timeId) {
            engine.timer.unschedule(this._timeId);
            this._timeId = "";
        }
        let loading: string = "common/persist/prefab/loading";
        gui.loading.$delete(loading)
    }
    /** 网络延时 */
    public networkLatency(time: number) {
        if (this._timeId) {
            engine.timer.unschedule(this._timeId);
        }
        this._timeId = engine.timer.scheduleOnce(this.netInstableOpen, time);
    }
    public serverConnectFail(callback: Function) {
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: 'server_connect_fail_content',
                okFunc: callback,
                okWord: 'determine',
                needClose: false
            }
        };
        this.addCommonPrompt(operate);
    }
    /** 大厅服务器连接断开 */
    public hallServerDisconnected(okFunc: Function, cancelFunc: Function) {
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: "server_off",
                okFunc: okFunc,
                okWord: 'Try Now',
                cancelWord: "OK",
                cancelFunc: cancelFunc,
                needCancel: true,
                showOk: true,
                // useI18n: false,
                needClose: false,
            }
        };
        this.addCommonPrompt(operate);
    }
    /** 游戏重启确认 */
    public restart(callback: Function) {
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: 'restart game!',
                okFunc: callback,
                okWord: 'determine',
                needClose: false
            }
        };
        this.addCommonPrompt(operate);
    }

    /** 服务器连接断开 */
    public serverDisconnected(callback: Function = null) {
        let __c = "server_connect_fail_content"
        if (engine.network.state != NetworkState.ONLINE) {
            __c = "net_unavailable"
        }
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: __c,
                okFunc: callback,
                okWord: 'determine',
                needClose: false,
                uuid: "promptServerDisconnected"
            }
        };
        this.addCommonPrompt(operate);
    }

    /** 客户端错误 */
    public unknowError() {
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: 'refresh_page',
                okFunc: function () {
                    service.exitGame();
                },
                okWord: 'determine',
                needClose: false
            }
        };
        this.addCommonPrompt(operate);
    }

    /** 资源下载失败提升 */
    public resNotFound(callback: Function = null) {
        if (!callback) {
            callback = () => {
                if (cc.sys.isNative) {
                    cc.game.restart();
                } else {
                    location.reload(true); // 刷新网页
                }
            }
        }
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: 'res_notfound',
                okFunc: callback,
                okWord: 'determine',
                needClose: false
            }
        };
        this.addCommonPrompt(operate);
    }

    /** 传入未知币种*/
    public errorCurrency() {
        let showOk = true;
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: 'error_currency',
                showOk: showOk,
                okFunc: function () {
                    service.exitGame();
                },
                okWord: 'determine',
                needClose: false
            }
        };
        this.addCommonPrompt(operate);
    }

    public errorCodePrompt(code: number | string, handler: Function = null) {
        let func = handler;
        let showOk = true;
        if (!func) {
            func = () => {
                service.exitGame();
            }
        }
        // 获取错误码描述内容
        let operate: any = {
            params: {
                popType: Prompt_Type.POPSYS,
                sizeType: Prompt_Size.THIRD,
                title: 'system_prompt',
                content: `errorcode_${code}`,
                okFunc: func,
                showOk: showOk,
                okWord: 'determine',
                needClose: false
            }
        };
        this.addCommonPrompt(operate);
    }

    /*************************************************************/
    /**
     * 增加一个公共提示框
     * params 参数 
     * {
     *  popType:    弹窗类型,
     *  sizeType:   尺寸类型,
     *  title:      标题,
     *  content:    内容,
     *  okWord:     ok按钮上的文字,
     *  closeFunc:  关闭时执行的方法,
     *  okFunc:     确认时执行的方法,
     *  needClose:  是否需要关闭按钮,默认需要,
     *  needCancel: 是否需要取消按钮,默认不需要,
     *  cancelWord: 取消按钮的文字,
     *  cancelFunc: 取消时执行的方法
     * }
     * @param operate 
     */
    public addCommonPrompt(operate: any) {
        operate.params.popType = operate.params.popType || Prompt_Type.POP;
        operate.params.sizeType = operate.params.sizeType || Prompt_Size.FIRST;
        let callbacks: UICallbacks = {
            // 节点添加动画
            onAdded: (node, params) => {
                node.scale = 0.1;
                node.runAction(cc.scaleTo(0.2, 1));
            },
            // 节点删除动画
            onBeforeRemove: (node, next) => {
                node.RunAction(ezaction.scaleTo(0.2, { scale: 0.1 })).onStoped(next);
            }
        }
        switch (operate.params.popType) {
            case Prompt_Type.POP:
                gui.dialog.add("common/persist/prefab/common_prompt", operate.params, callbacks);
                break;
            case Prompt_Type.POPSTATIC:
                gui.alert.add("common/persist/prefab/common_prompt", operate.params, callbacks);
                break;
            case Prompt_Type.POPSYS: {
                gui.alert.add("common/persist/prefab/common_prompt", operate.params, callbacks);
                break;
            }
            default:
                break;
        }
    }

    /** 是否有弹窗 */
    public hasPopView(): boolean {
        let path: string = "common/persist/prefab/common_prompt";
        return gui.dialog.has(path) || gui.alert.has(path);
    }

    /** 删除所有的公用弹窗 */
    public clearAll() {
        let path: string = "common/persist/prefab/common_prompt";
        gui.dialog.$delete(path);
        gui.alert.$delete(path);
    }
}