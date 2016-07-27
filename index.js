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
 * Prototypes.setup( { a: 1, b: 2 }, { enumerable: true }, {
 *      c: { get: function() { return 3 } }
 * });
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
                    .extend( defaultDescriptor, propDescriptors[ prop ] )
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
 * Add all prototypes to object ( in order where last will become first )
 * e.g. AddPrototypes( obj, [ proto1, proto2 ] ) 
 *  => obj
 *      - proto2
 *        - proto1
 *          - obj's old prototype
 * @param (Object) obj
 * @param (Object|Array) prototypes
 * @return (Object)
 */
function AddPrototypes( obj, prototypes ) {

    if ( Array.isArray( prototypes ) ) {
        
        // add all prototypes one by one
        for ( var i = 0; i < prototypes.length; ++i ) AddPrototypes( obj, prototypes[ i ] );

        return obj;
    }

    var prototype = prototypes;
    
    // if prototype already added - finish
    if ( isPrototypeOf( prototype, obj ) ) return obj;

    // add system prototype once
    if ( prototype !== AddPrototypePrototype ) {
        if ( !obj.__addPrototype ) AddPrototypes( obj, AddPrototypePrototype );
        
        // add origin prototype to obj cache ( to use obj.__hasPrototype() )
        obj.__addPrototype( prototype );
    }


    // create clone from prototype to leave origin without changes
    var clonedPrototype = ExtendWithoutPrototypes( true, {}, prototype );
    // add prototypes chain to clone
    Object.setPrototypeOf( clonedPrototype, Object.getPrototypeOf( prototype ) );

    // creating new prototypes chain to prevent cyclic error
    clonedPrototype = GetPrototypesDifference( clonedPrototype, obj );

    // get last prototype ( not Object.prototype )
    var lastPrototype = GetLastPrototype( clonedPrototype, notObjectPrototype );

    // first connect last prototype in chain with first 'obj's prototype
    Object.setPrototypeOf( lastPrototype, Object.getPrototypeOf( obj ) );

    // and then set prototype as first prototype in 'obj'
    Object.setPrototypeOf( obj, clonedPrototype );

    return obj;
}

const AddPrototypePrototype = Descriptor.toObject({
        /**
         * Special check if prototype was added to object
         * is needed because on adding prototype will be cloned to new object
         * @param (Object) proto
         * @return (Boolean)
         */
        __hasPrototype: {
            value: function ( proto ) { return !!~this.__addedPrototypes.indexOf( proto ) }
        },

        /**
         * Adds origin prototype to cache
         * @param (Object) proto
         * @return (Boolean)
         */
        __addPrototype: {
            value: function ( proto ) {
                if ( !this.__hasPrototype( proto ) ) this.__addedPrototypes.push( proto );
            }
        },

        // cache for all origin prototypes
        // its ok to add array to prototype ( it will be cloned )
        __addedPrototypes: { value: [], writable: true }
    });


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
 * @return (Object|null) - object with prototype chain without prototypes
 */
function GetPrototypesDifference( obj, prototypes, setLastToNull ) {

    if ( isPrototypeOf( obj, prototypes ) || isEquivalent( obj, prototypes ) ) return null;

    var proto = obj,
        uncommonPrototypes = [],
        hasCommonPrototypes = false;

    // check for common prototypes
    while ( proto = Object.getPrototypeOf( proto ) ) {
        if ( !isPrototypeOf( proto, prototypes ) && !isEquivalent( proto, prototypes ) ) {
            uncommonPrototypes.push( proto );
        } else {
            hasCommonPrototypes = true;
        }
    }

    if ( !hasCommonPrototypes ) return obj;

    var newObj = ExtendWithoutPrototypes( {}, obj ),
        newObjProto = newObj,
        temp;

    for ( var i = 0; i < uncommonPrototypes.length; ++i ) {
        // create clone of uncommon prototype
        temp = ExtendWithoutPrototypes( {}, uncommonPrototypes[ i ] );

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

            Descriptor.get( obj, prop ).asProxy( asProxy ).assignTo( target, prop );
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
    if ( !objects ) return false;

    if ( Array.isArray( objects ) ) {
        var result;

        for ( var i = objects.length; i--; ) if ( result = isPrototypeOf( proto, objects ) ) {
            return result;
        }
        return false;
    }

    if ( proto.isPrototypeOf( objects )
        || objects.__hasPrototype && objects.__hasPrototype( proto )
    ) {
        return true;
    }

    return false;
}

/* --------------------------------- Helpers --------------------------------- */

function notObjectPrototype( proto ) { return proto !== Object.prototype }

// tells if obj is equivalent to at least one of objects
function isEquivalent( obj, objects ) {
    if ( !Array.isArray( objects ) ) objects = [ objects ];

    for ( var i = objects.length; i--; )
        if ( obj === objects[ i ] ) return true;

    return false;
}