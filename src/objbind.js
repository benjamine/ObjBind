/***
 * Copyright (c) 2011 Benjamín Eidelman benjamin.eidelman_at_gmail.com
 *
 *  ObjBind 0.0.1
 *  =================
 *
 * Change Tracking, Events and Traversing for plain JavaScript objects and arrays
 *
 */
(function(global){
    
    var $o = function(){
        var a = new $o.OQArray();
        a._array = Array.prototype.slice.apply(arguments);
        return a;
    };
    
    $o.a = function(){
        var objects;
        if (arguments.length == 1 && arguments[0] instanceof Array) {
            objects = arguments[0];
        }
        else {
            objects = [];
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] instanceof Array) {
                    objects.push.apply(objects, arguments[i]);
                }
            }
        }
        var a = new $o.OQArray();
        a._array = objects;
        return a;
    };
    
	var $oPrevValue = global.$o;
	
	/**
	 * objBind operator, creates an objBind wrapping parameter objects and Arrays
	 * @name $o
	 * @namespace objBind main namespace and operator
	 * @return {$o.OQArray} an objBind object
	 */
	global.objBind = global.$o = $o;

	/**
	 * returns $o to its previous value, and returns it's value to give it a new name
	 * 
	 * @example
	 * 		var $o = mylibrary.o;
	 * 		window.$obind = $o.noConflict();
	 * 		// now $o is mylibrary.o again, or can be used safely for other purposes
	 */
	$o.noConflict = function(){
		global.$o = $oPrevValue;
		return $o;
	}

	/**
	 * extends jQuery if found. this function is called when loading this module.
	 */
    $o.extendjQuery = function(){
        if (typeof jQuery == 'undefined') {
            return false;
        }
        
		/**
		 * @ignore
		 */
        jQuery.fn.trackChanges = function(){
            this.each(function(){
                if (typeof this == 'object') {
                    $o(this).bind('change', null);
                    this.__$o__.jQueryEvents = true;
                }
            });
            return this;
        }
        
		/**
		 * @ignore
		 */
        jQuery.fn.lookupChanges = function(){
            this.each(function(){
                if (typeof this == 'object' && this.__$o__) {
                    this.__$o__.lookup();
                }
            });
            return this;
        }
        
        return true;
    }
    
    $o.extendjQuery();
    
    /**
     * @param {Object} obj an object to test
     * @return {Boolean} is obj a DOM object?
     */
    $o.isDOMObject = function(obj){
        if (typeof obj == 'undefined' || obj === null) {
            return false;
        }
        if (((typeof Node != 'undefined') && obj instanceof Node) ||
        ((typeof Element != 'undefined') && obj instanceof Element) ||
        ((typeof NodeList != 'undefined') && obj instanceof NodeList) ||
        (obj === window) ||
        (obj === document)) {
            return true;
        }
        if (typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string") {
            return true;
        }
        return false;
    }
    
	/**
	 * property intercept modes, available in different environments (eg: browsers).
	 * Available values are: NONE, DEFINESETTER, DEFINEPROPERTY, DEFINEPROPERTYONLY
	 */
    $o.propertyInterceptModes = {
		/**
		 * property intercept mode could not be found
		 * @type Number
		 */
        UNKNOWN: 0,
		/**
		 * no property intercept mmechanism available
		 * @type Number
		 */
        NONE: 1,
		/**
		 * property intercept mechanism is: obj.__defineSetter__
		 * @type Number
		 */
        DEFINESETTER: 2,
		/**
		 * property intercept mmechanism is: Object.defineProperty
		 * @type Number
		 */
        DEFINEPROPERTY: 3,
		/**
		 * property intercept mmechanism is: Object.defineProperty only on DOM objects
		 * @type Number
		 */
        DEFINEPROPERTYONLYDOM: 4
    }
    var _propertyInterceptMode = $o.propertyInterceptModes.UNKNOWN;
    
    // NONE,DEFINESETTER,DEFINEPROPERTY,DEFINEPROPERTYONLYDOM
	/** 
	 * @returns {string} the supported property intercept mode name in the current environment (eg: browser) 
	 */
    $o.propertyInterceptModeName = function(){
        var m = $o.propertyInterceptMode();
        for (var n in $o.propertyInterceptModes) {
            if ($o.propertyInterceptModes[n] === m) {
                return n;
            }
        }
        return 'UNKNOWN';
    }
    
    // NONE,DEFINESETTER,DEFINEPROPERTY,DEFINEPROPERTYONLYDOM
	/** 
	 * @returns {string} the supported property intercept mode (see {@link $o.propertyInterceptModes}) in the current environment (eg: browser) 
	 */
    $o.propertyInterceptMode = function(){
        if (_propertyInterceptMode === $o.propertyInterceptModes.UNKNOWN) {
            // detect available property intercept mode
            
            var anobject;
            
            if (_propertyInterceptMode === $o.propertyInterceptModes.UNKNOWN) {
                anobject = {};
                if (typeof anobject.__defineSetter__ == 'function') {
                    try {
                        anobject.__defineGetter__('myproperty', function(){
                            return this._myproperty;
                        });
                        anobject.__defineSetter__('myproperty', function(value){
                            this._myproperty = value;
                        });
                        anobject.myproperty = 'my value';
                        if (anobject.myproperty === 'my value' && anobject._myproperty === 'my value') {
                            _propertyInterceptMode = $o.propertyInterceptModes.DEFINESETTER;
                        }
                    } 
                    catch (err) {
                    }
                }
            }
            
            if (_propertyInterceptMode === $o.propertyInterceptModes.UNKNOWN && Object.defineProperty) {
                try {
                    anobject = {};
                    Object.defineProperty(anobject, 'myproperty', {
                        get: function(){
                            return this._myproperty;
                        },
                        set: function(value){
                            this._myproperty = value;
                        }
                    })
                    anobject.myproperty = 'my value';
                    if (anobject.myproperty === 'my value' && anobject._myproperty === 'my value') {
                        _propertyInterceptMode = $o.propertyInterceptModes.DEFINEPROPERTY;
                    }
                } 
                catch (err) {
                }
                
                if (_propertyInterceptMode === $o.propertyInterceptModes.UNKNOWN) {
                    // defineProperty on javascript objects not supported try on DOM object
                    if (document && document.createElement) {
                        var adomobject = document.createElement('span');
                        try {
                            Object.defineProperty(adomobject, 'myproperty', {
                                get: function(){
                                    return this._myproperty;
                                },
                                set: function(value){
                                    this._myproperty = value;
                                }
                            })
                            adomobject.myproperty = 'my value';
                            if (adomobject.myproperty === 'my value' && adomobject._myproperty === 'my value') {
                                _propertyInterceptMode = $o.propertyInterceptModes.DEFINEPROPERTYONLYDOM;
                            }
                        } 
                        catch (err) {
                            // defineProperty on dom objects not supported either
                        }
                    }
                }
            }
            
            if (_propertyInterceptMode === $o.propertyInterceptModes.UNKNOWN) {
                _propertyInterceptMode = $o.propertyInterceptModes.NONE;
            }
        }
        return _propertyInterceptMode;
    }
    
	/**
	 * @class a triggered event data
	 * @constructor
	 * @param {string} eventType
	 * @param {Object} target
	 * @param {Object} data
	 * @param {Object} result
	 */
    $o.Event = function Event(eventType, target, data, result){
        this.type = eventType;
        this.target = target;
        this.data = data;
        this.result = result;
        this.timeStamp = new Date();
    }
    	
	/**
	 * Extends the event object with all members in the parameter object 
	 * @param {Object} obj
	 */
    $o.Event.prototype.extend = function(obj){
        for (var n in obj) {
            this[n] = obj[n];
        }
        return this;
    }
    
	/**
	 * Stops propagation of this event, remaining event subscribers won't be notified
	 */
    $o.Event.prototype.stopImmediatePropagation = function(){
        this.__propagationStopped__ = true;
    }
    
	/**
	 * @return {boolean} true if propagation of this event has been stopped
	 */
    $o.Event.prototype.isImmediatePropagationStopped = function(){
        return !!this.__propagationStopped__;
    }
    
	/**
	 * @return {string} a string "human-readable" representation of this event 
	 */
    $o.Event.prototype.toString = function(){
        var s = [];
        var action;
        action = this.type;
        var addArrayChange = function(arrayItems){
            if (arrayItems) {
                s.push(action + ' ' + arrayItems.length + ' item' + (arrayItems.length === 1 ? '' : 's') +
                (this.index !== 'undefined' ? (' at index ' + this.index) : ''));
            }
        };
        if (this.removeItems) {
            addArrayChange(this.removeItems);
        }
        if (this.addItems) {
            addArrayChange(this.addItems);
        }
        if (this.undetectedLengthChange) {
            s.push('undetected array length change');
        }
        
        if (s.length === 0) {
            if (this.type === 'propertyChanging') {
                action = 'changing';
            }
            else {
                action = 'changed';
            }
            if (this.property !== 'undefined') {
                s.push('property "' + this.property + '" ' + action +
                ' from ' +
                this.previousValue +
                ' to ' +
                this.value);
            }
        }
        if (s.length === 0) {
            s.push(this.type);
        }
        return s.join(', ');
    }
    
	/**
	 * filter function used to filter object private properties (won't be tracked) 
	 * @param {Object} obj target object
	 * @param {string} pname property name
	 */
    $o.propertyFilter = function(obj, pname){
        return (pname.substr(0, 1) !== '_') &&
        (pname.substr(0, 6) !== 'jQuery') &&
        (typeof obj[pname] !== 'function') &&
        (!(this.overrides && this.overrides[pname]));
    }
    
	/**
	 * @class an observer object attached to detects changes in a target object or Array.
	 * These helpers are created internally when change tracking over an object/Array is activated.
	 * @constructor
	 * @param {Object|Array} obj target object or Array to track for changes
	 */
    $o.OQHelper = function OQHelper(obj){
        this.obj = obj;
    }
    
	/**
	 * binds functions to events on target object (for multiple bindings, a map of functions can be used as argument)
	 * @param {string} eventType
	 * @param {Object} eventData
	 * @param {function()} handler
	 */
    $o.OQHelper.prototype.bind = function(eventType, eventData, handler){
        var evts = this.events || (this.events = {});
        
        var evMap;
        if (typeof handler == 'undefined') {
            handler = eventData;
            eventData = null;
        }
        if (typeof eventType == 'object') {
            evMap = eventType;
        }
        else {
            evMap = {};
            evMap[eventType] = handler;
        }
        
        for (var evType in evMap) {
            var evTypes = evType.split(' ');
            for (var i = 0; i < evTypes.length; i++) {
                var evt = evts[evTypes[i]] || (evts[evTypes[i]] = []);
                
                if (this.obj instanceof Array &&
                (evTypes[i] === 'change' ||
                evTypes[i] === 'adding' ||
                evTypes[i] === 'added' ||
                evTypes[i] === 'removing' ||
                evTypes[i] === 'removed')) {
                    this.interceptArrayModifiers();
                }
                else {
                    if (evTypes[i] === 'change' ||
                    evTypes[i] === 'propertyChanging' ||
                    evTypes[i] === 'propertyChanged') {
                        this.interceptProperties();
                    }
                }
                if (typeof evMap[evType] != 'undefined') {
                    var addToList = true;
                    if (typeof evMap[evType] != 'function') {
                        for (var ei = evt.length - 1; ei >= 0; ei--) {
                            if (evt[ei] === evMap[evType]) {
                                addToList = false;
                            }
                        }
                    }
                    if (addToList) {
                        evt.push({
                            data: eventData,
                            handler: evMap[evType]
                        });
                    }
                }
            }
        }
        return this;
    }
    
	/**
	 * Unbinds event handlers
	 * @param {Object} eventType
	 * @param {function()} [handler]
	 */
    $o.OQHelper.prototype.unbind = function(eventType, handler){
    
        var evts = this.events;
        if (!evts) {
            return;
        }
        
        if (typeof handler == 'undefined') {
            if (typeof eventType === 'function') {
                handler = eventType;
                eventType = null;
            }
        }
        
        if (typeof eventType == 'string') {
            var evTypes = eventType.split(' ');
            for (var i = 0; i < evTypes.length; i++) {
                if (evTypes[i]) {
                    var evt = evts[evTypes[i]];
                    if (evt) {
                        if (handler) {
                            // remove handler for this event type
                            evt.splice(0, evt.length);
                            for (var j = 0, jl = evt.length; j < jl; j++) {
                                if (handler === evt[j].handler) {
                                    evt.splice(j, 1);
                                    j--;
                                }
                            }
                        }
                        else {
                            // remove all handlers for this event type
                            evt.splice(0, evt.length);
                        }
                    }
                }
            }
        }
        else {
            if (handler) {
                // remove handler in all events
                for (var eName in evts) {
                    var evt = evts[eName];
                    // remove handler for this event type
                    evt.splice(0, evt.length);
                    for (var j = 0, jl = evt.length; j < jl; j++) {
                        if (handler === evt[j].handler) {
                            evt.splice(j, 1);
                            j--;
                        }
                    }
                }
            }
            else {
                // remove all interceptors
                this.removeInterceptors();
                
                // remove all bindings
                delete this.events;
                
            }
        }
        return this;
    }
    
	/**
	 * Triggers an event on the target object, aditional arguments are passed to subscribed event handlers
	 * @param {string} eventType
	 */
    $o.OQHelper.prototype.trigger = function(eventType){
    
        var evts = this.events, args;
        if (!evts) {
            return;
        }
        
        var evnt, evTypes, lastresult;
        if (eventType instanceof $o.Event) {
            evnt = eventType;
            evTypes = [evnt.type];
        }
        else {
            evTypes = eventType.split(' ');
        }
        args = Array.prototype.slice.apply(arguments);
        
        if (this.jQueryEvents && typeof jQuery != 'undefined') {
            // use jQuery.fn.trigger, this allows to use regular jQuery event binding
            for (var i = 0; i < evTypes.length; i++) {
                try {
                    var $this = this.jQueryObj || (this.jQueryObj = jQuery(this.obj));
                    if (evnt) {
                        args[0] = new jQuery.Event(evnt.type, evnt);
                    }
                    else {
                        args[0] = evTypes[i];
                    }
                    $this.trigger.apply($this, args);
                } 
                catch (err) {
                }
            }
        }
        
        for (var i = 0; i < evTypes.length; i++) {
        
            if (evTypes[i]) {
                var evt = evts[evTypes[i]], propStopped = false;
                if (evt) {
                    for (var j = 0, jl = evt.length; j < jl && !propStopped; j++) {
                        var handler = evt[j].handler;
                        if (typeof handler == 'function') {
                            if (evnt) {
                                evnt.target = this.obj;
                                evnt.result = lastresult;
                                args[0] = evnt;
                            }
                            else {
                                args[0] = new $o.Event(evTypes[i], this.obj, evt[j].data, lastresult);
                            }
                            lastresult = handler.apply(this.obj, args);
                            propStopped = args[0].isImmediatePropagationStopped();
                        }
                    }
                }
            }
        }
        return this;
    }
    
	/**
	 * removes all added interceptors from target object (eg: property interceptors or Array function wrappers)
	 */
    $o.OQHelper.prototype.removeInterceptors = function(){
        if (typeof this.obj != 'object') {
            return this;
        }
        if (this._propertiesIntercepted) {
            if (this.overrides) {
                for (var pname in this.obj) {
                    if ((pname.substr(0, 1) !== '_') && (!this.overrides[pname])) {
                        this.unoverrideProperty(this.obj, pname);
                    }
                }
            }
            this._propertiesIntercepted = false;
        }
        if (this._arrayModifiersIntercepted) {
            if (this.overrides) {
                this.unoverride(this.obj, 'push');
                this.unoverride(this.obj, 'pop');
                this.unoverride(this.obj, 'shift');
                this.unoverride(this.obj, 'unshif');
                this.unoverride(this.obj, 'splice');
            }
            this._arrayModifiersIntercepted = false;
        }
    }
    
	/**
	 * removes a function override from target object
	 * @param {string} name
	 */
    $o.OQHelper.prototype.unoverride = function(name){
        if (!this.overrides) {
            return this;
        }
        var override = this.overrides[name];
        if (override) {
            this.obj[name] = override.original;
            delete this.overrides[name];
        }
        return this;
    }
    
	/**
	 * overrides a function from target object
	 * @param {string} name
	 * @param {function()} func replacement function
	 */
    $o.OQHelper.prototype.override = function(name, func){
        if (!this.overrides) {
            this.overrides = {};
        }
        var overrides = this.overrides[name] ||
        (this.overrides[name] = {
            original: this.obj[name]
        });
        func.overriden = this.obj[name];
        this.obj[name] = func;
        
        return this;
    }
    
	/**
	 * adds setter and getter to a property in target object
	 * @param {string} property name
	 * @param {function()} setter
	 * @param {function()} getter
	 */
    $o.OQHelper.prototype.overrideProperty = function(name, setter, getter){
    
        var mode = $o.propertyInterceptMode();
        if (mode === $o.propertyInterceptModes.UNKNOWN ||
        mode === $o.propertyInterceptModes.NONE) {
            return this;
        }
        
        var current = {
            getter: null,
            setter: null
        };
        
        if (mode === $o.propertyInterceptModes.DEFINESETTER) {
            current.setter = this.obj.__lookupSetter__(name);
            current.getter = this.obj.__lookupGetter__(name);
        }
        else {
            try {
                var odesc = Object.getOwnPropertyDescriptor(this.obj, name);
                current.setter = odesc.get;
                current.getter = odesc.set;
            } 
            catch (err) {
                // no descriptor found
            }
        }
        
        if (!this.overrides) {
            this.overrides = {};
        }
        var override = this.overrides[name];
        
        if (!override) {
        
            this.overrides[name] = {
                original: current
            }
            override = this.overrides[name];
        }
        
        override.current = {
            getter: getter,
            setter: setter
        };
        setter.overriden = current.setter;
        getter.overriden = current.getter;
        
        if (mode === $o.propertyInterceptModes.DEFINESETTER) {
            if (setter) {
                try {
                    this.obj.__defineSetter__(name, setter);
                } 
                catch (err) {
                    if (console && console.log) {
						console.log('Object.__defineSetter__ for property \'' + name + '\' failed: ' + err);
					}
                }
            }
            if (getter) {
                try {
                    this.obj.__defineGetter__(name, getter);
                } 
                catch (err) {
                    if (console && console.log) {
						console.log('Object.__defineGetter__ for property \'' + name + '\' failed: ' + err);
					}
                }
            }
        }
        else 
            if (mode === $o.propertyInterceptModes.DEFINEPROPERTY ||
            (mode === $o.propertyInterceptModes.DEFINEPROPERTYONLYDOM && $o.isDOMObject(this.obj))) {
                try {
                    var desc = {};
                    if (setter) {
                        desc.set = setter;
                    }
                    if (getter) {
                        desc.get = getter;
                    }
                    Object.defineProperty(this.obj, name, desc);
                } 
                catch (err) {
					if (console && console.log) {
						console.log('Object.defineProperty for property \'' + name + '\' failed: ' + err);
					}
                }
            }
            else {
            // no property intercept supported
            // use: $o(this.subject).prop('pname',value);  			
            // 		$o(this.subject).prop({ pname1: value1, pname2: value2 });  			
            //      $o(this.subject).prop('pname');  
            }
        
        return this;
    }
    
	/**
	 * Removes getter and setter from an overriden property in target object
	 * @param {string} property name
	 */
    $o.OQHelper.prototype.unoverrideProperty = function(name){
    
        var mode = $o.propertyInterceptMode();
        if (mode === $o.propertyInterceptModes.UNKNOWN ||
        mode === $o.propertyInterceptModes.NONE) {
            return this;
        }
        
        var current = {
            getter: null,
            setter: null
        };
        
        if (!this.overrides) {
            return this;
        }
        var override = this.overrides[name];
        
        if (!override) {
            return this;
        }
        
        if (mode === $o.propertyInterceptModes.DEFINESETTER) {
            if (override.original.setter) {
                try {
                    this.obj.__defineSetter__(name, override.original.setter);
                } 
                catch (err) {
                    tent.log.warn('Object.__defineSetter__ for property \'' + name + '\' failed: ' + err);
                }
            }
            if (override.original.getter) {
                try {
                    this.obj.__defineGetter__(name, override.original.getter);
                } 
                catch (err) {
                    tent.log.warn('Object.__defineGetter__ for property \'' + name + '\' failed: ' + err);
                }
            }
        }
        else 
            if (mode === $o.propertyInterceptModes.DEFINEPROPERTY ||
            (mode === $o.propertyInterceptModes.DEFINEPROPERTYONLYDOM && $o.isDOMObject(this.obj))) {
                try {
                    var desc = {};
                    if (override.original.setter) {
                        desc.set = override.original.setter;
                    }
                    if (override.original.getter) {
                        desc.get = override.original.getter;
                    }
                    Object.defineProperty(this.obj, name, desc);
                } 
                catch (err) {
                    tent.log.warn('Object.defineProperty for property \'' + name + '\' failed: ' + err);
                }
            }
            else {
            // no property intercept supported, nothing to restore
            }
        
        delete this.overrides[name];
        
        return this;
    }
    
	/**
	 * Intercepts all properties in target object (adds setters and getters)
	 */
    $o.OQHelper.prototype.interceptProperties = function(){
    
        if (typeof this.obj != 'object') {
            return this;
        }
        if (this._propertiesIntercepted) {
            return this;
        }
        this._propertiesIntercepted = true;
        
        for (var pname in this.obj) {
            if ($o.propertyFilter(this.obj, pname)) {
                this.interceptProperty(this.obj, pname);
            }
        }
    }
    
	/**
	 * Intercepts a property on an object
	 * @param {Object} obj
	 * @param {string} property name
	 */
    $o.OQHelper.prototype.interceptProperty = function(obj, p){
        (obj.__$o__.storage || (obj.__$o__.storage = {}))[p] = obj[p];
        obj.__$o__.overrideProperty(p, function(value){
            if (!this.__$o__) {
                this[p] = value;
            }
            else {
                var stg = this.__$o__.storage || (this.__$o__.storage = {});
                if (stg[p] !== value) {
                    var pre = stg[p];
                    this.__$o__.trigger(new $o.Event('propertyChanging').extend({
                        property: p,
                        previousValue: pre,
                        value: value
                    }));
                    stg[p] = value;
                    this.__$o__.trigger(new $o.Event('propertyChanged').extend({
                        property: p,
                        previousValue: pre,
                        value: value
                    })).trigger(new $o.Event('change').extend({
                        property: p,
                        previousValue: pre,
                        value: value
                    }));
                }
            }
        }, function(){
            if (!this.__$o__ || !this.__$o__.storage) {
                return this[p];
            }
            else {
                return this.__$o__.storage[p];
            }
        });
    }
    
	/**
	 * lookups for undetected changes (eg: new properties, setting length Array property) and triggers change events accordingly 
	 */
    $o.OQHelper.prototype.lookup = function(){
        if (typeof this.obj != 'object') {
            return this;
        }
        if (this._propertiesIntercepted && !(this.obj instanceof Array)) {
            for (var pname in this.obj) {
                if ($o.propertyFilter(this.obj, pname) && !this.overrides[pname]) {
                    this.interceptProperty(this.obj, pname);
                    
                    // new property found, notify as changed
                    
                    this.trigger(new $o.Event('propertyChanging').extend({
                        property: pname,
                        value: this.obj[pname]
                    })).trigger(new $o.Event('propertyChanged').extend({
                        property: pname,
                        value: this.obj[pname]
                    })).trigger(new $o.Event('change').extend({
                        property: pname,
                        value: this.obj[pname]
                    }));
                }
            }
        }
        if (this._arrayModifiersIntercepted && this.obj instanceof Array) {
            if (this.arrayLength !== this.obj.length) {
            
                // array length change undetected, this can happen if:
                // - length property is assigned (use ._length(length) instead, or just .splice)
                // - delete array[index], was used (use .splice(index,1) instead)
                // - array[index] = value, with an index bigger than length-1 was used (use .push(value) or .splice(index,0,value) instead)
                
                this.arrayLength = this.obj.length;
                this.trigger(new $o.Event('removing').extend({
                    undetectedLengthChange: true,
                    index: -1 // there's no way to know which items are added/removed or where
                })).trigger(new $o.Event('adding').extend({
                    undetectedLengthChange: true,
                    index: -1 // there's no way to know which items are added/removed or where
                })).trigger(new $o.Event('removed').extend({
                    undetectedLengthChange: true,
                    index: -1 // there's no way to know which items are added/removed or where
                })).trigger(new $o.Event('added').extend({
                    undetectedLengthChange: true,
                    index: -1 // there's no way to know which items are added/removed or where
                })).trigger(new $o.Event('change').extend({
                    undetectedLengthChange: true,
                    index: -1 // there's no way to know which items are added/removed or where
                }));
            }
        }
        return this;
    }
    
	/**
	 * intercepts all functions that modify target Array contents
	 */
    $o.OQHelper.prototype.interceptArrayModifiers = function(){
    
        if (!this.obj instanceof Array) {
            return this;
        }
        if (this._arrayModifiersIntercepted) {
            return this;
        }
        this._arrayModifiersIntercepted = true;
        
        /**
         * @inner
         */
        var _length = function(l){
            if (typeof l == 'undefined') {
                return this.length;
            }
            // length setter that uses splice to trim arrays
            if (this.length > l) {
                this.splice(l, this.length - l);
            }
            else {
                this.length = l;
            }
        }
        
        this.obj._length = _length;
        
        this.override('push', function(){
            if (!this.__$o__ || !this.__$o__.events) {
                return Array.prototype.push.apply(this, arguments);
            }
            
            var index = this.length;
            var itemsToAdd = Array.prototype.slice.call(arguments);
            this.__$o__.trigger(new $o.Event('adding').extend({
                addItems: itemsToAdd,
                index: index
            }));
            
            var r = Array.prototype.push.apply(this, arguments);
            this.__$o__.arrayLength = this.length;
            
            this.__$o__.trigger(new $o.Event('added').extend({
                addItems: itemsToAdd,
                index: index
            })).trigger(new $o.Event('change').extend({
                addItems: itemsToAdd,
                index: index
            }));
            
            return r;
        });
        
        this.override('unshift', function(){
            if (!this.__$o__ || !this.__$o__.events) {
                return Array.prototype.unshift.apply(this, arguments);
            }
            
            var itemsToAdd = Array.prototype.slice.call(arguments);
            this.__$o__.trigger(new $o.Event('adding').extend({
                addItems: itemsToAdd,
                index: 0
            }));
            
            var r = Array.prototype.unshift.apply(this, arguments);
            this.__$o__.arrayLength = this.length;
            
            this.__$o__.trigger(new $o.Event('added').extend({
                addItems: itemsToAdd,
                index: 0
            })).trigger(new $o.Event('change').extend({
                addItems: itemsToAdd,
                index: 0
            }));
            
            return r;
        });
        
        this.override('pop', function(){
            if (!this.__$o__ || !this.__$o__.events) {
                return Array.prototype.pop.apply(this);
            }
            
            var index = this.length - 1;
            
            this.__$o__.trigger(new $o.Event('removing').extend({
                removeItems: [this[index]],
                index: index
            }));
            
            var item = Array.prototype.pop.apply(this);
            this.__$o__.arrayLength = this.length;
            
            this.__$o__.trigger(new $o.Event('removed').extend({
                removeItems: [item],
                index: index
            })).trigger(new $o.Event('change').extend({
                removeItems: [item],
                index: index
            }));
            
            return item;
        });
        
        this.override('shift', function(){
            if (!this.__$o__ || !this.__$o__.events) {
                return Array.prototype.shift.apply(this);
            }
            
            this.__$o__.trigger(new $o.Event('removing').extend({
                removeItems: [this[0]],
                index: index
            }));
            
            var item = Array.prototype.shift.apply(this);
            this.__$o__.arrayLength = this.length;
            
            this.__$o__.trigger(new $o.Event('removed').extend({
                removeItems: [item],
                index: 0
            })).trigger(new $o.Event('change').extend({
                removeItems: [item],
                index: 0
            }));
            
            return item;
        });
        
        this.override('splice', function(start, deleteCnt){
            if (!this.__$o__ || !this.__$o__.events) {
                return Array.prototype.splice.apply(this, arguments);
            }
            
            var itemsToAdd;
            if (deleteCnt && deleteCnt > 0) {
            
                this.__$o__.trigger(new $o.Event('removing').extend({
                    removeItems: this.slice(start, start + deleteCnt),
                    index: start
                }));
            }
            if (arguments.length > 2) {
                itemsToAdd = Array.prototype.slice.call(arguments, 2);
                this.__$o__.trigger(new $o.Event('adding').extend({
                    addItems: itemsToAdd,
                    index: start
                }));
            }
            
            if (itemsToAdd && itemsToAdd.length > 0) {
                var spliceArgs = itemsToAdd.slice(0);
                spliceArgs.unshift(start, deleteCnt);
                var removedItems = Array.prototype.splice.apply(this, spliceArgs);
            }
            else {
                var removedItems = Array.prototype.splice(start, deleteCnt);
            }
            this.__$o__.arrayLength = this.length;
            
            if (removedItems && removedItems.length > 0) {
                this.__$o__.trigger(new $o.Event('removed').extend({
                    removeItems: removedItems,
                    index: start
                }));
            }
            if (arguments.length > 2) {
                this.__$o__.trigger(new $o.Event('added').extend({
                    addItems: itemsToAdd,
                    index: start
                }));
            }
            this.__$o__.trigger(new $o.Event('change').extend({
                removeItems: removedItems,
                addItems: itemsToAdd,
                index: start
            }));
            
            return removedItems;
        });
        
        this.arrayLength = this.obj.length;
    }
    
	/**
	 * sets or gets (if no 2nd arguments is provided) a property value on target object
	 * @param {string} name property name
	 * @param {Object} value
	 * @return property value if not 2nd argument is provided
	 */
    $o.OQHelper.prototype.prop = function(name, value){
        var override = this.overrides[name];
        if (typeof value == 'undefined' && typeof name == 'string') {
            if (override && override.current.getter) {
                return override.current.getter.call(this.obj, name);
            }
            else {
                return this.obj[name];
            }
        }
        else {
            if (name === 'length' && this.obj instanceof Array) {
                // length setter that uses splice to trim arrays
                if (this.obj.length > value) {
                    this.obj.splice(value, this.obj.length - l);
                }
                else {
                    this.length = value;
                }
            }
            else {
                if (typeof name == 'object') {
                    for (var pname in name) {
                        var pvalue = name[pname];
                        if (typeof pvalue == 'function') {
                            pvalue = pvalue.apply(this.obj);
                        }
                        if (override && override.current.setter) {
                            override.current.setter.call(this.obj, pvalue);
                        }
                        else {
                            this.obj[pname] = pvalue;
                        }
                    }
                }
                else {
                    if (override && override.current.setter) {
                        override.current.setter.call(this.obj, value);
                    }
                    else {
                        this.obj[name] = value;
                    }
                }
            }
            return this;
        }
    }
    
	/**
	 * @class wraps an Array of objects allowing to perform binding and other operations over the collection.
	 * These wrapper objects are returns by the $o operator and all chainable functions.
	 * @constructor
	 */
	$o.OQArray = function OQArray(){
        this._array = Array.prototype.slice.apply(arguments);
    }
    
	/**
	 * returns the underlying object Array
	 * @param {Object} index
	 */
    $o.OQArray.prototype.get = function(index){
        if (typeof index != 'number') {
            return this._array;
        }
        else {
            if (index >= 0) {
                return this._array[index];
            }
            else {
                return this._array[this._array.length + index];
            }
        }
    }
    
	/**
	 * adds all arguments to this collection
	 */
    $o.OQArray.prototype.add = function(){
        var a = Array.prototype.slice.apply(this._array);
        a.push.apply(a, arguments);
        return $o.a(a);
    }
    
	/**
	 * adds the content of all Array arguments to this collection
	 */
    $o.OQArray.prototype.adda = function(){
        var objects;
        if (arguments.length == 1 && arguments[0] instanceof Array) {
            objects = arguments[0];
        }
        else {
            objects = [];
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] instanceof Array) {
                    objects.push.apply(objects, arguments[i]);
                }
            }
        }
        
        var a = Array.prototype.slice.apply(this._array);
        a.push.apply(a, objects);
        return $o.a(a);
    }
    
	/**
	 * finds an object on this collection
	 * @param {Object} obj
	 * @return {Number} the first zero-based position where object was found, or -1 if it's not found 
	 */
    $o.OQArray.prototype.index = function(obj){
        for (var i = 0, l = this._array.length; i < l; i++) {
            if (this._array[i] === obj) {
                return i;
            }
        }
        return -1;
    }
    
	/**
	 * recursively adds to this collection all the objects properties and array items
	 */
    $o.OQArray.prototype.deep = function(){
        var $a = $o();
        
        var addDeep = function(parent){
            if (typeof parent == 'object') {
                if ($a.index(parent) < 0) {
                    $a._array.push(parent);
                    
                    if (typeof parent == 'object') {
                        for (var pname in parent) {
                            if (!pname.substr(0, 1) === '_') {
                                var child = parent[pname];
                                addDeep(child);
                            }
                        }
                        if (parent instanceof Array) {
                            for (var i = 0, l = parent.length; i < l; i++) {
                                var child = parent[i];
                                addDeep(child);
                            }
                        }
                    }
                }
            }
        };
        
        for (var i = 0; i < this._array.length; i++) {
            var obj = this._array[i];
            addDeep(obj);
        }
        return $a;
    }
    
	/**
	 * executes an arguments function against all objects on this collection
	 * @param {function()} func
	 */
    $o.OQArray.prototype.each = function(func){
        for (var i = 0; i < this._array.length; i++) {
            func.apply(this._array[i]);
        }
        return this;
    }
    
	/**
	 * returns a new collection filtered by the argument function
	 * @param {function()} condition
	 */
    $o.OQArray.prototype.filter = function(condition){
        var a = [];
        for (var i = 0; i < this._array.length; i++) {
            if (condition.apply(this._array[i])) {
                a.push(this._array(i));
            }
        }
        return $o.a(a);
    }
    
	/**
	 * binds handlers to the "change" event. shortcut to .bind("change",...)
	 */
    $o.OQArray.prototype.change = function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift('change');
        return this.bind.apply(this, args);
    }
    
	/**
	 * binds handlers to events on objects of this collection. 
	 * To bind multiple handlers a map of functions can be used as argument
	 * @param {string} eventType
	 * @param {Object} eventData
	 * @param {function()} handler
	 */
    $o.OQArray.prototype.bind = function(eventType, eventData, handler){
        for (var i = 0, l = this._array.length; i < l; i++) {
            var obj = this._array[i];
            // get or create helper object 
            var oh = obj.__$o__ || (obj.__$o__ = new $o.OQHelper(obj));
            oh.bind.apply(oh, arguments);
        }
        return this;
    }
    
	/**
	 * Unbinds event handlers
	 * @param {string} eventType
	 * @param {function()} [handler]
	 */
    $o.OQArray.prototype.unbind = function(eventType, handler){
        for (var i = 0, l = this._array.length; i < l; i++) {
            var obj = this._array[i];
            var oh = obj.__$o__;
            if (oh) {
                oh.unbind.apply(oh, arguments);
            }
        }
        return this;
    }
    
	/**
	 * triggers an event on all objects of this collection, all arguments are passed to subscribed event handlers
	 * @param {string} eventType
	 */
    $o.OQArray.prototype.trigger = function(eventType){
        for (var i = 0, l = this._array.length; i < l; i++) {
            var obj = this._array[i];
            var oh = obj.__$o__;
            if (oh) {
                oh.trigger.apply(oh, arguments);
            }
        }
        return this;
    }
    
	/**
	 * lookups for undetected changes on objects of this collection, and triggers change events accordingly
	 */
    $o.OQArray.prototype.lookup = function(){
        for (var i = 0, l = this._array.length; i < l; i++) {
            var obj = this._array[i];
            var oh = obj.__$o__;
            if (oh) {
                oh.lookup.apply(oh, arguments);
            }
        }
        return this;
    }
    
	/**
	 * sets or gets (if no 2nd argument is provided) a property value on all objects of this collection.
	 * a map object can be used to set multiple properties.
	 * @param {string} name
	 * @param {Object} value
	 */
    $o.OQArray.prototype.prop = function(name, value){
        var r, isGet = (typeof value == 'undefined' && typeof name == 'string');
        for (var i = 0, l = this._array.length; i < l; i++) {
            var obj = this._array[i];
            var oh = obj.__$o__;
            if (oh) {
                r = oh.prop(name, value);
            }
            else {
                if (isGet) {
                    r = obj[name];
                }
                else {
                    obj[name] = value;
                }
            }
        }
        return isGet ? r : this;
    }
    
})(window || exports || {});
