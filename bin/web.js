var _ = require('underscore');
var express = require('express');
var http = require('http');
var logger = require('winston');
var opt = require('optimist');
var path = require('path');

const https = require('https');
const fs = require('fs');

function letsencryptOptions(domain) {
    const path = '/etc/letsencrypt/live/';
    return {
        key: fs.readFileSync(path + domain + '/privkey.pem'),
        cert: fs.readFileSync(path + domain + '/cert.pem'),
        ca: fs.readFileSync(path + domain + '/chain.pem')
    };
}


var argv = require('optimist')
	.describe('config', 'Location of the configuration file').default('config', './config.json')
	.argv;

if (argv.h || argv.help) {
	opt.showHelp();
	return;
}

logger.cli();
logger.level = 'debug';

var config = loadConfig(argv.config);

function loadConfig(configPath) {
	var config = {
		port: 8080,
		content: 'localhost:9000'
	};

	try {
		logger.info('loading config file from ' + configPath + '..');
		var data = require(configPath);
		_.extend(config, data);
	} catch (e) {
		logger.warn('failed to load config', e);
	}

	return config;
}

(function main() {
	var app = express();

	app.set('views', __dirname);
	app.set('view engine', 'ejs');

	app.use(express.static(path.join(__dirname, '..', 'build')));
	app.use(function (req, res, next) {
		res.locals.content = config.content;
		res.render('index');
	});

	// var server = http.createServer(app);
	// server.listen(config.port, function () {
	// 	logger.info('web server is now listening on ' +  server.address().address + ":" + server.address().port);
	// });
	
	const options = letsencryptOptions('www.fartgod.xyz');
	var server = https.createServer(options,app);
	server.listen(443,function());

	return server;
})();
