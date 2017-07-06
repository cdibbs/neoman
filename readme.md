# Neoman Template Manager
neoman - _Old Saxon_. None, nobody.

A template manager that intends to be _nobody_ and _nothing_; it does not want to impose on your code. Neoman knows that your code shouldn't have to become a template, _because it already is one._ :relieved:

## Basic Usage

Drop a single, unobtrusive folder into your project, and Neoman will have all it needs.

`MyProject/.template.config/template.json`

A minimal `template.json` would look like this:

```json
{
    "name": "My Project",
    "description": "My useful project will lead many to triumph.",
    "author": "Noh Body",
    "url": "https://en.wikipedia.org/wiki/Outis",
    "identity": "myproj",

    "inputConfig": {
        "defaultInterface": "prompt",
        "define": {
            "namespace": "What will the root namespace of your project be?"
        }
    },

    "replace": [
        { "replace": "my.project.namespace", "with": "{{namespace}}" }
    ],

    "#": "Really, you don't need 'files' if you want the 'replace' section to apply to all files",
    "files": ["**/*.ts"]
}
```

## Documentation

For documentation, please refer to [the wiki](https://github.com/cdibbs/neoman/wiki).

## Building

To build and run Neoman from source, clone the repository and, from its directory, run:

```
npm run build
npm link
neoman
```


## Authors

1. [Chris Dibbern](://github.com/cdibbs)
