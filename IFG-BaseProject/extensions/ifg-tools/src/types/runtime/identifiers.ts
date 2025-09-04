type Mode = 'collect' | 'verify' | 'noop'

export const identifiers: Record<string, Set<string>> = {};

const parents: Record<string, string> = {};

export let mode: Mode = "collect";

export function reset() {
    mode = "collect";
    for (const identifier in identifiers) {
        delete identifiers[identifier];
    }
    for (const parent in parents) {
        delete parents[parent];
    }
}

export function setMode(m: Mode) {
    mode = m;
}

export function addIdentifier(kind: string, id: string) {
    // register as kind and its parents
    while (kind) {
        const ids = identifiers[kind] ?? new Set<string>();
        ids.add(id);
        identifiers[kind] = ids;
        kind = parents[kind];
    }
}

export function getIdentifiers() {
    return structuredClone(identifiers);
}

export function registerIdentifier(kind: string, id: string) {
    if (mode !== 'collect') {
        return;
    }
    addIdentifier(kind, id);
}

export function isValidReference(kind: string, id: string) {
    if (mode !== 'verify') {
        return true;
    }
    const set = identifiers[kind];
    if (!set) {
        return false;
    }
    return set.has(id);
}

export function isa(child: string, parent: string) {
    if (parents[child]) {
        throw new Error("multiple inheritance not supported");
    }

    parents[child] = parent;
}