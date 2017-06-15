//const express = require('express')
//const app = express()
const queue = require('async/queue');

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

		preProcess();

		const store = modules.dataStore();
  		const hierarchy = store.collection('hierarchycache');

  		//var customers = ["SBOOK", ];
  		var customers = [
  		//{name: "SBOOK", count:210893}, 
  		//{name: "MA00056", count: 2261}, 
  		{name: "MA00452", count: 43825}];
  		// {name: "MA20313", count: 340}, 
  		// {name: "MA00040", count: 45131}, 
  		// {name: "MA00405", count: 49128}, 
  		// {name: "MA09200", count: 41448}, 
  		// {name: "MA09208", count: 41688},
  		// {name: "MA20128", count: 46068},
  		// {name: "MA20404", count: 201670},
  		//{name: "MA20280", count: 202011}];
  		console.log(customers);

  		var resultSet = [];

  		var q = queue(function (query, callback) {
  			hierarchy.find(query, callback);
  		}, 25);

  		q.drain = function (){
  			console.log("fetched everything -");
  			console.log(resultSet.length);
  			postProcess();

  			const cacheReady = modules.dataStore().collection('cacheReady');
  			const user = modules.requestContext.getAuthenticatedUserId();
		    cacheReady.save({userId: user}, (err, savedResult) => {
		      if (err) {
		        //return complete().setBody(err).runtimeError().done();
		        console.log("error saving status");
		        return;
		      }
		      //complete().setBody(savedResult).ok().next();
		      console.log("success saving status");
		    });

  			//return complete().setBody("complete").ok().done();
  		};

  		customers.map(function (customer){

  		  	var skipCount = 0;
  		  	do {
  		  		const query = new modules.Query();
  		  		query.equalTo('SAPCustomerNumber', customer.name);
  		  		query.ascending('_id');
  		  		query.limit = 10000;
  		  		query.skip = skipCount;
  		  		
  		  		console.log("query: " + query);
	  		  	q.push(query, (err, values) => {
	  				//console.log(values);
	  				console.log("fetched page:" + values.length);
	  				persist(values);
	  				//resultSet = resultSet.concat(values);
	  			});	
  		  		skipCount += 10000;
  		  	} while (skipCount < customer.count); 
  		});

  		return complete().setBody("request accepted").ok().done();

  // 		for(var i=0; i<5; i++){
		// }

  // 		//parallel([], (err, results) => {
  // 		hierarchy.find(query, (err, values) => {
  // 			console.log("error - " + err);
  // 			console.log("results length - " + values.length);
  // 			console.log("results - " + values);


  // 			});
		// });
	}

	function preProcess(){
		db.serialize(function() {
			db.run("CREATE TABLE if not exists hierarchy (_id TEXT, SalesOrganization TEXT, DistributionChannel TEXT, ConditionType TEXT, MaterialNumber TEXT, ValidityStartDate TEXT, ValidityEndDate TEXT, Price TEXT, Currency TEXT, DeliveryUnit TEXT, UnitQuantity TEXT, UnitOfMeasure TEXT, SAPCustomerNumber TEXT, _acl TEXT, _kmd TEXT)");
			db.run("PRAGMA synchronous = OFF");
			db.run("PRAGMA journal_mode = MEMORY");
		});
	}

	function persist(values){
		db.serialize(function() {

			db.run("BEGIN");
			var stmt = db.prepare("INSERT INTO hierarchy VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
			console.log("starting insert");

			db.serialize(function(){
				for (var i=0; i<values.length; i++){
					//values.forEach((value) => {
					stmt.run([
						values[i]._id,
						values[i].SalesOrganization, 
						values[i].DistributionChannel, 
						values[i].ConditionType,
						values[i].MaterialNumber,
						values[i].ValidityStartDate,
						values[i].ValidityEndDate,
						values[i].Price,
						values[i].Currency,
						values[i].DeliveryUnit,
						values[i].UnitQuantity,
						values[i].UnitOfMeasure,
						values[i].SAPCustomerNumber,
						JSON.stringify(values[i]._acl),
						JSON.stringify(values[i]._kmd)
					]);
				}

		  		stmt.finalize();
			});
		      	
		    db.run("COMMIT");
		});
	}

	function postProcess(){
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
			  appSecret: ''
			}).then(function(activeUser) {
				// var promise = Kinvey.ping().then(function(response) {
				//   console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
				// }).catch(function(error) {
				//   console.log('Kinvey Ping Failed. Response: ' + error.description);
				// });
				var promise = Kinvey.User.login('ccalato', '').then(function onSuccess(user) {
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
	}

	flex.functions.register('seedCache', doStuff);
});

//})

// sdk.service(function(err, flex) {

// 	const flexFunctions = flex.functions;


// });