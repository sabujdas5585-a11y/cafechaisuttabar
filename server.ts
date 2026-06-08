import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { put } from "@vercel/blob";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for uploading to Vercel Blob
  app.post("/api/upload", async (req, res) => {
    try {
      const { filename, data } = req.body;
      const buffer = Buffer.from(data, 'base64');
      
      const blob = await put(filename, buffer, {
        access: 'public',
      });
      
      res.json({ url: blob.url });
    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
