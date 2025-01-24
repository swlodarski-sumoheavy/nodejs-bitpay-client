/* eslint-disable @typescript-eslint/no-unused-vars*/

import { ec } from 'elliptic';
import {
  BillClient,
  BitPayClient,
  CurrencyClient,
  InvoiceClient,
  LedgerClient,
  PayoutClient,
  PayoutGroupClient,
  PayoutRecipientClient,
  RateClient,
  RefundClient,
  SettlementClient,
  WalletClient
} from './Client/index';
import { Env, Facade, KeyUtils } from './index';
import {
  BillInterface,
  InvoiceInterface,
  LedgerEntryInterface,
  LedgerInterface,
  PayoutGroupInterface,
  PayoutInterface,
  PayoutRecipientInterface,
  PayoutRecipients,
  RateInterface,
  Rates
} from './Model';

import * as fs from 'fs';
import { Environment } from './Environment';
import { BitPayExceptionProvider } from './Exceptions/BitPayExceptionProvider';
import { CurrencyInterface } from './Model/Currency/Currency';
import { InvoiceEventTokenInterface } from './Model/Invoice/InvoiceEventToken';
import { RefundInterface } from './Model/Invoice/Refund';
import { SettlementInterface } from './Model/Settlement/Settlement';
import { WalletInterface } from './Model/Wallet/Wallet';
import { PosToken } from './PosToken';
import { PrivateKey } from './PrivateKey';
import { TokenContainer } from './TokenContainer';
import { GuidGenerator } from './util/GuidGenerator';
import { ParamsRemover } from './util/ParamsRemover';

export class Client {
  private bitPayClient: BitPayClient;
  private keyUtils = new KeyUtils();
  private guidGenerator: GuidGenerator;
  private tokenContainer: TokenContainer;

  constructor(
    configFilePath: string | null,
    privateKey: PrivateKey | null,
    tokenContainer: TokenContainer | null,
    posToken: PosToken | null,
    environment?: Environment,
    platformInfo?: string,
    bitPayClient?: BitPayClient, // using for tests
    guidGenerator?: GuidGenerator // using for tests
  ) {
    if (configFilePath !== null) {
      this.initByConfigFilePath(configFilePath);
      return;
    }

    if (tokenContainer === null) {
      tokenContainer = new TokenContainer();
    }

    if (bitPayClient !== undefined && bitPayClient !== null) {
      // using for tests
      if (guidGenerator == undefined) {
        guidGenerator = new GuidGenerator();
      }
      this.initForTests(bitPayClient, guidGenerator, tokenContainer);
      return;
    }

    if (environment === undefined) {
      environment = Environment.Prod;
    }

    if (privateKey !== null) {
      const ecKey = this.getEcKeyByPrivateKey(privateKey);
      this.guidGenerator = new GuidGenerator();
      this.tokenContainer = tokenContainer;
      this.bitPayClient = new BitPayClient(
        Client.getBaseUrl(environment),
        ecKey,
        this.getIdentity(ecKey),
        platformInfo
      );
      return;
    }

    this.tokenContainer = tokenContainer;
    this.guidGenerator = new GuidGenerator();
    this.bitPayClient = new BitPayClient(Client.getBaseUrl(environment), null, null, platformInfo);

    if (posToken !== null) {
      this.tokenContainer.addPos(posToken.getValue());
      return;
    }
  }

  /**
   * Client factory for POS
   * @param posToken
   * @param environment
   */
  public static createPosClient(posToken: string, environment?: Environment, platformInfo?: string): Client {
    return new Client(null, null, null, new PosToken(posToken), environment, platformInfo);
  }

  /**
   * Client factory based on config file
   *
   * @param configFilePath
   */
  public static createClientByConfig(configFilePath: string, platformInfo?: string): Client {
    return new Client(configFilePath, null, null, null, undefined, platformInfo);
  }

  /**
   * Client factory based on private key and tokens
   * @param privateKey
   * @param tokenContainer
   * @param environment
   */
  public static createClientByPrivateKey(
    privateKey: string,
    tokenContainer: TokenContainer,
    environment?: Environment,
    platformInfo?: string
  ) {
    return new Client(null, new PrivateKey(privateKey), tokenContainer, null, environment, platformInfo);
  }

  public getToken(facade: Facade) {
    return this.tokenContainer.getToken(facade);
  }

  /**
   * Retrieve the rates for a cryptocurrency / fiat pair. See https://bitpay.com/bitcoin-exchange-rates.
   *
   * @param baseCurrency the cryptocurrency for which you want to fetch the rates.
   *                     Current supported values are BTC and BCH.
   * @param currency the fiat currency for which you want to fetch the baseCurrency rates
   * @return A Rate object populated with the BitPay exchange rate table.
   */
  public async getRate(baseCurrency: string, currency: string): Promise<RateInterface> {
    return this.createRateClient().getRate(baseCurrency, currency);
  }

  /**
   * Retrieve the exchange rate table maintained by BitPay.  See https://bitpay.com/bitcoin-exchange-rates.
   * @param currency the cryptocurrency for which you want to fetch the rates.
   *                     Current supported values are BTC and BCH.
   * @return A Rates object populated with the BitPay exchange rate table.
   */
  public async getRates(currency: string | null): Promise<Rates> {
    return this.createRateClient().getRates(currency);
  }

  /**
   * Create a BitPay invoice using the Merchant facade.
   *
   * @param invoice An Invoice object with request parameters defined.
   * @param facade Facade for request.
   * @param signRequest Signed request.
   */
  public async createInvoice(
    invoice: InvoiceInterface,
    facade?: Facade,
    signRequest?: boolean
  ): Promise<InvoiceInterface> {
    if (facade === undefined) {
      facade = this.getFacadeBasedOnTokenContainer();
    }

    if (signRequest === undefined) {
      signRequest = Client.isSignRequest(facade);
    }

    invoice.token = invoice.token ? invoice.token : this.guidGenerator.execute();

    return this.createInvoiceClient().create(invoice, facade, signRequest);
  }

  /**
   * Retrieve a BitPay invoice by invoice id using the public facade.
   *
   * @param invoiceId The id of the invoice to retrieve.
   * @param facade Facade for request.
   * @param signRequest Signed request.
   */
  public async getInvoice(invoiceId: string, facade?: Facade, signRequest?: boolean): Promise<InvoiceInterface> {
    if (facade === undefined) {
      facade = this.getFacadeBasedOnTokenContainer();
    }

    if (signRequest === undefined) {
      signRequest = Client.isSignRequest(facade);
    }

    return this.createInvoiceClient().get(invoiceId, facade, signRequest);
  }

  /**
   * Retrieve a BitPay invoice by guid using the specified facade.
   * The client must have been previously authorized for the specified facade.
   *
   * @param guid The guid of the invoice to retrieve.
   * @param facade Facade for request.
   * @param signRequest Signed request.
   */
  public async getInvoiceByGuid(guid: string, facade?: Facade, signRequest?: boolean): Promise<InvoiceInterface> {
    if (facade === undefined) {
      facade = this.getFacadeBasedOnTokenContainer();
    }

    if (signRequest === undefined) {
      signRequest = Client.isSignRequest(facade);
    }

    return this.createInvoiceClient().getByGuid(guid, facade, signRequest);
  }

  /**
   * Retrieve a collection of BitPay invoices.
   *
   * @param params Available params:
   * dateStart The first date for the query filter.
   * dateEnd   The last date for the query filter.
   * status    The invoice status you want to query on.
   * orderId   The optional order id specified at time of invoice creation.
   * limit     Maximum results that the query will return (useful for paging results).
   * offset    Number of results to offset (ex. skip 10 will give you results starting with the 11th.
   */
  public async getInvoices(params: {
    dateStart: string | null;
    dateEnd: string | null;
    status: string | null;
    orderId: string | null;
    limit: number | null;
    offset: number | null;
  }): Promise<InvoiceInterface[]> {
    return this.createInvoiceClient().getInvoices(params);
  }

  /**
   * Retrieves a bus token which can be used to subscribe to invoice events.
   *
   * @param invoiceId the id of the invoice for which you want to fetch an event token.
   */
  public async getInvoiceEventToken(invoiceId: string): Promise<InvoiceEventTokenInterface> {
    return this.createInvoiceClient().getInvoiceEventToken(invoiceId);
  }

  /**
   * Pay a BitPay invoice with a mock transaction. Available only on test env.
   *
   * @param invoiceId The id of the invoice to updated.
   * @param status    The status of the invoice to be updated, can be "confirmed" or "complete".
   * @return A BitPay generated Invoice object.
   */
  public async payInvoice(invoiceId: string, status: string): Promise<InvoiceInterface> {
    return this.createInvoiceClient().pay(invoiceId, status);
  }

  /**
   * Update a BitPay invoice with communication method.
   * @param invoiceId  The id of the invoice to updated.
   * @param params Available parameters:
   * buyerSms   The buyer's cell number.
   * smsCode    The buyer's received verification code.
   * buyerEmail The buyer's email address.
   * autoVerify Skip the user verification on sandbox ONLY.
   * @return A BitPay generated Invoice object.
   */
  public async updateInvoice(invoiceId: string, params: object): Promise<InvoiceInterface> {
    return this.createInvoiceClient().update(invoiceId, params);
  }

  /**
   * Delete a previously created BitPay invoice.
   *
   * @param invoiceId The Id of the BitPay invoice to be canceled.
   * @param forceCancel Force cancel.
   * @return A BitPay generated Invoice object.
   */
  public async cancelInvoice(invoiceId: string, forceCancel = true): Promise<InvoiceInterface> {
    return this.createInvoiceClient().cancel(invoiceId, forceCancel);
  }

  /**
   * Cancellation will require EITHER an SMS or E-mail to have already been set if the invoice has proceeded to
   * the point where it may have been paid, unless using forceCancel parameter.
   * @param guid GUID A passthru variable provided by the merchant and designed to be used by the merchant to
   *             correlate the invoice with an order ID in their system, which can be used as a lookup variable
   *             in Retrieve Invoice by GUID.
   * @param forceCancel If 'true' it will cancel the invoice even if no contact information is present.
   * @return Invoice Invoice
   */
  public async cancelInvoiceByGuid(guid: string, forceCancel = true): Promise<InvoiceInterface> {
    return this.createInvoiceClient().cancelByGuid(guid, forceCancel);
  }

  /**
   * The intent of this call is to address issues when BitPay sends a webhook but the client doesn't receive it,
   * so the client can request that BitPay resend it.
   * @param invoiceId The id of the invoice for which you want the last webhook to be resent.
   * @param invoiceToken The resource token for the invoiceId.
   *                     This token can be retrieved from the Bitpay's invoice object.
   * @return Boolean status of request
   */
  public async requestInvoiceWebhookToBeResent(invoiceId: string, invoiceToken: string): Promise<boolean> {
    return this.createInvoiceClient().requestInvoiceWebhookToBeResent(invoiceId, invoiceToken);
  }

  /**
   * Create a refund for a BitPay invoice.
   * @param refund. Parameters from Refund object used in request:
   * invoiceId          The BitPay invoice Id having the associated refund to be created.
   * amount             Amount to be refunded in the currency indicated.
   * preview            Whether to create the refund request as a preview (which will not be acted on until status is updated)
   * immediate          Whether funds should be removed from merchant ledger immediately on submission or at time of processing
   * buyerPaysRefundFee Whether the buyer should pay the refund fee (default is merchant)
   * reference          Present only if specified. Used as reference label for the refund. Max str length = 100
   * guid               Variable provided by the merchant and designed to be used by the merchant to correlate the refund with a refund ID in their system
   * @return An updated Refund Object
   */
  public async createRefund(refund: RefundInterface): Promise<RefundInterface> {
    return this.createRefundClient().create(refund);
  }

  /**
   * Retrieve a previously made refund request on a BitPay invoice.
   *
   * @param refundId The BitPay refund ID.
   * @return A BitPay Refund object with the associated Refund object.
   */
  public async getRefund(refundId: string): Promise<RefundInterface> {
    return this.createRefundClient().get(refundId);
  }

  /**
   * Retrieve a previously made refund request on a BitPay invoice.
   *
   * @param guid The BitPay refund GUID.
   * @return A BitPay Refund object with the associated Refund object.
   */
  public async getRefundByGuid(guid: string): Promise<RefundInterface> {
    return this.createRefundClient().getByGuid(guid);
  }

  /**
   * Retrieve all refund requests on a BitPay invoice.
   *
   * @param invoiceId The BitPay invoice object having the associated refunds.
   * @return A list of BitPay Refund objects with the associated Refund objects.
   */
  public async getRefunds(invoiceId: string): Promise<RefundInterface[]> {
    return this.createRefundClient().getRefunds(invoiceId);
  }

  /**
   * Update the status of a BitPay invoice.
   *
   * @param refundId A BitPay refund ID.
   * @param status   The new status for the refund to be updated.
   * @return A BitPay generated Refund object.
   */
  public async updateRefund(refundId: string, status: string): Promise<RefundInterface> {
    return this.createRefundClient().update(refundId, status);
  }

  /**
   * Update the status of a BitPay invoice.
   *
   * @param guid A BitPay refund Guid.
   * @param status   The new status for the refund to be updated.
   * @return A BitPay generated Refund object.
   */
  public async updateRefundByGuid(guid: string, status: string): Promise<RefundInterface> {
    return this.createRefundClient().updateByGuid(guid, status);
  }

  /**
   * Send a refund notification.
   *
   * @param refundId A BitPay refund ID.
   * @param refundToken The resource token for the refundId.
   *                    This token can be retrieved from the Bitpay's refund object.
   * @return An updated Refund Object
   */
  public async sendRefundNotification(refundId: string, refundToken: string): Promise<boolean> {
    return this.createRefundClient().sendRefundNotification(refundId, refundToken);
  }

  /**
   * Cancel a previously submitted refund request on a BitPay invoice.
   *
   * @param refundId The refund Id for the refund to be canceled.
   * @return An updated Refund Object.
   */
  public async cancelRefund(refundId: string): Promise<RefundInterface> {
    return this.createRefundClient().cancel(refundId);
  }

  /**
   * Cancel a previously submitted refund request on a BitPay invoice.
   *
   * @param guid The refund Guid for the refund to be canceled.
   * @return An updated Refund Object.
   */
  public async cancelRefundByGuid(guid: string): Promise<RefundInterface> {
    return this.createRefundClient().cancelByGuid(guid);
  }

  /**
   * Submit BitPay Payout Recipients.
   *
   * @param recipients PayoutRecipients A PayoutRecipients object with request parameters defined.
   * @return array A list of BitPay PayoutRecipients objects.
   */
  public async submitPayoutRecipients(recipients: PayoutRecipients): Promise<PayoutRecipientInterface[]> {
    return this.createPayoutRecipientClient().submit(recipients);
  }

  /**
   * Retrieve a collection of BitPay Payout Recipients.
   * @param params Available parameters:
   * status String|null The recipient status you want to query on.
   * limit  int Maximum results that the query will return (useful for
   *               paging results). result).
   * offset int Offset for paging.
   * @return array A list of BitPayRecipient objects.
   */
  public async getPayoutRecipients(params = {}): Promise<PayoutRecipientInterface[]> {
    return this.createPayoutRecipientClient().getByFilters(params);
  }

  /**
   * Retrieve a BitPay payout recipient by batch id using.  The client must have been previously authorized for the
   * payout facade.
   *
   * @param recipientId String The id of the recipient to retrieve.
   * @return PayoutRecipient A BitPay PayoutRecipient object.
   */
  public async getPayoutRecipient(recipientId: string): Promise<PayoutRecipientInterface> {
    return this.createPayoutRecipientClient().get(recipientId);
  }

  /**
   * Update a Payout Recipient.
   *
   * @param recipientId String The recipient id for the recipient to be updated.
   * @param recipient   PayoutRecipients A PayoutRecipient object with updated
   *                    parameters defined.
   * @return PayoutRecipientInterface The updated recipient object.
   */
  public async updatePayoutRecipient(
    recipientId: string,
    recipient: PayoutRecipientInterface
  ): Promise<PayoutRecipientInterface> {
    return this.createPayoutRecipientClient().update(recipientId, recipient);
  }

  /**
   * Cancel a BitPay Payout recipient.
   *
   * @param recipientId String The id of the recipient to cancel.
   * @return Boolean True if the delete operation was successful, false otherwise.
   */
  public async deletePayoutRecipient(recipientId: string): Promise<boolean> {
    return this.createPayoutRecipientClient().delete(recipientId);
  }

  /**
   * Request a payout recipient notification
   *
   * @param recipientId String A BitPay recipient ID.
   * @return Boolean True if the notification was successfully sent, false otherwise.
   */
  public async requestPayoutRecipientNotification(recipientId: string): Promise<boolean> {
    return this.createPayoutRecipientClient().requestNotification(recipientId);
  }

  /**
   * Submit a BitPay Payout.
   *
   * @param payout Payout A Payout object with request parameters defined.
   * @return PayoutInterface A BitPay generated Payout object.
   */
  public async submitPayout(payout: PayoutInterface): Promise<PayoutInterface> {
    return this.createPayoutClient().submit(payout);
  }

  /**
   * Retrieve a BitPay payout by payout id using. The client must have been
   * previously authorized for the payout facade.
   *
   * @param payoutId String The id of the payout to retrieve.
   * @return PayoutInterface BitPay Payout object.
   */
  public async getPayout(payoutId: string): Promise<PayoutInterface> {
    return this.createPayoutClient().get(payoutId);
  }

  /**
   * Retrieve a collection of BitPay payouts.
   *
   * @param params Available parameters:
   * startDate String The start date for the query.
   * endDate   String The end date for the query.
   * status    String The status to filter(optional).
   * reference String The optional reference specified at payout request creation.
   * limit     int Maximum results that the query will return (useful for
   *                  paging results).
   * offset    int Offset for paging.
   * @return A list of BitPay Payout objects.
   * @param params
   */
  public async getPayouts(params = {}): Promise<PayoutInterface[]> {
    return this.createPayoutClient().getPayouts(params);
  }

  /**
   * @see <a href="https://developer.bitpay.com/reference/create-payout-group">Create Payout Group</>
   *
   * @param payouts
   */
  public async submitPayouts(payouts: PayoutInterface[]): Promise<PayoutGroupInterface> {
    return this.createPayoutGroupClient().submitPayouts(payouts);
  }

  /**
   * @see <a href="https://developer.bitpay.com/reference/cancel-a-payout-group">Cancel a Payout Group</>
   *
   * @param payoutGroupId
   */
  public async cancelPayouts(payoutGroupId: string): Promise<PayoutGroupInterface> {
    return this.createPayoutGroupClient().cancelPayouts(payoutGroupId);
  }

  /**
   * Request a payout notification
   *
   * @param payoutId String The id of the payout to notify..
   * @return Boolean True if the notification was successfully sent, false otherwise.
   */
  public async requestPayoutNotification(payoutId: string): Promise<boolean> {
    return this.createPayoutClient().requestNotification(payoutId);
  }

  /**
   * Cancel a BitPay Payout.
   *
   * @param payoutId String The id of the payout to cancel.
   * @return Boolean True if the refund was successfully canceled, false otherwise.
   */
  public async cancelPayout(payoutId: string): Promise<boolean> {
    return this.createPayoutClient().cancel(payoutId);
  }

  /**
   * Retrieve a list of ledgers using the merchant facade.
   *
   * @return array A list of Ledger objects populated with the currency and current balance of each one.
   */
  public async getLedgers(): Promise<LedgerInterface[]> {
    return this.createLedgerClient().getLedgers();
  }

  /**
   * Retrieve a list of ledgers entries by currency and date range using the merchant facade.
   *
   * @param currency  The three digit currency string for the ledger to retrieve.
   * @param dateStart The first date for the query filter.
   * @param dateEnd   The last date for the query filter.
   * @return array Ledger entries list.
   */
  public async getLedgerEntries(
    currency: string,
    dateStart: Date | null,
    dateEnd: Date | null
  ): Promise<LedgerEntryInterface[]> {
    const params = ParamsRemover.removeNullValuesFromObject({
      startDate: Client.getDateAsString(dateStart),
      endDate: Client.getDateAsString(dateEnd)
    });

    return this.createLedgerClient().getEntries(currency, params);
  }

  /**
   * Create a BitPay Bill.
   *
   * @param bill        A Bill object with request parameters defined.
   * @param facade      The facade used to create it.
   * @param signRequest Signed request.
   * @return BillInterface A BitPay generated Bill object.
   */
  public async createBill(bill: BillInterface, facade?: Facade, signRequest?: boolean): Promise<BillInterface> {
    if (facade === undefined) {
      facade = this.getFacadeBasedOnTokenContainer();
    }

    if (signRequest === undefined) {
      signRequest = Client.isSignRequest(facade);
    }

    return this.createBillClient().create(bill, facade, signRequest);
  }

  /**
   * Retrieve a BitPay bill by bill id using the specified facade.
   *
   * @param billId      The id of the bill to retrieve.
   * @param facade      The facade used to retrieve it.
   * @param signRequest Signed request.
   * @return BillInterface A BitPay Bill object.
   */
  public async getBill(billId: string, facade?: Facade, signRequest?: boolean): Promise<BillInterface> {
    if (facade === undefined) {
      facade = this.getFacadeBasedOnTokenContainer();
    }

    if (signRequest === undefined) {
      signRequest = Client.isSignRequest(facade);
    }

    return this.createBillClient().get(billId, facade, signRequest);
  }

  /**
   * Retrieve a collection of BitPay bills.
   *
   * @param status The status to filter the bills.
   * @return BillInterface A list of BitPay Bill objects.
   */
  public async getBills(status: string | null): Promise<BillInterface[]> {
    return this.createBillClient().getBills(status);
  }

  /**
   * Update a BitPay Bill.
   *
   * @param bill   A Bill object with the parameters to update defined.
   * @param billId The Id of the Bill to udpate.
   * @return BillInterface An updated Bill object.
   */
  public async updateBill(bill: BillInterface, billId: string): Promise<BillInterface> {
    return this.createBillClient().update(bill, billId);
  }

  /**
   * Deliver a BitPay Bill.
   *
   * @param billId    The id of the requested bill.
   * @param billToken The token of the requested bill.
   * @return Boolean A response status returned from the API.
   */
  public async deliverBill(billId: string, billToken: string): Promise<boolean> {
    const facade = this.getFacadeBasedOnTokenContainer();
    const signRequest = Client.isSignRequest(facade);

    return this.createBillClient().deliver(billId, billToken, signRequest);
  }

  /**
   * Retrieve all supported wallets.
   *
   * @return array A list of wallet objets.
   */
  public async getSupportedWallets(): Promise<WalletInterface[]> {
    return this.createWalletClient().getSupportedWallets();
  }

  /**
   * Retrieves a summary of the specified settlement.
   *
   * @param settlementId Settlement Id.
   * @return SettlementInterface A BitPay Settlement object.
   */
  public async getSettlement(settlementId: string): Promise<SettlementInterface> {
    return this.createSettlementClient().get(settlementId);
  }

  /**
   * Retrieves settlement reports for the calling merchant filtered by query.
   * The `limit` and `offset` parameters
   * specify pages for large query sets.
   * @params params Available params:
   * currency  The three digit currency string for the ledger to retrieve.
   * dateStart The start date for the query.
   * dateEnd   The end date for the query.
   * status    Can be `processing`, `completed`, or `failed`.
   * limit     Maximum number of settlements to retrieve.
   * offset    Offset for paging.
   * @return array A list of BitPay Settlement objects.
   */
  public async getSettlements(params = {}): Promise<SettlementInterface[]> {
    return this.createSettlementClient().getSettlements(params);
  }

  /**
   * Gets a detailed reconciliation report of the activity within the settlement period.
   * Required id and settlement token.
   *
   * @param settlementId Settlement ID.
   * @param token Settlement token.
   * @return SettlementInterface A detailed BitPay Settlement object.
   */
  public async getSettlementReconciliationReport(settlementId: string, token: string): Promise<SettlementInterface> {
    return this.createSettlementClient().getReconciliationReport(settlementId, token);
  }

  /**
   * Gets info for specific currency.
   *
   * @param currencyCode String Currency code for which the info will be retrieved.
   * @return CurrencyInterface|null Currency info.
   */
  public async getCurrencyInfo(currencyCode: string): Promise<CurrencyInterface | null> {
    return this.getCurrencyClient().getCurrencyInfo(currencyCode);
  }

  private getEcKeyByPrivateKey(privateKey: PrivateKey) {
    const value = privateKey.getValue();
    if (fs.existsSync(value)) {
      return this.keyUtils.load_keypair(fs.readFileSync(value).toString());
    }

    return this.keyUtils.load_keypair(Buffer.from(value).toString().trim());
  }

  private getEcKeyByConfig(envConfig: object) {
    const privateKeyPath = envConfig['PrivateKeyPath'].toString().replace('"', '');
    const keyHex = envConfig['PrivateKey'].toString().replace('"', '');

    if (fs.existsSync(privateKeyPath)) {
      return this.keyUtils.load_keypair(fs.readFileSync(privateKeyPath).toString());
    }

    if (keyHex) {
      return this.keyUtils.load_keypair(Buffer.from(keyHex).toString().trim());
    }

    BitPayExceptionProvider.throwGenericExceptionWithMessage('Missing ECKey');
    throw new Error();
  }

  private static getBaseUrl(environment: string) {
    return environment.toUpperCase() == Env.Test ? Env.TestUrl : Env.ProdUrl;
  }

  private getIdentity(ecKey: ec.KeyPair) {
    return this.keyUtils.getPublicKeyFromPrivateKey(ecKey);
  }

  private createRateClient(): RateClient {
    return new RateClient(this.bitPayClient);
  }

  private getCurrencyClient(): CurrencyClient {
    return new CurrencyClient(this.bitPayClient);
  }

  private createInvoiceClient(): InvoiceClient {
    return new InvoiceClient(this.bitPayClient, this.tokenContainer, this.guidGenerator);
  }

  private createRefundClient(): RefundClient {
    return new RefundClient(this.bitPayClient, this.tokenContainer, this.guidGenerator);
  }

  private createPayoutRecipientClient(): PayoutRecipientClient {
    return new PayoutRecipientClient(this.bitPayClient, this.tokenContainer, this.guidGenerator);
  }

  private createPayoutClient(): PayoutClient {
    return new PayoutClient(this.bitPayClient, this.tokenContainer, this.guidGenerator);
  }

  private createPayoutGroupClient(): PayoutGroupClient {
    return new PayoutGroupClient(this.bitPayClient, this.tokenContainer, this.guidGenerator);
  }

  private createLedgerClient(): LedgerClient {
    return new LedgerClient(this.bitPayClient, this.tokenContainer);
  }

  private createBillClient(): BillClient {
    return new BillClient(this.bitPayClient, this.tokenContainer);
  }

  private createWalletClient(): WalletClient {
    return new WalletClient(this.bitPayClient);
  }

  private createSettlementClient(): SettlementClient {
    return new SettlementClient(this.bitPayClient, this.tokenContainer);
  }

  private getFacadeBasedOnTokenContainer(): Facade {
    if (this.tokenContainer.isTokenExist(Facade.Merchant)) {
      return Facade.Merchant;
    }

    return Facade.Pos;
  }

  private static isSignRequest(facade: Facade.Merchant | Facade.Payout | Facade.Pos): boolean {
    return facade !== Facade.Pos;
  }

  private static getDateAsString(date: Date | null): string | null {
    if (date === null) {
      return null;
    }
    return date.toISOString().split('T')[0];
  }

  private initByConfigFilePath(configFilePath: string, platformInfo?: string): void {
    if (!fs.existsSync(configFilePath)) {
      BitPayExceptionProvider.throwGenericExceptionWithMessage('Configuration file not found');
    }

    try {
      const configObj = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'))['BitPayConfiguration'];
      const environment = configObj['Environment'];
      const envConfig = configObj['EnvConfig'][environment];
      const tokens = envConfig['ApiTokens'];
      this.tokenContainer = new TokenContainer(tokens);
      const ecKey = this.getEcKeyByConfig(envConfig);
      this.bitPayClient = new BitPayClient(
        Client.getBaseUrl(environment),
        ecKey,
        this.getIdentity(ecKey),
        platformInfo
      );
      this.guidGenerator = new GuidGenerator();
    } catch (e: any) {
      BitPayExceptionProvider.throwGenericExceptionWithMessage('Error when reading configuration file');
    }
  }

  private initForTests(bitPayClient: BitPayClient, guidGenerator: GuidGenerator, tokenContainer: TokenContainer) {
    this.bitPayClient = bitPayClient;
    this.guidGenerator = guidGenerator;
    this.tokenContainer = tokenContainer;
  }
}
