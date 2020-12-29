/*
 * @CreateTime: Oct 9, 2019 2:35 PM 
 * @Author: howe 
 * @Contact: ihowe@outlook.com 
* @Last Modified By: howe
* @Last Modified Time: Oct 9, 2019 2:43 PM
 * @Description: Modify Here, Please  
 * 支付管理
 */


import { ezplugin } from "../core/ezplugin/ezplugin";
import main from "../Main";
import { service } from "../service/Service";

export class Pay {

    constructor() {
        let iapPlugin = ezplugin.get("PluginIAP");
        if (iapPlugin) {
            iapPlugin.addEventListener(this.iosPayEvent.bind(this));
        }
        let gpayPlugin = ezplugin.get("PluginGooglePay");
        if (gpayPlugin) {
            gpayPlugin.addEventListener(this.gPayEvent.bind(this));
        }
    }

    doPay(billNo: string, productID: string) {
        cc.log(" 调用SDK支付 ", billNo, productID);
        service.prompt.netInstableOpen(2);
        if (cc.sys.isNative) {
            switch (cc.sys.os) {
                case cc.sys.OS_ANDROID: {
                    let iapPlugin = ezplugin.get("PluginGooglePay");
                    if (iapPlugin) {
                        iapPlugin.excute("pay", `${productID}|${billNo}`)
                    }
                    break;
                }
                case cc.sys.OS_IOS: {
                    let iapPlugin = ezplugin.get("PluginIAP");
                    if (iapPlugin) {
                        iapPlugin.excute("pay", `${productID}|${billNo}`)
                    }
                    break;
                }
            }
        } else {
            cc.log("目前只支持iOS和Android应用支付模式！");
        }
    }


    private iosPayEvent(event: string, params: string) {
        switch (event) {
            case "pay_error": {
                let protocol = main.module.gameProtocol;
                let ppa = {
                    orderId: params,
                    receipt: "",
                    billNo: params
                }
                protocol.finishApplePay(3, ppa, (data) => {
                    cc.log("[Pay] 验证结果", JSON.stringify(data));

                })
                break;
            }
            case "pay_success": {
                let payParams = JSON.parse(params);
                let receipt: string = payParams["receipt"];
                let billNo = payParams["billNO"];
                cc.log("receipt长度", receipt.length);
                let protocol = main.module.gameProtocol;

                // cc.log("IAP 支付验证信息",params);
                if (payParams["receipt"]) {
                    // ios验证
                    let ppa = {
                        orderId: billNo,
                        receipt: payParams["receipt"],
                        billNo: billNo
                    }
                    protocol.finishApplePay(2, ppa, (data) => {
                        cc.log("[Pay] 验证结果", JSON.stringify(data));
                        if (data["userAccount"] && data["userAccount"]["credit"]) {
                            let accountData = service.account.data;
                            accountData.diamond = data["userAccount"]["credit"];
                            main.module.vm.diamond = accountData.diamond;
                        }
                    })
                } else {

                }
                break;
            }

        }
    }
    private gPayEvent(event: string, params: string) {
        switch (event) {
            case "pay_error": {
                let gPayParams = JSON.parse(params);
                let protocol = main.module.gameProtocol;
                let ppa = {
                    orderId: "",
                    packageName: "",
                    productId: "",
                    purchaseToken: "",
                    billNo: gPayParams["billNO"]
                }
                protocol.finishGooglePay(3, ppa, (data) => {
                    cc.log("[Pay] 验证结果", JSON.stringify(data));
                })
                break;
            }
            case "pay_success": {
                let gPayParams = JSON.parse(params);
                cc.log("googlepay 支付验证信息", params);
                // googlepay验证
                let protocol = main.module.gameProtocol;
                let packageName = gPayParams["packageName"];
                let orderId = gPayParams["orderId"];
                let productId = gPayParams["productId"];
                let billNo = gPayParams["billNO"];
                let purchaseToken = gPayParams["purchaseToken"];
                let ppa = {
                    orderId: orderId,
                    packageName: packageName,
                    productId: productId,
                    purchaseToken: purchaseToken,
                    billNo: billNo
                }
                protocol.finishGooglePay(2, ppa, (data) => {
                    cc.log("[Pay] 验证结果", JSON.stringify(data));
                    if (data["userAccount"] && data["userAccount"]["credit"]) {
                        let accountData = service.account.data;
                        accountData.diamond = data["userAccount"]["credit"];
                        main.module.vm.diamond = accountData.diamond;
                    }
                })
                break;
            }
        }
    }
}