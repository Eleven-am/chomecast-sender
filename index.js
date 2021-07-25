"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.CastEventType = void 0;
exports.CastEventType = {
    ERROR: 'error',
    AVAILABLE: 'available',
    PAUSED: 'paused',
    CONNECT: 'connect',
    MUTED: 'muted',
    DISCONNECT: 'disconnect',
    NAMESPACE: 'namespace',
    END: 'end',
    PLAYING: 'playing',
    BUFFERING: 'buffering',
    DURATIONCHANGE: 'durationChanged',
    TIMEUPDATE: 'timeupdate',
    VOLUMECHANGE: 'volumechange'
};
var Cast = /** @class */ (function () {
    /**
     * @param receiverApplicationId id for chromecast receiver application
     * @param namespace for CAFs that support namespace exchange; default: 'urn:x-cast:com.custom.cast'
     */
    function Cast(receiverApplicationId, namespace) {
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
            var script = document.createElement('script');
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
    Cast.prototype.on = function (name, listener) {
        if (!this.events[name])
            this.events[name] = [];
        this.events[name].push(listener);
    };
    /**
     * @desc a remove listener function
     * @param name
     * @param listenerToRemove
     */
    Cast.prototype.off = function (name, listenerToRemove) {
        if (!this.events[name])
            throw new Error("Can't remove a listener. Event \"" + name + "\" doesn't exits.");
        this.events[name] = this.events[name].filter(function (e) { return e !== listenerToRemove; });
    };
    /**
     * @desc attempts to play || pause remote player
     */
    Cast.prototype.playPause = function () {
        var _a;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.playOrPause();
        return this;
    };
    /**
     * @desc attempts to mute || unmute remote player
     */
    Cast.prototype.muteUnmute = function () {
        var _a;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.muteOrUnmute();
        this.muted = !this.muted;
        return this;
    };
    /**
     * @desc seeks remote player to present number provided in seconds
     * @param seconds
     */
    Cast.prototype.seek = function (seconds) {
        var _a;
        if (this.player)
            this.player.currentTime = seconds;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.seek();
        return this;
    };
    /**
     * @desc Modifies the volume on the remote player
     * @param float
     */
    Cast.prototype.volume = function (float) {
        var _a;
        if (this.player)
            this.player.volumeLevel = this.volumeLevel = float;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.setVolumeLevel();
        this.volumeLevel = float;
        return this;
    };
    /**
     * @desc Sends a message less then 64kb to the receiver device
     * @param obj
     */
    Cast.prototype.send = function (obj) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.connected && this.castSession)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.castSession.sendMessage(this.namespace, obj)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @desc attempts to cast current media being played remote device
     * @param videoPlayer you can provide a video element or a MediaObject
     * @param obj
     */
    Cast.prototype.castMedia = function (videoPlayer, obj) {
        var _this = this;
        var _a;
        this.src = videoPlayer.src;
        var mediaInfo = new chrome.cast.media.MediaInfo(this.src, 'video/mp4');
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
        if (obj)
            mediaInfo.customData = obj;
        var request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.currentTime = videoPlayer.currentTime;
        request.autoplay = !videoPlayer.paused;
        (_a = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _a === void 0 ? void 0 : _a.loadMedia(request).then(function () {
            var _a;
            _this.device = ((_a = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _a === void 0 ? void 0 : _a.getCastDevice().friendlyName) || _this.device;
            _this.volume(videoPlayer.volume);
            return _this;
        }, function (err) {
            return _this.emit(exports.CastEventType.ERROR, __assign(__assign({}, _this.buildEvent()), { error: err }));
        });
    };
    /**
     * @desc attempts to connect to remote device
     */
    Cast.prototype.connect = function () {
        var _this = this;
        cast.framework.CastContext.getInstance().requestSession()
            .then(function () {
            if (!cast.framework.CastContext.getInstance().getCurrentSession())
                return _this.emit(exports.CastEventType.ERROR, __assign(__assign({}, _this.buildEvent()), { error: { error: 'Could not connect with the cast device' } }));
            return _this.emit(exports.CastEventType.CONNECT, _this.buildEvent());
        })["catch"](function (err) {
            _this.emit(exports.CastEventType.ERROR, err);
        });
    };
    /**
     * @desc disconnects from remote device
     */
    Cast.prototype.disconnect = function () {
        var _a;
        this.connected = false;
        this.emit(exports.CastEventType.DISCONNECT, this.buildEvent());
        cast.framework.CastContext.getInstance().endCurrentSession(true);
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.stop();
        this.device = 'Chromecast';
        this.reset();
        return this;
    };
    Cast.prototype.reset = function () {
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
    };
    Cast.prototype.emit = function (name, data) {
        var _a;
        if (!this.events[name])
            console.error("Can't find a listener. Event \"" + name + "\" doesn't exits.");
        var fireCallbacks = function (callback) {
            callback(data);
        };
        (_a = this.events[name]) === null || _a === void 0 ? void 0 : _a.forEach(fireCallbacks);
    };
    Cast.prototype.buildState = function () {
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
    };
    Cast.prototype.buildEvent = function () {
        return {
            available: this.available,
            connected: this.connected,
            volume: this.volumeLevel,
            paused: this.paused,
            muted: this.muted,
            end: false,
            device: this.device, error: null
        };
    };
    Cast.prototype.init = function (tries) {
        var _this = this;
        if (tries === void 0) { tries = 0; }
        if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
            if (tries > 20)
                this.emit(exports.CastEventType.AVAILABLE, __assign(__assign({}, this.buildEvent()), { available: false }));
            else
                setTimeout(function () {
                    _this.init(tries++);
                }, 250);
        }
        else {
            cast.framework.CastContext.getInstance().setOptions({
                receiverApplicationId: this.receiverApplicationId,
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
                language: 'en-US',
                resumeSavedSession: false
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
            this.emit(exports.CastEventType.AVAILABLE, __assign(__assign({}, this.buildEvent()), { available: true }));
            this.available = true;
        }
    };
    Cast.prototype.isConnectedChanged = function () {
        var _this = this;
        var _a, _b;
        this.connected = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isConnected) || false;
        if (this.connected) {
            this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();
            this.device = ((_b = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _b === void 0 ? void 0 : _b.getCastDevice().friendlyName) || this.device;
            if (this.castSession)
                this.castSession.addMessageListener(this.namespace, function (namespace, data) {
                    _this.emit(exports.CastEventType.NAMESPACE, __assign(__assign({}, _this.buildEvent()), { namespaceResponse: data }));
                });
        }
        this.state = !this.connected ? 'disconnected' : 'connected';
        this.emit(this.state === 'connected' ? exports.CastEventType.CONNECT : exports.CastEventType.DISCONNECT, this.buildEvent());
    };
    Cast.prototype.isMutedChanged = function () {
        var _a;
        var old = this.muted;
        this.muted = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isMuted) || false;
        if (old !== this.muted)
            this.emit(exports.CastEventType.MUTED, this.buildEvent());
    };
    Cast.prototype.isPausedChanged = function () {
        var _a;
        this.paused = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isPaused) || false;
        this.emit(exports.CastEventType.PAUSED, this.buildEvent());
    };
    Cast.prototype.playerStateChanged = function () {
        var _this = this;
        var _a, _b, _c, _d;
        this.connected = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.isConnected) || false;
        if (!this.connected)
            this.emit(exports.CastEventType.DISCONNECT, __assign(__assign({}, this.buildEvent()), { state: this.buildState() }));
        var event = __assign(__assign({}, this.buildEvent()), { state: this.buildState() });
        this.device = ((_b = cast.framework.CastContext.getInstance().getCurrentSession()) === null || _b === void 0 ? void 0 : _b.getCastDevice().friendlyName) || this.device;
        this.state = ((_d = (_c = this.player) === null || _c === void 0 ? void 0 : _c.playerState) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
        switch (this.state) {
            case 'idle':
                this.state = 'ended';
                this.emit(exports.CastEventType.END, __assign(__assign({}, this.buildEvent()), { end: true }));
                break;
            case 'buffering':
                this.emit(exports.CastEventType.BUFFERING, event);
                break;
            case 'playing':
                setTimeout(function () {
                    _this.emit(exports.CastEventType.PLAYING, event);
                });
                break;
        }
    };
    Cast.prototype.durationChanged = function () {
        var _a;
        this.duration = ((_a = this.player) === null || _a === void 0 ? void 0 : _a.duration) || this.duration;
        this.emit(exports.CastEventType.DURATIONCHANGE, this.buildEvent());
    };
    Cast.prototype.currentTimeChanged = function () {
        var _a;
        var past = this.time;
        var event = __assign(__assign({}, this.buildEvent()), { state: this.buildState() });
        if (past !== this.time && !((_a = this.player) === null || _a === void 0 ? void 0 : _a.isPaused))
            this.emit(exports.CastEventType.TIMEUPDATE, event);
    };
    Cast.prototype.volumeLevelChanged = function () {
        var _a, _b;
        this.volumeLevel = Number((((_a = this.player) === null || _a === void 0 ? void 0 : _a.volumeLevel) || this.volumeLevel).toFixed(1));
        if ((_b = this.player) === null || _b === void 0 ? void 0 : _b.isMediaLoaded)
            this.emit(exports.CastEventType.VOLUMECHANGE, this.buildEvent());
    };
    return Cast;
}());
exports["default"] = Cast;
