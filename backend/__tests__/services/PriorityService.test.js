const PriorityService = require('../../services/PriorityService');

describe('PriorityService', () => {
  const service = new PriorityService();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-30T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('возвращает green для заявки младше 1 часа', () => {
    expect(service.getColor('2026-05-30T11:30:00.000Z')).toBe('green');
  });

  test('возвращает yellow для заявки от 1 до 3 часов', () => {
    expect(service.getColor('2026-05-30T10:30:00.000Z')).toBe('yellow');
  });

  test('возвращает red для заявки старше 3 часов', () => {
    expect(service.getColor('2026-05-30T08:30:00.000Z')).toBe('red');
  });

  test('добавляет priorityColor к списку заявок', () => {
    const tickets = [
      { id: 1, created_at: '2026-05-30T11:30:00.000Z' },
      { id: 2, created_at: '2026-05-30T08:30:00.000Z' }
    ];

    expect(service.enrichTicketsWithColor(tickets)).toEqual([
      { id: 1, created_at: '2026-05-30T11:30:00.000Z', priorityColor: 'green' },
      { id: 2, created_at: '2026-05-30T08:30:00.000Z', priorityColor: 'red' }
    ]);
  });

  test('возвращает человекочитаемый текст приоритета', () => {
    expect(service.getPriorityText('green')).toBe('Низкий (ожидание < 1 ч)');
    expect(service.getPriorityText('yellow')).toBe('Средний (ожидание 1-3 ч)');
    expect(service.getPriorityText('red')).toBe('Высокий (ожидание > 3 ч)');
    expect(service.getPriorityText('unknown')).toBe('Неизвестно');
  });
});
