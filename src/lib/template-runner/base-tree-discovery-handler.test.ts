import { Test, TestFixture, AsyncTest, TestCase, TestCases, AsyncSetup, AsyncTeardown, Teardown, Setup } from 'alsatian';
import { Mock, IMock, It, Times } from 'typemoq';

import { BaseTreeDiscoveryHandler } from './base-tree-discovery-handler';
import { Verbosity } from '../types/verbosity';
import { IPathTransform, ITransform } from "../i/template/";
import { ITemplateFile } from "../i";

export class BaseTreeDiscoveryHandlerTest {

}

class TestTreeDiscoveryHandler extends BaseTreeDiscoveryHandler {
    protected matchTmplFile(path: string, pathTransforms: string | IPathTransform | (string | IPathTransform)[], transforms: string | ITransform | (string | ITransform)[], verbosity: Verbosity, tmplFile: ITemplateFile): void {
        throw new Error("Test this within concrete implementation class tests, not here.");
    }
    
}