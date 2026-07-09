import { getShippingZoneAndRates } from "../shipping";

describe("shipping", () => {
  describe("getShippingZoneAndRates", () => {
    it("should return 'Rest Of World' zone and rates for unrecognized country code", () => {
      const result = getShippingZoneAndRates("XX");

      expect(result.zone).toBe("Rest Of World");
      expect(result.rates).toEqual({
        standardAvailable: false,
        standardFirst: 0,
        standardNext: 0,
        expressAvailable: true,
        expressFirst: 80.00,
        expressNext: 60.00,
      });
    });
  });
});
