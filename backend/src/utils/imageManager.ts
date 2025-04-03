import sharp from "sharp";
import fs from "node:fs/promises";

export default async function imageParser(image: any, path: string, type: string) {
    try {
      await fs.writeFile(`${path}/${image.originalname}`, image.buffer); 
      
      await sharp(`${path}/${image.originalname}`)
      .webp({quality: 100})
      .toFile(`${path}/${type}.webp`);
      
      await fs.rm(`${path}/${image.originalname}`);
      console.log(`thumbnail.webp guardada exitosamente en ${path}/${type}.webp`);
      } catch (error) {
        console.error('Error al convertir la imagen a webp: ', error);
      }
}