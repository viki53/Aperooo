var app = {
	isPhoneGapApp: !!window.cordova,
	defaultContents: {
		contacts: [
			{
				id: "1",
				name: { 
					formatted: "Corentin Hatte"
				},
				phoneNumbers: [
					{
						type: "mobile",
						value: "+33760061281"
					},
				]
			},
			{
				id: "2",
				displayName: "<Foo Bar>",
				photos: [
					{
						type: "url",
						value: "https://s3.amazonaws.com/uifaces/faces/twitter/sillyleo/128.jpg"
					},
					{
						type: "url",
						pref: true,
						value: "https://s3.amazonaws.com/uifaces/faces/twitter/walterstephanie/128.jpg"
					}
				]
			},
			{
				id: "4",
				nickname: "Toto"
			},
			{
				id: "7",
				name: {
					formatted: "Rita Mitsuko"
				},
				photos: [
					{
						type: "url",
						value: "https://s3.amazonaws.com/uifaces/faces/twitter/polovecn/128.jpg"
					}
				]
			}
		],
	},
	initialize: function () {
		this.bindEvents();
	},
	bindEvents: function () {
		if (app.isPhoneGapApp) {
			document.addEventListener("deviceready", this.onDeviceReady, false);
		}
		else {
			document.addEventListener("DOMContentLoaded", this.onDOMContentReady, false);
		}

		document.getElementById("contacts-list-validate").addEventListener("click", app.onContactsListValidate, false);
	},
	onDeviceReady: function () {
		app.receivedEvent("deviceready");

		var options = new ContactFindOptions();
		options.filter = "";
		options.multiple = true;

		navigator.contacts.find([navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.nickname, navigator.contacts.fieldType.name], app.onContactsFindSuccess, app.onContactsFindError, options);
	},
	onDOMContentReady: function () {
		app.receivedEvent("DOMContentLoaded");

		app.onContactsFindSuccess(app.defaultContents.contacts);
	},
	receivedEvent: function (id) {
		console.log('Received Event: ' + id);
	},
	onContactsFindSuccess: function (contacts) {
		app.local_contacts = {};

		var contacts_list = document.getElementById("contacts-list");
		contacts_list.innerHTML = "";

		var contacts_str = [];

		contacts.forEach(function (contact) {
			if (!contact.phoneNumbers || !contact.phoneNumbers.forEach) {
				return;
			}
			if (!contact.displayName && !contact.nickname && (!contact.name || !contact.name.formatted)) {
				return;
			}

			var pref_number = app.getPreferredOrFirst(contact.phoneNumbers, function (phone_number) {
				return phone_number.type.toLowerCase() === "mobile";
			});
			if (!pref_number) {
				return;
			}

			contacts_str.push("<li>\
				<a href=\"#contact-" + contact.id + "\" class=\"contact\">");
			if (contact.photos) {
				var avatar = app.getPreferredOrFirst(contact.photos);

				switch (avatar.type) {
					case "url":
						contacts_str.push("<img src=\"" + avatar.value + "\" alt=\"\" class=\"avatar\" />");
					break;
					case "data":
						contacts_str.push("<img src=\"data:image/jpeg;base64," + avatar.value + "\" alt=\"\" class=\"avatar\" />");
					break;
				}
			}
			contacts_str.push("<h2>" + (contact.displayName || contact.nickname || contact.name.formatted).htmlEntities() + "</h2>");

			contacts_str.push("<p>" + app.cleanPhoneNumber(pref_number.value).htmlEntities() + "</p>");

			contacts_str.push("</a>\
				<label class=\"check\">\
					<input type=\"checkbox\" name=\"contact[]\" id=\"contact-" + contact.id + "-checkbox\" value=\"" + contact.id + "\" />\
				</label>\
			</li>");

			app.local_contacts[contact.id] = contact;
		});

		contacts_list.innerHTML = contacts_str.join("");

		// console.dir(contacts);

		var contacts_avatars = contacts_list.querySelectorAll(".avatar");
		Array.prototype.forEach.call(contacts_avatars, function (img) {
			img.onerror = function () {
				img.parentNode.removeChild(img);
			}
		});
	},
	onContactsFindError: function (error) {
		console.error(error);
	},
	onContactsListValidate: function () {
		var checked_contacts = document.getElementById("contacts-list").querySelectorAll(".check>input[type='checkbox']:checked");

		if (!checked_contacts) {
			return false;
		}

		var selected_contacts = [];

		var selected_contacts_ul = document.getElementById("selected-contacts");;

		Array.prototype.forEach.call(checked_contacts, function (checkbox) {
			var id = checkbox.value;
			var contact = app.local_contacts[id];
			if (!contact) {
				return;
			}

			selected_contacts.push(contact);

			var li = document.createElement("li");
			li.innerHTML = "<h2>" + (contact.displayName || contact.nickname || contact.name.formatted).htmlEntities() + "</h2>\
				<p>" + app.cleanPhoneNumber(app.getPreferredOrFirst(contact.phoneNumbers).value).htmlEntities() + "</p>";

			selected_contacts_ul.appendChild(li);
		});
		console.dir(selected_contacts);

		document.getElementById("message-interface").classList.remove("off-screen");

		if (navigator.geolocation) {
			app.startLocation();
			document.getElementById("get-location").addEventListener("click", app.startLocation, false);
		} else {
			document.getElementById("location-map-preview").parentNode.classList.add("hidden");
		}

		document.getElementById("message-validate").onclick = app.sendSMStoContacts.bind(null, selected_contacts);
	},
	startLocation: function () {
		navigator.geolocation.getCurrentPosition(
			app.onLocationSuccess, 
			app.onLocationError, 
			{
				enableHighAccuracy: false,
				timeout: 10000,
				maximumAge: 5000
			}
		);
	},
	onLocationSuccess: function (position) {
		var map = document.getElementById("location-map-preview");

		map.classList.remove("hidden");

		console.dir(position);

		map.style.backgroundImage = "url(https://maps.googleapis.com/maps/api/staticmap?center=" + position.coords.latitude + "," + position.coords.longitude + "&zoom=13&size=" + map.offsetWidth + "x" + map.offsetHeight + "&maptype=roadmap&markers=color:green%7Clabel:A%7C" + position.coords.latitude + "," + position.coords.longitude + ")";

		map.dataset.latitude = position.coords.latitude;
		map.dataset.longitude = position.coords.longitude;
	},
	onLocationError: function (selected_contacts, error) {
		document.getElementById("location-map-preview").classList.add("hidden");
		console.error("Geolocation fail", error);
	},
	sendSMStoContacts: function (selected_contacts) {
		console.dir(selected_contacts);

		var location_map = document.getElementById("location-map-preview");
		if (!location_map.classList.contains("hidden") && !location_map.parentNode.classList.contains("hidden")) {
			var location = location_map.dataset;
		}
		var message = document.getElementById("message-zone").value;
		console.log(message, location);

		if (!SMS) {
			alert("SMS plugin not ready");
			return;
		}

		var selected_numbers = [];

		selected_contacts.forEach(function (contact) {
			if (!contact.phoneNumbers || !contact.phoneNumbers.forEach) {
				return;
			}
			var pref_number = app.getPreferredOrFirst(contact.phoneNumbers, function (phone_number) {
				return phone_number.type.toLowerCase() === "mobile";
			});
			if (pref_number) {
				selected_numbers.push(app.cleanPhoneNumber(pref_number.value));
			};

		});

		console.dir(selected_numbers);

		SMS.sendSMS(selected_numbers, (message || "Aperooo !") + (location ? " https://maps.google.fr/?daddr=" + location.latitude + "," + location.longitude + "&saddr=Ma+Position&zoom=15" : ""), function () {
			console.info("SMS success");
			alert("SMS sent!");
			document.getElementById("message-interface").classList.add("off-screen");
		}, function (error) {
			console.error(error);
		});
	},
	getPreferredOrFirst: function(list, customFilter) {
		if (!list || !list.length) {
			return;
		}
		if (customFilter) {
			list = list.filter(customFilter);
			if (!list || !list.length) {
				return;
			}
		}

		for (var i=0, nb=list.length; i<nb; i++) {
			if(list[i].pref) {
				return list[i];
			}
		}

		return list[0];
	},
	cleanPhoneNumber: function (number) {
		return number.trim().split(" ").map(function (part) {
			return part.trim();
		}).join("").replace(/\./g, "").replace(/\(([\d]+)\)/g, "$1");
	}
};

if (document.body.id === "index") {
	app.initialize();
}
