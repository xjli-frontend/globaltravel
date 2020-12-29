/*
 * @CreateTime: Dec 17, 2018 10:58 AM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 17, 2018 11:25 AM
 * @Description: Modify Here, Please 
 */


const SCROLL_DEACCEL_RATE  =  0.966
const SCROLL_DEACCEL_DIST  = 1.0
const BOUNCE_DURATION      = 0.15
const INSET_RATIO          = 0.2

const { ccclass, property } = cc._decorator;

 export class PickerCell{

    private _container:cc.Node = null;
    private _child:cc.Node = null;

    private lab:cc.Label = null;
    _value:number = 0;

    constructor(container:cc.Node){
        this._container = container;
        this._child = new cc.Node;
        container.addChild(this._child);
        let lab_node = new cc.Node();
        this.lab = lab_node.addComponent(cc.Label);
        this._child.addChild(lab_node);
    }

    set direction(val:PickerDirection){

    }
    set x(val:number){
        this._child.x = val;
    }
    get x():number{
        return this._child.x;
    }
    set y(val:number){
        this._child.y = val;
    }
    get y():number{
        return this._child.y;
    }
    setContentSize(w:number,h:number){
        this._child.setContentSize(w,h)
        this.lab.node.y = -h/2;
    }
    moveByDx(val:number){
        this._child.x = this._child.x+val;
    }
    moveByDy(val:number){
        this._child.y = this._child.y+val;
    }

    set value(val:number){
        this._value = val;
        this.lab.string = ""+val;
    }
    get value(){
        return this._value;
    }
 }

const middlePoint = (p1:cc.Vec2,p2:cc.Vec2)=>{
     return cc.v2( (p1.x+p2.x)/2,(p1.y+p2.y)/2, )
}
const distancePoint = (p1:cc.Vec2,p2:cc.Vec2)=>{
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    return Math.sqrt( dx * dx + dy * dy );
}

export enum PickerDirection
{
    HORIZONTAL = 0,
    VERTICAL = 1
};


const deaccelerateScrollingMode = 1<<1;
const clickDeaccelerateScrollingMode = 1<<2;

 @ccclass
 export class UINumberPicker extends cc.Component{

    @property(cc.Node)
    content:cc.Node = null;

    @property(cc.Integer)
    private _virtualItemCount:number = 5;
    @property
    public set virtualItemCount(value: number) {
        if (value < 3){
            cc.error("virtualItemCount 必须大于2")
        }
        if (value%2 == 0){
            value -= 1;
        }
        this._virtualItemCount = value;
        this.invalidateDisplayList();
    }
    public get virtualItemCount(): number {
        return this._virtualItemCount;
    }

    _pickerDirection: PickerDirection = PickerDirection.VERTICAL;
    public set direction(value: PickerDirection) {
        this._pickerDirection = value;
        this.invalidateDisplayList();
    }
    public get direction(): PickerDirection {
        return this._pickerDirection;
    }

    isInvaildDisplay:boolean = false; 

    m_bIsScrolling:boolean = false;

    m_bTouchMoved:boolean = false;

    m_fTouchLength:number = 0;

    scrollUniformSpeed:number = 2.5;

    m_tScrollDistance:cc.Vec2 = cc.v2(0,0);

    clickMoveDis:number = 0;

    item_height:number = 0;
    item_width:number = 0;

    _selectedItem:PickerCell = null;

    m_maxValue=100;
    m_minValue=0;
    show_value=0;

    displayRect:cc.Rect = cc.rect(0,0,0,0);
    
    sortChildrenArray:Array<PickerCell> = [];

    m_pTouches:Array<cc.Touch> = [];

    m_middleCellIndex:number = 0;

    
    m_tTouchPoint:cc.Vec2 = null;
    m_bDragging:boolean = false;
   
    rollMode:number = 0;
   
    onLoad(){
        this.content.anchorX = 0;
        this.content.anchorY = 0;
        
        this.displayRect.width = this.content.width;
        this.displayRect.height = this.content.height;
        this.displayRect.x = 0;
        this.displayRect.y = 0;

        this.content.on( cc.Node.EventType.TOUCH_START, this.onTouchBegan, this);
        this.content.on( cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.content.on( cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
        this.content.on( cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnded, this);
        this.invalidateDisplayList();
    }

    setDataprovider( minValue:number,  maxValue:number,  showValue:number){
        this.m_minValue = minValue;
        this.m_maxValue = maxValue;
        this.show_value = showValue;
        this.invalidateDisplayList();

    }
    
    updateDisplayList(){
        this.rollMode = 0;
        this._selectedItem = null;
        this.sortChildrenArray = [];
        this.content.removeAllChildren();
        if ( this.direction === PickerDirection.HORIZONTAL ){
            this.item_height = this.content.height;
            this.item_width = this.content.width/this._virtualItemCount;
        }else{
            this.item_height = this.content.height/this._virtualItemCount;
            this.item_width = this.content.width;
        }

        let numOfCell = this.virtualItemCount + 2;

        this.m_middleCellIndex = Math.floor(numOfCell/2);// 3
        if ( this.show_value < this.m_minValue || this.show_value > this.m_maxValue) {
            this.show_value = this.m_minValue;
        }
        let upIndex = this.show_value - 1;
        let downIndex = this.show_value;
        let m_middleCellIndex = this.m_middleCellIndex; // 3
        let item_height = this.item_height;
        let item_width = this.item_width;

        for (let i=0;i<numOfCell;i++){
            let cell = new PickerCell(this.content);
            cell.setContentSize(this.item_width,this.item_height);
            cell.direction = this.direction;
            switch(this.direction){
                case PickerDirection.VERTICAL:{
                    cell.x = this.content.width/2;
                    if (i <= m_middleCellIndex) {
                        cell.y = (m_middleCellIndex - i) * item_height;
                        cell.value = downIndex;
                        downIndex += 1;
                        if (downIndex > this.m_maxValue) {
                            downIndex = this.m_minValue;
                        }
                    } else {
                        cell.y = i * item_height;
                        if (upIndex < this.m_minValue) {
                            upIndex = this.m_maxValue;
                        }
                        cell.value = upIndex;
                        upIndex -= 1;
                    }
                    break;
                }
                case PickerDirection.HORIZONTAL:{
                    cell.y = 0;
                    if (i <= m_middleCellIndex) {
                        cell.x = (m_middleCellIndex - i) * item_width;
                        cell.value = downIndex;
                        downIndex += 1;
                        if (downIndex > this.m_maxValue) {
                            downIndex = this.m_minValue;
                        }
                    }
                    else {
                        cell.x = i * item_width;
                        if (upIndex < this.m_minValue) {
                            upIndex = this.m_maxValue;
                        }
                        cell.value = upIndex;
                        upIndex -= 1;
                    }
                    break;
                }
            }
            if (i==0){
                this.setCell(cell);
            }
            this.sortChildrenArray.push(cell);
        }
    }

    private containsTouchObject( touch:cc.Touch){
        for (let touch of this.m_pTouches){
            if (touch.getID() === touch.getID()){
                return true;
            }
        }
        return false;
    }
    convertTouchToNodeSpace(touch:cc.Touch){
        return this.content.convertToNodeSpace(touch.getLocation())
    }
    private onTouchBegan(event:cc.Event.EventTouch){
        do{
            if (this.m_pTouches.length > 2 || this.m_bTouchMoved){
                break;
            }
            let touchPos = this.convertTouchToNodeSpace(event.touch);
            if ( !this.displayRect.contains(touchPos)){
                break;
            }
            this.rollMode = 0;
            if ( !this.containsTouchObject(event.touch)){
                this.m_pTouches.push(event.touch);
            }
            if (this.m_pTouches.length == 1){
                this.m_tTouchPoint = touchPos;
                this.m_bTouchMoved = false;
            
                this.m_bDragging = true;
                this.m_tScrollDistance.x = 0;
                this.m_tScrollDistance.y = 0;
                this.m_fTouchLength = 0;
            }else {
                let p1:cc.Vec2 = null;
                if (this.m_pTouches[0].getID() == event.touch.getID()){
                    p1 = touchPos;
                }else{
                    p1 = this.convertTouchToNodeSpace(this.m_pTouches[0]);
                }
                let p2:cc.Vec2 = null;
                if (this.m_pTouches[1].getID() == event.touch.getID()){
                    p2 = touchPos;
                }else{
                    p2 = this.convertTouchToNodeSpace(this.m_pTouches[1]);
                }
                this.m_tTouchPoint = middlePoint(p1,p2);
                this.m_fTouchLength = distancePoint(p1,p2);
                this.m_bDragging = false;
            }
        }while(false)   
    }

    private onTouchMoved(event:cc.Event.EventTouch){
        do{
            if (this.containsTouchObject(event.touch) && this.m_bDragging){
                if (this.m_pTouches.length === 1){
                    this.m_bTouchMoved = true;
                    let newPoint = this.convertTouchToNodeSpace(this.m_pTouches[0]);
                    this.m_tScrollDistance.x = newPoint.x - this.m_tTouchPoint.x;
                    this.m_tScrollDistance.y = newPoint.y - this.m_tTouchPoint.y;
                    this.m_tTouchPoint.set(newPoint);
                    if ( this.displayRect.contains( newPoint ) ){
                        this.moveAllCell(this.m_tScrollDistance);
                    }
                }
            }
        }while(false)
    }

    private onTouchEnded(event:cc.Event.EventTouch){
        do{
            if (this.containsTouchObject(event.touch)){
                if (this.m_pTouches.length === 1){
                    if (this.m_bTouchMoved){
                        //手指放开，自由移动
                        this.rollMode = this.rollMode | deaccelerateScrollingMode;
                        // this.schedule( this.deaccelerateScrolling,0 );
                    }else{
                        //判断当前时一个单击行为，获取当前点击的是哪一个Item；
                        this.setSelectedItem( this.itemForPoint(this.m_tTouchPoint));
                    }
                }
                for (let i=0;i<this.m_pTouches.length;i++){
                    if ( this.m_pTouches[i].getID() === event.touch.getID() ){
                        this.m_pTouches.splice(i,1);
                        break;
                    }
                }
            }
            if (this.m_pTouches.length === 0){
                this.m_bDragging = false;
                this.m_bTouchMoved = false;
            }
        }while(false)
    }
    refreshValue(value:number){
        if (value > this.m_maxValue || value < this.m_minValue) {
            value = this.m_minValue;
        }
        let hasfind = false;
        for ( let i = 0; i < this.sortChildrenArray.length; i++)  {
            let cell = this.sortChildrenArray[i];
            if (cell.value == value) {
                this.setSelectedItem(cell);
                hasfind = true;
                break;
            }
        }
        if (!hasfind) {
            this.show_value = value;
            this.invalidateDisplayList();
        }
    }

    setValue(value:number){
        if (value > this.m_maxValue || value < this.m_minValue) {
            value = this.m_minValue;
        }
        let hasfind = false;
        for ( let i = 0; i < this.sortChildrenArray.length; i++)  {
            let cell = this.sortChildrenArray[i];
            if (cell.value == value) {
                this.setSelectedItem(cell);
                hasfind = true;
                break;
            }
        }
        if (!hasfind) {
            this.refreshValue(value);
            return;
        }
    }

    setSelectedItem(cell:PickerCell){
        if (!cell){
            return;
        }
        switch(this.direction){
            case PickerDirection.VERTICAL:{
                this.clickMoveDis = -cell.y + ( 1 +  Math.floor( this.virtualItemCount/2 ) ) * this.item_height;
                break;
            }
            case PickerDirection.HORIZONTAL:{
                this.clickMoveDis = -cell.x + ( 1 +  Math.floor( this.virtualItemCount/2 ) ) * this.item_width;
                break;
            }
        }
        if ( this.clickMoveDis > 0){
            this.scrollUniformSpeed = 2;
        }else{
            this.scrollUniformSpeed = -2;
        }
        if ( Math.abs( this.clickMoveDis ) > SCROLL_DEACCEL_DIST ){
            this.rollMode = this.rollMode | clickDeaccelerateScrollingMode;
            // this.schedule( this.clickDeaccelerateScrolling ,0)
        }else{
            this.setCell(cell);
        }

    }


    setCell(cell:PickerCell){
        this._selectedItem = cell;
        this.m_bIsScrolling = false;
    }

    clickDeaccelerateScrolling(dt:number){
        switch(this.direction){
            case PickerDirection.VERTICAL:{
                this.moveAllCell( cc.v2( 0,this.scrollUniformSpeed) );
                break
            }
            case PickerDirection.HORIZONTAL:{
                this.moveAllCell( cc.v2( this.scrollUniformSpeed,0) );
                break;
            }
        }
        let oldV = this.clickMoveDis;
        this.clickMoveDis = this.clickMoveDis - this.scrollUniformSpeed;
        if ( oldV * this.clickMoveDis <= 0){
            this.rollMode = this.rollMode & ~clickDeaccelerateScrollingMode;
            // this.unschedule(this.clickDeaccelerateScrolling);
            this.relocateContainer(true);
        }
    }

    itemForPoint(p:cc.Vec2):PickerCell{
        let direction = this.direction;
        for (let cell of this.sortChildrenArray){
            switch( direction ){
                case PickerDirection.VERTICAL:{
                    if ( ( ( cell.y - this.item_height) <= p.y ) && ( cell.y >= p.y )) {
                        return cell;
                    }
                    break;
                }
                case PickerDirection.HORIZONTAL:{
                    if ( ( (cell.x - this.item_width) <= p.x) && (cell.x >= p.x) ){
                        return cell;
                    }
                    break;
                }
            }
        }
        return null;
    }

    deaccelerateScrolling(dt:number){
        if (this.m_bDragging){
            this.rollMode = this.rollMode & ~deaccelerateScrollingMode;
            // this.unschedule( this.deaccelerateScrolling );
            return;
        }
        this.m_tScrollDistance.x = this.m_tScrollDistance.x * SCROLL_DEACCEL_RATE;
        this.m_tScrollDistance.y = this.m_tScrollDistance.y * SCROLL_DEACCEL_RATE;
        this.moveAllCell(this.m_tScrollDistance);
        if ( this.m_tScrollDistance.mag() <= SCROLL_DEACCEL_DIST){
            this.m_tScrollDistance.x = 0;
            this.m_tScrollDistance.y = 0;
            // this.unschedule( this.deaccelerateScrolling);
            this.rollMode = this.rollMode & ~deaccelerateScrollingMode;
            this.relocateContainer(true);
        }

    }

    relocateContainer(value:boolean){
        //重定位子组件位置坐标
        switch ( this.direction )  {
            case PickerDirection.VERTICAL: {
                let cell = this.itemForPoint( cc.v2(0, this.content.height/2));
                this.setSelectedItem(cell);
                break;
            }
            case PickerDirection.HORIZONTAL:
            {
                let cell = this.itemForPoint( cc.v2( this.content.width/2, 0));
                this.setSelectedItem(cell);
                break;
            }
            default:
                break;
        }
    }

    moveAllCell(deltaDis:cc.Vec2){
        let item_height = this.item_height;
        let item_width = this.item_width;
        let m_middleCellIndex = this.m_middleCellIndex;
        let sortChildrenArray = this.sortChildrenArray;
        let direction = this.direction;
        switch( direction ){
            case PickerDirection.VERTICAL:{
                for (let cell of sortChildrenArray){
                    cell.moveByDy(deltaDis.y);
                    if (cell.y < -item_height){
                        cell.y = (this.virtualItemCount + 2) * item_height + cell.y;
                    }
                    if (cell.y > (this.virtualItemCount+1)* item_height){
                        let dItemY = cell.y - (this.virtualItemCount + 1) * item_height;
                        cell.y = -item_height + dItemY;
                    }
                }
                //对sortChildrenArray按坐标排序，由上到下
                sortChildrenArray.sort( ( a:PickerCell,b:PickerCell )=>{
                    if (a.y > b.y){
                        return -1;
                    }else{
                        return 1;
                    }
                } );
                break;
            }
            case PickerDirection.HORIZONTAL:{
                for (let cell of sortChildrenArray){
                    cell.moveByDx(deltaDis.x);
                    if (cell.x < -item_width){
                        cell.x = (this.virtualItemCount + 2) * item_width + cell.x;
                    }
                    if (cell.x > (this.virtualItemCount + 1)* item_width){
                        let dItemX = cell.x - (this.virtualItemCount + 1) * this.item_width;
                        cell.x = -item_width + dItemX;
                    }
                }
                //对sortChildrenArray按坐标排序，由左到右
                sortChildrenArray.sort( ( a:PickerCell,b:PickerCell )=>{
                    if (a.x > b.x){
                        return 1;
                    }else{
                        return -1;
                    }
                } );
                break;
            }
        }
        let m_maxValue = this.m_maxValue;
        let m_minValue = this.m_minValue;
        //给cell赋值
        //ps: 位于middleCellIndex索引处的cell不会重新赋值
        for ( let i = 1; i <= m_middleCellIndex; i++){
            if (sortChildrenArray[m_middleCellIndex + i - 1].value == m_maxValue){
                sortChildrenArray[m_middleCellIndex + i].value = m_minValue;
            }else{
                sortChildrenArray[m_middleCellIndex + i].value = sortChildrenArray[m_middleCellIndex + i - 1].value + 1;
            }
            if (sortChildrenArray[m_middleCellIndex - i + 1].value == m_minValue){
                sortChildrenArray[m_middleCellIndex - i].value = m_maxValue;
            } else {
                sortChildrenArray[m_middleCellIndex - i].value = sortChildrenArray[m_middleCellIndex - i + 1].value - 1;
            }
        }
    }


    invalidateDisplayList(){
        this.isInvaildDisplay = true;
    }
    update(dt){
        if (this.isInvaildDisplay){
            this.updateDisplayList();
            this.isInvaildDisplay = false;
        }else{
            if ( this.rollMode & deaccelerateScrollingMode ){
                this.deaccelerateScrolling(dt);
                return;
            }
            if ( this.rollMode & clickDeaccelerateScrollingMode ){
                this.clickDeaccelerateScrolling(dt);
                return;
            }
        }
    }
 }