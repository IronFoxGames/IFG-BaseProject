import { Node, AudioSource, Vec3, AudioClip, error, resources } from 'cc';
import { SoundManager } from './SoundManager';
import { SoundEmitter } from './SoundEmitter';
import { logger } from '../logging';

export class SoundBuilder {
    private soundManager: SoundManager;
    private soundEmitter: Node | null = null;
    private emitter: SoundEmitter | null = null;
    private customName: string | null = null;
    private position: Vec3 = new Vec3(0, 0, 0);
    private _log = logger.child('SoundBuilder');

    constructor(soundManager: SoundManager) {
        this.soundManager = soundManager;
    }

    // Set the custom name for the sound
    public withName(name: string): SoundBuilder {
        this.customName = name;
        return this;
    }

    public play(soundName: any[] | string): void {
        if (typeof soundName === 'string') {
            // If a single string is provided, find the corresponding sound data
            const soundData = this.soundManager.getSoundDataByName(soundName);
            if (!soundData) {
                this._log.error(`No sound data found for name: ${soundName}`);
                return;
            }
            this.playSound(soundData);

            // If an array is provided, pick a random sound from the list
        } else if (Array.isArray(soundName)) {
            if (soundName.length === 0) {
                this._log.error('Attempted to play a sound using an empty list of sound data.');
                return;
            }
            const randomIndex = Math.floor(Math.random() * soundName.length);
            const selectedSoundName = soundName[randomIndex];
            const soundData = this.soundManager.getSoundDataByName(selectedSoundName);
            // Now delegate to the single SoundData playSound method
            this.playSound(soundData);
        } else {
            this._log.error('Invalid input: expected a string or an array of sound data.');
        }
    }

    public playSound(soundData: any): void {
        if (!soundData) {
            this._log.error('No data is defined for this item.');
            return;
        }

        if (!this.soundManager.canPlaySound(soundData)) {
            this._log.debug('Sound cannot be played.');
            return;
        }

        this.soundEmitter = this.soundManager.getSoundEmitter();
        if (!this.soundEmitter) {
            this._log.debug('No sound emitter available.');
            return;
        }

        const emitter = this.soundEmitter.getComponent(SoundEmitter);

        emitter
            .initialize(soundData, this.customName)
            .then(() => {
                if (soundData.frequentSound) {
                    this.soundManager.frequentSoundEmitters.push(this.soundEmitter);
                }

                emitter.play();
            })
            .catch((error) => {
                this._log.error('Sound Emitter Initialization failed:', error);
            });
    }
}
