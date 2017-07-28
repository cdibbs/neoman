import * as i from '../lib/i';

export let mockPathFactory = () => {
    let sep = "/";
    return <i.IPath> {
        sep: sep,
        join: (...args: any[]) => args.join(sep),
        dirname: (...args: any[]) => "",
        resolve: () => ""
    };
}