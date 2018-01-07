function upper(original, replacement, transformDef) {
    return (replacement || original).toString().toUpperCase();
}

module.exports = upper;