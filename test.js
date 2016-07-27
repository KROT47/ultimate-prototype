
const Prototype = require( './' );

const Descriptor = require( 'ultimate-descriptor' );


/* --------------------------------- extendLite() tests --------------------------------- */

var obj = Descriptor.toObject({
		a: { value: { a: 1, b: [ 1, 2, 3 ] } },
		b: { get: function () { return 123 } }
	}),
	target = {};

Prototype.extendLite( true, target, obj );

obj.a.a = 2;
obj.a.b[ 0 ] = 2;

console.assert( target.a.a === 1 && target.a.b[ 0 ] === 1, 'Deep extend not working' );


/* --------------------------------- add() tests --------------------------------- */

function Obj() {}

Obj.prototype = { a: 0, b: 'hello' };

var obj = new Obj(),
	proto = {
		a: 1,
		c: { c: 1 }
	};

Prototype.add( obj, proto );

console.assert( Prototype.isPrototypeOf( proto, obj ), 'Proto must be prototype of obj' );

console.assert( obj.a === 1, 'Prototype was not been setup correctly' );

console.assert( obj.b === 'hello', 'Lower prototype is broken' );

/* ------------  ------------- */

var obj2 = {};

Prototype.add( obj2, proto );

console.assert( obj2.b === undefined, 'Proto was uncorrectly extended with another prototype' );

obj2.c.c = 2;

console.assert( obj.c.c === 2, 'Proto must be the same for several objects' );

/* ------------  ------------- */

var obj3 = {},
	proto2 = {
		x: 9
	};

Prototype.add( obj3, proto2 );

console.assert( !Prototype.isPrototypeOf( proto, obj3 ), 'AddPrototypePrototype must not be globally common' );

/* --------------------------------- Done --------------------------------- */

console.log( 'Done!' );