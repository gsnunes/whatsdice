$.fn.serializeObject = function () {
	var o = {},
		a = this.serializeArray();

	$.each(a, function () {
		if (o[this.name] !== undefined) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}

			o[this.name].push(this.value || '');
		}
		else {
			o[this.name] = this.value || '';
		}
	});

	return o;
};



$(function () {

	var AppView = Backbone.View.extend({

		events: {
			'blur input[name="name"]': 'updateCookieName',
			'click .language li a': 'setLocation',
			'submit form': 'submit'
		},


		initialize: function () {
			this.bindSocket();
			this.populate();
			this.setRoom();
		},


		setRoom: function () {
			var roomName = location.pathname.split('/')[1];

			if (roomName) {
				this.join(roomName);
			}
			else {
				io.socket.get('/main/getMyRoom/', {locale: $.cookie('whatsdice_locale')}, _.bind(function (ev) {
					this.populateRoom(ev);
					this.populateUsers([$.cookie('whatsdice_name')]);
				}, this));
			}
		},


		join: function (roomName) {
			io.socket.get('/main/join/', {roomName: roomName, locale: $.cookie('whatsdice_locale'), name: $.cookie('whatsdice_name')}, _.bind(function (data, jwr) {
				if (jwr && jwr.error) {
					alert(data.message);
					location.href = '//' + location.host;
				}
				else {
					console.log(data);
					$('.share-url').html('<a href="' + location.href + '">' + location.href + '</a>');
					this.populateResults(data.message);
				}
			}, this));
		},


		populateUsers: function (users) {
			$('.users').html(users.join(', '));
			$('.users').removeClass('hide');
		},


		populateRoom: function (ev) {
			var href = location.protocol + '//' + location.host + '/' + ev.roomName;

			this.populateResults(ev.message);
			$('.share-url').html('<a href="' + href + '">' + href + '</a>');
			window.history.pushState(document.body.innerHTML, document.title, href);
		},


		populateResults: function (data) {
			$('.results').prepend(data);
			$('.results').removeClass('hide');
		},


		bindSocket: function () {
			io.socket.on('results', _.bind(function (data) {
				if (data.message) {
					this.populateResults('<div class="result">' + data.message + '</div>');

					if (data.users) {
						this.populateUsers(data.users);
					}
				}
			}, this));

			io.socket.on('list', function (data) {
				console.log(data);
			});
		},


		populate: function () {
			var random = ((new Date()).getTime()).toString(),
				locale = $.cookie('whatsdice_locale');

			if ($.cookie('whatsdice_name')) {
				this.$('input[name="name"]').val($.cookie('whatsdice_name'));
			}
			else {
				$.cookie('whatsdice_name', 'guest' + random.substr(random.length - 5));
			}

			if (locale) {
				this.$('.language li').each(function () {
					if ($(this).find('a').text().toLowerCase() === locale) {
						$(this).addClass('active');
					}
					else {
						$(this).removeClass('active');
					}
				});
			}
		},


		updateCookieName: function (ev) {
			$.cookie('whatsdice_name', $(ev.target).val(), {expires: 999});
		},


		setLocation: function (ev) {
			$.ajax({url: "/main/setLocation", data: {location: $(ev.target).text()}}).done(function () {
				location.reload();
			});
		},


		submit: function (ev) {
			ev.preventDefault();

			var data = $(ev.target).serializeObject(),
				i = 0, len = data.number || 1,
				modifier = parseInt(data.modifier, 10) || 0,
				aResult = [],
				result = 0,
				total = 0;

			if (isNaN(data.number)) {
				$(ev.target).parent().find('input[name="number"]').val('');
				len = 1;
			}

			if (isNaN(data.modifier)) {
				$(ev.target).parent().find('input[name="modifier"]').val('');
				modifier = 0;
			}

			while (i < len) {
				result = Math.floor((Math.random() * data.die) + 1);
				total = total + result;
				aResult.push(result);

				i++;
			}

			if (data.operator === 'P') {
				total = total + modifier;
			}
			else {
				total = total - modifier;
			}

			io.socket.get('/main/roll/', {result: '<p>' + $.cookie('whatsdice_name') + ': Roll ' + len + 'd' + data.die + (data.operator === 'P' ? ' + ' : ' - ') + modifier + ' = <b>' + total + '</b></p>' + '<p class="dice-result">' + aResult.join(' + ') + '</p>'});
		}

	});

	$(document).foundation();

	new AppView({el: $('body')}); //jshint ignore:line

});