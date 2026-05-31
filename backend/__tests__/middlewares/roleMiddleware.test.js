const RoleMiddleware = require('../../middlewares/roleMiddleware');
const ROLES = require('../../constants/roles');

function createResponseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('RoleMiddleware', () => {
  const middleware = new RoleMiddleware();

  test('пропускает пользователя с разрешенной ролью', () => {
    const req = { user: { id: 1, role_id: ROLES.ADMIN } };
    const res = createResponseMock();
    const next = jest.fn();

    middleware.checkRole([ROLES.ADMIN])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('возвращает 403 для запрещенной роли', () => {
    const req = { user: { id: 1, role_id: ROLES.CLIENT } };
    const res = createResponseMock();
    const next = jest.fn();

    middleware.checkRole([ROLES.ADMIN])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Доступ запрещен' });
  });

  test('возвращает 401 если пользователя нет в req', () => {
    const req = {};
    const res = createResponseMock();
    const next = jest.fn();

    middleware.checkRole([ROLES.ADMIN])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Требуется авторизация' });
  });
});
