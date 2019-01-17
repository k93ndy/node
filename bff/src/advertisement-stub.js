const fs = require('fs')
const path = require('path')

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8').toString())

var PROTO_PATH = __dirname + '/protos/advertisement.proto'

var grpc = require('grpc')
var protoLoader = require('@grpc/proto-loader')
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    })
var advertisement_proto = grpc.loadPackageDefinition(packageDefinition).advertisement

async function getRandomAdvertisement(tracingHeaders) {
  var client = new advertisement_proto.Advertisement(config.advertisement.endpoint,
                                       grpc.credentials.createInsecure())
  let timeout = new Date().setSeconds(new Date().getSeconds() + config.advertisement.timeout)
  let meta = new grpc.Metadata()
  meta.set('deadline', timeout.toString())
  if (tracingHeaders != null) {
    Object.keys(tracingHeaders).forEach(tracingHeader => {
      meta.set(tracingHeader, tracingHeaders[tracingHeader])
    })
  }
  return new Promise((resolve, reject) => {
    client.getRandomAdvertisement(null, meta, function(err, res) {
      grpc.closeClient(client)
      if(err) {
        //reject(err)
        resolve({ description: "error fetching advertisement!" })
      }
      else {
        resolve(res)
      }
    })
  })
}

exports.getRandomAdvertisement = getRandomAdvertisement

//getRandomAdvertisement().then((res) => {
//  console.log(res);
//}).catch((err) => {
//  console.log(err);
//})
