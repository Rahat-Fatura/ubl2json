const _ = require('lodash');

const setDefaults = (args) => {
  return {
    setBuyerCustomerToReceiverForExportInvoices: args?.setBuyerCustomerToReceiverForExportInvoices || false,
  };
};

const taxSubtotalNormalizer = (taxTotal) => {
  const taxSubtotal = _.map(taxTotal.TaxSubtotal, (taxSub) => {
    return {
      name: taxSub.TaxCategory?.TaxScheme?.Name?.val,
      code: taxSub.TaxCategory?.TaxScheme?.TaxTypeCode?.val,
      percent: taxSub.Percent?.val,
      taxable: taxSub.TaxableAmount?.val,
      taxable_currency: taxSub.TaxableAmount?.currencyID,
      tax_exemption_reason_code: taxSub.TaxCategory?.TaxExemptionReasonCode?.val,
      amount: taxSub.TaxAmount?.val,
      amount_currency: taxSub.TaxAmount?.currencyID,
    };
  });
  return taxSubtotal;
};

const allowanceChargeNormalizer = (allowanceCharge) => {
  const allowanceChargeArray = _.map(allowanceCharge, (charge) => {
    return {
      is_charge: charge.ChargeIndicator?.val,
      reason: charge.AllowanceChargeReason?.val,
      multiplier: charge.MultiplierFactorNumeric?.val || 0,
      amount: charge.Amount?.val || 0,
      amount_currency: charge.Amount?.currencyID,
      base_amount: charge.BaseAmount?.val || 0,
      base_amount_currency: charge.BaseAmount?.currencyID,
    };
  });
  return allowanceChargeArray;
};

const linesNormalizer = (linesArray) => {
  const lines = _.map(linesArray, (line) => {
    let withholding = {};
    if (line.WithholdingTaxTotal) {
      withholding = {
        withholding_tax_total: line.WithholdingTaxTotal[0]?.TaxAmount?.val,
        withholding_tax_subtotals: taxSubtotalNormalizer(line.WithholdingTaxTotal[0]),
      };
    }
    return {
      id: line.ID?.val,
      name: line.Item[0]?.Name?.val,
      note: line.Note?.val,
      quantity: line.InvoicedQuantity?.val || 0,
      quantity_unit: line.InvoicedQuantity?.unitCode,
      price: line.Price.PriceAmount?.val || 0,
      price_currency: line.Price?.PriceAmount?.currencyID,
      extension_amount: line.LineExtensionAmount?.val || 0,
      extension_amount_currency: line.LineExtensionAmount?.currencyID,
      allowances: allowanceChargeNormalizer(line.AllowanceCharge),
      tax_total: line.TaxTotal ? line.TaxTotal[0]?.TaxAmount?.val : 0,
      tax_subtotals: taxSubtotalNormalizer(line.TaxTotal ? line.TaxTotal[0] : { TaxSubtotal: [] }),
      ...withholding,
      additional: {
        description: line.Item[0]?.Description?.val || null,
        keyword: line.Item[0]?.Keyword?.val || null,
        brand_name: line.Item[0]?.BrandName?.val || null,
        model_name: line.Item[0]?.ModelName?.val || null,
        buyers_item_id: line.Item[0]?.BuyersItemIdentification?.ID?.val || null,
        sellers_item_id: line.Item[0]?.SellersItemIdentification?.ID?.val || null,
        manufacturers_item_id: line.Item[0]?.ManufacturersItemIdentification?.ID?.val || null,
        origin_country: line.Item[0]?.OriginCountry?.val || null,
        instance:
          _.map(line.Item[0]?.ItemInstance, (instance) => {
            return {
              trace_id: instance.ProductTraceID?.val || null,
              manufacture_date: instance.ManufactureDate?.val || null,
              manufacture_time: instance.ManufactureTime?.val || null,
              registration_id: instance.RegistrationID?.val || null,
              serial_id: instance.SerialID?.val || null,
              lot_id: instance.LotIdentification?.val || null,
            };
          }) || [],
      },
    };
  });
  return lines;
};

const partyNormalizer = (partyJson) => {
  const party = partyJson.Party;
  const { ID } = _.find(
    party.PartyIdentification,
    (id) => id?.ID?.schemeID === 'TCKN' || id?.ID?.schemeID === 'VKN' || id?.ID?.schemeID === 'PARTYTYPE',
  );
  const scheme = ID.schemeID;
  const normalizedParty = {
    name:
      scheme === 'TCKN'
        ? `${party.Person?.FirstName?.val}${party.Person?.MiddleName?.val ? ` ${party.Person?.MiddleName?.val}` : ''} ${party.Person?.FamilyName?.val}`
        : party.PartyName?.Name?.val,
    vkn_tckn: ['TCKN', 'VKN'].includes(scheme) ? ID?.val : party.PartyLegalEntity[0]?.CompanyID?.val,
    tax_office: party.PartyTaxScheme?.TaxScheme?.Name?.val,
    address: `${party.PostalAddress?.StreetName?.val} ${party.PostalAddress?.BuildingName?.val} ${party.PostalAddress?.BuildingNumber ? party.PostalAddress?.BuildingNumber[0]?.val : null} ${party.PostalAddress?.Room?.val}`,
    city: party.PostalAddress?.CityName?.val,
    city_subdivision: party.PostalAddress?.CitySubdivisionName?.val,
    country: party.PostalAddress?.Country.Name?.val,
    postal_zone: party.PostalAddress?.PostalZone?.val,
    email: party.Contact?.ElectronicMail?.val,
    phone_number: party.Contact?.Telephone?.val,
    additional_identifiers:
      _.map(party.PartyIdentification, (id) => {
        if (id?.ID?.schemeID !== 'TCKN' && id?.ID?.schemeID !== 'VKN') {
          return {
            scheme: id?.ID?.schemeID,
            value: id?.ID?.val,
          };
        }
      }).filter((id) => id !== undefined) || [],
  };
  return normalizedParty;
};

module.exports = {
  setDefaults,
  taxSubtotalNormalizer,
  allowanceChargeNormalizer,
  linesNormalizer,
  partyNormalizer,
};
