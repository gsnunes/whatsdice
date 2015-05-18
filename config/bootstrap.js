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
		var rooms = _.keys(socket.adapter.rooms);

		socket.on('disconnect', function () {
			var cookies = cookieParse.parse(socket.handshake.headers.cookie);
			
			_.forEach(rooms, function (roomName) {
				sails.controllers.main.leave(roomName, cookies.whatsdice_locale, cookies.whatsdice_name);
			});
		});

		/*
		var rooms = _.keys(socket.adapter.rooms);

		socket.on('disconnect', function () {
			var cookies = cookieParse.parse(socket.handshake.headers.cookie),
				newRooms = _.keys(socket.adapter.rooms),
				leavedRoom = '';

			if (newRooms.length) {
				_.forEach(rooms, function (roomName) {
					if (_.indexOf(newRooms, roomName) === -1) {
						leavedRoom = roomName;
					}
				});
			}
			else {
				leavedRoom = rooms[0];
			}

			sails.controllers.main.leave(leavedRoom, cookies.whatsdice_locale, cookies.whatsdice_name);
		});
		*/
	});

	// It's very important to trigger this callback method when you are finished
	// with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
	cb();
};
