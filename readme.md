#### geotic

_adjective_ physically concerning land or its inhabitants.

-   **entity** a unique id and a collection of components
-   **component** a data container
-   **query** a way to gather collections of entities that match some criteria, for use in systems.
-   **prefab** a pre-defined collection of components and even other prefabs to quickly build entities
-   **event** a message to an entity and it's components

This library is _heavily_ inspired by ECS in Caves of Qud:

-   [Thomas Biskup - There be dragons: Entity Component Systems for Roguelikes](https://www.youtube.com/watch?v=fGLJC5UY2o4&t=1534s)
-   [Brian Bucklew - AI in Qud and Sproggiwood](https://www.youtube.com/watch?v=4uxN5GqXcaA)
-   [Brian Bucklew - Data-Driven Engines of Qud and Sproggiwood](https://www.youtube.com/watch?v=U03XXzcThGU)

### usage

```
npm install geotic
```

Below is a contrived example which shows the absolute basics of geotic. [A larger example
with pixi, rollup, and babel, can be found here.](https://github.com/ddmills/geotic-example)

```js
import { Engine, Component, Prefab } from 'geotic';

const ecs = new Engine();

// define some simple components
class Position extends Component {
    static properties { x: 0, y: 0 };
}
class Velocity extends Component {
    static properties { x: 0, y: 0 };
}
class Frozen extends Component {
}

// all Components and Prefabs must be `registered` by the engine
ecs.registerComponent(Position);
ecs.registerComponent(Velocity);
ecs.registerComponent(Frozen);

...

// Create an empty entity. Call `entity.id` to get the unique ID.
const entity = ecs.createEntity();

// add Position and Velocity components to this entity
entity.addComponent(Position, { x: 4, y: 10 });
entity.addComponent(Velocity, { x: 1, y: .25 });

// create a query that tracks all components that have both a `Position`
// and `Velocity` component but not a `Frozen` component. A query can
// have any combination of `all`, `none` and `any`
const kinematics = ecs.createQuery({
    all: [Position, Velocity],
    none: [Frozen]
});

...

const loop = (dt) => {
    // loop over the result set to update the position for all entities
    // in the query. The query will always return an up-to-date `Set`
    // containing entities that match
    kinematics.get().forEach((entity) => {
        entity.position.x += entity.velocity.x * dt;
        entity.position.y += entity.velocity.y * dt;
    });
};

const data = ecs.serialize(); // serialize the game state into a javascript object

...

ecs.deserialize(data); // convert the serialized data back into entities and components

```

### entities

> a unique id and a collection of components

```js
const zombie = engine.createEntity();

zombie.add('Name', { value: 'Donnie' });
zombie.add('Position', { x: 2, y: 0, z: 3 });
zombie.add('Velocity', { x: 0, y: 0, z: 1 });
zombie.add('Health', { value: 200 });
zombie.add('Enemy');
```

Entity properties and methods:

-   **id**: the entities' unique id. Generated by the engine.
-   **ecs**: the geotic Engine instance
-   **isDestroyed**: returns `true` if this entity is destroyed
-   **components**: all component instances attached to this entity
-   **add(componentName, props={})**: create and add registered component to the entity
-   **has(componentName, key='')**: returns true if entity has component
-   **get(componentName, key='')**: get a component attached to this entity
-   **owns(component)**: returns `true` if the specified component belongs to this entity
-   **destroy()**: destroy the entity and all of it's components
-   **remove(componentName, key='')**: remove (detach) component from the entity
-   **attach(component)**: attach a component that has been removed
-   **serialize()**: serialize this entity and it's components
-   **fireEvent(name, data={})**: send an event to all components on the entity

### components

> a data container

A component must be defined and then registered with the Engine. This example defines a simple `Health` component:

```js
import { Component } from 'geotic';

class Health extends Component {
    // these props are defaulting to 10
    // anything defined here will be serialized
    static properties {
        current: 10,
        maximum: 10,
    };

    // arbitrary helper methods and properties can be declared on
    // components. Note that these will NOT be serialized
    get isAlive() {
        return this.current > 0;
    }

    // This is automatically invoked when a `damage-taken` event is fired
    // on the entity: `entity.fireEvent('damage-taken', { damage: 12 })`
    // the `camelcase` library is used to map event names to methods
    onDamageTaken(evt) {
        // event `data` is an arbitray object passed as the second parameter
        // to entity.fireEvent(...)
        this.reduce(evt.data.damage);

        // handling the event will prevent it from continuing
        // to any other components on the entity
        evt.handle();
    }

    reduce(amount) {
        this.current = Math.max(this.current - amount, 0);
    }

    heal(amount) {
        this.current = Math.min(this.current + amount, this.maximum);
    }
}
```

Component properties and methods:

-   **static properties = {}** object that defines the properties of the component. These can also reference an entity or
    an array of entites by setting the default value to `<Entity>` and `<EntityArray>` respectively!
-   **static allowMultiple = false** are multiple of this component type allowed? If true, components will either be stored as an object or array on the entity, depending on `keyProperty`.
-   **static keyProperty = null** what property should be used as the key for accessing this component. if `allowMultiple` is false, this has no effect. If this property is omitted, it will be stored as an array on the component.
-   **isAttached** returns `true` if this component is attached to an entity
-   **isDestroyed** returns `true` if this component is destroyed
-   **properties** returns the properties
-   **serialize()** serialize just this component
-   **destroy()** remove and destroy this component
-   **remove(destroy = true)** remove this component. if `destroy=true` then this behaves the same as `destroy()`
-   **onAttached()** override this method to add behavior when this component is attached (added) to an entity
-   **onDetached()** override this method to add behavior when this component is detached (removed) to an entity
-   **onDestroyed()** override this method to add behavior when this component is destroyed
-   **onEvent(evt)** override this method to capture all events coming to this component

This example shows how `allowMultiple` and `keyProperty` work:

```js
class Impulse extends Component {
    static properties = {
        x: 0,
        y: 0,
    };
    static allowMultiple = true;
}

ecs.registerComponent(Impulse);

...

// add multiple `Impulse` components to the player
player.add(Impulse, { x: 3, y: 2 });
player.add(Impulse, { x: 1, y: 0 });
player.add(Impulse, { x: 5, y: 6 });

...

// returns the array of Impulse components. Same as `player.impulse`
player.get(Impulse);
// returns the Impulse at position `2`. Similar to `player.impulse[2]`,
// but will exit early if the entity does not have the `Impulse` component.
player.get(Impulse, 2);
// returns `true` if the component has an `Impulse` component
player.has(Impulse);
// returns `true` if the component has a third `Impulse` component
player.has(Impulse, 2);

// the `player.impulse` property is an array
player.impulse.forEach((impulse) => {
    console.log(impulse.x, impulse.y);
});

// remove and destroy all `Impulse` components attached to this entity
player.remove(Impulse);

...

class EquipmentSlot extends Component {
    static properties = {
        name: 'hand',
        item: '<Entity>', // this is a special property which can reference other Entities
    };
    static allowMultiple = true;
    static keyProperty = 'name';
}

ecs.registerComponent(EquipmentSlot);

...

const player = ecs.createEntity();
const helmet = ecs.createEntity();
const sword = ecs.createEntity();

// add equipment slot components to the player. Notice that the `item`
// property can be assigned an entity
player.add(EquipmentSlot, { name: 'rightHand' });
player.add(EquipmentSlot, { name: 'leftHand', item: sword });
player.add(EquipmentSlot, { name: 'head', item: helmet });
...

// since the `EquipmentSlot` had a `keyProperty=name`, the `name`
// is used to access them
player.equipmentSlot.head;
player.get(EquipmentSlot, 'head'); // same as above
player.has(EquipmentSlot, 'head'); // true

// this will `destroy` the `sword` entity and automatically
// set the `rightHand.item` property to `null`
player.equipmentSlot.rightHand.item.destroy();

// remove and destroy the `rightHand` equipment slot
player.remove(EquipmentSlot, 'rightHand');

```

### queries

Queries keep track of sets of entities defined by component types.

```js
const query = ecs.createQuery({
    any: [A, B], // exclude any entity that does not have at least one of A OR B.
    all: [C, D], // exclude entities that don't have both C AND D
    none: [E, F], // exclude entities that have E OR F
});

query.get().forEach((entity) => ...);
```

-   **query.get()** get the result [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) of the query
-   **isMatch(entity)** returns `true` if the given `entity` matches this query. Mostly used internally.
-   **bustCache()** manually bust the query cache. Not recommended, as the query should always be up to date.

### serialization

**example** Save game state by serializing all entities and components

```js
const saveGame = () => {
    const data = ecs.serialize();
    localStorage.setItem('savegame', data);
};

...

const loadGame = () => {
    const data = localStorage.getItem('savegame');
    ecs.deserialize(data);
};
```

### event

> message sent to all components on an entity

The geotic event system is modelled aver this talk by [Brian Bucklew - AI in Qud and Sproggiwood](https://www.youtube.com/watch?v=4uxN5GqXcaA).

```js
// a `Health` component which listens for a `take damage` event
class Health extends Component {
    ...
    // event names are mapped to methods using the `camelcase` library.
    onTakeDamage(evt) {
        console.log(evt);
        this.value -= evt.data.amount;

        // the event gets passed to all components the `entity` unless a component
        // invokes `evt.prevent()` or `evt.handle()`
        evt.handle();
    }

    // watch ALL events coming to component
    onEvent(evt) {
        console.log(evt.name);
        console.log(evt.is('take-damage'));
    }
}

...

entity.add(Health);

const evt = entity.sendEvent('take-damage', { amount: 12 });

console.log(evt.name); // return the name of the event. "take-damage"
console.log(evt.data); // return the arbitrary data object attached. { amount: 12 }
console.log(evt.handled); // was `handle()` called?
console.log(evt.prevented);  // was `prevent()` or `handle()` called?
console.log(evt.handle()); // handle and prevent the event from continuing
console.log(evt.prevent()); // prevent the event from continuing without marking `handled`
console.log(evt.is('take-damage')); // simple name check

```

### prefab

> a predefined collection of components

The prefab system is modelled after this talk by [Thomas Biskup - There be dragons: Entity Component Systems for Roguelikes](https://www.youtube.com/watch?v=fGLJC5UY2o4&t=1534s).

```js
// prefabs must be registered before they can be instantiated
ecs.registerPrefab({
    name: 'Being',
    components: [
        {
            type: 'Position',
            properties: {
                x: 4,
                y: 10,
            },
        },
        {
            type: 'Material',
            properties: {
                name: 'flesh',
            },
        },
    ],
});

ecs.registerPrefab({
    // name used when creating the prefab
    name: 'HumanWarrior',
    // an array of other prefabs of which this one derives.
    inherit: ['Being', 'Warrior'],
    // an array of components to attach
    components: [
        {
            // this can be a constructor name, or a reference directly to the component class
            type: 'EquipmentSlot',
            // what properties should be assigned to the component
            properties: {
                name: 'head',
            },
        },
        {
            // components that allow multiple can easily be added in
            type: 'EquipmentSlot',
            properties: {
                name: 'legs',
            },
        },
        {
            type: 'Material',
            // if a parent prefab already defines a `Material` component, this flag
            // will say how to treat it. Defaults to overwrite=true
            overwrite: true,
            properties: {
                name: 'silver',
            },
        },
    ],
});

...

const warrior1 = ecs.createPrefab('HumanWarrior');

// property overrides can be provided as the second argument
const warrior2 = ecs.createPrefab('HumanWarrior', {
    equipmentSlot: {
        head: {
            item: ecs.createPrefab('Helmet')
        },
    },
    position: {
        x: 12,
        y: 24,
    },
});
```

## Dev notes

-   ✓ deserialize
    -   ✓ basic serialize/deserialize from object
    -   ✓ onAttached safely access entity
-   ✓ serialize
    -   only serialize if value is different from default (?)
-   prefab
    -   ✓ prefab base class
    -   ✓ prefab registry
    -   ✓ poly inherit
    -   ✓ PrefabComponent types
        -   ✓ component definition
        -   ✓ initial props
        -   ✓ should overwrite or replace
        -   ✓ applyToEntity(entity)
    -   reference prefab chain on entity
        -   entity.is(prefab)
    -   ✓ allow overrides on prefab instantiation
    -   https://www.youtube.com/watch?v=fGLJC5UY2o4
-   ✓ query
    -   ✓ cache
    -   ✓ filter
    -   ✓ return Set instead of Object
    -   ✓ filter destroyed entities by default
    -   ✓ query definition
        -   ✓ any
        -   ✓ all
        -   ✓ none
    -   ✓ query.get
    -   query.onEntityIncluded(e)
    -   query.onEntityRemoved(e)
-   logging configuration
    -   route all console logs to logger
    -   check all console log statements
-   tags
-   properties
    -   ✓ EntityArray
    -   EntitySet
    -   Prefab
    -   PrefabSet
-   ✓ events
    -   ✓ https://www.youtube.com/watch?v=4uxN5GqXcaA
    -   ✓ entity.sendEvent(event)
    -   ✓ component.handleEvent(event)
    -   ✓ an event to an entity will send it to all child components
    -   ✓ child component can "cancel" the event to prevent it bubbling (?)
    -   ✓ component eventMap
    -   ✓ replace eventMap with direct method calls
    -   global events (sent from Engine)
-   dev
    -   ✓ sourcemaps
    -   ✓ prettier
    -   ✓ rollup
    -   github npm deploy action
-   component
    -   ✓ default property values
    -   ✓ property.deserialize(data)
    -   ✓ remove()
        -   ✓ ensure works with key components
    -   ✓ destroy()
    -   ✓ onDestroyed()
    -   clone
    -   ✓ allowMultiple without specifying keyProperty
    -   ✓ rename accessor to `key`
    -   rename `type` to `definitionType`
-   registry
    -   warn if component malformed (?)
-   prefab caching
    -   only instantiate components when different from defaults
    -   less instances
-   ✓ Entity registry
-   Entity
    -   ✓ keep track of refs
    -   ✓ destroy()
        -   ✓ component.onDestroy()
        -   ✓ property.onDestroy() (do ref cleanup)
    -   removing keyed component without key should remove all
    -   ✓ add(type, properties);
    -   control how components are named
    -   ✓ camelCase component access
-   Performance
    -   Use raw for loops
    -   ✓ store entities as array instead of object (?)
