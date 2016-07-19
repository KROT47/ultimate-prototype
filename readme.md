# UltimatePrototype

Provides werful tools to work with prototypes  

**Usage:**

```js
const Prototype = require( 'ultimate-prototype' );

/* ------------ Tools ------------- */

// Executes handler on each obj prototype
// Prototype.each( {obj:Object}, {handler:Function} )

// Goes through all object and its prototypes properties and replaces needed descriptors defined by name in propDescriptors
// Prototype.setup( {obj:Object}, {defaultDescriptor:Object|undefined}, {propDescriptors:Object} ) => {Object}

// Adds all prototypes to object
// Prototype.add( {obj:Object}, {prototypes:Object|Array} ) => {Object}

// Returns last non null prototype in obj ( using filter if defined )
// Prototype.last( {obj:Object}, {filter:Function|undefined} ) => {Object}

// Clones obj without prototypes defined in prototypes
// Prototype.diff( {obj:Object}, {prototypes:Object|Array}, {setLastToNull:Boolean} ) => {Object|null}

// Extends target with all object's properties and prototypes
// Prototype.extend( {asProxy:Boolean|undefined}, {target:Object}[, {obj1:Object}, ...] ) => {Object}

// Extends target only with object's own properties
// Prototype.extendLite( {asProxy:Boolean|undefined}, {target:Object}[, {obj1:Object}, ...] ) => {Object}

// Tells if object is prototype of at least one of objects
// Prototype.isPrototypeOf( {proto:Object}, {objects:Object|Array} ) => {Boolean}