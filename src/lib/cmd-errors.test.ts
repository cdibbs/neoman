import { Test, TestFixture, AsyncTest, TestCase, TestCases, AsyncSetup, AsyncTeardown, Expect, Teardown, Setup } from 'alsatian';
import * as c from 'commandpost';

import { cmdErrors } from './cmd-errors';

@TestFixture("CmdErrors Dictionary Tests")
export class CmdErrorsTests {

    @TestCases(cpErrorGen())
    @Test("should not throw for any commandpost errors.")
    noErrorsEver(err: c.ErrorReason) {
        Expect(err in cmdErrors).toBe(true);
        Expect(() => cmdErrors[err](null)).not.toThrow();
        Expect(() => cmdErrors[err](<any>{})).not.toThrow();
        Expect(() => cmdErrors[err](<any>{ params: null })).not.toThrow();
        Expect(() => cmdErrors[err](<any>{ params: { parts: null } })).not.toThrow();
        Expect(() => cmdErrors[err](<any>{ params: { parts: [ "whoa" ] } })).not.toThrow();
    }
}

function* cpErrorGen(): IterableIterator<[c.ErrorReason]> {
    for (let e in c.ErrorReason) {
        yield [<c.ErrorReason>c.ErrorReason[e]];
    }
}