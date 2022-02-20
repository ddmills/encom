import { addBit, bitIntersection } from './util/bit-util';

export class Query {
    _cache = [];
    _onAddListeners = [];
    _onRemoveListeners = [];
    _immutableResult = true;

    constructor(world, filters) {
        this._world = world;

        const any = filters.any || [];
        const all = filters.all || [];
        const none = filters.none || [];

        this._any = any.reduce((s, c) => {
            return addBit(s, c.prototype._cbit);
        }, 0n);

        this._all = all.reduce((s, c) => {
            return addBit(s, c.prototype._cbit);
        }, 0n);

        this._none = none.reduce((s, c) => {
            return addBit(s, c.prototype._cbit);
        }, 0n);

        this._immutableResult =
            filters.immutableResult == undefined
                ? true
                : filters.immutableResult;

        this.refresh();
    }

    onEntityAdded(fn) {
        this._onAddListeners.push(fn);
    }

    onEntityRemoved(fn) {
        this._onRemoveListeners.push(fn);
    }

    has(entity) {
        return this.idx(entity) >= 0;
    }

    idx(entity) {
        return this._cache.indexOf(entity);
    }

    matches(entity) {
        const bits = entity._cbits;

        const any = this._any === 0n || bitIntersection(bits, this._any) > 0;
        const all = bitIntersection(bits, this._all) === this._all;
        const none = bitIntersection(bits, this._none) === 0n;

        return any && all && none;
    }

    candidate(entity) {
        const idx = this.idx(entity);
        const isTracking = idx >= 0;

        if (!entity.isDestroyed && this.matches(entity)) {
            if (!isTracking) {
                this._cache.push(entity);
                this._onAddListeners.forEach((cb) => cb(entity));
            }

            return true;
        }

        if (isTracking) {
            this._cache.splice(idx, 1);
            this._onRemoveListeners.forEach((cb) => cb(entity));
        }

        return false;
    }

    refresh() {
        this._cache = [];
        this._world._entities.forEach((entity) => {
            this.candidate(entity);
        });
    }

    get() {
        return this._immutableResult ? [...this._cache] : this._cache;
    }
}
