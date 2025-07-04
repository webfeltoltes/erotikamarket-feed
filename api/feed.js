export default async function handler(req, res) {
  const url = "https://apiv1.erotikamarket.hu/service_v2/productsXmlGenerator_sk.php";
  const username = process.env.API_USER;
  const password = process.env.API_PASS;
  const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": auth
      }
    });

    if (!response.ok) {
      return res.status(500).send("Hiba történt a forrás elérésekor.");
    }

    const xmlText = await response.text();
    const matches = xmlText.matchAll(/<product>([\s\S]*?)<\/product>/g);

    let result = `sku;ar3;ar6;fogyar;akcios_ar;stock;instock_status_id\n`;

    for (const match of matches) {
      const block = match[1];

      const getTag = (tag) => {
        const regex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`);
        const res = block.match(regex);
        return res ? res[1].trim() : '';
      };

      const sku = getTag('partnumber') || getTag('common');
      const ar3 = getTag('ar3');
      const ar6 = getTag('ar6');
      const akcios_ar = getTag('akcios_ar');
      const stock = getTag('subcounter');
      const instock = parseInt(stock) > 0 ? '1' : '0';
      const fogyar = ar3 && !isNaN(parseFloat(ar3)) ? (parseFloat(ar3) * 1.35).toFixed(2) : '';

      if (!sku) continue;

      result += `${sku};${ar3};${ar6};${fogyar};${akcios_ar};${stock};${instock}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=feed.csv");
    res.status(200).send(result);
  } catch (err) {
    console.error("Feed generálási hiba:", err);
    res.status(500).send("Hiba történt a feed előállításakor.");
  }
}