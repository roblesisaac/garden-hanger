import * as sharpServices from '../services/sharpServices';

export default {
    sharpImage: async (req, res) => {
        const { size, fileName } = req.params;

        const resizedImage = await sharpServices.sharpImage(size, fileName);
        const fileType = fileName.split('.')[1];

        res.contentType(`image/${fileType}`);
        res.send(resizedImage);
    }
}