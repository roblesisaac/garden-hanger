import { http } from '@ampt/sdk';
import sharp from 'sharp';

export async function sharpImage(size, fileName) {
    try {
        const imageStream = await http.node.readStaticFile(`/images/${fileName}`);
        const imageBuffer = await makeImageBuffer(imageStream);
        const [width, height] = size.split('x').map(Number);

        const resizedImage = await sharp(imageBuffer)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();

        return resizedImage;
    } catch (err) {
        console.log(err);
        return err;
    }
}

async function makeImageBuffer(imgStream) {
    const chunks = [];

    for await (const chunk of imgStream) {
      chunks.push(chunk);
    }
    
    const imageBuffer = Buffer.concat(chunks);

    return imageBuffer;
}