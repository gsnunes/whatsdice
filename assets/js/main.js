$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

$(document).ready(function () {
	var locale = $.cookie('whatsdice_locale'),
		name = $.cookie('whatsdice_name');



	$(document).foundation();



	$('input[name="name"]').on('blur', function () {
		$.cookie('whatsdice_name', $(this).val(), {expires: 999});
	});

	if (name) {
		$('input[name="name"]').val(name);
	}
	


	if (locale) {
		$('.language li').each(function () {
			if ($(this).find('a').text().toLowerCase() === locale) {
				$(this).addClass('active');
			}
			else {
				$(this).removeClass('active');
			}
		});
	}

	$('.language li a').on('click', function () {
		$.ajax({url: "/main/setLocation", data: {location: $(this).text()}}).done(function (msg) {
			location.reload();
		});
	});



	$('form').on('submit', function (ev) {
		var data = $(this).serializeObject(),
			i = 0, len = data.number || 1,
			modifier = parseInt(data.modifier) || 0,
			guestName = 'guest' + random.substr(random.length - 5),
			aResult = [],
			result = 0,
			total = 0;

		if (isNaN(data.number)) {
			$(this).parent().find('input[name="number"]').val('');
			len = 1;
		}

		if (isNaN(data.modifier)) {
			$(this).parent().find('input[name="modifier"]').val('');
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

		io.socket.get('/main/roll/', {result: '<div class="result"><p>' + ($('input[name="name"]').val() || guestName) + ': Roll ' + len + 'd' + data.die + (data.operator === 'P' ? ' + ' : ' - ') + modifier + ' = <b>' + total + '</b></p>' + '<p class="dice-result">' + aResult.join(' + ') + '</p></div>'});

		ev.preventDefault();
	});


	
	var roomName = location.pathname.split('/')[1],
		random = ((new Date()).getTime()).toString();

	if (roomName) {
		io.socket.get('/main/join/', {roomName: roomName}, function (ev) {
			console.log(ev.message);
		});
	}
	else {
		io.socket.get('/main/getMyRoom/', function (ev) {
			roomName = ev.id;
			var href = location.origin + '/' + ev.id;
			//$('.share-url').html('<a href="' + href + '">' + href + '</a>');
		});
	}

	io.socket.on('main', function (data) {
		$('.results').prepend(data);
	});

});