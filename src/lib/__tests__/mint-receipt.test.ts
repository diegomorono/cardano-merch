jest.mock('@midnight-ntwrk/wallet-api', () => ({
  TRANSACTION_TO_PROVE: 'mock_transaction'
}), { virtual: true });
jest.mock('@midnight-ntwrk/compact-runtime', () => ({
  // QueryContext is a type, no need to mock runtime values unless used
}), { virtual: true });

import { mintZkReceipt } from '../midnight/mint-receipt';

describe('mintZkReceipt', () => {
  it('should securely generate a transaction hash and return success', async () => {
    const wallet = '0x1234567890abcdef';
    const value = 150;

    const result = await mintZkReceipt(wallet, value);

    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
    expect(result.txHash?.startsWith('tx_mid_')).toBe(true);
    // 7 chars for 'tx_mid_' + 16 chars for 8-byte hex string
    expect(result.txHash?.length).toBe(23);
  }, 10000); // Allow extra time for the 2s delay in the function
});
