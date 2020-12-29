const pako = require('pako');
const fs = require('fs');
const path = require('path');

const loopDirs = function(dir,arr){
    let files = fs.readdirSync(dir);
    for  (let file of files){
      if (file.indexOf(".git") >= 0 || file.indexOf(".svn")>= 0 || file.indexOf('gitignore')>0){
        continue;
      }
      let fullpath = path.join(dir,file);
      let stat = fs.statSync(fullpath);
      if (stat.isFile()){
         arr.push(fullpath);
      }else if (stat.isDirectory()){
         loopDirs(fullpath,arr);
      }
    }
  
  }
let handler = function( sourcedir ){
    let allfiles = [];
    loopDirs( sourcedir, allfiles );
    for (let filepath of allfiles){
        if (!filepath.endsWith(".json")){
            continue;
        }
        let content = fs.readFileSync(filepath,'utf8');
        let compressStr = "pako_" + pako.deflate( content , { to: 'string' });
        if (compressStr.length >= content){
            console.log("压缩后长度一致，忽略！");
            continue;
        }
        console.log(`${filepath} 压缩率 ${compressStr.length}/${content.length}`);
        fs.writeFileSync(filepath,compressStr,'utf8');
    }
}

module.exports = handler;

if (process.argv.length > 2){
    handler(process.argv[2])
}
