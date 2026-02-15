import { http } from '@ampt/sdk';

let sharpModulePromise;

async function getSharpModule() {
    if (!sharpModulePromise) {
        sharpModulePromise = import('sharp')
            .then((mod) => mod.default)
            .catch((err) => {
                console.warn('[sharp] Native module unavailable; serving original image buffer.', err?.message || err);
                return null;
            });
    }

    return sharpModulePromise;
}

export async function sharpImage(size, fileName) {
    const imageStream = await http.node.readStaticFile(`/images/${fileName}`);
    const imageBuffer = await makeImageBuffer(imageStream);
    const [width, height] = size.split('x').map(Number);
    const sharp = await getSharpModule();

    if (!sharp || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return imageBuffer;
    }

    try {
        return await sharp(imageBuffer)
            .resize(width, height, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
    } catch (err) {
        console.warn('[sharp] Resize failed; serving original image buffer.', err?.message || err);
        return imageBuffer;
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
