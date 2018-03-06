/**
 * @file api backend router for handling process related to Conneto
 * @author SSH
 */

import express from 'express';
import net from 'net';
import axios from 'axios';

const router = express.Router();
var httpResponses = {getStatus:{}, getHosts: {}, getApps: {}, addHost: {}, startGame:{}};
var portForCentralServer = 4002;
var socketForCentralServer;
var connectRegularly;

/**
 * @description function used for connect to central server, it uses tcp
 * and register event handlers when connected. Also, if error occured or connection is closed, it tries connecting to it repeatedly with some time interval (3000ms default) 
 * @param {number} interval- time interval it retries connection in, unit is ms
 */
function connectToCentralServer(interval){
	socketForCentralServer = net.connect(portForCentralServer, "localhost", function(){
		console.log("Connection to Central Server Success!!");
		if(connectRegularly){
			clearInterval(connectRegularly);
			connectRegularly = null;
		}
		
		socketForCentralServer.on('close', function(){
			console.log('Connection to Central Server closed');
			if(!connectRegularly){
				connectRegularly = setInterval(connectToCentralServer, interval);
			}
		});
		socketForCentralServer.on('data', commandHandler);
	});
	socketForCentralServer.on('error', function(err){
		//console.log('err occured while connecting');
		if(!connectRegularly) {
			connectRegularly = setInterval(connectToCentralServer, interval);
		}
	});		
}
connectToCentralServer(3000);

/**
 * @description this function takes Request object and get Authorization field of header
 * and convert the data(Base64) to original data(Object)
 * this authentication process is called HTTP basic authentication
 * @see {@link https://en.wikipedia.org/wiki/Basic_access_authentication}
 * @param {Request} req- Request object that will be parsed
 * @return {Object} original data object the client want to sent 
 */
function getDatainAuthHeader(req){
	return JSON.parse(new Buffer(req.headers.authorization, 'base64').toString('ascii'));
}

/** TODO: Find better way for getting http request and send msg to central server 
 *     and send http response when getting msg from central server without 
 *		storing or sending http respnse data to censtral server.
 *	   
 *       Found seemingly better way: store http responses according to their purpose
 *		And when got one central server response, then handle all the http response 
 *		of same purpose. It doesn't seems like the best, but better.
 */

/**
 * @callback
 * @description router for getStatus: it sends request checking online status of Conneto,
 * and store the Response object in the getStatus queue for sending response later when cetralserver will respond									  
 * @param {Request} req- contains information of the request from frontend
 * @param {Response} res- used for send response to frontend
 * @see {@link http://expressjs.com/ko/4x/api.html#req}
 */
router.get('/status', (req, res)=>{
	
	let userId = req.baseUrl.split('/')[2];
	sendMsgToCentralServer(res, {
		command: 'getStatus', 
		source: 'WEB', 
		dest: 'CONNETO', 
		userId
	});
	if(!httpResponses.status[userId]){
		httpResponses.status[userId] = [];
	}
	httpResponses.getStatus[userId].push(res);
})

/**
 * @callback
 * @description router related to hosts of the Conneto: 
 * METHOD GET: getting list of hosts connected to the Conneto 
 * 		  POST: adding a new host to the Conneto
 * it sends request to the central server and store the Response object in the corresponding queue for sending response later when cetralserver will respond
 * @param {Request} req- contains information of the request from frontend
 * @param {Response} res- used for send response to frontend
 */
router.route('/hosts')
	.get((req, res) => {
		let userId = req.baseUrl.split('/')[2];
		sendMsgToCentralServer(res, {
			command: 'getHosts',
			source: 'WEB',
			dest: 'CONNETO',
			userId
		});
		if (!httpResponses.getHosts[userId]) {
			httpResponses.getHosts[userId] = [];
		}
		httpResponses.getHosts[userId].push(res);
	})
	.post((req, res) => {
		let userId = req.baseUrl.split('/')[2];
		sendMsgToCentralServer({
			command: 'addHost',
			source: 'WEB',
			dest: 'CONNETO',
			userId,
			hostIpaddress: req.body.hostIpaddress,
			pairingNum: req.body.pairingNum
		});
		if (!httpResponses.addHost[userId]) {
			httpResponses.addHost[userId] = [];
		}
		httpResponses.addHost[userId].push(res);
	})

/**
 * @callback
 * @description router related to apps(games) of the host connected to the Conneto 
 * METHOD GET: getting list of apps executable in the 
 * 		  POST: starting the app of particular connected host and begin remote control  
 * 		  for the request to be accepted, login needed, selected host should be paired to the conneto, and the app should be executable in that host
 * it sends request to the central server and store the Response object in the corresponding queue for sending response later when cetralserver will respond
 * @param {Request} req- contains information of the request from frontend
 * @param {Response} res- used for send response to frontend
 */
router.route('/apps')
	.get((req, res) => {
		let userId = req.baseUrl.split('/')[2];
		let hostId = getDatainAuthHeader(req).hostId;
		sendMsgToCentralServer({
			command: 'getApps',
			source: 'WEB',
			dest: 'CONNETO',
			userId: userId,
			hostId: req.body.hostId
		});
		if (!httpResponses.getApps[userId]) {
			httpResponses.getApps[userId] = [];
		}
		httpResponses.getApps[userId].push(res);
	})
	.post((req, res)=> {
		let userId = req.baseUrl.split('/')[2];
		sendMsgToCentralServer({
			command: "startGame",
			source: 'WEB',
			dest: 'CONNETO',
			userId,
			appId: req.body.appId,
			hostId: req.body.hostId,
			option: req.body.option
		});
		if (!httpResponses.startGame[userId]) {
			httpResponses.startGame[userId] = [];
		}
		httpResponses.startGame[userId].push(res);
	})

/** 
 * @description this function used to send message to the central server
 * @param {Object} msg- object you want to send to the central server.
 * it is converted to the JSON string before sending, so methods in object are lost
 * circlular object will throw an error in convertion
 * @see {@link https://www.google.co.kr/search?q=typeerror:+converting+circular+structure+to+json&ei=-j-eWsilKYSh8QX6mLKIBA&start=0&sa=N&biw=1519&bih=735}
 * @return {Promise} 
 * @promise it resolves after the msg is finally written out, no args
 * @throws {Error} error while writing to socket for Central server  
 */
function sendMsgToCentralServer(msg){
	return new Promise((resolve, reject)=>{
		socketForCentralServer.write(JSON.stringify(msg), resolve)
	})
}

/**
 * @description used for handling data from central server
 * when received data, it sends data using resonse objects in the corresponding queue 
 * @param {JSON} data- data from central server 
 */
function commandHandler(data){ //handler for data from central server
	console.log(typeof(data));
	data = JSON.parse(data);
	console.log("IN CommandHandler: " + JSON.stringify(data));
	console.log("Receiver msg: " + data.command);
	switch(data.command){

		case "checkStatus":
			processsResponseQueue(httpResponses.status[data.userId], data);
			break;
		case "getHostsResult":
			processsResponseQueue(httpResponses.getHosts[data.userId], data);
			break;
		case "addHostResult":
			processsResponseQueue(httpResponses.addHost[data.userId], data);
			break;
		case "getAppsResult":
			processsResponseQueue(httpResponses.getApps[data.userId], data);
			break;
		case "startGameResult":
			processsResponseQueue(httpResponses.startGame[data.userId], data);
			break;
		case "networkTest":
			axios.post('/api/speedtest').then((res)=>{
				socketForCentralServer.write(JSON.stringify({command: "networkTest",source: "WEB", dest:"CONNETO", data: res.data.data}));
			});
			break;

		default:
			console.log("Unvalid Command: " + data.command);
	}
}

/**
 * @description this function sends data to every Response objects in the responseQueue
 * After sending, emptying the queue
 * @param {Response[]} responseQueue- array that contains Response objects you want to send responses  
 * @param {Object} data- data you want to send
 * @return {Promise} it guarantees sending all responses in the queue & emptying the processed responses from queue
 * @promise
 * @resolve {Object[]}- responseQueue after processing
 */
function processsResponseQueue(responseQueue, data){
	return sendResponseAsync(responseQueue, data)
	.then((arr)=>{
		//emptying the queue
		return responseQueue.splice(0, arr.length)
	});

	/**
	 * @description it sends responses parallelly; it means there's no clear sequece among them 
	 * @param {Response[]} responseQueue- array that contains Response objects you want to send responses
	 * @param {Object} data- data you want to send
	 * @return {Promise} it guarantees sending all responses in the queue before resolved
	 * @promise 
	 * @resolve no meaning 
	 */
	function sendResponseAsync(responseQueue, data){
		return Promise.all(responseQueue.map((res)=>{
			return new Promise((resolve)=>{
				resolve(res.json(data));	
			})
		}))
	}
}

/**
 * @description this function converts ArryBuffer object to string
 * @param {ArrayBuffer} buffer- ArrayBuffer object you want to convert
 * @return {string} converted string  
 */
function arrayBufferToString(buffer){
    var arr = new Uint8Array(buffer);
    var str = String.fromCharCode.apply(String, arr);
    if(/[\u0080-\uffff]/.test(str)){
        throw new Error("this string seems to contain (still encoded) multibytes");
    }
    return str;
}

export default router;