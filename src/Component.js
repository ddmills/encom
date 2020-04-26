import EntityRefProperty from './properties/EntityRefProperty';
import SimpleProperty from './properties/SimpleProperty';
import AccessorProperty from './properties/AccessorProperty';
import EntityRefArrayProperty from './properties/EntityRefArrayProperty';

export default class Component {
    #entity = null;
    #ecs = null;
    #props = {};

    static allowMultiple = false;
    static accessorProperty = null;
    static properties = {};
    static eventMap = {};

    static get type() {
        return this.name;
    }

    get entity() {
        return this.#entity;
    }

    get eventMap() {
        return this.constructor.eventMap;
    }

    get ecs() {
        return this.#ecs;
    }

    get type() {
        return this.constructor.name;
    }

    get isAttached() {
        return Boolean(this.entity);
    }

    get allowMultiple() {
        return this.constructor.allowMultiple;
    }

    get accessorProperty() {
        return this.constructor.accessorProperty;
    }

    get properties() {
        return this.#props;
    }

    get accessor() {
        return this[this.accessorProperty];
    }

    constructor(ecs, properties = {}) {
        this.#ecs = ecs;
        this._defineProxies(properties);
    }

    getDefaultPropertyValue(propertyName) {
        const value = this.constructor.properties[propertyName];

        if (['<Entity>', '<EntitySet>'].includes(value)) {
            return undefined;
        }

        return value;
    }

    serialize() {
        return Object.entries(this.#props).reduce(
            (o, [key, value]) => ({
                ...o,
                [key]: value.serialize(),
            }),
            {}
        );
    }

    _onAttached(entity) {
        this.#entity = entity;
        this.ecs.queries.onComponentAdded(entity, this);
        this.onAttached();
    }

    _onDetached() {
        if (this.isAttached) {
            this.onDetached();
            const entity = this.#entity;

            this.#entity = null;
            this.ecs.queries.onComponentRemoved(entity, this);
        }
    }

    onAttached() {}

    onDetached() {}

    remove() {
        if (this.isAttached) {
            this.entity.remove(this);
        }
    }

    _onEvent(evt) {
        this.onEvent(evt);
        const handlerName = this.eventMap[evt.name];

        if (handlerName) {
            if (typeof this[handlerName] === 'function') {
                this[handlerName](evt);
            } else {
                console.warn(
                    `Component "${this.type}" has a handler specified for the "${evt.name}" event, but a function named "${handlerName}" could not be found on the "${this.type}" component.`
                );
            }
        }
    }

    onEvent(evt) {
        console.log(`${this.type} received ${evt.name}`);
    }

    _defineProxies(initialProperties) {
        Object.entries(this.constructor.properties).forEach(([key, value]) => {
            if (value === '<Entity>') {
                this.#props[key] = new EntityRefProperty(
                    this.#ecs,
                    initialProperties[key]
                );
            } else if (value === '<EntitySet>') {
                this.#props[key] = new EntityRefArrayProperty(
                    this.#ecs,
                    initialProperties[key]
                );
            } else if (key === this.accessorProperty) {
                const value = initialProperties.hasOwnProperty(key)
                    ? initialProperties[key]
                    : this.getDefaultPropertyValue(key);

                this.#props[key] = new AccessorProperty(value);
            } else {
                const value = initialProperties.hasOwnProperty(key)
                    ? initialProperties[key]
                    : this.getDefaultPropertyValue(key);

                this.#props[key] = new SimpleProperty(value);
            }

            Object.defineProperty(this, key, {
                enumerable: true,
                set(v) {
                    this.#props[key].value = v;
                },
                get() {
                    return this.#props[key].value;
                },
            });
        });
    }
}
