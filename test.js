console.log(process.argv);
let npcs = [1, 2, 3, 4, 5]
for (let i = 0; i < npcs.length; i++) {
    for (let j = i + 1; j < npcs.length; j++) {
        console.log(npcs[i] + "-" + npcs[j])
    }
}

// console.log("main begin");

// new Promise( (resolve,reject)=>{
//     console.log("promise begin");
//     setTimeout( ()=>{
//         console.log("promise time begin");
//         resolve()
//     } )
// } )
// .then( ()=>{
//     console.log("promise then");
// } )

// setTimeout( ()=>{
//     console.log("main time ooo");
// } )

// console.log("main end")

let reg = /^[^\+]/;
console.log(reg.test("+111"))

let url = "epicslots://?abc=ss"
console.log(url.split(/[:/\?]+/))


let obj1 = {
    name: "Apple"
};

let obj2 = {
    name: "Samsung"
};

let func1 = function () {
    console.log(this.name);
}
let funct1 = func1.bind({
    name: "Alibaba"
});
func1.call({
    name: "Apple"
})
func1.apply({
    name: "Samsung"
});


let func2 = () => {
    console.log(this.name);
}
let funct2 = func2.bind(obj1);
funct2.call(obj2);
// var pako = require('pako');

// var test = { my: 'super', puper: [456, 567], awesome: 'pako' };

// var binaryString = pako.deflate(JSON.stringify(test), { to: 'string' });
// console.log(binaryString)


const tag = "lzstring";

console.log('lzstringacbsd'.substring(tag.length))


// ArrayBuffer转为字符串，参数为ArrayBuffer对象
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

// 字符串转为ArrayBuffer对象，参数为字符串
function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

let sss = `/** 二进制流生成文件
* $_POST 无法解释二进制流，需要用到 $GLOBALS['HTTP_RAW_POST_DATA'] 或 php://input
* $GLOBALS['HTTP_RAW_POST_DATA'] 和 php://input 都不能用于 enctype=multipart/form-data
* @param    String  $file   要生成的文件路径
* @return   boolean
*/`

let buffer = str2ab(sss);
console.log(buffer.length)
console.log("byteLength:" + buffer.byteLength)

console.log(new Uint16Array(buffer).join("|"))
console.log(ab2str(buffer))

let cccfunc = function (params) {
    let ss = params.split("|");
    let buffer = new Uint16Array(ss.length);
    for (let i = 0; i < ss.length; i++) {
        buffer[i] = parseInt(ss[i]);
    }
    return String.fromCharCode.apply(null, buffer);
}
console.log(cccfunc("66|69|65|67|79|78"))

let teststr = "das#今天周五#哈哈哈"
console.log(/#([^#]+)/.exec(teststr)[1])



let length = 0;
for (let _ of '𠮷asd𠮷') {
    ++length;
}
console.log("length", length)