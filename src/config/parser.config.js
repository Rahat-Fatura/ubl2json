const alwaysArrayJpath = [];
const alwaysArrayTagName = [
  'Note',
  'BillingReference',
  'DespatchDocumentReference',
  'ReceiptDocumentReference',
  'OriginatorDocumentReference',
  'ContractDocumentReference',
  'AdditionalDocumentReference',
  'Delivery',
  'PaymentMeans',
  'AllowanceCharge',
  'TaxTotal',
  'TaxSubtotal',
  'WithholdingTaxTotal',
  'InvoiceLine',
  'DespatchLine',
  'BuildingNumber',
  'BillingReferenceLine',
  'OtherCommunication',
  'JuridictionRegionAddress',
  'DeliveryTerms',
  'OutstandingReason',
  'DocumentReference',
  'Shipment',
  'Description',
  'DocumentDescription',
  'Item',
  'FreightAllowanceCharge',
  'Temperature',
  'MeasurementDimension',
  'OrderLineReference',
  'DespatchLineReference',
  'ReceiptLineReference',
  'SubInvoiceLine',
  'AdditionalItemIdentification',
  'CommodityClassification',
  'ItemInstance',
  'ShipsRequirements',
  'PackagingMaterial',
  'ContainedPackage',
  'GoodsItem',
  'PartyLegalEntity',
  'RejectReason',
  'SpecialInstructions',
  'TransportHandlingUnit',
  'TransitDirectionCode',
  'DriverPerson',
  'Location',
  'DamageRemarks',
  'ActualPackage',
  'TransportEquipment',
  'TransportMeans',
  'HazardousGoodsTransit',
  'MeasurementDimension',
  'ShipmentDocumentReference',
  'CustomsDeclaration',
  'RegistrationNationality',
  'PartyIdentification',
  'Response',
];
const ignoreTags = ['Invoice.UBLExtensions', 'Invoice.Signature'];
const options = {
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  ignoreNameSpace: true,
  alwaysCreateTextNode: true,
  textNodeName: 'val',
  cdataPropName: '',
  ignoreDeclaration: true,
  ignorePiTags: true,
  parseAttributeValue: true,
  removeNSPrefix: true,
  trimValues: true,
  numberParseOptions: {
    leadingZeros: false,
  },
  isArray: (name, jpath) => {
    if (alwaysArrayJpath.indexOf(jpath) !== -1 || alwaysArrayTagName.indexOf(name) !== -1) return true;
  },
  updateTag: (tag, jPath) => {
    if (ignoreTags.indexOf(jPath) !== -1) return false;
    return tag;
  },
  tagValueProcessor: (tagName, tagValue, jPath, hasAttributes, isLeafNode) => {
    if (isLeafNode && tagValue.length < 1000) return tagValue;
    return '#base64encoded';
  },
};

module.exports = options;
