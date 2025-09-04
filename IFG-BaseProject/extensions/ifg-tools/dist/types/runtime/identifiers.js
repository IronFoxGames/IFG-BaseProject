"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isa = exports.isValidReference = exports.registerIdentifier = exports.getIdentifiers = exports.addIdentifier = exports.setMode = exports.reset = exports.mode = exports.identifiers = void 0;
exports.identifiers = {};
const parents = {};
exports.mode = "collect";
function reset() {
    exports.mode = "collect";
    for (const identifier in exports.identifiers) {
        delete exports.identifiers[identifier];
    }
    for (const parent in parents) {
        delete parents[parent];
    }
}
exports.reset = reset;
function setMode(m) {
    exports.mode = m;
}
exports.setMode = setMode;
function addIdentifier(kind, id) {
    var _a;
    // register as kind and its parents
    while (kind) {
        const ids = (_a = exports.identifiers[kind]) !== null && _a !== void 0 ? _a : new Set();
        ids.add(id);
        exports.identifiers[kind] = ids;
        kind = parents[kind];
    }
}
exports.addIdentifier = addIdentifier;
function getIdentifiers() {
    return structuredClone(exports.identifiers);
}
exports.getIdentifiers = getIdentifiers;
function registerIdentifier(kind, id) {
    if (exports.mode !== 'collect') {
        return;
    }
    addIdentifier(kind, id);
}
exports.registerIdentifier = registerIdentifier;
function isValidReference(kind, id) {
    if (exports.mode !== 'verify') {
        return true;
    }
    const set = exports.identifiers[kind];
    if (!set) {
        return false;
    }
    return set.has(id);
}
exports.isValidReference = isValidReference;
function isa(child, parent) {
    if (parents[child]) {
        throw new Error("multiple inheritance not supported");
    }
    parents[child] = parent;
}
exports.isa = isa;
