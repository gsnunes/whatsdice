/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var cookieParse = require("sails/node_modules/cookie");

module.exports.bootstrap = function (cb) {
	sails.io.on('connection', function (socket) {
		var currentRoom = {},
			cookies = cookieParse.parse(socket.handshake.headers.cookie);

		socket.userName = cookies.whatsdice_name;

		socket.on('updateCurrentRoom', function (data) {
			currentRoom = data;
		});

		socket.on('updateName', function (data) {
			var oldName = socket.userName;

			socket.userName = data.name;
			currentRoom.name = data.name;
			sails.controllers.main.updateUsers(data.roomName, data.locale, data.name, oldName);
		});

		socket.on('disconnect', function () {
			sails.controllers.main.leave(currentRoom.roomName, currentRoom.locale, currentRoom.name);
		});
	});

	// It's very important to trigger this callback method when you are finished
	// with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
	cb();
};
