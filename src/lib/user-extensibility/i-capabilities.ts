export interface ICapabilities {
    /** A semver.org semantic version string. Represents minimum version requirements. */
    version: string;

    /** A list of identifiers for required plugins. */
    plugins: string[];
}