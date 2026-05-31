const { isDisposableEmail } = require('../../utils/emailBlacklist');

describe('emailBlacklist', () => {
  test('определяет одноразовые email-домены', () => {
    expect(isDisposableEmail('test@tempmail.com')).toBe(true);
    expect(isDisposableEmail('test@10minutemail.com')).toBe(true);
  });

  test('не блокирует обычные домены', () => {
    expect(isDisposableEmail('user@gmail.com')).toBe(false);
    expect(isDisposableEmail('user@example.com')).toBe(false);
  });

  test('проверка домена регистронезависимая', () => {
    expect(isDisposableEmail('test@TEMPMAIL.COM')).toBe(true);
  });
});
