
export class AudioImp {
    private tag: string = "AudioImp"

    /** 播放音乐 */
    play(url: string, loop: boolean, volume: number, callback: (id: number) => void = null): number {
        let audioClip = cc.loader.getRes(url, cc.AudioClip);
        if (!audioClip) {
            cc.error(`[${this.tag}] play ${url} 音乐资源不存在！`);
            return;
        }
        let audioId = cc.audioEngine.play(audioClip, loop, volume);
        if (callback) {
            cc.audioEngine.setFinishCallback(audioId, callback);
        }
        return audioId;
    }

    /** 设置音量 */
    setVolume(id: number, volume: number, callback: (id: number) => void = null) {
        cc.audioEngine.setVolume(id, volume);
        callback && callback(id);
    }

    getVolume(id: number): number {
        return cc.audioEngine.getVolume(id);
    }

    /** 停止音乐 */
    stop(id: number, callback: (id: number) => void = null) {
        cc.audioEngine.stop(id);
        callback && callback(id);
    }

    /** 声音渐变 */
    fade(id: number, from: number, to: number, duration: number, callback: (id: number) => void = null) {
        let progressFunc = (start, end, current, ratio) => {
            let vv = start + (end - start) * ratio;
            cc.audioEngine.setVolume(id, vv);
        }
        cc.tween({ volume: from })
            .to(duration, { volume: to }, { progress: progressFunc })
            .start()
            .call(() => {
                cc.log(`[${this.tag}] ${id} fade from = ${from} to = ${to} 完成 `)
                if (callback) {
                    callback(id);
                }
            })
    }

    /** 暂停音乐 */
    pause(id: number) {
        cc.audioEngine.pause(id);
    }

    /** 恢复音乐 */
    resume(id: number) {
        cc.audioEngine.resume(id);
    }

    /** 音乐是否在博覅昂 */
    isPlaying(id: number) {
        return cc.audioEngine.getState(id) === cc.audioEngine.AudioState.PLAYING;
    }

    pauseAll() {
        cc.audioEngine.pauseAll();
    }

    resumeAll() {
        cc.audioEngine.resumeAll();
    }
}