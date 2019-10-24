import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';

describe('User entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.password = 'testPassword';
    user.salt = 'testSalt';
    bcrypt.hash = jest.fn();
  });

  describe('validatePassword', () => {
    it('returns true if password is valid', async () => {
      bcrypt.hash.mockReturnValue(user.password);

      expect(bcrypt.hash).not.toHaveBeenCalled();

      const result = await user.validatePassword(user.password);

      expect(bcrypt.hash).toHaveBeenCalledWith(user.password, user.salt);
      expect(result).toEqual(true);
    });

    it('returns false if password is invalid', async () => {
      const invalidPassword = 'invalid password';
      bcrypt.hash.mockReturnValue(invalidPassword);

      expect(bcrypt.hash).not.toHaveBeenCalled();

      const result = await user.validatePassword(invalidPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(invalidPassword, user.salt);
      expect(result).toEqual(false);
    });
  });
});
