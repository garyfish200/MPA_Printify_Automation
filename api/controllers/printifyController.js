const printifyService = require('../services/printifyService');

exports.getProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await printifyService.getProduct(productId);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'An error occurred while fetching the product' });
  }
};

exports.createProductFromExisting = async (req, res) => {
  try {
    const listOfProducts = req.body.items.split(',').map((item) => item.trimStart());
    console.log("Body: ", req.body);
    console.log("Items: ", listOfProducts);
    const athleteName = req.body.athleteName;
    const allProducts = await printifyService.getProduct(listOfProducts);
    const newProducts = await printifyService.createProduct(allProducts, athleteName);
    res.status(201).json(newProducts);
    // res.status(201).json(allProducts);
  } catch (error) {
    console.error('Error creating new product:', error);
    res.status(500).json({ error: 'An error occurred while creating the new product' });
  }
};


// for this what I'm thinking is to get all the products first, then map to which one we want, then take that ID and update the product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updatedProduct = await printifyService.updateProduct(productId, req.body);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'An error occurred while updating the product' });
  }
}
