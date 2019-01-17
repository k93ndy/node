const axios = require('axios')
const fs = require('fs')
const path = require('path')

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8').toString())

let req = axios.create({
  baseURL: config.product.endpoint,
  timeout: config.product.timeout * 1000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  responseType: 'json',
});


async function getProductDetails(tracingHeaders) {
  Object.keys(tracingHeaders).forEach(tracingHeader => {
    req.defaults.headers[tracingHeader] = tracingHeaders[tracingHeader]
  })

  let productDetails
  let err
  try {
    productDetails = await req.get('/product/api/product')
    addIdtoDetails(productDetails)
    return productDetails
  } catch(e) {
    throw e
  }
}

function addIdtoDetails(productDetails) {
  const separator = '/'
  productDetails.data._embedded.product.forEach((element, index, origin) => {
    let separatedStrings = origin[index]._links.product.href.split(separator)
    let id = separatedStrings[separatedStrings.length-1]
    origin[index].product_id = id
  })
}

exports.getProductDetails = getProductDetails;

