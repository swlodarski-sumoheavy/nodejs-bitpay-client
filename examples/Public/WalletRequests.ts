import { ClientProvider } from '../ClientProvider';

export class WalletRequests {
  public async getSupportedWallets() {
    const client = ClientProvider.create();

    return await client.getSupportedWallets();
  }
}
