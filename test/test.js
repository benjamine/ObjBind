
module('events', {

    setup: function(){
    
        // prepare some sample data
        var d = this.d = {};
        d.artists = [{
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
    }
    
});

test("no conflict", 2, function(){

	var noConfFunc = $o.noConflict;
	
	var $obind = $o.noConflict();
    
	same($o, undefined, "$o is undefined");	
	same($obind.noConflict, noConfFunc, "$obind is the new objBind operator");
	
	// restore $o operator
	$o = $obind;
});

test("bind and trigger, custom events", 2, function(){
    var d = this.d;
    d.eventCount = {};
    
    $o(d.artists).deep().bind('event1 event2', function(e){
        d.eventCount[e.type] = (d.eventCount[e.type] || 0) + 1;
    });
    
    $o(d.artists[0]).trigger('event2 event1');
    
    equal(d.eventCount.event1, 1, 'event1 fired');
    equal(d.eventCount.event2, 1, 'event2 fired');
});

test("bind to array, push", 5, function(){
    var d = this.d;
    
    $o(d.artists).bind('adding', function(e){
        d.addingFired = true;
        equal(e.type, 'adding', 'array item adding event fired');
    }).bind('added', function(e){
        ok(d.addingFired, 'added fired after adding');
        equal(e.type, 'added', 'array item added event fired');
    }).change(function(e){
        ok(d.addingFired, 'change fired after adding');
        equal(e.type, 'change', 'array change event fired');
    });
    
    d.artists.push({
        name: 'Violeta Parra',
        birthplace: 'Chile'
    })
});

test("bind to array, pop", 5, function(){
    var d = this.d;
    
    $o(d.artists).bind('removing', function(e){
        d.removingFired = true;
        equal(e.type, 'removing', 'array item removing event fired');
    }).bind('removed', function(e){
        ok(d.removingFired, 'removed fired after removing');
        equal(e.type, 'removed', 'array item removed event fired');
    }).change(function(e){
        ok(d.removingFired, 'change fired after removing');
        equal(e.type, 'change', 'array change event fired');
    });
    
    d.artists.pop();
});

test("bind to array, change length", 1, function(){
    var d = this.d;
    
    $o(d.artists).change(function(e){
        equal(e.type, 'change', 'array change event fired');
    });
    
    d.artists.length = d.artists.length - 1;
    $o(d.artists).lookup();
});

test("bind to object, change property", 5, function(){
    var d = this.d;
    
    $o(d.artists).deep().bind('propertyChanging', function(e){
        d.changingFired = true;
        equal(e.type, 'propertyChanging', 'propertyChanging event fired');
    }).bind('propertyChanged', function(e){
        ok(d.changingFired, 'propertyChanged fired after propertyChanging');
        equal(e.type, 'propertyChanged', 'propertyChanged event fired');
    }).change(function(e){
        ok(d.changingFired, 'change fired after propertyChanging');
        equal(e.type, 'change', 'change event fired');
    });
    
    d.artists[1].birthplace = 'France';
});

test("bind to object, add new property", 6, function(){

    var d = this.d;
    
    d.eventCount = 0;
    
    $o(d.artists).deep().bind('propertyChanging', function(e){
        d.eventCount++;
        d.changingFired = true;
        equal(e.type, 'propertyChanging', 'propertyChanging (' + e.property + ') event fired');
    }).bind('propertyChanged', function(e){
        d.eventCount++;
        ok(d.changingFired, 'propertyChanged fired after propertyChanging');
        equal(e.type, 'propertyChanged', 'propertyChanged (' + e.property + ') event fired');
    }).change(function(e){
        d.eventCount++;
        ok(d.changingFired, 'change fired after propertyChanging');
        equal(e.type, 'change', 'change (' + e + ') event fired');
    });
    
    ok(typeof d.artists[0].originalName == 'undefined', 'field is undefined');
    
    d.artists[0].originalName = 'Héctor Roberto Chavero';
    
    $o(d.artists).deep().lookup();
});

test("jQuery.bind to object, change property", 5, function(){
    var d = this.d;
    
    $(d.artists).trackChanges().bind('propertyChanging', function(e){
        d.changingFired = true;
        equal(e.type, 'propertyChanging', 'propertyChanging event fired');
    }).bind('propertyChanged', function(e){
        ok(d.changingFired, 'propertyChanged fired after propertyChanging');
        equal(e.type, 'propertyChanged', 'propertyChanged event fired');
    }).change(function(e){
        ok(d.changingFired, 'change fired after propertyChanging');
        equal(e.type, 'change', 'change event fired');
    });
    
    d.artists[1].birthplace = 'France';
});

test("jQuery.bind to object, add new property", 9, function(){

    var d = this.d;
    
    d.eventCount = 0;
    
    $(d.artists).trackChanges().bind('propertyChanging', function(e){
        d.eventCount++;
        d.changingFired = true;
        equal(e.type, 'propertyChanging', 'propertyChanging (' + e.property + ') event fired');
        equal(e.property, 'originalName', 'property name notified');
    }).bind('propertyChanged', function(e){
        d.eventCount++;
        ok(d.changingFired, 'propertyChanged fired after propertyChanging');
        equal(e.property, 'originalName', 'property name notified');
        equal(e.type, 'propertyChanged', 'propertyChanged (' + e.property + ') event fired');
    }).change(function(e){
        d.eventCount++;
        ok(d.changingFired, 'change fired after propertyChanging');
        equal(e.property, 'originalName', 'property name notified');
        equal(e.type, 'change', 'change (' + e + ') event fired');
    });
    
    ok(typeof d.artists[0].originalName == 'undefined', 'field is undefined');
    
    d.artists[0].originalName = 'Héctor Roberto Chavero';
    
    $(d.artists).lookupChanges();
});

test("bind and unbind", 1, function(){

    var d = this.d;
    d.eventsFired = 0
    var handler = function(e){
        d.eventsFired++;
    };
    $o(d.artists).deep().add(d.artists).bind('propertyChanging propertyChanged adding added removing removed change', handler);
    
    $o(d.artists).deep().unbind(handler);
    
    d.artists[1].birthplace = 'France';
    d.artists.pop();
    d.artists.push({
        name: 'Billie Holiday',
        genre: ['Jazz', 'Swing', 'Blues']
    });
    
    equal(d.eventsFired, 0, 'no event fired after unbind');
});

test("use .prop to change object", 6, function(){
    var d = this.d;
    
    $o(d.artists).deep().bind('propertyChanging', function(e){
        d.changingFired = true;
        equal(e.type, 'propertyChanging', 'propertyChanging event fired');
    }).bind('propertyChanged', function(e){
        ok(d.changingFired, 'propertyChanged fired after propertyChanging');
        equal(e.type, 'propertyChanged', 'propertyChanged event fired');
    }).change(function(e){
        ok(d.changingFired, 'change fired after propertyChanging');
        equal(e.type, 'change', 'change event fired');
    });
    
    var previousValue = d.artists[0].birthplace;
    $o(d.artists[0]).prop({
        birthplace: function(){
            return this.birthplace + ', Pergamino';
        }
    });
    
    equal($o(d.artists[0]).prop('birthplace'), previousValue + ', Pergamino', 'value modified properly');
});
