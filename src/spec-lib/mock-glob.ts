import { IGlob } from '../lib/i';

export let mockGlobFactory = () => {
    return <IGlob> {
        Glob: {
            on: (et: string, fn: (...args: any[]) => void) => {}
        }
    };
};