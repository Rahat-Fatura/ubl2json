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
const ubl2json = require('ubl2json');

// Fatura XML belgesinin içeriğini oku
const xmlData = fs.readFileSync('path/to/your/xml/invoice.xml', 'utf-8');

// Fatura XML belgesini JSON objesine dönüştür
const jsonObj = ubl2json.invoice(xmlData);

console.log(jsonObj);
```

### İrsaliye için
```javascript
const fs = require('fs');
const ubl2json = require('ubl2json');

// İrsaliye XML belgesinin içeriğini oku
const xmlData = fs.readFileSync('path/to/your/xml/despatch.xml', 'utf-8');

// İrsaliye XML belgesini JSON objesine dönüştür
const jsonObj = ubl2json.despatch(xmlData);

console.log(jsonObj);
```

## Lisans

Bu paket [MIT lisansı](LICENSE) ile lisanslanmıştır. Detaylı bilgi için lisans dosyasını kontrol edebilirsiniz.