
const { ccclass, property } = cc._decorator;

let EmitterMode = cc.Enum({
    /**
     * !#en Uses gravity, speed, radial and tangential acceleration.
     * !#zh 重力模式，模拟重力，可让粒子围绕一个中心点移近或移远。
     * @property {Number} GRAVITY
     */
    GRAVITY: 0,
    /**
     * !#en Uses radius movement + rotation.
     * !#zh 半径模式，可以使粒子以圆圈方式旋转，它也可以创造螺旋效果让粒子急速前进或后退。
     * @property {Number} RADIUS - Uses radius movement + rotation.
     */
    RADIUS: 1
});
/**
 * !#en Enum for particles movement type.
 * !#zh 粒子位置类型
 * @enum ParticleSystem.PositionType
 */
let PositionType = cc.Enum({
    /**
     * !#en
     * Living particles are attached to the world and are unaffected by emitter repositioning.
     * !#zh
     * 自由模式，相对于世界坐标，不会随粒子节点移动而移动。（可产生火焰、蒸汽等效果）
     * @property {Number} FREE
     */
    FREE: 0,

    /**
     * !#en
     * Living particles are attached to the world but will follow the emitter repositioning.<br/>
     * Use case: Attach an emitter to an sprite, and you want that the emitter follows the sprite.
     * !#zh
     * 相对模式，粒子会随父节点移动而移动，可用于制作移动角色身上的特效等等。（该选项在 Creator 中暂时不支持）
     * @property {Number} RELATIVE
     */
    RELATIVE: 1,

    /**
     * !#en
     * Living particles are attached to the emitter and are translated along with it.
     * !#zh
     * 整组模式，粒子跟随发射器移动。（不会发生拖尾）
     * @property {Number} GROUPED
     */
    GROUPED: 2
});

class ModeA {
    dir:cc.Vec2 = null;
    radialAccel:number = 0;
    tangentialAccel:number = 0;
    constructor(dir?, radialAccel?, tangentialAccel?) {
        this.dir = dir ? dir : cc.v2(0,0);
        this.radialAccel = radialAccel || 0;
        this.tangentialAccel = tangentialAccel || 0;
    };
} 
class ModeB {
    radius:number = 0;
    deltaRadius:number = 0;
    angle:number = 0;
    degreesPerSecond:number = 0;
    constructor( angle?, degreesPerSecond?, radius?, deltaRadius? ) {
        this.angle = angle || 0;
        this.degreesPerSecond = degreesPerSecond || 0;
        this.radius = radius || 0;
        this.deltaRadius = deltaRadius || 0;
    };
} 

class Particle{
    pos:cc.Vec2 = null;
    startPos:cc.Vec3 = null;
    color:cc.Color = null;
    deltaColor:cc.Color = null;
    size:number = null;
    deltaSize = null;
    rotation:number = null;
    deltaRotation:number = null;
    _timeToLive:number = 0;
    animations:Array<string> = null;

    public get timeToLive():number{
        return this._timeToLive;
    }
    public set timeToLive(v:number){
        this._timeToLive = v;
        if (this.node){
            if (v <=0){
                this.node.active = false;
            }else{
                if (!this.node.active){
                    this.node.active = true;
                    let index  = Math.floor( Math.random() *(this.animations.length -1) );
                    this.node.getComponent(sp.Skeleton).premultipliedAlpha = false;
                    this.node.getComponent(sp.Skeleton).setAnimation(0, this.animations[index],true);
                }
            }
        }
    }
    modeA:ModeA = null;
    modeB:ModeB = null;
    isChangeColor:boolean = false;
    drawPos:cc.Vec2 = null;
    _node:cc.Node = null;
    public set node(vn:cc.Node){
        this._node = vn;
        this._node.width = 40;
        this._node.height = 40;
        vn.active = false;
    }
    public get node(){
        return this._node;
    }
    constructor(pos?, startPos?, color?, deltaColor?, size?, deltaSize?, rotation?, deltaRotation?, timeToLive?, modeA?, modeB?){
        this.pos = pos || cc.v2(0, 0);
        this.startPos = startPos || cc.v2(0, 0);
        this.color = color || cc.color(0, 0, 0, 255);
        this.deltaColor = deltaColor || {r:0, g: 0, b:0, a:255};
        this.size = size || 0;
        this.deltaSize = deltaSize || 0;
        this.rotation = rotation || 0;
        this.deltaRotation = deltaRotation || 0;
        this.timeToLive = timeToLive || 0;
        this.modeA = modeA ? modeA : new ModeA();
        this.modeB = modeB ? modeB : new ModeB();
        this.isChangeColor = false;
        this.drawPos = cc.v2(0, 0);
    }
    update(){
        if (!this._node){
            return;
        }
        this.node.x = this.pos.x;
        this.node.y = this.pos.y;
        this.node.angle = -this.rotation;
        this.node.scale = 1;//0.5 * this.size / this._node.width;
        // this.node.color = this.color;
    }
    release(){
        if (this._node){
            this._node.removeFromParent(false);
            this._node = null;
        }
        this.modeA = null;
        this.modeB = null
    }
}
let TemporaryPoints = [
    cc.v2(),
    cc.v2(),
    cc.v2(),
    cc.v2()
];

let START_SIZE_EQUAL_TO_END_SIZE = -1;
let START_RADIUS_EQUAL_TO_END_RADIUS = -1;

let pToAngle = (vec2:cc.Vec2)=>{
    return vec2.angle(cc.v2(1.0,0))
}
let pZeroIn = (vec2:cc.Vec2)=>{
    vec2.x = 0;
    vec2.y = 0;
}

let pAddIn = (v1: cc.Vec2, v2: cc.Vec2)=>{
    v1.x = v1.x + v2.x;
    v1.y = v1.y + v2.y;
}

let pSubIn = (v1: cc.Vec2, v2: cc.Vec2 )=>{
    v1.x = v1.x - v2.x;
    v1.y = v1.y - v2.y;
}

let pIn = (v1: cc.Vec2, v2: cc.Vec2 | cc.Vec3)=>{
    v1.x = v2.x;
    v1.y = v2.y;
}

let _pointApplyAffineTransformIn =  (point, transOrY, transOrOut, out?)=> {
    let x, y, t;
    if (out === undefined) {
        t = transOrY;
        x = point.x;
        y = point.y;
        out = transOrOut;
    } else {
        x = point;
        y = transOrY;
        t = transOrOut;
    }
    out.x = t.a * x + t.c * y + t.tx;
    out.y = t.b * x + t.d * y + t.ty;
};
@ccclass
export class SpineParticle extends cc.Component{

    /**
     * spine单个金币粒子动画
     */
    @property(sp.SkeletonData)
    spinData:sp.SkeletonData = null;

    /**
     * 粒子文件
     */
    @property({
        type:cc.ParticleAsset
    })
    particleData:cc.ParticleAsset = null;

    /**
     * 是否自动播放
     */
    @property(cc.Boolean)
    autoplay:boolean= false;

    //! time elapsed since the start of the system (in seconds)
    _elapsed =  0;
    _dontTint=false;

    // Different modes
    //! Mode A:Gravity + Tangential Accel + Radial Accel
    modeA:SystemModeA=null;
    //! Mode B: circular movement (gravity, radial accel and tangential accel don't are not used in this mode)
    modeB:SystemModeB=null;

    //private POINTZERO for ParticleSystem
    _pointZeroForParticle:cc.Vec2=cc.v2(0, 0);

    //! Array of particles
    _particles:Array<Particle> = [];

    // color modulate
    //  BOOL colorModulate;

    //! How many particles can be emitted per second
    _emitCounter=0;
    //!  particle idx
    _particleIdx= 0;

    _allocatedParticles= 0;

    _isActive=false;
    particleCount=0;
    duration=0;
    _sourcePosition:cc.Vec2=null;
    _posVar:cc.Vec2= null;
    life= 0;
    lifeVar= 0;
    angle= 0;
    angleVar= 0;
    startSize= 0;
    startSizeVar= 0;
    endSize= 0;
    endSizeVar= 0;
    _startColor= null;
    _startColorVar= null;
    _endColor= null;
    _endColorVar= null;
    startSpin= 0;
    startSpinVar= 0;
    endSpin= 0;
    endSpinVar= 0;
    emissionRate= 0;
    _totalParticles= 0;
    _blendFunc= null;
    _opacityModifyRGB= false;
    positionType= null;
    autoRemoveOnFinish= false;
    emitterMode= 0;
    _position:cc.Vec2 = cc.v2(0,0)
    _particleActive:boolean = false;

    animations:Array<string> = null;
    onLoad(){
        this.emitterMode = EmitterMode.GRAVITY;
        this.modeA = new SystemModeA();
        this.modeB = new SystemModeB();
        this._blendFunc = {src:cc.macro.BlendFactor.SRC_COLOR, dst:cc.macro.BlendFactor.DST_COLOR};
        this._particles = [];
        this._sourcePosition = cc.v2(0, 0);
        this._posVar = cc.v2(0, 0);

        this._startColor = cc.color(255, 255, 255, 255);
        this._startColorVar = cc.color(255, 255, 255, 255);
        this._endColor = cc.color(255, 255, 255, 255);
        this._endColorVar = cc.color(255, 255, 255, 255);

        this._elapsed = 0;
        this._dontTint = false;
        this._pointZeroForParticle = cc.v2(0, 0);
        this._emitCounter = 0;
        this._particleIdx = 0;

        this._allocatedParticles = 0;
        this._isActive = false;
        this.particleCount = 0;
        this.duration = 0;
        this.life = 0;
        this.lifeVar = 0;
        this.angle = 0;
        this.angleVar = 0;
        this.startSize = 0;
        this.startSizeVar = 0;
        this.endSize = 0;
        this.endSizeVar = 0;

        this.startSpin = 0;
        this.startSpinVar = 0;
        this.endSpin = 0;
        this.endSpinVar = 0;
        this.emissionRate = 0;
        this._totalParticles = 0;
        this._opacityModifyRGB = false;
        this.positionType = PositionType.FREE;
        this.autoRemoveOnFinish = false;

        this.animations = [];
        if (this.spinData){
            for (let key in this.spinData.skeletonJson.animations){
                this.animations.push(key);
            }
        }

        this.initWithFile( this.particleData );
        this._particleActive = this.autoplay;
    }

    onDestroy(){
        this._particles.forEach( e=>{
            e && e.release();
        })
        this._particles = null;
        this.modeA = null;
        this.modeB = null;
        this.spinData = null;
    }
    /**
     * 播放粒子动画
     */
    play(){
        this._particleActive = true;
    }
    /**
     * 恢复
     */
    resume(){
        this._particleActive = true;
    }
    /**
     * 暂停
     */
    pause(){
        this._particleActive = false;
    }
    /**
     * 停止，这时不会再发射新的粒子，已有粒子会逐渐消亡
     */
    stopSystem (){
        this._isActive = false;
        this._elapsed = this.duration;
        this._emitCounter = 0;
    }
    /**
     * 重置所有粒子
     */
    resetSystem (){
        this._isActive = true;
        this._elapsed = 0;
        let locParticles = this._particles;
        for (this._particleIdx = 0; this._particleIdx < this.particleCount; ++this._particleIdx){
            let particle = locParticles[this._particleIdx]
            if (particle){
                particle.timeToLive = 0 ;
            }
        }
    }
    /**
     * 粒子是否已满负荷
     */
    isFull ():boolean {
        return (this.particleCount >= this._totalParticles);
    }

    createParticle(){
        let particle = new Particle();
        particle.animations = this.animations;
        let pNode = new cc.Node();
        let skeleton = pNode.addComponent(sp.Skeleton);
        skeleton.setAnimationCacheMode(sp.Skeleton.AnimationCacheMode.SHARED_CACHE);
        skeleton.enableBatch = true;
        skeleton.skeletonData = this.spinData;
        this.node.addChild(pNode);
        particle.node = pNode;
        return particle;
    }

    /**
     * 动态修改粒子动画
     * @p_num 每秒发射数量
     * @gravityx  x方向重力
     * @gravityy  y方向重力
     * @speed     速度
     * @speedVar  速度范围
     */
    addEmissionRate(p_num: number, gravityx: number = 0, gravityy: number = 0, speed: number = 0, speedVar: number = 0) {
        if( this.dictionary ){
            // this.emissionRate = p_num;
            this.dictionary.emissionRate = p_num;
            // // gravity
            // this.dictionary.gravityx = gravityx;
            // this.dictionary.gravityy = gravityy;
            // //speed
            // this.dictionary.speed = speed;
            // this.dictionary.speedVar = speedVar;
            this.initWithDictionary(this.dictionary, "");
        }
    }

    initWithFile(plistFile){
        let yy:any = this.particleData;
        cc.loader.load({
            url:yy,
            type:"plist"
        }, (err, data) => {
            if (err){
                cc.error(plistFile + "下载失败！",err);
            }
            return this.initWithDictionary(data, "");
        });
    }
    initWithTotalParticles (numberOfParticles){
        this._totalParticles = numberOfParticles;

        let locParticles = this._particles;
        locParticles.length = numberOfParticles;

        this._allocatedParticles = numberOfParticles;

        // default, active
        this._isActive = true;

        // default movement type;
        this.positionType = PositionType.GROUPED;

        // by default be in mode A:
        this.emitterMode = EmitterMode.GRAVITY;

        // default: modulate
        // XXX: not used
        //  colorModulate = YES;
        this.autoRemoveOnFinish = false;

        return true;
    }
    _valueForKey (key, dict){
        if (dict) {
            let pString = dict[key];
            return pString != null ? pString : "";
        }
        return "";
    }

    dictionary = null;
    initWithDictionary(dictionary, dirname){

        this.dictionary = dictionary;
        let locValueForKey = this._valueForKey;

        let maxParticles = parseInt(locValueForKey("maxParticles", dictionary));
        cc.log("maxParticles",maxParticles)
        // self, not super
        if (this.initWithTotalParticles(maxParticles)) {
            // angle
            this.angle = parseFloat(locValueForKey("angle", dictionary));
            this.angleVar = parseFloat(locValueForKey("angleVariance", dictionary));

            // duration
            this.duration = parseFloat(locValueForKey("duration", dictionary));

            // blend function
            this._blendFunc.src = parseInt(locValueForKey("blendFuncSource", dictionary));
            this._blendFunc.dst = parseInt(locValueForKey("blendFuncDestination", dictionary));

            // color
            let locStartColor = this._startColor;
            locStartColor.r = parseFloat(locValueForKey("startColorRed", dictionary)) * 255;
            locStartColor.g = parseFloat(locValueForKey("startColorGreen", dictionary)) * 255;
            locStartColor.b = parseFloat(locValueForKey("startColorBlue", dictionary)) * 255;
            locStartColor.a = parseFloat(locValueForKey("startColorAlpha", dictionary)) * 255;

            let locStartColorVar = this._startColorVar;
            locStartColorVar.r = parseFloat(locValueForKey("startColorVarianceRed", dictionary)) * 255;
            locStartColorVar.g = parseFloat(locValueForKey("startColorVarianceGreen", dictionary)) * 255;
            locStartColorVar.b = parseFloat(locValueForKey("startColorVarianceBlue", dictionary)) * 255;
            locStartColorVar.a = parseFloat(locValueForKey("startColorVarianceAlpha", dictionary)) * 255;

            let locEndColor = this._endColor;
            locEndColor.r = parseFloat(locValueForKey("finishColorRed", dictionary)) * 255;
            locEndColor.g = parseFloat(locValueForKey("finishColorGreen", dictionary)) * 255;
            locEndColor.b = parseFloat(locValueForKey("finishColorBlue", dictionary)) * 255;
            locEndColor.a = parseFloat(locValueForKey("finishColorAlpha", dictionary)) * 255;

            let locEndColorVar = this._endColorVar;
            locEndColorVar.r = parseFloat(locValueForKey("finishColorVarianceRed", dictionary)) * 255;
            locEndColorVar.g = parseFloat(locValueForKey("finishColorVarianceGreen", dictionary)) * 255;
            locEndColorVar.b = parseFloat(locValueForKey("finishColorVarianceBlue", dictionary)) * 255;
            locEndColorVar.a = parseFloat(locValueForKey("finishColorVarianceAlpha", dictionary)) * 255;

            // particle size
            this.startSize = parseFloat(locValueForKey("startParticleSize", dictionary));
            this.startSizeVar = parseFloat(locValueForKey("startParticleSizeVariance", dictionary));
            this.endSize = parseFloat(locValueForKey("finishParticleSize", dictionary));
            this.endSizeVar = parseFloat(locValueForKey("finishParticleSizeVariance", dictionary));

            // position
            this._position.x = parseFloat(locValueForKey("sourcePositionx", dictionary));
            this._position.y = parseFloat(locValueForKey("sourcePositiony", dictionary));
            // this.node.setPosition(parseFloat(locValueForKey("sourcePositionx", dictionary)),
            //                   parseFloat(locValueForKey("sourcePositiony", dictionary)));
            this._posVar.x = parseFloat(locValueForKey("sourcePositionVariancex", dictionary));
            this._posVar.y = parseFloat(locValueForKey("sourcePositionVariancey", dictionary));

            // Spinning
            this.startSpin = parseFloat(locValueForKey("rotationStart", dictionary));
            this.startSpinVar = parseFloat(locValueForKey("rotationStartVariance", dictionary));
            this.endSpin = parseFloat(locValueForKey("rotationEnd", dictionary));
            this.endSpinVar = parseFloat(locValueForKey("rotationEndVariance", dictionary));

            this.emitterMode = parseInt(locValueForKey("emitterType", dictionary));

            // Mode A: Gravity + tangential accel + radial accel
            if (this.emitterMode === EmitterMode.GRAVITY) {
                let locModeA = this.modeA;
                // gravity
                locModeA.gravity.x = parseFloat(locValueForKey("gravityx", dictionary));
                locModeA.gravity.y = parseFloat(locValueForKey("gravityy", dictionary));

                // speed
                locModeA.speed = parseFloat(locValueForKey("speed", dictionary));
                locModeA.speedVar = parseFloat(locValueForKey("speedVariance", dictionary));

                // radial acceleration
                let pszTmp = locValueForKey("radialAcceleration", dictionary);
                locModeA.radialAccel = (pszTmp) ? parseFloat(pszTmp) : 0;

                pszTmp = locValueForKey("radialAccelVariance", dictionary);
                locModeA.radialAccelVar = (pszTmp) ? parseFloat(pszTmp) : 0;

                // tangential acceleration
                pszTmp = locValueForKey("tangentialAcceleration", dictionary);
                locModeA.tangentialAccel = (pszTmp) ? parseFloat(pszTmp) : 0;

                pszTmp = locValueForKey("tangentialAccelVariance", dictionary);
                locModeA.tangentialAccelVar = (pszTmp) ? parseFloat(pszTmp) : 0;

                // rotation is dir
                let locRotationIsDir = locValueForKey("rotationIsDir", dictionary);
                if (locRotationIsDir !== null) {
                    locRotationIsDir = locRotationIsDir.toString().toLowerCase();
                    locModeA.rotationIsDir = (locRotationIsDir === "true" || locRotationIsDir === "1");
                }
                else {
                    locModeA.rotationIsDir = false;
                }
            } else if (this.emitterMode === EmitterMode.RADIUS) {
                // or Mode B: radius movement
                let locModeB = this.modeB;
                locModeB.startRadius = parseFloat(locValueForKey("maxRadius", dictionary));
                locModeB.startRadiusVar = parseFloat(locValueForKey("maxRadiusVariance", dictionary));
                locModeB.endRadius = parseFloat(locValueForKey("minRadius", dictionary));
                locModeB.endRadiusVar = 0;
                locModeB.rotatePerSecond = parseFloat(locValueForKey("rotatePerSecond", dictionary));
                locModeB.rotatePerSecondVar = parseFloat(locValueForKey("rotatePerSecondVariance", dictionary));
            } else {
                return false;
            }

            // life span
            this.life = parseFloat(locValueForKey("particleLifespan", dictionary));
            this.lifeVar = parseFloat(locValueForKey("particleLifespanVariance", dictionary));

            // emission Rate
            // this.emissionRate = this._totalParticles / this.life;
            if (!dictionary["emissionRate"]){
                cc.log("[GameParticle] plist文件没有 emissionRate 配置数据，可能导致粒子数偏多 "+this.particleData);
                this.emissionRate = this._totalParticles / this.life;
            }else{
                this.emissionRate = parseFloat(locValueForKey("emissionRate", dictionary));
            }
            // Set a compatible default for the alpha transfer
            this._opacityModifyRGB = false;
            return true;
        }
        return false;
    }
    /**
     * Add a particle to the emitter
     * @return {Boolean}
     */
    addParticle () {
        if (this.isFull())
            return false;

        let particle = this._particles[this.particleCount];
        if (!particle){
            particle = this.createParticle();
            this._particles[this.particleCount] = particle;
        }
        this.initParticle(particle);
        particle.node.active = true;
        particle.update();
        ++this.particleCount;
        return true;
    }
    /**
     * Initializes a particle
     * @param {Particle} particle
     */
    initParticle (particle:Particle) {
        let locRandomMinus11 = ()=>{
            return  Math.random() * 2 - 1;
        };
        // timeToLive
        // no negative life. prevent division by 0
        particle.timeToLive = this.life + this.lifeVar * locRandomMinus11();
        particle.timeToLive = Math.max(0, particle.timeToLive);

        // position
        particle.pos.x = this._sourcePosition.x + this._posVar.x * locRandomMinus11();
        particle.pos.y = this._sourcePosition.y + this._posVar.y * locRandomMinus11();

        let locParticleTimeToLive = particle.timeToLive;
        // size
        let startS = this.startSize + this.startSizeVar * locRandomMinus11();
        startS = Math.max(0, startS); // No negative value

        particle.size = startS;
        if (this.endSize === START_SIZE_EQUAL_TO_END_SIZE) {
            particle.deltaSize = 0;
        } else {
            let endS = this.endSize + this.endSizeVar * locRandomMinus11();
            endS = Math.max(0, endS); // No negative values
            particle.deltaSize = (endS - startS) / locParticleTimeToLive;
        }

        // rotation
        let startA = this.startSpin + this.startSpinVar * locRandomMinus11();
        let endA = this.endSpin + this.endSpinVar * locRandomMinus11();
        particle.rotation = startA;
        particle.deltaRotation = (endA - startA) / locParticleTimeToLive;

        // position
        if (this.positionType === PositionType.FREE)
            particle.startPos = this.node.convertToWorldSpaceAR(this._pointZeroForParticle);
        else if (this.positionType === PositionType.RELATIVE){
            particle.startPos.x = this._position.x;
            particle.startPos.y = this._position.y;
        }

        // direction
        let a = cc.misc.degreesToRadians(this.angle + this.angleVar * locRandomMinus11());

        // Mode Gravity: A
        if (this.emitterMode === EmitterMode.GRAVITY) {
            let locModeA = this.modeA, locParticleModeA = particle.modeA;
            let s = locModeA.speed + locModeA.speedVar * locRandomMinus11();

            // direction
            locParticleModeA.dir.x = Math.cos(a);
            locParticleModeA.dir.y = Math.sin(a);
            // cc.pMultIn(locParticleModeA.dir, s);
            locParticleModeA.dir.mulSelf(s)
            // radial accel
            locParticleModeA.radialAccel = locModeA.radialAccel + locModeA.radialAccelVar * locRandomMinus11();

            // tangential accel
            locParticleModeA.tangentialAccel = locModeA.tangentialAccel + locModeA.tangentialAccelVar * locRandomMinus11();

            // rotation is dir
            if(locModeA.rotationIsDir)
                particle.rotation = -cc.misc.radiansToDegrees(pToAngle(locParticleModeA.dir));
        } else {
            // Mode Radius: B
            let locModeB = this.modeB, locParitlceModeB = particle.modeB;

            // Set the default diameter of the particle from the source position
            let startRadius = locModeB.startRadius + locModeB.startRadiusVar * locRandomMinus11();
            let endRadius = locModeB.endRadius + locModeB.endRadiusVar * locRandomMinus11();

            locParitlceModeB.radius = startRadius;
            locParitlceModeB.deltaRadius = (locModeB.endRadius === START_RADIUS_EQUAL_TO_END_RADIUS) ? 0 : (endRadius - startRadius) / locParticleTimeToLive;

            locParitlceModeB.angle = a;
            locParitlceModeB.degreesPerSecond = cc.misc.degreesToRadians(locModeB.rotatePerSecond + locModeB.rotatePerSecondVar * locRandomMinus11());
        }
    }

    update(dt:number){
        if (!this._particleActive){
            return;
        }
        if (this._isActive && this.emissionRate) {
            let rate = 1.0 / this.emissionRate;
            //issue #1201, prevent bursts of particles, due to too high emitCounter
            if (this.particleCount < this._totalParticles)
                this._emitCounter += dt;

            while ((this.particleCount < this._totalParticles) && (this._emitCounter > rate)) {
                this.addParticle();
                this._emitCounter -= rate;
            }

            this._elapsed += dt;
            if (this.duration !== -1 && this.duration < this._elapsed)
                this.stopSystem();
        }
        this._particleIdx = 0;
        let worldToNodeTransform = new cc.Mat4();

        this.node.getWorldMatrix(worldToNodeTransform);
        let currentPosition = TemporaryPoints[0];
        if (this.positionType === PositionType.FREE) {
            pIn(currentPosition, this.node.convertToWorldSpaceAR(this._pointZeroForParticle));
        } else if (this.positionType === PositionType.RELATIVE) {
            currentPosition.x = this._position.x;
            currentPosition.y = this._position.y;
        }
        if (this.node.active) {
            // Used to reduce memory allocation / creation within the loop
            let tpa = TemporaryPoints[1],
                tpb = TemporaryPoints[2],
                tpc = TemporaryPoints[3];

            let locParticles = this._particles;
            while (this._particleIdx < this.particleCount) {

                // Reset the working particles
                pZeroIn(tpa);
                pZeroIn(tpb);
                pZeroIn(tpc);

                let selParticle = locParticles[this._particleIdx];
                if (!selParticle){
                    selParticle = this.createParticle();
                    locParticles[this._particleIdx] = selParticle;
                }
                // life
                selParticle.timeToLive -= dt;

                if (selParticle.timeToLive > 0) {
                    // Mode A: gravity, direction, tangential accel & radial accel
                    if (this.emitterMode === EmitterMode.GRAVITY) {

                        let tmp = tpc, radial = tpa, tangential = tpb;

                        // radial acceleration
                        if (selParticle.pos.x || selParticle.pos.y) {
                            pIn(radial, selParticle.pos);
                            radial.normalizeSelf();
                        } else {
                            pZeroIn(radial);
                        }

                        pIn(tangential, radial);
                        radial.mulSelf(selParticle.modeA.radialAccel);

                        // tangential acceleration
                        let newy = tangential.x;
                        tangential.x = -tangential.y;
                        tangential.y = newy;

                        tangential.mulSelf( selParticle.modeA.tangentialAccel);

                        pIn(tmp, radial);
                        pAddIn(tmp, tangential);
                        pAddIn(tmp, this.modeA.gravity);
                        tmp.mulSelf(dt);
                        pAddIn(selParticle.modeA.dir, tmp);


                        pIn(tmp, selParticle.modeA.dir);
                        tmp.mulSelf(dt);
                        pAddIn(selParticle.pos, tmp);
                    } else {
                        // Mode B: radius movement
                        let selModeB = selParticle.modeB;
                        // Update the angle and radius of the particle.
                        selModeB.angle += selModeB.degreesPerSecond * dt;
                        selModeB.radius += selModeB.deltaRadius * dt;

                        selParticle.pos.x = -Math.cos(selModeB.angle) * selModeB.radius;
                        selParticle.pos.y = -Math.sin(selModeB.angle) * selModeB.radius;
                    }

                    // color
                    // this._renderCmd._updateDeltaColor(selParticle, dt);

                    // size
                    selParticle.size += (selParticle.deltaSize * dt);
                    selParticle.size = Math.max(0, selParticle.size);

                    // angle
                    selParticle.rotation += (selParticle.deltaRotation * dt);

                    //
                    // update values in quad
                    //
                    let newPos = tpa;
                    if (this.positionType === PositionType.FREE || this.positionType === PositionType.RELATIVE) {
                        let diff = tpb, localStartPos = tpc;
                        // current Position convert To Node Space
                        _pointApplyAffineTransformIn(currentPosition, worldToNodeTransform, diff);
                        // start Position convert To Node Space
                        _pointApplyAffineTransformIn(selParticle.startPos, worldToNodeTransform, localStartPos);
                        pSubIn(diff, localStartPos);

                        pIn(newPos, selParticle.pos);
                        pSubIn(newPos, diff);
                    } else {
                        pIn(newPos, selParticle.pos);
                    }
                    selParticle.pos.x = newPos.x;
                    selParticle.pos.y = newPos.y;
                    // this._renderCmd.updateParticlePosition(selParticle, newPos);
                    selParticle.update();
                    // update particle counter
                    ++this._particleIdx;
                } else {
                    // life < 0
                    if (this._particleIdx !== this.particleCount -1){
                        let deadParticle = locParticles[this._particleIdx];
                        let nextParticle = locParticles[this.particleCount -1];
                        if (!nextParticle){
                            nextParticle = this.createParticle();
                            locParticles[this.particleCount -1] = nextParticle;
                        }
                        locParticles[this._particleIdx] = nextParticle;
                        locParticles[this.particleCount -1] = deadParticle;
                    }

                    --this.particleCount;
                    if (this.particleCount === 0 && this.autoRemoveOnFinish) {
                        this.enabled = false;
                        // this.unscheduleUpdate();
                        // this._parent.removeChild(this, true);
                        // this._renderCmd.updateLocalBB && this._renderCmd.updateLocalBB();
                        return;
                    }
                }
            }
        }
    }
}

class SystemModeA{
    gravity:cc.Vec2 = cc.v2(0,0);
    speed=0;
    speedVar=0;
    tangentialAccel=0;
    tangentialAccelVar=0;
    radialAccel=0;
    radialAccelVar=0;
    rotationIsDir=false;

    constructor(gravity?, speed?, speedVar?, tangentialAccel?, tangentialAccelVar?, radialAccel?, radialAccelVar?, rotationIsDir?) {
        /** Gravity value. Only available in 'Gravity' mode. */
        this.gravity = gravity ? gravity : cc.v2(0,0);
        /** speed of each particle. Only available in 'Gravity' mode.  */
        this.speed = speed || 0;
        /** speed letiance of each particle. Only available in 'Gravity' mode. */
        this.speedVar = speedVar || 0;
        /** tangential acceleration of each particle. Only available in 'Gravity' mode. */
        this.tangentialAccel = tangentialAccel || 0;
        /** tangential acceleration letiance of each particle. Only available in 'Gravity' mode. */
        this.tangentialAccelVar = tangentialAccelVar || 0;
        /** radial acceleration of each particle. Only available in 'Gravity' mode. */
        this.radialAccel = radialAccel || 0;
        /** radial acceleration letiance of each particle. Only available in 'Gravity' mode. */
        this.radialAccelVar = radialAccelVar || 0;
        /** set the rotation of each particle to its direction Only available in 'Gravity' mode. */
        this.rotationIsDir = rotationIsDir || false;
    };
}
class SystemModeB{
    startRadius=0;
    startRadiusVar=0;
    endRadius=0;
    endRadiusVar=0;
    rotatePerSecond=0;
    rotatePerSecondVar=0;
    constructor (startRadius?, startRadiusVar?, endRadius?, endRadiusVar?, rotatePerSecond?, rotatePerSecondVar?) {
        /** The starting radius of the particles. Only available in 'Radius' mode. */
        this.startRadius = startRadius || 0;
        /** The starting radius letiance of the particles. Only available in 'Radius' mode. */
        this.startRadiusVar = startRadiusVar || 0;
        /** The ending radius of the particles. Only available in 'Radius' mode. */
        this.endRadius = endRadius || 0;
        /** The ending radius letiance of the particles. Only available in 'Radius' mode. */
        this.endRadiusVar = endRadiusVar || 0;
        /** Number of degress to rotate a particle around the source pos per second. Only available in 'Radius' mode. */
        this.rotatePerSecond = rotatePerSecond || 0;
        /** Variance in degrees for rotatePerSecond. Only available in 'Radius' mode. */
        this.rotatePerSecondVar = rotatePerSecondVar || 0;
    };
}