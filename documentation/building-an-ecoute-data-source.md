# Building an Écoute data source
The following example is a minimal implementation of an Écoute Data Source.

    function Source (config) {
        this.config = config;

        // a Source require a 'title' property
        this.title = this.config.title || 'Untitled source';
    }

    // This is the step that will fetch the actual data.
    // If the error variable is set to an Error, the Écoute instance
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

The `refresh`-function receives an callback function that needs to be called when the function has done its task. This makes it possible to make asynchronous requests within the Source and report back on completion.

**Notice**, it is a *strict requirement to execute `done`* at some point, otherwise the source will just hang, and thus hang the entire parent Écoute-insatance.


## The `initialize`-function
If the Data Source implements an initialize-function it will get called just after the main Écoute initialization, along with all the other initialization functions.

This is a good opportunity to check for dependencies and permissions, and inform the end-user with a friendly error message, and give a hint about what to fix, before the other sources has a change to download data from a server and such.
