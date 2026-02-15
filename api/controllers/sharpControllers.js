import * as sharpServices from '../services/sharpServices';

export default {
    sharpImage: async (req, res) => {
        try {
            const maxAge = 60 * 60 * 24 * 7;
            const { size, fileName } = req.params;

            const resizedImage = await sharpServices.sharpImage(size, fileName);
            const fileType = fileName.split('.').pop();

            res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
            res.contentType(`image/${fileType}`);
            res.send(resizedImage);
        } catch (err) {
            console.error('[sharp] Failed to process image request', err);
            res.status(500).json({ message: 'Unable to process image.' });
        }
    }
}
