const archiver = require('archiver');
const fs = require("fs");
const path = require("path");
const FTPS = require('ftps');
const unzip = require('extract-zip');

const fsextra = require('fs-extra')
// 大厅FTP参数
const hallFtpOpt = {
    host: "192.168.2.145",
    port: 21,
    username: "lanwan",
    password: "Lanwanhudong@20191010"
}

const defaultGame = "10017";

const archiverPromise = async (dirpath, zippath) => {
    if (fs.existsSync(zippath)) {
        fs.unlinkSync(zippath);
    }
    if (!fs.existsSync(dirpath)) {
        console.log('目录不存在' + dirpath);
        return;
    }
    return new Promise((resolve, reject) => {
        let output = fs.createWriteStream(zippath);
        let archive = archiver('zip', {
            zlib: {
                level: 9
            }
        });
        output.on('close', function () {
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve(zippath);
        });
        output.on('end', function () {
            console.log('Data has been drained');
        });
        archive.on('warning', function (err) {
            console.log("archive warning", err)
            if (err.code === 'ENOENT') { } else { }
        });
        archive.on('error', function (err) {
            console.log("archive error", err)
            reject(err);
        });
        archive.pipe(output);
        archive.directory(dirpath, false);
        archive.finalize();
    })
}

let main = async function () {
    let WORKSPACE = path.dirname(__dirname);
    fsextra.removeSync(path.join(WORKSPACE, "temp", "resoutput.zip"));
    await archiverPromise(path.join(WORKSPACE, "temp", "resoutput"), path.join(WORKSPACE, "temp", "resoutput.zip"));
    console.log("生成", path.join(WORKSPACE, "temp", "resoutput.zip"));

    if (!fsextra.existsSync(path.join(WORKSPACE, "nativeapp", "hallgames"))) {
        fsextra.mkdirSync(path.join(WORKSPACE, "nativeapp", "hallgames"));
    }
    let ftps = new FTPS(hallFtpOpt);
    ftps.raw(`rm -rf ios/assetspatch`);
    ftps.put(path.join(WORKSPACE, "temp", "resoutput.zip"), `ios/assetspatch.zip`)
    ftps.mirror({
        remoteDir: `ios/assetspatch`,
        localDir: path.join(WORKSPACE, "temp", "resoutput"),
        upload: true,
        options: "--allow-chown"
    });
    console.log("准备上传到 " + hallFtpOpt.host + " ios/assetspatch")
    ftps.raw(`rm -rf android/assetspatch`);
    ftps.put(path.join(WORKSPACE, "temp", "resoutput.zip"), `android/assetspatch.zip`)
    ftps.mirror({
        remoteDir: `android/assetspatch`,
        localDir: path.join(WORKSPACE, "temp", "resoutput"),
        upload: true,
        options: "--allow-chown"
    });
    let zipgamefilepath = path.join(WORKSPACE, "nativeapp", "hallgames", defaultGame + ".zip");
    fsextra.removeSync(zipgamefilepath);
    ftps.get(`hallgames/${defaultGame}.zip`, zipgamefilepath);

    console.log("准备上传到 " + hallFtpOpt.host + " android/assetspatch")
    await new Promise((resolve, reject) => {
        ftps.exec(function (err, res) {
            if (err) {
                console.log(res);
                reject(err)
            } else {
                console.log(res);
                resolve(res);
            }
        });
    });
    unzip(zipgamefilepath, { dir: path.join(path.dirname(zipgamefilepath), defaultGame) }, () => {
        fsextra.removeSync(zipgamefilepath);
    })
}
main();