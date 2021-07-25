export enum CastEventType {
    ERROR = 'error',
    AVAILABLE = 'available',
    PAUSED = 'paused',
    CONNECT = 'connect',
    MUTED = 'muted',
    DISCONNECT = 'disconnect',
    NAMESPACE = 'namespace',
    END = 'end',
    PLAYING = 'playing',
    BUFFERING = 'buffering',
    DURATIONCHANGE = 'durationChanged',
    TIMEUPDATE = 'timeupdate',
    VOLUMECHANGE = 'volumechange',
}

interface CastEvent {
    available: boolean;
    connected: boolean;
    volume: number;
    paused: boolean;
    muted: boolean;
    device: string;
    end: boolean;
    namespaceResponse?: string;
    /** Holds the current state of the remote player */
    state?: VideoState
    error: CastError | null
}

interface CastError {
    error: string
}

interface VideoState {
    time: number,
    timePretty: string,
    durationPretty: string,
    duration: number,
    progress: number
}

interface MediaObject {
    src: string;
    currentTime: number;
    paused: boolean;
    volume: number;
}

export default class Cast {
    connected: boolean;
    available: boolean = false;
    muted: boolean = false;
    paused: boolean = false;
    device: string = '';
    private readonly receiverApplicationId: string;
    private readonly namespace;
    private readonly events: { [key: string]: {(event: CastEvent): void}[] };
    private player: cast.framework.RemotePlayer | undefined;
    private castSession: cast.framework.CastSession | null;
    private src: string = '';
    private timePretty: string = '';
    private durationPretty: string = '';
    private state: string = '';
    private time: number = 1;
    private volumeLevel: number = 1;
    private duration: number = 1;
    private progress: number = 1;
    private controller: cast.framework.RemotePlayerController | undefined;

    /**
     * @param receiverApplicationId id for chromecast receiver application
     * @param namespace for CAFs that support namespace exchange; default: 'urn:x-cast:com.custom.cast'
     */
    constructor(receiverApplicationId: string, namespace?: string) {
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
    on(name: string, listener: (event: CastEvent) => void) {
        if (!this.events[name])
            this.events[name] = [];

        this.events[name].push(listener);
    }

    /**
     * @desc a remove listener function
     * @param name
     * @param listenerToRemove
     */
    off(name: string, listenerToRemove: (event: CastEvent) => void) {
        if (!this.events[name])
            throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`);

        this.events[name] = this.events[name].filter(e => e !== listenerToRemove)
    }

    /**
     * @desc attempts to play || pause remote player
     */
    playPause() {
        this.controller?.playOrPause();
        return this;
    }

    /**
     * @desc attempts to mute || unmute remote player
     */
    muteUnmute() {
        this.controller?.muteOrUnmute();
        this.muted = !this.muted;
        return this;
    }

    /**
     * @desc seeks remote player to present number provided in seconds
     * @param seconds
     */
    seek(seconds: number) {
        if (this.player)
            this.player.currentTime = seconds;

        this.controller?.seek();
        return this;
    }

    /**
     * @desc Modifies the volume on the remote player
     * @param float
     */
    volume(float: number) {
        if (this.player)
            this.player.volumeLevel = this.volumeLevel = float;

        this.controller?.setVolumeLevel();
        this.volumeLevel = float;
        return this;
    }

    /**
     * @desc Sends a message less then 64kb to the receiver device
     * @param obj
     */
    async send(obj: any) {
        if (this.connected && this.castSession)
            await this.castSession.sendMessage(this.namespace, obj);
    }

    /**
     * @desc attempts to cast current media being played remote device
     * @param videoPlayer you can provide a video element or a MediaObject
     * @param obj
     */
    castMedia(videoPlayer: MediaObject | HTMLVideoElement, obj?: any) {
        this.src = videoPlayer.src;
        let mediaInfo = new chrome.cast.media.MediaInfo(this.src, 'video/mp4');
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();

        if (obj)
            mediaInfo.customData = obj;

        let request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.currentTime = videoPlayer.currentTime;
        request.autoplay = !videoPlayer.paused;
        cast.framework.CastContext.getInstance().getCurrentSession()?.loadMedia(request).then(() => {
            this.device = cast.framework.CastContext.getInstance().getCurrentSession()?.getCastDevice().friendlyName || this.device
            this.volume(videoPlayer.volume);
            return this;
        }, (err) => {
            return this.emit(CastEventType.ERROR, {...this.buildEvent(), error: err});
        });
    }

    /**
     * @desc attempts to connect to remote device
     */
    connect() {
        cast.framework.CastContext.getInstance().requestSession()
            .then(() => {
                if (!cast.framework.CastContext.getInstance().getCurrentSession())
                    return this.emit(CastEventType.ERROR, {
                        ...this.buildEvent(),
                        error: {error: 'Could not connect with the cast device'}
                    });

                return this.emit(CastEventType.CONNECT, this.buildEvent())
            }).catch(err => {
            this.emit(CastEventType.ERROR, err);
        })
    }

    /**
     * @desc disconnects from remote device
     */
    disconnect() {
        this.connected = false;
        this.emit(CastEventType.DISCONNECT, this.buildEvent());

        cast.framework.CastContext.getInstance().endCurrentSession(true);
        this.controller?.stop();
        this.device = 'Chromecast';

        this.reset()
        return this;
    }

    private reset() {
        this.src = ''
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

    private emit(name: string, data: CastEvent) {
        if (!this.events[name])
            console.error(`Can't find a listener. Event "${name}" doesn't exits.`);

        const fireCallbacks = (callback: (event: CastEvent) => void) => {
            callback(data);
        };

        this.events[name]?.forEach(fireCallbacks);
    }

    private buildState(): VideoState {
        this.time = Math.round(this.player?.currentTime || 0);
        this.duration = this.player?.duration || 0;
        this.progress = this.controller?.getSeekPosition(this.time, this.duration) || 0;
        this.timePretty = this.controller?.getFormattedTime(this.time) || this.timePretty;
        this.durationPretty = this.controller?.getFormattedTime(this.duration) || this.durationPretty;
        return {
            time: this.time,
            timePretty: this.timePretty,
            durationPretty: this.durationPretty,
            duration: this.duration,
            progress: this.progress
        }
    }

    private buildEvent(): CastEvent {
        return {
            available: this.available,
            connected: this.connected,
            volume: this.volumeLevel,
            paused: this.paused,
            muted: this.muted,
            end: false,
            device: this.device, error: null
        }
    }

    private init(tries = 0) {
        if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
            if (tries > 20)
                this.emit(CastEventType.AVAILABLE, {...this.buildEvent(), available: false});
            else
                setTimeout(() => {
                    this.init(tries++)
                }, 250)

        } else {
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
            this.emit(CastEventType.AVAILABLE, {...this.buildEvent(), available: true});
            this.available = true;
        }
    }

    private isConnectedChanged() {
        this.connected = this.player?.isConnected || false;

        if (this.connected) {
            this.castSession = cast.framework.CastContext.getInstance().getCurrentSession();
            this.device = cast.framework.CastContext.getInstance().getCurrentSession()?.getCastDevice().friendlyName || this.device;

            if (this.castSession)
                this.castSession.addMessageListener(this.namespace, (namespace, data) => {
                    this.emit(CastEventType.NAMESPACE, {...this.buildEvent(), namespaceResponse: data});
                })
        }

        this.state = !this.connected ? 'disconnected' : 'connected'
        this.emit(this.state === 'connected' ? CastEventType.CONNECT : CastEventType.DISCONNECT, this.buildEvent());
    }

    private isMutedChanged() {
        const old = this.muted
        this.muted = this.player?.isMuted || false;
        if (old !== this.muted)
            this.emit(CastEventType.MUTED, this.buildEvent());
    }

    private isPausedChanged() {
        this.paused = this.player?.isPaused || false;
        this.emit(CastEventType.PAUSED, this.buildEvent())
    }

    private playerStateChanged() {
        this.connected = this.player?.isConnected || false;
        if (!this.connected)
            this.emit(CastEventType.DISCONNECT, {...this.buildEvent(), state: this.buildState()});

        const event = {...this.buildEvent(), state: this.buildState()};
        this.device = cast.framework.CastContext.getInstance().getCurrentSession()?.getCastDevice().friendlyName || this.device;
        this.state = this.player?.playerState?.toLowerCase() || '';
        switch (this.state) {
            case 'idle':
                this.state = 'ended';
                this.emit(CastEventType.END, {...this.buildEvent(), end: true,});
                break;
            case 'buffering':
                this.emit(CastEventType.BUFFERING, event)
                break;
            case 'playing':
                setTimeout(() => {
                    this.emit(CastEventType.PLAYING, event)
                })
                break;
        }
    }

    private durationChanged() {
        this.duration = this.player?.duration || this.duration;
        this.emit(CastEventType.DURATIONCHANGE, this.buildEvent());
    }

    private currentTimeChanged() {
        let past = this.time;
        const event = {...this.buildEvent(), state: this.buildState()};
        if (past !== this.time && !this.player?.isPaused)
            this.emit(CastEventType.TIMEUPDATE, event);
    }

    private volumeLevelChanged() {
        this.volumeLevel = Number((this.player?.volumeLevel || this.volumeLevel).toFixed(1));
        if (this.player?.isMediaLoaded)
            this.emit(CastEventType.VOLUMECHANGE, this.buildEvent());
    }
}