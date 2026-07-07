import { jest } from '@jest/globals';

describe('Stellar utils', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isValidStellarAddress', () => {
    it('returns true for a valid 56-char G... address', async () => {
      const { isValidStellarAddress } = await import('../stellar.js');
      const validAddress = 'GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIBTLFL2F7HVRQG5LDHNWY2QTWA';
      expect(isValidStellarAddress(validAddress)).toBe(true);
    });

    it('returns false for wrong length / wrong prefix / lowercase / invalid base32', async () => {
      const { isValidStellarAddress } = await import('../stellar.js');

      expect(isValidStellarAddress('')).toBe(false);
      expect(isValidStellarAddress('G'.repeat(55))).toBe(false);
      expect(isValidStellarAddress('G'.repeat(57))).toBe(false);
      expect(isValidStellarAddress('A'.repeat(56))).toBe(false);
      expect(
        isValidStellarAddress('gbuqwp3bouzx34ulnqg23rq6f4bvwcibtlfl2f7hvrqg5ldhnwy2qtwa'),
      ).toBe(false);
      expect(isValidStellarAddress(`G${'A'.repeat(50)}0123`)).toBe(false);
    });

    it('returns false for non-string values', async () => {
      const { isValidStellarAddress } = await import('../stellar.js');
      expect(isValidStellarAddress(null)).toBe(false);
      expect(isValidStellarAddress(undefined)).toBe(false);
      expect(isValidStellarAddress(123)).toBe(false);
      expect(isValidStellarAddress({})).toBe(false);
    });
  });

  describe('assertValidStellarAddress', () => {
    it('throws on invalid', async () => {
      const { assertValidStellarAddress } = await import('../stellar.js');
      expect(() => assertValidStellarAddress('not-an-address')).toThrow('Invalid Stellar address');
    });

    it('passes through valid', async () => {
      const { assertValidStellarAddress } = await import('../stellar.js');
      const validAddress = 'GBHVTBKMJ5PXJW7VDBLCWVYXCXU6BFJFNX4S3HJQEWQYXU2CKFCW4FAA';
      expect(() => assertValidStellarAddress(validAddress)).not.toThrow();
    });
  });

  describe('getTxUrl / getAccountUrl', () => {
    it('builds explorer URLs and honors STELLAR_EXPLORER_URL', async () => {
      process.env.STELLAR_EXPLORER_URL = 'https://example.com/explorer';
      jest.resetModules();
      const { getTxUrl, getAccountUrl } = await import('../stellar.js');

      expect(getTxUrl('txhash')).toBe('https://example.com/explorer/tx/txhash');
      expect(getAccountUrl('GABC')).toBe('https://example.com/explorer/account/GABC');
    });
  });
});
