const Koa = require('koa')
const Router = require('koa-router')
const render = require('koa-ejs')
const static = require('koa-static')
const path = require('path')

const product = require('./product-stub')
const review = require('./review-stub')
const advertisement = require('./advertisement-stub')

const app = new Koa();
app.proxy = true

const staticPath = './view/resource'
app.use(static(
  path.join( __dirname, staticPath)
))

// ejs configuration
render(app, {
  root: path.join(__dirname, 'view'),
  layout: false,
  viewExt: 'html',
  cache: false,
  debug: false
});

//extract headers used for tracing
function extractTracingHeaders(requestHeaders) {
  let targetHeaders = ["x-request-id",
                       "x-b3-traceid",
                       "x-b3-spanid",
                       "x-b3-parentspanid",
                       "x-b3-sampled",
                       "x-b3-flags",
                       "x-ot-span-context"]
  let tracingHeaders = {}
  targetHeaders.forEach(header => {
    if (requestHeaders.hasOwnProperty(header)) {
      tracingHeaders[header] = requestHeaders[header]
    }
  })
  return tracingHeaders
}

async function addReviewtoProductDetails(products, tracingHeaders) {
  //get product data
  let productDetails = products.data._embedded.product
  await Promise.all(productDetails.map(async (element, index, origin) => {
    let reviews = {}
    let err = false
    try {
      reviews = await review.GetMostHelpfulReviews({product_id: productDetails[index].product_id}, tracingHeaders);
    } catch(e) {
      err = true
      reviews.err = "error fetching reviews!"
    }
    productDetails[index].reviews = reviews;
    if(!err) {
      productDetails[index].reviews.review_messages.forEach((element, index, origin) => {
        if(element.rate == undefined) {
          origin[index].rate = {}
          origin[index].rate.rating = "error fetching rating"
        } else {
          origin[index].rate.rating = element.rate.current + "/" + element.rate.maximum
        }
      })
    }
  }))
  return productDetails
}

// set response time to header
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const responseTime = Date.now() - start
  ctx.set('X-Response-Time', `${responseTime}ms`)
})

// logging
app.use(async (ctx, next) => {
  await next()
  let now = new Date()
  let log = {}
  log.timestamp = now.toISOString()
  log.request = {}
  log.request.ips = ctx.request.ips
  log.request.headers = ctx.request.headers
  log.request.method = ctx.request.method
  log.request.href = ctx.request.href
  log.response = {}
  log.response.status = ctx.response.status
  log.response.headers = ctx.response.headers
  if(ctx.response.reason) {
    log.response.reason = ctx.response.reason
  }
  console.log(JSON.stringify(log))
})

// routing
let router = new Router()

router.get('/', async (ctx, next) => {
  let tracingHeaders = extractTracingHeaders(ctx.request.headers)
  let products
  try {
    products = await product.getProductDetails(tracingHeaders)
  } catch(err) {
    console.log(err)
    ctx.response.reason = err.code
    ctx.response.status = 503
    await next()
    return 
  }
  //let productDetails = await addReviewtoProductDetails(products, tracingHeaders)
  //let ad = await advertisement.getRandomAdvertisement(tracingHeaders)
  let productDetails
  let ad
  await Promise.all([
    addReviewtoProductDetails(products, tracingHeaders),
    advertisement.getRandomAdvertisement(tracingHeaders)
  ]).then(
    value => {
      productDetails = value[0]
      ad = value[1]
    }
  )
  await ctx.render('index', {
    productDetails: productDetails,
    advertisement: ad,
  })

  await next()
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(8000)

