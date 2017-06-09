import container from './di/container';
import TYPES from './di/types';
import { IKernel } from './i/i-kernel';

container
    .get<IKernel>(TYPES.Kernel)
    .Go();