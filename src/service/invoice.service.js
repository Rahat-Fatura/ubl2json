const { XMLParser } = require('fast-xml-parser');
const dateTime = require('date-and-time');
const _ = require('lodash');
const options = require('../config/parser.config');
const normalizers = require('../utils/normalizers');
const CustomError = require('../utils/customError');

const convertInvoice = async (invoice) => {
  const json = invoice.Invoice;
  const taxSubtotals = normalizers.taxSubtotalNormalizer(json.TaxTotal[0]);
  const withholdingTaxSubtotals = normalizers.taxSubtotalNormalizer(
    json.WithholdingTaxTotal ? json.WithholdingTaxTotal[0] : [],
  );
  const lines = normalizers.linesNormalizer(json.InvoiceLine);
  const normalizedJson = {
    uuid: json.UUID.val,
    envelope_uuid: null,
    number: json.ID.val,
    profile_id: json.ProfileID.val,
    type_code: json.InvoiceTypeCode.val,
    issue_datetime: dateTime.parse(
      `${json.IssueDate.val.substring(0, 10)}T${json.IssueTime ? json.IssueTime.val.substring(0, 8) : '00:00:00'}`,
      'YYYY-MM-DDTHH:mm:ss',
      true,
    ),
    envelope_datetime: null,
    notes: json.Note ? _.map(json.Note, (note) => note.val) : [],
    despatches: _.isArray(json.DespatchDocumentReference)
      ? _.map(json.DespatchDocumentReference, (despatch) => {
          return {
            id: despatch.ID?.val,
            date: despatch.IssueDate?.val,
          };
        })
      : [],
    order: json.OrderReference?.ID
      ? {
          id: json.OrderReference?.ID?.val,
          date: json.OrderReference?.IssueDate?.val,
        }
      : null,
    payment_means: _.isArray(json.PaymentMeans)
      ? _.map(json.PaymentMeans, (payment) => {
          return {
            id: payment.PaymentID?.val,
            payment_means_code: payment.PaymentMeansCode?.val,
            payment_due_date: payment.PaymentDueDate?.val,
            payment_channel: payment.PaymentChannelCode?.val,
            payee_institution: payment.PayeeFinancialInstitutionBranch,
            payee_account_id: payment.PayeeFinancialAccount?.ID?.val,
            payee_account_note: payment.PayeeFinancialAccount?.PaymentNote?.val,
            payer_institution: payment.PayerFinancialInstitutionBranch,
            payer_account_id: payment.PayerFinancialAccount?.ID?.val,
            payer_account_note: payment.PayerFinancialAccount?.PaymentNote?.val,
          };
        })
      : [],
    additional_document_reference: _.isArray(json.AdditionalDocumentReference)
      ? _.map(json.AdditionalDocumentReference, (doc) => {
          return {
            id: doc.ID?.val,
            date: doc.IssueDate?.val,
            document_type_code: doc.DocumentTypeCode?.val,
            document_type: doc.DocumentType?.val,
            document_description: doc.DocumentDescription?.val,
            attachment: doc.Attachment,
          };
        })
      : [],
    currency_code: json.DocumentCurrencyCode.val,
    exchange_rate: json.PricingExchangeRate ? json.PricingExchangeRate.CalculationRate.val : 1,
    sender_object: normalizers.partyNormalizer(json.AccountingSupplierParty),
    sender_name: normalizers.partyNormalizer(json.AccountingSupplierParty).name,
    sender_tax: normalizers.partyNormalizer(json.AccountingSupplierParty).vkn_tckn,
    receiver_object: normalizers.partyNormalizer(json.AccountingCustomerParty),
    receiver_name: normalizers.partyNormalizer(json.AccountingCustomerParty).name,
    receiver_tax: normalizers.partyNormalizer(json.AccountingCustomerParty).vkn_tckn,
    buyer_customer_object: normalizers.partyNormalizer(json.BuyerCustomerParty),
    buyer_customer_name: normalizers.partyNormalizer(json.BuyerCustomerParty).name,
    buyer_customer_tax: normalizers.partyNormalizer(json.BuyerCustomerParty).vkn_tckn,
    line_extension: json.LegalMonetaryTotal.LineExtensionAmount.val || 0,
    tax_exclusive: json.LegalMonetaryTotal.TaxExclusiveAmount.val || 0,
    tax_inclusive: json.LegalMonetaryTotal.TaxInclusiveAmount.val || 0,
    tax_total: json.TaxTotal[0].TaxAmount.val || 0,
    tax_subtotals: taxSubtotals,
    withholding_tax_total: json.WithholdingTaxTotal ? json.WithholdingTaxTotal[0].TaxAmount.val || 0 : 0,
    withholding_tax_subtotals: withholdingTaxSubtotals,
    allowance_total: json.LegalMonetaryTotal.AllowanceTotalAmount?.val || 0,
    charge_total: json.LegalMonetaryTotal.ChargeTotalAmount?.val || 0,
    payable_amount: json.LegalMonetaryTotal.PayableAmount?.val || 0,
    lines,
  };
  return normalizedJson;
};

const convertToJson = async (xml) => {
  const parser = new XMLParser(options);
  const jsonObj = parser.parse(xml);
  return jsonObj;
};

const rawJson = async (xml) => {
  try {
    const jsonObj = await convertToJson(xml);
    return jsonObj;
  } catch (error) {
    throw new CustomError({
      message: 'Raw JSON oluşturuluken hata oluştu.',
      stack: error,
    });
  }
};

const convertedJson = async (xml) => {
  try {
    const jsonObj = await convertToJson(xml);
    const invoice = await convertInvoice(jsonObj);
    return invoice;
  } catch (error) {
    throw new CustomError({
      message: 'Converted JSON oluşturuluken hata oluştu.',
      stack: error,
    });
  }
};

module.exports = {
  rawJson,
  convertedJson,
};
