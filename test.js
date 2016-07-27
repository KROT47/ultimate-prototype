
const Prototype = require( './' );


/* --------------------------------- Prototype.add() tests --------------------------------- */

function Obj() {}

Obj.prototype = { a: 0, b: 'hello' };

var obj = new Obj(),
	proto = {
		a: 1
	};

Prototype.add( obj, proto );

console.assert( Prototype.isPrototypeOf( proto, obj ), 'Proto must be prototype of obj' );

console.assert( obj.a === 1, 'Prototype was not been setup correctly' );

console.assert( obj.b === 'hello', 'Lower prototype is broken' );


var obj2 = {};

Prototype.add( obj2, proto );

console.assert( obj2.b === undefined, 'Proto was uncorrectly extended with another prototype' );


/* --------------------------------- Done --------------------------------- */

console.log( 'Done!' );