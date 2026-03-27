import sharp from "sharp";
import fs from "node:fs/promises";

export async function singleImage(image: any, path: string, type: string) {
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
export async function imageSet(images: any[], path: string) {
  try {
    for(let i = 0; i < images.length; i++) {
      const imgNo = (i+1).toString().padStart(2, "0");
      await fs.writeFile(`${path}/${images[i].originalname}`, images[i].buffer);

      await sharp(`${path}/${images[i].originalname}`)
      .webp({quality : 100})
      .toFile(`${path}/${imgNo}.webp`);

      await fs.rm(`${path}/${images[i].originalname}`);
      console.log(`Image ${imgNo}.webp saved succesfully at ${path}`);
    }
  } catch (error) {
    console.error('Error processing images: ', error);
  }
}