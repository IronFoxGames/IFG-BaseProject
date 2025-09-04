"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PowerupType = exports.BoosterType = void 0;
// These string values map to item definitions in boosters.json
// If you change or add boosters; update their data definitions too.
var BoosterType;
(function (BoosterType) {
    BoosterType["None"] = "None";
    BoosterType["DeucesWild"] = "powerup_deuceswild";
    BoosterType["LoosenTheBelt"] = "powerup_loosenyourbelt";
})(BoosterType = exports.BoosterType || (exports.BoosterType = {}));
// These string values map to item definitions in boosters.json
// If you change or add powerups; update their data definitions too.
var PowerupType;
(function (PowerupType) {
    PowerupType["None"] = "None";
    PowerupType["CookingTheBooks"] = "powerup_cookingthebooks";
    PowerupType["ExtraServings"] = "powerup_extraservings";
    PowerupType["Joker"] = "powerup_joker";
    PowerupType["Refire"] = "powerup_refire";
    PowerupType["Plus7Cards"] = "powerup_plus7cards";
    PowerupType["FreeDessert"] = "powerup_freedessert";
    PowerupType["CleanDown"] = "powerup_cleandown";
})(PowerupType = exports.PowerupType || (exports.PowerupType = {}));
