const Koa = require('koa')
const Router = require('koa-router')
const render = require('koa-ejs')
const path = require('path')

const product = require('./product-stub')
const review = require('./review-stub')
const advertisement = require('./advertisement-stub')

const app = new Koa();
app.proxy = true


// ejs configuration
render(app, {
  root: path.join(__dirname, 'view'),
  layout: false,
  viewExt: 'html',
  cache: false,
  debug: false
});

async function addReviewtoProductDetails(products) {
  //get product data
  let productDetails = products.data._embedded.product
  for(let i = 0; i < productDetails.length; i++) {
    //get review data
    let reviews = {}
    let err = false
    try {
      reviews = await review.GetMostHelpfulReviews({product_id: productDetails[i].product_id});
    } catch(e) {
      err = true
      reviews.err = "error fetching reviews!"
    }
    productDetails[i].reviews = reviews;
    if(!err) {
      productDetails[i].reviews.review_messages.forEach((element, index, origin) => {
        if(element.rate == undefined) {
          origin[index].rate = {}
          origin[index].rate.rating = "error fetching rating"
        } else {
          origin[index].rate.rating = element.rate.current + "/" + element.rate.maximum
        }
      })
    }
  }
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
  //console.log("[" + now.toISOString() + "]" + 
  //            ctx.request.ips + ' ' + ctx.request.headers['user-agent'] + ' '  + 
  //            ctx.request.method + ' => ' + 
  //            ctx.request.href + ' ' + ctx.response.status)
  let log = {}
  log.timestamp = now.toISOString()
  log.request = {}
  log.request.ips = ctx.request.ips
  log.request.headers = []
  log.request.headers['user-agent'] = ctx.request.headers['user-agent']
  log.request.method = ctx.request.method
  log.request.href = ctx.request.href
  log.response = {}
  log.response.status = ctx.response.status
  console.log(JSON.stringify(log))
})

// routing
let router = new Router()

router.get('/', async (ctx, next) => {
  let products = await product.getProductDetails()
  let productDetails = await addReviewtoProductDetails(products)
  let ad = {}
  try {
    ad = await advertisement.getRandomAdvertisement()
  }
  catch(e) {
    ad.description = "error fetching advertisement!"
  }
  //reviews = await review.GetMostHelpfulReviews({product_id: 1});
  await ctx.render('index', {
    productDetails: productDetails,
    advertisement: ad,
  })

  next()
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(8000)

