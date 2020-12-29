/**
 * 常用类型定义
 */

export type PluginCallbackFunction = (err:Error,params:string)=>void;

export type PluginEventFunction = (event:string,params:string)=>void;

export type PluginEntityData = {pluginName:string,params:any};

export const PluginCoreJAVAPATH = "com/ezplugin/core/PluginCore";

export const PluginCoreIOSPATH = "PluginCore";

export const PluginCoreWebPATH = "WebPluginCore";