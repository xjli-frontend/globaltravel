import MapData from "./base/MapData";
import { MapType } from "./base/MapType";
import Charactor from "./charactor/Charactor";
import EntityLayer from "./layer/EntityLayer";
import MapLayer from "./layer/MapLayer";
import AstarHoneycombRoadSeeker from "./road/AstarHoneycombRoadSeeker";
import AStarRoadSeeker from "./road/AStarRoadSeeker";
import IRoadSeeker from "./road/IRoadSeeker";
import MapRoadUtils from "./road/MapRoadUtils";
import Point from "./road/Point";
import RoadNode from "./road/RoadNode";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SceneMap extends cc.Component {

    @property(cc.Node)
    public layer: cc.Node = null;

    @property(MapLayer)
    public mapLayer: MapLayer = null;

    @property(EntityLayer)
    public entityLayer: EntityLayer = null;

    // @property(Charactor)
    // private player: Charactor = null;

    @property(cc.Camera)
    private camera: cc.Camera = null;

    @property()
    public isFollowPlayer: boolean = false;

    private _roadDic: { [key: string]: RoadNode } = {};

    private _roadSeeker: IRoadSeeker;

    private targetPos: cc.Vec3 = cc.Vec3.ZERO;



    private _mapData: MapData = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    private _mapRoadUtils: MapRoadUtils = null;

    public get mapRoadUtils() {
        if (!this._mapRoadUtils) {
            this._mapRoadUtils = new MapRoadUtils();
        }
        return this._mapRoadUtils;
    }

    start() {

        this.node.x = -cc.winSize.width / 2;
        this.node.y = -cc.winSize.height / 2;

        // this.player.sceneMap = this;
        // this.node.on(cc.Node.EventType.TOUCH_START, this.onMapMouseDown, this);
    }

    onLoad() {
    }

    initMapData(id:number){
        cc.loader.loadRes(`map/citymap${id}`, cc.JsonAsset, (error, res) => {
            var mapData: MapData = res.json;
            this.init(mapData, null);
        })
    }
    
    public init(mapData: MapData, bgTex: cc.Texture2D) {

        this._mapData = mapData;

        this.mapRoadUtils.updateMapInfo(mapData.mapWidth, mapData.mapHeight, mapData.nodeWidth, mapData.nodeHeight, mapData.type);

        this.mapLayer.init(mapData.mapWidth, mapData.mapHeight, mapData.nodeWidth, mapData.nodeHeight, bgTex);

        var len: number = mapData.roadDataArr.length;
        var len2: number = mapData.roadDataArr[0].length;

        var value: number = 0;
        var dx: number = 0;
        var dy: number = 0;

        for (var i: number = 0; i < len; i++) {
            for (var j: number = 0; j < len2; j++) {
                value = mapData.roadDataArr[i][j];
                dx = j;
                dy = i;

                var node: RoadNode = this.mapRoadUtils.getNodeByDerect(dx, dy);
                node.value = value;

                this._roadDic[node.cx + "_" + node.cy] = node;
            }
        }

        if (mapData.type == MapType.honeycomb) {
            this._roadSeeker = new AstarHoneycombRoadSeeker(this._roadDic)
        } else {
            this._roadSeeker = new AStarRoadSeeker(this._roadDic);
        }

        this.node.width = this.mapLayer.width;
        this.node.height = this.mapLayer.height;

        // this.setViewToPlayer();

    }

    public getMapNodeByPixel(px: number, py: number): RoadNode {
        var point: Point = this.mapRoadUtils.getWorldPointByPixel(px, py);

        var node: RoadNode = this._roadDic[point.x + "_" + point.y];

        return node;
    }

    public addPlayer(player: Charactor) {
        player.sceneMap = this;
    }

    public onMapMouseDown(event: cc.Event.EventTouch): void {
        var pos = this.node.convertToNodeSpace(event.getLocation());
        // var pos = this.camera.node.position.add(event.getLocation());

        // this.movePlayer(pos.x, pos.y);

    }

    /**
     * 视图跟随玩家
     * @param dt 
     */
    public followPlayer(dt: number) {
        // this.targetPos = this.player.node.position.sub(cc.v3(cc.winSize.width / 2, cc.winSize.height / 2));
        // this.targetPos = 
        if (this.targetPos.x > this._mapData.mapWidth - cc.winSize.width) {
            this.targetPos.x = this._mapData.mapWidth - cc.winSize.width;
        } else if (this.targetPos.x < 0) {
            this.targetPos.x = 0;

        }

        if (this.targetPos.y > this._mapData.mapHeight - cc.winSize.height) {
            this.targetPos.y = this._mapData.mapHeight - cc.winSize.height;
        } else if (this.targetPos.y < 0) {
            this.targetPos.y = 0;
        }


        //摄像机平滑跟随
        // this.camera.node.position.lerp(this.targetPos, dt * 2.0, this.targetPos);
        // this.camera.node.position = this.targetPos;

    }

    /**
        *移到玩家 
        * @param targetX 移动到的目标点x
        * @param targetY 移到到的目标点y
        * 
        */
    public movePlayer(player: Charactor, targetX: number, targetY: number,gateId) {
        if (!this._roadSeeker) {
            return;
        }
        var startPoint: Point = this._mapRoadUtils.getWorldPointByPixel(player.node.x, player.node.y);
        var targetPoint: Point = this._mapRoadUtils.getWorldPointByPixel(targetX, targetY);

        var startNode: RoadNode = this._roadDic[startPoint.x + "_" + startPoint.y];
        var targetNode: RoadNode = this._roadDic[targetPoint.x + "_" + targetPoint.y];

        // var roadNodeArr: RoadNode[] = this._roadSeeker.seekPath(startNode, targetNode); //点击到障碍点不会行走
        var roadNodeArr: RoadNode[] = this._roadSeeker.seekPath2(startNode, targetNode);  //点击到障碍点会行走到离障碍点最近的可走路点
        // cc.log("roadNodeArr", roadNodeArr)
        if (roadNodeArr.length > 0) {
            player.walkByRoad(roadNodeArr,gateId);
        }
    }

    /**
     *把视野定位到给定位置 
    * @param px
    * @param py
    * 
    */
    public setViewToPoint(px: number, py: number): void {
        this.targetPos = cc.v3(px, py).sub(cc.v3(cc.winSize.width / 2, cc.winSize.height / 2));

        if (this.targetPos.x > this._mapData.mapWidth - cc.winSize.width) {
            this.targetPos.x = this._mapData.mapWidth - cc.winSize.width;
        } else if (this.targetPos.x < 0) {
            this.targetPos.x = 0;

        }

        if (this.targetPos.y > this._mapData.mapHeight - cc.winSize.height) {
            this.targetPos.y = this._mapData.mapHeight - cc.winSize.height;
        } else if (this.targetPos.y < 0) {
            this.targetPos.y = 0;
        }

        // this.camera.node.position = this.targetPos;
    }

    /**
     * 将视野对准玩家
     */
    public setViewToPlayer(player: Charactor): void {
        this.setViewToPoint(player.node.x, player.node.y);
    }


    update(dt) {
        if (!this._mapData) {
            return
        }
        if (this.isFollowPlayer) {
            this.followPlayer(dt);
            //this.camera.node.position = this.player.node.position.sub(cc.v2(cc.winSize.width / 2,cc.winSize.height / 2));
        }

    }
}
