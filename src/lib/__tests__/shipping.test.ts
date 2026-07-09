import { getShippingZoneAndRates } from '../shipping';

describe('getShippingZoneAndRates', () => {
  it('should return "Rest Of World" for an unrecognized country code', () => {
    const result = getShippingZoneAndRates('XX');
    expect(result.zone).toBe('Rest Of World');
    expect(result.rates.standardAvailable).toBe(false);
    expect(result.rates.expressFirst).toBe(80.00);
    expect(result.rates.expressNext).toBe(60.00);
  });
});
