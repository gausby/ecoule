# Écoute - A Static Page Generator-Engine
Écoute is a static page generator engine, written in JavaScript, that runs in a server side javascript-environment. It collects data from one or more sources, processes it and output it to one or more outputs.

It can, amongst other things, be used to build static blog generators.


## Life Cycle
An Ecoute life cycle begins with reading a configuration object passed to its constructor. A configuration object can be empty, but the Ecoute instance will do nothing in that case.

    var myEcoute = new Ecoute();

This is interesting enough in itself, but to make it do something we should really pass in a configuration. *Read more about the configuration-object in the Écoute Configuration Object-section.*

When the the `refresh`-function is called on the Écoute-instance, it will proceed to **the initialization stage**, where all the plugins that implements an initialize function will initialize.

During the initialization stage a plugin can stop the entire Écoute instance from running—this is useful if an output needs to communicate with a database, and no database is writable; or a source needs to fetch data from the internet, but no internet connection is available; or a template system fails to compile a template, etc.

If everything has been initialized without errors it will proceed to **the data collecting stage**. Every source will run their data collection function and return a list of objects that Écoute will store internally.

After the data has been collected **the data refinement stage** begins. Each collected data-element will get passed to the configured *data handlers*. If the configured match-function on a data handler passes on a given data-object, it will run its processor on the data-object, adding extra data values to, or altering existing data, on the data-object—*note that multiple data handlers can write, and thus overwrite, data on the same object.*

After this stage the data should be ready for **the transformation stage.** Each transformer will query the internal data-object store, use this data to create an output—such as an ebook, a website, etc.

Each transformer can be configured with one or more outputs, and the transformer will pass its output to each of the output that it has been assigned in the configuration. During **the output stage** the result of the transformer could be written to a disk; passed to another program; etc.

If the `refresh`-function on the Écoute-instance was called with a callback function, it will get call now. The callback should at least handle errors. This should be it. The `refresh`-function can be kept alive and called again, or it can be terminated.


## Écoute Configuration Object
Ecoute is essentially a workflow that goes though a couple of steps and results in one or more outputs. Each step in this workflow should be easy to customize, and this should be done though plugins passed to the configuration object given to the Ecoute instance.

An example of an Ecoute configuration could be as the following.

    var Ecoute = require('ecoute'),
        fileSystem = require('./ecoute-source-filesystem'),
        markdownDataHandler = require('./ecoute-data-handler-md'),
        htmlOutput = require('./ecoute-output-html')
    ;

    var blog = new Ecoute({
        'sources': [
            fileSystem({
                /* configuration */
            })
        ],
        'data-handlers': [
            markdownDataHandler({
                /* configuration */
            })
        ],
        'transformers': [
            htmlOutput({
                /* configuration */
            })
        ]
    });


### Data Sources
A Data Source is responsible for getting data into the system. This can be from any imaginable data source, such as, but not limited to, databases, CSV-files, a file system, or an output from some third-party API—the only requirement is that the source shall convert this data into a list of objects and return this data.

Consult the document [Building an Écoute Data Source](documentation/building-an-ecoute-data-source.md) for info on building a data source of your own.


### Data Handlers
Data handlers will iterate the list of returned data from the sources, and refine the data if the given data-object matches a given rule.

Consult the document [Building an Écoute Data Handler](documentation/building-an-ecoute-data-handler.md) for info on building a data handler of your own.


### Transformers
A transformer queries the data sources and transforms the data into the an output format, such as, but not limited to; EPUB; a website; a configuration-file; etc.

Consult the document [Building an Écoute Transformer](documentation/building-an-ecoute-transformer.md) for info on building a transformer of your own.


### Outputters
One or more outputters are given to a transformer, and they will receive the output from the transformer. Their task include, but are not limited to, writing the data to a disk; sending it to a destination on a network; or something third.

Consult the document [Building an Écoute Output](documentation/building-an-ecoute-output.md) for info on building a data handler of your own.


## Development
After cloning the project you will have to run `npm install` in the project root. This will install the various grunt plugins and other dependencies.


### QA tools
The QA tools rely on the [Grunt](http://gruntjs.com) task runner. To run any of these tools, you will need the grunt-cli installed globally on your system. This is easily done by typing the following in a terminal.

    $ npm install grunt-cli -g

The unit tests will need the [Buster](http://busterjs.org/) unit test framework.

    $ npm install -g buster

These two commands will install the buster and grunt commands on your system. These can be removed by typing `npm uninstall buster -g` and `npm uninstall grunt-cli -g`.


#### Unit Tests
When developing you want to run the script watcher. Navigate to the project root and type the following in your terminal.

    $ grunt watch:scripts

This will run the jshint and tests each time a file has been modified.


#### Documentation
The project uses YUIDocs that can be generated by running `grunt docs`. This will create a site with documentation in a folder called `docs/` in the project root which can be served on port 8888 by typing `grunt connect:docs`. If you want to generate docs on file modification you can run `grunt watch:docs`.


## License
The MIT License (MIT)

Copyright (c) 2013 Martin Gausby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.