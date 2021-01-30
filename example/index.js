import Material from './components/Material';
import Position from './components/Position';
import Listener from './components/Listener';
import Health from './components/Health';
import Action from './components/Action';
import BeingPrefab from './prefabs/BeingPrefab';
import HumanPrefab from './prefabs/HumanPrefab';
import EquipmentSlot from './components/EquipmentSlot';
import { Engine } from '../src/index';

const ecs = new Engine();
const world = ecs.createWorld();

ecs.registerComponent(EquipmentSlot);
ecs.registerComponent(Material);
ecs.registerComponent(Position);
ecs.registerComponent(Listener);
ecs.registerComponent(Health);
ecs.registerComponent(Action);

ecs.registerPrefab(BeingPrefab);
ecs.registerPrefab(HumanPrefab);

const player = world.createEntity();
const sword = world.createEntity();

sword.add(Material, { name: 'bronze' });
player.add(Position, { x: 4, y: 12 });
player.add(EquipmentSlot, {
    name: 'leftHand',
    allowedTypes: ['hand'],
});
player.add(EquipmentSlot, {
    name: 'rightHand',
    allowedTypes: ['hand'],
});

console.log(player.serialize());

const q = world.createQuery({
    all: [Position],
});

q.get().forEach((e) => console.log(e.position));

// query = ecs.createQuery({
//     all: [Action], // entity must have all of these
//     any: [Health, Material], // entity must include at least one of these
//     none: [EquipmentSlot] // entity cannot include any of these
// });

// console.log(player.get('EquipmentSlot', 'leftHand').allowedTypes);
// console.log(player.equipmentSlot.rightHand.allowedTypes);
// player.equipmentSlot.rightHand.content = sword;

// const data = ecs.serialize();
// const human = ecs.createPrefab('HumanPrefab');

// ecs2.deserialize(data);

// const query = ecs.createQuery((entity) => entity.has('Position'));

// console.log(Object.keys(query.get()).length);
// human.remove('Position');
// console.log(Object.keys(query.get()).length);
// human.add(Position, { x: 4, y: 12 });
// console.log(Object.keys(query.get()).length);

// const thing = ecs.createEntity();
// thing.add('Position');

// console.log(thing.serialize());

// const evt = human.fireEvent('test', { some: 'data' });

// console.log(evt.data);
// console.log(evt.handled);

// human.add('Action', { name: 'a' });
// human.add('Action', { name: 'b' });
// human.add('Action', { name: 'c' });

// human.action[0].remove();

// console.log(human.Action);
// console.log(human.has('Action'));

// human.remove('Action');

// console.log(human.has('Action'));
