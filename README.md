# UBL2JSON

Bu paket, Gelir İdaresi Başkanlığı tarafından belirtilen standartlarda oluşturulan XML belgelerini JSON objelerine dönüştürmek için geliştirilmiştir.

## Kurulum

Paketi projenize eklemek için aşağıdaki komutu kullanabilirsiniz:

```bash
npm install ubl2json
```

## Kullanım

### Fatura için

```javascript
const fs = require('fs');
const { invoice } = require('ubl2json');

// Fatura XML belgesinin içeriğini oku
const xmlData = fs.readFileSync('path/to/your/xml/invoice.xml', 'utf-8');

// Fatura XML belgesini düzenlenmiş ve küçültülmüş JSON objesine çevirmek için
const convertedJson = await invoice.convertedJson(xmlData)

// Fatura XML belgesini düzenlenmemiş JSON objesine çevirmek için
const rawJson = await invoice.rawJson(xmlData)

console.log(convertedJson);
console.log(rawJson);
```

## Lisans

Bu paket [MIT lisansı](LICENSE) ile lisanslanmıştır. Detaylı bilgi için lisans dosyasını kontrol edebilirsiniz.
