/**
* MainController
*
* @description :: Server-side logic for managing results
* @help        :: See http://links.sailsjs.org/docs/controllers
*/

var cookieParse = require("sails/node_modules/cookie");

module.exports = {

	index: function (req, res) {
		if (!req.session.rooms) {
			req.session.rooms = [];
		}

		var random = ((new Date()).getTime()).toString();
		if (!req.cookies.whatsdice_name) {
			res.cookie('whatsdice_name', ('guest' + random.substr(random.length - 5)), {maxAge: 900000});
		}

		if (req.cookies.whatsdice_locale) {
			req.setLocale(req.cookies.whatsdice_locale);
		}
		else {
			res.cookie('whatsdice_locale', req.getLocale(), {maxAge: 900000});
		}

		res.view('homepage');
	},


	setLocation: function (req, res) {
		res.cookie('whatsdice_locale', req.param('location').toLowerCase(), {maxAge: 900000});
		res.send(200);
	},


	getMyRoom: function (req, res) {
		var roomName = sails.sockets.id(req);

		if (req.session.rooms.indexOf(roomName) === -1) {
			req.session.rooms.push(roomName);
		}

		res.json({roomName: roomName, message: sails.__({phrase: 'mainController.myRoom', locale: req.param('locale')}, {roomName: roomName})});
	},


	getUsers: function (roomName) {
		var subscribers = sails.sockets.subscribers(roomName),
			i, len = subscribers.length,
			users = [];

		for (i = 0; i < len; i++) {
			users.push(sails.controllers.main.getUserName(subscribers[i]));
		}

		return users;
	},


	getUserName: function (userId) {
		var socket = sails.io.sockets.connected[userId],
			cookies = cookieParse.parse(socket.handshake.headers.cookie);

		return cookies.whatsdice_name;
	},


	leave: function (roomName, locale, name) {
		sails.sockets.broadcast(roomName, 'results', {message: sails.__({phrase: 'mainController.leaveRoom', locale: locale}, {name: name}), users: sails.controllers.main.getUsers(roomName)});
	},


	join: function (req, res) {
		var roomName = req.param('roomName'),
			roomNames = sails.sockets.rooms();

		if (roomNames.indexOf(roomName) !== -1 || req.session.rooms.indexOf(roomName) !== -1) {
			if (req.session.rooms.indexOf(roomName) === -1) {
				req.session.rooms.push(roomName);
			}

			sails.sockets.join(req.socket, roomName);
			sails.sockets.leave(req.socket, sails.sockets.id(req));

			sails.sockets.broadcast(roomName, 'results', {message: sails.__({phrase: 'mainController.joinRoom', locale: req.param('locale')}, {name: req.param('name')}), users: sails.controllers.main.getUsers(roomName)});
			res.send(200);
		}
		else {
			res.json(400, {message: sails.__({phrase: 'mainController.roomNotExist', locale: req.param('locale')}, {roomName: roomName})});
		}
	},


	roll: function (req) {
		var result = req.param('result'),
			myRooms = sails.sockets.socketRooms(req.socket);

		if (result) {
			sails.sockets.broadcast(myRooms[myRooms.length - 1], 'results', {message: req.param('result')});
		}
	}

};