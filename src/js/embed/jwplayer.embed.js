/**
 * Embedder for the JW Player
 * @author Zach
 * @modified Pablo
 * @version 6.0
 */
(function(jwplayer) {
	var _utils = jwplayer.utils,
		_events = jwplayer.events;
	
	var embed = jwplayer.embed = function(playerApi) {
//		var mediaConfig = _utils.mediaparser.parseMedia(playerApi.container);
		var _config = new embed.config(playerApi.config);
			_config.id = playerApi.id; 
				
		var _pluginloader = jwplayer.plugins.loadPlugins(playerApi.id, _config.plugins);
		
		function _setupEvents(api, events) {
			for (var evt in events) {
				if (typeof api[evt] == "function") {
					(api[evt]).call(api, events[evt]);
				}
			}
		}
		
		function _embedPlayer() {
			var container = document.getElementById(playerApi.id);
			
			if (_pluginloader.getStatus() == _utils.loaderstatus.COMPLETE) {
				for (var mode = 0; mode < _config.modes.length; mode++) {
					if (_config.modes[mode].type && embed[_config.modes[mode].type]) {
						var modeconfig = _config.modes[mode].config;
						var configClone = _config;
						if (modeconfig) {
							configClone = _utils.extend(_utils.clone(_config), modeconfig);

							/** Remove fields from top-level config which are overridden in mode config **/ 
							var overrides = ["file", "levels", "playlist"];
							for (var i=0; i < overrides.length; i++) {
								var field = overrides[i];
								if (_utils.exists(modeconfig[field])) {
									for (var j=0; j < overrides.length; j++) {
										if (j != i) {
											var other = overrides[j];
											if (_utils.exists(configClone[other]) && !_utils.exists(modeconfig[other])) {
												delete configClone[other];
											}
										}
									}
								}
							}
						}
						var embedder = new embed[_config.modes[mode].type](container, _config.modes[mode], configClone, _pluginloader, playerApi);
						if (embedder.supportsConfig()) {
							embedder.embed();
							
							_setupEvents(playerApi, _config.events);
							
							return playerApi;
						}
					}
				}
				
				if (_config.fallback) {
					_utils.log("No suitable players found and fallback enabled");
					new embed.download(container, _config);
				} else {
					_utils.log("No suitable players found and fallback disabled");
				}
				
//				new embed.logo(_utils.extend({
//					hide: true
//				}, _config.components.logo), "none", playerApi.id);
			}
		};
		
		_pluginloader.addEventListener(_events.COMPLETE, _embedPlayer);
		_pluginloader.addEventListener(_events.ERROR, _embedPlayer);
		_pluginloader.load();
		
		return playerApi;
	};
	
})(jwplayer);