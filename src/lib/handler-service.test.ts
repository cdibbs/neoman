import { Setup, Test, TestFixture } from 'alsatian';
import { Assert } from 'alsatian-fluent-assertions';
import { FilePatterns } from './file-patterns';
import { HandlerService } from './handler-service';
import { IMock, Mock } from 'typemoq';
import { IPath } from './i';
import { UserMessager } from './integrations';
import { mockMessagerFactory } from '../spec-lib';


@TestFixture("Handler Service tests")
export class HandlerServiceTests {
    hs: HandlerService;
    pathMock: IMock<IPath>;
    msgr: UserMessager;

    @Setup
    public beforeEach() {
        this.pathMock = Mock.ofType<IPath>();
        this.msgr = mockMessagerFactory();
        this.hs = new HandlerService(this.pathMock.object, this.msgr);
    }

    @Test("incomplete test")
    public placeholder() {
    }
}