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
			'click .language li:not(.title, .parent-link) a': 'setLocation',
			'click .manage-dices li:not(.title, .parent-link) a': 'manageDices',
			'submit form[name="defaultForm"]': 'submit',
			'submit form[name="fudgeForm"]': 'submitFudge',
			'keyup': 'processKey',
			'click .toggle-panel': 'togglePanel'
		},


		initialize: function () {
			this.setShareUrlInput();
			this.bindSocket();
			this.populate();
			this.setRoom();
			this.setCss();
		},


		setShareUrlInput: function () {
			if (Modernizr.touch) {
				$('.share-url input.mobile-input').show();
			}
			else {
				$('.share-url input.desktop-input').show();
			}
		},


		processKey: function (ev) {
			if (ev.which === 13) {
				this.updateCookieName();
			}
		},


		setCss: function () {
			$('.results').css('max-height', $('.dices').outerHeight());
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
					io.socket._raw.emit('updateCurrentRoom', {name: $.cookie('whatsdice_name'), roomName: ev.roomName, locale: $.cookie('whatsdice_locale')});
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
					$('.share-url input').val(location.href);
					io.socket._raw.emit('updateCurrentRoom', {name: $.cookie('whatsdice_name'), roomName: roomName, locale: $.cookie('whatsdice_locale')});
				}
			}, this));
		},


		populateUsers: function (users) {
			$('.users').html(users.join(', '));
			$('.users').removeClass('hide');
		},


		populateRoom: function (ev) {
			var href = location.protocol + '//' + location.host + '/' + ev.roomName;

			this.populateResults('<div class="result">' + ev.message + '</div>');
			$('.share-url input').val(href);
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
		},


		populate: function () {
			var locale = $.cookie('whatsdice_locale'),
				dice = $.cookie('whatsdice_dice');

			this.$('input[name="name"]').val($.cookie('whatsdice_name'));

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


			if (dice) {
				dice = JSON.parse(dice);
			}

			if (dice) {
				_.each(dice, function (value, prop) {
					if (!value) {
						$(prop).hide();
					}

					if ($('.dices').find('tr:visible').length <= 1) {
						$('.dices tr.no-data').removeClass('hide');
					}
					
					$('.manage-dices li:not(.title, .parent-link) a[data-dice="' + prop + '"]').find('input').prop('checked', value);
				});
			}
		},


		updateCookieName: function () {
			var name = $('input[name="name"]').val();

			if (name !== $.cookie('whatsdice_name')) {
				$.cookie('whatsdice_name', name, {expires: 999});
				io.socket._raw.emit('updateName', {name: name, roomName: location.pathname.split('/')[1], locale: $.cookie('whatsdice_locale')});
			}
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
				total = 0,
				die = data.die || 1;

			if (isNaN(data.number)) {
				$(ev.target).parent().find('input[name="number"]').val('');
				len = 1;
			}

			if (isNaN(data.modifier)) {
				$(ev.target).parent().find('input[name="modifier"]').val('');
				modifier = 0;
			}

			if (isNaN(data.die)) {
				$(ev.target).parent().find('input[name="die"]').val('');
				die = 1;
			}

			while (i < len) {
				result = Math.floor((Math.random() * die) + 1);
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

			io.socket.get('/main/roll/', {result: '<p>' + $.cookie('whatsdice_name') + ': Roll ' + len + 'd' + die + (data.operator === 'P' ? ' + ' : ' - ') + modifier + ' = <b>' + total + '</b></p>' + '<p class="dice-result">' + aResult.join('&nbsp;&nbsp;') + '</p>'});
		},


		submitFudge: function (ev) {
			ev.preventDefault();

			var data = $(ev.target).serializeObject(),
				i = 0, len = data.number || 4,
				modifier = parseInt(data.modifier, 10) || 0,
				fudgeValues = [+0, -1, +1, -1, +1, 0],
				fudge = ['0', '-', '+', '-', '+', '0'],
				aResult = [],
				result = 0,
				total = 0;

			if (isNaN(data.number)) {
				$(ev.target).parent().find('input[name="number"]').val('');
				len = 4;
			}

			if (isNaN(data.modifier)) {
				$(ev.target).parent().find('input[name="modifier"]').val('');
				modifier = 0;
			}

			while (i < len) {
				result = Math.floor(Math.random() * 6);
				total = total + fudgeValues[result];
				aResult.push(fudge[result]);

				i++;
			}

			if (data.operator === 'P') {
				total = total + modifier;
			}
			else {
				total = total - modifier;
			}

			io.socket.get('/main/roll/', {result: '<p>' + $.cookie('whatsdice_name') + ': Roll ' + len + 'd fudge' + (data.operator === 'P' ? ' + ' : ' - ') + modifier + ' = <b>' + total + '</b></p>' + '<p class="dice-result">' + aResult.join('&nbsp;&nbsp;') + '</p>'});
		},


		togglePanel: function () {
			if ($('.panel-content').hasClass('hide')) {
				$('.panel-content').removeClass('hide');
				$('.panel-content').parent().removeClass('remove-padding');
			}
			else {
				$('.panel-content').addClass('hide');
				$('.panel-content').parent().addClass('remove-padding');
			}
		},


		manageDices: function (ev) {
			var input = $(ev.target).find('input'),
				id = $(ev.target).data('dice'),
				diceData = {};

			if (input && input.length) {
				if (input.is(':checked')) {
					$(id).hide();
					input.prop('checked', false);
				}
				else {
					$(id).show();
					input.prop('checked', true);
				}
			}

			if ($('.dices').find('tr:visible').length > 1) {
				$('.dices tr.no-data').addClass('hide');
			}
			else {
				$('.dices tr.no-data').removeClass('hide');
			}


			$('.manage-dices').find('li:not(.title, .parent-link) a').map(function () {
				diceData[$(this).data('dice')] = $(this).find('input').prop('checked');
			});
			
			$.cookie('whatsdice_dice', JSON.stringify(diceData));
		}

	});

	$(document).foundation();

	new AppView({el: $('body')}); //jshint ignore:line

});