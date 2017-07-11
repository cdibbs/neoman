import { injectable, inject } from 'inversify';

import { EventEmitter, TemplateSearchEmitterType } from './emitters';
import TYPES from './di/types';
import KEYS from './settings-keys';
import * as i from './i';
import * as it from './i/template';
import { PLUGIN_PREFIX } from './constants';
let requireg = require('requireg');

@injectable()
export class TemplateValidator implements i.ITemplateValidator {
    dependenciesInstalled(tmpl: it.ITemplate): { [key: string]: boolean } {
        let configs: it.IConfigurations = tmpl.configurations;
        let installed: { [key: string]: boolean } = {};
        for(var key in configs) {
            let config: it.IConfiguration = configs[key];
            let fullname: string = PLUGIN_PREFIX + config.plugin;
            try {
                requireg.resolve(PLUGIN_PREFIX + config.plugin);
                installed[fullname] = true;
            } catch (err) {
                console.log(err);
                installed[fullname] = false;
            }
        }

        return installed;
    }
}