const { createTicketSchema, transferSchema, createCategorySchema } = require('../../schemas/ticketSchemas');

describe('ticketSchemas', () => {
  test('createTicketSchema принимает корректную заявку', () => {
    const { error, value } = createTicketSchema.validate({
      title: ' Проблема с оплатой ',
      description: 'Не проходит платеж по карте',
      category_id: 1
    });

    expect(error).toBeUndefined();
    expect(value.title).toBe('Проблема с оплатой');
  });

  test('createTicketSchema отклоняет слишком короткое описание', () => {
    const { error } = createTicketSchema.validate({ title: 'Bug', description: 'short' });

    expect(error).toBeDefined();
  });

  test('transferSchema разрешает expert_id числом или null', () => {
    expect(transferSchema.validate({ expert_id: 3 }).error).toBeUndefined();
    expect(transferSchema.validate({ expert_id: null }).error).toBeUndefined();
  });

  test('createCategorySchema требует название категории', () => {
    expect(createCategorySchema.validate({ name: 'Оплата', expert_id: 3 }).error).toBeUndefined();
    expect(createCategorySchema.validate({ expert_id: 3 }).error).toBeDefined();
  });
});
