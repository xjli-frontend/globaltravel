import { Message } from "../../core/event/MessageManager";
import { gui } from "../../core/gui/GUI";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import ButtonGear from "../../core/ui/button/ButtonGear";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import { HashMap } from "../../core/util/HashMap";
import main from "../../Main";
import { service } from "../../service/Service";
import { AudioMessage } from "../AudioMessage";
import { formatParams } from "../CalcTool";
import { MapControl } from "./effect/MapControl";
import ProgressAnim from "./effect/ProgressAnim";
import StoreComponent from "./StoreComponent";

let ce2 = ezaction.HCustomEase.create
("ce2", "M0,0 C0.018,0.592 0.092,0.79 0.154,0.9 0.172,0.932 0.209,1 0.268,1 0.394,1 0.572,1 1,1 ")
const rollEaseOut2 = ezaction.ease.customEase(ce2);

// const storePos_center:Array<cc.Vec2> = [cc.v2(-1375,250),cc.v2(-950,0),cc.v2(-180,810),cc.v2(250,600),
//     cc.v2(-365,-180),cc.v2(180,90),cc.v2(725,350),cc.v2(135,-400),cc.v2(700,-165),cc.v2(1225,100)];
const storePos_center:Array<cc.Vec2> = [cc.v2(-945,-220),cc.v2(-685,-387),cc.v2(-135,215),cc.v2(170,90),
    cc.v2(-235,-515),cc.v2(155,-320),cc.v2(510,-140),cc.v2(88,-680),cc.v2(500,-480),cc.v2(850,-270)];

const { ccclass, property } = cc._decorator;
@ccclass
export default class StoreOperation extends ComponentExtends {

    mainNodes:HashMap<string,cc.Node> = new HashMap<string,cc.Node>();
    
    mutiConst_1:HashMap<number,formatParams> = new HashMap<number,formatParams>();
    mutiConst_9:HashMap<number,formatParams> = new HashMap<number,formatParams>();
    mutiConst_10:HashMap<number,formatParams> = new HashMap<number,formatParams>();
    mutiConst_99:HashMap<number,formatParams> = new HashMap<number,formatParams>();
    mutiConst_100:HashMap<number,formatParams> = new HashMap<number,formatParams>();
    mutiConst_999:HashMap<number,formatParams> = new HashMap<number,formatParams>();
    mutiConst_1000:HashMap<number,formatParams> = new HashMap<number,formatParams>();

    onLoad(){
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        // this.node.active = false;
        this.mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        for(let i=1;i<11;i++){
            let _priceMuti = main.module.themeConfig.getStoreBaseConfigByTag(`store_${i}`).priceMulti;
            this.mutiConst_1.set(i,eachMuti(_priceMuti,1))
            this.mutiConst_9.set(i,eachMuti(_priceMuti,9))
            this.mutiConst_10.set(i,eachMuti(_priceMuti,10))
            this.mutiConst_99.set(i,eachMuti(_priceMuti,99))
            this.mutiConst_100.set(i,eachMuti(_priceMuti,100))
            this.mutiConst_999.set(i,eachMuti(_priceMuti,999))
            this.mutiConst_1000.set(i,eachMuti(_priceMuti,1000))
        }
    }

    
    contentNode:cc.Node = null;
    storesNode:cc.Node = null;
    onAdded(params: any) {
        this.contentNode = params["contentNode"];
        this.storesNode = params["storesNode"];
        this.currentViewStoreId = params["storeId"];
        this.setPrePosScale();
        this.mainNodes.get("btn_buy").active = main.module.vm.mainProgress.progress_3 == 1  || main.module.vm.level > 1;

    }

    refreshStoresIndex(){
        let storeIds = main.module.gameMainControl.getUnlockStoreIds();
        this.storesIndex = storeIds.indexOf(`${this.currentViewStoreId}`);
        if(storeIds.length == 1){
            this.mainNodes.get("btn_next").active = false;
            this.mainNodes.get("btn_pre").active = false;
        }else{
            this.mainNodes.get("btn_next").active =  this.storesIndex != storeIds.length-1;
            this.mainNodes.get("btn_pre").active = this.storesIndex != 0;
        }
    }


    currentStoreLv:number = 0;
    currentStoreCom:StoreComponent = null;
    priceMuti:number = 1;
    loadStoreBaseInfo(){
        if(this.currentViewStoreId == -1){
            return;
        }
        this.refreshStoresIndex();
        Message.dispatchEvent(AudioMessage.BUILD_EFFECT,this.currentViewStoreId);
        this.currentStoreCom = this.storesNode.getChildByName(`store_${this.currentViewStoreId}`).getComponent(StoreComponent);
        let storeList = main.module.vm.storeList;
        let storeInfo = storeList[`store_${this.currentViewStoreId}`];
        let store_title = this.mainNodes.get("store_title");//标题
        store_title.getComponent(LanguageLabel).dataID = `ui_store_${this.currentViewStoreId}`;
        let store_icon = this.mainNodes.get("store_icon");//标题
        store_icon.getComponent(cc.Sprite).spriteFrame = cc.loader.getRes(`main/icon/icon${this.currentViewStoreId}`,cc.SpriteFrame);
        if(this.currentViewStoreId == 6){
            store_icon.scale = 0.7;
        }
        let store_lv = this.mainNodes.get("store_lv");
        this.currentStoreLv = storeInfo["level"];
        this.priceMuti = main.module.themeConfig.getStoreBaseConfigByTag(`store_${this.currentViewStoreId}`).priceMulti;
        store_lv.getComponent(cc.Label).string = `lv. ${storeInfo["level"]}`;
        if(this.currentStoreLv  == 0 || this.currentStoreLv == 1){
            this.currentAddMuti = {
                num:1,
                numE:0
            };
        }else{
            if(this.currentViewStoreId == 1){
                if(this.currentStoreLv == 2){
                    this.currentAddMuti = {
                        num:1,
                        numE:0
                    };
                }else{
                    this.currentAddMuti = this.power(this.currentStoreLv-2);
                }
            }else{
                this.currentAddMuti = this.power(this.currentStoreLv-1);
            }
        }
        this.setBasePrice();
        this.setSpeedLab();
    }


    entryScale:number = 1;
    setPrePosScale(){
        this.entryScale =this.contentNode.scale;
    }

    prePos:cc.Vec2 = null;
    preViewId:number = -1;
    moveAnim(){
        let active = this.currentViewStoreId != -1;
        if(active){
            let targetPos = storePos_center[this.currentViewStoreId-1];
            this.prePos = targetPos;
            this.preViewId = this.currentViewStoreId;
            this.contentNode.width = 4794;
            this.contentNode.height = 4309;
            this.contentNode.RunAction(ezaction.moveTo(0.5,{x:targetPos.x,y:targetPos.y}).easing(rollEaseOut2)).onStoped(()=>{
            });
            this.contentNode.RunAction(ezaction.scaleTo(0.3,{scale:main.module.mainScene.mapControl.initScale})).onStoped(()=>{
            });;
            main.module.mainScene.showStoresName(false,this.contentNode.scale);
            main.module.gameMainControl.openStoreOperationBtnState(true);
        }else{
            this.closeNode();
        }
    }

    closeNode(){
        this.contentNode.scale = this.entryScale;
        this.contentNode.width = 3727;
        this.contentNode.height = 3240;
        main.module.gameMainControl.openStoreOperationBtnState(false);
        let mapControl = this.contentNode.getComponent(MapControl);
        mapControl.smoothOperate(this.contentNode,this.prePos,this.entryScale,false);
        if(this.preViewId != -1){
            let storeNode:cc.Node = main.module.mainScene.storesNode.getChildByName(`store_${this.preViewId}`);
            mapControl.followTargetPos(storeNode,0.2);
            this.contentNode.scale = mapControl.initScale;
            this.contentNode.RunAction(ezaction.scaleTo(0.2,{scale:this.entryScale}));
        }
        gui.customPopup.clear();
    }

    /** 当前视角显示的店铺 */
    _currentViewStoreId:number = -1;
    canClick:boolean = true;
    set currentViewStoreId(val:number){
        if(val != this._currentViewStoreId && this.canClick){
            this._currentViewStoreId = val;
            this.moveAnim();
            this.loadStoreBaseInfo();
            main.module.gameMainControl.refreshStoreProgress(val);
        }
    }

    get currentViewStoreId(){
        return this._currentViewStoreId;
    }

    setProgress(){
        let arr = this.calcNextPostProgress();
        if(arr[0] == 0){
            // this.mainNodes.get("progress").getChildByName("progress_bar").getComponent(cc.Sprite).fillRange = this.currentStoreLv/arr[1];
            this.mainNodes.get("progress").getChildByName("progress_bar").width = 392 * this.currentStoreLv/arr[1];
        }else{
            // this.mainNodes.get("progress").getChildByName("progress_bar").getComponent(cc.Sprite).fillRange = (this.currentStoreLv-arr[0])/(arr[1]-arr[0]);
            this.mainNodes.get("progress").getChildByName("progress_bar").width = 392 * (this.currentStoreLv-arr[0])/(arr[1]-arr[0]);
        }
        // this.mainNodes.get("progress").getChildByName("progress_light").x = -210 + 
        //     this.mainNodes.get("progress").getChildByName("progress_bar").getComponent(cc.Sprite).fillRange * 
        //         this.mainNodes.get("progress").getChildByName("progress_bar").width;
        let maxLv = main.module.themeConfig.getStoreMaxLvById(this.currentViewStoreId);
        if(this.currentStoreLv >= maxLv){
            this.mainNodes.get("progress").getChildByName("progress_lab").getComponent(cc.Label).string = `max`;
            this.mainNodes.get("progress").getChildByName("progress_bar").width = 392;
            // this.mainNodes.get("progress").getChildByName("progress_bar").getComponent(cc.Sprite).fillRange = 1;
        }else{
            this.mainNodes.get("progress").getChildByName("progress_lab").getComponent(cc.Label).string = `+${this.currentUpLv}`;
            if(!main.module.calcTool.compare( main.module.vm.credit, this.currentCostPrice) && this.currentLvGear == -1){
                this.mainNodes.get("progress").getChildByName("progress_lab").getComponent(cc.Label).string = ``;
            }
        }
        this.setSupProgress();
    }

    setSupProgress(){
        let arr = this.calcNextPostProgress();
        let _currentStoreLv = this.currentStoreLv+this.currentUpLv;
        let maxLv = main.module.themeConfig.getStoreMaxLvById(this.currentViewStoreId);
        if(_currentStoreLv >= maxLv || !this.currentCostPrice){
            // this.mainNodes.get("progress").getChildByName("progress_sup").getComponent(cc.Sprite).fillRange = 0;
            this.mainNodes.get("progress").getChildByName("progress_sup").width = 0;
            return;
        }
        if(!main.module.calcTool.compare( main.module.vm.credit, this.currentCostPrice) && this.currentLvGear == -1){
            _currentStoreLv = this.currentStoreLv;
        }
        if(this.currentStoreLv >= maxLv){
            // this.mainNodes.get("progress").getChildByName("progress_sup").getComponent(cc.Sprite).fillRange = 1;
            this.mainNodes.get("progress").getChildByName("progress_sup").width = 392;
        }
        if(arr[0] == 0){
            // this.mainNodes.get("progress").getChildByName("progress_sup").getComponent(cc.Sprite).fillRange = _currentStoreLv/arr[1];
            let _width = _currentStoreLv/arr[1]>1?1:_currentStoreLv/arr[1];
            this.mainNodes.get("progress").getChildByName("progress_sup").width = 392 * _width;
        }else{
            // this.mainNodes.get("progress").getChildByName("progress_sup").getComponent(cc.Sprite).fillRange = (_currentStoreLv-arr[0])/(arr[1]-arr[0]);
            let _width = (_currentStoreLv-arr[0])/(arr[1]-arr[0])>1?1:(_currentStoreLv-arr[0])/(arr[1]-arr[0]);
            this.mainNodes.get("progress").getChildByName("progress_sup").width = 392 * _width;
        }
        //这里调setSpeedLab没有调setSupSpeed是因为改变SupProgress计算时如果不同步刷新this.returnReward，会导致当前店铺是用的其它店铺的this.returnReward进行计算，有一次计算会有问题比如出现负数，虽然很快会刷过去。
        this.setSpeedLab();
    }

    returnReward:formatParams = null;
    setSpeedLab(){
        let collectSpeedData = main.module.gamedata.storeBaseRewardList;
        let storeList = main.module.vm.storeList;
        let storeInfo = storeList[`store_${this.currentViewStoreId}`];
        let storeSpeedInfo = collectSpeedData.get(`store_${this.currentViewStoreId}`);
        this.mainNodes.get("layout2").active = true;
        this.mainNodes.get("speed").x = 50;
        if(collectSpeedData && storeInfo["level"] > 0){
            let currentTimeSpanTotal = storeSpeedInfo.get("timeStamp") as number;
            if( currentTimeSpanTotal<100 && currentTimeSpanTotal!=0 ){
                let returnReward = storeSpeedInfo.get("rewardAvg") as formatParams;
                let rewardTotalGear = main.module.calcTool.formatNum( returnReward )
                this.mainNodes.get("speed_lab").getComponent(cc.Label).string = `${rewardTotalGear.base}${rewardTotalGear.gear}/s`;
                this.mainNodes.get("speed_time").getComponent(cc.Label).string = `1s`;
                this.mainNodes.get("layout2").active = false;
                this.mainNodes.get("speed").x = 0;
                this.returnReward = returnReward;
            }else{
                let returnReward = storeSpeedInfo.get("reward") as formatParams;
                this.mainNodes.get("speed_lab").getComponent(LabelChangeSymbol).num = returnReward ;
                let rewardTotalGear = main.module.calcTool.formatNum(returnReward);
                this.mainNodes.get("speed_lab").getComponent(cc.Label).string = `${rewardTotalGear.base}${rewardTotalGear.gear}`;
                this.mainNodes.get("speed_time").getComponent(cc.Label).string = `${storeSpeedInfo.get("timeStamp") as number/1000}s`;
                this.returnReward = returnReward;
            }
        }else{
            this.mainNodes.get("speed_lab").getComponent(cc.Label).string = `0`;
            this.mainNodes.get("speed_time").getComponent(cc.Label).string = ``;
            this.returnReward = {num:0,numE:0};
        }
        this.setSupSpeed();
    }

    setSupSpeed(){
        if(!this.returnReward){
            this.mainNodes.get("speed_sup_title").active = false;
            this.mainNodes.get("speed_sup_lab").active = false;
            return;
        }
        let canUpLv = 0;
        let maxLv = main.module.themeConfig.getStoreMaxLvById(this.currentViewStoreId);
        if(this.currentStoreLv >= maxLv){
            canUpLv = 0;
        }else{
            canUpLv = this.currentUpLv;
            if(!main.module.calcTool.compare( main.module.vm.credit, this.currentCostPrice) && this.currentLvGear == -1){
                canUpLv = 0;
            }
        }
        let storeListSup = this.storeListSupport(canUpLv)
        if(storeListSup){
            let rewardStore = main.module.calcUiShow.calcCollectSpeedSupport(storeListSup,this.currentViewStoreId);
            this.mainNodes.get("speed_sup_title").active = true;
            this.mainNodes.get("speed_sup_lab").active = true;
            let supReward = rewardStore.get("reward") as formatParams;
            let time = "";
            if(rewardStore.get("timeStamp")<100){
                time = `/s`;
            }
            let result = main.module.calcTool.formatNum(supReward);
            let resultStr = `${result.base}${result.gear}`;
            this.mainNodes.get("speed_sup_lab").getComponent(cc.Label).string = `${resultStr}${time}`;
        }else{
            this.mainNodes.get("speed_sup_title").active = false;
            this.mainNodes.get("speed_sup_lab").active = false;
        }
    }

    storeListSupport(canUpLv:number){
        if(canUpLv<=0){
            return null;
        }
        let storeList = main.module.vm.storeList;
        let resultList: Object = {};
        for (let key in storeList) {
            if (storeList[key]["id"] == this.currentViewStoreId) {
                resultList[key] = {
                    id: storeList[key]["id"],
                    level: storeList[key]["level"] + canUpLv
                }
            } else {
                resultList[key] = {
                    id: storeList[key]["id"],
                    level: storeList[key]["level"]
                }
            }
        }
        return resultList;
    }

    /**当前档位 */
    currentLvGear:number = 1;
    setLvGear(lv?){
        if(this.currentViewStoreId == -1){
            return;
        }
        if(main.module.vm.noviceProgress.novice_11 == 0){
            lv = 1;
        }
        if(!lv){
            lv = main.module.vm.gear;
        }
        let btnNode: cc.Node = this.mainNodes.get("btn_buy");
        let index = 0;
        btnNode.children.forEach((child,_index) => {
            if (child.name == lv + "") {
                child.active = true;
                index = _index;
            } else {
                child.active = false;
            }
            if(child.name == "batch"){
                child.active = true;
            }
        })
        btnNode.getComponent(ButtonGear).currentFrameIndex = index;
        this.currentLvGear = lv;
        main.module.vm.gear = lv;
        this.maxUpLv = 0;
        this.setPriceLab();
    }

    currentAddMuti:formatParams = {
        num:1,
        numE:0
    };
    /**设置升currentLvGear级需要的钱 */
    maxUpLv:number = 0;
    maxAddMuti:formatParams = null;
    resultAddMuti = {
        num:0,numE:0
    };
    /**当前升级 */
    currentUpLv:number = 1;
    setPriceLab(){
        if(!this.basePrice){
            return;
        }
        let calcUiShow = main.module.calcUiShow;
        let calcTool = main.module.calcTool;
        let maxLv = main.module.themeConfig.getStoreMaxLvById(this.currentViewStoreId);
        if(this.currentStoreLv >= maxLv){
            this.mainNodes.get("btn_buy").children.forEach((child)=>{
                if(child.name == "-1"){
                    child.active = true;
                }else{
                    child.active = false;
                }
            })
            this.setProgress();
            this.mainNodes.get("max_num").getComponent(cc.Label).string = `max`;
            this.mainNodes.get("price_lab").getComponent(LabelChangeSymbol).string = "max";
            this.showButtonEffect(this.mainNodes.get("btn_up"),false);
            return;
        }
        if(this.currentLvGear < 0 && this.currentStoreLv > 0){//最大化
            let countAddMuti = calcTool.calcMutiNum(this.currentAddMuti,this.mutiConst_1.get(this.currentViewStoreId));
            if(this.currentStoreLv == 1 && this.currentViewStoreId == 1){
                countAddMuti = this.currentAddMuti;
            }
            let _price = calcTool.calcMutiNum( this.basePrice,countAddMuti );
            this.currentCostPrice = _price;
            if(!calcTool.compare(main.module.vm.credit,_price)){
                this.mainNodes.get("price_lab").getComponent(LabelChangeSymbol).num = _price;
                this.currentUpLv = 1;
                this.maxUpLv = 0;
            }else{
                this.maxAddMuti = this.currentAddMuti;
                let nextPrice = calcUiShow.calcTargetPrice( `store_${this.currentViewStoreId}`,this.currentStoreLv, this.maxUpLv+1);
                let _countAddMuti = this.currentAddMuti;
                if(calcTool.compare(main.module.vm.credit,nextPrice)){
                    let lv = 0;
                    let hundIndex = 0;
                    this.resultAddMuti = {
                        num:0,numE:0
                    };
                    let func10 = (_countAddMuti)=>{
                        let _resultAddMuti = calcTool.calcAddNum(this.resultAddMuti,_countAddMuti,false);
                        if(calcTool.compare(main.module.vm.credit,
                            calcTool.calcMutiNum( this.basePrice,_resultAddMuti))
                                && (this.currentStoreLv+lv) <= maxLv){
                                this.resultAddMuti = _resultAddMuti;
                        }
                        return _resultAddMuti;
                    }
                    while(calcTool.compare(main.module.vm.credit,
                        calcTool.calcMutiNum( this.basePrice,
                            func10(calcTool.calcMutiNum(_countAddMuti,this.calcMutiFunc(100,hundIndex == 0))))
                                )
                            && (this.currentStoreLv+lv) <= maxLv){
                            lv+=100;
                            _countAddMuti = this.power(this.currentStoreLv + lv - 1)
                            if(this.currentViewStoreId == 1){
                                _countAddMuti = this.power(this.currentStoreLv + lv-2)
                            }
                            hundIndex++;
                    }

                    let tenIndex = 0;
                    while(calcTool.compare(main.module.vm.credit,
                        calcTool.calcMutiNum( this.basePrice,
                            func10(calcTool.calcMutiNum(_countAddMuti,this.calcMutiFunc(10,hundIndex == 0 && tenIndex == 0))))
                                )
                            && (this.currentStoreLv+lv) <= maxLv){
                            lv+=10;
                            _countAddMuti = this.power(this.currentStoreLv + lv - 1)
                            if(this.currentViewStoreId == 1){
                                _countAddMuti = this.power(this.currentStoreLv + lv - 2 )
                            }
                            tenIndex++;
                    }
                    
                    let onceIndex = 0;
                    let onceAddMuti = _countAddMuti;
                    while(calcTool.compare(main.module.vm.credit,
                        calcTool.calcMutiNum( this.basePrice,
                            calcTool.calcAddNum(this.resultAddMuti,
                                calcTool.calcMutiNum(_countAddMuti,this.calcMutiFunc(onceIndex+1,hundIndex == 0 && tenIndex == 0)),false)
                            ))
                            && (this.currentStoreLv+lv) <= maxLv){
                                let  log = calcTool.calcAddNum(this.resultAddMuti,
                                calcTool.calcMutiNum(_countAddMuti,this.calcMutiFunc(onceIndex+1,hundIndex == 0 && tenIndex == 0)),false)
                            lv+=1;
                            onceIndex++;
                    }
                    
                    this.currentUpLv = lv;
                    this.maxUpLv = lv;
                    if((this.currentStoreLv+lv) >= maxLv){
                        this.currentUpLv = maxLv-this.currentStoreLv;
                        this.maxUpLv = maxLv-this.currentStoreLv;
                    }
                    if(onceIndex > 0){
                        _countAddMuti = calcTool.calcMutiNum(onceAddMuti,this.calcMutiFunc(onceIndex,hundIndex == 0 && tenIndex == 0))
                        this.resultAddMuti = calcTool.calcAddNum(this.resultAddMuti, _countAddMuti,false)
                    }
                    let _maxPrice = calcTool.calcMutiNum( this.basePrice,this.resultAddMuti);
                    this.maxAddMuti = _countAddMuti;
                    if(this.currentStoreLv == 1 && this.maxUpLv == 1 ){
                        if(this.currentViewStoreId == 1){
                            _maxPrice = this.basePrice;
                            this.maxAddMuti = {
                                num:1,
                                numE:0
                            };
                        }else{
                            _maxPrice = calcTool.calcMutiNum( this.basePrice,this.mutiConst_1.get(this.currentViewStoreId) );
                            this.maxAddMuti = this.mutiConst_1.get(this.currentViewStoreId);
                        }
                    }
                    this.currentCostPrice = _maxPrice;
                    this.mainNodes.get("price_lab").getComponent(LabelChangeSymbol).num = _maxPrice;
                }
                else{
                    this.currentUpLv = this.maxUpLv;
                    let _maxPrice = calcUiShow.calcTargetPrice( `store_${this.currentViewStoreId}`,this.currentStoreLv, this.maxUpLv);
                    this.currentCostPrice = _maxPrice;
                    this.mainNodes.get("price_lab").getComponent(LabelChangeSymbol).num = _maxPrice;
                }
            }
        }else{
            if( (this.currentStoreLv+this.currentLvGear) > maxLv ){
                let countAddMuti = calcTool.calcMutiNum(this.currentAddMuti,eachMuti(this.priceMuti,maxLv-this.currentStoreLv));
                let price = calcTool.calcMutiNum( this.basePrice,countAddMuti );
                this.currentCostPrice = price;
                this.mainNodes.get("price_lab").getComponent(LabelChangeSymbol).num = price;
                this.currentUpLv = maxLv-this.currentStoreLv;
                this.maxUpLv = 0;
            }else{
                let add = this.mutiConst_1.get(this.currentViewStoreId) ;
                this.currentUpLv = 1;
                if(this.currentLvGear == 10){
                    add = this.mutiConst_10.get(this.currentViewStoreId);
                    this.currentUpLv = 10;
                }else if(this.currentLvGear == 100){
                    add = this.mutiConst_100.get(this.currentViewStoreId);
                    this.currentUpLv = 100;
                }
                let countAddMuti = calcTool.calcMutiNum(this.currentAddMuti,add);
                let price = calcTool.calcMutiNum( this.basePrice,countAddMuti );
                
                if(this.currentViewStoreId == 1 && this.currentStoreLv == 1 && this.currentLvGear != 1){
                    price = calcTool.calcDivideNum( price,{num:this.priceMuti,numE:0});
                }else if(this.currentViewStoreId == 1 && this.currentStoreLv == 1 && this.currentLvGear == 1){
                    price = this.basePrice;
                }else if(this.currentViewStoreId == 1 && this.currentStoreLv == 0){
                    price = {
                        num:0,
                        numE:0
                    }
                }else if(this.currentStoreLv == 0){
                    price = this.basePrice;
                }
                let checkPrice = main.module.themeConfig.getStoreLvConfigByTag(`store_${this.currentViewStoreId}`,this.currentStoreLv+1); 
                let _checkPrice = calcTool.formatNum({
                    num:checkPrice.price,
                    numE:checkPrice.priceE
                });
                let _price =calcTool.formatNum(price);
                let targetPrice = main.module.calcUiShow.calcTargetPrice(`store_${this.currentViewStoreId}`,this.currentStoreLv,this.currentUpLv);
                _checkPrice = calcTool.formatNum(targetPrice) ;
                if(this.currentLvGear != 1){
                }
                if( _checkPrice.base == _price.base  && _checkPrice.gear == _price.gear){
                }else{
                    if(this.currentStoreLv != 0){
                        cc.warn(`配置${_checkPrice.base}${_checkPrice.gear},计算${_price.base}${_price.gear}当前等级${this.currentStoreLv}下一级需要金币计算错误`);
                    }
                }
                this.currentCostPrice = price;
                this.mainNodes.get("price_lab").getComponent(LabelChangeSymbol).num = price;
                this.currentUpLv = this.currentLvGear;
                this.maxUpLv = 0;
            }
        }
        if(this.currentCostPrice.num == 0 && this.currentCostPrice.numE == 0 && this.currentViewStoreId != 1){
            this.currentCostPrice = {num:1,numE:0};
        }
        if(this.currentStoreLv == 0){
            let unlockPice:formatParams = main.module.calcUiShow.calcTargetPrice(`store_${this.currentViewStoreId}`,0,1);
            this.currentCostPrice = unlockPice;
            if(this.currentCostPrice.num == 0 && this.currentCostPrice.numE == 0 && this.currentViewStoreId != 1){
                this.currentCostPrice = {num:1,numE:0};
            }
            this.mainNodes.get("price_lab").getComponent(LabelChangeSymbol).num = unlockPice;
            this.currentUpLv = 1;
            // this.mainNodes.get("unlock_price").getComponent(LabelChangeSymbol).num = unlockPice;
        }
        this.setProgress();
        let cofig = main.module.themeConfig.getStoreSpeedLvConfigByTag(`store_${this.currentViewStoreId}`);
        let values = cofig.values();
        this.mainNodes.get("max_num").getComponent(cc.Label).string = `x${values[this.nextPostIndex].value}`;
        this.refreshBtnUpState();
    }

    refreshBtnUpState(){
        let maxLv = main.module.themeConfig.getStoreMaxLvById(this.currentViewStoreId);
        if(this.currentStoreLv >= maxLv){
            this.showButtonEffect( this.mainNodes.get("btn_up"), false);
            return;
        }
        if(!this.currentCostPrice){
            return;
        }
        this.showButtonEffect( this.mainNodes.get("btn_up"), main.module.calcTool.compare( main.module.vm.credit, this.currentCostPrice));
    }
    
    currentCostPrice:formatParams = null;
    storesIndex:number = -1;
    onTouchHandler(event: cc.Event.EventTouch) {
        if(!this.canClick){
            return;
        }
        let storeIds = main.module.gameMainControl.getUnlockStoreIds();
        let maxIndex = storeIds.length-1;
        switch (event.target.name) {
            case "btn_buy": {
                let btnNode: cc.Node = this.mainNodes.get("btn_buy");
                let index = btnNode.getComponent(ButtonGear).currentFrameIndex;
                let lv = 1;
                if (index == 0) {
                    lv = 1;
                } else if (index == 1) {
                    lv = 10;
                } else if (index == 2) {
                    lv = 100;
                } else if (index == 3) {
                    lv = -1;
                }
                this.setLvGear(lv);
                break;
            }
            case "btn_pre": {
                service.analytics.logEvent("click_side", "", "")
                if(this.storesIndex == 0){
                    return;
                }else{
                    this.storesIndex--;
                }
                this.currentViewStoreId = parseInt(storeIds[this.storesIndex]) ;
                break;
            }
            case "btn_next": {
                service.analytics.logEvent("click_side", "", "")
                if(this.storesIndex == storeIds.length-1){
                    return;
                }else{
                    this.storesIndex++;
                }
                this.currentViewStoreId = parseInt(storeIds[this.storesIndex]) ;
                break;
            }
            case "btn_close": {
                this.currentViewStoreId = -1;
                break;
            }
            case "btn_up": {
                if(!event.target.getComponent(ButtonEffect).canTouch){
                    return;
                }
                this.playUpEffect();
                this.currentStoreCom.upLvHandler(this.currentUpLv,this.currentCostPrice,this.currentStoreLv==0,()=>{
                    this.loadStoreBaseInfo();
                })
                break;
            }
        }
    }

    /** 设置基础价格  价格基数 * 加成（店员消耗扣减，声望消耗扣减）costAdd:道具消耗扣减*/
    basePrice:formatParams = null;
    setBasePrice(){
        let addition = 1;
        if(!this.node.active){
            return;
        }
        if(this.currentViewStoreId == -1){
            return;
        }
        if(main.module.vm.clerkList){//店员扣减
            let clerkTag = `clerk_${this.currentViewStoreId}`;
            let clerkLv = main.module.vm.clerkList[clerkTag]["level"];
            let clerkConfig = main.module.themeConfig.getClerkConfigBytagLv(clerkTag,clerkLv);
            let selfAddClerk = 1;
            if(clerkConfig){
                selfAddClerk = clerkConfig.clerkLevelUpCostDiv;
            }
            addition *= selfAddClerk;
        }
        if(main.module.vm.fameList){//声望扣减
            let fameTag = `fame_${this.currentViewStoreId}`;
            let fameLv = main.module.vm.fameList[fameTag]["level"];
            let fameConfig = main.module.themeConfig.getFameConfigByTagLv(fameTag,fameLv);
            let selfAddFame = 1;
            if(fameConfig){
                selfAddFame = fameConfig.levelUpCostDiv;
            }
            addition *= selfAddFame;
        }
        let propCostAdd = main.module.gameMainControl.propCostAdd;//升级消耗扣减加成
        let baseConfig = main.module.themeConfig.getStoreBaseConfigByTag(`store_${this.currentViewStoreId}`);
        this.basePrice = main.module.calcTool.calcConvertNum(baseConfig.price * addition * propCostAdd,0);
        this.setLvGear(main.module.vm.gear);

        

    }

    nextPostIndex:number = 0;
    calcNextPostProgress(){
        let cofig = main.module.themeConfig.getStoreSpeedLvConfigByTag(`store_${this.currentViewStoreId}`);
        let values = cofig.values();
        let nextPostIndex = 0;//下一个里程碑的下标   当前店铺
        for(let i=0;i<values.length;i++){
            if(this.currentStoreLv < values[i].level){
                nextPostIndex = i;
                break;
            }
        }
        if(nextPostIndex == 0){
            this.nextPostIndex = 0;
            return [0,values[nextPostIndex].level];
        }
        this.nextPostIndex = nextPostIndex;
        return [values[nextPostIndex-1].level,values[nextPostIndex].level];
    }

    /** 升级特效 */
    playUpEffect(){
        let prefab: cc.Prefab = cc.loader.getRes(`main/effect_prefab/progress_effect`, cc.Prefab);
        let _node = cc.instantiate(prefab);
        let skeleton:sp.Skeleton = this.mainNodes.get("_progress").getComponent(sp.Skeleton);
        skeleton.setAnimation(0,"reward",false);
        _node.parent = this.mainNodes.get("_progress");
        let progressAnim = this.mainNodes.get("progress").getComponent(ProgressAnim);
        progressAnim.action();
        this.scheduleOnce(()=>{
            _node.destroy();
        },2.5)
    }
    onDestroy(){
        this.contentNode = null;
        this.storesNode = null;
        this.currentStoreLv = null;
        this.currentStoreCom = null;
        this.priceMuti = null;
        this.entryScale = null;
        this.prePos = null;
        this.resultAddMuti = null;
        this.currentCostPrice = null;
        this.storesIndex = null;
        this.currentUpLv = null;
        this.basePrice = null;
        this.contentNode = null;
        this.currentLvGear = null;
        this.currentStoreLv = null;
        this._currentViewStoreId = null;
        this.mainNodes = null;
        this.currentAddMuti = null;
        this.maxAddMuti = null;
        this.maxUpLv = null;
        super.onDestroy();
    }

    power(times):formatParams{
        if(times == 0){
            return {
                num:1,
                numE:0
            };
        }else if(times == 1){
            return {
                num:this.priceMuti,
                numE:0
            };
        }else{
            let _prePriceMultiAdd =  {
                num:this.priceMuti,
                numE:0
            };;
            for(let i=0;i<times-1;i++){
                _prePriceMultiAdd = 
                    main.module.calcTool.calcConvertNum(_prePriceMultiAdd.num * this.priceMuti,_prePriceMultiAdd.numE)
            }
            return _prePriceMultiAdd;
        }
    }
    
    calcMutiFunc(gear:number,isFirst:boolean){
        if(this.currentStoreLv == 1 && this.currentViewStoreId == 1 && isFirst){
            if(gear == 1){
                return {
                    num:1,
                    numE:0
                };
            }else{
                if(gear == 10){
                    return main.module.calcTool.calcAddNum( {
                        num:1,
                        numE:0
                    },this.mutiConst_9.get(this.currentViewStoreId),false)
                }else if(gear == 100){
                    return main.module.calcTool.calcAddNum( {
                        num:1,
                        numE:0
                    },this.mutiConst_99.get(this.currentViewStoreId),false)
                }else if(gear == 1000){
                    return main.module.calcTool.calcAddNum( {
                        num:1,
                        numE:0
                    },this.mutiConst_999.get(this.currentViewStoreId),false)
                }else{
                    return main.module.calcTool.calcAddNum( {
                        num:1,
                        numE:0
                    },eachMuti(this.priceMuti,gear-1),false)
                }
                
            }
        }else{
            if(gear == 10){
                return this.mutiConst_10.get(this.currentViewStoreId);
            }else if(gear == 100){
                return this.mutiConst_100.get(this.currentViewStoreId);
            }else if(gear == 1000){
                return this.mutiConst_1000.get(this.currentViewStoreId);
            }else{
                return eachMuti(this.priceMuti,gear)
            }
        }
    }

    showButtonEffect(btnNode:cc.Node,state:boolean){
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        btnNode.color = color;
        if (btnComp){
            btnComp.canTouch = state;
        }
        let func = (_node)=>{
            if(_node.children.length == 0){
                return;
            }
            for (let child of _node.children){
                if(child.name  == "price_lab"){
                    color = new cc.Color(0,0,0);
                }
                child.color = color;
                func(child);
            }
            
        }
        func(btnNode)
    }
}

let eachMuti = (priceMuti,gear:number)=>{
    if(gear == 1){
        return {
            num:priceMuti,
            numE:0
        }
    }
    let result:formatParams = {
        num:0,
        numE:0
    }
    let _result = 0;
    let add = {
        num:1,
        numE:0
    }
    for(let i=0;i<gear;i++){
        if(i == 0){
            result = {
                num:priceMuti,
                numE:0
            }
            add = main.module.calcTool.calcMutiNum(add,{
                num:priceMuti,
                numE:0
            })
        }else{
            add = main.module.calcTool.calcMutiNum(add,{
                num:priceMuti,
                numE:0
            })
            result = main.module.calcTool.calcAddNum(result,add,false)
        }
        // _result += Math.pow(priceMuti,i+1) 
    }
    return result;
}
