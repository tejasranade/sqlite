//const express = require('express')
//const app = express()

var sqlite3 = require('sqlite3');
const sdk = require('kinvey-flex-sdk');
var db = new sqlite3.Database('kinveyOffline.sqlite');
var Stopwatch = require("node-stopwatch").Stopwatch;

const zlib = require('zlib');
const gzip = zlib.createGzip();
const fs = require('fs');

var Kinvey = require('kinvey-node-sdk');

// app.get('/', function (req, res) {
//   //console.log("Hit root route...");
//   res.send('Hello World!')
// })

// app.listen(process.env.PORT || 3000, function () {
//     console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
// })

//app.get('/create', function (req, res) {
sdk.service((err, flex) => {    

	function doStuff(context, complete, modules){
		console.log("Hit create route...");
		var stopwatch = Stopwatch.create();
		stopwatch.start();

	  	db.serialize(function() {

			db.run("CREATE TABLE if not exists hierarchy (_id TEXT, SalesOrganization TEXT, DistributionChannel TEXT, ConditionType TEXT, MaterialNumber TEXT, ValidityStartDate TEXT, ValidityEndDate TEXT, Price TEXT, Currency TEXT, DeliveryUnit TEXT, UnitQuantity TEXT, UnitOfMeasure TEXT, SAPCustomerNumber TEXT, _acl TEXT, _kmd TEXT)");
			db.run("PRAGMA synchronous = OFF");
			db.run("PRAGMA journal_mode = MEMORY");
			// var stmt = db.prepare("INSERT INTO user_info VALUES (?)");
			// for (var i = 0; i < 10; i++) {
			//     stmt.run("Ipsum " + i);
			// }
			db.run("BEGIN");

			var values = [
	        {
	            "_id": "10001000100056071483019ZCSP",
	            "SalesOrganization": "1000",
	            "DistributionChannel": "10",
	            "SAPCustomerNumber": "0010005607",
	            "MaterialNumber": "1483019",
	            "ConditionType": "ZCSP",
	            "SalesDivision": "",
	            "ValidityStartDate": "2015-10-30",
	            "ValidityEndDate": "2050-12-31",
	            "Price": "1.25",
	            "Currency": "USD",
	            "DeliveryUnit": "1.000",
	            "UnitQuantity": "1",
	            "UnitOfMeasure": "EA",
	            "_acl": {
	                "creator": "kid_B15Lb5Pl-"
	            },
	            "_kmd": {
	                "lmt": "2017-05-15T21:50:13.815Z",
	                "ect": "2017-05-15T21:50:13.815Z"
	            }
	        }
	    ];

	    var stmt = db.prepare("INSERT INTO hierarchy VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
			
			db.serialize(function(){
				for (var i=0; i<10; i++){
					//values.forEach((value) => {
					stmt.run([
						values[0]._id,
						values[0].SalesOrganization, 
						values[0].DistributionChannel, 
						values[0].ConditionType,
						values[0].MaterialNumber,
						values[0].ValidityStartDate,
						values[0].ValidityEndDate,
						values[0].Price,
						values[0].Currency,
						values[0].DeliveryUnit,
						values[0].UnitQuantity,
						values[0].UnitOfMeasure,
						values[0].SAPCustomerNumber,
						JSON.stringify(values[0]._acl),
						JSON.stringify(values[0]._kmd)
						]);
					//});		
				}
				// for (var i=0; i<values.length; i++){
				// 	stmt.run(values[i]);
				// }
				//stmt.run();
	      stmt.finalize();
			});

			db.run("COMMIT");

			// db.each("SELECT rowid AS id, info FROM user_info", function(err, row) {
			// 	//console.log(row.id + ": " + row.info);
			// });

			console.log("transaction done");
		});


		stopwatch.stop();

		db.close(function (error, result) {
			if (error) {
				console.log("DB close error: " + close);
				throw error;
			}

			const istream = fs.createReadStream('./kinveyOffline.sqlite');
			const ostream = fs.createWriteStream('./kinveyOffline.sqlite.gz');//, function (error, result) {
			// 	if (error) {
			// 		console.log(error);
			// 		throw error;
			// 	}
			// 	return result;
			// });

			istream.pipe(gzip).pipe(ostream);

			console.log("Start Kinvey...");
			Kinvey.initialize({
			  apiHostname: 'https://v3yk1n-kcs.kinvey.com',
			  appKey: 'kid_B15Lb5Pl-',
			  appSecret: 'b7b92c030f2d446999d66ad2f3c50c88'
			}).then(function(activeUser) {
				// var promise = Kinvey.ping().then(function(response) {
				//   console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
				// }).catch(function(error) {
				//   console.log('Kinvey Ping Failed. Response: ' + error.description);
				// });
				var promise = Kinvey.User.login('ccalato', 'ccalato').then(function onSuccess(user) {
					console.log("User logged in...");
					var fileContent = fs.readFile('./kinveyOffline.sqlite.gz', function (err,fileContent) {
						if (err) {
							return console.log("ReadFile error: " + err);
						}

						var metadata ={
						  _id: '12345',
						  filename: 'kinveyOffline.sqlite.gz',
						  mimeType: 'application/octet-stream',
						  size: fileContent.length
						};
						console.log("File content length: " + fileContent.length);
						console.dir(metadata);
						var promise = Kinvey.Files.upload(fileContent, metadata)
						  .then(function(file) {
						  	console.log("File upload succeeded...");
						  	console.log(file);						  	
						  	return complete().setBody("Kinvey complete").ok().done();
						  })
						  .catch(function(error) {
						  	console.log("File upload error.");
						  	// console.log("File upload error: " + util.inspect(myObject, false, null))
						  	console.dir(error);
						  });
						});
				}).catch(function onError(error) {
					console.log("Login error: " + error);
				});
		  	}).catch(function(error) {
			  console.log("Kinvey init error: " + error);
			  throw error
			})

		});
		//console.log("done");
		//res.send("seconds: " + stopwatch.elapsed.seconds);
	}

	flex.functions.register('seedCache', doStuff);

});

//})

// sdk.service(function(err, flex) {

// 	const flexFunctions = flex.functions;


// });