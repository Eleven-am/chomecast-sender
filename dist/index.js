"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastEventType = void 0;
var CastEventType;
(function (CastEventType) {
    CastEventType["ERROR"] = "error";
    CastEventType["AVAILABLE"] = "available";
    CastEventType["PAUSED"] = "paused";
    CastEventType["CONNECT"] = "connect";
    CastEventType["MUTED"] = "muted";
    CastEventType["DISCONNECT"] = "disconnect";
    CastEventType["NAMESPACE"] = "namespace";
    CastEventType["END"] = "end";
    CastEventType["PLAYING"] = "playing";
    CastEventType["BUFFERING"] = "buffering";
    CastEventType["DURATIONCHANGE"] = "durationChanged";
    CastEventType["TIMEUPDATE"] = "timeupdate";
    CastEventType["VOLUMECHANGE"] = "volumechange";
})(CastEventType = exports.CastEventType || (exports.CastEventType = {}));
class Cast {
    /**
     * @param receiverApplicationId id for chromecast receiver application
     * @param namespace for CAFs that support namespace exchange; default: 'urn:x-cast:com.custom.cast'
     */
    constructor(receiverApplicationId, namespace) {
        this.available = false;
        this.muted = false;
        this.paused = false;
        this.device = '';
        this.src = '';
        this.timePretty = '';
        this.durationPretty = '';
        this.state = '';
        this.time = 1;
        this.volumeLevel = 1;
        this.duration = 1;
        this.progress = 1;
        if (typeof window !== undefined && window.chrome && !window.chrome.cast) {
            let script = document.createElement('script');
            script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
            document.head.appendChild(script);
        }
        this.events = {};
        this.castSession = null;
        this.connected = false;
        this.device = 'Chromecast';
        this.receiverApplicationId = receiverApplicationId;
        this.namespace = namespace || 'urn:x-cast:com.custom.cast';
        this.reset();
        this.init();
    }
    /**
     * @desc an event listener that fires on event changes
     * @param name name of event to listen for
     * @param listener callback to handle event
     */
    on(name, listener) {
        if (!this.events[name])
            this.events[name] = [];
        this.events[name].push(listener);
    }
    /**
     * @desc a remove listener function
     * @param name
     * @param listenerToRemove
     */
    off(name, listenerToRemove) {
        if (!this.events[name])
            throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`);
        this.events[name] = this.events[name].filter(e => e !== listenerToRemove);
    }
    /**
     * @desc attempts to play || pause remote player
     */
    playPause() {
        var _a;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.playOrPause();
        return this;
    }
    /**
     * @desc attempts to mute || unmute remote player
     */
    muteUnmute() {
        var _a;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.muteOrUnmute();
        this.muted = !this.muted;
        return this;
    }
    /**
     * @desc seeks remote player to present number provided in seconds
     * @param seconds
     */
    seek(seconds) {
        var _a;
        if (this.player)
            this.player.currentTime = seconds;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.seek();
        return this;
    }
    /**
     * @desc Modifies the volume on the remote player
     * @param float
     */
    volume(float) {
        var _a;
        if (this.player)
            this.player.volumeLevel = this.volumeLevel = float;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.setVolumeLevel();
        this.volumeLevel = float;
        return this;
    }
    /**
     * @desc Sends a message less then 64kb to the receiver device
     * @param obj
     */
    send(obj) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connected && this.castSession)
                yield this.castSession.sendMessage(this.namespace, obj);
        });
    }
    /**
     * @desc attempts to cast current media being played remote device
     * @param videoPlayer you can provide a video element or a MediaObject
     * @param obj
     */
    castMedia(videoPlayer, obj) {
        var _a;
        this.src = videoPlayer.src;
        let mediaInfo = new chrome.cast.media.MediaInfo(this.src, 'video/mp4');
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        if (obj)
            mediaInfo.customData = obj;
        let request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.currentTime = videoPlayer.currentTime;
        request.autoplay = !videoPlayer.paused;
        (_a = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _a === void 0 ? void 0 : _a.loadMedia(request).then(() => {
            var _a;
            this.device = ((_a = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _a === void 0 ? void 0 : _a.getCastDevice().friendlyName) || this.device;
            this.volume(videoPlayer.volume);
            return this;
        }, (err) => {
            return this.emit(CastEventType.ERROR, Object.assign(Object.assign({}, this.buildEvent()), { error: err }));
        });
    }
    /**
     * @desc attempts to connect to remote device
     */
    connect() {
        cast.framework.CastContext.getInstance().requestSession()
            .then(() => {
            if (!cast.framework.CastContext.getInstance().getCurrentSession())
                return this.emit(CastEventType.ERROR, Object.assign(Object.assign({}, this.buildEvent()), { error: { error: 'Could not connect with the cast device' } }));
            return this.emit(CastEventType.CONNECT, this.buildEvent());
        }).catch(err => {
            this.emit(CastEventType.ERROR, err);
        });
    }
    /**
     * @desc disconnects from remote device
     */
    disconnect() {
        var _a;
        this.connected = false;
        this.emit(CastEventType.DISCONNECT, this.buildEvent());
        cast.framework.CastContext.getInstance().endCurrentSession(true);
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.stop();
        this.device = 'Chromecast';
        this.reset();
        return this;
    }
    reset() {
        this.src = '';
        this.volumeLevel = 1;
        this.muted = false;
        this.paused = false;
        this.time = 0;
        this.timePretty = '00:00:00';
        this.duration = 0;
        this.durationPretty = '00:00:00';
        this.progress = 0;
        this.state = 'disconnected';
    }
    emit(name, data) {
        var _a;
        if (!this.events[name])
            console.error(`Can't find a listener. Event "${name}" doesn't exits.`);
        const fireCallbacks = (callback) => {
            callback(data);
        };
        (_a = this.events[name]) === null || _a === void 0 ? void 0 : _a.forEach(fireCallbacks);
    }
    buildState() {
        var _a, _b, _c, _d, _e;
        this.time = Math.round(((_a = this.player) === null || _a === void 0 ? void 0 : _a.currentTime) || 0);
        this.duration = ((_b = this.player) === null || _b === void 0 ? void 0 : _b.duration) || 0;
        this.progress = ((_c = this.controller) === null || _c === void 0 ? void 0 : _c.getSeekPosition(this.time, this.duration)) || 0;
        this.timePretty = ((_d = this.controller) === null || _d === void 0 ? void 0 : _d.getFormattedTime(this.time)) || this.timePretty;
        this.durationPretty = ((_e = this.controller) === null || _e === void 0 ? void 0 : _e.getFormattedTime(this.duration)) || this.durationPretty;
        return {
            time: this.time,
            timePretty: this.timePretty,
            durationPretty: this.durationPretty,
            duration: this.duration,
            progress: this.progress
        };
    }
    buildEvent() {
        return {
            available: this.available,
            connected: this.connected,
            volume: this.volumeLevel,
            paused: this.paused,
            muted: this.muted,
            end: false,
            device: this.device, error: null
        };
    }
    init(tries = 0) {
        if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
            if (tries > 20)
                this.emit(CastEventType.AVAILABLE, Object.assign(Object.assign({}, this.buildEvent()), { available: false }));
            else
                setTimeout(() => {
                    this.init(tries++);
                }, 250);
        }
        else {
            cast.framework.CastContext.getInstance().setOptions({
                receiverApplicationId: this.receiverApplicationId,
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
                language: 'en-US',
                resumeSavedSession: false,
            });
            this.player = new cast.framework.RemotePlayer();
            this.controller = new cast.framework.RemotePlayerController(this.player);
            this.controller.addEventListener(cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, this.isConnectedChanged.bind(this));
            this.controller.addEventListener(cast.framework.RemotePlayerEventType.IS_MUTED_CHANGED, this.isMutedChanged.bind(this));
            this.controller.addEventListener(cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED, this.isPausedChanged.bind(this));
            this.controller.addEventListener(cast.framework.RemotePlayerEventType.CURRENT_TIME_CHANGED, this.currentTimeChanged.bind(this));
            this.controller.addEventListener(cast.framework.RemotePlayerEventType.DURATION_CHANGED, this.durationChanged.bind(this));
            this.controller.addEventListener(cast.framework.RemotePlayerEventType.VOLUME_LEVEL_CHANGED, this.volumeLevelChanged.bind(this));
            this.controller.addEventListener(cast.framework.RemotePlayerEventType.PLAYER_STATE_CHANGED, this.playerStateChanged.bind(this));
            this.emit(CastEventType.AVAILABLE, Object.assign(Object.assign({}, this.buildEvent()), { available: true }));
            this.available = true;
        }
    }
    isConnectedChanged() {
        var _a, _b;
        this.connected = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isConnected) || false;
        if (this.connected) {
            this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();
            this.device = ((_b = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _b === void 0 ? void 0 : _b.getCastDevice().friendlyName) || this.device;
            if (this.castSession)
                this.castSession.addMessageListener(this.namespace, (namespace, data) => {
                    this.emit(CastEventType.NAMESPACE, Object.assign(Object.assign({}, this.buildEvent()), { namespaceResponse: data }));
                });
        }
        this.state = !this.connected ? 'disconnected' : 'connected';
        this.emit(this.state === 'connected' ? CastEventType.CONNECT : CastEventType.DISCONNECT, this.buildEvent());
    }
    isMutedChanged() {
        var _a;
        const old = this.muted;
        this.muted = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isMuted) || false;
        if (old !== this.muted)
            this.emit(CastEventType.MUTED, this.buildEvent());
    }
    isPausedChanged() {
        var _a;
        this.paused = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isPaused) || false;
        this.emit(CastEventType.PAUSED, this.buildEvent());
    }
    playerStateChanged() {
        var _a, _b, _c, _d;
        this.connected = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isConnected) || false;
        if (!this.connected)
            this.emit(CastEventType.DISCONNECT, Object.assign(Object.assign({}, this.buildEvent()), { state: this.buildState() }));
        const event = Object.assign(Object.assign({}, this.buildEvent()), { state: this.buildState() });
        this.device = ((_b = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _b === void 0 ? void 0 : _b.getCastDevice().friendlyName) || this.device;
        this.state = ((_d = (_c = this.player) === null || _c === void 0 ? void 0 : _c.playerState) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
        switch (this.state) {
            case 'idle':
                this.state = 'ended';
                this.emit(CastEventType.END, Object.assign(Object.assign({}, this.buildEvent()), { end: true }));
                break;
            case 'buffering':
                this.emit(CastEventType.BUFFERING, event);
                break;
            case 'playing':
                setTimeout(() => {
                    this.emit(CastEventType.PLAYING, event);
                });
                break;
        }
    }
    durationChanged() {
        var _a;
        this.duration = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.duration) || this.duration;
        this.emit(CastEventType.DURATIONCHANGE, this.buildEvent());
    }
    currentTimeChanged() {
        var _a;
        let past = this.time;
        const event = Object.assign(Object.assign({}, this.buildEvent()), { state: this.buildState() });
        if (past !== this.time && !((_a = this.player) === null || _a === void 0 ? void 0 : _a.isPaused))
            this.emit(CastEventType.TIMEUPDATE, event);
    }
    volumeLevelChanged() {
        var _a, _b;
        this.volumeLevel = Number((((_a = this.player) === null || _a === void 0 ? void 0 : _a.volumeLevel) || this.volumeLevel).toFixed(1));
        if ((_b = this.player) === null || _b === void 0 ? void 0 : _b.isMediaLoaded)
            this.emit(CastEventType.VOLUMECHANGE, this.buildEvent());
    }
}
exports.default = Cast;
