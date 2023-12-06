const xml2js = require("xml2js");
const date_time = require("date-and-time");

let parser = new xml2js.Parser();

const clearData = (data) => {
    if (typeof data == "object") {
        return data._;
    } else {
        return data;
    }
};

const xmlToJson = async (xml) => {
    return new Promise((resolve, reject) => {
        try {
            parser.parseString(xml, (error, xmlJs) => {
                if (error) {
                    return reject(error);
                }
                let inv = xmlJs.Invoice ? xmlJs.Invoice : xmlJs["inv:Invoice"];
                let tax_subtotals = [];
                inv["cac:TaxTotal"]?.[0]["cac:TaxSubtotal"].forEach((tax) => {
                    tax_subtotals.push({
                        name: tax["cac:TaxCategory"]?.[0]["cac:TaxScheme"]?.[0][
                            "cbc:Name"
                        ]?.[0],
                        code: tax["cac:TaxCategory"]?.[0]["cac:TaxScheme"]?.[0][
                            "cbc:TaxTypeCode"
                        ]?.[0],
                        percent: Number(tax["cbc:Percent"]?.[0]) || 0,
                        taxable: Number(tax["cbc:TaxableAmount"]?.[0]._) || 0,
                        taxable_currency:
                            tax["cbc:TaxableAmount"]?.[0].$.currencyID,
                        amount: Number(tax["cbc:TaxAmount"]?.[0]._) || 0,
                        amount_currency: tax["cbc:TaxAmount"]?.[0].$.currencyID,
                    });
                });
                let lines = [];
                inv["cac:InvoiceLine"].forEach((line, index) => {
                    let line_allowances = [];
                    if (line["cac:AllowanceCharge"]?.[0]) {
                        line["cac:AllowanceCharge"].forEach((allowance) => {
                            line_allowances.push({
                                is_charge:
                                    allowance["cbc:ChargeIndicator"]?.[0] ==
                                    "true"
                                        ? true
                                        : false,
                                reason: allowance[
                                    "cbc:AllowanceChargeReason"
                                ]?.[0],
                                multiplier:
                                    Number(
                                        allowance[
                                            "cbc:MultiplierFactorNumeric"
                                        ]?.[0]
                                    ) || 0,
                                amount:
                                    Number(allowance["cbc:Amount"]?.[0]._) || 0,
                                amount_currency:
                                    allowance["cbc:Amount"]?.[0].$.currencyID,
                                base_amount:
                                    Number(
                                        allowance["cbc:BaseAmount"]?.[0]._
                                    ) || 0,
                                base_amount_currency:
                                    allowance["cbc:BaseAmount"]?.[0].$
                                        .currencyID,
                            });
                        });
                    }
                    let line_tax_subtotals = [];
                    if (line["cac:TaxTotal"]?.[0]) {
                        if (line["cac:TaxTotal"]?.[0]["cac:TaxSubtotal"]?.[0]) {
                            line["cac:TaxTotal"]?.[0][
                                "cac:TaxSubtotal"
                            ].forEach((tax) => {
                                let tax_subtotal = {
                                    taxable:
                                        Number(
                                            tax["cbc:TaxableAmount"]?.[0]._
                                        ) || 0,
                                    taxable_currency:
                                        tax["cbc:TaxableAmount"]?.[0].$
                                            .currencyID,
                                    amount:
                                        Number(tax["cbc:TaxAmount"]?.[0]._) ||
                                        0,
                                    amount_currency:
                                        tax["cbc:TaxAmount"]?.[0].$.currencyID,
                                    percent:
                                        Number(tax["cbc:Percent"]?.[0]) || 0,
                                };
                                line_tax_subtotals.push(tax_subtotal);
                            });
                        }
                    }
                    lines.push({
                        id: line["cbc:ID"]?.[0]
                            ? line["cbc:ID"]?.[0]
                            : index + 1,
                        name: clearData(line["cac:Item"]?.[0]["cbc:Name"]?.[0]),
                        quantity:
                            Number(line["cbc:InvoicedQuantity"]?.[0]._) || 0,
                        quantity_unit:
                            line["cbc:InvoicedQuantity"]?.[0].$.unitCode,
                        price:
                            Number(
                                line["cac:Price"]?.[0]["cbc:PriceAmount"]?.[0]._
                            ) || 0,
                        price_currency:
                            line["cac:Price"]?.[0]["cbc:PriceAmount"]?.[0].$
                                .currencyID,
                        extension_amount:
                            Number(line["cbc:LineExtensionAmount"]?.[0]._) || 0,
                        extension_amount_currency:
                            line["cbc:LineExtensionAmount"]?.[0].$.currencyID,
                        allowances: line_allowances,
                        tax: {
                            amount:
                                Number(
                                    line["cac:TaxTotal"]?.[0][
                                        "cbc:TaxAmount"
                                    ]?.[0]._
                                ) || 0,
                            amount_currency:
                                line["cac:TaxTotal"]?.[0]["cbc:TaxAmount"]?.[0]
                                    .$.currencyID,
                            subtotals: line_tax_subtotals,
                        },
                        tickets: [],
                    });
                });
                let json = {
                    uuid: inv["cbc:UUID"]?.[0],
                    envelope_uuid: "0",
                    number: inv["cbc:ID"]?.[0],
                    profile_id: inv["cbc:ProfileID"]?.[0],
                    type_code: inv["cbc:InvoiceTypeCode"]?.[0],
                    issue_datetime: date_time.parse(
                        `${(inv["cbc:IssueDate"]?.[0]).substring(0, 10)}T${
                            inv["cbc:IssueTime"]?.[0]
                                ? (inv["cbc:IssueTime"]?.[0]).substring(0, 8)
                                : "00:00:00"
                        }`,
                        "YYYY-MM-DDTHH:mm:ss",
                        true
                    ),
                    envelope_datetime: date_time.parse(
                        `${(inv["cbc:IssueDate"]?.[0]).substring(0, 10)}T${
                            inv["cbc:IssueTime"]?.[0]
                                ? (inv["cbc:IssueTime"]?.[0]).substring(0, 8)
                                : "00:00:00"
                        }`,
                        "YYYY-MM-DDTHH:mm:ss",
                        true
                    ),
                    currency_code:
                        typeof inv["cbc:DocumentCurrencyCode"]?.[0] == "object"
                            ? inv["cbc:DocumentCurrencyCode"]?.[0]._
                            : inv["cbc:DocumentCurrencyCode"]?.[0],
                    sender_object: {
                        name:
                            inv["cac:AccountingSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0].$.schemeID == "TCKN"
                                ? `${clearData(
                                      inv["cac:AccountingSupplierParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FirstName"
                                      ]?.[0]
                                  )} ${
                                      inv["cac:AccountingSupplierParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:MiddleName"
                                      ]?.[0]
                                          ? clearData(
                                                inv[
                                                    "cac:AccountingSupplierParty"
                                                ]?.[0]["cac:Party"]?.[0][
                                                    "cac:Person"
                                                ]?.[0]["cbc:MiddleName"]?.[0]
                                            )
                                          : ""
                                  } ${clearData(
                                      inv["cac:AccountingSupplierParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FamilyName"
                                      ]?.[0]
                                  )}`
                                : clearData(
                                      inv["cac:AccountingSupplierParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:PartyName"]?.[0][
                                          "cbc:Name"
                                      ]?.[0]
                                  ),
                        vkn_tckn:
                            inv["cac:AccountingSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0]._,
                        city: inv["cac:AccountingSupplierParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PostalAddress"]?.[0]["cbc:CityName"]?.[0],
                        city_subdivision:
                            inv["cac:AccountingSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:CitySubdivisionName"
                            ]?.[0],
                        address:
                            inv["cac:AccountingSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:StreetName"
                            ]?.[0],
                        postal_zone:
                            inv["cac:AccountingSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:PostalZone"
                            ]?.[0],
                        tax_office:
                            inv["cac:AccountingSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyTaxScheme"]?.[0][
                                "cac:TaxScheme"
                            ]?.[0]["cbc:Name"]?.[0],
                        email: inv["cac:AccountingSupplierParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:Contact"]?.[0]["cbc:ElectronicMail"]?.[0],
                        phone_number:
                            inv["cac:AccountingSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:Contact"]?.[0]["cbc:Telephone"]?.[0],
                    },
                    sender_name:
                        inv["cac:AccountingSupplierParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PartyIdentification"]?.[0]["cbc:ID"]?.[0].$
                            .schemeID == "TCKN"
                            ? `${clearData(
                                  inv["cac:AccountingSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FirstName"
                                  ]?.[0]
                              )} ${
                                  inv["cac:AccountingSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:MiddleName"
                                  ]?.[0]
                                      ? clearData(
                                            inv[
                                                "cac:AccountingSupplierParty"
                                            ]?.[0]["cac:Party"]?.[0][
                                                "cac:Person"
                                            ]?.[0]["cbc:MiddleName"]?.[0]
                                        )
                                      : ""
                              } ${clearData(
                                  inv["cac:AccountingSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FamilyName"
                                  ]?.[0]
                              )}`
                            : clearData(
                                  inv["cac:AccountingSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:PartyName"]?.[0]["cbc:Name"]?.[0]
                              ),
                    sender_tax:
                        inv["cac:AccountingSupplierParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PartyIdentification"]?.[0]["cbc:ID"]?.[0]._,
                    receiver_object: {
                        name:
                            inv["cac:AccountingCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0].$.schemeID == "TCKN"
                                ? `${clearData(
                                      inv["cac:AccountingCustomerParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FirstName"
                                      ]?.[0]
                                  )} ${
                                      inv["cac:AccountingCustomerParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:MiddleName"
                                      ]?.[0]
                                          ? clearData(
                                                inv[
                                                    "cac:AccountingCustomerParty"
                                                ]?.[0]["cac:Party"]?.[0][
                                                    "cac:Person"
                                                ]?.[0]["cbc:MiddleName"]?.[0]
                                            )
                                          : ""
                                  } ${clearData(
                                      inv["cac:AccountingCustomerParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FamilyName"
                                      ]?.[0]
                                  )}`
                                : clearData(
                                      inv["cac:AccountingCustomerParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:PartyName"]?.[0][
                                          "cbc:Name"
                                      ]?.[0]
                                  ),
                        vkn_tckn:
                            inv["cac:AccountingCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0]._,
                        city: inv["cac:AccountingCustomerParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PostalAddress"]?.[0]["cbc:CityName"]?.[0],
                        city_subdivision:
                            inv["cac:AccountingCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:CitySubdivisionName"
                            ]?.[0],
                        address:
                            inv["cac:AccountingCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:StreetName"
                            ]?.[0],
                        postal_zone:
                            inv["cac:AccountingCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:PostalZone"
                            ]?.[0],
                        tax_office:
                            inv["cac:AccountingCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyTaxScheme"]?.[0][
                                "cac:TaxScheme"
                            ]?.[0]["cbc:Name"]?.[0],
                        email: inv["cac:AccountingCustomerParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:Contact"]?.[0]["cbc:ElectronicMail"]?.[0],
                        phone_number:
                            inv["cac:AccountingCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:Contact"]?.[0]["cbc:Telephone"]?.[0],
                    },
                    receiver_name:
                        inv["cac:AccountingCustomerParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PartyIdentification"]?.[0]["cbc:ID"]?.[0].$
                            .schemeID == "TCKN"
                            ? `${clearData(
                                  inv["cac:AccountingCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FirstName"
                                  ]?.[0]
                              )} ${
                                  inv["cac:AccountingCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:MiddleName"
                                  ]?.[0]
                                      ? clearData(
                                            inv[
                                                "cac:AccountingCustomerParty"
                                            ]?.[0]["cac:Party"]?.[0][
                                                "cac:Person"
                                            ]?.[0]["cbc:MiddleName"]?.[0]
                                        )
                                      : ""
                              } ${clearData(
                                  inv["cac:AccountingCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FamilyName"
                                  ]?.[0]
                              )}`
                            : clearData(
                                  inv["cac:AccountingCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:PartyName"]?.[0]["cbc:Name"]?.[0]
                              ),
                    receiver_tax:
                        inv["cac:AccountingCustomerParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PartyIdentification"]?.[0]["cbc:ID"]?.[0]._,
                    line_extension:
                        Number(
                            inv["cac:LegalMonetaryTotal"]?.[0][
                                "cbc:LineExtensionAmount"
                            ]?.[0]._
                        ) || 0,
                    tax_exclusive:
                        Number(
                            inv["cac:LegalMonetaryTotal"]?.[0][
                                "cbc:TaxExclusiveAmount"
                            ]?.[0]._
                        ) || 0,
                    tax_inclusive:
                        Number(
                            inv["cac:LegalMonetaryTotal"]?.[0][
                                "cbc:TaxInclusiveAmount"
                            ]?.[0]._
                        ) || 0,
                    tax_total:
                        Number(
                            inv["cac:TaxTotal"]?.[0]["cbc:TaxAmount"]?.[0]._
                        ) || 0,
                    tax_subtotals: tax_subtotals,
                    allowance_total:
                        Number(
                            inv["cac:LegalMonetaryTotal"]?.[0][
                                "cbc:AllowanceTotalAmount"
                            ]?.[0]._
                        ) || 0,
                    charge_total: 0,
                    payable_amount:
                        Number(
                            inv["cac:LegalMonetaryTotal"]?.[0][
                                "cbc:PayableAmount"
                            ]?.[0]._
                        ) || 0,
                    lines: lines,
                    status_object: {},
                };
                return resolve(json);
            });
        } catch (error) {
            return reject(error);
        }
    });
};

module.exports = xmlToJson;
