/*
 * @CreateTime: 2017/10/30
 * @Author: hehao
 * @Contact: ihowe@outlook.com
 * @Last Modified By: ihowe
 * @Last Modified Time: 15:26
 * @Description:  xxx
 * 
 * TS hashmap简单实现，纯粹的HashMap需要用到数组和链表。
 */
export class HashMap<T1, T2>{

    private _keys:Array<T1> = [];
    private _values:Array<T2> = [];

    /**
     * 长度
     */
    public get size() {
        return this._keys.length;
    }
    /**
     * 是否包含key
     */
    public has(key: T1): boolean {
        return this._keys.indexOf(key) >= 0;
    }

    /**
     * 设置值
     */
    public set(key: T1, value: T2) {
        let i = this._keys.indexOf(key);
        if (i < 0){
            this._keys.push(key);
            this._values.push(value);
        }else{
            this._values[i] = value;
        }
        return this;
    }
    /**
     * 获取值
     */
    public get(key: T1): T2 {
        let i = this._keys.indexOf(key);
        if (i >= 0){
            return this._values[i];
        }
        return null;
    }
    /**
     * 删除元素
     */
    public delete(key: T1) {
        let i = this._keys.indexOf(key);
        if (i >= 0){
            this._keys.splice(i,1);
            this._values.splice(i,1);
            return true;
        }
        return false;
    }
    /**
     * 获取所有的key
     */
    public keys(): Array<T1> {
        return this._keys.slice();
    }
    /**
     * 获取所有的value
     */
    public values(): Array<T2> {
        return this._values.slice();
    }
    public getOriginValues(): Array<T2> {
        return this._values.slice();
    }
    /**
     * 清空
     */
    public clear(){
        this._keys = [];
        this._values = [];
    }

    /**
     * 遍历HashMap
     * 注意，key为字符串形式
     */
    public forEach( func: (value:T2, key:T1, map:HashMap<T1,T2>)=>void ) {
        let copykeys = this.keys();
        copykeys.forEach( ( key:T1,index:number)=>{
            func( this._values[index],key, this );
        } )
    }

    public get objects(){
        let objects:any = {};
        for (let i=0;i<this._keys.length;++i){
            objects[this._keys[i]] = this._values[i];
        }
        return objects;
    }
}
