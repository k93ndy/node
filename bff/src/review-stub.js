const fs = require('fs')
const path = require('path')

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8').toString())

var PROTO_PATH = __dirname + '/protos/review.proto';

var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var review_proto = grpc.loadPackageDefinition(packageDefinition).review;

async function GetMostHelpfulReviews(ProductInfo) {
  var client = new review_proto.Review(config.review.endpoint,
                                       grpc.credentials.createInsecure());
  let timeout = new Date().setSeconds(new Date().getSeconds() + config.review.timeout)
  return new Promise((resolve, reject) => {
    client.GetMostHelpfulReviews(ProductInfo, {deadline: timeout}, function(err, res) {
      grpc.closeClient(client)
      if(err) 
        reject(err);
      else 
        resolve(res);
    });
  });
}

exports.GetMostHelpfulReviews = GetMostHelpfulReviews

//GetMostHelpfulReviews({product_id: 1}).then((res) => {
//  console.log(res);
//})
