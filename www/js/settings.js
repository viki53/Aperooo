app.settings = {
	elems: {
		default_message: document.getElementById("setting-default-message"),
		theme: document.getElementById("settings-theme")
	},
	themes: [
		{
			slug: "beer",
			name: "Apéro"
		},
		{
			slug: "mountain",
			name: "Raclette"
		}
	],
	initialize: function () {
		app.settings.elems.default_message.addEventListener("input", function () {
			localStorage.setItem("default_message", this.value);
			console.info("message updated", this.value);
		}, false);

		app.settings.elems.theme.addEventListener("change", function () {
			localStorage.setItem("theme", this.value);
			console.info("theme updated", this.value);
		}, false);

		app.settings.themes.forEach(function (theme) {
			var opt = document.createElement("option");
			opt.textContent = theme.name;
			opt.value = theme.slug;

			app.settings.elems.theme.appendChild(opt);
		});
	}
}

app.settings.initialize();