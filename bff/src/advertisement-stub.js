const fs = require('fs')
const path = require('path')

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8').toString())

var PROTO_PATH = __dirname + '/protos/advertisement.proto';

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
var advertisement_proto = grpc.loadPackageDefinition(packageDefinition).advertisement;

async function getRandomAdvertisement() {
  var client = new advertisement_proto.Advertisement(config.advertisement.endpoint,
                                       grpc.credentials.createInsecure());
  return new Promise((resolve, reject) => {
    let timeout = new Date().setSeconds(new Date().getSeconds() + config.advertisement.timeout)
    client.getRandomAdvertisement(null, {deadline: timeout}, function(err, res) {
      grpc.closeClient(client)
      if(err) {
        reject(err)
      }
      else 
        resolve(res)
    });
  });
}

exports.getRandomAdvertisement = getRandomAdvertisement;

//getRandomAdvertisement().then((res) => {
//  console.log(res);
//}).catch((err) => {
//  console.log(err);
//})
