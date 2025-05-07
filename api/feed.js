import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  try {
    const filePath = path.join('/tmp', 'feed.csv');
    const data = await fs.readFile(filePath, 'utf-8');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="feed.csv"');
    res.status(200).send(data);
  } catch (err) {
    console.error("Feed nem található:", err);
    res.status(500).send("Feed nem elérhető vagy még nem lett generálva.");
  }
}
