const _ = require('lodash');
const fs = require('fs');
const pets = require('./test_pets.json');
const people = require('./test_users.json');

let shuffled = _.shuffle(pets);

people.forEach(person => {
  if (!shuffled.length) {
    shuffled = _.shuffle(pets);
  }
  const pet = shuffled.pop();
  pet.owner_id = person.id;
});

fs.writeFileSync('./owned_pets.json', JSON.stringify(pets, true, 2));
