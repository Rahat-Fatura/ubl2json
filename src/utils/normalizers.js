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
        description: line.Item[0]?.Description?.[0]?.val || null,
        keyword: line.Item[0]?.Keyword?.val || null,
        brand_name: line.Item[0]?.BrandName?.val || null,
        model_name: line.Item[0]?.ModelName?.val || null,
        buyers_item_id: line.Item[0]?.BuyersItemIdentification?.ID?.val || null,
        sellers_item_id: line.Item[0]?.SellersItemIdentification?.ID?.val || null,
        manufacturers_item_id: line.Item[0]?.ManufacturersItemIdentification?.ID?.val || null,
        origin_country: line.Item[0]?.OriginCountry?.val || null,
        gtip: line.Item[0]?.Delivery?.[0]?.Shipment?.[0]?.GoodsItem?.[0]?.RequiredCustomsID?.val,
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

  const getVal = (x) => {
    if (!x) return '';
    if (typeof x === 'object') return x.val || x['#text'] || '';
    return String(x);
  };

  const parsePartyDetails = (p) => {
    const matchedIdentity = _.find(
      p.PartyIdentification,
      (id) => id?.ID?.schemeID === 'TCKN' || id?.ID?.schemeID === 'VKN' || id?.ID?.schemeID === 'PARTYTYPE',
    );
    const ID = matchedIdentity?.ID || {};
    const scheme = ID?.schemeID;

    let street = p.PostalAddress?.StreetName?.val || '';
    let bName = p.PostalAddress?.BuildingName?.val || '';
    let bNumber = '';
    if (p.PostalAddress?.BuildingNumber) {
      if (Array.isArray(p.PostalAddress.BuildingNumber)) {
        bNumber = p.PostalAddress.BuildingNumber[0]?.val || '';
      } else {
        bNumber = p.PostalAddress.BuildingNumber.val || p.PostalAddress.BuildingNumber || '';
      }
    }
    let room = p.PostalAddress?.Room?.val || '';

    let baseAddress = [street, bName, bNumber, room]
      .map(x => String(x || '').replace(/undefined|null/gi, '').trim())
      .filter(Boolean)
      .join(' ');

    const city = String(p.PostalAddress?.CityName?.val || '').trim();
    const sub = String(p.PostalAddress?.CitySubdivisionName?.val || '').trim();
    const extra = [sub, city].filter(Boolean).join('/');

    let finalAddress = baseAddress;
    if (extra) {
      const baseLower = baseAddress.toLowerCase();
      const cityLower = city.toLowerCase();
      const subLower = sub.toLowerCase();

      const hasCity = city && baseLower.includes(cityLower);
      const hasSub = sub && baseLower.includes(subLower);

      const extraParts = [];
      if (sub && !hasSub) extraParts.push(sub);
      if (city && !hasCity) extraParts.push(city);

      if (extraParts.length > 0) {
        finalAddress = `${baseAddress} ${extraParts.join('/')}`.trim();
      }
    }

    const additionalIdentifiers = _.map(p.PartyIdentification, (id) => {
      const schemeId = getVal(id?.ID?.schemeID);
      if (schemeId !== 'TCKN' && schemeId !== 'VKN') {
        return {
          scheme: schemeId,
          value: getVal(id?.ID),
        };
      }
    }).filter((id) => id !== undefined) || [];

    return {
      name:
        scheme === 'TCKN'
          ? `${p.Person?.FirstName?.val}${p.Person?.MiddleName?.val ? ` ${p.Person?.MiddleName?.val}` : ''} ${p.Person?.FamilyName?.val}`
          : p.PartyName?.Name?.val,
      vkn_tckn: ['TCKN', 'VKN'].includes(scheme) ? ID?.val : p.PartyLegalEntity?.[0]?.CompanyID?.val,
      tax_office: p.PartyTaxScheme?.TaxScheme?.Name?.val,
      address: finalAddress || '',
      city: p.PostalAddress?.CityName?.val,
      city_subdivision: p.PostalAddress?.CitySubdivisionName?.val,
      country: p.PostalAddress?.Country?.Name?.val,
      postal_zone: p.PostalAddress?.PostalZone?.val,
      email: p.Contact?.ElectronicMail?.val,
      phone_number: p.Contact?.Telephone?.val,
      additional_identifiers: additionalIdentifiers,
    };
  };

  const normalized = parsePartyDetails(party);

  if (party.AgentParty) {
    const agentNormalized = parsePartyDetails(party.AgentParty);
    if (agentNormalized.address) normalized.address = agentNormalized.address;
    if (agentNormalized.city) normalized.city = agentNormalized.city;
    if (agentNormalized.city_subdivision) normalized.city_subdivision = agentNormalized.city_subdivision;
    if (agentNormalized.postal_zone) normalized.postal_zone = agentNormalized.postal_zone;

    agentNormalized.additional_identifiers.forEach((agentId) => {
      const existing = normalized.additional_identifiers.find(id => id.scheme === agentId.scheme);
      if (existing) {
        existing.value = agentId.value;
      } else {
        normalized.additional_identifiers.push(agentId);
      }
    });
  }

  return normalized;
};

module.exports = {
  setDefaults,
  taxSubtotalNormalizer,
  allowanceChargeNormalizer,
  linesNormalizer,
  partyNormalizer,
};
