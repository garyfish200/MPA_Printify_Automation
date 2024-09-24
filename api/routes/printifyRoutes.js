const express = require('express');
const printifyController = require('../controllers/printifyController');

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

router.get('/product/:id', printifyController.getProduct);
router.post('/product/create', express.json(), printifyController.createProductFromExisting);
router.put('/product/:id', printifyController.updateProduct);

module.exports = router;
