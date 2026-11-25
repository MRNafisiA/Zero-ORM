import Decimal from 'decimal.js';
import { Query } from './entity';
import { resolveColumn } from './resolve';
import { Json, Schema, NullableType, TableBySchema } from './Table';
import {
    OperatorMap,
    JsonOperator,
    LikeOperator,
    ListOperator,
    NullOperator,
    OperatorCode,
    tagExpression,
    BetweenOperator,
    BooleanOperator,
    CompareOperator,
    ArithmeticOperator,
    JsonCompareOperator,
    ListWithSubQueryOperator
} from './keywords';

function arithmetic<const T extends undefined | null | number>(
    expressionA: T,
    operator: ArithmeticOperator,
    expressionB: T
): Extract<T, undefined | null> | (T extends number ? number : never);
function arithmetic<const T extends undefined | null | bigint>(
    expressionA: T,
    operator: ArithmeticOperator,
    expressionB: T
): Extract<T, undefined | null> | (T extends bigint ? bigint : never);
function arithmetic<const T extends undefined | null | Decimal>(
    expressionA: T,
    operator: ArithmeticOperator,
    expressionB: T
): Extract<T, undefined | null> | (T extends Decimal ? Decimal : never);
function arithmetic<const T extends undefined | null | number>(
    operator: ArithmeticOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends number ? number : never);
function arithmetic<const T extends undefined | null | bigint>(
    operator: ArithmeticOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends bigint ? bigint : never);
function arithmetic<const T extends undefined | null | Decimal>(
    operator: ArithmeticOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends Decimal ? Decimal : never);
function arithmetic(a: unknown, b: unknown, c: unknown) {
    return tagExpression(
        Array.isArray(b)
            ? [OperatorMap[a as ArithmeticOperator], b]
            : [OperatorMap[b as ArithmeticOperator], [a, c]]
    );
}

function json<
    const T extends undefined | Json,
    K extends undefined | null | number | string
>(
    expression: T,
    operator: '->',
    key: K,
    _?: never
):
    | (undefined extends K ? undefined : never)
    | (undefined extends T ? undefined : never)
    | (null extends K ? null : never)
    | (T extends Json ? Json : never);
function json<
    const T extends undefined | Json,
    K extends undefined | null | number | string
>(
    expression: T,
    operator: '-> Array',
    keys: K[],
    _?: never
):
    | (undefined extends K ? undefined : never)
    | (undefined extends T ? undefined : never)
    | (null extends K ? null : never)
    | (T extends Json ? Json : never);
function json<
    const T extends undefined | Json,
    K extends undefined | null | number | string,
    C extends undefined | string = undefined
>(
    expression: T,
    operator: '->>',
    key: K,
    cast?: C
):
    | (undefined extends K ? undefined : never)
    | (undefined extends T ? undefined : never)
    | (null extends K ? null : never)
    | (C extends string ? unknown : T extends Json ? string : never);
function json<
    const T extends undefined | Json,
    B extends undefined | null | string
>(
    expressionA: T,
    operator: 'j-',
    expressionB: B,
    _?: never
):
    | (undefined extends B ? undefined : never)
    | (null extends B ? null | Partial<T> : Partial<T>);
function json<
    const T extends undefined | null | Json,
    const B extends undefined | null | string
>(
    expressionA: T,
    operator: 'j- Array',
    expressionB: B[],
    _?: never
):
    | (undefined extends B ? undefined : never)
    | (null extends T ? null | Partial<T> : Partial<T>);
function json(
    a: unknown,
    operator: JsonOperator,
    b: unknown,
    c: unknown
): unknown {
    return tagExpression([OperatorMap[operator], a, b, c]);
}

// use "as" for casting, generic approach is not possible due to undefined arguments
const fun = (
    name: string,
    args: readonly unknown[],
    cast: string = ''
): unknown => tagExpression([OperatorCode.Function, name, args, cast]);

const cons = (
    name: string,
    args: readonly unknown[],
    cast: string = ''
): unknown => tagExpression([OperatorCode.Constructor, name, args, cast]);

const switchCase = <const W extends undefined | boolean, const T>(
    cases: {
        when: W;
        then: T;
    }[],
    otherwise?: T
): undefined extends W ? undefined | T : T =>
    tagExpression([
        OperatorCode.SwitchCase,
        cases.map(({ when, then }) => Object.freeze({ when, then })),
        otherwise
    ]) as unknown as T;

function concat<const T extends undefined | null | string>(
    ...expressions: T[]
): Extract<T, undefined | null> | (T extends string ? string : never);
function concat<const T extends undefined | null | Json>(
    ...expressions: T[]
): Extract<T, undefined | null> | (T extends Json ? Json : never);
function concat(...a: unknown[]) {
    return tagExpression([OperatorCode.Concat, a]);
}

const column = <S extends Schema, K extends keyof S & string>(
    table: TableBySchema<S>,
    column: K,
    full?: boolean,
    alias?: string
): NullableType<S[K]['narrowType'], S[K]['nullable']> =>
    tagExpression([
        OperatorCode.Column,
        resolveColumn(table, column, full, alias)
    ]) as NullableType<S[K]['narrowType'], S[K]['nullable']>;

const raw = <const T>(
    textOrGet:
        | string
        | ((paramsStart: number) => {
              expression: string;
              params: string[];
          })
): T => tagExpression([OperatorCode.Raw, textOrGet]) as unknown as T;

const ignore = <const T>(
    expression: T,
    otherwise: Exclude<T, undefined>
): Exclude<T, undefined> =>
    tagExpression([OperatorCode.Ignore, expression, otherwise]) as Exclude<
        T,
        undefined
    >;

const not = <const T extends undefined | null | boolean>(expression: T): T =>
    tagExpression([OperatorCode.Not, expression]) as unknown as T;

const and = <const T extends undefined | null | boolean>(
    ...expressions: T[]
): T => tagExpression([OperatorCode.And, expressions]) as unknown as T;

const or = <const T extends undefined | null | boolean>(
    ...expressions: T[]
): T => tagExpression([OperatorCode.Or, expressions]) as unknown as T;

function compare<const T>(
    expression: T,
    operator: null extends T ? NullOperator : never,
    _?: never,
    __?: never
): undefined extends T ? undefined | boolean : boolean;
function compare<const T extends undefined | null | boolean>(
    expression: T,
    operator: BooleanOperator,
    _?: never,
    __?: never
): T;
function compare<const T extends undefined | null | number>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends number ? boolean : never);
function compare<const T extends undefined | null | bigint>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends bigint ? boolean : never);
function compare<const T extends undefined | null | Decimal>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends Decimal ? boolean : never);
function compare<const T extends undefined | null | string>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<const T extends undefined | null | Date>(
    expressionA: T,
    operator: CompareOperator,
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends Date ? boolean : never);
function compare<const T extends undefined | null | number>(
    expressionA: T,
    operator: ListOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends number ? boolean : never);
function compare<const T extends undefined | null | bigint>(
    expressionA: T,
    operator: ListOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends bigint ? boolean : never);
function compare<const T extends undefined | null | Decimal>(
    expressionA: T,
    operator: ListOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends Decimal ? boolean : never);
function compare<const T extends undefined | null | string>(
    expressionA: T,
    operator: ListOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<const T extends undefined | null | Date>(
    expressionA: T,
    operator: ListOperator,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends Date ? boolean : never);
function compare<
    const T extends undefined | null | number | bigint | Decimal | string | Date
>(
    expressionA: T,
    operator: ListWithSubQueryOperator,
    subQuery: Query<Schema, never>,
    _?: never
):
    | Extract<T, undefined | null>
    | (T extends number | bigint | Decimal | string | Date ? boolean : never);
function compare<const T extends undefined | null | string>(
    expressionA: T,
    operator: 'like',
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<const T extends undefined | null | string>(
    expressionA: T,
    operator: Exclude<LikeOperator, 'like'>,
    expressions: T[],
    _?: never
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<const T extends undefined | null | number>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends number ? boolean : never);
function compare<const T extends undefined | null | bigint>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends bigint ? boolean : never);
function compare<const T extends undefined | null | Decimal>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends Decimal ? boolean : never);
function compare<const T extends undefined | null | string>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends string ? boolean : never);
function compare<const T extends undefined | null | Date>(
    expression: T,
    operator: BetweenOperator,
    expressionStart: T,
    expressionEnd: T
): Extract<T, undefined | null> | (T extends Date ? boolean : never);
function compare<const T extends undefined | null | Json>(
    expressionA: T,
    operator: '=' | '!=' | '@>' | '<@',
    expressionB: T,
    _?: never
): Extract<T, undefined | null> | (T extends Json ? boolean : never);
function compare<
    const T extends undefined | null | Json,
    const B extends undefined | null | string
>(
    expressionA: T,
    operator: '?',
    expressionB: B,
    _?: never
):
    | Extract<T, undefined | null>
    | Extract<B, undefined | null>
    | (T extends Json ? (B extends string ? boolean : never) : never);
function compare<
    const T extends undefined | null | Json,
    const B extends undefined | null | string
>(
    expressionA: T,
    operator: '?&' | '?|',
    expressions: B[],
    _?: never
):
    | Extract<T, undefined | null>
    | Extract<B, undefined | null>
    | (T extends Json ? (B extends string ? boolean : never) : never);
function compare<const T extends undefined | null | Json>(
    expressionA: T,
    operator: '@@',
    expressions: string,
    _?: never
): Extract<T, undefined | null> | (T extends Json ? boolean : never);
function compare(
    a: unknown,
    operator:
        | NullOperator
        | BooleanOperator
        | CompareOperator
        | ListOperator
        | ListWithSubQueryOperator
        | LikeOperator
        | BetweenOperator
        | JsonCompareOperator,
    b: unknown,
    c: unknown
): unknown {
    return tagExpression([OperatorMap[operator], a, b, c]);
}

const subQuery = <T>(query: Query<Schema, never>): T =>
    tagExpression([OperatorCode.SubQuery, query]) as T;

const subQueryExist = (query: Query<Schema, never>): boolean =>
    tagExpression([OperatorCode.SubQueryExist, query]) as unknown as boolean;

// SQL string literal; doubling single quotes is enough with standard_conforming_strings (the default since PG 9.1).
const quote = (text: string) => `'${text.replace(/'/g, "''")}'`;

const stringify = (value: unknown, inline = false): string => {
    switch (typeof value) {
        case 'boolean':
            return value ? 'TRUE' : 'FALSE';
        case 'number':
            // NaN, Infinity and -Infinity are only valid in SQL as quoted literals.
            return inline && !Number.isFinite(value)
                ? quote(`${value}`)
                : `${value}`;
        case 'bigint':
            return `${value}`;
        case 'string':
            return inline ? quote(value) : value;
        case 'object':
            if (value === null) {
                return 'NULL';
            }
            if (Decimal.isDecimal(value)) {
                return inline ? quote(`${value}`) : `${value}`;
            }
            if (value instanceof Date) {
                return inline
                    ? quote(value.toISOString())
                    : value.toISOString();
            }
            return inline
                ? `${quote(JSON.stringify(value))}::JSONB`
                : JSON.stringify(value);
        case 'undefined':
        case 'function':
        case 'symbol':
            throw `${String(value)} is not serializable`;
    }
};

export {
    arithmetic,
    json,
    fun,
    cons,
    switchCase,
    concat,
    column,
    raw,
    ignore,
    not,
    and,
    or,
    compare,
    subQuery,
    subQueryExist,
    stringify
};
