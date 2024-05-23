import {ClientProvider} from "../ClientProvider";

class WalletRequests {
  public async getSupportedWallets(): Promise<void> {
    const client = ClientProvider.create();

    const supportedWallets = await client.getSupportedWallets();
  }
}