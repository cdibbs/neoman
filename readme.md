[![npm version](https://badge.fury.io/js/neoman.svg)](https://badge.fury.io/js/neoman)
[![Build Status](https://travis-ci.org/cdibbs/neoman.svg?branch=master)](https://travis-ci.org/cdibbs/neoman)
[![dependencies Status](https://david-dm.org/cdibbs/neoman/status.svg)](https://david-dm.org/cdibbs/neoman)
[![devDependencies Status](https://david-dm.org/cdibbs/neoman/dev-status.svg)](https://david-dm.org/cdibbs/neoman?type=dev)
[![codecov](https://codecov.io/gh/cdibbs/neoman/branch/master/graph/badge.svg)](https://codecov.io/gh/cdibbs/neoman)

# Neoman Template Manager

**neoman** - _Old Saxon_. None, nobody.

A template manager that intends to be _nobody_ and _nothing_; it doesn't want to impose. Neoman knows that your code shouldn't have to become a template, _because it already is one._ :relieved:

## Basic Usage

Drop the following folder and file into your project, and Neoman will have all it needs.

`MyProject/.template.config/template.json`

A minimal `template.json` would look like this:

```json
{
    "name": "My Project Template",
    "description": "My useful project template will lead many to triumph.",
    "author": "Noh Body",
    "url": "https://en.wikipedia.org/wiki/Outis",
    "identity": "myprojtmp",

    "inputConfig": {
        "defaultInterface": "prompt",
        "define": {
            "namespace": "What will the root namespace of your project be?"
        }
    },

    "transform": [
        { "subject": "my.project.namespace", "with": "{{namespace}}" }
    ],

    "#": "You don't need 'files' if you want the 'transform' and 'transformFiles' sections to apply to all files",
    "files": ["**/*.ts"]
}
```

## Documentation

For documentation, please refer to [the wiki](https://github.com/cdibbs/neoman/wiki).

## Building

To build and run Neoman from source, clone the repository and, from its directory, run:

```
npm install
npm run build
npm link
neoman
```


## Authors

1. [Chris Dibbern](://github.com/cdibbs)
