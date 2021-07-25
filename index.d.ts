export declare const CastEventType: {
    ERROR: string;
    AVAILABLE: string;
    PAUSED: string;
    CONNECT: string;
    MUTED: string;
    DISCONNECT: string;
    NAMESPACE: string;
    END: string;
    PLAYING: string;
    BUFFERING: string;
    DURATIONCHANGE: string;
    TIMEUPDATE: string;
    VOLUMECHANGE: string;
};
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
    state?: VideoState;
    error: CastError | null;
}
interface CastError {
    error: string;
}
interface VideoState {
    time: number;
    timePretty: string;
    durationPretty: string;
    duration: number;
    progress: number;
}
interface MediaObject {
    src: string;
    currentTime: number;
    paused: boolean;
    volume: number;
}
export default class Cast {
    connected: boolean;
    available: boolean;
    muted: boolean;
    paused: boolean;
    device: string;
    private readonly receiverApplicationId: string;
    private readonly namespace: string;
    private readonly events: { [key: string]: {(event: CastEvent): void}[] };
    private player: cast.framework.RemotePlayer | null;
    private castSession: cast.framework.CastSession | null;
    private src: string;
    private timePretty: string;
    private durationPretty: string;
    private state: string;
    private time: number;
    private volumeLevel: number;
    private duration: number;
    private progress: number;
    private controller: cast.framework.RemotePlayerController | undefined;
    /**
     * @param receiverApplicationId id for chromecast receiver application
     * @param namespace for CAFs that support namespace exchange; default: 'urn:x-cast:com.custom.cast'
     */
    constructor(receiverApplicationId: string, namespace?: string);
    /**
     * @desc an event listener that fires on event changes
     * @param name name of event to listen for
     * @param listener callback to handle event
     */
    on(name: string, listener: (event: CastEvent) => void): void;
    /**
     * @desc a remove listener function
     * @param name
     * @param listenerToRemove
     */
    off(name: string, listenerToRemove: (event: CastEvent) => void): void;
    /**
     * @desc attempts to play || pause remote player
     */
    playPause(): this;
    /**
     * @desc attempts to mute || unmute remote player
     */
    muteUnmute(): this;
    /**
     * @desc seeks remote player to present number provided in seconds
     * @param seconds
     */
    seek(seconds: number): this;
    /**
     * @desc Modifies the volume on the remote player
     * @param float
     */
    volume(float: number): this;
    /**
     * @desc Sends a message less then 64kb to the receiver device
     * @param obj
     */
    send(obj: any): Promise<void>;
    /**
     * @desc attempts to cast current media being played remote device
     * @param videoPlayer you can provide a video element or a MediaObject
     * @param obj
     */
    castMedia(videoPlayer: MediaObject | HTMLVideoElement, obj?: any): void;
    /**
     * @desc attempts to connect to remote device
     */
    connect(): void;
    /**
     * @desc disconnects from remote device
     */
    disconnect(): this;
    private reset(): void;
    private emit(name: string, data: CastEvent): void;
    private buildState(): VideoState;
    private buildEvent(): CastEvent;
    private init(tries: number): void;
    private isConnectedChanged(): void;
    private isMutedChanged(): void;
    private isPausedChanged(): void;
    private playerStateChanged(): void;
    private durationChanged(): void;
    private currentTimeChanged(): void;
    private volumeLevelChanged(): void;
}
export {};
