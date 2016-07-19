'use strict';

/* --------------------------------- Required Modules --------------------------------- */

const Descriptor = require( 'ultimate-descriptor' );


/* ------------------------------ Module Exports ------------------------------ */

module.exports.each = EachPrototype;

module.exports.setup = SetupPrototypes;

module.exports.add = AddPrototypes;

module.exports.last = GetLastPrototype;

module.exports.diff = GetPrototypesDifference;

module.exports.extend = ExtendWithPrototypes;

module.exports.extendLite = ExtendWithoutPrototypes;

module.exports.isPrototypeOf = isPrototypeOf;


/* ------------------------------ EachPrototype ------------------------------ */

/**
 * Goes through all prototypes and applies handler to each one
 * @param (Object) obj
 * @param (Function) handler - context === obj
 */
function EachPrototype( obj, handler ) {
    while ( obj = Object.getPrototypeOf( obj ) ) handler.call( obj );
}


/* ------------------------------ SetupPrototypes ------------------------------ */

/**
 * Goes through all object and its prototypes properties and replaces needed descriptors defined by name in propDescriptors
 * @param (Object) obj
 * @param (Object|undefined) defaultDescriptor - descriptor from which all descriptors will be extended
 * @param (Object) propDescriptors - property descriptors object ( @see: Object.defineProperties )
 * @return (Object)
 * E.g.
 * Prototypes.setup( { a: 1, b: 2 }, {
 * 		c: { get: function() { return 3 } }
 * }, { enumerable: true });
 */
function SetupPrototypes( obj, defaultDescriptor, propDescriptors ) {

	var originObj = obj;

    if ( !propDescriptors ) {
        propDescriptors = defaultDescriptor;
        defaultDescriptor = {};
    }

    var props = Object.getOwnPropertyNames( propDescriptors );
    var prop, descriptor, i;

    while ( props.length && obj ) {

        for ( i = props.length; i--; ) {
            prop = props[ i ];

            if ( descriptor = Descriptor.get( obj, prop ) ) {

                descriptor
	                .extend(
	                    defaultDescriptor,
	                    propDescriptors[ prop ]
	                )
	                .asProxy()
	                .assignTo( obj, prop );

                props.splice( i, 1 );
            }
        }

        obj = Object.getPrototypeOf( obj );
    }

	// add all missing properties
    for ( var i = props.length; i--; ) {
    	Object.defineProperty(
    		originObj,
    		props[ i ],
    		Descriptor.extend( {}, defaultDescriptor, propDescriptors[ props[ i ] ] )
    	);
    }

    return originObj;
};


/* ------------------------------ Add Prototypes To Object ------------------------------ */

/**
 * Add all prototypes to object ( in order )
 * @param (Object) obj
 * @param (Object|Array) prototypes
 * @return (Object)
 */
function AddPrototypes( obj, prototypes ) {

    var prototype;

    if ( Array.isArray( prototypes ) ) {
        // add all prototypes where each next prototype is set in previous
        for ( var i = 0; i < prototypes.length; ++i ) {
            prototype = prototypes[ i ];

            AddPrototypes( obj, prototype );

            obj = prototype;
        }
    } else {

        prototype = prototypes;

        // if prototype already defined - finish
        if ( prototype.isPrototypeOf( obj ) ) return obj;

        // creating new prototypes chain to prevent cyclic error
        prototype = GetPrototypesDifference( prototype, obj, true );

        // first connect last prototype in chain with first 'obj's prototype
        Object.setPrototypeOf( prototype, Object.getPrototypeOf( obj ) );

        // and then set prototype as first prototype in 'obj'
        Object.setPrototypeOf( obj, prototype );
    }

    return obj;
}


/* ------------------------------ Get Last Prototype ------------------------------ */

/**
 * Returns last non null prototype in obj ( using filter if defined )
 * @param (Object) obj
 * @param (Function|undefined) filter
 * @return (Object)
 */
function GetLastPrototype( obj, filter ) {
    var proto;

    filter = filter || function () { return true };

    while ( ( proto = Object.getPrototypeOf( obj ) ) && filter( proto ) ) { obj = proto }

    return obj;
}


/* ------------------------------ Prototypes Difference ------------------------------ */

/**
 * Clones obj without prototypes defined in prototypes
 * @param (Object) obj - object to check
 * @param (Object|Array) prototypes - prototypes to compare with
 * @param (Boolean) setLastToNull - tells that last prototype should be null ( not Object )
 * @return (Object|null) - object with prototypes different from prototypes
 */
function GetPrototypesDifference( obj, prototypes, setLastToNull ) {

    if ( isPrototypeOf( obj, prototypes ) ) return null;

    var newObj = ExtendWithoutPrototypes( {}, obj ),
        newObjProto = newObj,
        proto = obj,
        temp;

    // find first common prototype in 'prototype's prototype-chain
    while ( ( proto = Object.getPrototypeOf( proto ) ) && !isPrototypeOf( proto, prototypes ) ) {
        // create clone of uncommon prototype
        temp = ExtendWithoutPrototypes( {}, proto );

        // set each prototype clone to next prototype
        Object.setPrototypeOf( newObjProto, temp );
        newObjProto = temp;
    }

    // set last prototype to null
    if ( setLastToNull ) Object.setPrototypeOf( newObjProto, null );

    return newObj;

};


/* ------------------------------ Extend With Prototypes ------------------------------ */

/**
 * Extends target with all object's properties and prototypes
 * @param (Boolean|undefined) asProxy - ( default: false )
 * @param (Object) obj
 * @return (Object)
 */
function ExtendWithPrototypes( asProxy, target /*, obj1, ... */ ) {
    // clone object
    target = ExtendWithoutPrototypes.apply( null, arguments );

    asProxy = typeof asProxy == 'object' ? undefined : asProxy;

    // add prototypes
    for ( var i = asProxy === undefined ? 1 : 2; i < arguments.length; ++i ) {
        AddPrototypes( target, Object.getPrototypeOf( arguments[ i ] ) );
    }

    return target;
}


/* ------------------------------ Extend Without Prototypes ------------------------------ */

/**
 * Extends target only with object's own properties
 * @param (Boolean|undefined) asProxy - ( default: false )
 * @param (Object) obj
 * @return (Object)
 */
function ExtendWithoutPrototypes( asProxy, target /*, obj1, ... */ ) {

    var obj, props, i, k, prop, descriptor;

    asProxy = typeof asProxy == 'object' ? undefined : asProxy;

    for ( i = asProxy === undefined ? 1 : 2; i < arguments.length; ++i ) {
        obj = arguments[ i ];

        props = Object.getOwnPropertyNames( obj );

        for ( k = props.length; k--; ) {
            prop = props[ k ];

            Descriptor.get( obj, prop ).asProxy( asProxy ).assignTo( newObj, prop );
        }
    }

    return target;
}


/* ------------------------------ Is Prototype Of ------------------------------ */

/**
 * Tells if object is prototype of at least one of objects
 * @param (Object) proto
 * @param (Object|Array) objects
 * @return (Boolean)
 */
function isPrototypeOf( proto, objects ) {
    if ( !Array.isArray( objects ) ) objects = [ objects ];

    for ( var i = objects.length; i--; )
        if ( proto.isPrototypeOf( objects[ i ] ) ) return true;

    return false;
}
