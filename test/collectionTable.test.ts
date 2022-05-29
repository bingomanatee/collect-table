import createContext from '../src';

describe('CollectionTable', () => {
  describe('key', () => {
    it('should generate index from default with out config', () => {
      const ctx = createContext();

      const userTable = ctx.table('users');
      const bobKey = userTable.addRecord({ name: 'Bob', role: 'admin' });

      const user = userTable.getRecord(bobKey);
      expect(user.name).toBe('Bob');
      expect(user.role).toBe('admin');
    });
  });
});
