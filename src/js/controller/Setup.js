define([
    'controller/setup-steps',
    'plugins/plugins',
    'playlist/loader',
    'playlist/playlist',
    'utils/scriptloader',
    'utils/helpers',
    'utils/backbone.events',
    'utils/constants',
    'utils/underscore',
    'events/events'
], function(SetupSteps, plugins, PlaylistLoader, Playlist, ScriptLoader, utils, Events, Constants, _, events) {


    var Setup = function(_api, _model, _view, _errorTimeoutSeconds) {
        var _this = this,
            _setupFailureTimeout;

        var _queue = SetupSteps.getQueue();

        _errorTimeoutSeconds = _errorTimeoutSeconds || 10;


        this.start = function () {
            _setupFailureTimeout = setTimeout(_setupTimeoutHandler, _errorTimeoutSeconds * 1000);
            _nextTask();
        };

        this.destroy = function() {
            this.off();
            clearTimeout(_setupFailureTimeout);
            _queue = 0;
            _api = null;
            _model = null;
            _view = null;
        };

        function _setupTimeoutHandler() {
            _error('Setup Timeout Error', 'Setup took longer than ' + _errorTimeoutSeconds + ' seconds to complete.');
        }

        function _nextTask() {
            _.each(_queue, function(c) {
                // If task completed, or destroy was called
                if (c.complete === true || c.running === true || _api === null) {
                    return;
                }

                if (_allComplete(c.depends)) {
                    c.running = true;
                    callTask(c);
                }
            });
        }

        function callTask(task) {
            var resolve = function(resolveState) {
                resolveState = resolveState || {};
                _taskComplete(task, resolveState);
            };
            task.method(resolve, _model, _api, _view);
        }

        function _allComplete(dependencies) {
            // return true if empty array,
            //  or if each object has an attribute 'complete' which is true
            return _.all(dependencies, function(name) {
                return _queue[name].complete;
            });
        }

        function _taskComplete(task, resolveState) {
            if (resolveState.type === 'error') {
                _error(resolveState.msg, resolveState.reason);
            } else if (resolveState.type === 'complete') {
                _this.trigger(events.JWPLAYER_READY);
                clearTimeout(_setupFailureTimeout);
            } else {
                task.complete = true;
                _nextTask();
            }
        }

        function _error(message, reason) {
            _this.trigger(events.JWPLAYER_SETUP_ERROR, {
                message: message + ': ' + reason
            });
            clearTimeout(_setupFailureTimeout);
            _this.destroy();
        }
    };

    Setup.prototype = Events;

    return Setup;
});
