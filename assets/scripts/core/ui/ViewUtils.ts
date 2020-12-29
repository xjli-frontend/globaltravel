import { HashMap } from "../util/HashMap";

export class ViewUtils{

    /** 将整数转化为字符串 */
    public static convertIntegerToString = function (value: string): string {
        let rets = [];
        let str = value;

        while (str.length > 3) {
            rets.unshift(str.substr(-3));
            str = str.substr(0, str.length - 3);
        }
        if (str.length > 0) {
            rets.unshift(str);
        }

        return rets.join(",");
    }
    public static convertToRelativePosition = function (originNode: cc.Node, targetNode: cc.Node): cc.Vec2 {
        if (!originNode || !targetNode || !originNode.parent) {
            throw new Error("viewUtils.convertToRelativePosition  param error");
        }
        let pp = originNode.parent.convertToWorldSpaceAR(originNode.getPosition());
        pp = targetNode.convertToNodeSpaceAR(pp);
        return cc.v2(pp);
    };

    /**
     * 把Node当前的节点树结构根据Node命名转成一个js对象,重名的组件会覆盖，
     * Node的name不应该包含空格键，否则将跳过
     * @param node 被遍历的Node组件
     * @param obj  绑定的js对象 (可选)
     * @param level 遍历层次数 (可选)  选择合适的层级可以提升效率
     */
    public static nodeTreeInfoLite(node: cc.Node, obj?: HashMap<string,cc.Node>, level?: number): HashMap<string,cc.Node> {
        let _level = level;
        if (isNaN(_level)) {
            _level = 99;
        }
        if (_level < 1) {
            return;
        }
        --_level;
        let treeInfo:HashMap<string,cc.Node> = obj || new HashMap<string,cc.Node>();
        let items = node.children;
        for (let i = 0; i < items.length; i++) {
            let _node = items[i];
            if (_node.name.indexOf(" ") < 0) {
                treeInfo.set(_node.name,_node);
            }
            ViewUtils.nodeTreeInfoLite(items[i], treeInfo, _level);
        }
        return treeInfo;
    }

    /**
     * 正则搜索节点名字,符合条件的节点将会返回
     * @param reg   正则表达式
     * @param node  要搜索的父节点
     * @param _nodes 返回的数组 （可选）
     */
    public static findNodes = function (reg: RegExp, node: cc.Node, _nodes?: Array<cc.Node>): Array<cc.Node> {
        let nodes: Array<cc.Node> = _nodes || [];
        let items: Array<cc.Node> = node.children;
        for (let i = 0; i < items.length; i++) {
            let _name: string = items[i].name;
            if (reg.test(_name)) {
                nodes.push(items[i]);
            }
            ViewUtils.findNodes(reg, items[i], nodes);
        }
        return nodes;
    };

    /** 设置节点全屏 */
    public static fullscreen(node:cc.Node){
        let scaleScreen = cc.winSize.width/cc.winSize.height;
        let bgScale = node.width/node.height;
        if (scaleScreen < bgScale){
            let scale = cc.winSize.height/node.height;
            node.scale = scale;
        }else if ( scaleScreen > bgScale){
            let scale = cc.winSize.width/node.width;
            node.scale = scale;
        }
    }

    /**
     * 设置y轴方向全屏
     * @param node 
     */
    public static fullYScreen(node: cc.Node){
        let dSize = cc.view.getDesignResolutionSize();
        let rSize = cc.winSize;

        let scaleY = rSize.height / dSize.height;
        node.scaleY = Math.ceil(scaleY);
    }

    /**
     * 设置节点下所有子节点的颜色
     */
    public static setNodeAllColor(node: cc.Node, color: cc.Color = cc.color(255, 255, 255), opacity: number = 255){
        if(!cc.isValid(node)){
            return ;
        }
        node.color = color;
        node.opacity = opacity;
        let children = node.children;
        if(children.length !== 0){
            children.forEach(child => {
                this.setNodeAllColor(child, color, opacity);
            });
        }
    }

    /**
     * 格式化时间显示 （00:00:00）
     * @param hour 小时
     * @param minute 分钟
     * @param second 秒
     */
    public static setFormatTime(hour: number, minute: number, second: number): string{
        
        let arr = [hour, minute, second];
        let res = [];
        arr.forEach(t => {
            let str: string = "";
            if(t >= 10){
                str += t;
            }
            else if(t >= 1){
                str += "0" + t;
            }
            else{
                str += "00";
            }
            res.push(str);
        });
        return res.join(":");

    }

    /**
     * 更新玩家头像
     * @param url 玩家头像地址
     * @param platform 当前所在平台
     * @param node 当前头像节点
     * @param size 当前头像显示大小 默认为 cc.size(59, 59)
     */
    public static updateUserAvatar(url: string, platform: string, node: cc.Node, size: cc.Size = cc.size(59, 59)){
        if(!url){
            cc.warn("头像地址不能为空");
            return ;
        }

        if(!platform){
            cc.warn("当前登录平台为空，将默认加载头像为jpg格式");
        }

        // 确定加载头像格式   -- 暂时默认所有头像格式为 jpg  后期根据需要调整修改
        let picType = "";
        switch(platform){
            case "visitor": picType = "jpg";break;
            case "facebook": picType = "jpg";break;
            case "google": picType = "jpg";break;
            default: picType = "jpg";
        }

        // 加载头像   -- 此方式为加载为包含图片格式的头像链接
        cc.loader.load({url: url, type: picType}, (err, texture) => {
            cc.log("data = ", texture);
            if(err){
                cc.warn("头像加载失败");
                return ;
            }
            
            let sf = new cc.SpriteFrame(texture);
            node.getComponent(cc.Sprite).spriteFrame = sf;
            node.setContentSize(size);            // 此处设置头像大小是为了匹配当前显示区域大小完整
        });
    }


}