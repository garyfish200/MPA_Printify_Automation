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

exports.createProduct = async (allProducts, athleteName) => {
  try {
    const specificAthleteLogos = await findLogosFromPrintify(athleteName);
    const newProducts = await createAllProducts(allProducts, specificAthleteLogos);
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
        print_areas: formatPrintAreas(product.data.print_areas),
      };
      const newProductWithNewLogo = addNewLogo(product.product, logoData, newProductData);
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

function formatPrintAreas(printAreas) {
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

function addNewLogo(productName, logoData, productData) {
  const oneLogo = logoData[0];
  const logoPosition = oneLogo.file_name.split("_")[1].toLowerCase();

  return {
    ...productData,
    print_areas: productData.print_areas.map((printArea) => {
      return {
        ...printArea,
        placeholders: printArea.placeholders.map((placeholder) => {
          if (placeholder.position === "front" && logoPosition === "front") {
            return {
              ...placeholder,
              images: [...placeholder.images, {
                      "id": oneLogo.id,
                      "name": oneLogo.file_name,
                      "type": oneLogo.mime_type,
                      "height": oneLogo.height,
                      "width": oneLogo.width,
                      "x": PRODUCT_IMAGE_DIMENSIONS[productName].x,
                      "y": PRODUCT_IMAGE_DIMENSIONS[productName].y,
                      "scale": PRODUCT_IMAGE_DIMENSIONS[productName].scale,
                      "angle": PRODUCT_IMAGE_DIMENSIONS[productName].angle
                    }],
            };
          } else if (placeholder.position === "back" && logoPosition === "both") {
            return {
              ...placeholder,
              images: [{
                "id": oneLogo.id,
                "name": oneLogo.file_name,
                "type": oneLogo.mime_type,
                "height": oneLogo.height,
                "width": oneLogo.width,
                "x": PRODUCT_IMAGE_DIMENSIONS[productName].x,
                "y": PRODUCT_IMAGE_DIMENSIONS[productName].y,
                "scale": PRODUCT_IMAGE_DIMENSIONS[productName].scale,
                "angle": PRODUCT_IMAGE_DIMENSIONS[productName].angle
              }]
            }
          } else if (placeholder.position === "front" && logoPosition === "both") {
            return {
              ...placeholder,
              images: [...placeholder.images, {
                "id": oneLogo.id,
                "name": oneLogo.file_name,
                "type": oneLogo.mime_type,
                "height": oneLogo.height,
                "width": oneLogo.width,
                "x": PRODUCT_IMAGE_DIMENSIONS[productName].x,
                "y": PRODUCT_IMAGE_DIMENSIONS[productName].y,
                "scale": PRODUCT_IMAGE_DIMENSIONS[productName].scale,
                "angle": PRODUCT_IMAGE_DIMENSIONS[productName].angle
              }]
            }
          } else {
            return placeholder;
          }
        }),
      };
    }),
  };
}

async function getLogoFromPrintifyById(logoId) {
  try {
    const response = await printifyAxios.get(`/uploads/${logoId}.json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching logo from Printify:', error);
    throw error;
  }
}

async function findLogosFromPrintify(athleteName) {
  try {
    const response = await printifyAxios.get(`/uploads.json?limit=100`);
    return findAthleteLogos(response.data, athleteName);
  } catch (error) {
    console.error('Error fetching logo from Printify:', error);
    throw error;
  }
}

const findAthleteLogos = async (logoData, athleteName) => {
  try {
    let athleteLogos = [];
    for (let i = 2; i < 6; i++) {
      athleteLogos = logoData.data.filter((logo) => {
        return logo.file_name.includes(athleteName);
      }); 

      if (athleteLogos.length > 0) {
        break;
      }
      const nextPage = await printifyAxios.get(`/uploads.json?limit=100&page=${i}`);
      logoData = nextPage.data;
    }
    
    return athleteLogos;
  } catch (error) {
    console.error('Error finding athlete logo:', error);
    throw error;
  }
}