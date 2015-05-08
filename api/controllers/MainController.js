/**
 * ResultController
 *
 * @description :: Server-side logic for managing results
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  index: function (req, res) {
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
    var id = sails.sockets.id(req);
    res.json({id: id});
  },


  join: function (req, res) {
    var roomName = req.param('roomName'),
        roomNames = sails.sockets.rooms();

    if (roomNames.indexOf(roomName) !== -1) {
      sails.sockets.join(req.socket, roomName);
      res.json({message: 'Subscribed to a fun room called ' + roomName + '!'});
    }
    else {
      res.json({message: 'Room called ' + roomName + ' not exist!'});
    }
  },


  roll: function (req, res) {
    var result = req.param('result');

    if (result) {
      sails.sockets.broadcast(sails.sockets.id(req), 'main', req.param('result'));
    }
    else {
      res.json({message: 'You dont send any result'});
    }
  }

};