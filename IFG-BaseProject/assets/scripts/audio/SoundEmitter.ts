import { _decorator, Component, AudioSource, tween, Tween, AudioClip, resources, director, Director } from 'cc';
import { SoundManager } from './SoundManager';
import { SoundData } from './SoundData';
import { logger } from '../logging';

const { ccclass, property } = _decorator;

@ccclass('SoundEmitter')
export class SoundEmitter extends Component {
    private audioSource: AudioSource | null = null;
    private soundData: SoundData | null = null;
    private fadeOutTween: Tween<AudioSource> | null = null;
    private fadeInTween: Tween<AudioSource> | null = null;
    private initializationComplete = false;
    private _log = logger.child('SoundEmitter');

    onLoad() {
        this.audioSource = this.getComponent(AudioSource);
        if (!this.audioSource) {
            this._log.warn('AudioSource component is missing on SoundEmitter.');
        }
    }

    // Initialize the emitter with SoundData, custom name is optional
    public initialize(data: SoundData, customName?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.soundData = data;

            if (this.audioSource) {
                this.audioSource.volume = data.fadeIn ? 0 : data.volume; // Start at 0 volume if fading in

                resources.load(
                    Array.isArray(data.clip) ? data.clip[Math.floor(Math.random() * data.clip.length)] : data.clip,
                    AudioClip,
                    (err, clip) => {
                        if (err) {
                            this._log.error(`Failed to load sound clip: ${data.clip}`, err);
                            reject(err);
                            return;
                        }

                        this.audioSource.clip = clip;
                        this.audioSource.volume = SoundManager.instance.currentSFXVolume * this.soundData.volume;

                        if (!customName) {
                            this.node.name = data.soundName || 'Unnamed Sound';
                        } else {
                            this.node.name = customName;
                        }

                        // TODO: Figure out how to handle pitch shifting in Cocos, no pitch controls for AudioSource
                        // if (data.randomPitch) {
                        //     const pitch = Math.random() * (data.pitchMax - data.pitchMin) + data.pitchMin;
                        //     this.audioSource.pitch = pitch;
                        // }

                        this.audioSource.loop = data.loop;
                        this.audioSource.playOnAwake = data.playOnAwake;

                        this.initializationComplete = true;
                        resolve();
                    }
                );
            } else {
                // If there is no audioSource, bail out immediately
                resolve();
            }
        });
    }

    public async play() {
        if (!this.audioSource || !this.soundData) return;

        if (this.soundData.fadeIn === true) {
            this.fadeIn(this.soundData.fadeInTimeSeconds, this.soundData.volume);
        } else {
            this.audioSource.play();
        }

        // Wait for the next frame to ensure the audio source is playing
        await new Promise((resolve) => {
            director.once(Director.EVENT_AFTER_UPDATE, resolve);
        });

        // If not looping, wait until the audio source stops playing
        if (!this.soundData.loop) {
            await this.waitForAudioToStop();
            this.stop();
        }
    }

    private async waitForAudioToStop(): Promise<void> {
        if (!this.audioSource) return;
        while (this.audioSource.playing) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    // Stop sound with optional fade-out, return emitter to the pool.
    public stop() {
        if (!this.audioSource || !this.soundData) return;

        if (this.soundData.fadeOut === true) {
            this.fadeOut(this.soundData.fadeOutTimeSeconds);
        } else {
            this.audioSource.stop();
            this.initializationComplete = false;
            this.audioSource.clip = null;
            this.audioSource.playOnAwake = false;
            SoundManager.instance.returnToPool(this.node);

            // If the sound is in the list of frequent emitters, remove it
            const index = SoundManager.instance.frequentSoundEmitters.indexOf(this.node);
            if (index !== -1) {
                SoundManager.instance.frequentSoundEmitters.splice(index, 1);
            }
        }
    }

    // Fade-in over the specified duration.
    private fadeIn(duration: number, targetVolume: number) {
        if (!this.audioSource) return;

        this.audioSource.play();
        this.fadeInTween?.stop();
        this.fadeInTween = tween(this.audioSource).to(duration, { volume: targetVolume }, { easing: 'linear' }).start();
    }

    // Fade-out over the specified duration, then stop the sound and return the emitter to the pool.
    private fadeOut(duration: number) {
        if (!this.audioSource) return;

        this.fadeOutTween?.stop();
        this.fadeOutTween = tween(this.audioSource)
            .to(duration, { volume: 0 }, { easing: 'linear' })
            .call(() => {
                this.audioSource?.stop();
                SoundManager.instance.returnToPool(this.node);
            })
            .start();
    }
}
