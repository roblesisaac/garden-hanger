export default {
    test: (req, res) => {
        if(!req.auth) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        res.json({ user: req.auth.payload });
    }
}