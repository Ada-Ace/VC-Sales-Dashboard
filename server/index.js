const express = require('express');
const cors = require('cors');

const { getSalesData } = require('./services/dataService');

const app = express();
app.use(cors());

const PORT = 3001;

app.get('/api/sales', async (req, res) => {
    try {
        const data = await getSalesData();
        res.json(data);
    } catch (error) {
        console.error('Data Fetch Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
