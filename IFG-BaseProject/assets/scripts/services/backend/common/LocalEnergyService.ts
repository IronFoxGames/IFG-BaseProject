import { Currency } from '../../../core/enums/Currency';
import { logger } from '../../../logging';
import { CurrencySaveData, SaveData } from '../../SaveData';

class EnergySettings {
    energySoftCap: number = 8;
    energyAutoIncomeInterval: number = 1200;
}

export class LocalEnergyService {
    private _energySettings: EnergySettings = new EnergySettings();
    private _currentEnergy: number = 0;
    private _timeUntilEnergyEarned: number = 0;
    private _lastAutoEnergyTimestamp: number = 0;
    private _claimingEnergy: boolean = false;
    private _saveData: SaveData;

    private _log = logger.child('LocalEnergyService');

    public constructor(saveData: SaveData) {
        this._saveData = saveData;

        if (this._saveData.currencySaveData.has(Currency.Energy)) {
            this._currentEnergy = this._saveData.currencySaveData.get(Currency.Energy).amount;
        } else {
            this._currentEnergy = this._energySettings.energySoftCap;

            this._saveData.currencySaveData.set(Currency.Energy, new CurrencySaveData());
            this._saveData.currencySaveData.get(Currency.Energy).amount = this._currentEnergy;
        }

        this._lastAutoEnergyTimestamp = this._saveData.lastAutoEnergyTimestamp;
    }

    public getEnergySoftCap() {
        return this._energySettings.energySoftCap;
    }

    public getCurrentEnergy() {
        return this._currentEnergy;
    }

    public getTimeUntilNextEnergy() {
        return this._timeUntilEnergyEarned;
    }

    public addEnergy(amount: number) {
        this._currentEnergy += amount;
        this._saveData.currencySaveData.get(Currency.Energy).amount = this._currentEnergy;
    }

    public reduceEnergy(amount: number) {
        this._currentEnergy -= amount;
        if (this._currentEnergy < 0) this._currentEnergy = 0;

        this._saveData.currencySaveData.get(Currency.Energy).amount = this._currentEnergy;
    }

    public updateFromTimestamp(timestamp: number): number {
        //console.log("update from timestamp! " + timestamp);
        const nextEnergyTime = this._lastAutoEnergyTimestamp + this._energySettings.energyAutoIncomeInterval * 1000;
        //console.log("next energy time: " + nextEnergyTime);
        this._timeUntilEnergyEarned = nextEnergyTime - timestamp;
        //console.log("time until energy earned: " + this._timeUntilEnergyEarned);

        if (this._timeUntilEnergyEarned < 0 && this._currentEnergy < this._energySettings.energySoftCap && !this._claimingEnergy) {
            this._claimingEnergy = true;
            // this._syncStats({}, { event: 'energy-auto-income' }).then(async () => {
            //     await this._updateFromServerStats();
            //     this._claimingEnergy = false;
            // });

            var energyToGain = Math.ceil(this._timeUntilEnergyEarned / -(this._energySettings.energyAutoIncomeInterval * 1000));
            if (energyToGain + this._currentEnergy > this._energySettings.energySoftCap) {
                energyToGain = this._energySettings.energySoftCap - this._currentEnergy;
            }

            this._currentEnergy += energyToGain;
            this._lastAutoEnergyTimestamp += this._energySettings.energyAutoIncomeInterval * 1000 * energyToGain;
            this._saveData.lastAutoEnergyTimestamp = this._lastAutoEnergyTimestamp;

            this._saveData.currencySaveData.get(Currency.Energy).amount = this._currentEnergy;

            this._claimingEnergy = false;

            return energyToGain;
        } else if (this._currentEnergy >= this._energySettings.energySoftCap) {
            this._lastAutoEnergyTimestamp = timestamp;
            this._saveData.lastAutoEnergyTimestamp = this._lastAutoEnergyTimestamp;
            //console.log("last auto energy timestamp: " + this._lastAutoEnergyTimestamp);
        }

        return 0;
    }
}
