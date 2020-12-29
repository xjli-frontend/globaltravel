import RoadNode from "../road/RoadNode";
import SceneMap from "../SceneMap";
import MovieClip from "./MovieClip";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

export enum CharactorState {
    stand = 0,
    run = 1,
    sitdown = 2,
    sitdown_run = 3,
    stop_move = 4,
}


@ccclass
export default class Charactor extends cc.Component {

    public id: string = '';
    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null;

    private _movieClip: MovieClip = null;

    public get movieClip(): MovieClip {
        if (!this._movieClip) {
            this._movieClip = this.getComponentInChildren(MovieClip);
        }
        return this._movieClip;
    }


    private _direction: number = 0;

    public get direction(): number {
        return this._direction;
    }

    public set direction(value: number) {
        // cc.log("[Charactor] direction", value)
        this._direction = value;
        let animation = this.skeleton.animation;
        switch (this.direction) {
            case 0: {
                animation = "reward_move_1";
                this.skeleton.node.scaleX = 1;
                break;
            }
            case 1: {
                animation = "reward_move_1";
                this.skeleton.node.scaleX = 1;
                break;
            }
            case 2: {
                animation = "reward_move_1";
                this.skeleton.node.scaleX = 1;
                break;
            }
            case 3: {
                animation = "reward_move_4";
                this.skeleton.node.scaleX = 1;
                break;
            }
            case 4: {
                // 往上走
                animation = "reward_move_4";
                this.skeleton.node.scaleX = 1;
                break;
            }
            case 5: {
                // 右上
                animation = "reward_move_2";
                this.skeleton.node.scaleX = 1;
                break;
            }
            case 6: {
                // 左上
                animation = "reward_move_4";
                this.skeleton.node.scaleX = 1;
                break;
            }
            case 7: {
                animation = "reward_move_3";
                this.skeleton.node.scaleX = 1;
                break;
            }
        }
        // if (value > 4) {
        //     this.movieClip.rowIndex = 4 - value % 4;
        //     this.movieClip.node.scaleX = -1;
        // } else {
        //     this.movieClip.rowIndex = value;
        //     this.movieClip.node.scaleX = 1;
        // }
        if (animation != this.skeleton.animation) {
            this.skeleton.setAnimation(0, animation, true)
        }
    }

    private _state: CharactorState = 0;

    public get state(): CharactorState {
        return this._state;
    }

    public set state(value: CharactorState) {
        this._state = value;
        // cc.log("state ", value)
        let animation: string = this.skeleton.animation;
        switch (this._state) {
            case CharactorState.stand:
                if (animation.indexOf("move_1") > 0) {
                    animation = animation.replace("move", "idle");
                } else if (animation.indexOf("move_2") > 0) {
                    animation = animation.replace("move_2", "idle_3");
                } else if (animation.indexOf("move_3") > 0) {
                    animation = animation.replace("move", "idle");
                } else if (animation.indexOf("move_4") > 0) {
                    animation = animation.replace("move_4", "idle_1");
                } else {
                    animation = animation.replace("move_4", "idle_1");
                }
                break;
            case CharactorState.run:
                animation = "reward_show_1";
                this.skeleton.setAnimation(0, "reward_show_1", false)
                break;

            case CharactorState.sitdown:
                animation = "reward_show_1";
                break;

            case CharactorState.stop_move:
                break;
            case CharactorState.sitdown_run:
                animation = "reward_show_1";
                break;
        }
        if (animation != this.skeleton.animation) {
            this.skeleton.setMix(this.skeleton.animation, animation, 0.1);
            this.skeleton.setAnimation(0, animation, animation != "reward_show_1" || (animation == "reward_show_1" && value == CharactorState.sitdown))
        }
    }

    private _alpha: number = 1;
    public get alpha(): number {
        return this._alpha;
    }
    public set alpha(value: number) {
        this._alpha = value;
        this.node.opacity = Math.floor(255 * (value / 1))
    }

    public sceneMap: SceneMap = null;

    /**
     *玩家当前所站在的地图节点 
     */
    private _currentNode: RoadNode;

    //public isScrollScene:boolean = false;

    public moving: boolean = false;

    public moveSpeed: number = 48;

    private _moveAngle: number = 0;

    private _roadNodeArr: RoadNode[] = [];
    private _nodeIndex: number = 0;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
    }

    start() {

        //this.movieClip.stop();
        this.direction = 0;
        this.state = 3;
        this.node.anchorY = 0.25;
    }

    update(dt) {
        if (!this.sceneMap) {
            return;
        }
        this.node.zIndex = 9999 - this.node.y;
        if (this.moving) {
            var nextNode: RoadNode = this._roadNodeArr[this._nodeIndex];
            var dx: number = nextNode.px - this.node.x;
            var dy: number = nextNode.py - this.node.y;

            var speed: number = this.moveSpeed * dt;
            if (dx * dx + dy * dy >= speed * speed) {
                if (this._moveAngle == 0) {
                    this._moveAngle = Math.atan2(dy, dx);

                    var dire: number = Math.round((-this._moveAngle + Math.PI) / (Math.PI / 4));
                    this.direction = dire > 5 ? dire - 6 : dire + 2;
                }

                var xspeed: number = Math.cos(this._moveAngle) * speed;
                var yspeed: number = Math.sin(this._moveAngle) * speed;
                this.node.x += xspeed;
                this.node.y += yspeed;

            } else if (dx * dx + dy * dy > speed) {
                this.node.x = nextNode.px;
                this.node.y = nextNode.py;
            } else {
                this._moveAngle = 0;

                if (this._nodeIndex == this._roadNodeArr.length - 1) {
                    this.node.x = nextNode.px;
                    this.node.y = nextNode.py

                    this.stop();
                } else {
                    this.walk();
                }
            }
            // this.node.getChildByName("test").rotation = 360 - this.direction * 45 + 90;

        }
        this.setPlayerStateByNode();

    }

    public setPlayerStateByNode(): void {
        if (!this.sceneMap) {
            return;
        }
        var node: RoadNode = this.sceneMap.getMapNodeByPixel(this.node.x, this.node.y);

        if (node == this._currentNode) {
            return;
        }

        this._currentNode = node

        if (this._currentNode) {
            switch (this._currentNode.value) {
                case 2://如果是透明节点时
                    if (this.alpha != 0.4) {
                        this.alpha = 0.4;
                    }
                    break;
                case 3://如果是透明节点时
                    //trace("走到该节点传送");
                    //this.alpha < 1 && (this.alpha = 1);
                    this.alpha > 0 && (this.alpha = 0);
                    break;
                default:
                    this.alpha < 1 && (this.alpha = 1);

            }

        }

    }

    gateId:string = "";
    /**
     * 根据路节点路径行走
     * @param roadNodeArr 
     */
    public walkByRoad(roadNodeArr: RoadNode[],gateId) {
        this.gateId = gateId;
        this._roadNodeArr = roadNodeArr;
        this._nodeIndex = 0;
        this._moveAngle = 0;

        this.walk();
        this.move();
    }

    private walk() {
        if (this._nodeIndex < this._roadNodeArr.length - 1) {
            this._nodeIndex++;
        } else {

        }
    }

    public move() {
        this.moving = true;
        this.state = CharactorState.run;
    }

    public stopAndMove() {
        this.moving = true;
        this.state = CharactorState.stop_move;
    }

    public stop() {
        this.moving = false;
        this.state = CharactorState.stand;
        let id = parseInt(this.node.name.split("_")[1]);
        if (id != 3 && id != 5 && id != 7 && id != 9) {
            // cc.log(this.id,this.node.x,this.node.y);
            // this.node.getComponent(NpcClickComponent).randomLabAnimDoor(this.gateId);
        }
    }

    public down() {
        this.moving = false;
        this.state = CharactorState.sitdown;
    }
}
