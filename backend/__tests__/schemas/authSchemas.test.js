const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../../schemas/authSchemas');

describe('authSchemas', () => {
  test('registerSchema принимает корректные данные', () => {
    const { error, value } = registerSchema.validate({
      email: ' user@example.com ',
      password: '123456',
      full_name: ' Иван Иванов ',
      phone: '+79999999999'
    });

    expect(error).toBeUndefined();
    expect(value.email).toBe('user@example.com');
    expect(value.full_name).toBe('Иван Иванов');
  });

  test('registerSchema отклоняет короткий пароль', () => {
    const { error } = registerSchema.validate({
      email: 'user@example.com',
      password: '123',
      full_name: 'Иван'
    });

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('Пароль должен быть не менее 6 символов');
  });

  test('loginSchema отклоняет некорректный email', () => {
    const { error } = loginSchema.validate({ email: 'bad-email', password: '123456' });

    expect(error).toBeDefined();
    expect(error.details[0].message).toContain('Некорректный формат email');
  });

  test('changePasswordSchema требует оба пароля', () => {
    expect(changePasswordSchema.validate({ oldPassword: '123456', newPassword: 'abcdef' }).error).toBeUndefined();
    expect(changePasswordSchema.validate({ oldPassword: '123456' }).error).toBeDefined();
  });

  test('forgotPasswordSchema принимает email', () => {
    expect(forgotPasswordSchema.validate({ email: 'user@example.com' }).error).toBeUndefined();
  });

  test('resetPasswordSchema требует token и newPassword', () => {
    expect(resetPasswordSchema.validate({ token: 'abc', newPassword: '123456' }).error).toBeUndefined();
    expect(resetPasswordSchema.validate({ token: 'abc' }).error).toBeDefined();
  });
});
