ObjBind
=========

*Change Tracking, Events and Traversing for plain JavaScript objects and arrays*

ObjBind is a small library that allows to track changes or other custom events using a jQuery-like syntax.
eg:

	// sample data
	var artists = [{
            name: 'Atahualpa Yupanqui',
            birthplace: 'Argentina',
            genres: ['Folklore', 'Canción de Autor']
        }, {
            name: 'Carlos Gardel',
            birthplace: 'Argentina',
            genres: ['Tango']
        }, {
            name: 'Pixinguinha',
            birthplace: 'Brasil',
            genres: ['Choro']
        }];
    
            
	$o(artists)
	
		// recursively include all related objects and arrays
		.deep() 
		
		// custom events
		.bind('saved'), function(e) {
			console.log('objects saved successfully');
		})
		
		// some built-in events for change tracking
		.bind('propertyChanging added'), function(e) {
			if (e.property){
				console.log('property ' + e.property + ' changing from ' + e.previousValue + ' to '+ e.value);
			} else {
				console.log(e.addItems.length + ' items added');
			}
		})
		
		// alias of bind('change', function())
		.change(function(e)) {
			// log any type of object or array change
			console.log(e);
		});

ObjBind will detect property value changes and Array changes (items added, items removed), the only exceptions are:
* Object new properties (ie. undefined at first bind), JavaScript doesn't support any notifying mechanism for properties beeing added
* Array length change, sometimes .length property is assigned to trim an Array (some browsers support adding a setter to this property, but I found support to be rare and problematic)
* Array index set (ie, a[index] = value), again no notifying mechanism for this on JavaScript.
If you want to get proper change tracking:
* check that all properties are defined (even null) at first bind
* allways use .splice, .pop. or .unshift to remove items form an Array

But event if you can't use this alternatives (eg. don't have control on object modification code), you can detect this changes using the .lookup function.
This function will compare the current state of objects against their last known state and trigger all change events immediately, eg:
             
	$o(artists)
	
		// recursively include all related objects and arrays
		.deep() 
		
		.change(function(e)) {
			// log any type of object or array change
			console.log(e);
		});

	// new property, undetected change
	artists[1].nickname = 'Carlitos';
	
	// 3rd item removed, undetected change
	artists.length = 2;

	// artist[1], and artists array changes are triggered 
	$o(artists).deep().lookup();

How it works?

When the first binding is made to an object or Array change, ObjBind adds setters & getters to objects, and overrides modifying methods on Arrays (ie: push, pop, shift, unshift and splice).
Property getters & setters support changes from browser to browser, ObjBind automatically detects the best supported mechanism and uses it (check Targeted Platforms for more details).  

---------------


Targeted platforms
----------------

* Chrome 10 Windows
* Opera 9.80 Windows
* Safari 533.19.4 Windows
* Firefox 4.0 Windows
* IE 8 and 9, Windows


[QUnit](http://docs.jquery.com/Qunit) is used for unit testing, so other browsers could be easily added. 
Just add the test html page on your preferred browser. 

ObjBind can be used on IE7 or older browsers, but property change detection won't work on it. IE7 doesn't provide any change tracking solution for this, so property changes must allways be done using $o(..).prop() function, ie:

	var customer = { name: 'John Smith', age: 35 };
	$o(customer).change(function() { alert('change detected'));
	
	customer.age = 45; // WRONG: change is not detected
	$o(customer).prop('age', 46); // RIGHT: change is detected

	console.log($o(customer).prop('age')); // prints '46'

Or you can use normal syntax, and lookup for changes with the .lookup function:

	customer.age = 45; // undetected change
	
	$o(customer).lookup(); // change is detected now

change tracking support can be checked using:

	console.log($o.propertyInterceptMode()); // member of $o.propertyInterceptModes enum
	console.log($o.propertyInterceptModeName());
	// prints 'DEFINESETTER' on most browsers, Chrome, FF, Safari, etc.
	// prints 'DEFINEPROPERTY' on IE9, etc.
	// prints 'DEFINEPROPERTYONLYDOM' on IE8, change tracking only on DOM objects, you can use $o.domClone() to clone your entities as DOM objects
	// prints 'NONE' on IE7, use $o.prop() when setting/getting properties or $o(...).lookup().

Including ObjBind in your application
---------------

Download the latest release from the web site (http://github.com/benjamine/objbind) and copy 
`dist/objbind.js` or `dist/objbind.min.js` (minified) to a suitable location. Then include it in your HTML
like so:

    <script type="text/javascript" src="/path/to/objbind.min.js"></script>
	
Note: you can use ObjBind on browserless JavaScript environments too (as [Node.js](http://nodejs.org/), or [Mozilla Rhino](http://www.mozilla.org/rhino/)). 

Using ObjBind with JQuery
---------------

If jQuery is loaded when ObjBind is included, ObjBind will extend jQuery allowing to use pure jQuery syntax, eg:

 
	$(artists)
	
		// custom events
		.bind('saved'), function(e) {
			console.log('objects saved successfully');
		})
		
		// activate change tracking on this objects
		.trackChanges()
		
		// some built-in events for change tracking
		.bind('propertyChanging added'), function(e) {
			if (e.property){
				console.log('property ' + e.property + ' changing from ' + e.previousValue + ' to '+ e.value);
			} else {
				console.log(e.addItems.length + ' items added');
			}
		})
		
		// alias of bind('change', function())
		.change(function(e)) {
			// log any type of object or array change
			console.log(e);
		});

Note that bind() and change() methods here are the regular jQuery methods (actually custom events on objects are already supported by jQuery), the only requirement is calling the .trackChanges() method to activate change tracking.
To lookup for new object properties or array length changes use:

	// same as: $o(artists).deep().lookup();
	$(artists).lookupChanges();

Running Unit Tests
----------------

Just open test/qunit.htm file on any browser, test will be run on load.


Documentation
-------------

JSDoc is used. Html API Docs are generated with [jsdoc-toolkit](http://code.google.com/p/jsdoc-toolkit/) and included in the docs/api folder, they also can be accessed at:

[API Docs](http://benjamine.github.com/objbind/docs/api/) 
