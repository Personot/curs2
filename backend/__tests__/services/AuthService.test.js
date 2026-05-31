const bcrypt = require('bcryptjs');
const AuthService = require('../../services/AuthService');
const ROLES = require('../../constants/roles');

function createDeps(overrides = {}) {
  const userRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createNewUser: jest.fn(),
    updateUser: jest.fn(),
    updatePassword: jest.fn(),
    saveVerificationCode: jest.fn(),
    savePasswordResetToken: jest.fn(),
    findPasswordResetToken: jest.fn(),
    deletePasswordResetToken: jest.fn(),
    saveRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    verifyCode: jest.fn(),
    markVerificationCodeAsUsed: jest.fn(),
    markEmailAsVerified: jest.fn(),
    ...overrides.userRepository
  };

  const logRepository = {
    create: jest.fn(),
    ...overrides.logRepository
  };

  const emailService = {
    sendVerificationCode: jest.fn(),
    sendResetPasswordEmail: jest.fn(),
    ...overrides.emailService
  };

  return {
    userRepository,
    logRepository,
    emailService,
    service: new AuthService(userRepository, logRepository, emailService)
  };
}

describe('AuthService', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      JWT_SECRET: 'test_jwt_secret',
      JWT_EXPIRES_IN: '1h',
      EMAIL_USER: 'mailer@example.com'
    };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe('login', () => {
    test('возвращает пользователя и JWT при корректном пароле', async () => {
      const passwordHash = await bcrypt.hash('123456', 10);
      const user = {
        id: 1,
        email: 'user@example.com',
        password_hash: passwordHash,
        role_id: ROLES.CLIENT,
        is_active: true,
        deleted_at: null
      };
      const { service, userRepository } = createDeps();
      userRepository.findByEmail.mockResolvedValue(user);

      const result = await service.login('user@example.com', '123456');

      expect(result.user).toBe(user);
      expect(result.token).toEqual(expect.any(String));
      expect(service.verifyToken(result.token)).toMatchObject({
        id: 1,
        email: 'user@example.com',
        role_id: ROLES.CLIENT
      });
    });

    test('выбрасывает ошибку если пользователь не найден', async () => {
      const { service, userRepository } = createDeps();
      userRepository.findByEmail.mockResolvedValue(undefined);

      await expect(service.login('missing@example.com', '123456')).rejects.toThrow('Пользователь не найден');
    });

    test('выбрасывает ошибку если аккаунт заблокирован', async () => {
      const passwordHash = await bcrypt.hash('123456', 10);
      const { service, userRepository } = createDeps();
      userRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'blocked@example.com',
        password_hash: passwordHash,
        role_id: ROLES.CLIENT,
        is_active: false,
        deleted_at: null
      });

      await expect(service.login('blocked@example.com', '123456')).rejects.toThrow('Ваш аккаунт заблокирован');
    });

    test('выбрасывает ошибку при неверном пароле', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      const { service, userRepository } = createDeps();
      userRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'user@example.com',
        password_hash: passwordHash,
        role_id: ROLES.CLIENT,
        is_active: true,
        deleted_at: null
      });

      await expect(service.login('user@example.com', 'wrong-password')).rejects.toThrow('Неверный email или пароль');
    });
  });

  describe('register', () => {
    test('запрещает регистрацию с одноразовой почтой', async () => {
      const { service } = createDeps();

      await expect(
        service.register('test@tempmail.com', '123456', 'Иван Иванов')
      ).rejects.toThrow('Используйте постоянный email адрес');
    });

    test('создает нового клиента, код подтверждения и лог', async () => {
      const { service, userRepository, emailService, logRepository } = createDeps();
      userRepository.findByEmail.mockResolvedValue(undefined);
      userRepository.createNewUser.mockResolvedValue({
        id: 10,
        email: 'user@example.com',
        full_name: 'Иван Иванов',
        role_id: ROLES.CLIENT
      });
      userRepository.saveVerificationCode.mockResolvedValue({ id: 1 });
      emailService.sendVerificationCode.mockResolvedValue(undefined);
      logRepository.create.mockResolvedValue(undefined);

      const result = await service.register('user@example.com', '123456', 'Иван Иванов', '+79999999999');

      expect(userRepository.createNewUser).toHaveBeenCalledWith(expect.objectContaining({
        email: 'user@example.com',
        phone: '+79999999999',
        full_name: 'Иван Иванов',
        role_id: ROLES.CLIENT,
        password_hash: expect.any(String)
      }));
      expect(userRepository.saveVerificationCode).toHaveBeenCalledWith(
        'user@example.com',
        expect.stringMatching(/^\d{6}$/),
        expect.any(Date)
      );
      expect(emailService.sendVerificationCode).toHaveBeenCalledWith('user@example.com', expect.stringMatching(/^\d{6}$/));
      expect(logRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 10,
        action: 'register'
      }));
      expect(result).toMatchObject({
        newUser: expect.objectContaining({ id: 10, email: 'user@example.com' }),
        token: null
      });
    });
  });

  describe('tokens', () => {
    test('generateToken и verifyToken работают с одним секретом', () => {
      const { service } = createDeps();

      const token = service.generateToken({ id: 5, email: 'admin@example.com', role_id: ROLES.ADMIN });
      const decoded = service.verifyToken(token);

      expect(decoded).toMatchObject({ id: 5, email: 'admin@example.com', role_id: ROLES.ADMIN });
    });

    test('generateToken выбрасывает ошибку без JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      const { service } = createDeps();

      expect(() => service.generateToken({ id: 1, email: 'user@example.com', role_id: ROLES.CLIENT }))
        .toThrow('JWT_SECRET is not defined');
    });
  });

  describe('changePassword', () => {
    test('меняет пароль при корректном текущем пароле', async () => {
      const passwordHash = await bcrypt.hash('old-password', 10);
      const { service, userRepository, logRepository } = createDeps();
      userRepository.findById.mockResolvedValue({ id: 1, password_hash: passwordHash });
      userRepository.updatePassword.mockResolvedValue({ id: 1 });
      logRepository.create.mockResolvedValue(undefined);

      const result = await service.changePassword(1, 'old-password', 'new-password');

      expect(userRepository.updatePassword).toHaveBeenCalledWith(1, expect.any(String));
      expect(logRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 1,
        action: 'change_password'
      }));
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
  });
});
