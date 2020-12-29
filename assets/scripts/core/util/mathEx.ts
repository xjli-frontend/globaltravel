/*
 * @CreateTime: Apr 25, 2019 3:42 PM
 * @Author: howe
 * @Contact: ihowea@dingtalk.com
 * @Last Modified By: howe
 * @Last Modified Time: Apr 25, 2019 3:42 PM
 * @Description: Modify Here, Please 
 * 数学扩展
 */


export default class mathEx {


    /**
     * 计算向量和X轴的弧度
     * @param vec 
     */
    public static getVec2Angle( vec:cc.Vec2){
        if (vec.x === 0 && vec.y === 0){
            return 0;
        }
        if (vec.x == 0){
            if (vec.y > 0){
                return Math.PI/2;
            }else{
                return Math.PI * 3/2
            }
        }
        if (vec.y === 0){
            if (vec.x > 0){
                return 0;
            }else{
                return Math.PI;
            }
        }
        let len = vec.mag();
        let absAngle = Math.acos( Math.abs(vec.x)/len );
        if ( vec.x > 0 ){
            if (vec.y > 0){
                return absAngle;
            }else{
                return 2 * Math.PI - absAngle;
            }
        }
        if (vec.x < 0){
            if (vec.y > 0){
                return Math.PI - absAngle;
            }else{
                return Math.PI + absAngle;
            }
        }
    }

}

