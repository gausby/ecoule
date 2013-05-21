Building an Écoute Transformer
==============================
The following example is a minimal implementation of an Écoute transformer.

    function Transformer (config) {
        config = config || {};
        this.queries = config.queries || {};
        this.preprocessors = config.preprocessors || [];
        this.postprocessors = config.postprocessors || [];
        this.outputs = config.outputs || [];
    }

    Transformer.prototype.initialize = function (done) {
        return done();
    }

    Transformer.prototype.execute = function (done) {
        var output = {};

        return done(undefined, output);
    }

    module.exports = function (config) {
        return (new Transformer(config));
    };

Initialize, outputs, and Pre- and post-processors are optional. Technically queries and execute are optional too, but the transformer would not do much without them.


## Initialization Function
As with any Écoute plugin, an initialization step will be run if the plugin implements an `initialize` function that recieves a callback as the first argument. If an error is passed to the callback the entire Écoute instance will get terminated.


## Execute Function
The execute function will trigger the transformer, and receives the done-callback function as its first argument. When the transformer is done and ready to return its output the done-callback should get called with two arguements.

  * `error`, pass undefined if no errors was encountered.

  * `output`, the result of the transormation. Usualy you would like to return an object with key-values that the given outputers can work with.

The execute function will get called after Écoute has collected all data from the sources and run it through the optional data handlers.

The result of the transformation will get passed to the configured outputers.


### Getting Data From the Sources into the Execute Function
The scope of the execute function is the scope of the execute function itself. It has no access to the Écoute instance, except for the data that will get exposed to it. To get access to the data from the sources, queries can be defined—the result of these queries will be variables containing the queried data.

The the following example will collect all the articles that has a title that starts with an "A" and expose it to the transformer in a variable called `bananas`.

    function Transformer () {
        // Defines a Pursuit query that fetches all the data that has
        // a key called `title` and the value containes the word
        // 'bananas'.
        this.queries = {
            bananas: {
                title: {
                    contains: 'bananas'
                }
            }
        };
    }

    Transformer.prototype.execute = function (done) {
        // the result of the query is stored in the variable 'bananas'
        console.log(this.bananas);

        return done();
    }

    module.exports = function () {
        return (new Transformer());
    };

The queries are build using the [Pursuit][pursuit]-library. Have a look in the Pursuit documentation for information about building queries.

[pursuit]: https://github.com/gausby/pursuit

**Notice**, `outputs`, `queries`, `preprocessors`, and `postprocessors` are reserved keywords, and should not be used to store results of queries.
