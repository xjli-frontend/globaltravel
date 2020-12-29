import { MapType } from "./MapType";

/**
 * 地图参数
 */
export default class MapParams {
    public name: string = "";
    public mapType: MapType = MapType.angle45;
    public mapWidth: number = 750;
    public mapHeight: number = 1600;
    public ceilWidth: number = 75;
    public ceilHeight: number = 75;
    public bgTex: cc.Texture2D = null;
}
