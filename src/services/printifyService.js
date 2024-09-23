const axios = require('axios');
const { PRODUCT_ID_MAPPING, PRODUCT_IMAGE_DIMENSIONS } = require('../constants');

const PRINTIFY_API_BASE_URL = 'https://api.printify.com/v1';

// console.log('PRINTIFY_API_KEY:', process.env.PRINTIFY_API_KEY);
// console.log('PRINTIFY_SHOP_ID:', process.env.PRINTIFY_SHOP_ID);

const printifyAxios = axios.create({
  baseURL: PRINTIFY_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

printifyAxios.interceptors.request.use((config) => {
  const apiKey = process.env.PRINTIFY_API_KEY;
  config.headers['Authorization'] = `Bearer ${apiKey}`;
  return config;
});

exports.getProduct = async (productList) => {
  try {
    const allProducts = await getAllProducts(productList);
    return allProducts;
  } catch (error) {
    console.error('Error fetching product from Printify:', error);
    throw error;
  }
};

exports.createProduct = async (allProducts) => {
  try {
    const logoData = await getLogoFromPrintify('66e86ddc67f170ec08d9ee6a');
    const newProducts = await createAllProducts(allProducts, logoData);
    return newProducts;
  } catch (error) {
    console.error('Error creating new product on Printify:', error);
    throw error;
  }
};

exports.updateProduct = async (productId, updatedProductData) => {
  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    const response = await printifyAxios.put(`/shops/${shopId}/products/${productId}.json`, updatedProductData);
    return response.data;
  } catch (error) {
    console.error('Error updating product on Printify:', error);
    throw error;
  }
}

async function getAllProducts(productList) {
  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    let allProducts = [];
    for (let product of productList) {
      const itemID = PRODUCT_ID_MAPPING[product];
      const response = await printifyAxios.get(`/shops/${shopId}/products/${itemID}.json`);
      allProducts.push({ product: product, data: response.data });
    }
    return allProducts
  } catch (error) {
    console.error('Error fetching product from Printify:', error);
    throw error;
  }
}

async function createAllProducts(allProducts, logoData) {
  try {
    const shopId = process.env.PRINTIFY_SHOP_ID;
    let newProducts = [];
    for (let product of allProducts) {
      const newProductData = {
        ...product.data,
        title: `Copy of ${product.data.title}: This is a new Athlete`,
        description: `${product.data.description}\n(Copied from product ID: ${product.data.id}), this is for a new athlete's design`,
        print_areas: formatPrintAreas(product.data.print_areas, product.product, logoData),
      };
      const newProductWithNewLogo = addNewLogo(logoData, newProductData);
      const response = await printifyAxios.post(`/shops/${shopId}/products.json`, newProductWithNewLogo);
      newProducts.push(response.data);
      // newProducts.push(newProductData);
      // newProducts.push(newProductWithNewLogo);
    }
    return newProducts;
  } catch (error) {
    console.error('Error creating product on Printify:', error);
    throw error;
  }
}

function formatPrintAreas(printAreas, productName, logoData) {
  return printAreas.map((printArea) => {
    return {
      ...printArea,
      placeholders: printArea.placeholders.filter((placeholder) => {
        return placeholder.images.length > 0;
      }).map((placeholder) => {
        return {
          ...placeholder,
          images: placeholder.images.filter((image) => {
            return image.name !== "text_layer.svg";
          }).map((image) => {
            return {
              ...image,
              // x: PRODUCT_IMAGE_DIMENSIONS[productName].x,
              // y: PRODUCT_IMAGE_DIMENSIONS[productName].y,
            }
          }),
        };
      }),
    };
  })
}

async function getLogoFromPrintify(logoId) {
  try {
    const response = await printifyAxios.get(`/uploads/${logoId}.json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching logo from Printify:', error);
    throw error;
  }
}

function addNewLogo(logoData, productData) {
  return {
    ...productData,
    print_areas: productData.print_areas.map((printArea) => {
      return {
        ...printArea,
        placeholders: printArea.placeholders.map((placeholder) => {
          if (placeholder.position === "front") {
            return {
              ...placeholder,
              images: [...placeholder.images, {
                      "id": logoData.id,
                      "name": logoData.file_name,
                      "type": logoData.mime_type,
                      "height": logoData.height,
                      "width": logoData.width,
                      "x": 0.5,
                      "y": 0.5,
                      "scale": 0.9,
                      "angle": 0
                    }],
            };
          } else {
            return placeholder;
          }
        }),
      };
    }),
  };
}

// function getVariantIdsWithColor(allProducts) {
//   return allProducts.map((product) => {
//     return {
//       name: product.product,
//       variants: product.data.variants.map((variant) => {
//         return {
//           id: variant.id,
//           color: variant.title,
//         };
//       }),
//     };
//   });
// }