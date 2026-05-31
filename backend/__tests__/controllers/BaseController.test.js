const BaseController = require('../../controllers/BaseController');

function createResponseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('BaseController', () => {
  let controller;
  let res;

  beforeEach(() => {
    controller = new BaseController();
    res = createResponseMock();
  });

  test('success отправляет статус 200 по умолчанию', () => {
    controller.success(res, { ok: true });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test('success умеет отправлять кастомный статус', () => {
    controller.success(res, { id: 1 }, 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  test('validationError возвращает 400 и список ошибок', () => {
    controller.validationError(res, ['Email обязателен']);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: ['Email обязателен'] });
  });

  test('notFound возвращает 404', () => {
    controller.notFound(res, 'Пользователь не найден');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Пользователь не найден' });
  });

  test('internalError возвращает 500', () => {
    controller.internalError(res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
