# Building an Écoule Data Source
The following example is a minimal implementation of an Écoule Data Source.

    function Source (config) {
        // a Source require a 'title' property
        this.title = config.title || 'Untitled source';
    }

    // This is the step that will fetch the actual data.
    // If the error variable is set to an Error, the Écoule instance
    // will be terminated and throw this error to its callback
    Source.prototype.refresh = function(done) {
        var data = []; // return data
        var err = undefined; // no errors

        return done(err, data);
    };

    // Expose the source to the common-js module system and make it
    // possible to have more than one of the same data source
    // included in the project with different configurations.
    module.exports = function (options) {
        return (new Source(options || {}));
    };

The `refresh` function is not a strict necessity, but leaving it out would make the source serve little purpose.


## Refresh function
The `refresh`-function receives an callback function as its first argument, that needs to be called when the function has done its task. This makes it possible to make asynchronous requests within the Source and report back on completion.

    function Source (config) {
        // a Source require a 'title' property
        this.title = config.title || 'Untitled source';
    }

    Source.prototype.refresh = function(done) {
        var data = [{
            title: 'Lorem Ipsum',
            content: 'Neque porro quisquam est qui dolorem ipsum'
        }];

        return done(undefined, data);
    };

    module.exports = function (options) {
        return (new Source(options || {}));
    };

**Notice**, it is a *strict requirement to execute `done`* at some point, otherwise the source will just hang, and thus hang the entire parent Écoule-insatance, which is patient; it can hang forever.

If the Source use a workflow controle library, such as [Operandi](https://github.com/gausby/operandi), the done-callback can be passed around and called when every task in the source has been completed.


## Source Initialization
If the Data Source implements an `initialize`-function it will get called just after the main Écoule-initialization, along with all the other initialization functions.


### Why Implement a Initialize Function Instead of Using a Constructor?
If the following pattern is used, the constructor will get called when the Écoule-configuration is passed to the Écoule-instance, which is not always desirable.

    function Source (config) {
        // a Source require a 'title' property
        this.title = config.title || 'Untitled Source';
    }

    module.exports = function (config) {
        return (new Source(config || {}));
    };

Only small blocking operations, such as setting simple properties on the instance, like `this.title = config.title;` should be done here, as there otherwise is no guarantee that a slow, asynchronous operation would complete before Écoule will reach the data collection stage.

The initialize function is the way to go, because it can report back when its operation is done, and it provides a way to stop the Écoule-instance from running if it hits a fatal error.


### Handling Initialization Failure
This is a good opportunity to check for dependencies and permissions, and inform the end-user with a friendly error message, give a hint about what to fix, before the other sources has a change do heavy operations, such as downloading resources from the internet, or traversing a file-system.

The following example shows an module that will terminate an Écoule-instance with an error.

    function Source (config) {
        this.config = config;

        // a Source require a 'title' property
        this.title = this.config.title || 'Epic Fail';
    }

    Source.prototype.initialize (done) {
        // something bad happened, abandon ship!
        return done(new Error('Error thrown'));
    };

    module.exports = function (config) {
        return (new Source(config || {}));
    };

This will pass the error to the Écoule-instance, halt everything, and let the callback of the instance handle the error. In most cases you will just pass an error back like this.

If the Source initialize without any errors, call `return done();` without any arguments when everything is done and ready.
