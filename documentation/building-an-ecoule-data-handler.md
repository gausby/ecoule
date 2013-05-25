# Building an Écoule Data Handler
The following example is a minimal implementation of an Écoule Data Handler.

    function DataHandler (config) {
        // make it possible for the user to change the matching
        // function in the data handler configuration, and provide a
        // fallback that in this case will match everything.
        this.match = config.match || {};
    }

    DataHandler.prototype.execute = function(entry, done) {
        // alterations made to the `entry` object will kick through on
        // the passed in object. Setting `entry.foo = 'bar';` will set
        // `foo` to `'bar'` on the current data entry.

        // return done without arguments when done. If an error is
        // passed in it terminate the entire Écoule process.
        return done();
    };

    module.exports = function (config) {
        return (new DataHandler(config));
    };


## Data Handler Initalization
If the data handler implements an `initialize`-function it will get called just after the main Écoule-initialization, along with all the other initialization functions.

    function DataHandler (config) {
        this.match = config.match || function () { return true; }
    }

    DataHandler.prototype.initialize = function (done) {
        // Run code that will initialize the data handler. If `error`
        // is defined it will terminate the entire Écoule instance
        // and call the main callback function for error-handling.
        done(error);
    };

    DataHandler.prototype.execute = function (entry, done) {
        return done();
    };

    module.exports = function (config) {
        return (new DataHandler(config));
    };

As with all the other initialization functions, it receives one parameter, a callback function that needs to be called when the initializer is done—if this does not happen, it will hang the parent Écoule instance.

A data handler should initialize connections to databases, check for permissions, and so forth, so it can return an error, and thus terminate the Écoule-instance, if required conditions are not met, before Écoule starts collecting data or outputing data.


## The `match`-Function
Every data object in the sources will get passed to every data-handler. A match function will test if the current data-handler should be passed to its `execute`-function for data manipulation.

A `match`-function should return a Boolean-value; **true** if it should pass the current data-object to the `execute`-function and **false** if it should skip it.

The following is an example of a data handler that let the user redefine the the `match`-function, and still provide a default, that checks if the input has a title attribute with the value of 'Foo'.

    function matchFunction (input) {
        return ('title' in input) && input.title === 'Foo';
    }

    function DataHandler (config) {
        this.match = config.match || matchFunction;
    };

    module.exports = function (config) {
        return (new DataHandler(config));
    };

A frame-work such as [Pursuit](https://github.com/gausby/pursuit/) can be used to generate these functions based on a query-language. Écoule uses this internaly various places, and will even compile a match-object into a function if `match` is an object instead of a function.

The following example will result in the same functionality as the previous example, but Écoule will use Pursuit to turn the object into a `match`-function.

    function DataHandler (config) {
        this.match = config.match || { 'title': { equals: 'Foo' }};
    }

    module.exports = function (config) {
        return (new DataHandler(config));
    };

Any query language builder can be used, but if an object is passed, Écoule will use its own, which is Pursuit.


## The `execute`-Function
The `execute`-function will perform the actual data manipulation on a matched data-object. It takes two arguments, the data-object and a callback-function that should be called when the operation is done.

    function DataHandler (config) {
        this.match = config.match || { 'title': { equals: 'Foo' }};
    }

    DataHandler.prototype.execute = function (entry, done) {
        // make changes to the entry variable
        return done();
    }

    module.exports = function (config) {
        return (new DataHandler(config));
    };

Pass an error to the done-callback if something makes a fatal error. Add tests for stuff that could break in the initializer, and throw the error there if possible—at this stage data has been pulled into the system, an operation that could be time consuming, so we would like stuff to break as soon as possible, so the user can take care of the situation.
