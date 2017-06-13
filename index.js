var sqlite3 = require('sqlite3');
const sdk = require('kinvey-flex-sdk');
var db = new sqlite3.Database('mydb.db');
var Stopwatch = require("node-stopwatch").Stopwatch;

var stopwatch = Stopwatch.create();
stopwatch.start();

sdk.service(function(err, flex) {

	//const flexFunctions = flex.functions;

	db.serialize(function() {

		db.run("CREATE TABLE if not exists user_info (name TEXT, email TEXT, number NUMBER)");
		// var stmt = db.prepare("INSERT INTO user_info VALUES (?)");
		// for (var i = 0; i < 10; i++) {
		//     stmt.run("Ipsum " + i);
		// }
		db.run("BEGIN");

		var values = [
		    {name: 'demian', email:'demian@gmail.com', number: 1},
		    {name:'john', email:'john@gmail.com', number: 2}
		];
		var stmt = db.prepare("INSERT INTO user_info VALUES (?, ?, ?)");
		
		db.serialize(function(){
			for (var i=0; i<500000; i++){
				//values.forEach((value) => {
				stmt.run([values[0].name, values[0].email, values[0].number]);
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

	console.log("seconds: " + stopwatch.elapsed.seconds);
	stopwatch.stop();

	db.close();

	console.log("done");

};

