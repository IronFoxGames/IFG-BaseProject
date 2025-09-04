import { _decorator, Component, Node, AudioSource, instantiate, Prefab, warn, error, JsonAsset, resources, AudioClip } from 'cc';
import { SoundBuilder } from './SoundBuilder';
import { SoundData } from './SoundData';
import { SoundEmitter } from './SoundEmitter';
import { MusicData } from './MusicData';
import { ISettingsService } from '../services/ISettingsService';
import { Setting } from '../core/enums/Settings';
import { ICardScrambleService } from '../services/ICardScrambleService';
import { logger } from '../logging';
const { ccclass, property } = _decorator;

@ccclass('SoundManager')
export class SoundManager extends Component {
    private static _instance: SoundManager;

    @property(Prefab)
    soundEmitterPrefab: Prefab | null = null;

    @property({ tooltip: 'The default capacity of the sound emitter pool.' })
    defaultCapacity = 10;

    @property({ tooltip: 'The maximum capacity of the sound emitter pool.' })
    maxPoolSize = 100;

    @property({ tooltip: 'The maximum number of instances of any single sound that can be played at once.' })
    maxSoundInstances = 30;

    private soundDataMap: Map<string, SoundData> = new Map();

    private musicDataMap: Map<string, MusicData> = new Map();

    @property(AudioSource)
    music1Source: AudioSource | null = null;

    @property(AudioSource)
    music2Source: AudioSource | null = null;

    private currentMusicSource: AudioSource | null = null;

    private activeSoundEmitters: Node[] = [];
    public frequentSoundEmitters: Node[] = [];
    private soundEmitterPool: Node[] = [];

    public currentSFXVolume = 0.5;
    public currentMusicVolume = 0.5;
    public musicEnabled = true;
    public sfxEnabled = true;
    public platformSoundEnabled = true;

    private _currentMusic : AudioClip | null = null;
    private _settingsService: ISettingsService;
    private _cardScrambleService: ICardScrambleService;
    private _log = logger.child('SoundManager');

    public static get instance(): SoundManager {
        if (!SoundManager._instance) {
            const log = logger.child('SoundManager');
            log.warn('SoundManager instance is not yet initialized.');
        }
        return SoundManager._instance;
    }

    // INITIAL SETUP FUNCTIONS BELOW, THIS GETS ALL THE SOUNDS AND MAPS THEM TO THE SOUND DATA CLASS FOR USAGE

    onLoad() {}

    protected onDestroy(): void {
        this._cardScrambleService.unregisterPlatformSettingChanged(this._backendSettingChanged.bind(this));
    }

    public async init(settings: ISettingsService, cardScrambleService: ICardScrambleService) {
        if (SoundManager._instance) {
            error('Multiple instances of SoundManager detected.');
            return;
        }
        this._settingsService = settings;
        this._cardScrambleService = cardScrambleService;
        SoundManager._instance = this;
        this.initializePool();
        await this.loadSoundData();
        this.loadVolumeSettings();

        this._cardScrambleService.registerPlatformSettingChanged(this._backendSettingChanged.bind(this));
    }

    private loadVolumeSettings() {
        // Get Platform sound option
        this.platformSoundEnabled = this._cardScrambleService.getPlatformSetting<boolean>('sound');

        // Apply music volume and listen for changes
        this.musicEnabled = this._settingsService.getSetting<boolean>(Setting.MusicEnabled, true);
        this.currentMusicVolume = this._settingsService.getSetting<number>(Setting.MusicVolume, 0.5);
        this._settingsService.onSettingChanged(Setting.MusicVolume, (newValue) => {
            this.setMusicVolume(newValue as number);
        });
        this._settingsService.onSettingChanged(Setting.MusicEnabled, (newValue) => {
            this.musicEnabled = newValue as boolean;
            if (!this.musicEnabled || !this.platformSoundEnabled) {
                this.stopAllMusic();
            } else {
                this.restartMusic();
            }
        });

        // Apply SFX volume and listen for changes
        this.sfxEnabled = this._settingsService.getSetting<boolean>(Setting.SFXEnabled, true);
        this.currentSFXVolume = this._settingsService.getSetting<number>(Setting.SFXVolume, 0.5);
        this._settingsService.onSettingChanged(Setting.SFXVolume, (newValue) => {
            this.currentSFXVolume = newValue as number;
        });
        this._settingsService.onSettingChanged(Setting.SFXEnabled, (newValue) => {
            this.sfxEnabled = newValue as boolean;
            if (!this.musicEnabled || !this.platformSoundEnabled) {
                this.stopAllMusic();
            } else {
                this.restartMusic();
            }
        });
    }

    private async loadSoundData(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('config/audioConfig', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    this._log.error('SoundManager.loadSoundData(): Failed to load config/audioConfig: ', err);
                    reject(err);
                    return;
                }
                try {
                    const soundJson = jsonAsset.json;
                    if (!soundJson.Sounds) {
                        this._log.error('soundJson.Sounds is undefined');
                        return;
                    }

                    soundJson.Sounds.forEach((sound: SoundData) => {
                        this.soundDataMap.set(sound.soundName, sound);
                    });

                    soundJson.Music.forEach((music: MusicData) => {
                        this.musicDataMap.set(music.musicName, music);
                    });
                    resolve();
                } catch (err) {
                    this._log.error('SoundManager.loadSoundData(): Error during sound list initialization: ', err);
                    reject(err);
                }
            });
        });
    }

    //
    // SOUND MANAGEMENT FUNCTIONS BELOW
    //

    private initializePool() {
        for (let i = 0; i < this.defaultCapacity; i++) {
            const emitterNode = this.createSoundEmitter();
            this.soundEmitterPool.push(emitterNode);
        }
    }

    private createSoundEmitter(): Node {
        if (!this.soundEmitterPrefab) {
            this._log.error('SoundEmitter prefab is not assigned.');
            throw new Error('SoundEmitter prefab is not assigned.');
        }
        const emitterNode = instantiate(this.soundEmitterPrefab);
        const emitter = emitterNode.getComponent(SoundEmitter);
        if (!emitter) {
            this._log.error('SoundEmitter component is missing in the prefab.');
            throw new Error('SoundEmitter component is missing in the prefab.');
        }
        const audioSource = emitterNode.getComponent(AudioSource);
        if (!audioSource) {
            this._log.error('AudioSource component is missing in the prefab.');
            throw new Error('AudioSource component is missing in the prefab.');
        }
        audioSource.stop();
        this.node.addChild(emitterNode);
        return emitterNode;
    }

    public getSoundEmitter(): Node | null {
        if (this.soundEmitterPool.length > 0) {
            const emitterNode = this.soundEmitterPool.shift()!;
            emitterNode.active = true;
            this.activeSoundEmitters.push(emitterNode);
            return emitterNode;
        }

        if (this.activeSoundEmitters.length < this.maxPoolSize) {
            const emitterNode = this.createSoundEmitter();
            emitterNode.active = true;
            this.activeSoundEmitters.push(emitterNode);
            return emitterNode;
        }

        this._log.warn('SoundEmitter pool exceeded maximum capacity.');
        return null;
    }

    public getSoundDataByName(name: string): SoundData | null {
        const soundData = this.soundDataMap.get(name);
        if (!soundData) {
            this._log.error(`Sound data not found for name: ${name}`);
            return null;
        }
        return soundData;
    }

    public canPlaySound(soundData: SoundData): boolean {
        if (this.currentSFXVolume === 0) return false;

        if (!soundData.clip) {
            this._log.error('Tried to play sound but no clip is set');
            return false;
        }

        if (!soundData.frequentSound) return true;

        if (this.frequentSoundEmitters.length >= this.maxSoundInstances) {
            try {
                const firstEmitterNode = this.frequentSoundEmitters[0]!;
                const firstEmitter = firstEmitterNode.getComponent(SoundEmitter);
                firstEmitter?.stop();
                this.returnToPool(firstEmitterNode);
            } catch (error) {
                this._log.error('Error stopping the frequent sound:', error);
                return false;
            }
        }

        return true;
    }

    public returnToPool(emitterNode: Node): void {
        if (emitterNode) {
            emitterNode.active = false;
            //Remove this node from the active sound emitters list
            const index = this.activeSoundEmitters.indexOf(emitterNode);
            if (index !== -1) {
                this.activeSoundEmitters.splice(index, 1);
            }
            // If the sound emitter is a frequent sound, remove it from the frequent sound emitters list
            const frequentIndex = this.frequentSoundEmitters.indexOf(emitterNode);
            if (frequentIndex !== -1) {
                this.frequentSoundEmitters.splice(frequentIndex, 1);
            }
            this.soundEmitterPool.push(emitterNode);
        } else {
            this._log.warn('Attempted to return an invalid emitter node to the pool.');
        }
    }

    // Stop all sound emmitters with a specific name
    public stopSoundByName(name: string) {
        for (const emitterNode of this.activeSoundEmitters) {
            if (emitterNode.name === name) {
                const emitter = emitterNode.getComponent(SoundEmitter);
                emitter.stop();
                // The SoundEmitter will reset various things and return itself to the pool
            }
        }
    }

    public stopAllSounds() {
        for (const emitterNode of this.activeSoundEmitters) {
            const audioSource = emitterNode.getComponent(AudioSource);
            audioSource?.stop();
            this.returnToPool(emitterNode);
        }
    }

    public setSoundVolume(volume: number) {
        this.currentSFXVolume = volume;
        for (const emitterNode of this.activeSoundEmitters) {
            const audioSource = emitterNode.getComponent(AudioSource);
            if (audioSource) {
                audioSource.volume = volume;
            }
        }
    }

    public playSound(name: string) {
        if (!this.sfxEnabled || !this.platformSoundEnabled) {
            return;
        }
        this._createSound().play(name);
    }

    private _createSound() {
        return new SoundBuilder(this);
    }

    //
    // MUSIC MANAGEMENT FUNCTIONS BELOW
    //

    public playMusic(name: string, crossfade?: number) {
        const data = this.getMusicDataByName(name);
        if (!data) {
            this._log.warn('No music data found, check that music list is specified on the Music Manager object in your scene.');
            return;
        }

        let musicSource: AudioSource | null = null;
        let oldMusicSource: AudioSource | null = null;


        // Determine the current and next audio sources
        if (this.currentMusicSource === this.music1Source) {
            musicSource = this.music2Source;
            oldMusicSource = this.music1Source;
        } else {
            musicSource = this.music1Source;
            oldMusicSource = this.music2Source;
        }
        this.currentMusicSource = musicSource;
        musicSource.loop = data.loop;

        // Load the resource clip from the data here
        resources.load(data.clip, AudioClip, (err, clip) => {
            if (err) {
                this._log.error(`Failed to load AudioClip: ${data.clip}`);
                return;
            }
            this._currentMusic = clip;
        });

        if (!this.musicEnabled || !this.platformSoundEnabled) {
            return;
        }

        if (crossfade !== undefined) {
            // Handle crossfade
            this.musicFadeOut(oldMusicSource, crossfade);
            resources.load(data.clip, AudioClip, (err, clip) => {
                if (err) {
                    this._log.error(`Failed to load AudioClip: ${data.clip}`);
                    return;
                }
                resources.load(data.clip, AudioClip, (err, clip) => {
                    if (err) {
                        this._log.error(`Failed to load AudioClip: ${data.clip}`);
                        return;
                    }
                    this.musicFadeIn(musicSource, data.fadeInTimeSeconds, this.currentMusicVolume * data.volume);
                });
            });
        } else {
            // Handle fade out and fade in
            this.musicFadeOut(oldMusicSource, data.fadeOutTimeSeconds).then(() => {
                if (data.fadeInTimeSeconds > 0) {
                    musicSource.clip = this._currentMusic;
                    this.musicFadeIn(musicSource, data.fadeInTimeSeconds, this.currentMusicVolume * data.volume);
                } else {
                    musicSource.clip = this._currentMusic;
                    this.musicFadeIn(musicSource, 1, this.currentMusicVolume * data.volume);
                }
            });
        }
    }

    public musicFadeIn(audioSource: AudioSource, duration: number, volume: number, onComplete: (() => void) | null = null) {
        audioSource.volume = 0;
        audioSource.play();
        this.fadeVolume(audioSource, 0, this.currentMusicVolume, duration, onComplete);
    }

    public musicFadeOut(audioSource: AudioSource, duration: number, onComplete: (() => void) | null = null): Promise<void> {
        return new Promise<void>((resolve) => {
            this.fadeVolume(audioSource, audioSource.volume, 0, duration, () => {
                audioSource.stop();
                if (onComplete) onComplete();
                resolve();
            });
        });
    }

    private fadeVolume(
        audioSource: AudioSource,
        startVolume: number,
        endVolume: number,
        duration: number,
        onComplete: (() => void) | null = null
    ) {
        const startTime = performance.now();
        const updateVolume = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            audioSource.volume = startVolume + (endVolume - startVolume) * Math.min(elapsed / duration, 1);
            if (elapsed < duration) {
                requestAnimationFrame(updateVolume);
            } else if (onComplete) {
                onComplete();
            }
        };
        requestAnimationFrame(updateVolume);
    }

    public setMusicVolume(volume: number) {
        this.currentMusicVolume = volume;
        if (this.music1Source && this.music2Source) {
            this.music1Source.volume = volume;
            this.music2Source.volume = volume;
        }
    }

    public getMusicDataByName(name: string): MusicData | null {
        const musicData = this.musicDataMap.get(name);
        if (!musicData) {
            this._log.error(`Music data not found for name: ${name}`);
            return null;
        }
        return musicData;
    }

    public restartMusic() {
        if (!this.musicEnabled || !this.platformSoundEnabled) {
            return;
        }

        if (this.currentMusicSource && !this.currentMusicSource.playing) {
            this.currentMusicSource.clip = this._currentMusic;
            this.currentMusicSource.play();
        }
    }

    public fadeOutCurrentMusic(duration: number) {
        if (this.currentMusicSource) {
            this.musicFadeOut(this.currentMusicSource, duration);
        }
    }
    
    public fadeInCurrentMusic(duration: number) {
        if (this.currentMusicSource) {
            this.musicFadeIn(this.currentMusicSource, duration, this.currentMusicVolume);
        }
    }

    public stopAllMusic() {
        if (this.music1Source) {
            this.music1Source.stop();
        }
        if (this.music2Source) {
            this.music2Source.stop();
        }
    }

    private _backendSettingChanged(setting: string, value: string) {
        if (setting === 'sound') {
            if (value) {
                this.platformSoundEnabled = true;
            } else {
                this.platformSoundEnabled = false;
            }

            if (!this.musicEnabled || !this.platformSoundEnabled) {
                this.stopAllMusic();
            } else {
                this.restartMusic();
            }
        }
    }
}
