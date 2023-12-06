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
                let dsp = xmlJs.DespatchAdvice
                    ? xmlJs.DespatchAdvice
                    : xmlJs["dsp:DespatchAdvice"];
                let json = {
                    uuid: dsp["cbc:UUID"]?.[0],
                    envelope_uuid: "0",
                    number: dsp["cbc:ID"]?.[0],
                    profile_id: dsp["cbc:ProfileID"]?.[0],
                    type_code: dsp["cbc:DespatchAdviceTypeCode"]?.[0],
                    issue_datetime: date_time.parse(
                        `${(dsp["cbc:IssueDate"]?.[0]).substring(0, 10)}T${
                            dsp["cbc:IssueTime"]?.[0]
                                ? (dsp["cbc:IssueTime"]?.[0]).substring(0, 8)
                                : "00:00:00"
                        }`,
                        "YYYY-MM-DDTHH:mm:ss",
                        true
                    ),
                    envelope_datetime: date_time.parse(
                        `${(dsp["cbc:IssueDate"]?.[0]).substring(0, 10)}T${
                            dsp["cbc:IssueTime"]?.[0]
                                ? (dsp["cbc:IssueTime"]?.[0]).substring(0, 8)
                                : "00:00:00"
                        }`,
                        "YYYY-MM-DDTHH:mm:ss",
                        true
                    ),
                    currency_code: null,
                    sender_object: {
                        name:
                            dsp["cac:DespatchSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0].$.schemeID == "TCKN"
                                ? `${
                                      dsp["cac:DespatchSupplierParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FirstName"
                                      ]?.[0]
                                  } ${
                                      dsp["cac:DespatchSupplierParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:MiddleName"
                                      ]?.[0]
                                          ? dsp[
                                                "cac:DespatchSupplierParty"
                                            ]?.[0]["cac:Party"]?.[0][
                                                "cac:Person"
                                            ]?.[0]["cbc:MiddleName"]?.[0]
                                          : ""
                                  } ${
                                      dsp["cac:DespatchSupplierParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FamilyName"
                                      ]?.[0]
                                  }`
                                : dsp["cac:DespatchSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:PartyName"]?.[0]["cbc:Name"]?.[0],
                        vkn_tckn:
                            dsp["cac:DespatchSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0]._,
                        city: dsp["cac:DespatchSupplierParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PostalAddress"]?.[0]["cbc:CityName"]?.[0],
                        city_subdivision:
                            dsp["cac:DespatchSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:CitySubdivisionName"
                            ]?.[0],
                        address:
                            dsp["cac:DespatchSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:StreetName"
                            ]?.[0],
                        postal_zone:
                            dsp["cac:DespatchSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:PostalZone"
                            ]?.[0],
                        tax_office:
                            dsp["cac:DespatchSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyTaxScheme"]?.[0][
                                "cac:TaxScheme"
                            ]?.[0]["cbc:Name"]?.[0],
                        email: dsp["cac:DespatchSupplierParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:Contact"]?.[0]["cbc:ElectronicMail"]?.[0],
                        phone_number:
                            dsp["cac:DespatchSupplierParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:Contact"]?.[0]["cbc:Telephone"]?.[0],
                    },
                    sender_name:
                        dsp["cac:DespatchSupplierParty"]?.[0]["cac:Party"]?.[0][
                            "cac:PartyIdentification"
                        ]?.[0]["cbc:ID"]?.[0].$.schemeID == "TCKN"
                            ? `${
                                  dsp["cac:DespatchSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FirstName"
                                  ]?.[0]
                              } ${
                                  dsp["cac:DespatchSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:MiddleName"
                                  ]?.[0]
                                      ? dsp["cac:DespatchSupplierParty"]?.[0][
                                            "cac:Party"
                                        ]?.[0]["cac:Person"]?.[0][
                                            "cbc:MiddleName"
                                        ]?.[0]
                                      : ""
                              } ${
                                  dsp["cac:DespatchSupplierParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FamilyName"
                                  ]?.[0]
                              }`
                            : dsp["cac:DespatchSupplierParty"]?.[0][
                                  "cac:Party"
                              ]?.[0]["cac:PartyName"]?.[0]["cbc:Name"]?.[0],
                    sender_tax:
                        dsp["cac:DespatchSupplierParty"]?.[0]["cac:Party"]?.[0][
                            "cac:PartyIdentification"
                        ]?.[0]["cbc:ID"]?.[0]._,
                    receiver_object: {
                        name:
                            dsp["cac:DeliveryCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0].$.schemeID == "TCKN"
                                ? `${
                                      dsp["cac:DeliveryCustomerParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FirstName"
                                      ]?.[0]
                                  } ${
                                      dsp["cac:DeliveryCustomerParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:MiddleName"
                                      ]?.[0]
                                          ? dsp[
                                                "cac:DeliveryCustomerParty"
                                            ]?.[0]["cac:Party"]?.[0][
                                                "cac:Person"
                                            ]?.[0]["cbc:MiddleName"]?.[0]
                                          : ""
                                  } ${
                                      dsp["cac:DeliveryCustomerParty"]?.[0][
                                          "cac:Party"
                                      ]?.[0]["cac:Person"]?.[0][
                                          "cbc:FamilyName"
                                      ]?.[0]
                                  }`
                                : dsp["cac:DeliveryCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:PartyName"]?.[0]["cbc:Name"]?.[0],
                        vkn_tckn:
                            dsp["cac:DeliveryCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyIdentification"]?.[0][
                                "cbc:ID"
                            ]?.[0]._,
                        city: dsp["cac:DeliveryCustomerParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:PostalAddress"]?.[0]["cbc:CityName"]?.[0],
                        city_subdivision:
                            dsp["cac:DeliveryCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:CitySubdivisionName"
                            ]?.[0],
                        address:
                            dsp["cac:DeliveryCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:StreetName"
                            ]?.[0],
                        postal_zone:
                            dsp["cac:DeliveryCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PostalAddress"]?.[0][
                                "cbc:PostalZone"
                            ]?.[0],
                        tax_office:
                            dsp["cac:DeliveryCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:PartyTaxScheme"]?.[0][
                                "cac:TaxScheme"
                            ]?.[0]["cbc:Name"]?.[0],
                        email: dsp["cac:DeliveryCustomerParty"]?.[0][
                            "cac:Party"
                        ]?.[0]["cac:Contact"]?.[0]["cbc:ElectronicMail"]?.[0],
                        phone_number:
                            dsp["cac:DeliveryCustomerParty"]?.[0][
                                "cac:Party"
                            ]?.[0]["cac:Contact"]?.[0]["cbc:Telephone"]?.[0],
                    },
                    receiver_name:
                        dsp["cac:DeliveryCustomerParty"]?.[0]["cac:Party"]?.[0][
                            "cac:PartyIdentification"
                        ]?.[0]["cbc:ID"]?.[0].$.schemeID == "TCKN"
                            ? `${
                                  dsp["cac:DeliveryCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FirstName"
                                  ]?.[0]
                              } ${
                                  dsp["cac:DeliveryCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:MiddleName"
                                  ]?.[0]
                                      ? dsp["cac:DeliveryCustomerParty"]?.[0][
                                            "cac:Party"
                                        ]?.[0]["cac:Person"]?.[0][
                                            "cbc:MiddleName"
                                        ]?.[0]
                                      : ""
                              } ${
                                  dsp["cac:DeliveryCustomerParty"]?.[0][
                                      "cac:Party"
                                  ]?.[0]["cac:Person"]?.[0][
                                      "cbc:FamilyName"
                                  ]?.[0]
                              }`
                            : dsp["cac:DeliveryCustomerParty"]?.[0][
                                  "cac:Party"
                              ]?.[0]["cac:PartyName"]?.[0]["cbc:Name"]?.[0],
                    receiver_tax:
                        dsp["cac:DeliveryCustomerParty"]?.[0]["cac:Party"]?.[0][
                            "cac:PartyIdentification"
                        ]?.[0]["cbc:ID"]?.[0]._,
                    line_extension: 0,
                    tax_exclusive: 0,
                    tax_inclusive: 0,
                    tax_total: 0,
                    allowance_total: 0,
                    charge_total: 0,
                    payable_amount: 0,
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
