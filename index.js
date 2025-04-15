import express from "express";
import fetch from "node-fetch";
import { Buffer } from "buffer";

const app = express();

app.get("/feed.csv", async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Lekérés érkezett a /feed.csv végpontra`);

  const url = "https://apiv1.erotikamarket.hu/service_v2/productsXmlGenerator_sk.php";
  const username = "incike@azet.sk";
  const password = "2007Mark";
  const auth = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": auth
      }
    });

    if (!response.ok) return res.status(500).send("Hiba történt a forrás elérésekor.");
    const xmlText = await response.text();
    const matches = xmlText.matchAll(/<product>([\s\S]*?)<\/product>/g);

    let result = `sku;ar3;ar6;fogyar;akcios_ar;stock;instock_status_id\n`;

    for (const match of matches) {
      const block = match[1];

      const getTag = (tag) => {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`);
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

    res.set("Content-Type", "text/csv; charset=UTF-8");
    res.send(result);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Hiba a feldolgozás közben:`, err);
    res.status(500).send("Hiba a feldolgozás közben.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Szerver elindult: http://localhost:${port}/feed.csv`);
});
