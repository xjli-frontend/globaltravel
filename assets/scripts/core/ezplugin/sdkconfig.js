let config = {};

config["web"] = [
];

config["ios"] = [
    {
        pluginName: "PluginIAP"
    },
    {
        pluginName: "PluginOS"
    },
    {
        pluginName: "PluginAssetsUpdate"
    },
    {
        pluginName: "PluginFacebook"
    },
    {
        pluginName: "PluginGoogle"
    },
    {
        pluginName: "PluginSignInApple"
    },
    {
        pluginName: "PluginVisitor"
    },
    {
        pluginName: "PluginWebView"
    },
    {
        pluginName: "PluginBugly"
    },
    {
        pluginName: "PluginAdMob",
        params: {
            adUnitID: "ca-app-pub-4155862935870750/6196838225",
            debugAdUnitID: "ca-app-pub-3940256099942544/1712485313" // Google专有测试广告
        }
    },
    {
        pluginName: "PluginTopon",
        params: {
            appID: "a5f05955323a40",
            appKey: "6c1b47e47be2eb0de605daf6e406e67b",
            placementID: "b5f059563dc33f"
        }
    },
];

config["android"] = [
    {
        pluginName: "PluginOS"
    },
    {
        pluginName: "PluginLog"
    },
    {
        pluginName: "PluginPermission"
    },
    {
        pluginName: "PluginAssetsUpdate"
    },
    {
        pluginName: "PluginFacebook"
    },
    {
        pluginName: "PluginGoogle"
    },
    {
        pluginName: "PluginVisitor"
    },
    {
        pluginName: "PluginWebView"
    },
    {
        pluginName: "PluginGooglePay"
    },
    {
        pluginName: "PluginBugly"
    },
    // {
    //     pluginName: "PluginAdMob",
    //     params: {
    //         adUnitID: "ca-app-pub-4155862935870750/1374290378",
    //         debugAdUnitID: "ca-app-pub-4155862935870750/1374290378" // Google专有测试广告
    //     }
    // },
    {
        pluginName: "PluginTopon",
        params: {
            appID: "a5f02d110de468",
            appKey: "6c1b47e47be2eb0de605daf6e406e67b",
            placementID: "b5f02d12790fb1"
        }
    },




];



module.exports = function (channel) {
    return config[channel];
}