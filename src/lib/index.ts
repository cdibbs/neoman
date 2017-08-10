import { containerBuilder } from './di/container';
import TYPES from './di/types';
import { IKernel } from './i/i-kernel';

containerBuilder()
    .get<IKernel>(TYPES.Kernel)
    .Go();