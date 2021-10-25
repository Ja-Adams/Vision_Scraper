// Imports the Google Cloud client library.
const {Storage} = require('@google-cloud/storage');
const Compute = require('@google-cloud/compute');
// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();


//insert into command line before running this program
//export GOOGLE_APPLICATION_CREDENTIALS="/home/boota24/Downloads/cloudtesting-254600-5103fe6a2f2e.json"

// Instantiates a client. If you don't specify credentials when constructing
// the client, the client library will look for credentials in the
// environment.
const storage = new Storage();
const https = require("https");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const partial = require("express-partials");
const formidable = require("formidable");
const rp = require('request-promise');
const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');
const Crawler = require("crawler");
const util = require('util');
const URL = require('url-parse');
const MongoClient = require('mongodb').MongoClient;
const mkdirp = require('mkdirp');
const assert = require('assert');
const dCloud = require('d3-cloud');
const Canvas = require('canvas');

let baseURL = '';
let URLari= [];
let imageari = [];
let count = 0;
let endLoop = false;
let URLsToVisit = [];
let url = new URL(baseURL);
let currentURL = URL;
var baseBase = "";
let imgData = [];
let labelFile = [];
let layout;
let labelMap = {};
let finalLabelAri = [];
let currentResponse = "";
let dbo;
let CursorAri;
let finalTable = "<table><tr>";

var dbUrl = 'mongodb://localhost:27017/cloud_time_2';

MongoClient.connect(dbUrl, {useUnifiedTopology: true}, function(err, db){
    if (err) throw err;
    console.log("db connected!");
    var dbo = db.db("cloud_time");
    const app = express();

const c = new Crawler({
        maxConnections : 1,
        // This will be called for each crawled page
        encoding:null, //image bodies won't be converted to string
        jQuery:false,// set false to suppress warning message.
        rateLimit: 1000, // `maxConnections` will be forced to 1
        callback: async function (error, res, done) {
            let $, self = this;
            if(error){
                console.log(error);
            }else{
                // $ is Cheerio by default
                //a lean implementation of core jQuery designed specifically for the server
                $ = cheerio.load(res.body);

                //Then grab all relative links and then images
                grabRelativeLinks($);
                grabImages($);

                //could return promise multiple timesf
                if(URLari.length > 0){
                    //add variable to pop a link off of the array and put this variable into the queue
                    //c.queue(URLari.pop());
                }
                else{
                    console.log("URLs left: " + URLari.length);
                    console.log("images collected: " + imageari.length);
                    console.log("last image: " + imageari[imageari.length-1]);
                }
                done();
                /*return new Promise((resolve, reject) => {
                    console.log('Starting');
                    CursorAri = dbo.collection("advancedonlineinsights").find({}, {"baseUrl": baseURL}).limit(8).toArray();
                    resolve();
                })*/
                dbo.collection("advancedonlineinsights").find({}, {"baseUrl": baseURL}).limit(20).toArray().then(items => {
                            console.log('Starting 2');
                            //throw new Error('Something failed');
                            labelFile = [];
                            return new Promise( async (resolve, reject) => {
                                console.log('Starting 3');
                                console.log("Ari: " + items[0].imageURL);
                                console.log("Items to label: "+items.length);
                                for(let v = 0; v<items.length; v++){
                                    console.log(""+items[v].imageURL);
                                    const [results] = await client.labelDetection(items[v].imageURL);
                                    const labels = results.labelAnnotations;
                                    //console.log("Come on");
                                    dbo.collection("advancedonlineinsights").updateOne({"_id": items[v]._id}, {$set: {"keywords": labels}});
                                    labels.forEach(label => labelFile.push(label.description));
                                }
                                resolve();
                            }).then(() => {
                                return new Promise((resolve, reject) => {
                                    console.log('Starting 4');
                                    labelMap = {};
                                    console.log("Label file: " + labelFile[1]);
                                    labelFile.forEach(function (key) {
                                        if (labelMap.hasOwnProperty(key)) {
                                            labelMap[key]++;
                                            console.log("Key Num:" + labelMap[key]);
                                        } else {
                                            labelMap[key] = 1;
                                            //console.log("First Key Num:" + labelMap[key]);
                                        }
                                    });
                                    console.log("Label Map: " + labelMap);
                                    resolve();
                                }).then(() => {
                                    return new Promise((resolve, reject) => {
                                        console.log('Starting 5');
                                        finalLabelAri = [];
                                        finalLabelAri = Object.keys(labelMap).map(function (key) {
                                            //console.log("Final keys: " + key);
                                            return {
                                                text: key,
                                                size: labelMap[key]
                                            };
                                        });
                                        finalLabelAri.sort(function (a, b) {
                                            return b.size - a.size;
                                        });
                                        console.log("Label array: " + finalLabelAri[0].text);
                                        resolve();
                                    }).then(() => {
                                        return new Promise((resolve, reject) => {
                                            console.log('Starting 6');
                                            count = 0;
                                            finalTable = "<table><tr><th>Labels</th>\n" +
                                                "    <th>Frequency</th></tr>";
                                            while(count < finalLabelAri.length){
                                                finalTable += "<tr><td> " + finalLabelAri[count].text + "</td><td>" + finalLabelAri[count].size + "</td></tr>";
                                                count++;
                                            }
                                            finalTable += "</table>";

                                            currentResponse.send(finalTable);

                                            console.log(finalTable);
                                        /*dCloud().size([960, 500])
                                                .canvas(function () {
                                                    return new Canvas(1, 1);
                                                })
                                                .words(finalLabelAri)
                                                .padding(5)
                                                .rotate(function () {
                                                    return ~~(Math.random() * 2) * 90;
                                                })
                                                .font("Impact")
                                                .fontSize(function (d) {
                                                    return d.size;
                                                })
                                                .on("end", end)
                                                .start();*/
                                            resolve();
                                        });
                                    }).catch(() => {
                                        console.error('Donut do that 4');
                                    });
                                }).catch(() => {
                                    console.error('Donut do that 3');
                                });
                            }).catch(() => {
                                console.error('Donut do that 2');
                            });
                    }).catch(() => {
                        console.error('Donut do that');
                    });
            }
        }
});

async function CrawlAndComplete(bURL, response) {
    return c.queue(bURL, response);
    /*
        dbo.collection("advancedonlineinsights").findOne().limit(1)( function (imagePro) {
            //imagePro.baseUrl;
            console.log("HEHEHEHEHEHEHEHEHEHEHEHEEEEEEEEEEEEEEE");
            //const [result] = await client.labelDetection(imagePro);});
        });*/
}

function end(words) { console.log(JSON.stringify(words)); }

function grabRelativeLinks($) {
    let relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");

    //checking if in lists of links visited and is part of the base URL
    relativeLinks.each(function() {
        if(URLsToVisit.includes(baseURL + $(this).attr('href') )){
            //console.log("already in");
        }
        else{
            URLsToVisit.push(baseURL + $(this).attr('href'));

            URLari.push(baseURL + $(this).attr('href'));
        }
    });
    //console.log("Found " + allRelativeLinks.length + " relative links");
}

function grabImages($) {
    //const allRelativeLinks = [];
    let imageLinks = $("img");
    console.log("Found " + imageLinks.length + " images on page");
    //console.log(imageLinks);
    //checking if in lists of links visited and is part of the base URL
        imageLinks.each(function (img) {
            var source = $(this).attr('src');
            if(typeof(source) != 'undefined') {
                //console.log("Okay fine");
                if((source.includes("png") || source.includes("jpg"))){
                    //if (imageari.includes(source)) {
                        //console.log("already in");
                    //} else {
                        console.log("Source: " + source);
                        imageari.push(source);
                        var img_url = source;
                        if(dbo.collection("advancedonlineinsights").find({'imageURL': img_url}).limit(1)){
                            console.log("Image previously collected");
                        }
                        else{
                            dbo.collection("advancedonlineinsights").insertOne({
                                'baseURL': baseURL,
                                'imageURL': img_url
                            }, function (err) {
                                if (err) throw err;
                                console.log("Pushing image...");
                                imgData.push({'baseURL': baseURL, 'imageURL': img_url});
                            });
                        }
                      //  }
                }
            }
        });
    //console.log("Found " + allRelativeLinks.length + " relative links");
}



var port = process.env.PORT || 8888;
app.set("views engine","ejs");
const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(session({secret: "**Mega Super What*??", resave: true, saveUninitialized: true}));
app.use(partial());

app.get("/boi",function(req, res){
    res.send("You made it");
});

app.get("/stand",function(req, res){
    res.render('stand.ejs', {title: "Input URL", headerTitle: "Input Form"});
});

app.post("/stand/begin", function(req, res){
    // Makes an authenticated API request.

    storage
        .getBuckets()
        .then((results) => {
            const buckets = results[0];

            console.log('Buckets:');
            buckets.forEach((bucket) => {
                console.log(bucket.name);
            });

        })
        .catch((err) => {
            console.error('ERROR:', err);
        });
//https://www.advancedonlineinsights.com/
    baseURL = req.body.urlpla;
    console.log("Base URL: "+baseURL);
    //mkdirp("./resources/"+baseURL.substr(baseURL.indexOf(".")+1), function(err) {});

        //c.queue(baseURL);
        currentResponse = res;

        CrawlAndComplete(baseURL, res);
        //var result = [];
        //dbo.collection('advancedonlineinsights').find({}, {image:1, _id:0}).forEach(function(u) { result.push(u.text) });
        //console.log("Label results: " + result);

        //do wordcloud function

});

async function quickstart() {
    // Performs label detection on the image file
    //const [result] = await client.labelDetection('./resources/bob.jpeg');
    const [result] = await client.labelDetection('https://i3.ypcdn.com/blob/0ac93abf1141b34b4b3494bba2099a170a790fd1_100x100_crop.jpg?4291758');
    //const [result] = /*await*/ client.labelDetection('https://drive.google.com/open?id=1oiGidonT2AnitWewcwoGYYa1Qx0Lntax');
    const labels = result.labelAnnotations;
    console.log('\nLabels:');
    labels.forEach(label => console.log(label.description));

    /*const [result1] = await client.faceDetection('./resources/bob.jpeg');
    const faces = result1.faceAnnotations;
    console.log('\nFaces:');
    faces.forEach((face, i) => {
        console.log(`  Face #${i + 1}:`);
        console.log(`    Joy: ${face.joyLikelihood}`);
        console.log(`    Anger: ${face.angerLikelihood}`);
        console.log(`    Sorrow: ${face.sorrowLikelihood}`);
        console.log(`    Surprise: ${face.surpriseLikelihood}`);
    });*/

    /*const [result2] = await client.imageProperties('./resources/bob.jpeg');
    const colors = result2.imagePropertiesAnnotation.dominantColors.colors;
    colors.forEach(color => console.log(color));*/

    /*const [result3] = await client.safeSearchDetection('./resources/bob.jpeg');
    const detections = result3.safeSearchAnnotation;
    console.log('\nSafe search:');
    console.log(`Adult: ${detections.adult}`);
    console.log(`Medical: ${detections.medical}`);
    console.log(`Spoof: ${detections.spoof}`);
    console.log(`Violence: ${detections.violence}`);
    console.log(`Racy: ${detections.racy}`);*/

    /*const [result4] = await client.webDetection('./resources/bob.jpeg');
    const webDetection = result4.webDetection;
    console.log("\n");
    if (webDetection.fullMatchingImages.length) {
        console.log(
            `Full matches found: ${webDetection.fullMatchingImages.length}`
        );
        webDetection.fullMatchingImages.forEach(image => {
            console.log(`  URL: ${image.url}`);
            console.log(`  Score: ${image.score}`);
        });
    }

    if (webDetection.partialMatchingImages.length) {
        console.log(
            `Partial matches found: ${webDetection.partialMatchingImages.length}`
        );
        webDetection.partialMatchingImages.forEach(image => {
            console.log(`  URL: ${image.url}`);
            console.log(`  Score: ${image.score}`);
        });
    }

    if (webDetection.webEntities.length) {
        console.log(`Web entities found: ${webDetection.webEntities.length}`);
        webDetection.webEntities.forEach(webEntity => {
            console.log(`  Description: ${webEntity.description}`);
            console.log(`  Score: ${webEntity.score}`);
        });
    }

    if (webDetection.bestGuessLabels.length) {
        console.log(
            `Best guess labels found: ${webDetection.bestGuessLabels.length}`
        );
        webDetection.bestGuessLabels.forEach(label => {
            console.log(`  Label: ${label.label}`);
        });
    }*/
}
//uncomment below to test if Vision API is working
//quickstart().catch(console.error);

app.listen(port, () => {
    console.log("Server is up on port : " + port);
});

});