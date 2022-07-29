import pets from './owned_pets.json' assert { type: 'json' }
import people from './test_users.json' assert { type: 'json' }

export default function makeContext(createContext, joinFreq) {
  const ctx = createContext(
    [
      {
        name: 'pets',
        data: pets,
        key: 'id'
      },
      {
        name: 'people',
        data: people,
        key: 'id'
      }
    ],
    {
      joins: [
        {
          name: 'owned pets',
          from: {
            tableName: 'people',
            frequency: joinFreq.noneOrOne,
          },
          to: {
            tableName: 'pets',
            frequency: joinFreq.noneOrMore,
            key: 'owner_id'
          },
        }
      ]
    });
  return (ctx);

}
