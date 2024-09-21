import * as sharpServices from '../services/sharpServices';

export default {
    sharpImage: async (req, res) => {
        const maxAge = 60 * 60 * 24 * 7;
        const { size, fileName } = req.params;

        const resizedImage = await sharpServices.sharpImage(size, fileName);
        const fileType = fileName.split('.')[1];
        
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        res.contentType(`image/${fileType}`);
        res.send(resizedImage);
    }
}