export namespace curry {    
    /**
     * Make binding testable and type safe. Binds this obj + 1 param.
     * @param fn - function to curry
     * @param self - self to bind
     * @param a - parameter to bind
     */
    export function oneOf3<TThis, T1, T2, T3, T4>(
        fn: (a: T1, b: T2, c: T3) => T4,
        self: TThis,
        a: T1
    ): (a: T2, b: T3) => T4
    {
        return fn.bind(self, a);
    }

    export function twoOf3<TThis, T1, T2, T3, T4>(
        fn: (a: T1, b: T2, c: T3) => T4,
        self: TThis,
        a: T1,
        b: T2): (a: T3) => T4
    {
        return fn.bind(self, a, b);
    }

    export function twoOf4<TThis, T1, T2, T3, T4, T5>(
        fn: (a: T1, b: T2, c: T3, d: T4) => T5,
        self: TThis,
        a: T1,
        b: T2): (a: T3, b: T4) => T5
    {
        return fn.bind(self, a, b);
    }
}